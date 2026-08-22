"use client";

import { useActionState } from "react";
import type { EstadoFormularioLeche } from "./actions";
import { Campo, inputClass } from "@/components/form-field";
import { TURNO_LABELS, type AnimalEstado } from "@/lib/productivo/types";

export function LecheForm({
  bufalas,
  action,
}: {
  bufalas: AnimalEstado[];
  action: (
    prevState: EstadoFormularioLeche,
    formData: FormData,
  ) => Promise<EstadoFormularioLeche>;
}) {
  const [state, formAction, isPending] = useActionState<EstadoFormularioLeche, FormData>(
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
      <Campo label="Búfala (chapeta)" htmlFor="animal_id">
        <select
          id="animal_id"
          name="animal_id"
          required
          defaultValue=""
          className={`${inputClass} py-3 text-base`}
        >
          <option value="" disabled>
            {bufalas.length === 0 ? "No hay búfalas activas registradas" : "Selecciona la chapeta"}
          </option>
          {bufalas.map((b) => (
            <option key={b.id} value={b.id}>
              {b.chapeta}
            </option>
          ))}
        </select>
      </Campo>

      <div className="grid grid-cols-2 gap-4">
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

        <Campo label="Turno" htmlFor="turno">
          <select id="turno" name="turno" required defaultValue="" className={`${inputClass} py-3 text-base`}>
            <option value="" disabled>
              Selecciona
            </option>
            {Object.entries(TURNO_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <Campo label="Litros" htmlFor="litros">
        <input
          id="litros"
          name="litros"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.1"
          required
          className={`${inputClass} py-3 text-base`}
        />
      </Campo>

      <Campo label="Notas (opcional)" htmlFor="notas">
        <textarea id="notas" name="notas" rows={2} className={inputClass} />
      </Campo>

      {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending || bufalas.length === 0}
        className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-3.5 text-base font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
      >
        {isPending ? "Guardando…" : "Guardar producción"}
      </button>
    </form>
  );
}
