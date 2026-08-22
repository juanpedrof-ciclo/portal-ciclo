"use client";

import { useActionState } from "react";
import type { EstadoFormularioInventarioInicial } from "./actions";
import { Campo, inputClass } from "@/components/form-field";

export function InventarioInicialForm({
  action,
}: {
  action: (
    prevState: EstadoFormularioInventarioInicial,
    formData: FormData,
  ) => Promise<EstadoFormularioInventarioInicial>;
}) {
  const [state, formAction, isPending] = useActionState<EstadoFormularioInventarioInicial, FormData>(
    action,
    null,
  );
  const resetKey = state?.ts ?? 0;
  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <details key={resetKey} className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-50">
        Ajustar inventario inicial
      </summary>
      <form action={formAction} className="flex flex-col gap-4 border-t border-zinc-200 p-5 dark:border-zinc-800">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Fija la cantidad conocida en una fecha; a partir de ahí el sistema suma nacimientos y
          resta muertes y salidas para calcular el inventario actual.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo label="Fecha" htmlFor="fecha">
            <input
              id="fecha"
              name="fecha"
              type="date"
              required
              defaultValue={hoy}
              className={`${inputClass} py-3 text-base`}
            />
          </Campo>
          <Campo label="Cantidad" htmlFor="cantidad">
            <input
              id="cantidad"
              name="cantidad"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              required
              className={`${inputClass} py-3 text-base`}
            />
          </Campo>
        </div>
        <Campo label="Notas (opcional)" htmlFor="notas">
          <textarea id="notas" name="notas" rows={2} className={inputClass} />
        </Campo>

        {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex w-fit items-center justify-center rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
        >
          {isPending ? "Guardando…" : "Guardar inventario inicial"}
        </button>
      </form>
    </details>
  );
}
