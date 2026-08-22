"use client";

import { useActionState, useMemo, useState } from "react";
import type { EstadoFormularioAnimal } from "./actions";
import { Campo, inputClass } from "@/components/form-field";
import type { AnimalEstado, GrupoAnimal } from "@/lib/productivo/types";

export function NuevoAnimalForm({
  grupos,
  animales,
  action,
}: {
  grupos: GrupoAnimal[];
  animales: AnimalEstado[];
  action: (
    prevState: EstadoFormularioAnimal,
    formData: FormData,
  ) => Promise<EstadoFormularioAnimal>;
}) {
  const [state, formAction, isPending] = useActionState<EstadoFormularioAnimal, FormData>(
    action,
    null,
  );
  const resetKey = state?.ts ?? 0;

  return (
    <NuevoAnimalFormCampos
      key={resetKey}
      grupos={grupos}
      animales={animales}
      formAction={formAction}
      isPending={isPending}
      error={state?.error ?? null}
    />
  );
}

function NuevoAnimalFormCampos({
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
  const madresDelGrupo = useMemo(
    () => animales.filter((a) => a.grupo_id === grupoId),
    [animales, grupoId],
  );
  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <details className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-50">
        + Nuevo animal
      </summary>
      <form action={formAction} className="flex flex-col gap-4 border-t border-zinc-200 p-5 dark:border-zinc-800">
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

        <Campo label="Chapeta" htmlFor="chapeta">
          <input id="chapeta" name="chapeta" required className={`${inputClass} py-3 text-base`} />
        </Campo>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo label="Fecha de nacimiento (opcional)" htmlFor="fecha_nacimiento">
            <input
              id="fecha_nacimiento"
              name="fecha_nacimiento"
              type="date"
              className={`${inputClass} py-3 text-base`}
            />
          </Campo>
          <Campo label="Fecha de ingreso" htmlFor="fecha_ingreso">
            <input
              id="fecha_ingreso"
              name="fecha_ingreso"
              type="date"
              required
              defaultValue={hoy}
              className={`${inputClass} py-3 text-base`}
            />
          </Campo>
        </div>

        {grupoId && (
          <Campo label="Madre (opcional)" htmlFor="madre_id">
            <select id="madre_id" name="madre_id" defaultValue="" className={`${inputClass} py-3 text-base`}>
              <option value="">Sin especificar</option>
              {madresDelGrupo.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.chapeta}
                </option>
              ))}
            </select>
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
          {isPending ? "Guardando…" : "Guardar animal"}
        </button>
      </form>
    </details>
  );
}
