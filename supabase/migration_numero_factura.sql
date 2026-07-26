-- Módulo Financiero · Ciclo Market
-- Migración: número de factura (dato extraído por lectura automática con IA).
-- Ejecutar completo en el SQL Editor de Supabase, después de schema.sql,
-- migration_cartera_clientes.sql y migration_anulacion.sql.

alter table public.facturas
  add column numero_factura text;

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
  f.numero_factura,
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
