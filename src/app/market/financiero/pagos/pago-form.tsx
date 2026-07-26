"use client";

import { useActionState, useMemo, useState } from "react";
import { crearPago, type EstadoFormularioPago } from "./actions";
import { Campo, inputClass } from "@/components/form-field";
import { formatCOP, formatFechaCorta } from "@/lib/financiero/types";
import type {
  VistaFacturaSaldo,
  VistaIngresoSaldo,
  VistaPedidoSaldo,
} from "@/lib/financiero/types";

export function PagoForm({
  facturasPendientes,
  ingresosPendientes,
  pedidosPendientes,
}: {
  facturasPendientes: VistaFacturaSaldo[];
  ingresosPendientes: VistaIngresoSaldo[];
  pedidosPendientes: VistaPedidoSaldo[];
}) {
  const [state, formAction, isPending] = useActionState<
    EstadoFormularioPago,
    FormData
  >(crearPago, null);

  const resetKey = state && state.error === null ? state.ts : 0;

  return (
    <PagoFormCampos
      key={resetKey}
      formAction={formAction}
      isPending={isPending}
      error={state?.error ?? null}
      facturasPendientes={facturasPendientes}
      ingresosPendientes={ingresosPendientes}
      pedidosPendientes={pedidosPendientes}
    />
  );
}

function PagoFormCampos({
  formAction,
  isPending,
  error,
  facturasPendientes,
  ingresosPendientes,
  pedidosPendientes,
}: {
  formAction: (formData: FormData) => void;
  isPending: boolean;
  error: string | null;
  facturasPendientes: VistaFacturaSaldo[];
  ingresosPendientes: VistaIngresoSaldo[];
  pedidosPendientes: VistaPedidoSaldo[];
}) {
  const [tipo, setTipo] = useState<"pago_proveedor" | "cobro_cliente">(
    "pago_proveedor",
  );
  const [origenCobro, setOrigenCobro] = useState<"ingreso" | "pedido">(
    "pedido",
  );
  const [facturaId, setFacturaId] = useState("");
  const [ingresoId, setIngresoId] = useState("");
  const [pedidoId, setPedidoId] = useState("");
  const [monto, setMonto] = useState("");

  const saldoFactura = useMemo(
    () => facturasPendientes.find((f) => f.id === facturaId)?.saldo_pendiente,
    [facturaId, facturasPendientes],
  );
  const saldoIngreso = useMemo(
    () => ingresosPendientes.find((i) => i.id === ingresoId)?.saldo_pendiente,
    [ingresoId, ingresosPendientes],
  );
  const saldoPedido = useMemo(
    () => pedidosPendientes.find((p) => p.id === pedidoId)?.saldo_pendiente,
    [pedidoId, pedidosPendientes],
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="inline-flex w-fit rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
        <button
          type="button"
          onClick={() => setTipo("pago_proveedor")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            tipo === "pago_proveedor"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          Pago a proveedor
        </button>
        <button
          type="button"
          onClick={() => setTipo("cobro_cliente")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            tipo === "cobro_cliente"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          Cobro de cliente
        </button>
      </div>
      <input type="hidden" name="tipo" value={tipo} />

      {tipo === "pago_proveedor" ? (
        <Campo label="Factura a pagar" htmlFor="factura_id">
          <select
            id="factura_id"
            name="factura_id"
            required
            value={facturaId}
            onChange={(e) => {
              setFacturaId(e.target.value);
              const saldo = facturasPendientes.find(
                (f) => f.id === e.target.value,
              )?.saldo_pendiente;
              if (saldo != null) setMonto(String(saldo));
            }}
            className={inputClass}
          >
            <option value="" disabled>
              {facturasPendientes.length === 0
                ? "No hay facturas pendientes"
                : "Selecciona una factura"}
            </option>
            {facturasPendientes.map((f) => (
              <option key={f.id} value={f.id}>
                {f.proveedor_nombre} · {formatFechaCorta(f.fecha)} · saldo{" "}
                {formatCOP(f.saldo_pendiente)}
              </option>
            ))}
          </select>
          {saldoFactura != null && (
            <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              Saldo pendiente: {formatCOP(saldoFactura)}
            </p>
          )}
        </Campo>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="inline-flex w-fit rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
            <button
              type="button"
              onClick={() => setOrigenCobro("pedido")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                origenCobro === "pedido"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              Pedido de cliente
            </button>
            <button
              type="button"
              onClick={() => setOrigenCobro("ingreso")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                origenCobro === "ingreso"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              Venta manual
            </button>
          </div>

          {origenCobro === "pedido" ? (
            <Campo label="Pedido a cobrar" htmlFor="pedido_id">
              <select
                id="pedido_id"
                name="pedido_id"
                required
                value={pedidoId}
                onChange={(e) => {
                  setPedidoId(e.target.value);
                  const saldo = pedidosPendientes.find(
                    (p) => p.id === e.target.value,
                  )?.saldo_pendiente;
                  if (saldo != null) setMonto(String(saldo));
                }}
                className={inputClass}
              >
                <option value="" disabled>
                  {pedidosPendientes.length === 0
                    ? "No hay pedidos pendientes de cobro"
                    : "Selecciona un pedido"}
                </option>
                {pedidosPendientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.cliente_nombre} · {formatFechaCorta(p.fecha)} · saldo{" "}
                    {formatCOP(p.saldo_pendiente)}
                  </option>
                ))}
              </select>
              {saldoPedido != null && (
                <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                  Saldo pendiente: {formatCOP(saldoPedido)}
                </p>
              )}
            </Campo>
          ) : (
            <Campo label="Venta a cobrar" htmlFor="ingreso_id">
              <select
                id="ingreso_id"
                name="ingreso_id"
                required
                value={ingresoId}
                onChange={(e) => {
                  setIngresoId(e.target.value);
                  const saldo = ingresosPendientes.find(
                    (i) => i.id === e.target.value,
                  )?.saldo_pendiente;
                  if (saldo != null) setMonto(String(saldo));
                }}
                className={inputClass}
              >
                <option value="" disabled>
                  {ingresosPendientes.length === 0
                    ? "No hay ventas pendientes de cobro"
                    : "Selecciona una venta"}
                </option>
                {ingresosPendientes.map((i) => (
                  <option key={i.id} value={i.id}>
                    Venta del {formatFechaCorta(i.fecha)} · saldo{" "}
                    {formatCOP(i.saldo_pendiente)}
                  </option>
                ))}
              </select>
              {saldoIngreso != null && (
                <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                  Saldo pendiente: {formatCOP(saldoIngreso)}
                </p>
              )}
            </Campo>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Campo label="Monto" htmlFor="monto">
          <input
            id="monto"
            name="monto"
            type="number"
            min="0"
            step="0.01"
            required
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className={inputClass}
          />
        </Campo>
        <Campo label="Fecha" htmlFor="fecha">
          <input id="fecha" name="fecha" type="date" required className={inputClass} />
        </Campo>
        <Campo label="Destino del dinero" htmlFor="destino">
          <select id="destino" name="destino" defaultValue="banco" className={inputClass}>
            <option value="banco">Banco</option>
            <option value="caja">Caja / efectivo</option>
          </select>
        </Campo>
      </div>

      <Campo label="Referencia (opcional)" htmlFor="referencia">
        <input id="referencia" name="referencia" className={inputClass} />
      </Campo>

      <Campo label="Notas (opcional)" htmlFor="notas">
        <textarea id="notas" name="notas" rows={2} className={inputClass} />
      </Campo>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-fit items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700 disabled:opacity-60"
      >
        {isPending ? "Guardando…" : "Registrar recibo de pago"}
      </button>
    </form>
  );
}
