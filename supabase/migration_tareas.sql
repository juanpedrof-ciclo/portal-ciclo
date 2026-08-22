-- Módulo Productivo · Ciclo Finca
-- Registro de actividades / tareas asignadas a trabajadores.
-- Ejecutar completo en el SQL Editor de Supabase, después de migration_productivo.sql.

begin;

create table public.trabajadores (
  id uuid primary key default gen_random_uuid(),
  unidad text not null default 'finca' check (unidad = 'finca'),
  nombre text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  creado_por uuid references auth.users(id) default auth.uid(),
  unique (unidad, nombre)
);

create table public.tareas (
  id uuid primary key default gen_random_uuid(),
  unidad text not null default 'finca' check (unidad = 'finca'),
  descripcion text not null,
  trabajador_id uuid not null references public.trabajadores(id),
  fecha_limite date not null,
  prioridad text not null default 'media' check (prioridad in ('alta', 'media', 'baja')),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'en_proceso', 'hecha')),
  fecha_cumplida date,
  notas text,
  created_at timestamptz not null default now(),
  creado_por uuid references auth.users(id) default auth.uid(),
  anulado boolean not null default false,
  anulado_at timestamptz,
  anulado_por uuid references auth.users(id)
);
create index tareas_trabajador_idx on public.tareas (trabajador_id);
create index tareas_estado_idx on public.tareas (estado);
create index tareas_fecha_limite_idx on public.tareas (fecha_limite);

alter table public.trabajadores enable row level security;
alter table public.tareas enable row level security;

create policy "authenticated_all" on public.trabajadores
  for all to authenticated using (true) with check (true);
create policy "authenticated_all" on public.tareas
  for all to authenticated using (true) with check (true);

commit;
