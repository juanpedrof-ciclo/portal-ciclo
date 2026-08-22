"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { obtenerOCrearTrabajador } from "@/lib/productivo/entidades";
import type { Prioridad } from "@/lib/productivo/types";
import type { ResultadoAnulacionLote } from "@/lib/financiero/anulacion-lote";

export type EstadoFormularioTarea = { error: string | null; ts?: number } | null;

const RUTA = "/finca/productivo/tareas";
const NUEVO = "__nuevo__";

function revalidarTodo() {
  revalidatePath(RUTA);
  revalidatePath("/finca/productivo");
}

export async function crearTarea(
  _prevState: EstadoFormularioTarea,
  formData: FormData,
): Promise<EstadoFormularioTarea> {
  const supabase = await createClient();

  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const trabajadorSeleccionado = String(formData.get("trabajador_id") ?? "");
  const nuevoTrabajadorNombre = String(formData.get("nuevo_trabajador_nombre") ?? "").trim();
  const fecha_limite = String(formData.get("fecha_limite") ?? "");
  const prioridad = String(formData.get("prioridad") ?? "media") as Prioridad;
  const notas = String(formData.get("notas") ?? "").trim() || null;

  if (!descripcion) return { error: "Escribe la descripción de la tarea." };
  if (!trabajadorSeleccionado) return { error: "Selecciona o crea el responsable." };
  if (trabajadorSeleccionado === NUEVO && !nuevoTrabajadorNombre) {
    return { error: "Escribe el nombre del trabajador." };
  }
  if (!fecha_limite) return { error: "Selecciona la fecha límite." };
  if (!["alta", "media", "baja"].includes(prioridad)) return { error: "Selecciona la prioridad." };

  let trabajador_id = trabajadorSeleccionado;
  if (trabajadorSeleccionado === NUEVO) {
    try {
      trabajador_id = await obtenerOCrearTrabajador(supabase, nuevoTrabajadorNombre);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Error inesperado." };
    }
  }

  const { error } = await supabase
    .from("tareas")
    .insert({ descripcion, trabajador_id, fecha_limite, prioridad, notas });
  if (error) return { error: `No se pudo crear la tarea: ${error.message}` };

  revalidarTodo();
  return { error: null, ts: Date.now() };
}

export async function marcarTareaEnProceso(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("tareas").update({ estado: "en_proceso" }).eq("id", id);
  if (error) return { error: `No se pudo actualizar la tarea: ${error.message}` };
  revalidarTodo();
  return { error: null };
}

export async function marcarTareaHecha(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const hoy = new Date().toISOString().slice(0, 10);
  const { error } = await supabase
    .from("tareas")
    .update({ estado: "hecha", fecha_cumplida: hoy })
    .eq("id", id);
  if (error) return { error: `No se pudo marcar la tarea como hecha: ${error.message}` };
  revalidarTodo();
  return { error: null };
}

export async function reabrirTarea(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tareas")
    .update({ estado: "pendiente", fecha_cumplida: null })
    .eq("id", id);
  if (error) return { error: `No se pudo reabrir la tarea: ${error.message}` };
  revalidarTodo();
  return { error: null };
}

export async function anularTarea(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("tareas")
    .update({ anulado: true, anulado_at: new Date().toISOString(), anulado_por: user?.id ?? null })
    .eq("id", id);
  if (error) return { error: `No se pudo anular la tarea: ${error.message}` };

  revalidarTodo();
  return { error: null };
}

export async function anularTareasLote(ids: string[]): Promise<ResultadoAnulacionLote> {
  if (ids.length === 0) return { anulados: 0, bloqueados: [] };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("tareas")
    .update({ anulado: true, anulado_at: new Date().toISOString(), anulado_por: user?.id ?? null })
    .in("id", ids);

  if (error) {
    return {
      anulados: 0,
      bloqueados: ids.map((id) => ({ id, referencia: `Tarea ${id}`, motivo: `error al anular: ${error.message}` })),
    };
  }

  revalidarTodo();
  return { anulados: ids.length, bloqueados: [] };
}
