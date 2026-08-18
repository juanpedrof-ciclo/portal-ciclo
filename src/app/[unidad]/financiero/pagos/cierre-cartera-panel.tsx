"use client";

import { useState, useTransition } from "react";
import {
  previewCierreCartera,
  ejecutarCierreCartera,
  type PreviewCierreCartera,
} from "./cierre-cartera-actions";
import { Campo, inputClass } from "@/components/form-field";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { formatCOP, type Unidad } from "@/lib/financiero/types";

export function CierreCarteraPanel({ unidad }: { unidad: Unidad }) {
  const [fecha, setFecha] = useState("");
  const [preview, setPreview] = useState<PreviewCierreCartera | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleFechaChange(value: string) {
    setFecha(value);
    setPreview(null);
    setResultado(null);
    setError(null);
  }

  function handlePreview() {
    setError(null);
    setResultado(null);
    startTransition(async () => {
      const res = await previewCierreCartera(unidad, fecha);
      if (res.error) {
        setError(res.error);
        setPreview(null);
      } else {
        setPreview(res.data);
      }
    });
  }

  function handleConfirmar() {
    startTransition(async () => {
      const res = await ejecutarCierreCartera(unidad, fecha);
      if (res.error) {
        setError(res.error);
        return;
      }
      setError(null);
      setPreview(null);
      const cantidad = (res.cerrados?.pedidos ?? 0) + (res.cerrados?.ingresos ?? 0);
      setResultado(`Se cerraron ${cantidad} registros por ${formatCOP(res.total ?? 0)}.`);
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Cierre en lote de cartera histórica
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Cierra de una sola vez todas las ventas y pedidos de clientes pendientes con fecha
          anterior al corte, registrando pagos con destino &ldquo;Histórico&rdquo;. No afecta el
          saldo de banco ni caja.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
        <Campo label="Fecha de corte (cierra lo anterior a esta fecha)" htmlFor="fecha-corte">
          <input
            id="fecha-corte"
            type="date"
            value={fecha}
            onChange={(e) => handleFechaChange(e.target.value)}
            className={inputClass}
          />
        </Campo>
        <button
          type="button"
          disabled={!fecha || pending}
          onClick={handlePreview}
          className="inline-flex w-fit items-center justify-center rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {pending && !preview ? "Calculando…" : "Vista previa"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {resultado && <p className="text-sm text-emerald-700 dark:text-emerald-400">{resultado}</p>}

      {preview && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Pedidos de clientes
              </p>
              <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {preview.pedidos.cantidad} · {formatCOP(preview.pedidos.total)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Ventas manuales/Excel
              </p>
              <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {preview.ingresos.cantidad} · {formatCOP(preview.ingresos.total)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Total a cerrar
              </p>
              <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {preview.total.cantidad} · {formatCOP(preview.total.total)}
              </p>
            </div>
          </div>

          {preview.total.cantidad === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No hay cartera pendiente antes de esa fecha.
            </p>
          ) : (
            <form action={handleConfirmar}>
              <ConfirmSubmitButton
                mensaje={`¿Confirmas cerrar ${preview.total.cantidad} registros por ${formatCOP(preview.total.total)} como pagos históricos? No afecta el saldo de banco ni caja, y es revertible solo pago por pago.`}
                disabled={pending}
                className="inline-flex w-fit items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700 disabled:opacity-60"
              >
                {pending ? "Cerrando…" : `Confirmar cierre (${formatCOP(preview.total.total)})`}
              </ConfirmSubmitButton>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
