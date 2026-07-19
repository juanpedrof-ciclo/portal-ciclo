import { parseMontoCOP } from "./parse-monto-cop";
import type { FilaCruda } from "./parse-pedidos";
import type { MapeoColumnas } from "./types";

export type PedidoAgrupado = {
  idOrdenExterno: string;
  cliente: string;
  telefono: string;
  estado: string | null;
  fecha: string | null;
  montoTotal: number;
};

function valorColumna(fila: FilaCruda, columna: string | undefined): string {
  if (!columna) return "";
  const valor = fila[columna];
  return valor === undefined || valor === null ? "" : String(valor).trim();
}

export function agruparPedidos(
  filas: FilaCruda[],
  mapeo: MapeoColumnas,
): PedidoAgrupado[] {
  const grupos = new Map<string, PedidoAgrupado>();

  for (const fila of filas) {
    const idOrdenExterno = valorColumna(fila, mapeo.id_orden);
    if (!idOrdenExterno) continue;

    const totalLinea = parseMontoCOP(fila[mapeo.total]);

    const existente = grupos.get(idOrdenExterno);
    if (existente) {
      existente.montoTotal += totalLinea;
      if (!existente.cliente) existente.cliente = valorColumna(fila, mapeo.cliente);
      if (!existente.telefono) existente.telefono = valorColumna(fila, mapeo.telefono);
      if (!existente.estado) existente.estado = valorColumna(fila, mapeo.estado) || null;
      if (!existente.fecha) existente.fecha = valorColumna(fila, mapeo.fecha) || null;
      continue;
    }

    grupos.set(idOrdenExterno, {
      idOrdenExterno,
      cliente: valorColumna(fila, mapeo.cliente),
      telefono: valorColumna(fila, mapeo.telefono),
      estado: valorColumna(fila, mapeo.estado) || null,
      fecha: valorColumna(fila, mapeo.fecha) || null,
      montoTotal: totalLinea,
    });
  }

  return Array.from(grupos.values()).filter((pedido) => pedido.cliente);
}
