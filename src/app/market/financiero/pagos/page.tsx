import { createClient } from "@/lib/supabase/server";
import { PagoForm } from "./pago-form";
import { CierreCarteraPanel } from "./cierre-cartera-panel";
import { anularPago, anularPagosLote } from "./actions";
import { AnularForm } from "@/components/anular-form";
import { SeleccionProvider } from "@/components/seleccion-provider";
import { CheckboxFila, CheckboxTodo } from "@/components/checkbox-seleccion";
import { AnularSeleccionadosBar } from "@/components/anular-seleccionados-bar";
import type {
  DestinoPago,
  VistaFacturaSaldo,
  VistaIngresoSaldo,
  VistaPedidoSaldo,
} from "@/lib/financiero/types";
import { DESTINO_PAGO_LABELS, formatCOP, formatFechaCorta } from "@/lib/financiero/types";

export const metadata = { title: "Recibos de pago · Módulo Financiero · Ciclo Market" };

type PagoConAplicacion = {
  id: string;
  tipo: "pago_proveedor" | "cobro_cliente";
  fecha: string;
  monto: number;
  destino: DestinoPago;
  referencia: string | null;
  pago_aplicaciones: {
    monto_aplicado: number;
    facturas: { fecha: string; proveedores: { nombre: string } | null } | null;
    ingresos_semanales: { fecha: string } | null;
    pedidos: { fecha: string; clientes: { nombre: string } | null } | null;
  }[];
};

export default async function PagosPage() {
  const supabase = await createClient();

  const [
    { data: facturasPendientes },
    { data: ingresosPendientes },
    { data: pedidosPendientes },
    { data: pagos },
  ] = await Promise.all([
    supabase
      .from("vista_facturas_saldo")
      .select("*")
      .gt("saldo_pendiente", 0)
      .order("fecha", { ascending: true })
      .returns<VistaFacturaSaldo[]>(),
    supabase
      .from("vista_ingresos_saldo")
      .select("*")
      .gt("saldo_pendiente", 0)
      .order("fecha", { ascending: true })
      .returns<VistaIngresoSaldo[]>(),
    supabase
      .from("vista_pedidos_saldo")
      .select("*")
      .gt("saldo_pendiente", 0)
      .order("fecha", { ascending: true })
      .returns<VistaPedidoSaldo[]>(),
    supabase
      .from("pagos")
      .select(
        `id, tipo, fecha, monto, destino, referencia,
         pago_aplicaciones ( monto_aplicado, facturas ( fecha, proveedores ( nombre ) ), ingresos_semanales ( fecha ), pedidos ( fecha, clientes ( nombre ) ) )`,
      )
      .eq("anulado", false)
      .order("fecha", { ascending: false })
      .limit(50)
      .returns<PagoConAplicacion[]>(),
  ]);

  const idsVisibles = (pagos ?? []).map((p) => p.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Recibos de pago
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Pagos a proveedor o cobros de cliente, cruzados contra una factura o una venta.
        </p>
      </div>

      <PagoForm
        facturasPendientes={facturasPendientes ?? []}
        ingresosPendientes={ingresosPendientes ?? []}
        pedidosPendientes={pedidosPendientes ?? []}
      />

      <CierreCarteraPanel />

      <SeleccionProvider idsVisibles={idsVisibles}>
        <AnularSeleccionadosBar idsVisibles={idsVisibles} action={anularPagosLote} />

        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <tr>
                <th className="w-10 px-4 py-3">
                  <CheckboxTodo ids={idsVisibles} />
                </th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Aplica a</th>
                <th className="px-4 py-3 text-right font-medium">Monto</th>
                <th className="px-4 py-3 font-medium">Destino</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {!pagos || pagos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                    Aún no hay recibos de pago registrados.
                  </td>
                </tr>
              ) : (
                pagos.map((pago) => {
                  const aplicacion = pago.pago_aplicaciones[0];
                  const destino =
                    aplicacion?.facturas != null
                      ? `${aplicacion.facturas.proveedores?.nombre ?? "Proveedor"} (${formatFechaCorta(aplicacion.facturas.fecha)})`
                      : aplicacion?.ingresos_semanales != null
                        ? `Venta del ${formatFechaCorta(aplicacion.ingresos_semanales.fecha)}`
                        : aplicacion?.pedidos != null
                          ? `${aplicacion.pedidos.clientes?.nombre ?? "Cliente"} (${formatFechaCorta(aplicacion.pedidos.fecha)})`
                          : "—";
                  return (
                    <tr key={pago.id}>
                      <td className="px-4 py-3">
                        <CheckboxFila id={pago.id} />
                      </td>
                      <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                        {formatFechaCorta(pago.fecha)}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                        {pago.tipo === "pago_proveedor" ? "Pago a proveedor" : "Cobro de cliente"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{destino}</td>
                      <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-zinc-100">
                        {formatCOP(pago.monto)}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                        {DESTINO_PAGO_LABELS[pago.destino]}
                      </td>
                      <td className="px-4 py-3">
                        <AnularForm
                          id={pago.id}
                          action={anularPago}
                          mensaje="¿Seguro que deseas anular este pago? Esta acción lo excluye de tus cálculos y libera el saldo de la factura o venta que cruzaba."
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </SeleccionProvider>
    </div>
  );
}
