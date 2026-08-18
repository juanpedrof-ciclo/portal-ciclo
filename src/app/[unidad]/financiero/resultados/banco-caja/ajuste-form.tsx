"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { EstadoFormularioAjuste } from "./actions";
import { Campo, inputClass } from "@/components/form-field";

export function AjusteForm({
  action,
}: {
  action: (
    prevState: EstadoFormularioAjuste,
    formData: FormData,
  ) => Promise<EstadoFormularioAjuste>;
}) {
  const [state, formAction, isPending] = useActionState<
    EstadoFormularioAjuste,
    FormData
  >(action, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [signo, setSigno] = useState<"suma" | "resta">("suma");

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
          Registrar ajuste manual
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Para cuando el saldo real no cuadra con el del sistema. Queda registrado con
          fecha y motivo, y se puede anular si te equivocas.
        </p>
      </div>

      <div className="inline-flex w-fit rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
        <button
          type="button"
          onClick={() => setSigno("suma")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            signo === "suma"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          Suma al saldo
        </button>
        <button
          type="button"
          onClick={() => setSigno("resta")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            signo === "resta"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          Resta al saldo
        </button>
      </div>
      <input type="hidden" name="signo" value={signo} />

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
            min="0"
            step="0.01"
            required
            className={inputClass}
          />
        </Campo>
      </div>

      <Campo label="Motivo" htmlFor="motivo">
        <textarea id="motivo" name="motivo" rows={2} required className={inputClass} />
      </Campo>

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-fit items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700 disabled:opacity-60"
      >
        {isPending ? "Guardando…" : "Registrar ajuste"}
      </button>
    </form>
  );
}
