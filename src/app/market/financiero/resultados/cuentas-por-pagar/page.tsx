import { createClient } from "@/lib/supabase/server";
import { ListaBuscador } from "@/components/lista-buscador";
import { ListaPaginacion } from "@/components/lista-paginacion";
import { ThOrdenable } from "@/components/lista-th-ordenable";
import { normalizarListaParams, patronIlike } from "@/lib/financiero/list-query";
import type { VistaFacturaSaldo } from "@/lib/financiero/types";
import { formatCOP, formatFechaCorta } from "@/lib/financiero/types";

export const metadata = { title: "Cuentas por pagar · Módulo Financiero · Ciclo Market" };

const RUTA = "/market/financiero/resultados/cuentas-por-pagar";
const COLUMNAS_ORDEN = [
  "proveedor_nombre",
  "categoria_nombre",
  "fecha",
  "saldo_pendiente",
  "dias_transcurridos",
] as const;

export default async function CuentasPorPagarPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; sort?: string; dir?: string }>;
}) {
  const { page, sort, dir, q, desde, hasta, paramsBase } = normalizarListaParams(
    await searchParams,
    { columnas: COLUMNAS_ORDEN, ordenPorDefecto: "dias_transcurridos" },
  );

  const supabase = await createClient();
  let query = supabase
    .from("vista_facturas_saldo")
    .select("*", { count: "exact" })
    .gt("saldo_pendiente", 0);
  let queryTotal = supabase
    .from("vista_facturas_saldo")
    .select("saldo_pendiente")
    .gt("saldo_pendiente", 0);
  if (q) {
    const patron = patronIlike(q);
    const filtro = `proveedor_nombre.ilike.${patron},numero_factura.ilike.${patron}`;
    query = query.or(filtro);
    queryTotal = queryTotal.or(filtro);
  }

  const [{ data: facturas, count }, { data: filasTotal }] = await Promise.all([
    query
      .order(sort, { ascending: dir === "asc" })
      .range(desde, hasta)
      .returns<VistaFacturaSaldo[]>(),
    queryTotal.returns<Pick<VistaFacturaSaldo, "saldo_pendiente">[]>(),
  ]);

  const total = (filasTotal ?? []).reduce((sum, f) => sum + f.saldo_pendiente, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Facturas de proveedor sin pago cruzado (total o parcial).
        </p>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Total: {formatCOP(total)}
        </p>
      </div>

      <ListaBuscador
        basePath={RUTA}
        params={paramsBase}
        valorInicial={q}
        placeholder="Buscar por proveedor o nº de factura…"
      />

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <tr>
                <ThOrdenable basePath={RUTA} params={paramsBase} campo="proveedor_nombre" label="Proveedor" sortActual={sort} dirActual={dir} />
                <ThOrdenable basePath={RUTA} params={paramsBase} campo="categoria_nombre" label="Categoría" sortActual={sort} dirActual={dir} />
                <ThOrdenable basePath={RUTA} params={paramsBase} campo="fecha" label="Fecha" sortActual={sort} dirActual={dir} />
                <ThOrdenable basePath={RUTA} params={paramsBase} campo="saldo_pendiente" label="Saldo" sortActual={sort} dirActual={dir} align="right" />
                <ThOrdenable basePath={RUTA} params={paramsBase} campo="dias_transcurridos" label="Días transcurridos" sortActual={sort} dirActual={dir} align="right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {!facturas || facturas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                    {q ? "No se encontraron facturas para esa búsqueda." : "No hay cuentas por pagar pendientes."}
                  </td>
                </tr>
              ) : (
                facturas.map((f) => (
                  <tr key={f.id}>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                      {f.proveedor_nombre}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                      {f.categoria_nombre}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                      {formatFechaCorta(f.fecha)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-zinc-100">
                      {formatCOP(f.saldo_pendiente)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-medium ${
                        f.dias_transcurridos > 30
                          ? "text-red-600 dark:text-red-400"
                          : "text-zinc-600 dark:text-zinc-300"
                      }`}
                    >
                      {f.dias_transcurridos}
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
