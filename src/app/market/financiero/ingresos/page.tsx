import { createClient } from "@/lib/supabase/server";
import { IngresoForm } from "./ingreso-form";
import { anularIngreso } from "./actions";
import { AnularForm } from "@/components/anular-form";
import type { IngresoSemanal } from "@/lib/financiero/types";
import {
  CANAL_LABELS,
  ORIGEN_INGRESO_LABELS,
  formatCOP,
  formatFechaCorta,
} from "@/lib/financiero/types";

export const metadata = { title: "Ingresos · Módulo Financiero · Ciclo Market" };

export default async function IngresosPage() {
  const supabase = await createClient();
  const { data: ingresos } = await supabase
    .from("ingresos_semanales")
    .select("*")
    .eq("anulado", false)
    .order("fecha", { ascending: false })
    .limit(50)
    .returns<IngresoSemanal[]>();

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

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Canal</th>
              <th className="px-4 py-3 font-medium">Origen</th>
              <th className="px-4 py-3 text-right font-medium">Monto total</th>
              <th className="px-4 py-3 font-medium">Notas</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {!ingresos || ingresos.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                  Aún no hay ingresos registrados.
                </td>
              </tr>
            ) : (
              ingresos.map((ingreso) => (
                <tr key={ingreso.id}>
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
    </div>
  );
}
