"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { obtenerOCrearReproductor } from "@/lib/productivo/entidades";
import type { TipoServicio } from "@/lib/productivo/types";
import type { ResultadoAnulacionLote } from "@/lib/financiero/anulacion-lote";

export type EstadoFormularioServicio = { error: string | null; ts?: number } | null;

const RUTA = "/finca/productivo/reproduccion/servicios";
const NUEVO = "__nuevo__";

function revalidarTodo(animalId?: string | null) {
  revalidatePath(RUTA);
  revalidatePath("/finca/productivo");
  revalidatePath("/finca/productivo/animales");
  revalidatePath("/finca/productivo/indicadores");
  if (animalId) revalidatePath(`/finca/productivo/animales/${animalId}`);
}

export async function crearServicio(
  _prevState: EstadoFormularioServicio,
  formData: FormData,
): Promise<EstadoFormularioServicio> {
  const supabase = await createClient();

  const animal_id = String(formData.get("animal_id") ?? "");
  const fecha = String(formData.get("fecha") ?? "");
  const tipo = String(formData.get("tipo") ?? "") as TipoServicio;
  const reproductorSeleccionado = String(formData.get("reproductor_id") ?? "");
  const nuevoReproductorNombre = String(formData.get("nuevo_reproductor_nombre") ?? "").trim();
  const notas = String(formData.get("notas") ?? "").trim() || null;

  if (!animal_id) return { error: "Selecciona el animal." };
  if (!fecha) return { error: "Selecciona la fecha." };
  if (tipo !== "monta_natural" && tipo !== "inseminacion_artificial") {
    return { error: "Selecciona el tipo de servicio." };
  }
  if (reproductorSeleccionado === NUEVO && !nuevoReproductorNombre) {
    return { error: "Escribe el nombre del reproductor." };
  }

  let reproductor_id: string | null = reproductorSeleccionado || null;
  if (reproductorSeleccionado === NUEVO) {
    try {
      reproductor_id = await obtenerOCrearReproductor(supabase, nuevoReproductorNombre);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Error inesperado." };
    }
  }

  const { error } = await supabase
    .from("servicios_reproductivos")
    .insert({ animal_id, fecha, tipo, reproductor_id, notas });
  if (error) return { error: `No se pudo guardar el servicio: ${error.message}` };

  revalidarTodo(animal_id);
  return { error: null, ts: Date.now() };
}

export async function anularServicio(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("servicios_reproductivos")
    .update({ anulado: true, anulado_at: new Date().toISOString(), anulado_por: user?.id ?? null })
    .eq("id", id);
  if (error) return { error: `No se pudo anular el servicio: ${error.message}` };

  revalidarTodo();
  return { error: null };
}

export async function anularServiciosLote(ids: string[]): Promise<ResultadoAnulacionLote> {
  if (ids.length === 0) return { anulados: 0, bloqueados: [] };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("servicios_reproductivos")
    .update({ anulado: true, anulado_at: new Date().toISOString(), anulado_por: user?.id ?? null })
    .in("id", ids);

  if (error) {
    return {
      anulados: 0,
      bloqueados: ids.map((id) => ({ id, referencia: `Servicio ${id}`, motivo: `error al anular: ${error.message}` })),
    };
  }

  revalidarTodo();
  return { anulados: ids.length, bloqueados: [] };
}
