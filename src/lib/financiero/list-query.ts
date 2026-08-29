import type { SupabaseClient } from "@supabase/supabase-js";

export const TAMANO_PAGINA = 50;

export type DirOrden = "asc" | "desc";

export type ParamsListaCrudos = {
  page?: string;
  q?: string;
  sort?: string;
  dir?: string;
};

export type ListaNormalizada<C extends string> = {
  page: number;
  sort: C;
  dir: DirOrden;
  q: string;
  desde: number;
  hasta: number;
  /** Params activos (sin "page") para armar hrefs de búsqueda/orden. */
  paramsBase: Record<string, string>;
};

/**
 * Lee page/sort/dir/q desde searchParams y los valida contra un allowlist de
 * columnas ordenables por lista (evita pasar un `sort` arbitrario a
 * supabase.order()).
 */
export function normalizarListaParams<C extends string>(
  params: ParamsListaCrudos,
  opciones: { columnas: readonly C[]; ordenPorDefecto: C; dirPorDefecto?: DirOrden },
): ListaNormalizada<C> {
  const pageCruda = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(pageCruda) && pageCruda > 0 ? pageCruda : 1;

  const sort = opciones.columnas.includes(params.sort as C)
    ? (params.sort as C)
    : opciones.ordenPorDefecto;

  const dir: DirOrden =
    params.dir === "asc" || params.dir === "desc"
      ? params.dir
      : (opciones.dirPorDefecto ?? "desc");

  const q = (params.q ?? "").trim();

  const desde = (page - 1) * TAMANO_PAGINA;
  const hasta = desde + TAMANO_PAGINA - 1;

  const paramsBase: Record<string, string> = { sort, dir };
  if (q) paramsBase.q = q;

  return { page, sort, dir, q, desde, hasta, paramsBase };
}

/**
 * Limpia el término de búsqueda de caracteres que rompen la sintaxis de
 * filtros de PostgREST (usados por .or()) o que son comodines de ILIKE.
 */
export function sanitizarBusqueda(q: string): string {
  return q.replace(/[,()%_*"\\]/g, "").trim();
}

export function patronIlike(q: string): string {
  return `%${sanitizarBusqueda(q)}%`;
}

// Tope de FKs a expandir en un filtro `.in(...)` de búsqueda: una búsqueda por
// nombre real coincide con pocas filas; esto solo evita URLs enormes.
const MAX_IDS_BUSQUEDA = 200;

/**
 * IDs de una tabla de referencia (proveedores, clientes) cuyo `nombre` coincide
 * con la búsqueda. Sirve para traducir una búsqueda por nombre —columna
 * calculada en las vistas, sin índice— a un filtro por FK indexada de la tabla
 * base, y para contar sin tocar la vista con joins.
 */
export async function idsPorNombre(
  supabase: SupabaseClient,
  tabla: string,
  unidad: string,
  q: string,
): Promise<string[]> {
  const { data } = await supabase
    .from(tabla)
    .select("id")
    .eq("unidad", unidad)
    .ilike("nombre", patronIlike(q))
    .limit(MAX_IDS_BUSQUEDA);
  return (data ?? []).map((r) => (r as { id: string }).id);
}
