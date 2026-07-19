"use client";

import { useActionState, useState } from "react";
import { crearFactura, type EstadoFormularioFactura } from "./actions";
import { Campo, inputClass } from "@/components/form-field";
import { CATEGORIA_LABELS } from "@/lib/financiero/types";
import type { Categoria, Proveedor } from "@/lib/financiero/types";

const NUEVO = "__nuevo__";

export function FacturaForm({
  proveedores,
  categorias,
}: {
  proveedores: Proveedor[];
  categorias: Categoria[];
}) {
  const [state, formAction, isPending] = useActionState<
    EstadoFormularioFactura,
    FormData
  >(crearFactura, null);

  const resetKey = state && state.error === null ? state.ts : 0;

  return (
    <FacturaFormCampos
      key={resetKey}
      formAction={formAction}
      isPending={isPending}
      error={state?.error ?? null}
      proveedores={proveedores}
      categorias={categorias}
    />
  );
}

function FacturaFormCampos({
  formAction,
  isPending,
  error,
  proveedores,
  categorias,
}: {
  formAction: (formData: FormData) => void;
  isPending: boolean;
  error: string | null;
  proveedores: Proveedor[];
  categorias: Categoria[];
}) {
  const [proveedorId, setProveedorId] = useState("");
  const [categoriaId, setCategoriaId] = useState("");

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Proveedor" htmlFor="proveedor_id">
          <select
            id="proveedor_id"
            name="proveedor_id"
            required
            value={proveedorId}
            onChange={(e) => setProveedorId(e.target.value)}
            className={inputClass}
          >
            <option value="" disabled>
              Selecciona un proveedor
            </option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
            <option value={NUEVO}>+ Nuevo proveedor…</option>
          </select>
          {proveedorId === NUEVO && (
            <input
              name="nuevo_proveedor_nombre"
              placeholder="Nombre del proveedor"
              required
              className={`${inputClass} mt-2`}
            />
          )}
        </Campo>

        <Campo label="Categoría" htmlFor="categoria_id">
          <select
            id="categoria_id"
            name="categoria_id"
            required
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className={inputClass}
          >
            <option value="" disabled>
              Selecciona una categoría
            </option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({CATEGORIA_LABELS[c.tipo_pl]})
              </option>
            ))}
            <option value={NUEVO}>+ Nueva categoría…</option>
          </select>
          {categoriaId === NUEVO && (
            <div className="mt-2 flex flex-col gap-2">
              <input
                name="nueva_categoria_nombre"
                placeholder="Nombre de la categoría"
                required
                className={inputClass}
              />
              <select
                name="nueva_categoria_tipo_pl"
                required
                defaultValue=""
                className={inputClass}
              >
                <option value="" disabled>
                  Grupo del P&amp;G
                </option>
                {Object.entries(CATEGORIA_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </Campo>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Campo label="Fecha" htmlFor="fecha">
          <input id="fecha" name="fecha" type="date" required className={inputClass} />
        </Campo>
        <Campo label="Monto" htmlFor="monto">
          <input
            id="monto"
            name="monto"
            type="number"
            min="0"
            step="0.01"
            required
            className={inputClass}
          />
        </Campo>
        <Campo label="Estado" htmlFor="estado">
          <select id="estado" name="estado" defaultValue="pendiente" className={inputClass}>
            <option value="pendiente">Pendiente</option>
            <option value="pagado">Pagado</option>
          </select>
        </Campo>
      </div>

      <Campo label="Soporte (PDF/imagen, opcional)" htmlFor="soporte">
        <input
          id="soporte"
          name="soporte"
          type="file"
          accept="application/pdf,image/*"
          className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-amber-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white`}
        />
      </Campo>

      <Campo label="Notas (opcional)" htmlFor="notas">
        <textarea id="notas" name="notas" rows={2} className={inputClass} />
      </Campo>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-fit items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700 disabled:opacity-60"
      >
        {isPending ? "Guardando…" : "Guardar factura"}
      </button>
    </form>
  );
}
