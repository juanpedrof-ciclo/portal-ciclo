-- Módulo Financiero · Ciclo Market
-- Migración: vista_pagos_detalle, para poder buscar y ordenar la lista de
-- Pagos (recibos) por la columna "Aplica a" desde SQL.
--
-- Hoy la página de Pagos arma "Aplica a" en JS combinando tres relaciones
-- anidadas y opcionales (facturas→proveedores, ingresos_semanales,
-- pedidos→clientes) y toma pago_aplicaciones[0]. Eso no se puede buscar ni
-- ordenar del lado del servidor. Esta vista aplana esa lógica en dos
-- columnas (contraparte_nombre, contraparte_fecha), eligiendo la primera
-- aplicación por fecha de creación (mismo criterio implícito que [0]).
--
-- Ejecutar en el SQL Editor de Supabase.

create or replace view public.vista_pagos_detalle
with (security_invoker = true) as
select
  pg.id,
  pg.tipo,
  pg.fecha,
  pg.monto,
  pg.destino,
  pg.referencia,
  pg.notas,
  pg.anulado,
  pg.created_at,
  pg.creado_por,
  det.contraparte_nombre,
  det.contraparte_fecha
from public.pagos pg
left join lateral (
  select
    coalesce(prov.nombre, cli.nombre) as contraparte_nombre,
    coalesce(f.fecha, i.fecha, p.fecha) as contraparte_fecha
  from public.pago_aplicaciones pa
  left join public.facturas f on f.id = pa.factura_id
  left join public.proveedores prov on prov.id = f.proveedor_id
  left join public.ingresos_semanales i on i.id = pa.ingreso_id
  left join public.pedidos p on p.id = pa.pedido_id
  left join public.clientes cli on cli.id = p.cliente_id
  where pa.pago_id = pg.id
  order by pa.created_at
  limit 1
) det on true;
