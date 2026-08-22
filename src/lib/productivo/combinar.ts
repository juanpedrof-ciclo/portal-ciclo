import { TAMANO_PAGINA } from "@/lib/financiero/list-query";

/**
 * Pagina en memoria una lista ya combinada (individual + lote) y ordenada.
 * El volumen de estos eventos es bajo (registro manual de campo), así que
 * traer todo y paginar en JS es más simple que forzar un range() de SQL
 * sobre dos tablas distintas.
 */
export function paginarEnMemoria<T>(items: T[], page: number): { pagina: T[]; total: number } {
  const total = items.length;
  const desde = (page - 1) * TAMANO_PAGINA;
  return { pagina: items.slice(desde, desde + TAMANO_PAGINA), total };
}
