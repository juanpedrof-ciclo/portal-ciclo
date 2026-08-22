import { createClient } from "@/lib/supabase/server";
import { TareaForm } from "./tarea-form";
import { FiltroTareas } from "./filtro-tareas";
import { TareaAccionBoton } from "./tarea-accion-boton";
import {
  anularTarea,
  anularTareasLote,
  crearTarea,
  marcarTareaEnProceso,
  marcarTareaHecha,
  reabrirTarea,
} from "./actions";
import { AnularForm } from "@/components/anular-form";
import { SeleccionProvider } from "@/components/seleccion-provider";
import { CheckboxFila, CheckboxTodo } from "@/components/checkbox-seleccion";
import { AnularSeleccionadosBar } from "@/components/anular-seleccionados-bar";
import { ListaBuscador } from "@/components/lista-buscador";
import { ListaPaginacion } from "@/components/lista-paginacion";
import { ThOrdenable } from "@/components/lista-th-ordenable";
import { normalizarListaParams, patronIlike } from "@/lib/financiero/list-query";
import { formatFechaCorta } from "@/lib/financiero/types";
import { hoyISO } from "@/lib/productivo/dates";
import { obtenerTrabajadores } from "@/lib/productivo/consultas";
import {
  ESTADO_TAREA_LABELS,
  PRIORIDAD_LABELS,
  type EstadoTarea,
  type Prioridad,
  type Tarea,
} from "@/lib/productivo/types";

export const metadata = { title: "Tareas · Módulo Productivo" };

const RUTA = "/finca/productivo/tareas";
const COLUMNAS_ORDEN = ["fecha_limite", "prioridad", "estado"] as const;

const PRIORIDAD_BADGE: Record<Prioridad, string> = {
  alta: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  media: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  baja: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
};

const ESTADO_BADGE: Record<EstadoTarea, string> = {
  pendiente: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  en_proceso: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  hecha: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
};

export default async function TareasPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; sort?: string; dir?: string; trabajador?: string; estado?: string }>;
}) {
  const sp = await searchParams;
  const { page, sort, dir, q, desde, hasta, paramsBase } = normalizarListaParams(sp, {
    columnas: COLUMNAS_ORDEN,
    ordenPorDefecto: "fecha_limite",
    dirPorDefecto: "asc",
  });
  const trabajadorFiltro = sp.trabajador ?? "";
  const estadoFiltro = sp.estado ?? "";
  if (trabajadorFiltro) paramsBase.trabajador = trabajadorFiltro;
  if (estadoFiltro) paramsBase.estado = estadoFiltro;

  const supabase = await createClient();
  const [trabajadores, trabajadoresActivos] = await Promise.all([
    obtenerTrabajadores(supabase),
    obtenerTrabajadores(supabase, { soloActivos: true }),
  ]);
  const trabajadoresPorId = Object.fromEntries(trabajadores.map((t) => [t.id, t.nombre]));
  const hoy = hoyISO();

  let query = supabase.from("tareas").select("*", { count: "exact" }).eq("anulado", false);
  if (q) query = query.ilike("descripcion", patronIlike(q));
  if (trabajadorFiltro) query = query.eq("trabajador_id", trabajadorFiltro);
  if (estadoFiltro === "vencida") {
    query = query.neq("estado", "hecha").lt("fecha_limite", hoy);
  } else if (estadoFiltro) {
    query = query.eq("estado", estadoFiltro);
  }

  const { data: tareas, count } = await query
    .order(sort, { ascending: dir === "asc" })
    .range(desde, hasta)
    .returns<Tarea[]>();

  const idsVisibles = (tareas ?? []).map((t) => t.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Tareas</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Actividades asignadas a los trabajadores de la finca.
        </p>
      </div>

      <TareaForm trabajadores={trabajadoresActivos} action={crearTarea} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ListaBuscador basePath={RUTA} params={paramsBase} valorInicial={q} placeholder="Buscar por descripción…" />
        <FiltroTareas
          basePath={RUTA}
          params={paramsBase}
          trabajadores={trabajadores}
          trabajadorActual={trabajadorFiltro}
          estadoActual={estadoFiltro}
        />
      </div>

      <SeleccionProvider idsVisibles={idsVisibles}>
        <AnularSeleccionadosBar idsVisibles={idsVisibles} action={anularTareasLote} />

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <CheckboxTodo ids={idsVisibles} />
                  </th>
                  <th className="px-4 py-3 font-medium">Descripción</th>
                  <th className="px-4 py-3 font-medium">Responsable</th>
                  <ThOrdenable basePath={RUTA} params={paramsBase} campo="fecha_limite" label="Fecha límite" sortActual={sort} dirActual={dir} />
                  <ThOrdenable basePath={RUTA} params={paramsBase} campo="prioridad" label="Prioridad" sortActual={sort} dirActual={dir} />
                  <ThOrdenable basePath={RUTA} params={paramsBase} campo="estado" label="Estado" sortActual={sort} dirActual={dir} />
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {!tareas || tareas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                      {q || trabajadorFiltro || estadoFiltro
                        ? "No se encontraron tareas para ese filtro."
                        : "Aún no hay tareas registradas."}
                    </td>
                  </tr>
                ) : (
                  tareas.map((t) => {
                    const vencida = t.estado !== "hecha" && t.fecha_limite < hoy;
                    return (
                      <tr key={t.id}>
                        <td className="px-4 py-3">
                          <CheckboxFila id={t.id} />
                        </td>
                        <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                          {t.descripcion}
                          {t.notas && <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{t.notas}</p>}
                        </td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                          {trabajadoresPorId[t.trabajador_id] ?? "—"}
                        </td>
                        <td className={`px-4 py-3 ${vencida ? "font-medium text-red-600 dark:text-red-400" : "text-zinc-600 dark:text-zinc-300"}`}>
                          {formatFechaCorta(t.fecha_limite)}
                          {vencida && " · Vencida"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORIDAD_BADGE[t.prioridad]}`}>
                            {PRIORIDAD_LABELS[t.prioridad]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_BADGE[t.estado]}`}>
                            {ESTADO_TAREA_LABELS[t.estado]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col items-end gap-1.5">
                            {t.estado === "pendiente" && (
                              <TareaAccionBoton
                                id={t.id}
                                action={marcarTareaEnProceso}
                                label="Marcar en proceso"
                                pendingLabel="Guardando…"
                                className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                              />
                            )}
                            {t.estado !== "hecha" && (
                              <TareaAccionBoton
                                id={t.id}
                                action={marcarTareaHecha}
                                label="Marcar hecha"
                                pendingLabel="Guardando…"
                                className="text-xs font-medium text-green-600 hover:underline dark:text-green-400"
                              />
                            )}
                            {t.estado === "hecha" && (
                              <TareaAccionBoton
                                id={t.id}
                                action={reabrirTarea}
                                label="Reabrir"
                                pendingLabel="Guardando…"
                                className="text-xs font-medium text-zinc-500 hover:underline dark:text-zinc-400"
                              />
                            )}
                            <AnularForm id={t.id} action={anularTarea} mensaje="¿Seguro que deseas anular esta tarea?" />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <ListaPaginacion basePath={RUTA} params={paramsBase} page={page} total={count ?? 0} />
        </div>
      </SeleccionProvider>
    </div>
  );
}
