-- Módulo Financiero · Ciclo Market
-- Migración: soporte para el cierre en lote de cartera histórica.
-- Ejecutar después de migration_banco_caja.sql (necesita destino='historico').
--
-- No se agrega ninguna función/procedimiento almacenado: el cierre en lote
-- vive en un Server Action (src/app/market/financiero/pagos/cierre-cartera-actions.ts)
-- que hace dos inserts masivos (pagos, pago_aplicaciones) con rollback
-- compensatorio si el segundo falla, siguiendo la convención del resto del
-- proyecto de no usar RPC de Postgres.
--
-- Único cambio de esquema: el índice de pedidos.fecha nunca se recreó
-- después de migration_fecha_real.sql (que eliminó pedidos_semana_idx). El
-- cierre en lote agrega consultas de rango por fecha sobre pedidos vía
-- vista_pedidos_saldo, así que hace falta.

create index pedidos_fecha_idx on public.pedidos (fecha);
