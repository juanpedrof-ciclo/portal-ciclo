"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ResultadoAnulacionLote } from "@/lib/financiero/anulacion-lote";

export type EstadoFormularioSalidaInsumo = { error: string | null; ts?: number } | null;

const RUTA = "/finca/productivo/insumos/salidas";

function revalidarTodo() {
  revalidatePath(RUTA);
  revalidatePath("/finca/productivo/insumos/inventario");
  revalidatePath("/finca/productivo");
}

export async function crearSalidaInsumo(
  _prevState: EstadoFormularioSalidaInsumo,
  formData: FormData,
): Promise<EstadoFormularioSalidaInsumo> {
  const supabase = await createClient();

  const insumo_id = String(formData.get("insumo_id") ?? "");
  const fecha = String(formData.get("fecha") ?? "");
  const cantidadTexto = String(formData.get("cantidad") ?? "");
  const cantidad = Number(cantidadTexto);
  const motivo = String(formData.get("motivo") ?? "").trim();
  const notas = String(formData.get("notas") ?? "").trim() || null;

  if (!insumo_id) return { error: "Selecciona el insumo." };
  if (!fecha) return { error: "Selecciona la fecha." };
  if (!cantidadTexto || Number.isNaN(cantidad) || cantidad <= 0) {
    return { error: "Ingresa una cantidad válida." };
  }
  if (!motivo) return { error: "Escribe el motivo de la salida." };

  const { error } = await supabase
    .from("insumo_salidas")
    .insert({ insumo_id, fecha, cantidad, motivo, notas });
  if (error) return { error: `No se pudo guardar la salida: ${error.message}` };

  revalidarTodo();
  return { error: null, ts: Date.now() };
}

export async function anularSalidaInsumo(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("insumo_salidas")
    .update({ anulado: true, anulado_at: new Date().toISOString(), anulado_por: user?.id ?? null })
    .eq("id", id);
  if (error) return { error: `No se pudo anular la salida: ${error.message}` };

  revalidarTodo();
  return { error: null };
}

export async function anularSalidasInsumoLote(ids: string[]): Promise<ResultadoAnulacionLote> {
  if (ids.length === 0) return { anulados: 0, bloqueados: [] };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("insumo_salidas")
    .update({ anulado: true, anulado_at: new Date().toISOString(), anulado_por: user?.id ?? null })
    .in("id", ids);

  if (error) {
    return {
      anulados: 0,
      bloqueados: ids.map((id) => ({ id, referencia: `Salida ${id}`, motivo: `error al anular: ${error.message}` })),
    };
  }

  revalidarTodo();
  return { anulados: ids.length, bloqueados: [] };
}
