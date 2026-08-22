import type { SupabaseClient } from "@supabase/supabase-js";

/** Patrón "+ Nuevo…": inserta por nombre en un catálogo único(unidad, nombre);
 * si ya existe (choque de unicidad), devuelve el id existente en vez de fallar. */
async function obtenerOCrearPorNombre(
  supabase: SupabaseClient,
  tabla: string,
  nombre: string,
  etiqueta: string,
): Promise<string> {
  const nombreLimpio = nombre.trim();
  const { data: creado, error } = await supabase
    .from(tabla)
    .insert({ nombre: nombreLimpio })
    .select("id")
    .single();

  if (!error) return creado.id;

  if (error.code === "23505") {
    const { data: existente } = await supabase
      .from(tabla)
      .select("id")
      .eq("nombre", nombreLimpio)
      .single();
    if (existente) return existente.id;
  }

  throw new Error(`No se pudo crear ${etiqueta}: ${error.message}`);
}

export function obtenerOCrearReproductor(supabase: SupabaseClient, nombre: string) {
  return obtenerOCrearPorNombre(supabase, "reproductores", nombre, "el reproductor");
}

export function obtenerOCrearInsumoCategoria(supabase: SupabaseClient, nombre: string) {
  return obtenerOCrearPorNombre(supabase, "insumo_categorias", nombre, "la categoría");
}

export function obtenerOCrearTrabajador(supabase: SupabaseClient, nombre: string) {
  return obtenerOCrearPorNombre(supabase, "trabajadores", nombre, "el trabajador");
}

export function obtenerOCrearCriterioCalificacion(supabase: SupabaseClient, nombre: string) {
  return obtenerOCrearPorNombre(supabase, "criterios_calificacion", nombre, "el criterio");
}
