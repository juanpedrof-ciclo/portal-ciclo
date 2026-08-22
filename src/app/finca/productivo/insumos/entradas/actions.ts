"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ResultadoAnulacionLote } from "@/lib/financiero/anulacion-lote";

export type EstadoFormularioEntrada = { error: string | null; ts?: number } | null;

const RUTA = "/finca/productivo/insumos/entradas";

function revalidarTodo() {
  revalidatePath(RUTA);
  revalidatePath("/finca/productivo/insumos/inventario");
  revalidatePath("/finca/productivo");
}

export async function crearEntrada(
  _prevState: EstadoFormularioEntrada,
  formData: FormData,
): Promise<EstadoFormularioEntrada> {
  const supabase = await createClient();

  const insumo_id = String(formData.get("insumo_id") ?? "");
  const fecha = String(formData.get("fecha") ?? "");
  const cantidadTexto = String(formData.get("cantidad") ?? "");
  const cantidad = Number(cantidadTexto);
  const proveedor = String(formData.get("proveedor") ?? "").trim() || null;
  const costoTexto = String(formData.get("costo") ?? "").trim();
  const notas = String(formData.get("notas") ?? "").trim() || null;

  if (!insumo_id) return { error: "Selecciona el insumo." };
  if (!fecha) return { error: "Selecciona la fecha." };
  if (!cantidadTexto || Number.isNaN(cantidad) || cantidad <= 0) {
    return { error: "Ingresa una cantidad válida." };
  }
  let costo: number | null = null;
  if (costoTexto) {
    costo = Number(costoTexto);
    if (Number.isNaN(costo) || costo < 0) return { error: "El costo debe ser un número válido." };
  }

  const { error } = await supabase
    .from("insumo_entradas")
    .insert({ insumo_id, fecha, cantidad, proveedor, costo, notas });
  if (error) return { error: `No se pudo guardar la entrada: ${error.message}` };

  revalidarTodo();
  return { error: null, ts: Date.now() };
}

export async function anularEntrada(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("insumo_entradas")
    .update({ anulado: true, anulado_at: new Date().toISOString(), anulado_por: user?.id ?? null })
    .eq("id", id);
  if (error) return { error: `No se pudo anular la entrada: ${error.message}` };

  revalidarTodo();
  return { error: null };
}

export async function anularEntradasLote(ids: string[]): Promise<ResultadoAnulacionLote> {
  if (ids.length === 0) return { anulados: 0, bloqueados: [] };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("insumo_entradas")
    .update({ anulado: true, anulado_at: new Date().toISOString(), anulado_por: user?.id ?? null })
    .in("id", ids);

  if (error) {
    return {
      anulados: 0,
      bloqueados: ids.map((id) => ({ id, referencia: `Entrada ${id}`, motivo: `error al anular: ${error.message}` })),
    };
  }

  revalidarTodo();
  return { anulados: ids.length, bloqueados: [] };
}
