import ExcelJS from "exceljs";

export type FilaCruda = Record<string, string | number>;

export type ArchivoParseado = {
  encabezados: string[];
  filas: FilaCruda[];
};

function celdaATexto(value: ExcelJS.CellValue): string | number {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return value;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object" && "result" in value) {
    const resultado = (value as { result: unknown }).result;
    if (typeof resultado === "number") return resultado;
    return String(resultado ?? "");
  }
  if (typeof value === "object" && "text" in value) {
    return String((value as { text: unknown }).text ?? "");
  }
  return String(value);
}

async function parseXlsx(buffer: ArrayBuffer): Promise<ArchivoParseado> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return { encabezados: [], filas: [] };

  const encabezados: string[] = [];
  const filaEncabezado = sheet.getRow(1);
  filaEncabezado.eachCell({ includeEmpty: false }, (cell) => {
    encabezados.push(String(celdaATexto(cell.value)).trim());
  });

  const filas: FilaCruda[] = [];
  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    if (row.cellCount === 0) continue;
    const fila: FilaCruda = {};
    let tieneDatos = false;
    encabezados.forEach((encabezado, index) => {
      const valor = celdaATexto(row.getCell(index + 1).value);
      if (valor !== "") tieneDatos = true;
      fila[encabezado] = valor;
    });
    if (tieneDatos) filas.push(fila);
  }

  return { encabezados, filas };
}

function detectarDelimitador(primeraLinea: string): string {
  const comas = (primeraLinea.match(/,/g) ?? []).length;
  const puntoYComa = (primeraLinea.match(/;/g) ?? []).length;
  return puntoYComa > comas ? ";" : ",";
}

function parseLineaCSV(linea: string, delimitador: string): string[] {
  const valores: string[] = [];
  let actual = "";
  let dentroComillas = false;

  for (let i = 0; i < linea.length; i++) {
    const char = linea[i];
    if (dentroComillas) {
      if (char === '"') {
        if (linea[i + 1] === '"') {
          actual += '"';
          i++;
        } else {
          dentroComillas = false;
        }
      } else {
        actual += char;
      }
    } else if (char === '"') {
      dentroComillas = true;
    } else if (char === delimitador) {
      valores.push(actual.trim());
      actual = "";
    } else {
      actual += char;
    }
  }
  valores.push(actual.trim());
  return valores;
}

function parseCsv(texto: string): ArchivoParseado {
  const lineas = texto
    .split(/\r\n|\n|\r/)
    .filter((linea) => linea.trim().length > 0);
  if (lineas.length === 0) return { encabezados: [], filas: [] };

  const delimitador = detectarDelimitador(lineas[0]);
  const encabezados = parseLineaCSV(lineas[0], delimitador).map((h) => h.trim());

  const filas: FilaCruda[] = [];
  for (let i = 1; i < lineas.length; i++) {
    const valores = parseLineaCSV(lineas[i], delimitador);
    const fila: FilaCruda = {};
    let tieneDatos = false;
    encabezados.forEach((encabezado, index) => {
      const valor = valores[index] ?? "";
      if (valor !== "") tieneDatos = true;
      fila[encabezado] = valor;
    });
    if (tieneDatos) filas.push(fila);
  }

  return { encabezados, filas };
}

export async function parseArchivoPedidos(
  buffer: ArrayBuffer,
  nombreArchivo: string,
): Promise<ArchivoParseado> {
  const extension = nombreArchivo.toLowerCase().split(".").pop();
  if (extension === "csv") {
    const texto = new TextDecoder("utf-8").decode(buffer);
    return parseCsv(texto);
  }
  return parseXlsx(buffer);
}
