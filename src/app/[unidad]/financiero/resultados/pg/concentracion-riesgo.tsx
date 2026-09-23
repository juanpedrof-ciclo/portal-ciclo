import { UMBRAL_CONCENTRACION_RIESGO, type ConcentracionPG } from "@/lib/financiero/pg";
import { formatCOP, formatPorcentaje } from "@/lib/financiero/types";

export function ConcentracionRiesgo({ concentracion }: { concentracion: ConcentracionPG }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <TarjetaConcentracion
        titulo="Top cliente"
        detalle={concentracion.topCliente}
        descripcion="% de los ingresos totales del período"
      />
      <TarjetaConcentracion
        titulo="Top proveedor"
        detalle={concentracion.topProveedor}
        descripcion="% de las facturas totales del período"
      />
    </div>
  );
}

function TarjetaConcentracion({
  titulo,
  detalle,
  descripcion,
}: {
  titulo: string;
  detalle: { nombre: string; monto: number; pct: number | null } | null;
  descripcion: string;
}) {
  const enRiesgo = (detalle?.pct ?? 0) >= UMBRAL_CONCENTRACION_RIESGO;

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm ${
        enRiesgo
          ? "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {titulo}
        </p>
        {enRiesgo && (
          <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            Riesgo de concentración
          </span>
        )}
      </div>

      {detalle ? (
        <>
          <p className="mt-1 truncate text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {detalle.nombre}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{formatCOP(detalle.monto)}</p>
          <p
            className={`mt-1 text-2xl font-bold ${
              enRiesgo ? "text-red-600 dark:text-red-400" : "text-zinc-900 dark:text-zinc-50"
            }`}
          >
            {detalle.pct === null ? "—" : formatPorcentaje(detalle.pct)}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{descripcion}</p>
        </>
      ) : (
        <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">Sin datos en este período</p>
      )}
    </div>
  );
}
