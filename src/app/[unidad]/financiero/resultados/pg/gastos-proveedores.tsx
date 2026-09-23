"use client";

import { useState } from "react";
import {
  desglosePorProveedor,
  type CategoriaPG,
  type FilaFactura,
  type ProveedorPG,
} from "@/lib/financiero/pg";
import { formatCOP, formatFechaCorta } from "@/lib/financiero/types";
import { ExportarTabla, type ColumnaExport } from "@/components/exportar-tabla";
import { CategoriaPGChart } from "./categoria-pg-chart";
import { TablaRanking } from "./tabla-ranking";
import { BreadcrumbDrilldown } from "./breadcrumb-drilldown";

const TOP_PROVEEDORES = 10;

export function GastosProveedores({
  categorias,
  facturas,
}: {
  categorias: CategoriaPG[];
  facturas: FilaFactura[];
}) {
  const [categoriaSel, setCategoriaSel] = useState<CategoriaPG | null>(null);
  const [proveedorSel, setProveedorSel] = useState<ProveedorPG | null>(null);

  const proveedores = categoriaSel
    ? desglosePorProveedor({ facturas }, categoriaSel.categoriaIds)
    : [];
  const totalCategoria = proveedores.reduce((s, p) => s + p.monto, 0);
  const topProveedores = proveedores.slice(0, TOP_PROVEEDORES);

  const facturasProveedor =
    categoriaSel && proveedorSel
      ? facturas.filter(
          (f) =>
            f.proveedor_id === proveedorSel.proveedorId &&
            categoriaSel.categoriaIds.includes(f.categoria_id),
        )
      : [];

  function seleccionarCategoria(item: CategoriaPG) {
    setCategoriaSel(item);
    setProveedorSel(null);
  }

  const columnasFacturas: ColumnaExport[] = [
    { key: "fecha", header: "Fecha", tipo: "texto" },
    { key: "numero", header: "N° factura", tipo: "texto" },
    { key: "monto", header: "Monto", tipo: "moneda" },
    { key: "estado", header: "Estado", tipo: "texto" },
  ];
  const filasFacturasExport = facturasProveedor.map((f) => ({
    fecha: formatFechaCorta(f.fecha),
    numero: f.numero_factura ?? "—",
    monto: Number(f.monto),
    estado: f.estado,
  }));

  return (
    <div className="flex flex-col gap-4">
      <CategoriaPGChart datos={categorias} onSeleccionar={seleccionarCategoria} />

      {categoriaSel && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
          <BreadcrumbDrilldown
            items={[
              { label: categoriaSel.nombre, onClick: () => setProveedorSel(null) },
              ...(proveedorSel ? [{ label: proveedorSel.nombre }] : []),
            ]}
            onCerrar={() => {
              setCategoriaSel(null);
              setProveedorSel(null);
            }}
          />

          {!proveedorSel ? (
            <TablaRanking
              filas={topProveedores}
              total={totalCategoria}
              onSeleccionar={setProveedorSel}
              nombreArchivo={`proveedores-${categoriaSel.nombre}`}
              etiquetaColumna="Proveedor"
            />
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Facturas
                </h4>
                <ExportarTabla
                  columnas={columnasFacturas}
                  filas={filasFacturasExport}
                  nombreArchivo={`facturas-${proveedorSel.nombre}`}
                />
              </div>
              <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                    <tr>
                      <th className="px-3 py-2 font-medium">Fecha</th>
                      <th className="px-3 py-2 font-medium">N° factura</th>
                      <th className="px-3 py-2 text-right font-medium">Monto</th>
                      <th className="px-3 py-2 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {facturasProveedor.map((f) => (
                      <tr key={f.id}>
                        <td className="px-3 py-2 whitespace-nowrap text-zinc-700 dark:text-zinc-300">
                          {formatFechaCorta(f.fecha)}
                        </td>
                        <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                          {f.numero_factura ?? "—"}
                        </td>
                        <td className="px-3 py-2 text-right whitespace-nowrap text-zinc-900 dark:text-zinc-100">
                          {formatCOP(Number(f.monto))}
                        </td>
                        <td className="px-3 py-2 capitalize text-zinc-700 dark:text-zinc-300">
                          {f.estado}
                        </td>
                      </tr>
                    ))}
                    {facturasProveedor.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-center text-zinc-400 dark:text-zinc-500">
                          Sin facturas en este período
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
