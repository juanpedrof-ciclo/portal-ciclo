"use client";

import { useState } from "react";
import {
  desglosePorCliente,
  type CanalPG,
  type ClientePG,
  type FilaPedidoVenta,
} from "@/lib/financiero/pg";
import { formatCOP, formatFechaCorta } from "@/lib/financiero/types";
import { ExportarTabla, type ColumnaExport } from "@/components/exportar-tabla";
import { CanalPGChart } from "./canal-pg-chart";
import { TablaRanking } from "./tabla-ranking";
import { BreadcrumbDrilldown } from "./breadcrumb-drilldown";

const TOP_CLIENTES = 10;
const CLIENTE_OTROS_ID = "otros";

export function VentasCanal({
  canales,
  pedidos,
}: {
  canales: CanalPG[];
  pedidos: FilaPedidoVenta[];
}) {
  const [canalSel, setCanalSel] = useState<CanalPG | null>(null);
  const [clienteSel, setClienteSel] = useState<ClientePG | null>(null);

  const clientesTotal = canalSel
    ? desglosePorCliente({ pedidos }, canalSel.canal, canalSel.monto)
    : [];
  const residual = clientesTotal.find((c) => c.clienteId === CLIENTE_OTROS_ID);
  const reales = clientesTotal.filter((c) => c.clienteId !== CLIENTE_OTROS_ID);
  const topClientes = residual
    ? [...reales.slice(0, TOP_CLIENTES), residual]
    : reales.slice(0, TOP_CLIENTES);

  const pedidosCliente =
    canalSel && clienteSel && clienteSel.clienteId !== CLIENTE_OTROS_ID
      ? pedidos.filter(
          (p) => p.canal === canalSel.canal && p.cliente_id === clienteSel.clienteId,
        )
      : [];

  function seleccionarCanal(item: CanalPG) {
    setCanalSel(item);
    setClienteSel(null);
  }

  function seleccionarCliente(item: ClientePG) {
    if (item.clienteId === CLIENTE_OTROS_ID) return;
    setClienteSel(item);
  }

  const columnasPedidos: ColumnaExport[] = [
    { key: "fecha", header: "Fecha", tipo: "texto" },
    { key: "plataforma", header: "Plataforma", tipo: "texto" },
    { key: "orden", header: "N° orden", tipo: "texto" },
    { key: "monto", header: "Monto", tipo: "moneda" },
    { key: "estado", header: "Estado", tipo: "texto" },
  ];
  const filasPedidosExport = pedidosCliente.map((p) => ({
    fecha: formatFechaCorta(p.fecha),
    plataforma: p.plataforma,
    orden: p.id_orden_externo,
    monto: Number(p.monto_total),
    estado: p.estado ?? "—",
  }));

  return (
    <div className="flex flex-col gap-4">
      <CanalPGChart datos={canales} onSeleccionar={seleccionarCanal} />

      {canalSel && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
          <BreadcrumbDrilldown
            items={[
              { label: canalSel.nombre, onClick: () => setClienteSel(null) },
              ...(clienteSel ? [{ label: clienteSel.nombre }] : []),
            ]}
            onCerrar={() => {
              setCanalSel(null);
              setClienteSel(null);
            }}
          />

          {!clienteSel ? (
            <TablaRanking
              filas={topClientes}
              total={canalSel.monto}
              onSeleccionar={seleccionarCliente}
              nombreArchivo={`clientes-${canalSel.nombre}`}
              etiquetaColumna="Cliente"
            />
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Pedidos
                </h4>
                <ExportarTabla
                  columnas={columnasPedidos}
                  filas={filasPedidosExport}
                  nombreArchivo={`pedidos-${clienteSel.nombre}`}
                />
              </div>
              <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                    <tr>
                      <th className="px-3 py-2 font-medium">Fecha</th>
                      <th className="px-3 py-2 font-medium">Plataforma</th>
                      <th className="px-3 py-2 font-medium">N° orden</th>
                      <th className="px-3 py-2 text-right font-medium">Monto</th>
                      <th className="px-3 py-2 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {pedidosCliente.map((p) => (
                      <tr key={p.id}>
                        <td className="px-3 py-2 whitespace-nowrap text-zinc-700 dark:text-zinc-300">
                          {formatFechaCorta(p.fecha)}
                        </td>
                        <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                          {p.plataforma}
                        </td>
                        <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                          {p.id_orden_externo}
                        </td>
                        <td className="px-3 py-2 text-right whitespace-nowrap text-zinc-900 dark:text-zinc-100">
                          {formatCOP(Number(p.monto_total))}
                        </td>
                        <td className="px-3 py-2 capitalize text-zinc-700 dark:text-zinc-300">
                          {p.estado ?? "—"}
                        </td>
                      </tr>
                    ))}
                    {pedidosCliente.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-4 text-center text-zinc-400 dark:text-zinc-500">
                          Sin pedidos en este período
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
