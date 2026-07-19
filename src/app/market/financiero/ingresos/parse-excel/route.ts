import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractTotalFromBuffer } from "@/lib/financiero/parse-excel-total";

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
    const total = await extractTotalFromBuffer(buffer);
    if (!total) {
      return NextResponse.json(
        { error: "No se encontró ningún valor numérico en el archivo." },
        { status: 422 },
      );
    }
    return NextResponse.json(total);
  } catch {
    return NextResponse.json(
      { error: "No se pudo leer el archivo. ¿Es un Excel válido (.xlsx)?" },
      { status: 422 },
    );
  }
}
