import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { calcularPG, type ResumenPG } from "@/lib/financiero/pg";
import {
  rangoAnioActual,
  rangoMesActual,
  rangoSemanaActual,
  semanasEnRango,
  ultimosMeses,
} from "@/lib/financiero/dates";
import { Campo, inputClass } from "@/components/form-field";
import { formatCOP, formatFechaCorta } from "@/lib/financiero/types";

export const metadata = { title: "P&G · Módulo Financiero · Ciclo Market" };

const RUTA = "/market/financiero/resultados/pg";

export default async function PGPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  const { desde: desdeParam, hasta: hastaParam } = await searchParams;
  const defecto = rangoMesActual();
  const desde = desdeParam || defecto.desde;
  const hasta = hastaParam || defecto.hasta;

  const supabase = await createClient();
  const resumen = await calcularPG(supabase, desde, hasta);
  const semanas = semanasEnRango(desde, hasta);
  const pgSemanas = await Promise.all(
    semanas.map((rango) => calcularPG(supabase, rango.desde, rango.hasta)),
  );

  return (
    <div className="flex flex-col gap-6">
      <RangoFechasSelector desde={desde} hasta={hasta} />

      <TablaPG
        titulo={`P&G del ${formatFechaCorta(desde)} al ${formatFechaCorta(hasta)}`}
        etiquetas={["Total del período"]}
        valores={[resumen]}
      />

      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-amber-700 hover:underline dark:text-amber-400">
          Ver desglose por semana
        </summary>
        <div className="mt-4">
          <TablaPG
            titulo="Desglose semanal"
            etiquetas={semanas.map((s) => `Sem. ${formatFechaCorta(s.etiqueta)}`)}
            valores={pgSemanas}
          />
        </div>
      </details>
    </div>
  );
}

function RangoFechasSelector({ desde, hasta }: { desde: string; hasta: string }) {
  const atajos = [
    { label: "Esta semana", rango: rangoSemanaActual() },
    { label: "Este mes", rango: rangoMesActual() },
    { label: "Mes pasado", rango: ultimosMeses(2)[0] },
    { label: "Este año", rango: rangoAnioActual() },
  ];

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap gap-2">
        {atajos.map((atajo) => (
          <Link
            key={atajo.label}
            href={`${RUTA}?desde=${atajo.rango.desde}&hasta=${atajo.rango.hasta}`}
            className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-amber-500 hover:text-amber-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-amber-500 dark:hover:text-amber-400"
          >
            {atajo.label}
          </Link>
        ))}
      </div>
      <form action={RUTA} className="flex flex-wrap items-end gap-3">
        <Campo label="Desde" htmlFor="desde">
          <input
            id="desde"
            name="desde"
            type="date"
            defaultValue={desde}
            required
            className={inputClass}
          />
        </Campo>
        <Campo label="Hasta" htmlFor="hasta">
          <input
            id="hasta"
            name="hasta"
            type="date"
            defaultValue={hasta}
            required
            className={inputClass}
          />
        </Campo>
        <button
          type="submit"
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700"
        >
          Aplicar
        </button>
      </form>
    </div>
  );
}

function TablaPG({
  titulo,
  etiquetas,
  valores,
}: {
  titulo: string;
  etiquetas: string[];
  valores: ResumenPG[];
}) {
  const filas: { label: string; key: keyof ResumenPG; negativo?: boolean }[] = [
    { label: "Ingresos", key: "ingresos" },
    { label: "Costo de producto", key: "costoProducto", negativo: true },
    { label: "Margen bruto", key: "margenBruto" },
    { label: "Gasto de venta", key: "gastoVenta", negativo: true },
    { label: "Gasto administrativo", key: "gastoAdministrativo", negativo: true },
    { label: "Utilidad", key: "utilidad" },
  ];

  return (
    <section>
      <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {titulo}
      </h3>
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Concepto</th>
              {etiquetas.map((etiqueta) => (
                <th key={etiqueta} className="px-4 py-3 text-right font-medium whitespace-nowrap">
                  {etiqueta}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filas.map((fila) => (
              <tr key={fila.key} className={fila.key === "utilidad" ? "bg-zinc-50 dark:bg-zinc-950/40" : ""}>
                <td className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                  {fila.label}
                </td>
                {valores.map((v, i) => {
                  const valor = v[fila.key];
                  const mostrado = fila.negativo ? -valor : valor;
                  return (
                    <td
                      key={i}
                      className={`px-4 py-3 text-right whitespace-nowrap ${
                        mostrado < 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-zinc-900 dark:text-zinc-100"
                      }`}
                    >
                      {formatCOP(mostrado)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
