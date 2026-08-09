import { createClient } from "@/lib/supabase/server";
import { IngresoForm } from "./ingreso-form";
import { anularIngreso, anularIngresosLote } from "./actions";
import { AnularForm } from "@/components/anular-form";
import { SeleccionProvider } from "@/components/seleccion-provider";
import { CheckboxFila, CheckboxTodo } from "@/components/checkbox-seleccion";
import { AnularSeleccionadosBar } from "@/components/anular-seleccionados-bar";
import { ListaBuscador } from "@/components/lista-buscador";
import { ListaPaginacion } from "@/components/lista-paginacion";
import { ThOrdenable } from "@/components/lista-th-ordenable";
import { normalizarListaParams, patronIlike } from "@/lib/financiero/list-query";
import type { IngresoSemanal } from "@/lib/financiero/types";
import {
  CANAL_LABELS,
  ORIGEN_INGRESO_LABELS,
  formatCOP,
  formatFechaCorta,
} from "@/lib/financiero/types";

export const metadata = { title: "Ingresos · Módulo Financiero · Ciclo Market" };

const RUTA = "/market/financiero/ingresos";
const COLUMNAS_ORDEN = ["fecha", "canal", "monto_total"] as const;

export default async function IngresosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; sort?: string; dir?: string }>;
}) {
  const { page, sort, dir, q, desde, hasta, paramsBase } = normalizarListaParams(
    await searchParams,
    { columnas: COLUMNAS_ORDEN, ordenPorDefecto: "fecha" },
  );

  const supabase = await createClient();
  let query = supabase
    .from("ingresos_semanales")
    .select("*", { count: "exact" })
    .eq("anulado", false);
  if (q) {
    query = query.ilike("notas", patronIlike(q));
  }
  const { data: ingresos, count } = await query
    .order(sort, { ascending: dir === "asc" })
    .range(desde, hasta)
    .returns<IngresoSemanal[]>();

  const idsVisibles = (ingresos ?? []).map((i) => i.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Ingresos
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Venta total por fecha, a mano o tomada de un Excel.
        </p>
      </div>

      <IngresoForm />

      <ListaBuscador
        basePath={RUTA}
        params={paramsBase}
        valorInicial={q}
        placeholder="Buscar por notas…"
      />

      <SeleccionProvider idsVisibles={idsVisibles}>
        <AnularSeleccionadosBar idsVisibles={idsVisibles} action={anularIngresosLote} />

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <CheckboxTodo ids={idsVisibles} />
                  </th>
                  <ThOrdenable basePath={RUTA} params={paramsBase} campo="fecha" label="Fecha" sortActual={sort} dirActual={dir} />
                  <ThOrdenable basePath={RUTA} params={paramsBase} campo="canal" label="Canal" sortActual={sort} dirActual={dir} />
                  <th className="px-4 py-3 font-medium">Origen</th>
                  <ThOrdenable basePath={RUTA} params={paramsBase} campo="monto_total" label="Monto total" sortActual={sort} dirActual={dir} align="right" />
                  <th className="px-4 py-3 font-medium">Notas</th>
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {!ingresos || ingresos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                      {q ? "No se encontraron ingresos para esa búsqueda." : "Aún no hay ingresos registrados."}
                    </td>
                  </tr>
                ) : (
                  ingresos.map((ingreso) => (
                    <tr key={ingreso.id}>
                      <td className="px-4 py-3">
                        <CheckboxFila id={ingreso.id} />
                      </td>
                      <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                        {formatFechaCorta(ingreso.fecha)}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                        {ingreso.canal ? CANAL_LABELS[ingreso.canal] : "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                        {ORIGEN_INGRESO_LABELS[ingreso.origen]}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-zinc-100">
                        {formatCOP(ingreso.monto_total)}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                        {ingreso.notas ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <AnularForm
                          id={ingreso.id}
                          action={anularIngreso}
                          mensaje="¿Seguro que deseas anular este ingreso? Esta acción lo excluye de tus cálculos."
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <ListaPaginacion basePath={RUTA} params={paramsBase} page={page} total={count ?? 0} />
        </div>
      </SeleccionProvider>
    </div>
  );
}
