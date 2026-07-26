import type { SupabaseClient } from "@supabase/supabase-js";
import type { Canal } from "./types";

export async function recalcularIngresoPedidos(
  supabase: SupabaseClient,
  semana: string,
  canal: Canal | null,
): Promise<void> {
  let sumaQuery = supabase
    .from("pedidos")
    .select("monto_total")
    .eq("semana", semana)
    .eq("anulado", false);
  sumaQuery = canal ? sumaQuery.eq("canal", canal) : sumaQuery.is("canal", null);
  const { data: pedidosSemana, error: errorSuma } = await sumaQuery;
  if (errorSuma) {
    throw new Error(`No se pudo calcular el ingreso de la semana: ${errorSuma.message}`);
  }
  const sumaSemana = (pedidosSemana ?? []).reduce(
    (sum, p) => sum + Number(p.monto_total),
    0,
  );

  let ingresoQuery = supabase
    .from("ingresos_semanales")
    .select("id")
    .eq("semana", semana)
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
      .update({ monto_total: sumaSemana })
      .eq("id", ingresoExistente.id);
    if (error) {
      throw new Error(`No se pudo actualizar el ingreso automático: ${error.message}`);
    }
  } else {
    const { error } = await supabase.from("ingresos_semanales").insert({
      semana,
      monto_total: sumaSemana,
      canal,
      origen: "pedidos",
    });
    if (error) {
      throw new Error(`No se pudo crear el ingreso automático: ${error.message}`);
    }
  }
}
