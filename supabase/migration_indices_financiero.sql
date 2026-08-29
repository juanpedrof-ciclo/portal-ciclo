-- Módulo Financiero · Índices para listas con datos grandes
--
-- Motivo: las páginas de Costos, Ventas y Pagos hacían el conteo del paginador
-- con `count: exact` sobre las vistas (`vista_facturas_saldo`, etc.), lo que
-- obliga a Postgres a materializar la vista entera (joins + subconsulta de
-- agregación) en cada carga. Con los datos reales de Market eso pasaba de 10s
-- y Vercel cortaba la función (FUNCTION_INVOCATION_TIMEOUT / 504).
--
-- El código ya se cambió para contar sobre la tabla base. Estos índices
-- aceleran ese conteo, el listado paginado y la búsqueda por nombre.
--
-- Seguro de re-ejecutar: todo es IF NOT EXISTS. Correr en el SQL Editor de
-- Supabase (después de migration_unidad_negocio.sql).

-- ---------------------------------------------------------------------------
-- 1. Listado + conteo por unidad, excluyendo anulados, ordenado por fecha desc
-- ---------------------------------------------------------------------------
create index if not exists facturas_unidad_anulado_fecha_idx
  on public.facturas (unidad, anulado, fecha desc);

create index if not exists pedidos_unidad_anulado_fecha_idx
  on public.pedidos (unidad, anulado, fecha desc);

create index if not exists pagos_unidad_anulado_fecha_idx
  on public.pagos (unidad, anulado, fecha desc);

create index if not exists ingresos_semanales_unidad_anulado_fecha_idx
  on public.ingresos_semanales (unidad, anulado, fecha desc);

-- ---------------------------------------------------------------------------
-- 2. Búsqueda por nombre (ILIKE '%texto%') en tablas de referencia
--    Se usa para traducir la búsqueda a un filtro por FK indexada.
-- ---------------------------------------------------------------------------
create extension if not exists pg_trgm;

create index if not exists proveedores_nombre_trgm_idx
  on public.proveedores using gin (nombre gin_trgm_ops);

create index if not exists clientes_nombre_trgm_idx
  on public.clientes using gin (nombre gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- 3. Subconsulta de saldos en las vistas: filtro pg.anulado = false
-- ---------------------------------------------------------------------------
create index if not exists pagos_anulado_false_idx
  on public.pagos (id) where anulado = false;

-- ---------------------------------------------------------------------------
-- 4. Refrescar estadísticas del planificador (barato, recomendable tras crear
--    índices o si las tablas crecieron mucho desde el último ANALYZE).
-- ---------------------------------------------------------------------------
analyze public.facturas;
analyze public.pedidos;
analyze public.pagos;
analyze public.pago_aplicaciones;
analyze public.ingresos_semanales;
analyze public.proveedores;
analyze public.clientes;
