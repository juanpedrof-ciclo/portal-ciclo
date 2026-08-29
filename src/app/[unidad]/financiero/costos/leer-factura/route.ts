import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { leerFacturaConIA } from "@/lib/financiero/leer-factura-ia";

// unpdf + SDK de Anthropic necesitan el runtime de Node.
export const runtime = "nodejs";
// Vercel Hobby permite hasta 60s por función; sin esto el corte es a los 10s.
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const formData = await request.formData();
  const archivo = formData.get("archivo");
  if (!(archivo instanceof File)) {
    return NextResponse.json({ error: "Archivo no recibido" }, { status: 400 });
  }

  try {
    const datos = await leerFacturaConIA(archivo);
    return NextResponse.json(datos);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "No se pudo leer la factura." },
      { status: 422 },
    );
  }
}
