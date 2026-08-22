"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EstadoFormularioCriterio = { error: string | null; ts?: number } | null;
export type EstadoFormularioCalificacion = { error: string | null; ts?: number } | null;

const RUTA = "/finca/productivo/calificacion";

export async function crearCriterio(
  _prevState: EstadoFormularioCriterio,
  formData: FormData,
): Promise<EstadoFormularioCriterio> {
  const supabase = await createClient();
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return { error: "Escribe el nombre del criterio." };

  const { error } = await supabase.from("criterios_calificacion").insert({ nombre });
  if (error) {
    if (error.code === "23505") return { error: `Ya existe un criterio con el nombre "${nombre}".` };
    return { error: `No se pudo crear el criterio: ${error.message}` };
  }

  revalidatePath(RUTA);
  return { error: null, ts: Date.now() };
}

export async function alternarCriterioActivo(
  id: string,
  activo: boolean,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("criterios_calificacion").update({ activo }).eq("id", id);
  if (error) return { error: `No se pudo actualizar el criterio: ${error.message}` };

  revalidatePath(RUTA);
  return { error: null };
}

/**
 * Guarda de una vez la calificación del mes para todos los criterios activos:
 * si ya existe una nota no anulada para (mes, criterio) la actualiza, si no la crea.
 */
export async function guardarCalificacionMes(
  mes: string,
  criterioIds: string[],
  _prevState: EstadoFormularioCalificacion,
  formData: FormData,
): Promise<EstadoFormularioCalificacion> {
  const supabase = await createClient();

  const filas: { criterio_id: string; nota: number; observaciones: string | null }[] = [];
  for (const criterioId of criterioIds) {
    const notaTexto = String(formData.get(`nota_${criterioId}`) ?? "");
    const nota = Number(notaTexto);
    if (!notaTexto || !Number.isInteger(nota) || nota < 1 || nota > 5) {
      return { error: "Califica todos los criterios con una nota de 1 a 5." };
    }
    const observaciones = String(formData.get(`obs_${criterioId}`) ?? "").trim() || null;
    filas.push({ criterio_id: criterioId, nota, observaciones });
  }

  const { data: existentes } = await supabase
    .from("calificaciones")
    .select("id, criterio_id")
    .eq("mes", mes)
    .eq("anulado", false)
    .in("criterio_id", criterioIds);
  const idExistentePorCriterio = new Map((existentes ?? []).map((e) => [e.criterio_id, e.id]));

  for (const fila of filas) {
    const idExistente = idExistentePorCriterio.get(fila.criterio_id);
    if (idExistente) {
      const { error } = await supabase
        .from("calificaciones")
        .update({ nota: fila.nota, observaciones: fila.observaciones })
        .eq("id", idExistente);
      if (error) return { error: `No se pudo guardar la calificación: ${error.message}` };
    } else {
      const { error } = await supabase
        .from("calificaciones")
        .insert({ mes, criterio_id: fila.criterio_id, nota: fila.nota, observaciones: fila.observaciones });
      if (error) return { error: `No se pudo guardar la calificación: ${error.message}` };
    }
  }

  revalidatePath(RUTA);
  return { error: null, ts: Date.now() };
}
