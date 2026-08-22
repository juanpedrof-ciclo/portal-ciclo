import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { AnularForm } from "@/components/anular-form";
import { createClient } from "@/lib/supabase/server";
import { agruparPorId, obtenerAnimalPorId, obtenerGrupos, obtenerMapaAnimales } from "@/lib/productivo/consultas";
import {
  CAUSA_MUERTE_LABELS,
  DESTINO_SALIDA_LABELS,
  ESTADO_ANIMAL_LABELS,
  ESTADO_REPRODUCTIVO_LABELS,
  RESULTADO_PRENEZ_LABELS,
  TIPO_SERVICIO_LABELS,
  TURNO_LABELS,
  type ConfirmacionPrenez,
  type Destete,
  type LecheRegistro,
  type MuerteIndividual,
  type NacimientoIndividual,
  type Reproductor,
  type SalidaIndividual,
  type ServicioReproductivo,
} from "@/lib/productivo/types";
import { formatFechaCorta } from "@/lib/financiero/types";
import { anularLeche } from "../../leche/actions";
import { anularNacimiento } from "../../nacimientos/actions";
import { anularMuerte } from "../../muertes/actions";
import { anularSalida } from "../../salidas/actions";
import { anularServicio } from "../../reproduccion/servicios/actions";
import { anularConfirmacion } from "../../reproduccion/confirmacion-prenez/actions";
import { anularDestete } from "../../reproduccion/destetes/actions";

export const metadata = { title: "Animal · Módulo Productivo" };

type Evento = {
  id: string;
  fecha: string;
  created_at: string;
  tipo: string;
  detalle: string;
  notas: string | null;
  anular: (id: string) => Promise<{ error: string | null }>;
  mensaje: string;
};

export default async function AnimalDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [animal, grupos, mapaAnimales] = await Promise.all([
    obtenerAnimalPorId(supabase, id),
    obtenerGrupos(supabase),
    obtenerMapaAnimales(supabase),
  ]);
  if (!animal) notFound();

  const gruposPorId = agruparPorId(grupos);
  const grupo = gruposPorId[animal.grupo_id];

  const [
    { data: leche },
    { data: nacimientos },
    { data: muertes },
    { data: salidas },
    { data: servicios },
    { data: confirmaciones },
    { data: destetes },
    { data: reproductores },
  ] = await Promise.all([
    supabase.from("leche_registros").select("*").eq("animal_id", id).eq("anulado", false).returns<LecheRegistro[]>(),
    supabase.from("nacimientos_individuales").select("*").eq("madre_id", id).eq("anulado", false).returns<NacimientoIndividual[]>(),
    supabase.from("muertes_individuales").select("*").eq("animal_id", id).eq("anulado", false).returns<MuerteIndividual[]>(),
    supabase.from("salidas_individuales").select("*").eq("animal_id", id).eq("anulado", false).returns<SalidaIndividual[]>(),
    supabase.from("servicios_reproductivos").select("*").eq("animal_id", id).eq("anulado", false).returns<ServicioReproductivo[]>(),
    supabase.from("confirmaciones_prenez").select("*").eq("animal_id", id).eq("anulado", false).returns<ConfirmacionPrenez[]>(),
    supabase.from("destetes").select("*").eq("animal_id", id).eq("anulado", false).returns<Destete[]>(),
    supabase.from("reproductores").select("*").returns<Reproductor[]>(),
  ]);
  const reproductoresPorId = Object.fromEntries((reproductores ?? []).map((r) => [r.id, r.nombre]));

  const eventos: Evento[] = [
    ...(leche ?? []).map((r): Evento => ({
      id: r.id,
      fecha: r.fecha,
      created_at: r.created_at,
      tipo: "Leche",
      detalle: `${r.litros} L (${TURNO_LABELS[r.turno]})`,
      notas: r.notas,
      anular: anularLeche,
      mensaje: "¿Anular este registro de leche?",
    })),
    ...(nacimientos ?? []).map((n): Evento => ({
      id: n.id,
      fecha: n.fecha,
      created_at: n.created_at,
      tipo: "Nacimiento",
      detalle: `${n.crias_vivas} viva(s) / ${n.crias_muertas} muerta(s)${n.cria_chapeta ? ` · cría ${n.cria_chapeta}` : ""}`,
      notas: n.notas,
      anular: anularNacimiento,
      mensaje: "¿Anular este nacimiento?",
    })),
    ...(muertes ?? []).map((m): Evento => ({
      id: m.id,
      fecha: m.fecha,
      created_at: m.created_at,
      tipo: "Muerte",
      detalle: CAUSA_MUERTE_LABELS[m.causa],
      notas: m.notas,
      anular: anularMuerte,
      mensaje: "¿Anular este registro de muerte?",
    })),
    ...(salidas ?? []).map((s): Evento => ({
      id: s.id,
      fecha: s.fecha,
      created_at: s.created_at,
      tipo: "Salida",
      detalle: `${DESTINO_SALIDA_LABELS[s.destino]}${s.comprador ? ` · ${s.comprador}` : ""}`,
      notas: s.notas,
      anular: anularSalida,
      mensaje: "¿Anular esta salida?",
    })),
    ...(servicios ?? []).map((s): Evento => ({
      id: s.id,
      fecha: s.fecha,
      created_at: s.created_at,
      tipo: "Servicio",
      detalle: `${TIPO_SERVICIO_LABELS[s.tipo]}${s.reproductor_id ? ` · ${reproductoresPorId[s.reproductor_id] ?? ""}` : ""}`,
      notas: s.notas,
      anular: anularServicio,
      mensaje: "¿Anular este servicio?",
    })),
    ...(confirmaciones ?? []).map((c): Evento => ({
      id: c.id,
      fecha: c.fecha,
      created_at: c.created_at,
      tipo: "Confirmación de preñez",
      detalle: RESULTADO_PRENEZ_LABELS[c.resultado],
      notas: c.notas,
      anular: anularConfirmacion,
      mensaje: "¿Anular esta confirmación?",
    })),
    ...(destetes ?? []).map((d): Evento => ({
      id: d.id,
      fecha: d.fecha,
      created_at: d.created_at,
      tipo: "Destete",
      detalle: "—",
      notas: d.notas,
      anular: anularDestete,
      mensaje: "¿Anular este destete?",
    })),
  ].sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : b.created_at.localeCompare(a.created_at)));

  const madre = animal.madre_id ? mapaAnimales[animal.madre_id] : null;

  return (
    <div className="flex flex-col gap-6">
      <BackLink href="/finca/productivo/animales" label="Animales" />

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Chapeta {animal.chapeta}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{grupo?.nombre ?? animal.grupo_id}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {ESTADO_ANIMAL_LABELS[animal.estado]}
            </span>
            {animal.estado_reproductivo && (
              <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {ESTADO_REPRODUCTIVO_LABELS[animal.estado_reproductivo]}
              </span>
            )}
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Nacimiento</dt>
            <dd className="text-zinc-800 dark:text-zinc-200">
              {animal.fecha_nacimiento ? formatFechaCorta(animal.fecha_nacimiento) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Ingreso</dt>
            <dd className="text-zinc-800 dark:text-zinc-200">{formatFechaCorta(animal.fecha_ingreso)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Madre</dt>
            <dd className="text-zinc-800 dark:text-zinc-200">{madre?.chapeta ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Notas</dt>
            <dd className="text-zinc-800 dark:text-zinc-200">{animal.notas ?? "—"}</dd>
          </div>
        </dl>
      </div>

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Historial
        </h3>
        <div className="mt-3 flex flex-col divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white shadow-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {eventos.length === 0 ? (
            <p className="px-5 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Sin eventos registrados todavía.
            </p>
          ) : (
            eventos.map((e) => (
              <div key={`${e.tipo}-${e.id}`} className="flex items-start justify-between gap-3 px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {e.tipo} · {formatFechaCorta(e.fecha)}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">{e.detalle}</p>
                  {e.notas && <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{e.notas}</p>}
                </div>
                <AnularForm id={e.id} action={e.anular} mensaje={e.mensaje} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
