-- Módulo Financiero · Ciclo Market
-- Migración: anulación (borrado suave) de ingresos, pedidos, facturas y pagos.
-- Ejecutar completo en el SQL Editor de Supabase, después de schema.sql y
-- migration_cartera_clientes.sql.

-- =========================================================
-- 1. COLUMNAS DE ANULACIÓN
-- =========================================================

alter table public.ingresos_semanales
  add column anulado boolean not null default false,
  add column anulado_at timestamptz,
  add column anulado_por uuid references auth.users(id);

alter table public.pedidos
  add column anulado boolean not null default false,
  add column anulado_at timestamptz,
  add column anulado_por uuid references auth.users(id);

alter table public.facturas
  add column anulado boolean not null default false,
  add column anulado_at timestamptz,
  add column anulado_por uuid references auth.users(id);

alter table public.pagos
  add column anulado boolean not null default false,
  add column anulado_at timestamptz,
  add column anulado_por uuid references auth.users(id);

-- =========================================================
-- 2. VISTAS: excluir registros anulados y aplicaciones de
--    pagos anulados (el cruce se deshace solo, sin tocar
--    pago_aplicaciones).
-- =========================================================

create or replace view public.vista_facturas_saldo
with (security_invoker = true) as
select
  f.id,
  f.proveedor_id,
  p.nombre as proveedor_nombre,
  f.categoria_id,
  c.nombre as categoria_nombre,
  c.tipo_pl,
  f.fecha,
  f.monto,
  f.estado,
  f.soporte_url,
  f.notas,
  coalesce(pa.aplicado, 0) as monto_aplicado,
  f.monto - coalesce(pa.aplicado, 0) as saldo_pendiente,
  (current_date - f.fecha) as dias_transcurridos
from public.facturas f
join public.proveedores p on p.id = f.proveedor_id
join public.categorias c on c.id = f.categoria_id
left join (
  select pa.factura_id, sum(pa.monto_aplicado) as aplicado
  from public.pago_aplicaciones pa
  join public.pagos pg on pg.id = pa.pago_id
  where pa.factura_id is not null and pg.anulado = false
  group by pa.factura_id
) pa on pa.factura_id = f.id
where f.anulado = false;

create or replace view public.vista_ingresos_saldo
with (security_invoker = true) as
select
  i.id,
  i.semana,
  i.monto_total,
  i.canal,
  i.origen,
  i.archivo_excel_url,
  i.notas,
  coalesce(pa.aplicado, 0) as monto_aplicado,
  i.monto_total - coalesce(pa.aplicado, 0) as saldo_pendiente,
  (current_date - i.semana) as dias_mora
from public.ingresos_semanales i
left join (
  select pa.ingreso_id, sum(pa.monto_aplicado) as aplicado
  from public.pago_aplicaciones pa
  join public.pagos pg on pg.id = pa.pago_id
  where pa.ingreso_id is not null and pg.anulado = false
  group by pa.ingreso_id
) pa on pa.ingreso_id = i.id
where i.anulado = false;

create or replace view public.vista_pedidos_saldo
with (security_invoker = true) as
select
  p.id,
  p.cliente_id,
  c.nombre as cliente_nombre,
  c.telefono as cliente_telefono,
  p.formato_id,
  p.plataforma,
  p.id_orden_externo,
  p.fecha,
  p.semana,
  p.canal,
  p.monto_total,
  p.estado,
  p.archivo_origen,
  coalesce(pa.aplicado, 0) as monto_aplicado,
  p.monto_total - coalesce(pa.aplicado, 0) as saldo_pendiente,
  (current_date - p.fecha) as dias_transcurridos
from public.pedidos p
join public.clientes c on c.id = p.cliente_id
left join (
  select pa.pedido_id, sum(pa.monto_aplicado) as aplicado
  from public.pago_aplicaciones pa
  join public.pagos pg on pg.id = pa.pago_id
  where pa.pedido_id is not null and pg.anulado = false
  group by pa.pedido_id
) pa on pa.pedido_id = p.id
where p.anulado = false;

-- vista_cartera_cliente no cambia: hereda el filtro de anulado porque se
-- apoya en vista_pedidos_saldo.
