import ExcelJS from "exceljs";

export type TotalDetectado = {
  valor: number;
  ubicacion: string;
  confianza: "etiqueta" | "estimado";
};

function celdaEsEtiquetaTotal(texto: string): boolean {
  const limpio = texto.trim().toLowerCase();
  return limpio === "total" || /^total\b/.test(limpio) || /\btotal$/.test(limpio);
}

function valorNumerico(value: ExcelJS.CellValue): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (
    value &&
    typeof value === "object" &&
    "result" in value &&
    typeof value.result === "number"
  ) {
    return value.result;
  }
  return null;
}

export async function extractTotalFromBuffer(
  buffer: ArrayBuffer,
): Promise<TotalDetectado | null> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  let mejorPorEtiqueta: TotalDetectado | null = null;
  let mayorValor: TotalDetectado | null = null;

  for (const sheet of workbook.worksheets) {
    sheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        const numero = valorNumerico(cell.value);
        if (numero !== null && numero > 0) {
          if (!mayorValor || numero > mayorValor.valor) {
            mayorValor = {
              valor: numero,
              ubicacion: `${sheet.name}!${cell.address}`,
              confianza: "estimado",
            };
          }
        }

        if (typeof cell.value === "string" && celdaEsEtiquetaTotal(cell.value)) {
          const candidatos: ExcelJS.Cell[] = [
            sheet.getRow(rowNumber).getCell(colNumber + 1),
            sheet.getRow(rowNumber).getCell(colNumber + 2),
            sheet.getRow(rowNumber + 1).getCell(colNumber),
          ];
          for (const candidato of candidatos) {
            const valor = valorNumerico(candidato.value);
            if (valor !== null && valor > 0) {
              mejorPorEtiqueta = {
                valor,
                ubicacion: `${sheet.name}!${candidato.address}`,
                confianza: "etiqueta",
              };
              break;
            }
          }
        }
      });
    });
  }

  return mejorPorEtiqueta ?? mayorValor;
}
