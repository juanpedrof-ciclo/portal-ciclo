"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ResultadoPrenez } from "@/lib/productivo/types";
import type { ResultadoAnulacionLote } from "@/lib/financiero/anulacion-lote";

export type EstadoFormularioConfirmacion = { error: string | null; ts?: number } | null;

const RUTA = "/finca/productivo/reproduccion/confirmacion-prenez";

function revalidarTodo(animalId?: string | null) {
  revalidatePath(RUTA);
  revalidatePath("/finca/productivo");
  revalidatePath("/finca/productivo/animales");
  revalidatePath("/finca/productivo/indicadores");
  if (animalId) revalidatePath(`/finca/productivo/animales/${animalId}`);
}

export async function crearConfirmacion(
  _prevState: EstadoFormularioConfirmacion,
  formData: FormData,
): Promise<EstadoFormularioConfirmacion> {
  const supabase = await createClient();

  const animal_id = String(formData.get("animal_id") ?? "");
  const fecha = String(formData.get("fecha") ?? "");
  const resultado = String(formData.get("resultado") ?? "") as ResultadoPrenez;
  const notas = String(formData.get("notas") ?? "").trim() || null;

  if (!animal_id) return { error: "Selecciona el animal." };
  if (!fecha) return { error: "Selecciona la fecha." };
  if (resultado !== "prenada" && resultado !== "vacia") {
    return { error: "Selecciona el resultado." };
  }

  const { error } = await supabase
    .from("confirmaciones_prenez")
    .insert({ animal_id, fecha, resultado, notas });
  if (error) return { error: `No se pudo guardar la confirmación: ${error.message}` };

  revalidarTodo(animal_id);
  return { error: null, ts: Date.now() };
}

export async function anularConfirmacion(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("confirmaciones_prenez")
    .update({ anulado: true, anulado_at: new Date().toISOString(), anulado_por: user?.id ?? null })
    .eq("id", id);
  if (error) return { error: `No se pudo anular la confirmación: ${error.message}` };

  revalidarTodo();
  return { error: null };
}

export async function anularConfirmacionesLote(ids: string[]): Promise<ResultadoAnulacionLote> {
  if (ids.length === 0) return { anulados: 0, bloqueados: [] };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("confirmaciones_prenez")
    .update({ anulado: true, anulado_at: new Date().toISOString(), anulado_por: user?.id ?? null })
    .in("id", ids);

  if (error) {
    return {
      anulados: 0,
      bloqueados: ids.map((id) => ({ id, referencia: `Confirmación ${id}`, motivo: `error al anular: ${error.message}` })),
    };
  }

  revalidarTodo();
  return { anulados: ids.length, bloqueados: [] };
}
