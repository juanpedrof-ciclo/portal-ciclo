export type ResultadoAnulacionLote = {
  anulados: number;
  bloqueados: { id: string; referencia: string; motivo: string }[];
  advertencias?: string[];
};
