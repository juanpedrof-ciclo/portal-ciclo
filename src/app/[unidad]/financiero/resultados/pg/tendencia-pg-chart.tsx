"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PuntoTendenciaPG } from "@/lib/financiero/pg";
import { nombreMes } from "@/lib/financiero/dates";
import { formatCOP, formatCOPCompacto, formatFechaCorta } from "@/lib/financiero/types";

const SERIES = [
  { key: "ingresos", nombre: "Ingresos", color: "var(--chart-ingresos)" },
  { key: "costos", nombre: "Costos", color: "var(--chart-costos)" },
  { key: "utilidad", nombre: "Utilidad", color: "var(--chart-utilidad)" },
] as const;

export function TendenciaPGChart({
  datos,
  granularidad,
}: {
  datos: PuntoTendenciaPG[];
  granularidad: "semana" | "mes";
}) {
  const [mostrarAnterior, setMostrarAnterior] = useState(false);
  const formatEtiqueta = (valor: string) =>
    granularidad === "semana" ? formatFechaCorta(valor) : nombreMes(valor);

  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
        <input
          type="checkbox"
          checked={mostrarAnterior}
          onChange={(e) => setMostrarAnterior(e.target.checked)}
          className="size-3.5 accent-amber-600"
        />
        Comparar con el período anterior
      </label>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={datos} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
            <XAxis
              dataKey="etiqueta"
              tickFormatter={formatEtiqueta}
              stroke="var(--chart-axis)"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={formatCOPCompacto}
              stroke="var(--chart-axis)"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={64}
            />
            <ReferenceLine y={0} stroke="var(--chart-axis)" />
            <Tooltip
              labelFormatter={(valor) => formatEtiqueta(String(valor))}
              formatter={(valor) => formatCOP(Number(valor))}
              contentStyle={{
                background: "var(--chart-tooltip-bg)",
                border: "1px solid var(--chart-tooltip-border)",
                borderRadius: 12,
                color: "var(--chart-tooltip-text)",
                fontSize: 13,
              }}
              labelStyle={{ color: "var(--chart-tooltip-text)", fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: "var(--foreground)" }} />
            {SERIES.map((serie) => (
              <Line
                key={serie.key}
                type="monotone"
                dataKey={serie.key}
                name={serie.nombre}
                stroke={serie.color}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
            {mostrarAnterior &&
              SERIES.map((serie) => (
                <Line
                  key={`${serie.key}-anterior`}
                  type="monotone"
                  dataKey={`${serie.key}Anterior`}
                  name={`${serie.nombre} (período anterior)`}
                  stroke={serie.color}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  connectNulls
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
