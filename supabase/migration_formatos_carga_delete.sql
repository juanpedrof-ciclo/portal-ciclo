-- Módulo Financiero · Ciclo Market
-- Migración: permitir eliminar formatos_carga sin afectar los pedidos ya cargados.
-- Ejecutar completo en el SQL Editor de Supabase, después de las migraciones anteriores.

-- Antes: pedidos.formato_id -> formatos_carga(id) sin ON DELETE (RESTRICT por defecto),
-- así que borrar un formato con pedidos asociados fallaba con error de llave foránea.
-- Después: al eliminar un formato, los pedidos que lo usaron conservan todos sus datos
-- (cliente, monto, fecha, estado, archivo_origen, etc.) y solo su formato_id pasa a NULL.

alter table public.pedidos
  drop constraint pedidos_formato_id_fkey,
  add constraint pedidos_formato_id_fkey
    foreign key (formato_id) references public.formatos_carga(id) on delete set null;
