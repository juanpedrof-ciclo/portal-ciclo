"use client";

import { useActionState } from "react";
import type { EstadoFormularioConfirmacion } from "./actions";
import { Campo, inputClass } from "@/components/form-field";
import { RESULTADO_PRENEZ_LABELS, type AnimalEstado } from "@/lib/productivo/types";

export function ConfirmacionForm({
  animales,
  action,
}: {
  animales: AnimalEstado[];
  action: (
    prevState: EstadoFormularioConfirmacion,
    formData: FormData,
  ) => Promise<EstadoFormularioConfirmacion>;
}) {
  const [state, formAction, isPending] = useActionState<EstadoFormularioConfirmacion, FormData>(
    action,
    null,
  );
  const resetKey = state?.ts ?? 0;
  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <form
      key={resetKey}
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <Campo label="Animal (chapeta)" htmlFor="animal_id">
        <select id="animal_id" name="animal_id" required defaultValue="" className={`${inputClass} py-3 text-base`}>
          <option value="" disabled>
            {animales.length === 0 ? "No hay animales activos" : "Selecciona la chapeta"}
          </option>
          {animales.map((a) => (
            <option key={a.id} value={a.id}>
              {a.chapeta}
            </option>
          ))}
        </select>
      </Campo>

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

        <Campo label="Resultado" htmlFor="resultado">
          <select id="resultado" name="resultado" required defaultValue="" className={`${inputClass} py-3 text-base`}>
            <option value="" disabled>
              Selecciona
            </option>
            {Object.entries(RESULTADO_PRENEZ_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <Campo label="Notas (opcional)" htmlFor="notas">
        <textarea id="notas" name="notas" rows={2} className={inputClass} />
      </Campo>

      {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-3.5 text-base font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
      >
        {isPending ? "Guardando…" : "Guardar confirmación"}
      </button>
    </form>
  );
}
