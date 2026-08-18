"use client";

import { useActionState, useEffect, useRef } from "react";
import type { EstadoFormularioSaldoInicial } from "./actions";
import { Campo, inputClass } from "@/components/form-field";

export function SaldoInicialForm({
  action,
}: {
  action: (
    prevState: EstadoFormularioSaldoInicial,
    formData: FormData,
  ) => Promise<EstadoFormularioSaldoInicial>;
}) {
  const [state, formAction, isPending] = useActionState<
    EstadoFormularioSaldoInicial,
    FormData
  >(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && state.error === null) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div>
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Registrar saldo inicial
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Punto de partida a una fecha: desde ahí se suman/restan los pagos y ajustes
          posteriores. Si registras uno nuevo, queda el histórico de los anteriores.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Campo label="Cuenta" htmlFor="destino">
          <select id="destino" name="destino" defaultValue="banco" className={inputClass}>
            <option value="banco">Banco</option>
            <option value="caja">Caja / efectivo</option>
          </select>
        </Campo>
        <Campo label="Fecha" htmlFor="fecha">
          <input id="fecha" name="fecha" type="date" required className={inputClass} />
        </Campo>
        <Campo label="Monto" htmlFor="monto">
          <input
            id="monto"
            name="monto"
            type="number"
            step="0.01"
            required
            className={inputClass}
          />
        </Campo>
      </div>
      <Campo label="Notas (opcional)" htmlFor="notas">
        <input id="notas" name="notas" className={inputClass} />
      </Campo>

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-fit items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700 disabled:opacity-60"
      >
        {isPending ? "Guardando…" : "Registrar saldo inicial"}
      </button>
    </form>
  );
}
