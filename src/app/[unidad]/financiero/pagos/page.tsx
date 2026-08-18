import { createClient } from "@/lib/supabase/server";
import { PagoForm } from "./pago-form";
import { CierreCarteraPanel } from "./cierre-cartera-panel";
import { anularPago, anularPagosLote, crearPago } from "./actions";
import { AnularForm } from "@/components/anular-form";
import { SeleccionProvider } from "@/components/seleccion-provider";
import { CheckboxFila, CheckboxTodo } from "@/components/checkbox-seleccion";
import { AnularSeleccionadosBar } from "@/components/anular-seleccionados-bar";
import { ListaBuscador } from "@/components/lista-buscador";
import { ListaPaginacion } from "@/components/lista-paginacion";
import { ThOrdenable } from "@/components/lista-th-ordenable";
import { normalizarListaParams, patronIlike } from "@/lib/financiero/list-query";
import type {
  DestinoPago,
  Unidad,
  VistaFacturaSaldo,
  VistaIngresoSaldo,
  VistaPedidoSaldo,
} from "@/lib/financiero/types";
import { DESTINO_PAGO_LABELS, formatCOP, formatFechaCorta } from "@/lib/financiero/types";

export const metadata = { title: "Recibos de pago · Módulo Financiero" };

const COLUMNAS_ORDEN = ["fecha", "tipo", "monto", "destino", "contraparte_nombre"] as const;

type PagoDetalle = {
  id: string;
  tipo: "pago_proveedor" | "cobro_cliente";
  fecha: string;
  monto: number;
  destino: DestinoPago;
  referencia: string | null;
  contraparte_nombre: string | null;
  contraparte_fecha: string | null;
};

export default async function PagosPage({
  params,
  searchParams,
}: {
  params: Promise<{ unidad: string }>;
  searchParams: Promise<{ page?: string; q?: string; sort?: string; dir?: string }>;
}) {
  const { unidad } = (await params) as { unidad: Unidad };
  const RUTA = `/${unidad}/financiero/pagos`;
  const { page, sort, dir, q, desde, hasta, paramsBase } = normalizarListaParams(
    await searchParams,
    { columnas: COLUMNAS_ORDEN, ordenPorDefecto: "fecha" },
  );

  const supabase = await createClient();

  let pagosQuery = supabase
    .from("vista_pagos_detalle")
    .select("*", { count: "exact" })
    .eq("unidad", unidad)
    .eq("anulado", false);
  if (q) {
    const patron = patronIlike(q);
    pagosQuery = pagosQuery.or(`referencia.ilike.${patron},contraparte_nombre.ilike.${patron}`);
  }

  const [
    { data: facturasPendientes },
    { data: ingresosPendientes },
    { data: pedidosPendientes },
    { data: pagos, count },
  ] = await Promise.all([
    supabase
      .from("vista_facturas_saldo")
      .select("*")
      .eq("unidad", unidad)
      .gt("saldo_pendiente", 0)
      .order("fecha", { ascending: true })
      .returns<VistaFacturaSaldo[]>(),
    supabase
      .from("vista_ingresos_saldo")
      .select("*")
      .eq("unidad", unidad)
      .gt("saldo_pendiente", 0)
      .order("fecha", { ascending: true })
      .returns<VistaIngresoSaldo[]>(),
    supabase
      .from("vista_pedidos_saldo")
      .select("*")
      .eq("unidad", unidad)
      .gt("saldo_pendiente", 0)
      .order("fecha", { ascending: true })
      .returns<VistaPedidoSaldo[]>(),
    pagosQuery
      .order(sort, { ascending: dir === "asc" })
      .range(desde, hasta)
      .returns<PagoDetalle[]>(),
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
        action={crearPago.bind(null, unidad)}
        facturasPendientes={facturasPendientes ?? []}
        ingresosPendientes={ingresosPendientes ?? []}
        pedidosPendientes={pedidosPendientes ?? []}
      />

      <CierreCarteraPanel unidad={unidad} />

      <ListaBuscador
        basePath={RUTA}
        params={paramsBase}
        valorInicial={q}
        placeholder="Buscar por referencia, cliente o proveedor…"
      />

      <SeleccionProvider idsVisibles={idsVisibles}>
        <AnularSeleccionadosBar
          idsVisibles={idsVisibles}
          action={anularPagosLote.bind(null, unidad)}
        />

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <CheckboxTodo ids={idsVisibles} />
                  </th>
                  <ThOrdenable basePath={RUTA} params={paramsBase} campo="fecha" label="Fecha" sortActual={sort} dirActual={dir} />
                  <ThOrdenable basePath={RUTA} params={paramsBase} campo="tipo" label="Tipo" sortActual={sort} dirActual={dir} />
                  <ThOrdenable basePath={RUTA} params={paramsBase} campo="contraparte_nombre" label="Aplica a" sortActual={sort} dirActual={dir} />
                  <ThOrdenable basePath={RUTA} params={paramsBase} campo="monto" label="Monto" sortActual={sort} dirActual={dir} align="right" />
                  <ThOrdenable basePath={RUTA} params={paramsBase} campo="destino" label="Destino" sortActual={sort} dirActual={dir} />
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {!pagos || pagos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                      {q ? "No se encontraron pagos para esa búsqueda." : "Aún no hay recibos de pago registrados."}
                    </td>
                  </tr>
                ) : (
                  pagos.map((pago) => {
                    const destino = pago.contraparte_nombre
                      ? `${pago.contraparte_nombre} (${formatFechaCorta(pago.contraparte_fecha!)})`
                      : pago.contraparte_fecha
                        ? `Venta del ${formatFechaCorta(pago.contraparte_fecha)}`
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
                            action={anularPago.bind(null, unidad)}
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
          <ListaPaginacion basePath={RUTA} params={paramsBase} page={page} total={count ?? 0} />
        </div>
      </SeleccionProvider>
    </div>
  );
}
