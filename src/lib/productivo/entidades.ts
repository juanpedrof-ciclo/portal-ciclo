import type { SupabaseClient } from "@supabase/supabase-js";

export async function obtenerOCrearReproductor(
  supabase: SupabaseClient,
  nombre: string,
): Promise<string> {
  const nombreLimpio = nombre.trim();
  const { data: creado, error } = await supabase
    .from("reproductores")
    .insert({ nombre: nombreLimpio })
    .select("id")
    .single();

  if (!error) return creado.id;

  if (error.code === "23505") {
    const { data: existente } = await supabase
      .from("reproductores")
      .select("id")
      .eq("nombre", nombreLimpio)
      .single();
    if (existente) return existente.id;
  }

  throw new Error(`No se pudo crear el reproductor: ${error.message}`);
}
