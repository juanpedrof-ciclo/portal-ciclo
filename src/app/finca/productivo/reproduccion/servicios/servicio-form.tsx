"use client";

import { useActionState, useState } from "react";
import type { EstadoFormularioServicio } from "./actions";
import { Campo, inputClass } from "@/components/form-field";
import { TIPO_SERVICIO_LABELS, type AnimalEstado, type Reproductor } from "@/lib/productivo/types";

const NUEVO = "__nuevo__";

export function ServicioForm({
  animales,
  reproductores,
  action,
}: {
  animales: AnimalEstado[];
  reproductores: Reproductor[];
  action: (
    prevState: EstadoFormularioServicio,
    formData: FormData,
  ) => Promise<EstadoFormularioServicio>;
}) {
  const [state, formAction, isPending] = useActionState<EstadoFormularioServicio, FormData>(
    action,
    null,
  );
  const resetKey = state?.ts ?? 0;

  return (
    <ServicioFormCampos
      key={resetKey}
      animales={animales}
      reproductores={reproductores}
      formAction={formAction}
      isPending={isPending}
      error={state?.error ?? null}
    />
  );
}

function ServicioFormCampos({
  animales,
  reproductores,
  formAction,
  isPending,
  error,
}: {
  animales: AnimalEstado[];
  reproductores: Reproductor[];
  formAction: (formData: FormData) => void;
  isPending: boolean;
  error: string | null;
}) {
  const [reproductorId, setReproductorId] = useState("");
  const [nuevoNombre, setNuevoNombre] = useState("");
  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <form
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

        <Campo label="Tipo" htmlFor="tipo">
          <select id="tipo" name="tipo" required defaultValue="" className={`${inputClass} py-3 text-base`}>
            <option value="" disabled>
              Selecciona
            </option>
            {Object.entries(TIPO_SERVICIO_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <Campo label="Reproductor (opcional)" htmlFor="reproductor_id">
        <select
          id="reproductor_id"
          name="reproductor_id"
          value={reproductorId}
          onChange={(e) => setReproductorId(e.target.value)}
          className={`${inputClass} py-3 text-base`}
        >
          <option value="">Sin especificar</option>
          {reproductores.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
          <option value={NUEVO}>+ Nuevo reproductor…</option>
        </select>
        {reproductorId === NUEVO && (
          <input
            name="nuevo_reproductor_nombre"
            placeholder="Nombre del toro/verraco"
            required
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            className={`${inputClass} mt-2 py-3 text-base`}
          />
        )}
      </Campo>

      <Campo label="Notas (opcional)" htmlFor="notas">
        <textarea id="notas" name="notas" rows={2} className={inputClass} />
      </Campo>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-3.5 text-base font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
      >
        {isPending ? "Guardando…" : "Guardar servicio"}
      </button>
    </form>
  );
}
