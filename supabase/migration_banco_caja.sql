-- Módulo Financiero · Ciclo Market
-- Migración: manejo de banco/caja — pago histórico, saldo inicial y ajustes.
-- Ejecutar completo en el SQL Editor de Supabase, después de las migraciones
-- anteriores (en particular migration_anulacion.sql).

-- =========================================================
-- 1. PAGOS: nuevo destino "historico" (cierre de cartera vieja,
--    excluido de los saldos de banco y caja porque nadie suma
--    pagos.destino='historico').
-- =========================================================

alter table public.pagos
  drop constraint pagos_destino_check;

alter table public.pagos
  add constraint pagos_destino_check
  check (destino in ('banco', 'caja', 'historico'));

-- =========================================================
-- 2. SALDOS_INICIALES (punto de partida de banco/caja a una fecha)
-- =========================================================

create table public.saldos_iniciales (
  id uuid primary key default gen_random_uuid(),
  destino text not null check (destino in ('banco', 'caja')),
  fecha date not null,
  monto numeric(14, 2) not null,
  notas text,
  created_at timestamptz not null default now(),
  creado_por uuid references auth.users(id) default auth.uid()
);

create index saldos_iniciales_destino_fecha_idx on public.saldos_iniciales (destino, fecha desc);

-- =========================================================
-- 3. AJUSTES_CAJA_BANCO (suma o resta manual, con motivo)
-- =========================================================

create table public.ajustes_caja_banco (
  id uuid primary key default gen_random_uuid(),
  destino text not null check (destino in ('banco', 'caja')),
  fecha date not null,
  monto numeric(14, 2) not null check (monto <> 0), -- positivo suma, negativo resta
  motivo text not null,
  created_at timestamptz not null default now(),
  creado_por uuid references auth.users(id) default auth.uid(),
  anulado boolean not null default false,
  anulado_at timestamptz,
  anulado_por uuid references auth.users(id)
);

create index ajustes_caja_banco_destino_fecha_idx on public.ajustes_caja_banco (destino, fecha desc);

-- =========================================================
-- 4. VISTA: saldo actual de banco y caja
--    saldo_actual = saldo inicial vigente (el más reciente por fecha)
--                 + pagos (destino banco/caja, no anulados, fecha >= saldo inicial)
--                 + ajustes (no anulados, fecha >= saldo inicial)
--    Si no hay saldo inicial registrado para un destino, se suma todo
--    el histórico (mismo comportamiento que el cálculo de caja actual).
-- =========================================================

create or replace view public.vista_saldo_banco_caja
with (security_invoker = true) as
with destinos as (
  select unnest(array['banco', 'caja']) as destino
),
base as (
  select distinct on (si.destino)
    si.destino,
    si.fecha as saldo_inicial_fecha,
    si.monto as saldo_inicial_monto
  from public.saldos_iniciales si
  order by si.destino, si.fecha desc, si.created_at desc
),
destinos_base as (
  select
    d.destino,
    b.saldo_inicial_fecha,
    coalesce(b.saldo_inicial_monto, 0) as saldo_inicial_monto
  from destinos d
  left join base b on b.destino = d.destino
),
pagos_sum as (
  select
    db.destino,
    coalesce(sum(case when pg.tipo = 'cobro_cliente' then pg.monto else -pg.monto end), 0) as monto_pagos
  from destinos_base db
  left join public.pagos pg
    on pg.destino = db.destino
    and pg.anulado = false
    and (db.saldo_inicial_fecha is null or pg.fecha >= db.saldo_inicial_fecha)
  group by db.destino
),
ajustes_sum as (
  select
    db.destino,
    coalesce(sum(a.monto), 0) as monto_ajustes
  from destinos_base db
  left join public.ajustes_caja_banco a
    on a.destino = db.destino
    and a.anulado = false
    and (db.saldo_inicial_fecha is null or a.fecha >= db.saldo_inicial_fecha)
  group by db.destino
)
select
  db.destino,
  db.saldo_inicial_fecha,
  db.saldo_inicial_monto,
  ps.monto_pagos,
  aj.monto_ajustes,
  db.saldo_inicial_monto + ps.monto_pagos + aj.monto_ajustes as saldo_actual
from destinos_base db
join pagos_sum ps on ps.destino = db.destino
join ajustes_sum aj on aj.destino = db.destino;

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table public.saldos_iniciales enable row level security;
alter table public.ajustes_caja_banco enable row level security;

create policy "authenticated_all" on public.saldos_iniciales
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on public.ajustes_caja_banco
  for all to authenticated using (true) with check (true);
