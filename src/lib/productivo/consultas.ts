import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnimalEstado, GrupoAnimal, GrupoAnimalId } from "./types";

export async function obtenerGrupos(
  supabase: SupabaseClient,
  opciones?: { soloActivos?: boolean },
): Promise<GrupoAnimal[]> {
  let query = supabase.from("grupos_animales").select("*").order("orden");
  if (opciones?.soloActivos) query = query.eq("activo", true);
  const { data } = await query.returns<GrupoAnimal[]>();
  return data ?? [];
}

export function agruparPorId(grupos: GrupoAnimal[]): Record<string, GrupoAnimal> {
  return Object.fromEntries(grupos.map((g) => [g.id, g]));
}

/** Animales activos de un grupo individual, ordenados por chapeta — para selectores. */
export async function obtenerAnimalesActivos(
  supabase: SupabaseClient,
  grupoId?: GrupoAnimalId,
): Promise<AnimalEstado[]> {
  let query = supabase
    .from("vista_animales_estado")
    .select("*")
    .eq("estado", "activo");
  if (grupoId) query = query.eq("grupo_id", grupoId);
  const { data } = await query
    .order("chapeta")
    .returns<AnimalEstado[]>();
  return data ?? [];
}

export async function obtenerAnimalPorId(
  supabase: SupabaseClient,
  id: string,
): Promise<AnimalEstado | null> {
  const { data } = await supabase
    .from("vista_animales_estado")
    .select("*")
    .eq("id", id)
    .returns<AnimalEstado[]>()
    .maybeSingle();
  return data ?? null;
}

/** Mapa id → chapeta/grupo de TODOS los animales (vivos o no) — para resolver
 * referencias en listas de historial sin depender de nombres de FK de Postgres. */
export async function obtenerMapaAnimales(
  supabase: SupabaseClient,
): Promise<Record<string, { chapeta: string; grupo_id: GrupoAnimalId }>> {
  const { data } = await supabase.from("animales").select("id, chapeta, grupo_id");
  return Object.fromEntries(
    (data ?? []).map((a) => [a.id, { chapeta: a.chapeta, grupo_id: a.grupo_id }]),
  );
}
