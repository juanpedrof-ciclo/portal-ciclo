import type { SupabaseClient } from "@supabase/supabase-js";
import type { Canal, Unidad } from "./types";

export async function recalcularIngresoPedidos(
  supabase: SupabaseClient,
  unidad: Unidad,
  fecha: string,
  canal: Canal | null,
): Promise<void> {
  let sumaQuery = supabase
    .from("pedidos")
    .select("monto_total")
    .eq("unidad", unidad)
    .eq("fecha", fecha)
    .eq("anulado", false);
  sumaQuery = canal ? sumaQuery.eq("canal", canal) : sumaQuery.is("canal", null);
  const { data: pedidosFecha, error: errorSuma } = await sumaQuery;
  if (errorSuma) {
    throw new Error(`No se pudo calcular el ingreso de la fecha: ${errorSuma.message}`);
  }
  const sumaFecha = (pedidosFecha ?? []).reduce(
    (sum, p) => sum + Number(p.monto_total),
    0,
  );

  let ingresoQuery = supabase
    .from("ingresos_semanales")
    .select("id")
    .eq("unidad", unidad)
    .eq("fecha", fecha)
    .eq("origen", "pedidos");
  ingresoQuery = canal ? ingresoQuery.eq("canal", canal) : ingresoQuery.is("canal", null);
  const { data: ingresoExistente, error: errorConsulta } = await ingresoQuery.maybeSingle();
  if (errorConsulta) {
    throw new Error(
      `No se pudo verificar el ingreso automático existente: ${errorConsulta.message}`,
    );
  }

  if (ingresoExistente) {
    const { error } = await supabase
      .from("ingresos_semanales")
      .update({ monto_total: sumaFecha })
      .eq("id", ingresoExistente.id);
    if (error) {
      throw new Error(`No se pudo actualizar el ingreso automático: ${error.message}`);
    }
  } else {
    const { error } = await supabase.from("ingresos_semanales").insert({
      unidad,
      fecha,
      monto_total: sumaFecha,
      canal,
      origen: "pedidos",
    });
    if (error) {
      throw new Error(`No se pudo crear el ingreso automático: ${error.message}`);
    }
  }
}
