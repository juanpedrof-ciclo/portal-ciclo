"use client";

import { useActionState, useState } from "react";
import type { EstadoFormularioAlimentacion } from "./actions";
import { Campo, inputClass } from "@/components/form-field";
import { TIPO_ALIMENTO_LABELS, type GrupoAnimal, type Insumo } from "@/lib/productivo/types";

export function AlimentacionForm({
  grupos,
  insumos,
  action,
}: {
  grupos: GrupoAnimal[];
  insumos: Insumo[];
  action: (
    prevState: EstadoFormularioAlimentacion,
    formData: FormData,
  ) => Promise<EstadoFormularioAlimentacion>;
}) {
  const [state, formAction, isPending] = useActionState<
    EstadoFormularioAlimentacion,
    FormData
  >(action, null);

  const resetKey = state?.ts ?? 0;

  return (
    <AlimentacionFormCampos
      key={resetKey}
      grupos={grupos}
      insumos={insumos}
      formAction={formAction}
      isPending={isPending}
      error={state?.error ?? null}
    />
  );
}

function AlimentacionFormCampos({
  grupos,
  insumos,
  formAction,
  isPending,
  error,
}: {
  grupos: GrupoAnimal[];
  insumos: Insumo[];
  formAction: (formData: FormData) => void;
  isPending: boolean;
  error: string | null;
}) {
  const hoy = new Date().toISOString().slice(0, 10);
  const [tipoAlimento, setTipoAlimento] = useState("");

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <Campo label="Grupo" htmlFor="grupo_id">
        <select
          id="grupo_id"
          name="grupo_id"
          required
          defaultValue=""
          className={`${inputClass} py-3 text-base`}
        >
          <option value="" disabled>
            Selecciona el grupo
          </option>
          {grupos.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nombre}
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

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Kg de alimento" htmlFor="kg_alimento">
          <input
            id="kg_alimento"
            name="kg_alimento"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.1"
            required
            className={`${inputClass} py-3 text-base`}
          />
        </Campo>

        <Campo label="Tipo" htmlFor="tipo_alimento">
          <select
            id="tipo_alimento"
            name="tipo_alimento"
            required
            value={tipoAlimento}
            onChange={(e) => setTipoAlimento(e.target.value)}
            className={`${inputClass} py-3 text-base`}
          >
            <option value="" disabled>
              Selecciona
            </option>
            {Object.entries(TIPO_ALIMENTO_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      {tipoAlimento !== "pasto" && insumos.length > 0 && (
        <Campo label="Insumo usado (opcional)" htmlFor="insumo_id">
          <select id="insumo_id" name="insumo_id" defaultValue="" className={`${inputClass} py-3 text-base`}>
            <option value="">Sin descontar de inventario</option>
            {insumos.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nombre}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            Si lo eliges, estos kg se descuentan automáticamente del inventario de insumos.
          </p>
        </Campo>
      )}

      <Campo label="Notas (opcional)" htmlFor="notas">
        <textarea id="notas" name="notas" rows={2} className={inputClass} />
      </Campo>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-3.5 text-base font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
      >
        {isPending ? "Guardando…" : "Guardar alimentación"}
      </button>
    </form>
  );
}
