export type TipoPL = "costo_producto" | "gasto_venta" | "gasto_administrativo";
export type Canal = "hogar" | "horeca";
export type OrigenIngreso = "manual" | "excel" | "pedidos";
export type EstadoFactura = "pendiente" | "pagado";
export type TipoPago = "pago_proveedor" | "cobro_cliente";
export type DestinoPago = "banco" | "caja";
export type TipoMovimiento = "credito" | "debito";

export type Proveedor = {
  id: string;
  nombre: string;
  created_at: string;
  creado_por: string | null;
};

export type Categoria = {
  id: string;
  nombre: string;
  tipo_pl: TipoPL;
  created_at: string;
  creado_por: string | null;
};

export type IngresoSemanal = {
  id: string;
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
  pago_id: string;
  factura_id: string | null;
  ingreso_id: string | null;
  monto_aplicado: number;
  created_at: string;
};

export type MovimientoBancario = {
  id: string;
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

export type VistaFacturaSaldo = {
  id: string;
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
  nombre: string;
  mapeo_columnas: MapeoColumnas;
  created_at: string;
  creado_por: string | null;
};

export type Pedido = {
  id: string;
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
