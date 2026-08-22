import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { AnularForm } from "@/components/anular-form";
import { createClient } from "@/lib/supabase/server";
import { InventarioInicialForm } from "./inventario-inicial-form";
import { crearInventarioInicial } from "./actions";
import { obtenerGrupos } from "@/lib/productivo/consultas";
import { formatFechaCorta } from "@/lib/financiero/types";
import {
  CAUSA_MUERTE_LABELS,
  DESTINO_SALIDA_LABELS,
  TIPO_ALIMENTO_LABELS,
  type AlimentacionRegistro,
  type GrupoAnimalId,
  type MuerteLote,
  type NacimientoLote,
  type SalidaLote,
  type VistaInventarioLote,
} from "@/lib/productivo/types";
import { anularAlimentacion } from "../../alimentacion/actions";
import { anularNacimiento } from "../../nacimientos/actions";
import { anularMuerte } from "../../muertes/actions";
import { anularSalida } from "../../salidas/actions";

export const metadata = { title: "Lote · Módulo Productivo" };

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

export default async function LoteDetallePage({
  params,
}: {
  params: Promise<{ grupoId: string }>;
}) {
  const { grupoId: grupoIdCrudo } = await params;
  const grupoId = grupoIdCrudo as GrupoAnimalId;

  const supabase = await createClient();
  const grupos = await obtenerGrupos(supabase);
  const grupo = grupos.find((g) => g.id === grupoId);
  if (!grupo || grupo.tipo_manejo !== "lote") notFound();

  const [
    { data: inventarioRows },
    { data: alimentacion },
    { data: nacimientos },
    { data: muertes },
    { data: salidas },
  ] = await Promise.all([
    supabase.from("vista_inventario_lote").select("*").eq("grupo_id", grupoId).returns<VistaInventarioLote[]>(),
    supabase.from("alimentacion_registros").select("*").eq("grupo_id", grupoId).eq("anulado", false).returns<AlimentacionRegistro[]>(),
    supabase.from("nacimientos_lote").select("*").eq("grupo_id", grupoId).eq("anulado", false).returns<NacimientoLote[]>(),
    supabase.from("muertes_lote").select("*").eq("grupo_id", grupoId).eq("anulado", false).returns<MuerteLote[]>(),
    supabase.from("salidas_lote").select("*").eq("grupo_id", grupoId).eq("anulado", false).returns<SalidaLote[]>(),
  ]);
  const inventario = inventarioRows?.[0];

  const eventos: Evento[] = [
    ...(alimentacion ?? []).map((r): Evento => ({
      id: r.id,
      fecha: r.fecha,
      created_at: r.created_at,
      tipo: "Alimentación",
      detalle: `${r.kg_alimento} kg (${TIPO_ALIMENTO_LABELS[r.tipo_alimento]})`,
      notas: r.notas,
      anular: anularAlimentacion,
      mensaje: "¿Anular este registro de alimentación?",
    })),
    ...(nacimientos ?? []).map((n): Evento => ({
      id: n.id,
      fecha: n.fecha,
      created_at: n.created_at,
      tipo: "Nacimiento",
      detalle: `${n.cantidad} nacido(s)`,
      notas: n.notas,
      anular: anularNacimiento,
      mensaje: "¿Anular este nacimiento?",
    })),
    ...(muertes ?? []).map((m): Evento => ({
      id: m.id,
      fecha: m.fecha,
      created_at: m.created_at,
      tipo: "Muerte",
      detalle: `${m.cantidad} animal(es) · ${CAUSA_MUERTE_LABELS[m.causa]}`,
      notas: m.notas,
      anular: anularMuerte,
      mensaje: "¿Anular este registro de muerte?",
    })),
    ...(salidas ?? []).map((s): Evento => ({
      id: s.id,
      fecha: s.fecha,
      created_at: s.created_at,
      tipo: "Salida",
      detalle: `${s.cantidad} animal(es) · ${DESTINO_SALIDA_LABELS[s.destino]}${s.comprador ? ` · ${s.comprador}` : ""}`,
      notas: s.notas,
      anular: anularSalida,
      mensaje: "¿Anular esta salida?",
    })),
  ].sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : b.created_at.localeCompare(a.created_at)));

  return (
    <div className="flex flex-col gap-6">
      <BackLink href="/finca/productivo/lotes" label="Lotes" />

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{grupo.nombre}</h2>
        <p className="mt-1 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          {inventario?.cantidad_actual ?? 0}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">animales en inventario</p>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Base</dt>
            <dd className="text-zinc-800 dark:text-zinc-200">
              {inventario?.fecha_inicial ? formatFechaCorta(inventario.fecha_inicial) : "Sin definir"} ·{" "}
              {inventario?.cantidad_inicial ?? 0}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Nacidos</dt>
            <dd className="text-zinc-800 dark:text-zinc-200">+{inventario?.nacidos ?? 0}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Muertos</dt>
            <dd className="text-zinc-800 dark:text-zinc-200">-{inventario?.muertos ?? 0}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Vendidos</dt>
            <dd className="text-zinc-800 dark:text-zinc-200">-{inventario?.vendidos ?? 0}</dd>
          </div>
        </dl>
      </div>

      <InventarioInicialForm action={crearInventarioInicial.bind(null, grupoId)} />

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
