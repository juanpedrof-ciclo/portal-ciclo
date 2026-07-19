function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function rangoMesActual(hoy = new Date()) {
  const desde = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 1));
  const hasta = new Date(
    Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() + 1, 0),
  );
  return { desde: toISODate(desde), hasta: toISODate(hasta) };
}

export function inicioSemanaActual(hoy = new Date()) {
  const dia = hoy.getUTCDay();
  const diff = (dia + 6) % 7; // lunes = inicio de semana
  const lunes = new Date(
    Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate() - diff),
  );
  return toISODate(lunes);
}

export function nombreMes(isoDate: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(isoDate));
}

export function ultimasSemanas(n: number, hoy = new Date()) {
  const lunesActual = inicioSemanaActual(hoy);
  const rangos: { desde: string; hasta: string; etiqueta: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const base = new Date(`${lunesActual}T00:00:00Z`);
    const desde = new Date(base);
    desde.setUTCDate(desde.getUTCDate() - i * 7);
    const hasta = new Date(desde);
    hasta.setUTCDate(hasta.getUTCDate() + 6);
    rangos.push({
      desde: toISODate(desde),
      hasta: toISODate(hasta),
      etiqueta: toISODate(desde),
    });
  }
  return rangos;
}

export function ultimosMeses(n: number, hoy = new Date()) {
  const rangos: { desde: string; hasta: string; etiqueta: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const desde = new Date(
      Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() - i, 1),
    );
    const hasta = new Date(
      Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() - i + 1, 0),
    );
    rangos.push({
      desde: toISODate(desde),
      hasta: toISODate(hasta),
      etiqueta: nombreMes(toISODate(desde)),
    });
  }
  return rangos;
}
