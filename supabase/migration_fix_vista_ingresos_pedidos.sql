-- Módulo Financiero · Ciclo Market
-- Arreglo: "Cuentas por cobrar" no descontaba los pagos ya cruzados para las
-- ventas cargadas por archivo (ingresos_semanales.origen = 'pedidos'). La vista
-- vista_ingresos_saldo restaba pagos uniendo por pago_aplicaciones.ingreso_id,
-- pero los cobros de esas ventas se registran contra
-- pago_aplicaciones.pedido_id (pestaña "Pedido de cliente" del formulario de
-- pagos, y el constraint pago_aplicaciones_un_destino impide que además tengan
-- ingreso_id). Para esas filas resumen el join nunca encontraba coincidencias,
-- así que monto_aplicado quedaba en 0 y el saldo mostrado era siempre el bruto
-- original (Cartera por cliente sí calculaba bien porque usa
-- vista_pedidos_saldo, que junta por pedido_id).
--
-- Se corrige sumando, para origen = 'pedidos', los pagos aplicados a los
-- pedidos que coinciden en fecha + canal con la fila de ingresos_semanales
-- (la misma agrupación que usa recalcularIngresoPedidos para generar el
-- bruto). Para origen 'manual'/'excel' se mantiene el join directo por
-- ingreso_id, que ya funcionaba bien.
--
-- Ejecutar en el SQL Editor de Supabase.

create or replace view public.vista_ingresos_saldo
with (security_invoker = true) as
select
  i.id,
  i.fecha,
  i.monto_total,
  i.canal,
  i.origen,
  i.archivo_excel_url,
  i.notas,
  coalesce(
    case when i.origen = 'pedidos' then pa_pedidos.aplicado else pa_directo.aplicado end,
    0
  ) as monto_aplicado,
  i.monto_total - coalesce(
    case when i.origen = 'pedidos' then pa_pedidos.aplicado else pa_directo.aplicado end,
    0
  ) as saldo_pendiente,
  (current_date - i.fecha) as dias_mora
from public.ingresos_semanales i
left join (
  select pa.ingreso_id, sum(pa.monto_aplicado) as aplicado
  from public.pago_aplicaciones pa
  join public.pagos pg on pg.id = pa.pago_id
  where pa.ingreso_id is not null and pg.anulado = false
  group by pa.ingreso_id
) pa_directo on pa_directo.ingreso_id = i.id
left join (
  select p.fecha, p.canal, sum(pa.monto_aplicado) as aplicado
  from public.pedidos p
  join public.pago_aplicaciones pa on pa.pedido_id = p.id
  join public.pagos pg on pg.id = pa.pago_id
  where p.anulado = false and pg.anulado = false
  group by p.fecha, p.canal
) pa_pedidos
  on i.origen = 'pedidos'
  and pa_pedidos.fecha = i.fecha
  and pa_pedidos.canal is not distinct from i.canal
where i.anulado = false;
