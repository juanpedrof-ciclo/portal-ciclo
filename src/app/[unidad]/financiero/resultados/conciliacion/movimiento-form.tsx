"use client";

import { useActionState, useEffect, useRef } from "react";
import type { EstadoFormularioMovimiento } from "./actions";
import { Campo, inputClass } from "@/components/form-field";

export function MovimientoForm({
  action,
}: {
  action: (
    prevState: EstadoFormularioMovimiento,
    formData: FormData,
  ) => Promise<EstadoFormularioMovimiento>;
}) {
  const [state, formAction, isPending] = useActionState<
    EstadoFormularioMovimiento,
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
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Agregar movimiento del extracto bancario
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
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
        <Campo label="Tipo" htmlFor="tipo">
          <select id="tipo" name="tipo" defaultValue="credito" className={inputClass}>
            <option value="credito">Crédito (entra)</option>
            <option value="debito">Débito (sale)</option>
          </select>
        </Campo>
        <Campo label="Descripción" htmlFor="descripcion">
          <input id="descripcion" name="descripcion" className={inputClass} />
        </Campo>
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-fit items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700 disabled:opacity-60"
      >
        {isPending ? "Guardando…" : "Agregar movimiento"}
      </button>
    </form>
  );
}
