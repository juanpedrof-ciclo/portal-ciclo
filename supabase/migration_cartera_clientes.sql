-- Módulo Financiero · Ciclo Market
-- Migración: cartera por cliente (ventas por línea de detalle)
-- Ejecutar completo en el SQL Editor de Supabase, después de schema.sql.

-- =========================================================
-- 1. CLIENTES (lista que crece, como proveedores)
-- =========================================================
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text not null default '',
  created_at timestamptz not null default now(),
  creado_por uuid references auth.users(id) default auth.uid(),
  unique (nombre, telefono)
);

-- =========================================================
-- 2. FORMATOS_CARGA (mapeo de columnas por plataforma, reutilizable)
-- =========================================================
create table public.formatos_carga (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  mapeo_columnas jsonb not null,
  created_at timestamptz not null default now(),
  creado_por uuid references auth.users(id) default auth.uid()
);

-- =========================================================
-- 3. PEDIDOS (ventas por cliente, cabecera agrupada desde las líneas)
-- =========================================================
create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id),
  formato_id uuid references public.formatos_carga(id),
  plataforma text not null,
  id_orden_externo text not null,
  fecha date not null,
  semana date not null,
  canal text check (canal in ('hogar', 'horeca')),
  monto_total numeric(14, 2) not null check (monto_total >= 0),
  estado text,
  archivo_origen text,
  created_at timestamptz not null default now(),
  creado_por uuid references auth.users(id) default auth.uid(),
  unique (plataforma, id_orden_externo)
);

create index pedidos_cliente_id_idx on public.pedidos (cliente_id);
create index pedidos_semana_idx on public.pedidos (semana);

-- =========================================================
-- 4. PAGO_APLICACIONES: agregar destino "pedido"
-- =========================================================
alter table public.pago_aplicaciones
  add column pedido_id uuid references public.pedidos(id) on delete restrict;

alter table public.pago_aplicaciones
  drop constraint pago_aplicaciones_un_destino;

alter table public.pago_aplicaciones
  add constraint pago_aplicaciones_un_destino check (
    (factura_id is not null)::int + (ingreso_id is not null)::int + (pedido_id is not null)::int = 1
  );

create index pago_aplicaciones_pedido_id_idx on public.pago_aplicaciones (pedido_id);

-- =========================================================
-- 5. INGRESOS_SEMANALES: nuevo origen "pedidos" (fila auto-gestionada
--    que resume los pedidos de una semana+canal para el P&G)
-- =========================================================
alter table public.ingresos_semanales
  drop constraint ingresos_semanales_origen_check;

alter table public.ingresos_semanales
  add constraint ingresos_semanales_origen_check
  check (origen in ('manual', 'excel', 'pedidos'));

-- =========================================================
-- VISTAS
-- =========================================================

-- Saldo pendiente y días transcurridos por pedido
create view public.vista_pedidos_saldo
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
  select pedido_id, sum(monto_aplicado) as aplicado
  from public.pago_aplicaciones
  where pedido_id is not null
  group by pedido_id
) pa on pa.pedido_id = p.id;

-- Cartera por cliente: saldo total, pedidos pendientes y mora máxima
create view public.vista_cartera_cliente
with (security_invoker = true) as
select
  c.id as cliente_id,
  c.nombre,
  c.telefono,
  count(*) filter (where v.saldo_pendiente > 0.01) as pedidos_pendientes,
  coalesce(sum(v.saldo_pendiente) filter (where v.saldo_pendiente > 0.01), 0) as saldo_total,
  max(v.dias_transcurridos) filter (where v.saldo_pendiente > 0.01) as dias_max_mora
from public.clientes c
left join public.vista_pedidos_saldo v on v.cliente_id = c.id
group by c.id, c.nombre, c.telefono;

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table public.clientes enable row level security;
alter table public.formatos_carga enable row level security;
alter table public.pedidos enable row level security;

create policy "authenticated_all" on public.clientes
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on public.formatos_carga
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on public.pedidos
  for all to authenticated using (true) with check (true);

-- =========================================================
-- STORAGE: bucket privado para los archivos de ventas cargados
-- =========================================================

insert into storage.buckets (id, name, public)
values ('pedidos-archivos', 'pedidos-archivos', false)
on conflict (id) do nothing;

create policy "authenticated_select_pedidos_bucket" on storage.objects
  for select to authenticated
  using (bucket_id = 'pedidos-archivos');

create policy "authenticated_insert_pedidos_bucket" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'pedidos-archivos');

create policy "authenticated_update_pedidos_bucket" on storage.objects
  for update to authenticated
  using (bucket_id = 'pedidos-archivos');

create policy "authenticated_delete_pedidos_bucket" on storage.objects
  for delete to authenticated
  using (bucket_id = 'pedidos-archivos');
