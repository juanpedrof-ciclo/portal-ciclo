"use client";

import { useActionState, useState } from "react";
import type { EstadoFormularioTarea } from "./actions";
import { Campo, inputClass } from "@/components/form-field";
import { PRIORIDAD_LABELS, type Trabajador } from "@/lib/productivo/types";

const NUEVO = "__nuevo__";

export function TareaForm({
  trabajadores,
  action,
}: {
  trabajadores: Trabajador[];
  action: (
    prevState: EstadoFormularioTarea,
    formData: FormData,
  ) => Promise<EstadoFormularioTarea>;
}) {
  const [state, formAction, isPending] = useActionState<EstadoFormularioTarea, FormData>(
    action,
    null,
  );
  const resetKey = state?.ts ?? 0;

  return (
    <TareaFormCampos
      key={resetKey}
      trabajadores={trabajadores}
      formAction={formAction}
      isPending={isPending}
      error={state?.error ?? null}
    />
  );
}

function TareaFormCampos({
  trabajadores,
  formAction,
  isPending,
  error,
}: {
  trabajadores: Trabajador[];
  formAction: (formData: FormData) => void;
  isPending: boolean;
  error: string | null;
}) {
  const [trabajadorId, setTrabajadorId] = useState("");
  const [nuevoNombre, setNuevoNombre] = useState("");

  return (
    <details className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-50">
        + Nueva tarea
      </summary>
      <form action={formAction} className="flex flex-col gap-4 border-t border-zinc-200 p-5 dark:border-zinc-800">
        <Campo label="Descripción" htmlFor="descripcion">
          <textarea id="descripcion" name="descripcion" rows={2} required className={inputClass} />
        </Campo>

        <Campo label="Responsable" htmlFor="trabajador_id">
          <select
            id="trabajador_id"
            name="trabajador_id"
            required
            value={trabajadorId}
            onChange={(e) => setTrabajadorId(e.target.value)}
            className={`${inputClass} py-3 text-base`}
          >
            <option value="" disabled>
              Selecciona el trabajador
            </option>
            {trabajadores.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
            <option value={NUEVO}>+ Nuevo trabajador…</option>
          </select>
          {trabajadorId === NUEVO && (
            <input
              name="nuevo_trabajador_nombre"
              placeholder="Nombre del trabajador"
              required
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              className={`${inputClass} mt-2 py-3 text-base`}
            />
          )}
        </Campo>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo label="Fecha límite" htmlFor="fecha_limite">
            <input
              id="fecha_limite"
              name="fecha_limite"
              type="date"
              required
              className={`${inputClass} py-3 text-base`}
            />
          </Campo>

          <Campo label="Prioridad" htmlFor="prioridad">
            <select id="prioridad" name="prioridad" defaultValue="media" className={`${inputClass} py-3 text-base`}>
              {Object.entries(PRIORIDAD_LABELS).map(([value, label]) => (
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

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex w-fit items-center justify-center rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
        >
          {isPending ? "Guardando…" : "Guardar tarea"}
        </button>
      </form>
    </details>
  );
}
