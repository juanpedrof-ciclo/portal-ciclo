import type { SupabaseClient } from "@supabase/supabase-js";
import type { TipoPL } from "./types";

export type ResumenPG = {
  ingresos: number;
  costoProducto: number;
  gastoVenta: number;
  gastoAdministrativo: number;
  utilidad: number;
};

export async function calcularPG(
  supabase: SupabaseClient,
  desde: string,
  hasta: string,
): Promise<ResumenPG> {
  const [ingresosRes, facturasRes] = await Promise.all([
    supabase
      .from("ingresos_semanales")
      .select("monto_total")
      .eq("anulado", false)
      .gte("semana", desde)
      .lte("semana", hasta),
    supabase
      .from("facturas")
      .select("monto, categorias(tipo_pl)")
      .eq("anulado", false)
      .gte("fecha", desde)
      .lte("fecha", hasta),
  ]);

  const ingresos = (ingresosRes.data ?? []).reduce(
    (sum: number, r: { monto_total: number }) => sum + Number(r.monto_total),
    0,
  );

  let costoProducto = 0;
  let gastoVenta = 0;
  let gastoAdministrativo = 0;

  type FilaFactura = { monto: number; categorias: { tipo_pl: TipoPL } | null };
  for (const f of (facturasRes.data ?? []) as unknown as FilaFactura[]) {
    const tipo = f.categorias?.tipo_pl;
    const monto = Number(f.monto);
    if (tipo === "costo_producto") costoProducto += monto;
    else if (tipo === "gasto_venta") gastoVenta += monto;
    else if (tipo === "gasto_administrativo") gastoAdministrativo += monto;
  }

  return {
    ingresos,
    costoProducto,
    gastoVenta,
    gastoAdministrativo,
    utilidad: ingresos - costoProducto - gastoVenta - gastoAdministrativo,
  };
}
