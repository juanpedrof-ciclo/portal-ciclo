import type { SupabaseClient } from "@supabase/supabase-js";
import type { TipoPL, Unidad } from "./types";

export type ResumenPG = {
  ingresos: number;
  costoProducto: number;
  margenBruto: number;
  gastoVenta: number;
  gastoAdministrativo: number;
  utilidad: number;
};

export type FilaIngreso = { fecha: string; monto_total: number };
export type FilaFactura = {
  fecha: string;
  monto: number;
  categoria_id: string;
  categorias: { nombre: string; tipo_pl: TipoPL } | null;
};
export type DatosPGCrudos = { ingresos: FilaIngreso[]; facturas: FilaFactura[] };

export type PuntoTendenciaPG = {
  etiqueta: string;
  ingresos: number;
  costos: number;
  utilidad: number;
};

export type CategoriaPG = {
  categoriaId: string;
  nombre: string;
  tipoPl: TipoPL;
  monto: number;
};

const TOP_CATEGORIAS = 12;

export async function obtenerDatosPG(
  supabase: SupabaseClient,
  unidad: Unidad,
  desde: string,
  hasta: string,
): Promise<DatosPGCrudos> {
  const [ingresosRes, facturasRes] = await Promise.all([
    supabase
      .from("ingresos_semanales")
      .select("fecha, monto_total")
      .eq("unidad", unidad)
      .eq("anulado", false)
      .gte("fecha", desde)
      .lte("fecha", hasta),
    supabase
      .from("facturas")
      .select("fecha, monto, categoria_id, categorias(nombre, tipo_pl)")
      .eq("unidad", unidad)
      .eq("anulado", false)
      .gte("fecha", desde)
      .lte("fecha", hasta),
  ]);

  return {
    ingresos: (ingresosRes.data ?? []) as unknown as FilaIngreso[],
    facturas: (facturasRes.data ?? []) as unknown as FilaFactura[],
  };
}

export function resumirPG(datos: DatosPGCrudos): ResumenPG {
  const ingresos = datos.ingresos.reduce(
    (sum, r) => sum + Number(r.monto_total),
    0,
  );

  let costoProducto = 0;
  let gastoVenta = 0;
  let gastoAdministrativo = 0;

  for (const f of datos.facturas) {
    const tipo = f.categorias?.tipo_pl;
    const monto = Number(f.monto);
    if (tipo === "costo_producto") costoProducto += monto;
    else if (tipo === "gasto_venta") gastoVenta += monto;
    else if (tipo === "gasto_administrativo") gastoAdministrativo += monto;
  }

  return {
    ingresos,
    costoProducto,
    margenBruto: ingresos - costoProducto,
    gastoVenta,
    gastoAdministrativo,
    utilidad: ingresos - costoProducto - gastoVenta - gastoAdministrativo,
  };
}

export function resumirPorBuckets(
  datos: DatosPGCrudos,
  buckets: { desde: string; hasta: string }[],
): ResumenPG[] {
  return buckets.map(({ desde, hasta }) =>
    resumirPG({
      ingresos: datos.ingresos.filter((r) => r.fecha >= desde && r.fecha <= hasta),
      facturas: datos.facturas.filter((f) => f.fecha >= desde && f.fecha <= hasta),
    }),
  );
}

export function desglosePorCategoria(datos: DatosPGCrudos): CategoriaPG[] {
  const acumulado = new Map<string, CategoriaPG>();

  for (const f of datos.facturas) {
    if (!f.categorias) continue;
    const monto = Number(f.monto);
    const existente = acumulado.get(f.categoria_id);
    if (existente) {
      existente.monto += monto;
    } else {
      acumulado.set(f.categoria_id, {
        categoriaId: f.categoria_id,
        nombre: f.categorias.nombre,
        tipoPl: f.categorias.tipo_pl,
        monto,
      });
    }
  }

  const ordenado = [...acumulado.values()].sort((a, b) => b.monto - a.monto);
  if (ordenado.length <= TOP_CATEGORIAS) return ordenado;

  const top = ordenado.slice(0, TOP_CATEGORIAS);
  const resto = ordenado.slice(TOP_CATEGORIAS);
  const montoOtros = resto.reduce((sum, c) => sum + c.monto, 0);

  return [
    ...top,
    {
      categoriaId: "otros",
      nombre: "Otros",
      tipoPl: resto[0].tipoPl,
      monto: montoOtros,
    },
  ];
}

export async function calcularPG(
  supabase: SupabaseClient,
  unidad: Unidad,
  desde: string,
  hasta: string,
): Promise<ResumenPG> {
  return resumirPG(await obtenerDatosPG(supabase, unidad, desde, hasta));
}
