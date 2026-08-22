"use client";

import { useActionState, useState, useTransition } from "react";
import { alternarCriterioActivo, crearCriterio, type EstadoFormularioCriterio } from "./actions";
import { inputClass } from "@/components/form-field";
import type { CriterioCalificacion } from "@/lib/productivo/types";

export function CriteriosPanel({ criterios }: { criterios: CriterioCalificacion[] }) {
  const [state, formAction, isPending] = useActionState<EstadoFormularioCriterio, FormData>(
    crearCriterio,
    null,
  );
  const resetKey = state?.ts ?? 0;

  return (
    <details className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-50">
        Gestionar criterios
      </summary>
      <div className="flex flex-col gap-4 border-t border-zinc-200 p-5 dark:border-zinc-800">
        <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
          {criterios.length === 0 ? (
            <p className="py-2 text-sm text-zinc-500 dark:text-zinc-400">Aún no hay criterios.</p>
          ) : (
            criterios.map((c) => <FilaCriterio key={c.id} criterio={c} />)
          )}
        </div>

        <form key={resetKey} action={formAction} className="flex items-end gap-3">
          <div className="flex-1">
            <label htmlFor="nombre" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Nuevo criterio
            </label>
            <input id="nombre" name="nombre" required placeholder="Ej. Orden y limpieza" className={`${inputClass} mt-1.5`} />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
          >
            {isPending ? "Agregando…" : "Agregar"}
          </button>
        </form>
        {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      </div>
    </details>
  );
}

function FilaCriterio({ criterio }: { criterio: CriterioCalificacion }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className={`text-sm ${criterio.activo ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 line-through dark:text-zinc-600"}`}>
        {criterio.nombre}
      </span>
      <div className="flex items-center gap-2">
        {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await alternarCriterioActivo(criterio.id, !criterio.activo);
              setError(res.error);
            })
          }
          className="text-xs font-medium text-amber-700 hover:underline disabled:opacity-50 dark:text-amber-400"
        >
          {criterio.activo ? "Desactivar" : "Activar"}
        </button>
      </div>
    </div>
  );
}
