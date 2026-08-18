"use client";

import { useActionState, useState } from "react";
import type { EstadoFormularioCarga } from "./actions";
import { Campo, inputClass } from "@/components/form-field";
import { CANAL_LABELS, formatCOP } from "@/lib/financiero/types";
import type { MapeoColumnas, Unidad } from "@/lib/financiero/types";

const SIN_MAPEAR = "";

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

type Deteccion = {
  encabezados: string[];
  totalFilas: number;
  sugerencia: { id: string; nombre: string; mapeo: MapeoColumnas } | null;
};

export function CargaForm({
  unidad,
  action,
}: {
  unidad: Unidad;
  action: (
    prevState: EstadoFormularioCarga,
    formData: FormData,
  ) => Promise<EstadoFormularioCarga>;
}) {
  const [state, formAction, isPending] = useActionState<
    EstadoFormularioCarga,
    FormData
  >(action, null);

  const resetKey = state && state.error === null ? state.ts : 0;

  return (
    <CargaFormCampos
      key={resetKey}
      unidad={unidad}
      formAction={formAction}
      isPending={isPending}
      error={state?.error ?? null}
      resumen={state && state.error === null ? state.resumen ?? null : null}
    />
  );
}

function CargaFormCampos({
  unidad,
  formAction,
  isPending,
  error,
  resumen,
}: {
  unidad: Unidad;
  formAction: (formData: FormData) => void;
  isPending: boolean;
  error: string | null;
  resumen: import("./actions").ResumenCarga | null;
}) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [deteccion, setDeteccion] = useState<Deteccion | null>(null);
  const [detectando, setDetectando] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [mapeo, setMapeo] = useState<Partial<MapeoColumnas>>({});
  const [nombreFormato, setNombreFormato] = useState("");
  const [formatoIdExistente, setFormatoIdExistente] = useState("");
  const [guardarFormato, setGuardarFormato] = useState(true);

  async function onArchivoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setArchivo(file);
    setDeteccion(null);
    setDetectError(null);
    setMapeo({});
    setNombreFormato("");
    setFormatoIdExistente("");
    if (!file) return;

    setDetectando(true);
    try {
      const fd = new FormData();
      fd.append("archivo", file);
      const res = await fetch(`/${unidad}/financiero/ventas/detectar-columnas`, {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) {
        setDetectError(json.error ?? "No se pudo leer el archivo.");
      } else {
        setDeteccion(json);
        if (json.sugerencia) {
          setMapeo(json.sugerencia.mapeo);
          setNombreFormato(json.sugerencia.nombre);
          setFormatoIdExistente(json.sugerencia.id);
          setGuardarFormato(false);
        }
      }
    } catch {
      setDetectError("No se pudo leer el archivo.");
    } finally {
      setDetectando(false);
    }
  }

  const listo =
    !!archivo &&
    !!deteccion &&
    !!mapeo.cliente &&
    !!mapeo.producto &&
    !!mapeo.id_orden &&
    !!mapeo.total &&
    nombreFormato.trim().length > 0;

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <input type="hidden" name="mapeo" value={JSON.stringify(mapeo)} />
      <input type="hidden" name="formato_id_existente" value={formatoIdExistente} />

      <Campo label="Archivo de ventas (.xlsx, .xls o .csv)" htmlFor="archivo">
        <input
          id="archivo"
          name="archivo"
          type="file"
          accept=".xlsx,.xls,.csv"
          required
          onChange={onArchivoChange}
          className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-amber-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white`}
        />
        {detectando && (
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            Leyendo columnas…
          </p>
        )}
        {detectError && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{detectError}</p>
        )}
        {deteccion && (
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            {deteccion.totalFilas} filas detectadas.{" "}
            {deteccion.sugerencia
              ? `Formato reconocido: "${deteccion.sugerencia.nombre}".`
              : "No coincide con ningún formato guardado; mapea las columnas."}
          </p>
        )}
      </Campo>

      {deteccion && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[...CAMPOS_REQUERIDOS, ...CAMPOS_OPCIONALES].map(({ clave, label }) => (
              <Campo key={clave} label={label} htmlFor={`mapeo-${clave}`}>
                <select
                  id={`mapeo-${clave}`}
                  value={mapeo[clave] ?? SIN_MAPEAR}
                  onChange={(e) =>
                    setMapeo((prev) => ({ ...prev, [clave]: e.target.value || undefined }))
                  }
                  className={inputClass}
                >
                  <option value={SIN_MAPEAR}>
                    {CAMPOS_REQUERIDOS.some((c) => c.clave === clave)
                      ? "Selecciona la columna…"
                      : "No aplica"}
                  </option>
                  {deteccion.encabezados.map((encabezado) => (
                    <option key={encabezado} value={encabezado}>
                      {encabezado}
                    </option>
                  ))}
                </select>
              </Campo>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo label="Nombre del formato (ej. Menú)" htmlFor="nombre_formato">
              <input
                id="nombre_formato"
                name="nombre_formato"
                required
                value={nombreFormato}
                onChange={(e) => setNombreFormato(e.target.value)}
                className={inputClass}
              />
            </Campo>
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                name="guardar_formato"
                checked={guardarFormato}
                onChange={(e) => setGuardarFormato(e.target.checked)}
                className="size-4 rounded border-zinc-300 dark:border-zinc-700"
              />
              Guardar/actualizar este mapeo para reusarlo
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo label="Fecha del despacho/venta" htmlFor="fecha_lote">
              <input
                id="fecha_lote"
                name="fecha_lote"
                type="date"
                required
                className={inputClass}
              />
              <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                Se usa como respaldo si un pedido no trae fecha propia.
              </p>
            </Campo>
            <Campo label="Canal (opcional)" htmlFor="canal">
              <select id="canal" name="canal" defaultValue="" className={inputClass}>
                <option value="">Sin especificar</option>
                {Object.entries(CANAL_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Campo>
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {resumen && (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
          <p>
            {resumen.pedidos} pedidos cargados · {formatCOP(resumen.montoTotal)} ·{" "}
            {resumen.clientesNuevos} clientes nuevos.
          </p>
          {resumen.advertencias.map((a) => (
            <p key={a} className="mt-1 text-amber-700 dark:text-amber-400">
              ⚠ {a}
            </p>
          ))}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !listo}
        className="inline-flex w-fit items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700 disabled:opacity-60"
      >
        {isPending ? "Procesando…" : "Procesar archivo"}
      </button>
    </form>
  );
}
