"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DestinoCuenta } from "@/lib/financiero/types";

function revalidarBancoCaja() {
  revalidatePath("/market/financiero/resultados/banco-caja");
  revalidatePath("/market/financiero/resultados/conciliacion");
}

export type EstadoFormularioSaldoInicial = { error: string | null; ts?: number } | null;

export async function registrarSaldoInicial(
  _prevState: EstadoFormularioSaldoInicial,
  formData: FormData,
): Promise<EstadoFormularioSaldoInicial> {
  const supabase = await createClient();

  const destino = String(formData.get("destino") ?? "") as DestinoCuenta;
  const fecha = String(formData.get("fecha") ?? "");
  const montoTexto = String(formData.get("monto") ?? "");
  const monto = Number(montoTexto);
  const notas = String(formData.get("notas") ?? "").trim() || null;

  if (destino !== "banco" && destino !== "caja") {
    return { error: "Selecciona banco o caja." };
  }
  if (!fecha) return { error: "Selecciona la fecha del saldo inicial." };
  if (!montoTexto || Number.isNaN(monto)) {
    return { error: "Ingresa un monto válido." };
  }

  const { error } = await supabase
    .from("saldos_iniciales")
    .insert({ destino, fecha, monto, notas });

  if (error) return { error: `No se pudo registrar el saldo inicial: ${error.message}` };

  revalidarBancoCaja();
  return { error: null, ts: Date.now() };
}

export type EstadoFormularioAjuste = { error: string | null; ts?: number } | null;

export async function crearAjuste(
  _prevState: EstadoFormularioAjuste,
  formData: FormData,
): Promise<EstadoFormularioAjuste> {
  const supabase = await createClient();

  const destino = String(formData.get("destino") ?? "") as DestinoCuenta;
  const signo = String(formData.get("signo") ?? "");
  const fecha = String(formData.get("fecha") ?? "");
  const montoTexto = String(formData.get("monto") ?? "");
  const montoAbs = Number(montoTexto);
  const motivo = String(formData.get("motivo") ?? "").trim();

  if (destino !== "banco" && destino !== "caja") {
    return { error: "Selecciona banco o caja." };
  }
  if (signo !== "suma" && signo !== "resta") {
    return { error: "Indica si el ajuste suma o resta." };
  }
  if (!fecha) return { error: "Selecciona la fecha del ajuste." };
  if (!montoTexto || Number.isNaN(montoAbs) || montoAbs <= 0) {
    return { error: "Ingresa un monto válido." };
  }
  if (!motivo) return { error: "Escribe el motivo del ajuste." };

  const monto = signo === "resta" ? -montoAbs : montoAbs;

  const { error } = await supabase
    .from("ajustes_caja_banco")
    .insert({ destino, fecha, monto, motivo });

  if (error) return { error: `No se pudo registrar el ajuste: ${error.message}` };

  revalidarBancoCaja();
  return { error: null, ts: Date.now() };
}

export async function anularAjuste(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("ajustes_caja_banco")
    .update({ anulado: true, anulado_at: new Date().toISOString(), anulado_por: user?.id ?? null })
    .eq("id", id);

  if (error) return { error: `No se pudo anular el ajuste: ${error.message}` };

  revalidarBancoCaja();
  return { error: null };
}
