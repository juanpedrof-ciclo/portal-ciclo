export type Unidad = "finca" | "market";
export type TipoPL = "costo_producto" | "gasto_venta" | "gasto_administrativo";
export type Canal = "hogar" | "horeca";
export type OrigenIngreso = "manual" | "excel" | "pedidos";
export type EstadoFactura = "pendiente" | "pagado";
export type TipoPago = "pago_proveedor" | "cobro_cliente";
export type DestinoPago = "banco" | "caja" | "historico";
export type DestinoCuenta = "banco" | "caja";
export type TipoMovimiento = "credito" | "debito";

export type Proveedor = {
  id: string;
  unidad: Unidad;
  nombre: string;
  created_at: string;
  creado_por: string | null;
};

export type Categoria = {
  id: string;
  unidad: Unidad;
  nombre: string;
  tipo_pl: TipoPL;
  created_at: string;
  creado_por: string | null;
};

export type IngresoSemanal = {
  id: string;
  unidad: Unidad;
  fecha: string;
  monto_total: number;
  canal: Canal | null;
  origen: OrigenIngreso;
  archivo_excel_url: string | null;
  notas: string | null;
  created_at: string;
  creado_por: string | null;
  anulado: boolean;
  anulado_at: string | null;
  anulado_por: string | null;
};

export type Factura = {
  id: string;
  unidad: Unidad;
  proveedor_id: string;
  categoria_id: string;
  fecha: string;
  monto: number;
  estado: EstadoFactura;
  soporte_url: string | null;
  numero_factura: string | null;
  notas: string | null;
  created_at: string;
  creado_por: string | null;
  anulado: boolean;
  anulado_at: string | null;
  anulado_por: string | null;
};

export type FacturaConRelaciones = Factura & {
  proveedores: { nombre: string } | null;
  categorias: { nombre: string; tipo_pl: TipoPL } | null;
};

export type Pago = {
  id: string;
  unidad: Unidad;
  tipo: TipoPago;
  fecha: string;
  monto: number;
  destino: DestinoPago;
  referencia: string | null;
  notas: string | null;
  created_at: string;
  creado_por: string | null;
  anulado: boolean;
  anulado_at: string | null;
  anulado_por: string | null;
};

export type PagoAplicacion = {
  id: string;
  unidad: Unidad;
  pago_id: string;
  factura_id: string | null;
  ingreso_id: string | null;
  monto_aplicado: number;
  created_at: string;
};

export type MovimientoBancario = {
  id: string;
  unidad: Unidad;
  fecha: string;
  descripcion: string | null;
  monto: number;
  tipo: TipoMovimiento;
  conciliado: boolean;
  pago_id: string | null;
  notas: string | null;
  created_at: string;
  creado_por: string | null;
};

export type SaldoInicial = {
  id: string;
  unidad: Unidad;
  destino: DestinoCuenta;
  fecha: string;
  monto: number;
  notas: string | null;
  created_at: string;
  creado_por: string | null;
};

export type AjusteCajaBanco = {
  id: string;
  unidad: Unidad;
  destino: DestinoCuenta;
  fecha: string;
  monto: number;
  motivo: string;
  created_at: string;
  creado_por: string | null;
  anulado: boolean;
  anulado_at: string | null;
  anulado_por: string | null;
};

export type VistaSaldoBancoCaja = {
  unidad: Unidad;
  destino: DestinoCuenta;
  saldo_inicial_fecha: string | null;
  saldo_inicial_monto: number;
  monto_pagos: number;
  monto_ajustes: number;
  saldo_actual: number;
};

export type VistaFacturaSaldo = {
  id: string;
  unidad: Unidad;
  proveedor_id: string;
  proveedor_nombre: string;
  categoria_id: string;
  categoria_nombre: string;
  tipo_pl: TipoPL;
  fecha: string;
  monto: number;
  estado: EstadoFactura;
  soporte_url: string | null;
  numero_factura: string | null;
  notas: string | null;
  monto_aplicado: number;
  saldo_pendiente: number;
  dias_transcurridos: number;
};

export type VistaIngresoSaldo = {
  id: string;
  unidad: Unidad;
  fecha: string;
  monto_total: number;
  canal: Canal | null;
  origen: OrigenIngreso;
  archivo_excel_url: string | null;
  notas: string | null;
  monto_aplicado: number;
  saldo_pendiente: number;
  dias_mora: number;
};

export type Cliente = {
  id: string;
  unidad: Unidad;
  nombre: string;
  telefono: string;
  created_at: string;
  creado_por: string | null;
};

export type MapeoColumnas = {
  cliente: string;
  telefono?: string;
  producto: string;
  id_orden: string;
  cantidad?: string;
  total: string;
  estado?: string;
  fecha?: string;
};

export type FormatoCarga = {
  id: string;
  unidad: Unidad;
  nombre: string;
  mapeo_columnas: MapeoColumnas;
  created_at: string;
  creado_por: string | null;
};

export type Pedido = {
  id: string;
  unidad: Unidad;
  cliente_id: string;
  formato_id: string | null;
  plataforma: string;
  id_orden_externo: string;
  fecha: string;
  canal: Canal | null;
  monto_total: number;
  estado: string | null;
  archivo_origen: string | null;
  created_at: string;
  creado_por: string | null;
  anulado: boolean;
  anulado_at: string | null;
  anulado_por: string | null;
};

export type VistaPedidoSaldo = {
  id: string;
  unidad: Unidad;
  cliente_id: string;
  cliente_nombre: string;
  cliente_telefono: string;
  formato_id: string | null;
  plataforma: string;
  id_orden_externo: string;
  fecha: string;
  canal: Canal | null;
  monto_total: number;
  estado: string | null;
  archivo_origen: string | null;
  monto_aplicado: number;
  saldo_pendiente: number;
  dias_transcurridos: number;
};

export type VistaCarteraCliente = {
  cliente_id: string;
  unidad: Unidad;
  nombre: string;
  telefono: string;
  pedidos_pendientes: number;
  saldo_total: number;
  dias_max_mora: number | null;
};

export const CATEGORIA_LABELS: Record<TipoPL, string> = {
  costo_producto: "Costo de producto",
  gasto_venta: "Gasto de venta",
  gasto_administrativo: "Gasto administrativo",
};

export const CANAL_LABELS: Record<Canal, string> = {
  hogar: "Hogar",
  horeca: "HORECA",
};

export const ORIGEN_INGRESO_LABELS: Record<OrigenIngreso, string> = {
  manual: "Manual",
  excel: "Excel",
  pedidos: "Pedidos (automático)",
};

export const DESTINO_CUENTA_LABELS: Record<DestinoCuenta, string> = {
  banco: "Banco",
  caja: "Caja / efectivo",
};

export const DESTINO_PAGO_LABELS: Record<DestinoPago, string> = {
  banco: "Banco",
  caja: "Caja / efectivo",
  historico: "Histórico (cierre de cartera)",
};

export function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatFechaCorta(value: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function formatPorcentaje(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatCOPCompacto(value: number): string {
  const signo = value < 0 ? "-" : "";
  const abs = Math.abs(value);

  if (abs >= 1_000_000) {
    return `${signo}$${(abs / 1_000_000).toFixed(1).replace(".", ",")}M`;
  }
  if (abs >= 1_000) {
    return `${signo}$${(abs / 1_000).toFixed(0)}K`;
  }
  return `${signo}$${abs}`;
}
