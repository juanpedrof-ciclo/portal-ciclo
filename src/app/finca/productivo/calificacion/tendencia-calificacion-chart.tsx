"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { nombreMes } from "@/lib/financiero/dates";
import { formatNumero } from "@/lib/productivo/types";

export type PuntoPromedioMes = { mes: string; promedio: number };

export function TendenciaCalificacionChart({ datos }: { datos: PuntoPromedioMes[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={datos} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis
            dataKey="mes"
            tickFormatter={nombreMes}
            stroke="var(--chart-axis)"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            stroke="var(--chart-axis)"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={32}
          />
          <Tooltip
            labelFormatter={(v) => nombreMes(String(v))}
            formatter={(v) => formatNumero(Number(v), 2)}
            contentStyle={{
              background: "var(--chart-tooltip-bg)",
              border: "1px solid var(--chart-tooltip-border)",
              borderRadius: 12,
              color: "var(--chart-tooltip-text)",
              fontSize: 13,
            }}
            labelStyle={{ color: "var(--chart-tooltip-text)", fontWeight: 600 }}
          />
          <Line
            type="monotone"
            dataKey="promedio"
            name="Promedio"
            stroke="var(--chart-utilidad)"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
