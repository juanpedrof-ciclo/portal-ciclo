import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ListaBuscador } from "@/components/lista-buscador";
import { ListaPaginacion } from "@/components/lista-paginacion";
import { ThOrdenable } from "@/components/lista-th-ordenable";
import { normalizarListaParams, patronIlike } from "@/lib/financiero/list-query";
import type { Unidad, VistaCarteraCliente } from "@/lib/financiero/types";
import { formatCOP } from "@/lib/financiero/types";

export const metadata = { title: "Cartera por cliente · Módulo Financiero" };

const COLUMNAS_ORDEN = ["nombre", "pedidos_pendientes", "saldo_total", "dias_max_mora"] as const;

export default async function CarteraClientesPage({
  params,
  searchParams,
}: {
  params: Promise<{ unidad: string }>;
  searchParams: Promise<{ page?: string; q?: string; sort?: string; dir?: string }>;
}) {
  const { unidad } = (await params) as { unidad: Unidad };
  const RUTA = `/${unidad}/financiero/resultados/cartera-clientes`;
  const { page, sort, dir, q, desde, hasta, paramsBase } = normalizarListaParams(
    await searchParams,
    { columnas: COLUMNAS_ORDEN, ordenPorDefecto: "dias_max_mora" },
  );

  const supabase = await createClient();
  let query = supabase
    .from("vista_cartera_cliente")
    .select("*", { count: "exact" })
    .eq("unidad", unidad)
    .gt("saldo_total", 0);
  let queryTotal = supabase
    .from("vista_cartera_cliente")
    .select("saldo_total")
    .eq("unidad", unidad)
    .gt("saldo_total", 0);
  if (q) {
    const patron = patronIlike(q);
    const filtro = `nombre.ilike.${patron},telefono.ilike.${patron}`;
    query = query.or(filtro);
    queryTotal = queryTotal.or(filtro);
  }
  const [{ data: cartera, count }, { data: filasTotal }] = await Promise.all([
    query
      .order(sort, { ascending: dir === "asc", nullsFirst: false })
      .range(desde, hasta)
      .returns<VistaCarteraCliente[]>(),
    queryTotal.returns<Pick<VistaCarteraCliente, "saldo_total">[]>(),
  ]);

  const total = (filasTotal ?? []).reduce((sum, c) => sum + c.saldo_total, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Cuentas por cobrar de pedidos cargados por archivo, agrupadas por cliente.
        </p>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Total cartera: {formatCOP(total)}
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
                <ThOrdenable basePath={RUTA} params={paramsBase} campo="nombre" label="Cliente" sortActual={sort} dirActual={dir} />
                <th className="px-4 py-3 font-medium">Teléfono</th>
                <ThOrdenable basePath={RUTA} params={paramsBase} campo="pedidos_pendientes" label="Pedidos pendientes" sortActual={sort} dirActual={dir} align="right" />
                <ThOrdenable basePath={RUTA} params={paramsBase} campo="saldo_total" label="Saldo" sortActual={sort} dirActual={dir} align="right" />
                <ThOrdenable basePath={RUTA} params={paramsBase} campo="dias_max_mora" label="Días de mora" sortActual={sort} dirActual={dir} align="right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {!cartera || cartera.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                    {q ? "No se encontraron clientes para esa búsqueda." : "No hay cartera pendiente por cliente."}
                  </td>
                </tr>
              ) : (
                cartera.map((c) => (
                  <tr key={c.cliente_id}>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                      <Link
                        href={`/${unidad}/financiero/resultados/cartera-clientes/${c.cliente_id}`}
                        className="font-medium text-amber-700 hover:underline dark:text-amber-400"
                      >
                        {c.nombre}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                      {c.telefono || "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-300">
                      {c.pedidos_pendientes}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-zinc-100">
                      {formatCOP(c.saldo_total)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-medium ${
                        (c.dias_max_mora ?? 0) > 30
                          ? "text-red-600 dark:text-red-400"
                          : "text-zinc-600 dark:text-zinc-300"
                      }`}
                    >
                      {c.dias_max_mora ?? "—"}
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
