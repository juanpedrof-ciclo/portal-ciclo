"use client";

export type ColumnaExport = {
  key: string;
  header: string;
  tipo?: "texto" | "moneda" | "porcentaje";
};

export function ExportarTabla({
  columnas,
  filas,
  nombreArchivo,
}: {
  columnas: ColumnaExport[];
  filas: Record<string, unknown>[];
  nombreArchivo: string;
}) {
  async function exportarExcel() {
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    const hoja = workbook.addWorksheet("Datos");

    hoja.addRow(columnas.map((c) => c.header)).font = { bold: true };
    for (const fila of filas) {
      hoja.addRow(columnas.map((c) => valorParaExcel(c, fila)));
    }
    columnas.forEach((c, idx) => {
      const columna = hoja.getColumn(idx + 1);
      if (c.tipo === "moneda") columna.numFmt = "#,##0";
      if (c.tipo === "porcentaje") columna.numFmt = "0.0%";
      columna.width = Math.max(c.header.length + 2, 12);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    descargar(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `${nombreArchivo}.xlsx`,
    );
  }

  function exportarCSV() {
    const filasTexto = [
      columnas.map((c) => escaparCSV(c.header)).join(","),
      ...filas.map((fila) =>
        columnas.map((c) => escaparCSV(valorParaCSV(c, fila))).join(","),
      ),
    ];
    descargar(
      new Blob(["﻿" + filasTexto.join("\r\n")], {
        type: "text/csv;charset=utf-8",
      }),
      `${nombreArchivo}.csv`,
    );
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={exportarExcel}
        className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 transition hover:border-amber-500 hover:text-amber-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-amber-500 dark:hover:text-amber-400"
      >
        Excel
      </button>
      <button
        type="button"
        onClick={exportarCSV}
        className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 transition hover:border-amber-500 hover:text-amber-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-amber-500 dark:hover:text-amber-400"
      >
        CSV
      </button>
    </div>
  );
}

function valorParaExcel(columna: ColumnaExport, fila: Record<string, unknown>): unknown {
  const valor = fila[columna.key];
  if (valor === null || valor === undefined) return "";
  return valor;
}

function valorParaCSV(columna: ColumnaExport, fila: Record<string, unknown>): string {
  const valor = fila[columna.key];
  if (valor === null || valor === undefined) return "";
  if (columna.tipo === "porcentaje" && typeof valor === "number") {
    return `${(valor * 100).toFixed(1)}%`;
  }
  if (columna.tipo === "moneda" && typeof valor === "number") {
    return String(Math.round(valor));
  }
  return String(valor);
}

function escaparCSV(valor: string): string {
  if (/[",\n\r]/.test(valor)) return `"${valor.replace(/"/g, '""')}"`;
  return valor;
}

function descargar(blob: Blob, nombreArchivo: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
