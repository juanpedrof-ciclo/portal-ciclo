"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CausaMuerte, GrupoAnimalId } from "@/lib/productivo/types";
import type { ResultadoAnulacionLote } from "@/lib/financiero/anulacion-lote";

export type EstadoFormularioMuerte = { error: string | null; ts?: number } | null;

const RUTA = "/finca/productivo/muertes";
const CAUSAS = ["enfermedad", "accidente", "otro"];

function revalidarTodo(animalId?: string | null) {
  revalidatePath(RUTA);
  revalidatePath("/finca/productivo");
  revalidatePath("/finca/productivo/animales");
  revalidatePath("/finca/productivo/lotes");
  revalidatePath("/finca/productivo/indicadores");
  if (animalId) revalidatePath(`/finca/productivo/animales/${animalId}`);
}

export async function crearMuerte(
  _prevState: EstadoFormularioMuerte,
  formData: FormData,
): Promise<EstadoFormularioMuerte> {
  const supabase = await createClient();

  const modo = String(formData.get("modo") ?? "");
  const fecha = String(formData.get("fecha") ?? "");
  const causa = String(formData.get("causa") ?? "") as CausaMuerte;
  const notas = String(formData.get("notas") ?? "").trim() || null;

  if (!fecha) return { error: "Selecciona la fecha." };
  if (!CAUSAS.includes(causa)) return { error: "Selecciona la causa." };

  if (modo === "lote") {
    const grupo_id = String(formData.get("grupo_id") ?? "") as GrupoAnimalId;
    const cantidadTexto = String(formData.get("cantidad") ?? "");
    const cantidad = Number(cantidadTexto);
    if (!grupo_id) return { error: "Selecciona el grupo." };
    if (!cantidadTexto || !Number.isInteger(cantidad) || cantidad <= 0) {
      return { error: "Ingresa una cantidad válida." };
    }

    const { error } = await supabase
      .from("muertes_lote")
      .insert({ grupo_id, fecha, cantidad, causa, notas });
    if (error) return { error: `No se pudo guardar la muerte: ${error.message}` };

    revalidarTodo();
    return { error: null, ts: Date.now() };
  }

  const animal_id = String(formData.get("animal_id") ?? "");
  if (!animal_id) return { error: "Selecciona el animal." };

  const { error } = await supabase
    .from("muertes_individuales")
    .insert({ animal_id, fecha, causa, notas });
  if (error) return { error: `No se pudo guardar la muerte: ${error.message}` };

  revalidarTodo(animal_id);
  return { error: null, ts: Date.now() };
}

export async function anularMuerte(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const marca = { anulado: true, anulado_at: new Date().toISOString(), anulado_por: user?.id ?? null };

  const { data: individual } = await supabase
    .from("muertes_individuales")
    .update(marca)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (!individual) {
    const { error } = await supabase.from("muertes_lote").update(marca).eq("id", id);
    if (error) return { error: `No se pudo anular el registro: ${error.message}` };
  }

  revalidarTodo();
  return { error: null };
}

export async function anularMuertesLote(ids: string[]): Promise<ResultadoAnulacionLote> {
  if (ids.length === 0) return { anulados: 0, bloqueados: [] };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const marca = { anulado: true, anulado_at: new Date().toISOString(), anulado_por: user?.id ?? null };

  const { data: individuales } = await supabase
    .from("muertes_individuales")
    .update(marca)
    .in("id", ids)
    .select("id");
  const idsIndividuales = new Set((individuales ?? []).map((r) => r.id));
  const idsRestantes = ids.filter((id) => !idsIndividuales.has(id));

  if (idsRestantes.length > 0) {
    await supabase.from("muertes_lote").update(marca).in("id", idsRestantes);
  }

  revalidarTodo();
  return { anulados: ids.length, bloqueados: [] };
}
