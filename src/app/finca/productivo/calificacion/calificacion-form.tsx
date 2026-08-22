"use client";

import { useActionState } from "react";
import type { EstadoFormularioCalificacion } from "./actions";
import { inputClass } from "@/components/form-field";
import type { CriterioCalificacion } from "@/lib/productivo/types";

export function CalificacionForm({
  criterios,
  existentes,
  action,
}: {
  criterios: CriterioCalificacion[];
  existentes: Record<string, { nota: number; observaciones: string | null }>;
  action: (
    prevState: EstadoFormularioCalificacion,
    formData: FormData,
  ) => Promise<EstadoFormularioCalificacion>;
}) {
  const [state, formAction, isPending] = useActionState<EstadoFormularioCalificacion, FormData>(
    action,
    null,
  );

  if (criterios.length === 0) {
    return (
      <p className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        Crea al menos un criterio activo (abajo, en &quot;Gestionar criterios&quot;) para poder calificar el mes.
      </p>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      {criterios.map((c) => {
        const previa = existentes[c.id];
        return (
          <div key={c.id} className="flex flex-col gap-2 border-b border-zinc-100 pb-5 last:border-0 last:pb-0 dark:border-zinc-800">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{c.nombre}</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className="cursor-pointer">
                  <input
                    type="radio"
                    name={`nota_${c.id}`}
                    value={n}
                    defaultChecked={previa?.nota === n}
                    required
                    className="peer sr-only"
                  />
                  <span className="flex size-11 items-center justify-center rounded-lg border border-zinc-300 text-base font-medium text-zinc-700 transition peer-checked:border-green-600 peer-checked:bg-green-600 peer-checked:text-white dark:border-zinc-700 dark:text-zinc-300">
                    {n}
                  </span>
                </label>
              ))}
            </div>
            <textarea
              name={`obs_${c.id}`}
              rows={2}
              placeholder="Observaciones (opcional)"
              defaultValue={previa?.observaciones ?? ""}
              className={inputClass}
            />
          </div>
        );
      })}

      {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      {state && !state.error && (
        <p className="text-sm text-green-600 dark:text-green-400">Calificación guardada.</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-fit items-center justify-center rounded-xl bg-green-600 px-4 py-3.5 text-base font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
      >
        {isPending ? "Guardando…" : "Guardar calificación del mes"}
      </button>
    </form>
  );
}
