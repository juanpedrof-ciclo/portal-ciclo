-- Módulo Productivo · Ciclo Finca
-- Gestión de insumos: catálogo, entradas, salidas e inventario calculado.
-- Ejecutar completo en el SQL Editor de Supabase, después de migration_productivo.sql.

begin;

create table public.insumo_categorias (
  id uuid primary key default gen_random_uuid(),
  unidad text not null default 'finca' check (unidad = 'finca'),
  nombre text not null,
  created_at timestamptz not null default now(),
  creado_por uuid references auth.users(id) default auth.uid(),
  unique (unidad, nombre)
);

insert into public.insumo_categorias (nombre) values
  ('Alimento'), ('Medicamento'), ('Herramienta'), ('Otro');

create table public.insumos (
  id uuid primary key default gen_random_uuid(),
  unidad text not null default 'finca' check (unidad = 'finca'),
  nombre text not null,
  categoria_id uuid not null references public.insumo_categorias(id),
  unidad_medida text not null check (unidad_medida in ('kg', 'bultos', 'litros', 'unidades')),
  stock_minimo numeric(12, 2),
  notas text,
  created_at timestamptz not null default now(),
  creado_por uuid references auth.users(id) default auth.uid(),
  unique (unidad, nombre)
);

create table public.insumo_entradas (
  id uuid primary key default gen_random_uuid(),
  unidad text not null default 'finca' check (unidad = 'finca'),
  insumo_id uuid not null references public.insumos(id),
  fecha date not null,
  cantidad numeric(12, 2) not null check (cantidad > 0),
  proveedor text,
  costo numeric(12, 2) check (costo is null or costo >= 0),
  notas text,
  created_at timestamptz not null default now(),
  creado_por uuid references auth.users(id) default auth.uid(),
  anulado boolean not null default false,
  anulado_at timestamptz,
  anulado_por uuid references auth.users(id)
);
create index insumo_entradas_insumo_fecha_idx on public.insumo_entradas (insumo_id, fecha);

create table public.insumo_salidas (
  id uuid primary key default gen_random_uuid(),
  unidad text not null default 'finca' check (unidad = 'finca'),
  insumo_id uuid not null references public.insumos(id),
  fecha date not null,
  cantidad numeric(12, 2) not null check (cantidad > 0),
  motivo text not null,
  notas text,
  created_at timestamptz not null default now(),
  creado_por uuid references auth.users(id) default auth.uid(),
  anulado boolean not null default false,
  anulado_at timestamptz,
  anulado_por uuid references auth.users(id)
);
create index insumo_salidas_insumo_fecha_idx on public.insumo_salidas (insumo_id, fecha);

-- Descuento automático: la alimentación puede referenciar el insumo consumido.
-- El stock se calcula restando estos kg directamente, sin duplicar en insumo_salidas.
alter table public.alimentacion_registros
  add column insumo_id uuid references public.insumos(id);

create view public.vista_inventario_insumos
with (security_invoker = true) as
select
  i.id, i.unidad, i.nombre, i.categoria_id, cat.nombre as categoria_nombre,
  i.unidad_medida, i.stock_minimo,
  coalesce(e.total, 0) as total_entradas,
  coalesce(s.total, 0) as total_salidas,
  coalesce(c.total, 0) as total_consumo,
  coalesce(e.total, 0) - coalesce(s.total, 0) - coalesce(c.total, 0) as stock_actual,
  (i.stock_minimo is not null
    and coalesce(e.total, 0) - coalesce(s.total, 0) - coalesce(c.total, 0) <= i.stock_minimo) as bajo_stock
from public.insumos i
join public.insumo_categorias cat on cat.id = i.categoria_id
left join (
  select insumo_id, sum(cantidad) as total from public.insumo_entradas where anulado = false group by insumo_id
) e on e.insumo_id = i.id
left join (
  select insumo_id, sum(cantidad) as total from public.insumo_salidas where anulado = false group by insumo_id
) s on s.insumo_id = i.id
left join (
  select insumo_id, sum(kg_alimento) as total
  from public.alimentacion_registros
  where anulado = false and insumo_id is not null
  group by insumo_id
) c on c.insumo_id = i.id;

alter table public.insumo_categorias enable row level security;
alter table public.insumos enable row level security;
alter table public.insumo_entradas enable row level security;
alter table public.insumo_salidas enable row level security;

create policy "authenticated_all" on public.insumo_categorias
  for all to authenticated using (true) with check (true);
create policy "authenticated_all" on public.insumos
  for all to authenticated using (true) with check (true);
create policy "authenticated_all" on public.insumo_entradas
  for all to authenticated using (true) with check (true);
create policy "authenticated_all" on public.insumo_salidas
  for all to authenticated using (true) with check (true);

commit;
