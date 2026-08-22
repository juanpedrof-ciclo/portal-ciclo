"use client";

import { useActionState, useMemo, useState } from "react";
import type { EstadoFormularioMuerte } from "./actions";
import { Campo, inputClass } from "@/components/form-field";
import { CAUSA_MUERTE_LABELS, type AnimalEstado, type GrupoAnimal } from "@/lib/productivo/types";

export function MuerteForm({
  grupos,
  animales,
  action,
}: {
  grupos: GrupoAnimal[];
  animales: AnimalEstado[];
  action: (
    prevState: EstadoFormularioMuerte,
    formData: FormData,
  ) => Promise<EstadoFormularioMuerte>;
}) {
  const [state, formAction, isPending] = useActionState<EstadoFormularioMuerte, FormData>(
    action,
    null,
  );
  const resetKey = state?.ts ?? 0;

  return (
    <MuerteFormCampos
      key={resetKey}
      grupos={grupos}
      animales={animales}
      formAction={formAction}
      isPending={isPending}
      error={state?.error ?? null}
    />
  );
}

function MuerteFormCampos({
  grupos,
  animales,
  formAction,
  isPending,
  error,
}: {
  grupos: GrupoAnimal[];
  animales: AnimalEstado[];
  formAction: (formData: FormData) => void;
  isPending: boolean;
  error: string | null;
}) {
  const [grupoId, setGrupoId] = useState("");
  const grupo = grupos.find((g) => g.id === grupoId);
  const modo = grupo?.tipo_manejo ?? "";
  const animalesDelGrupo = useMemo(
    () => animales.filter((a) => a.grupo_id === grupoId),
    [animales, grupoId],
  );
  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <input type="hidden" name="modo" value={modo} />

      <Campo label="Grupo" htmlFor="grupo_id">
        <select
          id="grupo_id"
          name="grupo_id"
          required
          value={grupoId}
          onChange={(e) => setGrupoId(e.target.value)}
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

      {modo === "individual" && (
        <Campo label="Animal (chapeta)" htmlFor="animal_id">
          <select id="animal_id" name="animal_id" required defaultValue="" className={`${inputClass} py-3 text-base`}>
            <option value="" disabled>
              {animalesDelGrupo.length === 0 ? "No hay animales activos en este grupo" : "Selecciona la chapeta"}
            </option>
            {animalesDelGrupo.map((a) => (
              <option key={a.id} value={a.id}>
                {a.chapeta}
              </option>
            ))}
          </select>
        </Campo>
      )}

      {modo === "lote" && (
        <Campo label="Cantidad" htmlFor="cantidad">
          <input
            id="cantidad"
            name="cantidad"
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            required
            className={`${inputClass} py-3 text-base`}
          />
        </Campo>
      )}

      <Campo label="Causa" htmlFor="causa">
        <select id="causa" name="causa" required defaultValue="" className={`${inputClass} py-3 text-base`}>
          <option value="" disabled>
            Selecciona la causa
          </option>
          {Object.entries(CAUSA_MUERTE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Campo>

      <Campo label="Notas (opcional)" htmlFor="notas">
        <textarea id="notas" name="notas" rows={2} className={inputClass} />
      </Campo>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isPending || !modo}
        className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-3.5 text-base font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
      >
        {isPending ? "Guardando…" : "Guardar muerte"}
      </button>
    </form>
  );
}
