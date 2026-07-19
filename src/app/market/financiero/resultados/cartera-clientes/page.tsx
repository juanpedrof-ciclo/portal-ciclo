import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { VistaCarteraCliente } from "@/lib/financiero/types";
import { formatCOP } from "@/lib/financiero/types";

export const metadata = { title: "Cartera por cliente · Módulo Financiero · Ciclo Market" };

export default async function CarteraClientesPage() {
  const supabase = await createClient();
  const { data: cartera } = await supabase
    .from("vista_cartera_cliente")
    .select("*")
    .gt("saldo_total", 0)
    .order("dias_max_mora", { ascending: false, nullsFirst: false })
    .returns<VistaCarteraCliente[]>();

  const total = (cartera ?? []).reduce((sum, c) => sum + c.saldo_total, 0);

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

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Teléfono</th>
              <th className="px-4 py-3 text-right font-medium">Pedidos pendientes</th>
              <th className="px-4 py-3 text-right font-medium">Saldo</th>
              <th className="px-4 py-3 text-right font-medium">Días de mora</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {!cartera || cartera.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                  No hay cartera pendiente por cliente.
                </td>
              </tr>
            ) : (
              cartera.map((c) => (
                <tr key={c.cliente_id}>
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                    <Link
                      href={`/market/financiero/resultados/cartera-clientes/${c.cliente_id}`}
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
    </div>
  );
}
