"use client";

import { useActionState, useState } from "react";
import type { EstadoFormularioInsumo } from "./actions";
import { Campo, inputClass } from "@/components/form-field";
import { UNIDAD_MEDIDA_LABELS, type InsumoCategoria } from "@/lib/productivo/types";

const NUEVO = "__nuevo__";

export function NuevoInsumoForm({
  categorias,
  action,
}: {
  categorias: InsumoCategoria[];
  action: (
    prevState: EstadoFormularioInsumo,
    formData: FormData,
  ) => Promise<EstadoFormularioInsumo>;
}) {
  const [state, formAction, isPending] = useActionState<EstadoFormularioInsumo, FormData>(
    action,
    null,
  );
  const resetKey = state?.ts ?? 0;
  const [categoriaId, setCategoriaId] = useState("");
  const [nuevaCategoriaNombre, setNuevaCategoriaNombre] = useState("");

  return (
    <details key={resetKey} className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-50">
        + Nuevo insumo
      </summary>
      <form action={formAction} className="flex flex-col gap-4 border-t border-zinc-200 p-5 dark:border-zinc-800">
        <Campo label="Nombre" htmlFor="nombre">
          <input id="nombre" name="nombre" required className={`${inputClass} py-3 text-base`} />
        </Campo>

        <Campo label="Categoría" htmlFor="categoria_id">
          <select
            id="categoria_id"
            name="categoria_id"
            required
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className={`${inputClass} py-3 text-base`}
          >
            <option value="" disabled>
              Selecciona una categoría
            </option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
            <option value={NUEVO}>+ Nueva categoría…</option>
          </select>
          {categoriaId === NUEVO && (
            <input
              name="nueva_categoria_nombre"
              placeholder="Nombre de la categoría"
              required
              value={nuevaCategoriaNombre}
              onChange={(e) => setNuevaCategoriaNombre(e.target.value)}
              className={`${inputClass} mt-2 py-3 text-base`}
            />
          )}
        </Campo>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo label="Unidad de medida" htmlFor="unidad_medida">
            <select id="unidad_medida" name="unidad_medida" required defaultValue="" className={`${inputClass} py-3 text-base`}>
              <option value="" disabled>
                Selecciona
              </option>
              {Object.entries(UNIDAD_MEDIDA_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Campo>

          <Campo label="Stock mínimo (opcional)" htmlFor="stock_minimo">
            <input
              id="stock_minimo"
              name="stock_minimo"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              placeholder="Alerta cuando baje de aquí"
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
          disabled={isPending}
          className="inline-flex w-fit items-center justify-center rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
        >
          {isPending ? "Guardando…" : "Guardar insumo"}
        </button>
      </form>
    </details>
  );
}
