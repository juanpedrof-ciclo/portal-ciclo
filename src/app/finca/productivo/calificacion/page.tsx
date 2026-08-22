import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CalificacionForm } from "./calificacion-form";
import { CriteriosPanel } from "./criterios-panel";
import { TendenciaCalificacionChart, type PuntoPromedioMes } from "./tendencia-calificacion-chart";
import { guardarCalificacionMes } from "./actions";
import { nombreMes } from "@/lib/financiero/dates";
import { obtenerCriteriosCalificacion } from "@/lib/productivo/consultas";
import { formatNumero, type Calificacion } from "@/lib/productivo/types";

export const metadata = { title: "Calificación mensual · Módulo Productivo" };

const RUTA = "/finca/productivo/calificacion";

const COLOR_NOTA: Record<number, string> = {
  1: "bg-red-500 text-white",
  2: "bg-orange-400 text-white",
  3: "bg-amber-300 text-zinc-900",
  4: "bg-lime-400 text-zinc-900",
  5: "bg-green-600 text-white",
};

function mesActualInput(): string {
  return new Date().toISOString().slice(0, 7);
}

export default async function CalificacionPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes: mesParam } = await searchParams;
  const mesInput = mesParam || mesActualInput();
  const mesFecha = `${mesInput}-01`;

  const supabase = await createClient();
  const [criterios, criteriosActivos, { data: calificacionesMes }, { data: historico }] = await Promise.all([
    obtenerCriteriosCalificacion(supabase),
    obtenerCriteriosCalificacion(supabase, { soloActivos: true }),
    supabase
      .from("calificaciones")
      .select("*")
      .eq("mes", mesFecha)
      .eq("anulado", false)
      .returns<Calificacion[]>(),
    supabase
      .from("calificaciones")
      .select("*")
      .eq("anulado", false)
      .order("mes")
      .returns<Calificacion[]>(),
  ]);

  const existentes = Object.fromEntries(
    (calificacionesMes ?? []).map((c) => [c.criterio_id, { nota: c.nota, observaciones: c.observaciones }]),
  );

  const criteriosPorId = Object.fromEntries(criterios.map((c) => [c.id, c.nombre]));
  const meses = [...new Set((historico ?? []).map((c) => c.mes))].sort();
  const criteriosConHistorico = [...new Set((historico ?? []).map((c) => c.criterio_id))];

  const matriz = new Map<string, Map<string, number>>();
  for (const c of historico ?? []) {
    if (!matriz.has(c.criterio_id)) matriz.set(c.criterio_id, new Map());
    matriz.get(c.criterio_id)!.set(c.mes, c.nota);
  }

  const promediosPorMes: PuntoPromedioMes[] = meses.map((mes) => {
    const notas = (historico ?? []).filter((c) => c.mes === mes).map((c) => c.nota);
    return { mes, promedio: notas.reduce((s, n) => s + n, 0) / notas.length };
  });

  const [anio, mesNum] = mesInput.split("-").map(Number);
  const anteriorInput = new Date(Date.UTC(anio, mesNum - 2, 1)).toISOString().slice(0, 7);
  const siguienteInput = new Date(Date.UTC(anio, mesNum, 1)).toISOString().slice(0, 7);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Calificación mensual</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Escala de 1 (deficiente) a 5 (excelente).</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`${RUTA}?mes=${anteriorInput}`}
            className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm text-zinc-600 hover:border-green-500 hover:text-green-700 dark:border-zinc-700 dark:text-zinc-300"
          >
            ←
          </Link>
          <span className="min-w-32 text-center text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {nombreMes(mesFecha)}
          </span>
          <Link
            href={`${RUTA}?mes=${siguienteInput}`}
            className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm text-zinc-600 hover:border-green-500 hover:text-green-700 dark:border-zinc-700 dark:text-zinc-300"
          >
            →
          </Link>
        </div>
      </div>

      <CalificacionForm
        criterios={criteriosActivos}
        existentes={existentes}
        action={guardarCalificacionMes.bind(null, mesFecha, criteriosActivos.map((c) => c.id))}
      />

      <CriteriosPanel criterios={criterios} />

      {meses.length > 0 && (
        <>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Promedio general por mes</h3>
            <TendenciaCalificacionChart datos={promediosPorMes} />
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="px-5 pt-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">Histórico por criterio</h3>
            <div className="overflow-x-auto p-4">
              <table className="w-full border-separate border-spacing-1 text-sm">
                <thead>
                  <tr>
                    <th className="px-2 py-1 text-left font-medium text-zinc-500 dark:text-zinc-400">Criterio</th>
                    {meses.map((mes) => (
                      <th key={mes} className="px-2 py-1 text-center text-xs font-medium whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                        {nombreMes(mes)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {criteriosConHistorico.map((criterioId) => (
                    <tr key={criterioId}>
                      <td className="px-2 py-1 text-zinc-800 dark:text-zinc-200">
                        {criteriosPorId[criterioId] ?? "—"}
                      </td>
                      {meses.map((mes) => {
                        const nota = matriz.get(criterioId)?.get(mes);
                        return (
                          <td key={mes} className="px-2 py-1 text-center">
                            {nota != null ? (
                              <span className={`inline-flex size-8 items-center justify-center rounded-lg text-xs font-semibold ${COLOR_NOTA[nota]}`}>
                                {formatNumero(nota, 0)}
                              </span>
                            ) : (
                              <span className="text-zinc-300 dark:text-zinc-700">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
