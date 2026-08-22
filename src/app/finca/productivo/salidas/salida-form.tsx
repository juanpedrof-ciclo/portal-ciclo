"use client";

import { useActionState, useMemo, useState } from "react";
import type { EstadoFormularioSalida } from "./actions";
import { Campo, inputClass } from "@/components/form-field";
import { DESTINO_SALIDA_LABELS, type AnimalEstado, type GrupoAnimal } from "@/lib/productivo/types";

export function SalidaForm({
  grupos,
  animales,
  action,
}: {
  grupos: GrupoAnimal[];
  animales: AnimalEstado[];
  action: (
    prevState: EstadoFormularioSalida,
    formData: FormData,
  ) => Promise<EstadoFormularioSalida>;
}) {
  const [state, formAction, isPending] = useActionState<EstadoFormularioSalida, FormData>(
    action,
    null,
  );
  const resetKey = state?.ts ?? 0;

  return (
    <SalidaFormCampos
      key={resetKey}
      grupos={grupos}
      animales={animales}
      formAction={formAction}
      isPending={isPending}
      error={state?.error ?? null}
    />
  );
}

function SalidaFormCampos({
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
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const grupo = grupos.find((g) => g.id === grupoId);
  const modo = grupo?.tipo_manejo ?? "";
  const animalesDelGrupo = useMemo(
    () => animales.filter((a) => a.grupo_id === grupoId),
    [animales, grupoId],
  );
  const hoy = new Date().toISOString().slice(0, 10);

  function alternar(id: string) {
    setSeleccionados((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(id)) siguiente.delete(id);
      else siguiente.add(id);
      return siguiente;
    });
  }

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
          onChange={(e) => {
            setGrupoId(e.target.value);
            setSeleccionados(new Set());
          }}
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
        <Campo label="Animales (chapetas)" htmlFor="animal_ids">
          {animalesDelGrupo.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No hay animales activos en este grupo.
            </p>
          ) : (
            <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-lg border border-zinc-300 p-2 dark:border-zinc-700">
              {animalesDelGrupo.map((a) => (
                <label
                  key={a.id}
                  className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm text-zinc-800 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <input
                    type="checkbox"
                    name="animal_ids"
                    value={a.id}
                    checked={seleccionados.has(a.id)}
                    onChange={() => alternar(a.id)}
                    className="size-4 rounded border-zinc-300 text-amber-600 focus:ring-amber-500 dark:border-zinc-700"
                  />
                  {a.chapeta}
                </label>
              ))}
            </div>
          )}
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Destino" htmlFor="destino">
          <select id="destino" name="destino" required defaultValue="" className={`${inputClass} py-3 text-base`}>
            <option value="" disabled>
              Selecciona el destino
            </option>
            {Object.entries(DESTINO_SALIDA_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Campo>

        <Campo label="Comprador (opcional)" htmlFor="comprador">
          <input id="comprador" name="comprador" className={`${inputClass} py-3 text-base`} />
        </Campo>
      </div>

      <Campo label="Notas (opcional)" htmlFor="notas">
        <textarea id="notas" name="notas" rows={2} className={inputClass} />
      </Campo>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isPending || !modo}
        className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-3.5 text-base font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
      >
        {isPending ? "Guardando…" : "Guardar salida"}
      </button>
    </form>
  );
}
