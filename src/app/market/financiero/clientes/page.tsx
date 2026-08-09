import Link from "next/link";
import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/server";
import { ListaBuscador } from "@/components/lista-buscador";
import { ListaPaginacion } from "@/components/lista-paginacion";
import { ThOrdenable } from "@/components/lista-th-ordenable";
import { normalizarListaParams, patronIlike } from "@/lib/financiero/list-query";
import type { Cliente } from "@/lib/financiero/types";
import { formatFechaCorta } from "@/lib/financiero/types";

export const metadata = { title: "Clientes · Módulo Financiero · Ciclo Market" };

const RUTA = "/market/financiero/clientes";
const COLUMNAS_ORDEN = ["nombre", "telefono", "created_at"] as const;

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; sort?: string; dir?: string }>;
}) {
  const { page, sort, dir, q, desde, hasta, paramsBase } = normalizarListaParams(
    await searchParams,
    { columnas: COLUMNAS_ORDEN, ordenPorDefecto: "nombre", dirPorDefecto: "asc" },
  );

  const supabase = await createClient();
  let query = supabase.from("clientes").select("*", { count: "exact" });
  if (q) {
    const patron = patronIlike(q);
    query = query.or(`nombre.ilike.${patron},telefono.ilike.${patron}`);
  }
  const { data: clientes, count } = await query
    .order(sort, { ascending: dir === "asc" })
    .range(desde, hasta)
    .returns<Cliente[]>();

  return (
    <div className="flex flex-col gap-4">
      <BackLink href="/market/financiero/ventas" label="Ventas" />

      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Clientes</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Se registran solos al cargar pedidos; identificados por nombre + teléfono.
        </p>
      </div>

      <ListaBuscador
        basePath={RUTA}
        params={paramsBase}
        valorInicial={q}
        placeholder="Buscar por nombre o teléfono…"
      />

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <tr>
                <ThOrdenable basePath={RUTA} params={paramsBase} campo="nombre" label="Nombre" sortActual={sort} dirActual={dir} />
                <ThOrdenable basePath={RUTA} params={paramsBase} campo="telefono" label="Teléfono" sortActual={sort} dirActual={dir} />
                <ThOrdenable basePath={RUTA} params={paramsBase} campo="created_at" label="Registrado" sortActual={sort} dirActual={dir} />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {!clientes || clientes.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                    {q ? "No se encontraron clientes para esa búsqueda." : "Aún no hay clientes registrados."}
                  </td>
                </tr>
              ) : (
                clientes.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                      <Link
                        href={`/market/financiero/resultados/cartera-clientes/${c.id}`}
                        className="font-medium text-amber-700 hover:underline dark:text-amber-400"
                      >
                        {c.nombre}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                      {c.telefono || "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                      {formatFechaCorta(c.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <ListaPaginacion basePath={RUTA} params={paramsBase} page={page} total={count ?? 0} />
      </div>
    </div>
  );
}
