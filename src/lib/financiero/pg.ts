import type { SupabaseClient } from "@supabase/supabase-js";
import type { Canal, TipoPL, Unidad } from "./types";
import { CANAL_LABELS } from "./types";

export type ResumenPG = {
  ingresos: number;
  costoProducto: number;
  margenBruto: number;
  gastoVenta: number;
  gastoAdministrativo: number;
  utilidad: number;
};

export type FilaIngreso = { fecha: string; monto_total: number; canal: Canal | null };
export type FilaFactura = {
  id: string;
  fecha: string;
  monto: number;
  categoria_id: string;
  categorias: { nombre: string; tipo_pl: TipoPL } | null;
  proveedor_id: string;
  proveedores: { nombre: string } | null;
  numero_factura: string | null;
  estado: string;
};
export type FilaPedidoVenta = {
  id: string;
  fecha: string;
  canal: Canal | null;
  monto_total: number;
  cliente_id: string;
  clientes: { nombre: string } | null;
  plataforma: string;
  id_orden_externo: string;
  estado: string | null;
};
export type DatosPGCrudos = {
  ingresos: FilaIngreso[];
  facturas: FilaFactura[];
  pedidos: FilaPedidoVenta[];
};

export type PuntoTendenciaPG = {
  etiqueta: string;
  ingresos: number;
  costos: number;
  utilidad: number;
  ingresosAnterior?: number;
  costosAnterior?: number;
  utilidadAnterior?: number;
};

export type CategoriaPG = {
  categoriaId: string;
  categoriaIds: string[];
  nombre: string;
  tipoPl: TipoPL;
  monto: number;
};

export type ProveedorPG = { proveedorId: string; nombre: string; monto: number };
export type ClientePG = { clienteId: string; nombre: string; monto: number };
export type CanalPG = { canal: Canal | null; nombre: string; monto: number };

export type ConcentracionPG = {
  topCliente: { nombre: string; monto: number; pct: number | null } | null;
  topProveedor: { nombre: string; monto: number; pct: number | null } | null;
};

const TOP_CATEGORIAS = 12;
const CLIENTE_OTROS_ID = "otros";
export const UMBRAL_CONCENTRACION_RIESGO = 0.3;

export async function obtenerDatosPG(
  supabase: SupabaseClient,
  unidad: Unidad,
  desde: string,
  hasta: string,
): Promise<DatosPGCrudos> {
  const [ingresosRes, facturasRes, pedidosRes] = await Promise.all([
    supabase
      .from("ingresos_semanales")
      .select("fecha, monto_total, canal")
      .eq("unidad", unidad)
      .eq("anulado", false)
      .gte("fecha", desde)
      .lte("fecha", hasta),
    supabase
      .from("facturas")
      .select(
        "id, fecha, monto, categoria_id, categorias(nombre, tipo_pl), proveedor_id, proveedores(nombre), numero_factura, estado",
      )
      .eq("unidad", unidad)
      .eq("anulado", false)
      .gte("fecha", desde)
      .lte("fecha", hasta),
    supabase
      .from("pedidos")
      .select(
        "id, fecha, canal, monto_total, cliente_id, clientes(nombre), plataforma, id_orden_externo, estado",
      )
      .eq("unidad", unidad)
      .eq("anulado", false)
      .gte("fecha", desde)
      .lte("fecha", hasta),
  ]);

  return {
    ingresos: (ingresosRes.data ?? []) as unknown as FilaIngreso[],
    facturas: (facturasRes.data ?? []) as unknown as FilaFactura[],
    pedidos: (pedidosRes.data ?? []) as unknown as FilaPedidoVenta[],
  };
}

export function resumirPG(datos: Pick<DatosPGCrudos, "ingresos" | "facturas">): ResumenPG {
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
  datos: Pick<DatosPGCrudos, "ingresos" | "facturas">,
  buckets: { desde: string; hasta: string }[],
): ResumenPG[] {
  return buckets.map(({ desde, hasta }) =>
    resumirPG({
      ingresos: datos.ingresos.filter((r) => r.fecha >= desde && r.fecha <= hasta),
      facturas: datos.facturas.filter((f) => f.fecha >= desde && f.fecha <= hasta),
    }),
  );
}

export function desglosePorCategoria(
  datos: Pick<DatosPGCrudos, "facturas">,
): CategoriaPG[] {
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
        categoriaIds: [f.categoria_id],
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
      categoriaIds: resto.flatMap((c) => c.categoriaIds),
      nombre: "Otros",
      tipoPl: resto[0].tipoPl,
      monto: montoOtros,
    },
  ];
}

export function desglosePorProveedor(
  datos: Pick<DatosPGCrudos, "facturas">,
  categoriaIds: string[],
): ProveedorPG[] {
  const idsSet = new Set(categoriaIds);
  const acumulado = new Map<string, ProveedorPG>();

  for (const f of datos.facturas) {
    if (!idsSet.has(f.categoria_id)) continue;
    const monto = Number(f.monto);
    const existente = acumulado.get(f.proveedor_id);
    if (existente) {
      existente.monto += monto;
    } else {
      acumulado.set(f.proveedor_id, {
        proveedorId: f.proveedor_id,
        nombre: f.proveedores?.nombre ?? "(Sin proveedor)",
        monto,
      });
    }
  }

  return [...acumulado.values()].sort((a, b) => b.monto - a.monto);
}

export function desglosePorCanal(
  datos: Pick<DatosPGCrudos, "ingresos">,
): CanalPG[] {
  const acumulado = new Map<Canal | "sin_canal", CanalPG>();

  for (const i of datos.ingresos) {
    const clave = i.canal ?? "sin_canal";
    const monto = Number(i.monto_total);
    const existente = acumulado.get(clave);
    if (existente) {
      existente.monto += monto;
    } else {
      acumulado.set(clave, {
        canal: i.canal,
        nombre: i.canal ? CANAL_LABELS[i.canal] : "Sin canal",
        monto,
      });
    }
  }

  return [...acumulado.values()].sort((a, b) => b.monto - a.monto);
}

export function desglosePorCliente(
  datos: Pick<DatosPGCrudos, "pedidos">,
  canal: Canal | null,
  totalCanal: number,
): ClientePG[] {
  const acumulado = new Map<string, ClientePG>();
  let sumaPedidos = 0;

  for (const p of datos.pedidos) {
    if (p.canal !== canal) continue;
    const monto = Number(p.monto_total);
    sumaPedidos += monto;
    const existente = acumulado.get(p.cliente_id);
    if (existente) {
      existente.monto += monto;
    } else {
      acumulado.set(p.cliente_id, {
        clienteId: p.cliente_id,
        nombre: p.clientes?.nombre ?? "(Sin cliente)",
        monto,
      });
    }
  }

  const clientes = [...acumulado.values()].sort((a, b) => b.monto - a.monto);
  const residual = totalCanal - sumaPedidos;

  if (residual > 1) {
    clientes.push({
      clienteId: CLIENTE_OTROS_ID,
      nombre: "Otros ingresos (manual/Excel, sin cliente)",
      monto: residual,
    });
  }

  return clientes;
}

export function calcularVariacion(actual: number, anterior: number): number | null {
  if (anterior === 0) return null;
  return (actual - anterior) / anterior;
}

export function calcularConcentracion(
  datos: Pick<DatosPGCrudos, "facturas" | "pedidos">,
  totalIngresos: number,
): ConcentracionPG {
  const totalFacturas = datos.facturas.reduce((sum, f) => sum + Number(f.monto), 0);

  const porProveedor = new Map<string, ProveedorPG>();
  for (const f of datos.facturas) {
    const monto = Number(f.monto);
    const existente = porProveedor.get(f.proveedor_id);
    if (existente) existente.monto += monto;
    else
      porProveedor.set(f.proveedor_id, {
        proveedorId: f.proveedor_id,
        nombre: f.proveedores?.nombre ?? "(Sin proveedor)",
        monto,
      });
  }

  const porCliente = new Map<string, ClientePG>();
  for (const p of datos.pedidos) {
    const monto = Number(p.monto_total);
    const existente = porCliente.get(p.cliente_id);
    if (existente) existente.monto += monto;
    else
      porCliente.set(p.cliente_id, {
        clienteId: p.cliente_id,
        nombre: p.clientes?.nombre ?? "(Sin cliente)",
        monto,
      });
  }

  const topProveedor = [...porProveedor.values()].sort((a, b) => b.monto - a.monto)[0];
  const topCliente = [...porCliente.values()].sort((a, b) => b.monto - a.monto)[0];

  return {
    topProveedor: topProveedor
      ? {
          nombre: topProveedor.nombre,
          monto: topProveedor.monto,
          pct: totalFacturas !== 0 ? topProveedor.monto / totalFacturas : null,
        }
      : null,
    topCliente: topCliente
      ? {
          nombre: topCliente.nombre,
          monto: topCliente.monto,
          pct: totalIngresos !== 0 ? topCliente.monto / totalIngresos : null,
        }
      : null,
  };
}

export async function calcularPG(
  supabase: SupabaseClient,
  unidad: Unidad,
  desde: string,
  hasta: string,
): Promise<ResumenPG> {
  return resumirPG(await obtenerDatosPG(supabase, unidad, desde, hasta));
}
