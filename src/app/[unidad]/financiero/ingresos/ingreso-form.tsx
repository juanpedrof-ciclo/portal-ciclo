"use client";

import { useActionState, useState } from "react";
import type { EstadoFormularioIngreso } from "./actions";
import { CANAL_LABELS, formatCOP, type Unidad } from "@/lib/financiero/types";
import { Campo, inputClass } from "@/components/form-field";

type Deteccion = {
  valor: number;
  ubicacion: string;
  confianza: "etiqueta" | "estimado";
} | null;

export function IngresoForm({
  unidad,
  action,
}: {
  unidad: Unidad;
  action: (
    prevState: EstadoFormularioIngreso,
    formData: FormData,
  ) => Promise<EstadoFormularioIngreso>;
}) {
  const [state, formAction, isPending] = useActionState<
    EstadoFormularioIngreso,
    FormData
  >(action, null);

  const resetKey = state && state.error === null ? state.ts : 0;

  return (
    <IngresoFormCampos
      key={resetKey}
      unidad={unidad}
      formAction={formAction}
      isPending={isPending}
      error={state?.error ?? null}
    />
  );
}

function IngresoFormCampos({
  unidad,
  formAction,
  isPending,
  error,
}: {
  unidad: Unidad;
  formAction: (formData: FormData) => void;
  isPending: boolean;
  error: string | null;
}) {
  const [modo, setModo] = useState<"manual" | "excel">("manual");
  const [deteccion, setDeteccion] = useState<Deteccion>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [montoValue, setMontoValue] = useState("");

  async function onArchivoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setDeteccion(null);
    setParseError(null);
    if (!file) return;

    setParsing(true);
    try {
      const fd = new FormData();
      fd.append("archivo", file);
      const res = await fetch(`/${unidad}/financiero/ingresos/parse-excel`, {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) {
        setParseError(json.error ?? "No se pudo leer el archivo.");
      } else {
        setDeteccion(json);
        setMontoValue(String(json.valor));
      }
    } catch {
      setParseError("No se pudo leer el archivo.");
    } finally {
      setParsing(false);
    }
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <input type="hidden" name="origen" value={modo} />

      <div className="inline-flex w-fit rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
        <button
          type="button"
          onClick={() => setModo("manual")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            modo === "manual"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          Escribir total
        </button>
        <button
          type="button"
          onClick={() => setModo("excel")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            modo === "excel"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          Subir Excel
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Fecha" htmlFor="fecha">
          <input
            id="fecha"
            name="fecha"
            type="date"
            required
            className={inputClass}
          />
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

      {modo === "excel" && (
        <Campo label="Archivo Excel (.xlsx)" htmlFor="archivo">
          <input
            id="archivo"
            name="archivo"
            type="file"
            accept=".xlsx,.xls"
            required
            onChange={onArchivoChange}
            className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-amber-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white`}
          />
          {parsing && (
            <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              Leyendo archivo…
            </p>
          )}
          {parseError && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
              {parseError}
            </p>
          )}
          {deteccion && (
            <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              Detectado en <code>{deteccion.ubicacion}</code>:{" "}
              <strong className="text-zinc-800 dark:text-zinc-200">
                {formatCOP(deteccion.valor)}
              </strong>
              . Revisa el monto antes de guardar.
            </p>
          )}
        </Campo>
      )}

      <Campo label="Monto total" htmlFor="monto_total">
        <input
          id="monto_total"
          name="monto_total"
          type="number"
          min="0"
          step="0.01"
          required
          value={montoValue}
          onChange={(e) => setMontoValue(e.target.value)}
          className={inputClass}
        />
      </Campo>

      <Campo label="Notas (opcional)" htmlFor="notas">
        <textarea id="notas" name="notas" rows={2} className={inputClass} />
      </Campo>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isPending || parsing}
        className="inline-flex w-fit items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700 disabled:opacity-60"
      >
        {isPending ? "Guardando…" : "Guardar ingreso"}
      </button>
    </form>
  );
}
