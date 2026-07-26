import Anthropic from "@anthropic-ai/sdk";

const MODELO = "claude-haiku-4-5";
const TAMANO_MAXIMO_BYTES = 15 * 1024 * 1024;

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

function construirBloqueContenido(mediaType: string, base64: string) {
  if (mediaType === "application/pdf") {
    return {
      type: "document" as const,
      source: { type: "base64" as const, media_type: "application/pdf" as const, data: base64 },
    };
  }
  if (mediaType === "image/jpeg" || mediaType === "image/png" || mediaType === "image/webp") {
    return {
      type: "image" as const,
      source: {
        type: "base64" as const,
        media_type: mediaType as "image/jpeg" | "image/png" | "image/webp",
        data: base64,
      },
    };
  }
  return null;
}

export async function leerFacturaConIA(file: File): Promise<DatosFacturaExtraidos> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("La lectura automática no está configurada (falta la API key de Anthropic).");
  }
  if (file.size > TAMANO_MAXIMO_BYTES) {
    throw new Error("El archivo es demasiado grande para la lectura automática (máx. 15MB).");
  }

  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const bloque = construirBloqueContenido(file.type, base64);
  if (!bloque) {
    throw new Error("Formato no soportado para lectura automática (usa PDF, JPG, PNG o WEBP).");
  }

  const client = new Anthropic();

  let respuesta;
  try {
    respuesta = await client.messages.create({
      model: MODELO,
      max_tokens: 1024,
      output_config: { format: { type: "json_schema", schema: ESQUEMA_FACTURA } },
      messages: [
        {
          role: "user",
          content: [
            bloque,
            {
              type: "text",
              text: "Extrae de esta factura o comprobante de gasto: el proveedor (nombre del emisor), la fecha, el monto total a pagar y el número de factura o folio. Si algún dato no aparece o no puedes leerlo con certeza, usa null en ese campo.",
            },
          ],
        },
      ],
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      throw new Error("La API key de Anthropic no es válida.");
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new Error("Se alcanzó el límite de solicitudes a la IA, intenta de nuevo en un momento.");
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
