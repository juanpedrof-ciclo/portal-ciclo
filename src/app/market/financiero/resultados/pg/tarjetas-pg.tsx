import type { ResumenPG } from "@/lib/financiero/pg";
import { formatCOP, formatPorcentaje } from "@/lib/financiero/types";

export function TarjetasPG({ resumen }: { resumen: ResumenPG }) {
  const gastos = resumen.gastoVenta + resumen.gastoAdministrativo;
  const margenPct =
    resumen.ingresos !== 0 ? resumen.margenBruto / resumen.ingresos : null;
  const utilidadPct =
    resumen.ingresos !== 0 ? resumen.utilidad / resumen.ingresos : null;

  const tarjetas: {
    label: string;
    valor: number;
    porcentaje?: number | null;
    destacado?: boolean;
  }[] = [
    { label: "Ingresos", valor: resumen.ingresos },
    { label: "Costo de producto", valor: -resumen.costoProducto },
    { label: "Margen bruto", valor: resumen.margenBruto, porcentaje: margenPct },
    { label: "Gastos", valor: -gastos },
    {
      label: "Utilidad",
      valor: resumen.utilidad,
      porcentaje: utilidadPct,
      destacado: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tarjetas.map((t) => (
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
        </div>
      ))}
    </div>
  );
}
