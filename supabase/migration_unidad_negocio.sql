-- Módulo Financiero · separación Ciclo Finca / Ciclo Market
-- Ejecutar completo en el SQL Editor de Supabase, después de todas las migraciones
-- anteriores. Aditivo: agrega `unidad` a las 12 tablas del financiero con
-- default 'market' (así los datos existentes, todos de Market, quedan marcados sin
-- necesidad de un UPDATE separado), amplía los UNIQUE compartidos a (unidad, ...),
-- y reescribe las vistas para que el filtro por unidad no se pierda en los joins.
--
-- Antes de correr en producción: confirmar con \d <tabla> que los nombres de
-- constraint de la sección 2 coinciden con los reales (son los que Postgres genera
-- automáticamente para un `unique(...)` inline sin nombre explícito).

begin;

-- =========================================================
-- 1. COLUMNA `unidad`
-- =========================================================

alter table public.proveedores           add column unidad text not null default 'market' check (unidad in ('finca','market'));
alter table public.categorias            add column unidad text not null default 'market' check (unidad in ('finca','market'));
alter table public.clientes              add column unidad text not null default 'market' check (unidad in ('finca','market'));
alter table public.formatos_carga        add column unidad text not null default 'market' check (unidad in ('finca','market'));
alter table public.ingresos_semanales    add column unidad text not null default 'market' check (unidad in ('finca','market'));
alter table public.facturas              add column unidad text not null default 'market' check (unidad in ('finca','market'));
alter table public.pedidos               add column unidad text not null default 'market' check (unidad in ('finca','market'));
alter table public.pagos                 add column unidad text not null default 'market' check (unidad in ('finca','market'));
alter table public.pago_aplicaciones     add column unidad text not null default 'market' check (unidad in ('finca','market'));
alter table public.movimientos_bancarios add column unidad text not null default 'market' check (unidad in ('finca','market'));
alter table public.saldos_iniciales      add column unidad text not null default 'market' check (unidad in ('finca','market'));
alter table public.ajustes_caja_banco    add column unidad text not null default 'market' check (unidad in ('finca','market'));

-- =========================================================
-- 2. CONSTRAINTS UNICOS -> compuestos con unidad
-- =========================================================

alter table public.proveedores
  drop constraint proveedores_nombre_key,
  add constraint proveedores_unidad_nombre_key unique (unidad, nombre);

alter table public.categorias
  drop constraint categorias_nombre_key,
  add constraint categorias_unidad_nombre_key unique (unidad, nombre);

alter table public.clientes
  drop constraint clientes_nombre_telefono_key,
  add constraint clientes_unidad_nombre_telefono_key unique (unidad, nombre, telefono);

alter table public.formatos_carga
  drop constraint formatos_carga_nombre_key,
  add constraint formatos_carga_unidad_nombre_key unique (unidad, nombre);

alter table public.pedidos
  drop constraint pedidos_plataforma_id_orden_externo_key,
  add constraint pedidos_unidad_plataforma_id_orden_externo_key
    unique (unidad, plataforma, id_orden_externo);

-- =========================================================
-- 3. INDICES
-- =========================================================

create index ingresos_semanales_unidad_fecha_idx on public.ingresos_semanales (unidad, fecha);
create index facturas_unidad_fecha_idx on public.facturas (unidad, fecha);
create index pedidos_unidad_fecha_idx on public.pedidos (unidad, fecha);
create index pagos_unidad_idx on public.pagos (unidad);

-- =========================================================
-- 4. VISTAS (reescritas con unidad propagada)
-- =========================================================

create or replace view public.vista_facturas_saldo
with (security_invoker = true) as
select
  f.id, f.unidad, f.proveedor_id, p.nombre as proveedor_nombre,
  f.categoria_id, c.nombre as categoria_nombre, c.tipo_pl,
  f.fecha, f.monto, f.estado, f.soporte_url, f.numero_factura, f.notas,
  coalesce(pa.aplicado, 0) as monto_aplicado,
  f.monto - coalesce(pa.aplicado, 0) as saldo_pendiente,
  (current_date - f.fecha) as dias_transcurridos
from public.facturas f
join public.proveedores p on p.id = f.proveedor_id and p.unidad = f.unidad
join public.categorias c on c.id = f.categoria_id and c.unidad = f.unidad
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
  i.id, i.unidad, i.fecha, i.monto_total, i.canal, i.origen, i.archivo_excel_url, i.notas,
  coalesce(case when i.origen = 'pedidos' then pa_pedidos.aplicado else pa_directo.aplicado end, 0) as monto_aplicado,
  i.monto_total - coalesce(case when i.origen = 'pedidos' then pa_pedidos.aplicado else pa_directo.aplicado end, 0) as saldo_pendiente,
  (current_date - i.fecha) as dias_mora
from public.ingresos_semanales i
left join (
  select pa.ingreso_id, sum(pa.monto_aplicado) as aplicado
  from public.pago_aplicaciones pa
  join public.pagos pg on pg.id = pa.pago_id
  where pa.ingreso_id is not null and pg.anulado = false
  group by pa.ingreso_id
) pa_directo on pa_directo.ingreso_id = i.id
left join (
  select p.unidad, p.fecha, p.canal, sum(pa.monto_aplicado) as aplicado
  from public.pedidos p
  join public.pago_aplicaciones pa on pa.pedido_id = p.id
  join public.pagos pg on pg.id = pa.pago_id
  where p.anulado = false and pg.anulado = false
  group by p.unidad, p.fecha, p.canal
) pa_pedidos
  on i.origen = 'pedidos'
  and pa_pedidos.unidad = i.unidad
  and pa_pedidos.fecha = i.fecha
  and pa_pedidos.canal is not distinct from i.canal
where i.anulado = false;

create or replace view public.vista_pedidos_saldo
with (security_invoker = true) as
select
  p.id, p.unidad, p.cliente_id, c.nombre as cliente_nombre, c.telefono as cliente_telefono,
  p.formato_id, p.plataforma, p.id_orden_externo, p.fecha, p.canal, p.monto_total,
  p.estado, p.archivo_origen,
  coalesce(pa.aplicado, 0) as monto_aplicado,
  p.monto_total - coalesce(pa.aplicado, 0) as saldo_pendiente,
  (current_date - p.fecha) as dias_transcurridos
from public.pedidos p
join public.clientes c on c.id = p.cliente_id and c.unidad = p.unidad
left join (
  select pa.pedido_id, sum(pa.monto_aplicado) as aplicado
  from public.pago_aplicaciones pa
  join public.pagos pg on pg.id = pa.pago_id
  where pa.pedido_id is not null and pg.anulado = false
  group by pa.pedido_id
) pa on pa.pedido_id = p.id
where p.anulado = false;

create or replace view public.vista_cartera_cliente
with (security_invoker = true) as
select
  c.id as cliente_id, c.unidad, c.nombre, c.telefono,
  count(*) filter (where v.saldo_pendiente > 0.01) as pedidos_pendientes,
  coalesce(sum(v.saldo_pendiente) filter (where v.saldo_pendiente > 0.01), 0) as saldo_total,
  max(v.dias_transcurridos) filter (where v.saldo_pendiente > 0.01) as dias_max_mora
from public.clientes c
left join public.vista_pedidos_saldo v on v.cliente_id = c.id and v.unidad = c.unidad
group by c.id, c.unidad, c.nombre, c.telefono;

create or replace view public.vista_saldo_banco_caja
with (security_invoker = true) as
with destinos as (
  select u.unidad, d.destino
  from unnest(array['finca', 'market']) as u(unidad)
  cross join unnest(array['banco', 'caja']) as d(destino)
),
base as (
  select distinct on (si.unidad, si.destino)
    si.unidad, si.destino, si.fecha as saldo_inicial_fecha, si.monto as saldo_inicial_monto
  from public.saldos_iniciales si
  order by si.unidad, si.destino, si.fecha desc, si.created_at desc
),
destinos_base as (
  select
    d.unidad, d.destino, b.saldo_inicial_fecha,
    coalesce(b.saldo_inicial_monto, 0) as saldo_inicial_monto
  from destinos d
  left join base b on b.unidad = d.unidad and b.destino = d.destino
),
pagos_sum as (
  select
    db.unidad, db.destino,
    coalesce(sum(case when pg.tipo = 'cobro_cliente' then pg.monto else -pg.monto end), 0) as monto_pagos
  from destinos_base db
  left join public.pagos pg
    on pg.unidad = db.unidad
    and pg.destino = db.destino
    and pg.anulado = false
    and (db.saldo_inicial_fecha is null or pg.fecha >= db.saldo_inicial_fecha)
  group by db.unidad, db.destino
),
ajustes_sum as (
  select
    db.unidad, db.destino,
    coalesce(sum(a.monto), 0) as monto_ajustes
  from destinos_base db
  left join public.ajustes_caja_banco a
    on a.unidad = db.unidad
    and a.destino = db.destino
    and a.anulado = false
    and (db.saldo_inicial_fecha is null or a.fecha >= db.saldo_inicial_fecha)
  group by db.unidad, db.destino
)
select
  db.unidad, db.destino, db.saldo_inicial_fecha, db.saldo_inicial_monto,
  ps.monto_pagos, aj.monto_ajustes,
  db.saldo_inicial_monto + ps.monto_pagos + aj.monto_ajustes as saldo_actual
from destinos_base db
join pagos_sum ps on ps.unidad = db.unidad and ps.destino = db.destino
join ajustes_sum aj on aj.unidad = db.unidad and aj.destino = db.destino;

create or replace view public.vista_pagos_detalle
with (security_invoker = true) as
select
  pg.id, pg.unidad, pg.tipo, pg.fecha, pg.monto, pg.destino, pg.referencia, pg.notas,
  pg.anulado, pg.created_at, pg.creado_por,
  det.contraparte_nombre, det.contraparte_fecha
from public.pagos pg
left join lateral (
  select
    coalesce(prov.nombre, cli.nombre) as contraparte_nombre,
    coalesce(f.fecha, i.fecha, p.fecha) as contraparte_fecha
  from public.pago_aplicaciones pa
  left join public.facturas f on f.id = pa.factura_id
  left join public.proveedores prov on prov.id = f.proveedor_id
  left join public.ingresos_semanales i on i.id = pa.ingreso_id
  left join public.pedidos p on p.id = pa.pedido_id
  left join public.clientes cli on cli.id = p.cliente_id
  where pa.pago_id = pg.id
  order by pa.created_at
  limit 1
) det on true;

commit;
