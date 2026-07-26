"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DestinoPago, TipoPago } from "@/lib/financiero/types";

export type EstadoFormularioPago = { error: string | null; ts?: number } | null;

export async function crearPago(
  _prevState: EstadoFormularioPago,
  formData: FormData,
): Promise<EstadoFormularioPago> {
  const supabase = await createClient();

  const tipo = String(formData.get("tipo") ?? "") as TipoPago;
  const facturaId = String(formData.get("factura_id") ?? "") || null;
  const ingresoId = String(formData.get("ingreso_id") ?? "") || null;
  const pedidoId = String(formData.get("pedido_id") ?? "") || null;
  const fecha = String(formData.get("fecha") ?? "");
  const montoTexto = String(formData.get("monto") ?? "");
  const monto = Number(montoTexto);
  const destino = String(formData.get("destino") ?? "") as DestinoPago;
  const referencia = String(formData.get("referencia") ?? "").trim() || null;
  const notas = String(formData.get("notas") ?? "").trim() || null;

  if (tipo !== "pago_proveedor" && tipo !== "cobro_cliente") {
    return { error: "Selecciona el tipo de recibo." };
  }
  if (tipo === "pago_proveedor" && !facturaId) {
    return { error: "Selecciona la factura a pagar." };
  }
  if (tipo === "cobro_cliente" && !ingresoId && !pedidoId) {
    return { error: "Selecciona la venta o el pedido a cobrar." };
  }
  if (!fecha) return { error: "Selecciona la fecha." };
  if (!montoTexto || Number.isNaN(monto) || monto <= 0) {
    return { error: "Ingresa un monto válido." };
  }
  if (destino !== "banco" && destino !== "caja") {
    return { error: "Selecciona el destino del dinero." };
  }

  if (tipo === "pago_proveedor" && facturaId) {
    const { data: vista } = await supabase
      .from("vista_facturas_saldo")
      .select("saldo_pendiente")
      .eq("id", facturaId)
      .single();
    if (!vista) return { error: "La factura seleccionada ya no existe." };
    if (monto > Number(vista.saldo_pendiente) + 0.01) {
      return {
        error: `El monto excede el saldo pendiente de la factura (${vista.saldo_pendiente}).`,
      };
    }
  }

  if (tipo === "cobro_cliente" && ingresoId) {
    const { data: vista } = await supabase
      .from("vista_ingresos_saldo")
      .select("saldo_pendiente")
      .eq("id", ingresoId)
      .single();
    if (!vista) return { error: "La venta seleccionada ya no existe." };
    if (monto > Number(vista.saldo_pendiente) + 0.01) {
      return {
        error: `El monto excede el saldo pendiente de la venta (${vista.saldo_pendiente}).`,
      };
    }
  }

  if (tipo === "cobro_cliente" && pedidoId) {
    const { data: vista } = await supabase
      .from("vista_pedidos_saldo")
      .select("saldo_pendiente")
      .eq("id", pedidoId)
      .single();
    if (!vista) return { error: "El pedido seleccionado ya no existe." };
    if (monto > Number(vista.saldo_pendiente) + 0.01) {
      return {
        error: `El monto excede el saldo pendiente del pedido (${vista.saldo_pendiente}).`,
      };
    }
  }

  const { data: pago, error: errorPago } = await supabase
    .from("pagos")
    .insert({ tipo, fecha, monto, destino, referencia, notas })
    .select("id")
    .single();

  if (errorPago || !pago) {
    return { error: `No se pudo registrar el pago: ${errorPago?.message}` };
  }

  const { error: errorAplicacion } = await supabase
    .from("pago_aplicaciones")
    .insert({
      pago_id: pago.id,
      factura_id: tipo === "pago_proveedor" ? facturaId : null,
      ingreso_id: tipo === "cobro_cliente" ? ingresoId : null,
      pedido_id: tipo === "cobro_cliente" ? pedidoId : null,
      monto_aplicado: monto,
    });

  if (errorAplicacion) {
    return { error: `No se pudo aplicar el pago: ${errorAplicacion.message}` };
  }

  if (tipo === "pago_proveedor" && facturaId) {
    const { data: actualizada } = await supabase
      .from("vista_facturas_saldo")
      .select("saldo_pendiente")
      .eq("id", facturaId)
      .single();
    if (actualizada && Number(actualizada.saldo_pendiente) <= 0) {
      const { error: errorEstado } = await supabase
        .from("facturas")
        .update({ estado: "pagado" })
        .eq("id", facturaId);
      if (errorEstado) {
        console.error(
          `No se pudo marcar la factura ${facturaId} como pagada: ${errorEstado.message}`,
        );
      }
    }
  }

  revalidatePath("/market/financiero/pagos");
  revalidatePath("/market/financiero/costos");
  revalidatePath("/market/financiero");
  revalidatePath("/market/financiero/resultados/pg");
  revalidatePath("/market/financiero/resultados/cuentas-por-pagar");
  revalidatePath("/market/financiero/resultados/cuentas-por-cobrar");
  revalidatePath("/market/financiero/resultados/cartera-clientes");
  revalidatePath("/market/financiero/ventas");
  return { error: null, ts: Date.now() };
}

export async function anularPago(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { data: aplicaciones } = await supabase
    .from("pago_aplicaciones")
    .select("factura_id")
    .eq("pago_id", id)
    .not("factura_id", "is", null);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("pagos")
    .update({ anulado: true, anulado_at: new Date().toISOString(), anulado_por: user?.id ?? null })
    .eq("id", id);
  if (error) return { error: `No se pudo anular el pago: ${error.message}` };

  for (const facturaId of new Set((aplicaciones ?? []).map((a) => a.factura_id as string))) {
    const { data: vista } = await supabase
      .from("vista_facturas_saldo")
      .select("saldo_pendiente")
      .eq("id", facturaId)
      .maybeSingle();
    if (vista && Number(vista.saldo_pendiente) > 0.01) {
      const { error: errorEstado } = await supabase
        .from("facturas")
        .update({ estado: "pendiente" })
        .eq("id", facturaId);
      if (errorEstado) {
        console.error(
          `No se pudo revertir la factura ${facturaId} a pendiente: ${errorEstado.message}`,
        );
      }
    }
  }

  revalidatePath("/market/financiero/pagos");
  revalidatePath("/market/financiero/costos");
  revalidatePath("/market/financiero");
  revalidatePath("/market/financiero/resultados/pg");
  revalidatePath("/market/financiero/resultados/cuentas-por-pagar");
  revalidatePath("/market/financiero/resultados/cuentas-por-cobrar");
  revalidatePath("/market/financiero/resultados/cartera-clientes");
  revalidatePath("/market/financiero/resultados/conciliacion");
  revalidatePath("/market/financiero/ventas");

  return { error: null };
}
