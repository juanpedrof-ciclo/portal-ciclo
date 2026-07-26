"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { subirArchivo } from "@/lib/financiero/storage";
import type { Canal, OrigenIngreso } from "@/lib/financiero/types";

export type EstadoFormularioIngreso = { error: string | null; ts?: number } | null;

export async function crearIngreso(
  _prevState: EstadoFormularioIngreso,
  formData: FormData,
): Promise<EstadoFormularioIngreso> {
  const supabase = await createClient();

  const fecha = String(formData.get("fecha") ?? "");
  const montoTexto = String(formData.get("monto_total") ?? "");
  const monto_total = Number(montoTexto);
  const canal = (String(formData.get("canal") ?? "") || null) as Canal | null;
  const notas = String(formData.get("notas") ?? "").trim() || null;
  const origen = (String(formData.get("origen") ?? "manual") ||
    "manual") as OrigenIngreso;
  const archivo = formData.get("archivo");

  if (!fecha) return { error: "Selecciona la fecha." };
  if (!montoTexto || Number.isNaN(monto_total) || monto_total < 0) {
    return { error: "Ingresa un monto total válido." };
  }

  let queryPedidosFecha = supabase
    .from("ingresos_semanales")
    .select("id")
    .eq("fecha", fecha)
    .eq("origen", "pedidos");
  queryPedidosFecha = canal
    ? queryPedidosFecha.eq("canal", canal)
    : queryPedidosFecha.is("canal", null);
  const { data: existePorPedidos } = await queryPedidosFecha.maybeSingle();
  if (existePorPedidos) {
    return {
      error:
        "Esta fecha ya tiene ventas cargadas por archivo (Ventas). Edita los pedidos en vez de agregar un ingreso manual, para no contar la venta dos veces.",
    };
  }

  let archivo_excel_url: string | null = null;
  if (origen === "excel" && archivo instanceof File && archivo.size > 0) {
    try {
      archivo_excel_url = await subirArchivo(
        supabase,
        "ingresos-excel",
        archivo,
      );
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "No se pudo subir el Excel.",
      };
    }
  }

  const { error } = await supabase.from("ingresos_semanales").insert({
    fecha,
    monto_total,
    canal,
    notas,
    origen,
    archivo_excel_url,
  });

  if (error) return { error: `No se pudo guardar: ${error.message}` };

  revalidatePath("/market/financiero/ingresos");
  revalidatePath("/market/financiero");
  revalidatePath("/market/financiero/resultados/pg");
  revalidatePath("/market/financiero/resultados/cuentas-por-cobrar");
  return { error: null, ts: Date.now() };
}

export async function anularIngreso(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { data: vista } = await supabase
    .from("vista_ingresos_saldo")
    .select("monto_aplicado")
    .eq("id", id)
    .maybeSingle();
  if (vista && Number(vista.monto_aplicado) > 0.01) {
    return {
      error:
        "Este ingreso tiene un cobro cruzado. Anula primero el pago aplicado antes de anular este ingreso.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("ingresos_semanales")
    .update({ anulado: true, anulado_at: new Date().toISOString(), anulado_por: user?.id ?? null })
    .eq("id", id);
  if (error) return { error: `No se pudo anular el ingreso: ${error.message}` };

  revalidatePath("/market/financiero/ingresos");
  revalidatePath("/market/financiero");
  revalidatePath("/market/financiero/resultados/pg");
  revalidatePath("/market/financiero/resultados/cuentas-por-cobrar");
  revalidatePath("/market/financiero/pagos");

  return { error: null };
}
