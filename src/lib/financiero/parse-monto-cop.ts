/**
 * Formato colombiano: el punto es separador de miles y la coma es decimal.
 * "65.000" -> 65000, "65.000,50" -> 65000.5.
 * Si la celda ya llegó como número (Excel), se retorna tal cual.
 */
export function parseMontoCOP(valor: string | number | null | undefined): number {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;

  const texto = String(valor ?? "").trim();
  if (!texto) return 0;

  const limpio = texto.replace(/[^0-9.,-]/g, "");
  if (!limpio) return 0;

  const sinMiles = limpio.replace(/\./g, "").replace(",", ".");
  const numero = Number.parseFloat(sinMiles);
  return Number.isFinite(numero) ? numero : 0;
}
