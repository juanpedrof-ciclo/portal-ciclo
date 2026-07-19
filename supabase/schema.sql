-- Módulo Financiero · Ciclo Market
-- Ejecutar completo en el SQL Editor de Supabase (proyecto nuevo o vacío).

create extension if not exists "pgcrypto";

-- =========================================================
-- 1. PROVEEDORES (lista que crece)
-- =========================================================
create table public.proveedores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  created_at timestamptz not null default now(),
  creado_por uuid references auth.users(id) default auth.uid()
);

-- =========================================================
-- 2. CATEGORIAS (lista que crece, etiquetada al grupo del P&G)
-- =========================================================
create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  tipo_pl text not null check (tipo_pl in ('costo_producto', 'gasto_venta', 'gasto_administrativo')),
  created_at timestamptz not null default now(),
  creado_por uuid references auth.users(id) default auth.uid()
);

insert into public.categorias (nombre, tipo_pl) values
  ('Costo de producto', 'costo_producto'),
  ('Gasto de venta', 'gasto_venta'),
  ('Gasto administrativo', 'gasto_administrativo');

-- =========================================================
-- 3. INGRESOS SEMANALES
-- =========================================================
create table public.ingresos_semanales (
  id uuid primary key default gen_random_uuid(),
  semana date not null,
  monto_total numeric(14, 2) not null check (monto_total >= 0),
  canal text check (canal in ('hogar', 'horeca')),
  origen text not null default 'manual' check (origen in ('manual', 'excel')),
  archivo_excel_url text,
  notas text,
  created_at timestamptz not null default now(),
  creado_por uuid references auth.users(id) default auth.uid()
);

create index ingresos_semanales_semana_idx on public.ingresos_semanales (semana);

-- =========================================================
-- 4. FACTURAS (costos y gastos, una fila por factura)
-- =========================================================
create table public.facturas (
  id uuid primary key default gen_random_uuid(),
  proveedor_id uuid not null references public.proveedores(id),
  categoria_id uuid not null references public.categorias(id),
  fecha date not null,
  monto numeric(14, 2) not null check (monto > 0),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'pagado')),
  soporte_url text,
  notas text,
  created_at timestamptz not null default now(),
  creado_por uuid references auth.users(id) default auth.uid()
);

create index facturas_proveedor_id_idx on public.facturas (proveedor_id);
create index facturas_fecha_idx on public.facturas (fecha);

-- =========================================================
-- 5. PAGOS (recibos de pago: a proveedor o de cliente)
-- =========================================================
create table public.pagos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('pago_proveedor', 'cobro_cliente')),
  fecha date not null,
  monto numeric(14, 2) not null check (monto > 0),
  destino text not null check (destino in ('banco', 'caja')),
  referencia text,
  notas text,
  created_at timestamptz not null default now(),
  creado_por uuid references auth.users(id) default auth.uid()
);

-- =========================================================
-- 6. PAGO_APLICACIONES (tabla puente: hoy 1 a 1, lista para
--    que un pago cubra varias facturas en el futuro)
-- =========================================================
create table public.pago_aplicaciones (
  id uuid primary key default gen_random_uuid(),
  pago_id uuid not null references public.pagos(id) on delete cascade,
  factura_id uuid references public.facturas(id) on delete restrict,
  ingreso_id uuid references public.ingresos_semanales(id) on delete restrict,
  monto_aplicado numeric(14, 2) not null check (monto_aplicado > 0),
  created_at timestamptz not null default now(),
  constraint pago_aplicaciones_un_destino check (
    (factura_id is not null)::int + (ingreso_id is not null)::int = 1
  )
);

create index pago_aplicaciones_pago_id_idx on public.pago_aplicaciones (pago_id);
create index pago_aplicaciones_factura_id_idx on public.pago_aplicaciones (factura_id);
create index pago_aplicaciones_ingreso_id_idx on public.pago_aplicaciones (ingreso_id);

-- =========================================================
-- 7. MOVIMIENTOS BANCARIOS (extracto, para conciliación)
-- =========================================================
create table public.movimientos_bancarios (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  descripcion text,
  monto numeric(14, 2) not null check (monto > 0),
  tipo text not null check (tipo in ('credito', 'debito')),
  conciliado boolean not null default false,
  pago_id uuid references public.pagos(id),
  notas text,
  created_at timestamptz not null default now(),
  creado_por uuid references auth.users(id) default auth.uid()
);

create index movimientos_bancarios_fecha_idx on public.movimientos_bancarios (fecha);

-- =========================================================
-- VISTAS
-- =========================================================

-- Cuentas por pagar: saldo pendiente y días transcurridos por factura
create view public.vista_facturas_saldo
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
  select factura_id, sum(monto_aplicado) as aplicado
  from public.pago_aplicaciones
  where factura_id is not null
  group by factura_id
) pa on pa.factura_id = f.id;

-- Cuentas por cobrar: saldo pendiente y días de mora por ingreso semanal
create view public.vista_ingresos_saldo
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
  select ingreso_id, sum(monto_aplicado) as aplicado
  from public.pago_aplicaciones
  where ingreso_id is not null
  group by ingreso_id
) pa on pa.ingreso_id = i.id;

-- =========================================================
-- ROW LEVEL SECURITY
-- Solo usuarios autenticados (con sesión Supabase Auth) pueden
-- leer o escribir. Sin sesión, el anon/publishable key no da acceso.
-- =========================================================

alter table public.proveedores enable row level security;
alter table public.categorias enable row level security;
alter table public.ingresos_semanales enable row level security;
alter table public.facturas enable row level security;
alter table public.pagos enable row level security;
alter table public.pago_aplicaciones enable row level security;
alter table public.movimientos_bancarios enable row level security;

create policy "authenticated_all" on public.proveedores
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on public.categorias
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on public.ingresos_semanales
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on public.facturas
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on public.pagos
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on public.pago_aplicaciones
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on public.movimientos_bancarios
  for all to authenticated using (true) with check (true);

-- =========================================================
-- STORAGE: buckets privados para soportes de facturas y excel de ingresos
-- =========================================================

insert into storage.buckets (id, name, public)
values
  ('facturas-soportes', 'facturas-soportes', false),
  ('ingresos-excel', 'ingresos-excel', false)
on conflict (id) do nothing;

create policy "authenticated_select_financiero_buckets" on storage.objects
  for select to authenticated
  using (bucket_id in ('facturas-soportes', 'ingresos-excel'));

create policy "authenticated_insert_financiero_buckets" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('facturas-soportes', 'ingresos-excel'));

create policy "authenticated_update_financiero_buckets" on storage.objects
  for update to authenticated
  using (bucket_id in ('facturas-soportes', 'ingresos-excel'));

create policy "authenticated_delete_financiero_buckets" on storage.objects
  for delete to authenticated
  using (bucket_id in ('facturas-soportes', 'ingresos-excel'));
