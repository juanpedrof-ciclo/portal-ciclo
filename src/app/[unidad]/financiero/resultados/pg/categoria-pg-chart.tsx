"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CategoriaPG } from "@/lib/financiero/pg";
import { CATEGORIA_LABELS, formatCOP, formatCOPCompacto } from "@/lib/financiero/types";
import type { TipoPL } from "@/lib/financiero/types";

const COLOR_POR_TIPO: Record<TipoPL, string> = {
  costo_producto: "var(--chart-costo-producto)",
  gasto_venta: "var(--chart-gasto-venta)",
  gasto_administrativo: "var(--chart-gasto-administrativo)",
};

function colorDe(item: CategoriaPG): string {
  if (item.categoriaId === "otros") return "var(--chart-otros)";
  return COLOR_POR_TIPO[item.tipoPl];
}

export function CategoriaPGChart({ datos }: { datos: CategoriaPG[] }) {
  return (
    <div>
      <div className="h-72 w-full">
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
              width={140}
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
            <Bar dataKey="monto" radius={[0, 4, 4, 0]}>
              {datos.map((item) => (
                <Cell key={item.categoriaId} fill={colorDe(item)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-500 dark:text-zinc-400">
        {(Object.keys(CATEGORIA_LABELS) as TipoPL[]).map((tipo) => (
          <span key={tipo} className="inline-flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-full"
              style={{ background: COLOR_POR_TIPO[tipo] }}
            />
            {CATEGORIA_LABELS[tipo]}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-full"
            style={{ background: "var(--chart-otros)" }}
          />
          Otros
        </span>
      </div>
    </div>
  );
}
