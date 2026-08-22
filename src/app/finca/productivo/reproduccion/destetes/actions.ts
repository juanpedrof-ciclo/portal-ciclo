"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ResultadoAnulacionLote } from "@/lib/financiero/anulacion-lote";

export type EstadoFormularioDestete = { error: string | null; ts?: number } | null;

const RUTA = "/finca/productivo/reproduccion/destetes";

function revalidarTodo(animalId?: string | null) {
  revalidatePath(RUTA);
  revalidatePath("/finca/productivo");
  revalidatePath("/finca/productivo/animales");
  revalidatePath("/finca/productivo/indicadores");
  if (animalId) revalidatePath(`/finca/productivo/animales/${animalId}`);
}

export async function crearDestete(
  _prevState: EstadoFormularioDestete,
  formData: FormData,
): Promise<EstadoFormularioDestete> {
  const supabase = await createClient();

  const animal_id = String(formData.get("animal_id") ?? "");
  const fecha = String(formData.get("fecha") ?? "");
  const notas = String(formData.get("notas") ?? "").trim() || null;

  if (!animal_id) return { error: "Selecciona la madre." };
  if (!fecha) return { error: "Selecciona la fecha." };

  const { error } = await supabase.from("destetes").insert({ animal_id, fecha, notas });
  if (error) return { error: `No se pudo guardar el destete: ${error.message}` };

  revalidarTodo(animal_id);
  return { error: null, ts: Date.now() };
}

export async function anularDestete(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("destetes")
    .update({ anulado: true, anulado_at: new Date().toISOString(), anulado_por: user?.id ?? null })
    .eq("id", id);
  if (error) return { error: `No se pudo anular el destete: ${error.message}` };

  revalidarTodo();
  return { error: null };
}

export async function anularDestetesLote(ids: string[]): Promise<ResultadoAnulacionLote> {
  if (ids.length === 0) return { anulados: 0, bloqueados: [] };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("destetes")
    .update({ anulado: true, anulado_at: new Date().toISOString(), anulado_por: user?.id ?? null })
    .in("id", ids);

  if (error) {
    return {
      anulados: 0,
      bloqueados: ids.map((id) => ({ id, referencia: `Destete ${id}`, motivo: `error al anular: ${error.message}` })),
    };
  }

  revalidarTodo();
  return { anulados: ids.length, bloqueados: [] };
}
