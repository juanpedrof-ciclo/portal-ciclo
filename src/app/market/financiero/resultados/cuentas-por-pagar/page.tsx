import { createClient } from "@/lib/supabase/server";
import type { VistaFacturaSaldo } from "@/lib/financiero/types";
import { formatCOP, formatFechaCorta } from "@/lib/financiero/types";

export const metadata = { title: "Cuentas por pagar · Módulo Financiero · Ciclo Market" };

export default async function CuentasPorPagarPage() {
  const supabase = await createClient();
  const { data: facturas } = await supabase
    .from("vista_facturas_saldo")
    .select("*")
    .gt("saldo_pendiente", 0)
    .order("dias_transcurridos", { ascending: false })
    .returns<VistaFacturaSaldo[]>();

  const total = (facturas ?? []).reduce((sum, f) => sum + f.saldo_pendiente, 0);

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

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Proveedor</th>
              <th className="px-4 py-3 font-medium">Categoría</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 text-right font-medium">Saldo</th>
              <th className="px-4 py-3 text-right font-medium">Días transcurridos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {!facturas || facturas.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                  No hay cuentas por pagar pendientes.
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
    </div>
  );
}
