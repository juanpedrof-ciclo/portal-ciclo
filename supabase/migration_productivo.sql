-- Módulo Productivo · Ciclo Finca
-- Ejecutar completo en el SQL Editor de Supabase (después de schema.sql y las
-- migraciones del financiero; es independiente de esas tablas).
--
-- Todas las tablas quedan fijas a unidad = 'finca' (check constraint) porque hoy
-- solo Ciclo Finca maneja animales; se incluye la columna `unidad` únicamente
-- por consistencia con el módulo financiero y para no tener que agregarla después
-- si algún día se necesita. El código de la app NO filtra por unidad en las
-- consultas (no hace falta: el check constraint garantiza que no puede existir
-- otro valor).

begin;

create extension if not exists "pgcrypto";

-- =========================================================
-- 1. CATÁLOGO: GRUPOS DE ANIMALES (fijo, sembrado abajo)
-- =========================================================
create table public.grupos_animales (
  id text primary key,
  nombre text not null,
  tipo_manejo text not null check (tipo_manejo in ('individual', 'lote')),
  produce_leche boolean not null default false,
  reproductivo boolean not null default false,
  activo boolean not null default true,
  orden int not null default 0
);

insert into public.grupos_animales (id, nombre, tipo_manejo, produce_leche, reproductivo, activo, orden) values
  ('bufalas_leche',  'Búfalas de leche',  'individual', true,  true,  true,  1),
  ('cerdas_cria',    'Cerdas de cría',    'individual', false, true,  true,  2),
  ('cerdos_engorde', 'Cerdos de engorde', 'lote',       false, false, true,  3),
  ('cerdos_levante', 'Cerdos de levante', 'lote',       false, false, true,  4),
  ('pollos',         'Pollos',            'lote',       false, false, false, 5)
on conflict (id) do nothing;

-- =========================================================
-- 2. CATÁLOGO: REPRODUCTORES (toros/verracos, lista que crece)
-- =========================================================
create table public.reproductores (
  id uuid primary key default gen_random_uuid(),
  unidad text not null default 'finca' check (unidad = 'finca'),
  nombre text not null,
  created_at timestamptz not null default now(),
  creado_por uuid references auth.users(id) default auth.uid(),
  unique (unidad, nombre)
);

-- =========================================================
-- 3. ANIMALES INDIVIDUALES (búfalas de leche + cerdas de cría)
-- =========================================================
create table public.animales (
  id uuid primary key default gen_random_uuid(),
  unidad text not null default 'finca' check (unidad = 'finca'),
  grupo_id text not null references public.grupos_animales(id),
  chapeta text not null,
  fecha_nacimiento date,
  fecha_ingreso date not null default current_date,
  madre_id uuid references public.animales(id),
  notas text,
  created_at timestamptz not null default now(),
  creado_por uuid references auth.users(id) default auth.uid(),
  unique (unidad, grupo_id, chapeta)
);

create index animales_unidad_grupo_idx on public.animales (unidad, grupo_id);
create index animales_madre_id_idx on public.animales (madre_id);

-- =========================================================
-- 4. INVENTARIO INICIAL DE LOTES (línea base, mismo patrón que
--    saldos_iniciales de banco/caja en el financiero)
-- =========================================================
create table public.inventario_inicial_lote (
  id uuid primary key default gen_random_uuid(),
  unidad text not null default 'finca' check (unidad = 'finca'),
  grupo_id text not null references public.grupos_animales(id),
  fecha date not null,
  cantidad int not null check (cantidad >= 0),
  notas text,
  created_at timestamptz not null default now(),
  creado_por uuid references auth.users(id) default auth.uid()
);

create index inventario_inicial_lote_grupo_fecha_idx on public.inventario_inicial_lote (grupo_id, fecha desc);

-- =========================================================
-- 5. ALIMENTACIÓN (por grupo, individual o lote)
-- =========================================================
create table public.alimentacion_registros (
  id uuid primary key default gen_random_uuid(),
  unidad text not null default 'finca' check (unidad = 'finca'),
  grupo_id text not null references public.grupos_animales(id),
  fecha date not null,
  kg_alimento numeric(10, 2) not null check (kg_alimento > 0),
  tipo_alimento text not null check (tipo_alimento in ('concentrado', 'pasto', 'otro')),
  notas text,
  created_at timestamptz not null default now(),
  creado_por uuid references auth.users(id) default auth.uid(),
  anulado boolean not null default false,
  anulado_at timestamptz,
  anulado_por uuid references auth.users(id)
);

create index alimentacion_registros_grupo_fecha_idx on public.alimentacion_registros (grupo_id, fecha);

-- =========================================================
-- 6. PRODUCCIÓN DE LECHE (solo búfalas, por animal y ordeño)
-- =========================================================
create table public.leche_registros (
  id uuid primary key default gen_random_uuid(),
  unidad text not null default 'finca' check (unidad = 'finca'),
  animal_id uuid not null references public.animales(id),
  fecha date not null,
  turno text not null check (turno in ('am', 'pm')),
  litros numeric(6, 2) not null check (litros > 0),
  notas text,
  created_at timestamptz not null default now(),
  creado_por uuid references auth.users(id) default auth.uid(),
  anulado boolean not null default false,
  anulado_at timestamptz,
  anulado_por uuid references auth.users(id)
);

create index leche_registros_animal_fecha_idx on public.leche_registros (animal_id, fecha);
create index leche_registros_fecha_idx on public.leche_registros (fecha);

-- =========================================================
-- 7. NACIMIENTOS
-- =========================================================
create table public.nacimientos_individuales (
  id uuid primary key default gen_random_uuid(),
  unidad text not null default 'finca' check (unidad = 'finca'),
  madre_id uuid not null references public.animales(id),
  fecha date not null,
  num_crias int not null check (num_crias > 0),
  crias_vivas int not null check (crias_vivas >= 0),
  crias_muertas int not null check (crias_muertas >= 0),
  crias_machos int not null default 0 check (crias_machos >= 0),
  crias_hembras int not null default 0 check (crias_hembras >= 0),
  cria_chapeta text,
  cria_animal_id uuid references public.animales(id),
  notas text,
  created_at timestamptz not null default now(),
  creado_por uuid references auth.users(id) default auth.uid(),
  anulado boolean not null default false,
  anulado_at timestamptz,
  anulado_por uuid references auth.users(id),
  check (crias_vivas + crias_muertas = num_crias),
  check (crias_machos + crias_hembras = crias_vivas)
);

create index nacimientos_individuales_madre_idx on public.nacimientos_individuales (madre_id);

create table public.nacimientos_lote (
  id uuid primary key default gen_random_uuid(),
  unidad text not null default 'finca' check (unidad = 'finca'),
  grupo_id text not null references public.grupos_animales(id),
  fecha date not null,
  cantidad int not null check (cantidad > 0),
  notas text,
  created_at timestamptz not null default now(),
  creado_por uuid references auth.users(id) default auth.uid(),
  anulado boolean not null default false,
  anulado_at timestamptz,
  anulado_por uuid references auth.users(id)
);

create index nacimientos_lote_grupo_fecha_idx on public.nacimientos_lote (grupo_id, fecha);

-- =========================================================
-- 8. MUERTES
-- =========================================================
create table public.muertes_individuales (
  id uuid primary key default gen_random_uuid(),
  unidad text not null default 'finca' check (unidad = 'finca'),
  animal_id uuid not null references public.animales(id),
  fecha date not null,
  causa text not null check (causa in ('enfermedad', 'accidente', 'otro')),
  notas text,
  created_at timestamptz not null default now(),
  creado_por uuid references auth.users(id) default auth.uid(),
  anulado boolean not null default false,
  anulado_at timestamptz,
  anulado_por uuid references auth.users(id)
);

create index muertes_individuales_animal_idx on public.muertes_individuales (animal_id);

create table public.muertes_lote (
  id uuid primary key default gen_random_uuid(),
  unidad text not null default 'finca' check (unidad = 'finca'),
  grupo_id text not null references public.grupos_animales(id),
  fecha date not null,
  cantidad int not null check (cantidad > 0),
  causa text not null check (causa in ('enfermedad', 'accidente', 'otro')),
  notas text,
  created_at timestamptz not null default now(),
  creado_por uuid references auth.users(id) default auth.uid(),
  anulado boolean not null default false,
  anulado_at timestamptz,
  anulado_por uuid references auth.users(id)
);

create index muertes_lote_grupo_fecha_idx on public.muertes_lote (grupo_id, fecha);

-- =========================================================
-- 9. SALIDAS / VENTAS (no incluye plata; eso vive en el financiero)
-- =========================================================
create table public.salidas_individuales (
  id uuid primary key default gen_random_uuid(),
  unidad text not null default 'finca' check (unidad = 'finca'),
  animal_id uuid not null references public.animales(id),
  fecha date not null,
  destino text not null check (destino in ('ciclo_market', 'tercero', 'otro')),
  comprador text,
  notas text,
  -- Agrupa las filas creadas por una misma venta de varias chapetas a la vez,
  -- para poder anularlas juntas desde la UI.
  venta_grupo_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  creado_por uuid references auth.users(id) default auth.uid(),
  anulado boolean not null default false,
  anulado_at timestamptz,
  anulado_por uuid references auth.users(id)
);

create index salidas_individuales_animal_idx on public.salidas_individuales (animal_id);
create index salidas_individuales_venta_grupo_idx on public.salidas_individuales (venta_grupo_id);

create table public.salidas_lote (
  id uuid primary key default gen_random_uuid(),
  unidad text not null default 'finca' check (unidad = 'finca'),
  grupo_id text not null references public.grupos_animales(id),
  fecha date not null,
  cantidad int not null check (cantidad > 0),
  destino text not null check (destino in ('ciclo_market', 'tercero', 'otro')),
  comprador text,
  notas text,
  created_at timestamptz not null default now(),
  creado_por uuid references auth.users(id) default auth.uid(),
  anulado boolean not null default false,
  anulado_at timestamptz,
  anulado_por uuid references auth.users(id)
);

create index salidas_lote_grupo_fecha_idx on public.salidas_lote (grupo_id, fecha);

-- =========================================================
-- 10. CICLO REPRODUCTIVO (solo búfalas/cerdas de cría)
-- =========================================================
create table public.servicios_reproductivos (
  id uuid primary key default gen_random_uuid(),
  unidad text not null default 'finca' check (unidad = 'finca'),
  animal_id uuid not null references public.animales(id),
  fecha date not null,
  tipo text not null check (tipo in ('monta_natural', 'inseminacion_artificial')),
  reproductor_id uuid references public.reproductores(id),
  notas text,
  created_at timestamptz not null default now(),
  creado_por uuid references auth.users(id) default auth.uid(),
  anulado boolean not null default false,
  anulado_at timestamptz,
  anulado_por uuid references auth.users(id)
);

create index servicios_reproductivos_animal_fecha_idx on public.servicios_reproductivos (animal_id, fecha);

create table public.confirmaciones_prenez (
  id uuid primary key default gen_random_uuid(),
  unidad text not null default 'finca' check (unidad = 'finca'),
  animal_id uuid not null references public.animales(id),
  fecha date not null,
  resultado text not null check (resultado in ('prenada', 'vacia')),
  notas text,
  created_at timestamptz not null default now(),
  creado_por uuid references auth.users(id) default auth.uid(),
  anulado boolean not null default false,
  anulado_at timestamptz,
  anulado_por uuid references auth.users(id)
);

create index confirmaciones_prenez_animal_fecha_idx on public.confirmaciones_prenez (animal_id, fecha);

create table public.destetes (
  id uuid primary key default gen_random_uuid(),
  unidad text not null default 'finca' check (unidad = 'finca'),
  animal_id uuid not null references public.animales(id),
  fecha date not null,
  notas text,
  created_at timestamptz not null default now(),
  creado_por uuid references auth.users(id) default auth.uid(),
  anulado boolean not null default false,
  anulado_at timestamptz,
  anulado_por uuid references auth.users(id)
);

create index destetes_animal_fecha_idx on public.destetes (animal_id, fecha);

-- =========================================================
-- 11. VISTAS CALCULADAS
-- =========================================================

-- Estado reproductivo actual: el evento no anulado más reciente (por fecha,
-- luego created_at) entre servicio / confirmación de preñez / parto / destete.
create view public.vista_estado_reproductivo
with (security_invoker = true) as
with eventos as (
  select animal_id, fecha, created_at, 'servida'::text as estado
  from public.servicios_reproductivos
  where anulado = false
  union all
  select animal_id, fecha, created_at,
    case when resultado = 'prenada' then 'prenada' else 'vacia' end
  from public.confirmaciones_prenez
  where anulado = false
  union all
  select madre_id as animal_id, fecha, created_at, 'lactando'::text
  from public.nacimientos_individuales
  where anulado = false
  union all
  select animal_id, fecha, created_at, 'vacia'::text
  from public.destetes
  where anulado = false
),
ultimo as (
  select distinct on (animal_id) animal_id, estado
  from eventos
  order by animal_id, fecha desc, created_at desc
)
select a.id as animal_id, coalesce(u.estado, 'vacia') as estado_reproductivo
from public.animales a
join public.grupos_animales g on g.id = a.grupo_id and g.reproductivo = true
left join ultimo u on u.animal_id = a.id;

-- Estado del animal (activo/muerto/vendido) + estado reproductivo si aplica.
-- Es la vista que alimenta la lista de Animales y los selectores de chapeta.
create view public.vista_animales_estado
with (security_invoker = true) as
select
  a.id, a.unidad, a.grupo_id, a.chapeta, a.fecha_nacimiento, a.fecha_ingreso,
  a.madre_id, a.notas, a.created_at, a.creado_por,
  case
    when m.animal_id is not null then 'muerto'
    when v.animal_id is not null then 'vendido'
    else 'activo'
  end as estado,
  er.estado_reproductivo
from public.animales a
left join (select distinct animal_id from public.muertes_individuales where anulado = false) m
  on m.animal_id = a.id
left join (select distinct animal_id from public.salidas_individuales where anulado = false) v
  on v.animal_id = a.id
left join public.vista_estado_reproductivo er on er.animal_id = a.id;

-- Inventario actual de los grupos por lote: línea base más reciente de
-- inventario_inicial_lote + nacimientos - muertes - salidas desde esa fecha.
create view public.vista_inventario_lote
with (security_invoker = true) as
with grupos_lote as (
  select id as grupo_id from public.grupos_animales where tipo_manejo = 'lote'
),
base as (
  select distinct on (grupo_id) grupo_id, fecha as fecha_inicial, cantidad as cantidad_inicial
  from public.inventario_inicial_lote
  order by grupo_id, fecha desc, created_at desc
),
base_completa as (
  select gl.grupo_id, b.fecha_inicial, coalesce(b.cantidad_inicial, 0) as cantidad_inicial
  from grupos_lote gl
  left join base b on b.grupo_id = gl.grupo_id
),
nacidos as (
  select bc.grupo_id, coalesce(sum(n.cantidad), 0) as total
  from base_completa bc
  left join public.nacimientos_lote n
    on n.grupo_id = bc.grupo_id and n.anulado = false
    and (bc.fecha_inicial is null or n.fecha >= bc.fecha_inicial)
  group by bc.grupo_id
),
muertos as (
  select bc.grupo_id, coalesce(sum(m.cantidad), 0) as total
  from base_completa bc
  left join public.muertes_lote m
    on m.grupo_id = bc.grupo_id and m.anulado = false
    and (bc.fecha_inicial is null or m.fecha >= bc.fecha_inicial)
  group by bc.grupo_id
),
vendidos as (
  select bc.grupo_id, coalesce(sum(s.cantidad), 0) as total
  from base_completa bc
  left join public.salidas_lote s
    on s.grupo_id = bc.grupo_id and s.anulado = false
    and (bc.fecha_inicial is null or s.fecha >= bc.fecha_inicial)
  group by bc.grupo_id
)
select
  bc.grupo_id, bc.fecha_inicial, bc.cantidad_inicial,
  n.total as nacidos, m.total as muertos, v.total as vendidos,
  bc.cantidad_inicial + n.total - m.total - v.total as cantidad_actual
from base_completa bc
join nacidos n on n.grupo_id = bc.grupo_id
join muertos m on m.grupo_id = bc.grupo_id
join vendidos v on v.grupo_id = bc.grupo_id;

-- =========================================================
-- 12. ROW LEVEL SECURITY (mismo patrón: cualquier usuario autenticado
--     lee/escribe; grupos_animales es catálogo de solo lectura para la app)
-- =========================================================

alter table public.grupos_animales enable row level security;
alter table public.reproductores enable row level security;
alter table public.animales enable row level security;
alter table public.inventario_inicial_lote enable row level security;
alter table public.alimentacion_registros enable row level security;
alter table public.leche_registros enable row level security;
alter table public.nacimientos_individuales enable row level security;
alter table public.nacimientos_lote enable row level security;
alter table public.muertes_individuales enable row level security;
alter table public.muertes_lote enable row level security;
alter table public.salidas_individuales enable row level security;
alter table public.salidas_lote enable row level security;
alter table public.servicios_reproductivos enable row level security;
alter table public.confirmaciones_prenez enable row level security;
alter table public.destetes enable row level security;

create policy "authenticated_select" on public.grupos_animales
  for select to authenticated using (true);

create policy "authenticated_all" on public.reproductores
  for all to authenticated using (true) with check (true);
create policy "authenticated_all" on public.animales
  for all to authenticated using (true) with check (true);
create policy "authenticated_all" on public.inventario_inicial_lote
  for all to authenticated using (true) with check (true);
create policy "authenticated_all" on public.alimentacion_registros
  for all to authenticated using (true) with check (true);
create policy "authenticated_all" on public.leche_registros
  for all to authenticated using (true) with check (true);
create policy "authenticated_all" on public.nacimientos_individuales
  for all to authenticated using (true) with check (true);
create policy "authenticated_all" on public.nacimientos_lote
  for all to authenticated using (true) with check (true);
create policy "authenticated_all" on public.muertes_individuales
  for all to authenticated using (true) with check (true);
create policy "authenticated_all" on public.muertes_lote
  for all to authenticated using (true) with check (true);
create policy "authenticated_all" on public.salidas_individuales
  for all to authenticated using (true) with check (true);
create policy "authenticated_all" on public.salidas_lote
  for all to authenticated using (true) with check (true);
create policy "authenticated_all" on public.servicios_reproductivos
  for all to authenticated using (true) with check (true);
create policy "authenticated_all" on public.confirmaciones_prenez
  for all to authenticated using (true) with check (true);
create policy "authenticated_all" on public.destetes
  for all to authenticated using (true) with check (true);

commit;
