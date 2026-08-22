-- Módulo Productivo · Ciclo Finca
-- Calificación mensual de la finca: criterios personalizables, escala 1-5.
-- Ejecutar completo en el SQL Editor de Supabase, después de migration_productivo.sql.

begin;

create table public.criterios_calificacion (
  id uuid primary key default gen_random_uuid(),
  unidad text not null default 'finca' check (unidad = 'finca'),
  nombre text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  creado_por uuid references auth.users(id) default auth.uid(),
  unique (unidad, nombre)
);

create table public.calificaciones (
  id uuid primary key default gen_random_uuid(),
  unidad text not null default 'finca' check (unidad = 'finca'),
  mes date not null,
  criterio_id uuid not null references public.criterios_calificacion(id),
  nota int not null check (nota between 1 and 5),
  observaciones text,
  created_at timestamptz not null default now(),
  creado_por uuid references auth.users(id) default auth.uid(),
  anulado boolean not null default false,
  anulado_at timestamptz,
  anulado_por uuid references auth.users(id)
);
create index calificaciones_mes_criterio_idx on public.calificaciones (mes, criterio_id);

alter table public.criterios_calificacion enable row level security;
alter table public.calificaciones enable row level security;

create policy "authenticated_all" on public.criterios_calificacion
  for all to authenticated using (true) with check (true);
create policy "authenticated_all" on public.calificaciones
  for all to authenticated using (true) with check (true);

commit;
