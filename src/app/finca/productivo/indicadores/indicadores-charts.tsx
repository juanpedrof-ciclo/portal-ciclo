"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatFechaCorta } from "@/lib/financiero/types";
import { formatNumero } from "@/lib/productivo/types";

export type PuntoTendencia = { etiqueta: string; valor: number };

const ejeComun = {
  stroke: "var(--chart-axis)",
  tick: { fontSize: 12 },
  tickLine: false,
  axisLine: false,
};

const tooltipComun = {
  contentStyle: {
    background: "var(--chart-tooltip-bg)",
    border: "1px solid var(--chart-tooltip-border)",
    borderRadius: 12,
    color: "var(--chart-tooltip-text)",
    fontSize: 13,
  },
  labelStyle: { color: "var(--chart-tooltip-text)", fontWeight: 600 },
};

export function TendenciaLecheChart({ datos }: { datos: PuntoTendencia[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={datos} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="etiqueta" tickFormatter={formatFechaCorta} {...ejeComun} />
          <YAxis tickFormatter={(v) => formatNumero(v)} {...ejeComun} width={48} />
          <Tooltip
            labelFormatter={(v) => formatFechaCorta(String(v))}
            formatter={(v) => `${formatNumero(Number(v))} L`}
            {...tooltipComun}
          />
          <Line
            type="monotone"
            dataKey="valor"
            name="Litros"
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

export function TendenciaAlimentoChart({ datos }: { datos: PuntoTendencia[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="etiqueta" tickFormatter={formatFechaCorta} {...ejeComun} />
          <YAxis tickFormatter={(v) => formatNumero(v)} {...ejeComun} width={48} />
          <Tooltip
            labelFormatter={(v) => formatFechaCorta(String(v))}
            formatter={(v) => `${formatNumero(Number(v))} kg`}
            {...tooltipComun}
          />
          <Bar dataKey="valor" name="Kg" fill="var(--chart-costos)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
