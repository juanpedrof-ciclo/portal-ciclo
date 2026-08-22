"use client";

import { useActionState } from "react";
import type { EstadoFormularioDestete } from "./actions";
import { Campo, inputClass } from "@/components/form-field";
import type { AnimalEstado } from "@/lib/productivo/types";

export function DesteteForm({
  animales,
  action,
}: {
  animales: AnimalEstado[];
  action: (
    prevState: EstadoFormularioDestete,
    formData: FormData,
  ) => Promise<EstadoFormularioDestete>;
}) {
  const [state, formAction, isPending] = useActionState<EstadoFormularioDestete, FormData>(
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
      <Campo label="Madre (chapeta)" htmlFor="animal_id">
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

      <Campo label="Notas (opcional)" htmlFor="notas">
        <textarea id="notas" name="notas" rows={2} className={inputClass} />
      </Campo>

      {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-3.5 text-base font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
      >
        {isPending ? "Guardando…" : "Guardar destete"}
      </button>
    </form>
  );
}
