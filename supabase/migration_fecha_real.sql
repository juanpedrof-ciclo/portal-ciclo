-- Módulo Financiero · Ciclo Market
-- Migración: dejar de agrupar por "semana fija" (lunes calculado) y pasar a
-- guardar/consultar la fecha real de la venta/despacho. Resultados pasa a
-- trabajar por rango de fechas libre en vez de bloques fijos de semana/mes.
-- Ejecutar en el SQL Editor de Supabase. El orden importa: primero se quita
-- la dependencia de las vistas sobre las columnas que van a cambiar.

-- 1. vista_pedidos_saldo deja de exponer "semana" (la columna se elimina de pedidos)
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

-- 2. ahora sí se puede quitar la columna redundante de pedidos
alter table public.pedidos drop column semana;
drop index if exists public.pedidos_semana_idx;

-- 3. renombrar en ingresos_semanales: ya no es "el lunes de la semana", es la fecha real
alter table public.ingresos_semanales rename column semana to fecha;
alter index ingresos_semanales_semana_idx rename to ingresos_semanales_fecha_idx;

-- 4. vista_ingresos_saldo: exponer "fecha" y calcular mora desde la fecha real
create or replace view public.vista_ingresos_saldo
with (security_invoker = true) as
select
  i.id,
  i.fecha,
  i.monto_total,
  i.canal,
  i.origen,
  i.archivo_excel_url,
  i.notas,
  coalesce(pa.aplicado, 0) as monto_aplicado,
  i.monto_total - coalesce(pa.aplicado, 0) as saldo_pendiente,
  (current_date - i.fecha) as dias_mora
from public.ingresos_semanales i
left join (
  select pa.ingreso_id, sum(pa.monto_aplicado) as aplicado
  from public.pago_aplicaciones pa
  join public.pagos pg on pg.id = pa.pago_id
  where pa.ingreso_id is not null and pg.anulado = false
  group by pa.ingreso_id
) pa on pa.ingreso_id = i.id
where i.anulado = false;
