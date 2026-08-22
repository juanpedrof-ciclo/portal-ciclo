"use client";

import { useActionState } from "react";
import type { EstadoFormularioEntrada } from "./actions";
import { Campo, inputClass } from "@/components/form-field";
import type { Insumo } from "@/lib/productivo/types";

export function EntradaForm({
  insumos,
  action,
}: {
  insumos: Insumo[];
  action: (
    prevState: EstadoFormularioEntrada,
    formData: FormData,
  ) => Promise<EstadoFormularioEntrada>;
}) {
  const [state, formAction, isPending] = useActionState<EstadoFormularioEntrada, FormData>(
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Proveedor (opcional)" htmlFor="proveedor">
          <input id="proveedor" name="proveedor" className={`${inputClass} py-3 text-base`} />
        </Campo>
        <Campo label="Costo (opcional)" htmlFor="costo">
          <input
            id="costo"
            name="costo"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
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
        disabled={isPending || insumos.length === 0}
        className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-3.5 text-base font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
      >
        {isPending ? "Guardando…" : "Guardar entrada"}
      </button>
    </form>
  );
}
