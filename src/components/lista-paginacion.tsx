import Link from "next/link";
import { TAMANO_PAGINA } from "@/lib/financiero/list-query";

function hrefPagina(basePath: string, params: Record<string, string>, page: number) {
  const sp = new URLSearchParams(params);
  sp.set("page", String(page));
  return `${basePath}?${sp.toString()}`;
}

/** Ventana de páginas a mostrar: 1 … actual-1 actual actual+1 … última */
function ventanaPaginas(page: number, totalPaginas: number): (number | "…")[] {
  const paginas = new Set<number>([1, totalPaginas, page - 1, page, page + 1]);
  const ordenadas = [...paginas].filter((p) => p >= 1 && p <= totalPaginas).sort((a, b) => a - b);

  const resultado: (number | "…")[] = [];
  let anterior = 0;
  for (const p of ordenadas) {
    if (anterior && p - anterior > 1) resultado.push("…");
    resultado.push(p);
    anterior = p;
  }
  return resultado;
}

export function ListaPaginacion({
  basePath,
  params,
  page,
  total,
}: {
  basePath: string;
  params: Record<string, string>;
  page: number;
  total: number;
}) {
  const totalPaginas = Math.max(1, Math.ceil(total / TAMANO_PAGINA));
  if (total === 0) return null;

  const desde = (page - 1) * TAMANO_PAGINA + 1;
  const hasta = Math.min(page * TAMANO_PAGINA, total);

  const linkClass =
    "inline-flex min-w-8 items-center justify-center rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm text-zinc-600 transition hover:border-amber-500 hover:text-amber-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-amber-500 dark:hover:text-amber-400";
  const linkActivoClass =
    "inline-flex min-w-8 items-center justify-center rounded-lg border border-amber-600 bg-amber-600 px-2.5 py-1.5 text-sm font-medium text-white";
  const linkDeshabilitadoClass =
    "inline-flex min-w-8 items-center justify-center rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm text-zinc-300 dark:border-zinc-800 dark:text-zinc-700";

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-zinc-200 px-4 py-3 sm:flex-row dark:border-zinc-800">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Mostrando {desde}–{hasta} de {total}
      </p>
      <div className="flex items-center gap-1.5">
        {page <= 1 ? (
          <span className={linkDeshabilitadoClass}>Anterior</span>
        ) : (
          <Link href={hrefPagina(basePath, params, page - 1)} className={linkClass}>
            Anterior
          </Link>
        )}

        {ventanaPaginas(page, totalPaginas).map((p, i) =>
          p === "…" ? (
            <span key={`e${i}`} className="px-1 text-sm text-zinc-400">
              …
            </span>
          ) : (
            <Link
              key={p}
              href={hrefPagina(basePath, params, p)}
              className={p === page ? linkActivoClass : linkClass}
            >
              {p}
            </Link>
          ),
        )}

        {page >= totalPaginas ? (
          <span className={linkDeshabilitadoClass}>Siguiente</span>
        ) : (
          <Link href={hrefPagina(basePath, params, page + 1)} className={linkClass}>
            Siguiente
          </Link>
        )}
      </div>
    </div>
  );
}
