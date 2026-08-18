import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/server";
import type { Cliente, Unidad, VistaPedidoSaldo } from "@/lib/financiero/types";
import { formatCOP, formatFechaCorta } from "@/lib/financiero/types";

export const metadata = { title: "Cartera del cliente · Módulo Financiero" };

export default async function CarteraClientePage({
  params,
}: {
  params: Promise<{ unidad: string; id: string }>;
}) {
  const { unidad, id } = (await params) as { unidad: Unidad; id: string };
  const supabase = await createClient();

  const [{ data: cliente }, { data: pedidos }] = await Promise.all([
    supabase
      .from("clientes")
      .select("*")
      .eq("unidad", unidad)
      .eq("id", id)
      .returns<Cliente[]>()
      .single(),
    supabase
      .from("vista_pedidos_saldo")
      .select("*")
      .eq("unidad", unidad)
      .eq("cliente_id", id)
      .order("fecha", { ascending: false })
      .returns<VistaPedidoSaldo[]>(),
  ]);

  const pendientes = (pedidos ?? []).filter((p) => p.saldo_pendiente > 0.01);
  const saldoTotal = pendientes.reduce((sum, p) => sum + p.saldo_pendiente, 0);

  return (
    <div className="flex flex-col gap-4">
      <BackLink
        href={`/${unidad}/financiero/resultados/cartera-clientes`}
        label="Cartera por cliente"
      />

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {cliente?.nombre ?? "Cliente"}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {cliente?.telefono || "Sin teléfono"}
          </p>
        </div>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Saldo pendiente: {formatCOP(saldoTotal)}
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Plataforma</th>
              <th className="px-4 py-3 font-medium">Pedido</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
              <th className="px-4 py-3 text-right font-medium">Saldo</th>
              <th className="px-4 py-3 text-right font-medium">Días</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {pedidos && pedidos.length > 0 ? (
              pedidos.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                    {formatFechaCorta(p.fecha)}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                    {p.plataforma}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {p.id_orden_externo}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-zinc-100">
                    {formatCOP(p.monto_total)}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-300">
                    {p.saldo_pendiente > 0 ? formatCOP(p.saldo_pendiente) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-300">
                    {p.saldo_pendiente > 0 ? p.dias_transcurridos : "—"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                  Este cliente no tiene pedidos cargados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
