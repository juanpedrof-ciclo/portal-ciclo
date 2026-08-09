import { createClient } from "@/lib/supabase/server";
import { ListaBuscador } from "@/components/lista-buscador";
import { ListaPaginacion } from "@/components/lista-paginacion";
import { ThOrdenable } from "@/components/lista-th-ordenable";
import { normalizarListaParams, patronIlike } from "@/lib/financiero/list-query";
import type { VistaIngresoSaldo } from "@/lib/financiero/types";
import { CANAL_LABELS, formatCOP, formatFechaCorta } from "@/lib/financiero/types";

export const metadata = { title: "Cuentas por cobrar · Módulo Financiero · Ciclo Market" };

const RUTA = "/market/financiero/resultados/cuentas-por-cobrar";
const COLUMNAS_ORDEN = ["fecha", "canal", "saldo_pendiente", "dias_mora"] as const;

export default async function CuentasPorCobrarPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; sort?: string; dir?: string }>;
}) {
  const { page, sort, dir, q, desde, hasta, paramsBase } = normalizarListaParams(
    await searchParams,
    { columnas: COLUMNAS_ORDEN, ordenPorDefecto: "dias_mora" },
  );

  const supabase = await createClient();
  let query = supabase
    .from("vista_ingresos_saldo")
    .select("*", { count: "exact" })
    .gt("saldo_pendiente", 0);
  let queryTotal = supabase
    .from("vista_ingresos_saldo")
    .select("saldo_pendiente")
    .gt("saldo_pendiente", 0);
  if (q) {
    const patron = patronIlike(q);
    query = query.ilike("notas", patron);
    queryTotal = queryTotal.ilike("notas", patron);
  }

  const [{ data: ingresos, count }, { data: filasTotal }] = await Promise.all([
    query
      .order(sort, { ascending: dir === "asc" })
      .range(desde, hasta)
      .returns<VistaIngresoSaldo[]>(),
    queryTotal.returns<Pick<VistaIngresoSaldo, "saldo_pendiente">[]>(),
  ]);

  const total = (filasTotal ?? []).reduce((sum, i) => sum + i.saldo_pendiente, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Ventas sin cobro cruzado (total o parcial).
        </p>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Total: {formatCOP(total)}
        </p>
      </div>

      <ListaBuscador
        basePath={RUTA}
        params={paramsBase}
        valorInicial={q}
        placeholder="Buscar por notas…"
      />

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <tr>
                <ThOrdenable basePath={RUTA} params={paramsBase} campo="fecha" label="Fecha" sortActual={sort} dirActual={dir} />
                <ThOrdenable basePath={RUTA} params={paramsBase} campo="canal" label="Canal" sortActual={sort} dirActual={dir} />
                <ThOrdenable basePath={RUTA} params={paramsBase} campo="saldo_pendiente" label="Saldo" sortActual={sort} dirActual={dir} align="right" />
                <ThOrdenable basePath={RUTA} params={paramsBase} campo="dias_mora" label="Días de mora" sortActual={sort} dirActual={dir} align="right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {!ingresos || ingresos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                    {q ? "No se encontraron cuentas por cobrar para esa búsqueda." : "No hay cuentas por cobrar pendientes."}
                  </td>
                </tr>
              ) : (
                ingresos.map((i) => (
                  <tr key={i.id}>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                      {formatFechaCorta(i.fecha)}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                      {i.canal ? CANAL_LABELS[i.canal] : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-zinc-100">
                      {formatCOP(i.saldo_pendiente)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-medium ${
                        i.dias_mora > 30
                          ? "text-red-600 dark:text-red-400"
                          : "text-zinc-600 dark:text-zinc-300"
                      }`}
                    >
                      {i.dias_mora}
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
