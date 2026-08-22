"use client";

import { useActionState } from "react";
import type { EstadoFormularioSalidaInsumo } from "./actions";
import { Campo, inputClass } from "@/components/form-field";
import type { Insumo } from "@/lib/productivo/types";

export function SalidaInsumoForm({
  insumos,
  action,
}: {
  insumos: Insumo[];
  action: (
    prevState: EstadoFormularioSalidaInsumo,
    formData: FormData,
  ) => Promise<EstadoFormularioSalidaInsumo>;
}) {
  const [state, formAction, isPending] = useActionState<EstadoFormularioSalidaInsumo, FormData>(
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
      <Campo label="Insumo" htmlFor="insumo_id">
        <select id="insumo_id" name="insumo_id" required defaultValue="" className={`${inputClass} py-3 text-base`}>
          <option value="" disabled>
            {insumos.length === 0 ? "No hay insumos registrados" : "Selecciona el insumo"}
          </option>
          {insumos.map((i) => (
            <option key={i.id} value={i.id}>
              {i.nombre}
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
        <Campo label="Cantidad" htmlFor="cantidad">
          <input
            id="cantidad"
            name="cantidad"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.1"
            required
            className={`${inputClass} py-3 text-base`}
          />
        </Campo>
      </div>

      <Campo label="Motivo" htmlFor="motivo">
        <input id="motivo" name="motivo" required placeholder="Ej. curación de la cerca, botiquín…" className={`${inputClass} py-3 text-base`} />
      </Campo>

      <Campo label="Notas (opcional)" htmlFor="notas">
        <textarea id="notas" name="notas" rows={2} className={inputClass} />
      </Campo>

      {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending || insumos.length === 0}
        className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-3.5 text-base font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
      >
        {isPending ? "Guardando…" : "Guardar salida"}
      </button>
    </form>
  );
}
