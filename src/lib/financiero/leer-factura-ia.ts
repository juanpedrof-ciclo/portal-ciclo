import Anthropic from "@anthropic-ai/sdk";

const MODELO = "claude-haiku-4-5";
const TAMANO_MAXIMO_BYTES = 15 * 1024 * 1024;

// PDFs de texto: solo necesitamos las primeras páginas para proveedor/fecha/monto/folio.
const PAGINAS_A_LEER = 2;
// Si el texto extraído es más corto que esto, asumimos que es un PDF escaneado
// (sin capa de texto) y caemos al envío del documento como imagen.
const MIN_CARACTERES_TEXTO_UTIL = 80;
// Cota de seguridad para no mandar un PDF entero de texto gigante al modelo.
const MAX_CARACTERES_TEXTO = 12000;

export type DatosFacturaExtraidos = {
  proveedor: string | null;
  fecha: string | null;
  monto: number | null;
  numero_factura: string | null;
};

const ESQUEMA_FACTURA = {
  type: "object",
  properties: {
    proveedor: {
      anyOf: [{ type: "string" }, { type: "null" }],
      description: "Nombre del proveedor o emisor de la factura, tal como aparece impreso.",
    },
    fecha: {
      anyOf: [{ type: "string" }, { type: "null" }],
      description: "Fecha de la factura en formato YYYY-MM-DD.",
    },
    monto: {
      anyOf: [{ type: "number" }, { type: "null" }],
      description: "Monto total a pagar de la factura, solo el número, sin símbolos ni separadores de miles.",
    },
    numero_factura: {
      anyOf: [{ type: "string" }, { type: "null" }],
      description: "Número o folio de la factura.",
    },
  },
  required: ["proveedor", "fecha", "monto", "numero_factura"],
  additionalProperties: false,
} as const;

const INSTRUCCION =
  "Extrae de esta factura o comprobante de gasto: el proveedor (nombre del emisor), la fecha, el monto total a pagar y el número de factura o folio. Si algún dato no aparece o no puedes leerlo con certeza, usa null en ese campo.";

type BloqueContenido =
  | { type: "text"; text: string }
  | {
      type: "document";
      source: { type: "base64"; media_type: "application/pdf"; data: string };
    }
  | {
      type: "image";
      source: {
        type: "base64";
        media_type: "image/jpeg" | "image/png" | "image/webp";
        data: string;
      };
    };

/**
 * Intenta extraer la capa de texto de las primeras páginas de un PDF.
 * Devuelve null si el PDF no tiene texto útil (escaneado) o si falla la lectura,
 * para que el llamador caiga al envío del documento como imagen.
 */
async function extraerTextoPdf(buffer: ArrayBuffer): Promise<string | null> {
  try {
    // Import dinámico: unpdf (con pdf.js dentro) solo se carga la primera vez que
    // se lee un PDF, nunca al inicializar la función ni en otras rutas.
    const { extractText, getDocumentProxy } = await import("unpdf");
    // Copia defensiva: pdf.js puede "detachar" el ArrayBuffer que recibe, y
    // necesitamos el original intacto por si hay que caer al envío como documento.
    const pdf = await getDocumentProxy(new Uint8Array(buffer.slice(0)));
    const { text } = await extractText(pdf, { mergePages: false });
    const paginas = Array.isArray(text) ? text : [text];
    const texto = paginas
      .slice(0, PAGINAS_A_LEER)
      .join("\n\n")
      .replace(/[ \t]+\n/g, "\n")
      .trim();

    if (texto.replace(/\s/g, "").length < MIN_CARACTERES_TEXTO_UTIL) {
      return null;
    }
    return texto.slice(0, MAX_CARACTERES_TEXTO);
  } catch {
    return null;
  }
}

function bloqueImagen(mediaType: string, base64: string): BloqueContenido | null {
  if (mediaType === "image/jpeg" || mediaType === "image/png" || mediaType === "image/webp") {
    return {
      type: "image",
      source: {
        type: "base64",
        media_type: mediaType as "image/jpeg" | "image/png" | "image/webp",
        data: base64,
      },
    };
  }
  return null;
}

async function construirContenido(
  file: File,
  buffer: ArrayBuffer,
): Promise<BloqueContenido[]> {
  if (file.type === "application/pdf") {
    const texto = await extraerTextoPdf(buffer);
    if (texto) {
      return [
        {
          type: "text",
          text: `${INSTRUCCION}\n\nContenido de la factura (texto extraído del PDF):\n\n${texto}`,
        },
      ];
    }
    // PDF sin capa de texto (escaneado): lo mandamos como documento.
    const base64 = Buffer.from(buffer).toString("base64");
    return [
      {
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: base64 },
      },
      { type: "text", text: INSTRUCCION },
    ];
  }

  const imagen = bloqueImagen(file.type, Buffer.from(buffer).toString("base64"));
  if (imagen) {
    return [imagen, { type: "text", text: INSTRUCCION }];
  }
  return [];
}

export async function leerFacturaConIA(file: File): Promise<DatosFacturaExtraidos> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("La lectura automática no está configurada (falta la API key de Anthropic).");
  }
  if (file.size > TAMANO_MAXIMO_BYTES) {
    throw new Error("El archivo es demasiado grande para la lectura automática (máx. 15MB).");
  }

  const buffer = await file.arrayBuffer();
  const contenido = await construirContenido(file, buffer);
  if (contenido.length === 0) {
    throw new Error("Formato no soportado para lectura automática (usa PDF, JPG, PNG o WEBP).");
  }

  // maxRetries bajo + timeout acotado: si Haiku está sobrecargado (429/529),
  // preferimos fallar rápido con un mensaje claro antes que colgar la petición.
  const client = new Anthropic({ maxRetries: 1, timeout: 45_000 });

  let respuesta;
  try {
    respuesta = await client.messages.create({
      model: MODELO,
      max_tokens: 1024,
      output_config: { format: { type: "json_schema", schema: ESQUEMA_FACTURA } },
      messages: [{ role: "user", content: contenido }],
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      throw new Error("La API key de Anthropic no es válida.");
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new Error("Se alcanzó el límite de solicitudes a la IA, intenta de nuevo en un momento.");
    }
    if (err instanceof Anthropic.APIConnectionTimeoutError) {
      throw new Error("La lectura automática tardó demasiado. Completa los datos manualmente.");
    }
    if (err instanceof Anthropic.APIConnectionError) {
      throw new Error("No se pudo conectar con el servicio de lectura automática.");
    }
    throw new Error("El servicio de lectura automática no respondió correctamente.");
  }

  if (respuesta.stop_reason === "refusal") {
    throw new Error("La IA no pudo procesar este archivo. Completa los datos manualmente.");
  }

  const bloqueTexto = respuesta.content.find((b) => b.type === "text");
  if (!bloqueTexto || bloqueTexto.type !== "text") {
    throw new Error("La lectura automática no devolvió datos.");
  }

  try {
    const datos = JSON.parse(bloqueTexto.text) as DatosFacturaExtraidos;
    return {
      proveedor: datos.proveedor ?? null,
      fecha: datos.fecha ?? null,
      monto: typeof datos.monto === "number" ? datos.monto : null,
      numero_factura: datos.numero_factura ?? null,
    };
  } catch {
    throw new Error("No se pudo interpretar la respuesta de la lectura automática.");
  }
}
