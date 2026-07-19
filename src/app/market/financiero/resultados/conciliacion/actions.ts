"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TipoMovimiento } from "@/lib/financiero/types";

export type EstadoFormularioMovimiento = { error: string | null } | null;

export async function crearMovimiento(
  _prevState: EstadoFormularioMovimiento,
  formData: FormData,
): Promise<EstadoFormularioMovimiento> {
  const supabase = await createClient();

  const fecha = String(formData.get("fecha") ?? "");
  const descripcion = String(formData.get("descripcion") ?? "").trim() || null;
  const montoTexto = String(formData.get("monto") ?? "");
  const monto = Number(montoTexto);
  const tipo = String(formData.get("tipo") ?? "") as TipoMovimiento;

  if (!fecha) return { error: "Selecciona la fecha del movimiento." };
  if (!montoTexto || Number.isNaN(monto) || monto <= 0) {
    return { error: "Ingresa un monto válido." };
  }
  if (tipo !== "credito" && tipo !== "debito") {
    return { error: "Selecciona el tipo de movimiento." };
  }

  const { error } = await supabase
    .from("movimientos_bancarios")
    .insert({ fecha, descripcion, monto, tipo });

  if (error) return { error: `No se pudo guardar: ${error.message}` };

  revalidatePath("/market/financiero/resultados/conciliacion");
  return { error: null };
}

export async function conciliarMovimiento(formData: FormData) {
  const supabase = await createClient();
  const movimientoId = String(formData.get("movimiento_id") ?? "");
  const pagoId = String(formData.get("pago_id") ?? "") || null;

  if (!movimientoId) return;

  await supabase
    .from("movimientos_bancarios")
    .update({ pago_id: pagoId, conciliado: pagoId !== null })
    .eq("id", movimientoId);

  revalidatePath("/market/financiero/resultados/conciliacion");
}
