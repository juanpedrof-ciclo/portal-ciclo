import type { CategoriaPG, PuntoTendenciaPG, ResumenPG } from "@/lib/financiero/pg";
import { TarjetasPG } from "./tarjetas-pg";
import { TendenciaPGChart } from "./tendencia-pg-chart";
import { CategoriaPGChart } from "./categoria-pg-chart";

export function DashboardPG({
  resumen,
  tendencia,
  granularidad,
  categorias,
  hayDatos,
}: {
  resumen: ResumenPG;
  tendencia: PuntoTendenciaPG[];
  granularidad: "semana" | "mes";
  categorias: CategoriaPG[];
  hayDatos: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <TarjetasPG resumen={resumen} />

      {hayDatos ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Tendencia {granularidad === "semana" ? "semanal" : "mensual"}
            </h3>
            <TendenciaPGChart datos={tendencia} granularidad={granularidad} />
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Costos y gastos por categoría
            </h3>
            <CategoriaPGChart datos={categorias} />
          </section>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          Sin movimientos en el rango seleccionado.
        </div>
      )}
    </div>
  );
}
