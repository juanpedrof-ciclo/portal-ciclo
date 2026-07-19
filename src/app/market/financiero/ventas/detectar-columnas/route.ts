import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseArchivoPedidos } from "@/lib/financiero/parse-pedidos";
import type { FormatoCarga, MapeoColumnas } from "@/lib/financiero/types";

function encabezadosCalzan(mapeo: MapeoColumnas, encabezados: string[]): boolean {
  const set = new Set(encabezados);
  const columnas = Object.values(mapeo).filter(
    (valor): valor is string => typeof valor === "string" && valor.length > 0,
  );
  return columnas.length > 0 && columnas.every((columna) => set.has(columna));
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("archivo");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Archivo no recibido" }, { status: 400 });
  }

  try {
    const buffer = await file.arrayBuffer();
    const { encabezados, filas } = await parseArchivoPedidos(buffer, file.name);
    if (encabezados.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron columnas en el archivo." },
        { status: 422 },
      );
    }

    const { data: formatos } = await supabase
      .from("formatos_carga")
      .select("*")
      .returns<FormatoCarga[]>();

    const sugerencia =
      (formatos ?? []).find((f) => encabezadosCalzan(f.mapeo_columnas, encabezados)) ??
      null;

    return NextResponse.json({
      encabezados,
      totalFilas: filas.length,
      sugerencia: sugerencia
        ? { id: sugerencia.id, nombre: sugerencia.nombre, mapeo: sugerencia.mapeo_columnas }
        : null,
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo leer el archivo. ¿Es un Excel (.xlsx) o CSV válido?" },
      { status: 422 },
    );
  }
}
