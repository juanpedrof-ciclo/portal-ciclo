"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CanalPG } from "@/lib/financiero/pg";
import { formatCOP, formatCOPCompacto } from "@/lib/financiero/types";

function colorDe(item: CanalPG): string {
  if (item.canal === "hogar") return "var(--chart-hogar)";
  if (item.canal === "horeca") return "var(--chart-horeca)";
  return "var(--chart-otros)";
}

export function CanalPGChart({
  datos,
  onSeleccionar,
}: {
  datos: CanalPG[];
  onSeleccionar?: (item: CanalPG) => void;
}) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={datos}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
        >
          <XAxis
            type="number"
            tickFormatter={formatCOPCompacto}
            stroke="var(--chart-axis)"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="nombre"
            width={100}
            stroke="var(--chart-axis)"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
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
          <Bar
            dataKey="monto"
            radius={[0, 4, 4, 0]}
            onClick={
              onSeleccionar
                ? (data: unknown) => {
                    const payload = (data as { payload?: CanalPG })?.payload;
                    if (payload) onSeleccionar(payload);
                  }
                : undefined
            }
            style={onSeleccionar ? { cursor: "pointer" } : undefined}
          >
            {datos.map((item) => (
              <Cell key={item.canal ?? "sin_canal"} fill={colorDe(item)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
