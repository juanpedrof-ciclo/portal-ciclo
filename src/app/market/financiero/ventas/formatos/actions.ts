"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { MapeoColumnas } from "@/lib/financiero/types";

export type EstadoFormularioFormato = { error: string | null; ts?: number } | null;

function construirMapeo(formData: FormData): MapeoColumnas | null {
  const cliente = String(formData.get("mapeo_cliente") ?? "").trim();
  const producto = String(formData.get("mapeo_producto") ?? "").trim();
  const idOrden = String(formData.get("mapeo_id_orden") ?? "").trim();
  const total = String(formData.get("mapeo_total") ?? "").trim();
  if (!cliente || !producto || !idOrden || !total) return null;

  const telefono = String(formData.get("mapeo_telefono") ?? "").trim();
  const cantidad = String(formData.get("mapeo_cantidad") ?? "").trim();
  const estado = String(formData.get("mapeo_estado") ?? "").trim();
  const fecha = String(formData.get("mapeo_fecha") ?? "").trim();

  return {
    cliente,
    producto,
    id_orden: idOrden,
    total,
    ...(telefono ? { telefono } : {}),
    ...(cantidad ? { cantidad } : {}),
    ...(estado ? { estado } : {}),
    ...(fecha ? { fecha } : {}),
  };
}

export async function actualizarFormato(
  id: string,
  _prevState: EstadoFormularioFormato,
  formData: FormData,
): Promise<EstadoFormularioFormato> {
  const supabase = await createClient();

  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return { error: "Escribe un nombre para el formato." };

  const mapeo = construirMapeo(formData);
  if (!mapeo) {
    return { error: "Mapea al menos cliente, producto, ID de pedido y total." };
  }

  const { error } = await supabase
    .from("formatos_carga")
    .update({ nombre, mapeo_columnas: mapeo })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe otro formato con ese nombre." };
    }
    return { error: `No se pudo guardar el formato: ${error.message}` };
  }

  revalidatePath("/market/financiero/ventas/formatos");
  revalidatePath("/market/financiero/ventas");

  return { error: null, ts: Date.now() };
}

export async function eliminarFormato(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase.from("formatos_carga").delete().eq("id", id);
  if (error) {
    return { error: `No se pudo eliminar el formato: ${error.message}` };
  }

  revalidatePath("/market/financiero/ventas/formatos");
  revalidatePath("/market/financiero/ventas");

  return { error: null };
}
