import { calcularVariacion, type ResumenPG } from "@/lib/financiero/pg";
import { formatCOP, formatPorcentaje } from "@/lib/financiero/types";

export function TarjetasPG({
  resumen,
  resumenAnterior,
}: {
  resumen: ResumenPG;
  resumenAnterior?: ResumenPG;
}) {
  const gastos = resumen.gastoVenta + resumen.gastoAdministrativo;
  const gastosAnterior = resumenAnterior
    ? resumenAnterior.gastoVenta + resumenAnterior.gastoAdministrativo
    : undefined;
  const margenPct =
    resumen.ingresos !== 0 ? resumen.margenBruto / resumen.ingresos : null;
  const utilidadPct =
    resumen.ingresos !== 0 ? resumen.utilidad / resumen.ingresos : null;

  const tarjetas: {
    label: string;
    valor: number;
    valorAnterior?: number;
    subirEsBueno: boolean;
    porcentaje?: number | null;
    destacado?: boolean;
  }[] = [
    {
      label: "Ingresos",
      valor: resumen.ingresos,
      valorAnterior: resumenAnterior?.ingresos,
      subirEsBueno: true,
    },
    {
      label: "Costo de producto",
      valor: -resumen.costoProducto,
      valorAnterior: resumenAnterior ? -resumenAnterior.costoProducto : undefined,
      subirEsBueno: false,
    },
    {
      label: "Margen bruto",
      valor: resumen.margenBruto,
      valorAnterior: resumenAnterior?.margenBruto,
      subirEsBueno: true,
      porcentaje: margenPct,
    },
    {
      label: "Gastos",
      valor: -gastos,
      valorAnterior: gastosAnterior !== undefined ? -gastosAnterior : undefined,
      subirEsBueno: false,
    },
    {
      label: "Utilidad",
      valor: resumen.utilidad,
      valorAnterior: resumenAnterior?.utilidad,
      subirEsBueno: true,
      porcentaje: utilidadPct,
      destacado: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tarjetas.map((t) => {
        const variacion =
          t.valorAnterior !== undefined
            ? calcularVariacion(t.valor, t.valorAnterior)
            : null;
        const esBueno =
          variacion === null ? null : t.subirEsBueno ? variacion >= 0 : variacion < 0;

        return (
          <div
            key={t.label}
            className={`rounded-2xl border p-4 shadow-sm ${
              t.destacado
                ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40"
                : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
            }`}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {t.label}
            </p>
            <p
              className={`mt-1 text-2xl font-semibold ${
                t.valor < 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-zinc-900 dark:text-zinc-50"
              }`}
            >
              {formatCOP(t.valor)}
            </p>
            {t.porcentaje !== undefined && (
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {t.porcentaje === null
                  ? "—"
                  : `${formatPorcentaje(t.porcentaje)} de ingresos`}
              </p>
            )}
            {t.valorAnterior !== undefined && (
              <p
                className={`mt-1 text-xs font-medium ${
                  variacion === null
                    ? "text-zinc-400 dark:text-zinc-500"
                    : esBueno
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                }`}
              >
                {variacion === null
                  ? "N/D vs período anterior"
                  : `${variacion >= 0 ? "▲" : "▼"} ${formatPorcentaje(Math.abs(variacion))} vs período anterior`}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
