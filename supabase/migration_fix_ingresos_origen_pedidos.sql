-- Módulo Financiero · Ciclo Market
-- Arreglo: el constraint de origen en ingresos_semanales no incluía 'pedidos',
-- por lo que la fila automática que resume las ventas cargadas por archivo
-- (creada por recalcularIngresoPedidos) nunca se podía insertar y quedaba
-- fuera del P&G sin ningún aviso. Este mismo ALTER ya existía en
-- migration_cartera_clientes.sql (líneas 71-76) pero no llegó a aplicarse.
-- Ejecutar en el SQL Editor de Supabase.

alter table public.ingresos_semanales
  drop constraint ingresos_semanales_origen_check;

alter table public.ingresos_semanales
  add constraint ingresos_semanales_origen_check
  check (origen in ('manual', 'excel', 'pedidos'));
