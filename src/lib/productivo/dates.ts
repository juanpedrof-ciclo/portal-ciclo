export function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function diasAtrasISO(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}
