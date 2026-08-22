"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Turno } from "@/lib/productivo/types";
import type { ResultadoAnulacionLote } from "@/lib/financiero/anulacion-lote";

export type EstadoFormularioLeche = { error: string | null; ts?: number } | null;

const RUTA = "/finca/productivo/leche";

export async function crearLeche(
  _prevState: EstadoFormularioLeche,
  formData: FormData,
): Promise<EstadoFormularioLeche> {
  const supabase = await createClient();

  const animal_id = String(formData.get("animal_id") ?? "");
  const fecha = String(formData.get("fecha") ?? "");
  const turno = String(formData.get("turno") ?? "") as Turno;
  const litrosTexto = String(formData.get("litros") ?? "");
  const litros = Number(litrosTexto);
  const notas = String(formData.get("notas") ?? "").trim() || null;

  if (!animal_id) return { error: "Selecciona la búfala." };
  if (!fecha) return { error: "Selecciona la fecha." };
  if (turno !== "am" && turno !== "pm") return { error: "Selecciona el turno." };
  if (!litrosTexto || Number.isNaN(litros) || litros <= 0) {
    return { error: "Ingresa una cantidad de litros válida." };
  }

  const { error } = await supabase
    .from("leche_registros")
    .insert({ animal_id, fecha, turno, litros, notas });

  if (error) return { error: `No se pudo guardar el registro: ${error.message}` };

  revalidatePath(RUTA);
  revalidatePath("/finca/productivo");
  revalidatePath("/finca/productivo/indicadores");
  revalidatePath(`/finca/productivo/animales/${animal_id}`);
  return { error: null, ts: Date.now() };
}

export async function anularLeche(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("leche_registros")
    .update({ anulado: true, anulado_at: new Date().toISOString(), anulado_por: user?.id ?? null })
    .eq("id", id);
  if (error) return { error: `No se pudo anular el registro: ${error.message}` };

  revalidatePath(RUTA);
  revalidatePath("/finca/productivo");
  revalidatePath("/finca/productivo/indicadores");
  return { error: null };
}

export async function anularLecheLote(ids: string[]): Promise<ResultadoAnulacionLote> {
  if (ids.length === 0) return { anulados: 0, bloqueados: [] };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("leche_registros")
    .update({ anulado: true, anulado_at: new Date().toISOString(), anulado_por: user?.id ?? null })
    .in("id", ids);

  if (error) {
    return {
      anulados: 0,
      bloqueados: ids.map((id) => ({ id, referencia: `Registro ${id}`, motivo: `error al anular: ${error.message}` })),
    };
  }

  revalidatePath(RUTA);
  revalidatePath("/finca/productivo");
  revalidatePath("/finca/productivo/indicadores");
  return { anulados: ids.length, bloqueados: [] };
}
