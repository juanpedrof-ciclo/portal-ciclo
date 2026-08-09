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
