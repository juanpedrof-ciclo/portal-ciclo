"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { GrupoAnimalId } from "@/lib/productivo/types";

export type EstadoFormularioInventarioInicial = { error: string | null; ts?: number } | null;

export async function crearInventarioInicial(
  grupoId: GrupoAnimalId,
  _prevState: EstadoFormularioInventarioInicial,
  formData: FormData,
): Promise<EstadoFormularioInventarioInicial> {
  const supabase = await createClient();

  const fecha = String(formData.get("fecha") ?? "");
  const cantidadTexto = String(formData.get("cantidad") ?? "");
  const cantidad = Number(cantidadTexto);
  const notas = String(formData.get("notas") ?? "").trim() || null;

  if (!fecha) return { error: "Selecciona la fecha." };
  if (!cantidadTexto || !Number.isInteger(cantidad) || cantidad < 0) {
    return { error: "Ingresa una cantidad válida." };
  }

  const { error } = await supabase
    .from("inventario_inicial_lote")
    .insert({ grupo_id: grupoId, fecha, cantidad, notas });
  if (error) return { error: `No se pudo guardar el inventario inicial: ${error.message}` };

  revalidatePath(`/finca/productivo/lotes/${grupoId}`);
  revalidatePath("/finca/productivo/lotes");
  revalidatePath("/finca/productivo");
  revalidatePath("/finca/productivo/indicadores");
  return { error: null, ts: Date.now() };
}
