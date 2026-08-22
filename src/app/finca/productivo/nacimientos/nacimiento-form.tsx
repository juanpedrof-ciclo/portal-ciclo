"use client";

import { useActionState, useMemo, useState } from "react";
import type { EstadoFormularioNacimiento } from "./actions";
import { Campo, inputClass } from "@/components/form-field";
import type { AnimalEstado, GrupoAnimal } from "@/lib/productivo/types";

export function NacimientoForm({
  grupos,
  animales,
  action,
}: {
  grupos: GrupoAnimal[];
  animales: AnimalEstado[];
  action: (
    prevState: EstadoFormularioNacimiento,
    formData: FormData,
  ) => Promise<EstadoFormularioNacimiento>;
}) {
  const [state, formAction, isPending] = useActionState<
    EstadoFormularioNacimiento,
    FormData
  >(action, null);

  const resetKey = state?.ts ?? 0;

  return (
    <NacimientoFormCampos
      key={resetKey}
      grupos={grupos}
      animales={animales}
      formAction={formAction}
      isPending={isPending}
      error={state?.error ?? null}
    />
  );
}

function NacimientoFormCampos({
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
  const [criasVivas, setCriasVivas] = useState("1");
  const [criasMachos, setCriasMachos] = useState("0");
  const [criasHembras, setCriasHembras] = useState("1");

  const grupo = grupos.find((g) => g.id === grupoId);
  const modo = grupo?.tipo_manejo ?? "";
  const madresDelGrupo = useMemo(
    () => animales.filter((a) => a.grupo_id === grupoId),
    [animales, grupoId],
  );
  const hoy = new Date().toISOString().slice(0, 10);

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
        <>
          <Campo label="Madre (chapeta)" htmlFor="madre_id">
            <select
              id="madre_id"
              name="madre_id"
              required
              defaultValue=""
              className={`${inputClass} py-3 text-base`}
            >
              <option value="" disabled>
                {madresDelGrupo.length === 0 ? "No hay animales activos en este grupo" : "Selecciona la chapeta"}
              </option>
              {madresDelGrupo.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.chapeta}
                </option>
              ))}
            </select>
          </Campo>

          <div className="grid grid-cols-2 gap-4">
            <Campo label="N.° de crías nacidas" htmlFor="num_crias">
              <input
                id="num_crias"
                name="num_crias"
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                required
                defaultValue="1"
                className={`${inputClass} py-3 text-base`}
              />
            </Campo>
            <Campo label="Vivas" htmlFor="crias_vivas">
              <input
                id="crias_vivas"
                name="crias_vivas"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                required
                value={criasVivas}
                onChange={(e) => setCriasVivas(e.target.value)}
                className={`${inputClass} py-3 text-base`}
              />
            </Campo>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Campo label="Machos" htmlFor="crias_machos">
              <input
                id="crias_machos"
                name="crias_machos"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                required
                value={criasMachos}
                onChange={(e) => setCriasMachos(e.target.value)}
                className={`${inputClass} py-3 text-base`}
              />
            </Campo>
            <Campo label="Hembras" htmlFor="crias_hembras">
              <input
                id="crias_hembras"
                name="crias_hembras"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                required
                value={criasHembras}
                onChange={(e) => setCriasHembras(e.target.value)}
                className={`${inputClass} py-3 text-base`}
              />
            </Campo>
          </div>
          <p className="-mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Machos + hembras debe ser igual a las crías vivas ({criasVivas}).
          </p>

          {criasVivas === "1" && (
            <Campo label="Chapeta de la cría (opcional)" htmlFor="cria_chapeta">
              <input
                id="cria_chapeta"
                name="cria_chapeta"
                placeholder="Solo si le vas a poner chapeta propia ahora"
                className={`${inputClass} py-3 text-base`}
              />
            </Campo>
          )}
        </>
      )}

      {modo === "lote" && (
        <Campo label="Cantidad nacida" htmlFor="cantidad">
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

      <Campo label="Notas (opcional)" htmlFor="notas">
        <textarea id="notas" name="notas" rows={2} className={inputClass} />
      </Campo>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isPending || !modo}
        className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-3.5 text-base font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
      >
        {isPending ? "Guardando…" : "Guardar nacimiento"}
      </button>
    </form>
  );
}
