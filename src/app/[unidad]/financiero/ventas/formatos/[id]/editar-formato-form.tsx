"use client";

import { useActionState } from "react";
import { actualizarFormato, type EstadoFormularioFormato } from "../actions";
import { Campo, inputClass } from "@/components/form-field";
import type { FormatoCarga, MapeoColumnas, Unidad } from "@/lib/financiero/types";

const CAMPOS_REQUERIDOS: { clave: keyof MapeoColumnas; label: string }[] = [
  { clave: "cliente", label: "Cliente" },
  { clave: "producto", label: "Producto" },
  { clave: "id_orden", label: "ID de pedido" },
  { clave: "total", label: "Total" },
];

const CAMPOS_OPCIONALES: { clave: keyof MapeoColumnas; label: string }[] = [
  { clave: "telefono", label: "Teléfono" },
  { clave: "cantidad", label: "Cantidad" },
  { clave: "estado", label: "Estado" },
  { clave: "fecha", label: "Fecha (por pedido)" },
];

export function EditarFormatoForm({
  unidad,
  formato,
}: {
  unidad: Unidad;
  formato: FormatoCarga;
}) {
  const actualizarFormatoConId = actualizarFormato.bind(null, unidad, formato.id);
  const [state, formAction, isPending] = useActionState<
    EstadoFormularioFormato,
    FormData
  >(actualizarFormatoConId, null);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <Campo label="Nombre del formato" htmlFor="nombre">
        <input
          id="nombre"
          name="nombre"
          required
          defaultValue={formato.nombre}
          className={inputClass}
        />
      </Campo>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[...CAMPOS_REQUERIDOS, ...CAMPOS_OPCIONALES].map(({ clave, label }) => (
          <Campo key={clave} label={label} htmlFor={`mapeo_${clave}`}>
            <input
              id={`mapeo_${clave}`}
              name={`mapeo_${clave}`}
              defaultValue={formato.mapeo_columnas[clave] ?? ""}
              placeholder="Nombre de la columna en el archivo"
              className={inputClass}
            />
          </Campo>
        ))}
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      {state && state.error === null && (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">
          Cambios guardados.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-fit items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700 disabled:opacity-60"
      >
        {isPending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
