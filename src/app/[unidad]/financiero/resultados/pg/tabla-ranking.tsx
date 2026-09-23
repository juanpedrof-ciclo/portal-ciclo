"use client";

import { ExportarTabla, type ColumnaExport } from "@/components/exportar-tabla";
import { formatCOP, formatPorcentaje } from "@/lib/financiero/types";

export function TablaRanking<T extends { nombre: string; monto: number }>({
  filas,
  total,
  onSeleccionar,
  nombreArchivo,
  etiquetaColumna,
}: {
  filas: T[];
  total: number;
  onSeleccionar?: (fila: T) => void;
  nombreArchivo: string;
  etiquetaColumna: string;
}) {
  const columnas: ColumnaExport[] = [
    { key: "nombre", header: etiquetaColumna, tipo: "texto" },
    { key: "monto", header: "Monto", tipo: "moneda" },
    { key: "pct", header: "% del total", tipo: "porcentaje" },
  ];
  const filasExport = filas.map((f) => ({
    nombre: f.nombre,
    monto: f.monto,
    pct: total !== 0 ? f.monto / total : 0,
  }));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {etiquetaColumna}
        </h4>
        <ExportarTabla columnas={columnas} filas={filasExport} nombreArchivo={nombreArchivo} />
      </div>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-3 py-2 font-medium">{etiquetaColumna}</th>
              <th className="px-3 py-2 text-right font-medium whitespace-nowrap">Monto</th>
              <th className="px-3 py-2 text-right font-medium whitespace-nowrap">% del total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filas.map((f, i) => (
              <tr
                key={`${f.nombre}-${i}`}
                onClick={onSeleccionar ? () => onSeleccionar(f) : undefined}
                className={
                  onSeleccionar
                    ? "cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-950/20"
                    : ""
                }
              >
                <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">{f.nombre}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap text-zinc-900 dark:text-zinc-100">
                  {formatCOP(f.monto)}
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                  {total !== 0 ? formatPorcentaje(f.monto / total) : "—"}
                </td>
              </tr>
            ))}
            {filas.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-4 text-center text-zinc-400 dark:text-zinc-500">
                  Sin datos en este período
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
