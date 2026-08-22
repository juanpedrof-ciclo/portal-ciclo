import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Campo, inputClass } from "@/components/form-field";
import {
  rangoAnioActual,
  rangoMesActual,
  rangoSemanaActual,
  semanasEnRango,
  ultimosMeses,
} from "@/lib/financiero/dates";
import { obtenerGrupos } from "@/lib/productivo/consultas";
import {
  ESTADO_REPRODUCTIVO_LABELS,
  formatNumero,
  type AnimalEstado,
  type EstadoReproductivo,
  type VistaInventarioLote,
} from "@/lib/productivo/types";
import { TendenciaAlimentoChart, TendenciaLecheChart, type PuntoTendencia } from "./indicadores-charts";

export const metadata = { title: "Indicadores · Módulo Productivo" };

const RUTA = "/finca/productivo/indicadores";

export default async function IndicadoresPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  const { desde: desdeParam, hasta: hastaParam } = await searchParams;
  const defecto = rangoMesActual();
  const desde = desdeParam || defecto.desde;
  const hasta = hastaParam || defecto.hasta;
  const diasEnRango = Math.max(
    1,
    Math.round((new Date(`${hasta}T00:00:00Z`).getTime() - new Date(`${desde}T00:00:00Z`).getTime()) / 86_400_000) + 1,
  );

  const supabase = await createClient();
  const [
    grupos,
    { data: leche },
    { data: alimentacion },
    { data: muertesIndividuales },
    { data: muertesLote },
    { data: animalesActivos },
    { data: inventarioLotes },
  ] = await Promise.all([
    obtenerGrupos(supabase, { soloActivos: true }),
    supabase.from("leche_registros").select("fecha, litros").eq("anulado", false).gte("fecha", desde).lte("fecha", hasta),
    supabase
      .from("alimentacion_registros")
      .select("fecha, grupo_id, kg_alimento")
      .eq("anulado", false)
      .gte("fecha", desde)
      .lte("fecha", hasta),
    supabase
      .from("muertes_individuales")
      .select("animal_id, animales(grupo_id)")
      .eq("anulado", false)
      .gte("fecha", desde)
      .lte("fecha", hasta),
    supabase
      .from("muertes_lote")
      .select("grupo_id, cantidad")
      .eq("anulado", false)
      .gte("fecha", desde)
      .lte("fecha", hasta),
    supabase.from("vista_animales_estado").select("grupo_id, estado, estado_reproductivo").eq("estado", "activo"),
    supabase.from("vista_inventario_lote").select("*").returns<VistaInventarioLote[]>(),
  ]);

  const activos = (animalesActivos as Pick<AnimalEstado, "grupo_id" | "estado_reproductivo">[] | null) ?? [];
  const cantidadPorGrupo = new Map<string, number>();
  for (const a of activos) cantidadPorGrupo.set(a.grupo_id, (cantidadPorGrupo.get(a.grupo_id) ?? 0) + 1);
  for (const v of inventarioLotes ?? []) cantidadPorGrupo.set(v.grupo_id, v.cantidad_actual);

  // KPIs de leche
  const litrosTotal = (leche ?? []).reduce((s, r) => s + Number(r.litros), 0);
  const litrosPorDia = litrosTotal / diasEnRango;
  const bufalasActivas = cantidadPorGrupo.get("bufalas_leche") ?? 0;
  const litrosPorBufalaDia = bufalasActivas > 0 ? litrosPorDia / bufalasActivas : 0;

  // KPIs de alimento
  const kgTotal = (alimentacion ?? []).reduce((s, r) => s + Number(r.kg_alimento), 0);
  const kgPorDia = kgTotal / diasEnRango;

  // Tendencia semanal
  const semanas = semanasEnRango(desde, hasta);
  const litrosPorSemana: PuntoTendencia[] = semanas.map((s) => ({
    etiqueta: s.etiqueta,
    valor: (leche ?? [])
      .filter((r) => r.fecha >= s.desde && r.fecha <= s.hasta)
      .reduce((sum, r) => sum + Number(r.litros), 0),
  }));
  const kgPorSemana: PuntoTendencia[] = semanas.map((s) => ({
    etiqueta: s.etiqueta,
    valor: (alimentacion ?? [])
      .filter((r) => r.fecha >= s.desde && r.fecha <= s.hasta)
      .reduce((sum, r) => sum + Number(r.kg_alimento), 0),
  }));

  // Consumo de alimento por grupo
  const kgPorGrupo = new Map<string, number>();
  for (const r of alimentacion ?? []) {
    kgPorGrupo.set(r.grupo_id, (kgPorGrupo.get(r.grupo_id) ?? 0) + Number(r.kg_alimento));
  }

  // Mortalidad por grupo
  const muertesPorGrupo = new Map<string, number>();
  for (const m of (muertesIndividuales as { animales: { grupo_id: string } | null }[] | null) ?? []) {
    const grupoId = m.animales?.grupo_id;
    if (grupoId) muertesPorGrupo.set(grupoId, (muertesPorGrupo.get(grupoId) ?? 0) + 1);
  }
  for (const m of muertesLote ?? []) {
    muertesPorGrupo.set(m.grupo_id, (muertesPorGrupo.get(m.grupo_id) ?? 0) + Number(m.cantidad));
  }

  // Estado reproductivo del hato
  const gruposReproductivos = grupos.filter((g) => g.reproductivo);
  const estadosPorGrupo = new Map<string, Record<EstadoReproductivo, number>>();
  for (const g of gruposReproductivos) estadosPorGrupo.set(g.id, { vacia: 0, servida: 0, prenada: 0, lactando: 0 });
  for (const a of activos) {
    const bucket = estadosPorGrupo.get(a.grupo_id);
    if (bucket && a.estado_reproductivo) bucket[a.estado_reproductivo] += 1;
  }

  return (
    <div className="flex flex-col gap-6">
      <RangoFechasSelector desde={desde} hasta={hasta} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Leche total" valor={`${formatNumero(litrosTotal)} L`} />
        <Kpi label="Litros/búfala/día" valor={formatNumero(litrosPorBufalaDia, 2)} />
        <Kpi label="Alimento total" valor={`${formatNumero(kgTotal)} kg`} />
        <Kpi label="Kg/día" valor={formatNumero(kgPorDia)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Producción de leche por semana
          </h3>
          <TendenciaLecheChart datos={litrosPorSemana} />
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Consumo de alimento por semana
          </h3>
          <TendenciaAlimentoChart datos={kgPorSemana} />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="px-5 pt-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Alimento y mortalidad por grupo
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Grupo</th>
                <th className="px-4 py-3 text-right font-medium">Inventario</th>
                <th className="px-4 py-3 text-right font-medium">Kg alimento</th>
                <th className="px-4 py-3 text-right font-medium">Kg/animal/día</th>
                <th className="px-4 py-3 text-right font-medium">Muertes</th>
                <th className="px-4 py-3 text-right font-medium">Tasa mortalidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {grupos.map((g) => {
                const cantidad = cantidadPorGrupo.get(g.id) ?? 0;
                const kg = kgPorGrupo.get(g.id) ?? 0;
                const kgPorAnimalDia = cantidad > 0 ? kg / (cantidad * diasEnRango) : 0;
                const muertes = muertesPorGrupo.get(g.id) ?? 0;
                const base = cantidad + muertes;
                const tasa = base > 0 ? (muertes / base) * 100 : 0;
                return (
                  <tr key={g.id}>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{g.nombre}</td>
                    <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-300">{cantidad}</td>
                    <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-300">{formatNumero(kg)}</td>
                    <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-300">
                      {formatNumero(kgPorAnimalDia, 2)}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-300">{muertes}</td>
                    <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-300">
                      {formatNumero(tasa, 1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {gruposReproductivos.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Estado reproductivo del hato
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {gruposReproductivos.map((g) => {
              const estados = estadosPorGrupo.get(g.id)!;
              return (
                <div
                  key={g.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{g.nombre}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(Object.keys(ESTADO_REPRODUCTIVO_LABELS) as EstadoReproductivo[]).map((estado) => (
                      <span
                        key={estado}
                        className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        {ESTADO_REPRODUCTIVO_LABELS[estado]}
                        <span className="rounded-full bg-white px-1.5 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
                          {estados[estado]}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{valor}</p>
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
            className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-green-500 hover:text-green-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-green-500 dark:hover:text-green-400"
          >
            {atajo.label}
          </Link>
        ))}
      </div>
      <form action={RUTA} className="flex flex-wrap items-end gap-3">
        <Campo label="Desde" htmlFor="desde">
          <input id="desde" name="desde" type="date" defaultValue={desde} required className={inputClass} />
        </Campo>
        <Campo label="Hasta" htmlFor="hasta">
          <input id="hasta" name="hasta" type="date" defaultValue={hasta} required className={inputClass} />
        </Campo>
        <button
          type="submit"
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
        >
          Aplicar
        </button>
      </form>
    </div>
  );
}
