import { createClient } from "@/lib/supabase/server";
import type { VistaIngresoSaldo } from "@/lib/financiero/types";
import { CANAL_LABELS, formatCOP, formatFechaCorta } from "@/lib/financiero/types";

export const metadata = { title: "Cuentas por cobrar · Módulo Financiero · Ciclo Market" };

export default async function CuentasPorCobrarPage() {
  const supabase = await createClient();
  const { data: ingresos } = await supabase
    .from("vista_ingresos_saldo")
    .select("*")
    .gt("saldo_pendiente", 0)
    .order("dias_mora", { ascending: false })
    .returns<VistaIngresoSaldo[]>();

  const total = (ingresos ?? []).reduce((sum, i) => sum + i.saldo_pendiente, 0);

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

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Canal</th>
              <th className="px-4 py-3 text-right font-medium">Saldo</th>
              <th className="px-4 py-3 text-right font-medium">Días de mora</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {!ingresos || ingresos.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                  No hay cuentas por cobrar pendientes.
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
    </div>
  );
}
