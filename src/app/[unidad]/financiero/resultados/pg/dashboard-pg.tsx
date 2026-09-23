import type {
  CanalPG,
  CategoriaPG,
  ConcentracionPG,
  FilaFactura,
  FilaPedidoVenta,
  PuntoTendenciaPG,
  ResumenPG,
} from "@/lib/financiero/pg";
import { TarjetasPG } from "./tarjetas-pg";
import { TendenciaPGChart } from "./tendencia-pg-chart";
import { GastosProveedores } from "./gastos-proveedores";
import { VentasCanal } from "./ventas-canal";
import { ConcentracionRiesgo } from "./concentracion-riesgo";

export function DashboardPG({
  resumen,
  resumenAnterior,
  tendencia,
  granularidad,
  categorias,
  facturas,
  canales,
  pedidos,
  concentracion,
  hayDatos,
}: {
  resumen: ResumenPG;
  resumenAnterior: ResumenPG;
  tendencia: PuntoTendenciaPG[];
  granularidad: "semana" | "mes";
  categorias: CategoriaPG[];
  facturas: FilaFactura[];
  canales: CanalPG[];
  pedidos: FilaPedidoVenta[];
  concentracion: ConcentracionPG;
  hayDatos: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Resumen
        </h3>
        <TarjetasPG resumen={resumen} resumenAnterior={resumenAnterior} />
      </section>

      {hayDatos ? (
        <>
          <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-1 text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Gastos — ¿en qué se va la plata?
            </h3>
            <p className="mb-3 text-xs text-zinc-400 dark:text-zinc-500">
              Clic en una categoría para ver sus proveedores; clic en un proveedor para ver sus
              facturas.
            </p>
            <GastosProveedores categorias={categorias} facturas={facturas} />
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-1 text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Ventas — ¿de dónde viene la plata?
            </h3>
            <p className="mb-3 text-xs text-zinc-400 dark:text-zinc-500">
              Clic en un canal para ver sus clientes; clic en un cliente para ver sus pedidos.
            </p>
            <VentasCanal canales={canales} pedidos={pedidos} />
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Tendencia {granularidad === "semana" ? "semanal" : "mensual"}
            </h3>
            <TendenciaPGChart datos={tendencia} granularidad={granularidad} />
          </section>

          <section>
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Concentración (riesgo)
            </h3>
            <ConcentracionRiesgo concentracion={concentracion} />
          </section>
        </>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          Sin movimientos en el rango seleccionado.
        </div>
      )}
    </div>
  );
}
