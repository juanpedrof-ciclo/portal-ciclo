import Link from "next/link";
import {
  Utensils,
  Milk,
  Baby,
  Skull,
  Truck,
  HeartHandshake,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { hoyISO, diasAtrasISO } from "@/lib/productivo/dates";
import {
  ESTADO_REPRODUCTIVO_LABELS,
  formatNumero,
  type AnimalEstado,
  type EstadoReproductivo,
  type VistaInventarioLote,
} from "@/lib/productivo/types";

export const metadata = { title: "Módulo Productivo · Ciclo Finca" };

const ACCIONES = [
  { href: "/finca/productivo/alimentacion", label: "Alimentación", icon: Utensils },
  { href: "/finca/productivo/leche", label: "Leche", icon: Milk },
  { href: "/finca/productivo/nacimientos", label: "Nacimiento", icon: Baby },
  { href: "/finca/productivo/muertes", label: "Muerte", icon: Skull },
  { href: "/finca/productivo/salidas", label: "Salida", icon: Truck },
  { href: "/finca/productivo/reproduccion/servicios", label: "Servicio", icon: HeartHandshake },
];

export default async function ProductivoInicioPage() {
  const supabase = await createClient();
  const hoy = hoyISO();
  const hace7 = diasAtrasISO(6);

  const [
    { data: grupos },
    { data: animalesActivos },
    { data: inventarioLotes },
    { data: litrosHoyData },
    { data: litrosSemanaData },
    { data: kgHoyData },
    { count: muertesIndividualesRecientes },
    { data: muertesLoteRecientes },
  ] = await Promise.all([
    supabase.from("grupos_animales").select("*").order("orden"),
    supabase
      .from("vista_animales_estado")
      .select("grupo_id, estado_reproductivo")
      .eq("estado", "activo"),
    supabase.from("vista_inventario_lote").select("*"),
    supabase.from("leche_registros").select("litros").eq("fecha", hoy).eq("anulado", false),
    supabase
      .from("leche_registros")
      .select("litros")
      .gte("fecha", hace7)
      .eq("anulado", false),
    supabase.from("alimentacion_registros").select("kg_alimento").eq("fecha", hoy).eq("anulado", false),
    supabase
      .from("muertes_individuales")
      .select("id", { count: "exact", head: true })
      .gte("fecha", hace7)
      .eq("anulado", false),
    supabase.from("muertes_lote").select("cantidad").gte("fecha", hace7).eq("anulado", false),
  ]);

  const gruposLista = grupos ?? [];
  const inventarioLotePorGrupo = new Map(
    (inventarioLotes as VistaInventarioLote[] | null ?? []).map((v) => [v.grupo_id, v.cantidad_actual]),
  );
  const activos = (animalesActivos as Pick<AnimalEstado, "grupo_id" | "estado_reproductivo">[] | null) ?? [];
  const conteoPorGrupoIndividual = new Map<string, number>();
  for (const a of activos) {
    conteoPorGrupoIndividual.set(a.grupo_id, (conteoPorGrupoIndividual.get(a.grupo_id) ?? 0) + 1);
  }

  const litrosHoy = (litrosHoyData ?? []).reduce((s, r) => s + Number(r.litros), 0);
  const litrosSemana = (litrosSemanaData ?? []).reduce((s, r) => s + Number(r.litros), 0);
  const kgHoy = (kgHoyData ?? []).reduce((s, r) => s + Number(r.kg_alimento), 0);
  const muertesRecientes =
    (muertesIndividualesRecientes ?? 0) +
    (muertesLoteRecientes ?? []).reduce((s, r) => s + Number(r.cantidad), 0);

  const gruposReproductivos = gruposLista.filter((g) => g.reproductivo);
  const estadosPorGrupo = new Map<string, Record<EstadoReproductivo, number>>();
  for (const g of gruposReproductivos) {
    estadosPorGrupo.set(g.id, { vacia: 0, servida: 0, prenada: 0, lactando: 0 });
  }
  for (const a of activos) {
    const bucket = estadosPorGrupo.get(a.grupo_id);
    if (bucket && a.estado_reproductivo) bucket[a.estado_reproductivo] += 1;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Registrar
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Toca un botón para registrar rápido desde el celular.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ACCIONES.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-6 text-center shadow-sm transition hover:border-green-400 hover:shadow-md active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-green-700"
            >
              <div className="inline-flex size-11 items-center justify-center rounded-xl bg-green-500/10 text-green-600 dark:text-green-400">
                <a.icon className="size-5" strokeWidth={2} />
              </div>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {a.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Inventario
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {gruposLista.map((g) => {
            const cantidad =
              g.tipo_manejo === "individual"
                ? conteoPorGrupoIndividual.get(g.id) ?? 0
                : inventarioLotePorGrupo.get(g.id) ?? 0;
            return (
              <div
                key={g.id}
                className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {g.nombre}
                </p>
                {g.activo ? (
                  <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                    {cantidad}
                  </p>
                ) : (
                  <span className="mt-1 inline-flex items-center rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    Próximamente
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Últimos 7 días
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi label="Leche hoy" valor={`${formatNumero(litrosHoy)} L`} />
          <Kpi label="Leche 7 días" valor={`${formatNumero(litrosSemana)} L`} />
          <Kpi label="Alimento hoy" valor={`${formatNumero(kgHoy)} kg`} />
          <Kpi label="Muertes 7 días" valor={String(muertesRecientes)} />
        </div>
      </div>

      {gruposReproductivos.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Estado reproductivo del hato
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {gruposReproductivos.map((g) => {
              const estados = estadosPorGrupo.get(g.id)!;
              return (
                <div
                  key={g.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {g.nombre}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(Object.keys(ESTADO_REPRODUCTIVO_LABELS) as EstadoReproductivo[]).map(
                      (estado) => (
                        <span
                          key={estado}
                          className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        >
                          {ESTADO_REPRODUCTIVO_LABELS[estado]}
                          <span className="rounded-full bg-white px-1.5 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
                            {estados[estado]}
                          </span>
                        </span>
                      ),
                    )}
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
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{valor}</p>
    </div>
  );
}
