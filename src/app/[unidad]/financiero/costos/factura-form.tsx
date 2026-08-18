"use client";

import { useActionState, useRef, useState } from "react";
import type { EstadoFormularioFactura } from "./actions";
import { Campo, inputClass } from "@/components/form-field";
import { CATEGORIA_LABELS } from "@/lib/financiero/types";
import type { Categoria, Proveedor, Unidad } from "@/lib/financiero/types";

const NUEVO = "__nuevo__";

type DatosFacturaExtraidos = {
  proveedor: string | null;
  fecha: string | null;
  monto: number | null;
  numero_factura: string | null;
};

export function FacturaForm({
  unidad,
  action,
  proveedores,
  categorias,
}: {
  unidad: Unidad;
  action: (
    prevState: EstadoFormularioFactura,
    formData: FormData,
  ) => Promise<EstadoFormularioFactura>;
  proveedores: Proveedor[];
  categorias: Categoria[];
}) {
  const [state, formAction, isPending] = useActionState<
    EstadoFormularioFactura,
    FormData
  >(action, null);

  const resetKey = state?.ts ? state.ts : 0;

  return (
    <FacturaFormCampos
      key={resetKey}
      unidad={unidad}
      formAction={formAction}
      isPending={isPending}
      error={state?.error ?? null}
      advertenciaDuplicado={state?.advertenciaDuplicado ?? null}
      proveedores={proveedores}
      categorias={categorias}
    />
  );
}

function FacturaFormCampos({
  unidad,
  formAction,
  isPending,
  error,
  advertenciaDuplicado,
  proveedores,
  categorias,
}: {
  unidad: Unidad;
  formAction: (formData: FormData) => void;
  isPending: boolean;
  error: string | null;
  advertenciaDuplicado: string | null;
  proveedores: Proveedor[];
  categorias: Categoria[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [forzarGuardado, setForzarGuardado] = useState(false);
  const [proveedorId, setProveedorId] = useState("");
  const [nuevoProveedorNombre, setNuevoProveedorNombre] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [fecha, setFecha] = useState("");
  const [monto, setMonto] = useState("");
  const [numeroFactura, setNumeroFactura] = useState("");

  const [leyendoIA, setLeyendoIA] = useState(false);
  const [errorIA, setErrorIA] = useState<string | null>(null);
  const [completadoPorIA, setCompletadoPorIA] = useState(false);

  async function onArchivoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setErrorIA(null);
    setCompletadoPorIA(false);
    if (!file) return;

    setLeyendoIA(true);
    try {
      const fd = new FormData();
      fd.append("archivo", file);
      const res = await fetch(`/${unidad}/financiero/costos/leer-factura`, {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorIA(json.error ?? "No se pudo leer la factura.");
        return;
      }

      const datos = json as DatosFacturaExtraidos;
      if (datos.fecha) setFecha(datos.fecha);
      if (typeof datos.monto === "number") setMonto(String(datos.monto));
      if (datos.numero_factura) setNumeroFactura(datos.numero_factura);

      if (datos.proveedor) {
        const nombreNormalizado = datos.proveedor.trim().toLowerCase();
        const coincidencia = proveedores.find(
          (p) => p.nombre.trim().toLowerCase() === nombreNormalizado,
        );
        if (coincidencia) {
          setProveedorId(coincidencia.id);
        } else {
          setProveedorId(NUEVO);
          setNuevoProveedorNombre(datos.proveedor);
        }
      }

      setCompletadoPorIA(true);
    } catch {
      setErrorIA("No se pudo leer la factura.");
    } finally {
      setLeyendoIA(false);
    }
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <input type="hidden" name="forzar_guardado" value={forzarGuardado ? "true" : "false"} />

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
              value={nuevoProveedorNombre}
              onChange={(e) => setNuevoProveedorNombre(e.target.value)}
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
          <input
            id="fecha"
            name="fecha"
            type="date"
            required
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className={inputClass}
          />
        </Campo>
        <Campo label="Monto" htmlFor="monto">
          <input
            id="monto"
            name="monto"
            type="number"
            min="0"
            step="0.01"
            required
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Número de factura (opcional)" htmlFor="numero_factura">
          <input
            id="numero_factura"
            name="numero_factura"
            value={numeroFactura}
            onChange={(e) => {
              setNumeroFactura(e.target.value);
              setForzarGuardado(false);
            }}
            className={inputClass}
          />
        </Campo>

        <Campo label="Factura (PDF/imagen, opcional)" htmlFor="soporte">
          <input
            id="soporte"
            name="soporte"
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            onChange={onArchivoChange}
            className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-amber-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white`}
          />
          {leyendoIA && (
            <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              Leyendo factura con IA…
            </p>
          )}
          {errorIA && (
            <p className="mt-1.5 text-sm text-amber-600 dark:text-amber-400">
              {errorIA} Puedes completar los datos manualmente.
            </p>
          )}
          {completadoPorIA && !errorIA && (
            <p className="mt-1.5 text-sm text-emerald-600 dark:text-emerald-400">
              Datos completados automáticamente — revisa antes de guardar.
            </p>
          )}
        </Campo>
      </div>

      <Campo label="Notas (opcional)" htmlFor="notas">
        <textarea id="notas" name="notas" rows={2} className={inputClass} />
      </Campo>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {advertenciaDuplicado && (
        <div className="flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          <p>{advertenciaDuplicado}</p>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              setForzarGuardado(true);
              requestAnimationFrame(() => formRef.current?.requestSubmit());
            }}
            className="inline-flex w-fit items-center justify-center rounded-lg border border-amber-600 px-3 py-1.5 text-sm font-medium text-amber-800 transition hover:bg-amber-100 disabled:opacity-60 dark:text-amber-300 dark:hover:bg-amber-900/40"
          >
            Guardar de todos modos
          </button>
        </div>
      )}

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
