import { createClient } from "@/lib/supabase/server";
import { SalidaForm } from "./salida-form";
import { anularSalida, anularSalidasLote, crearSalida } from "./actions";
import { AnularForm } from "@/components/anular-form";
import { SeleccionProvider } from "@/components/seleccion-provider";
import { CheckboxFila, CheckboxTodo } from "@/components/checkbox-seleccion";
import { AnularSeleccionadosBar } from "@/components/anular-seleccionados-bar";
import { ListaBuscador } from "@/components/lista-buscador";
import { ListaPaginacion } from "@/components/lista-paginacion";
import { normalizarListaParams } from "@/lib/financiero/list-query";
import { formatFechaCorta } from "@/lib/financiero/types";
import { paginarEnMemoria } from "@/lib/productivo/combinar";
import {
  agruparPorId,
  obtenerAnimalesActivos,
  obtenerGrupos,
  obtenerMapaAnimales,
} from "@/lib/productivo/consultas";
import { DESTINO_SALIDA_LABELS, type SalidaIndividual, type SalidaLote } from "@/lib/productivo/types";

export const metadata = { title: "Salidas · Módulo Productivo" };

const RUTA = "/finca/productivo/salidas";
const COLUMNAS_ORDEN = ["fecha", "cantidad"] as const;

type Fila = {
  id: string;
  fecha: string;
  created_at: string;
  grupoNombre: string;
  detalle: string;
  cantidad: number;
  destino: string;
  comprador: string | null;
  notas: string | null;
};

export default async function SalidasPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; sort?: string; dir?: string }>;
}) {
  const { page, sort, dir, q, paramsBase } = normalizarListaParams(await searchParams, {
    columnas: COLUMNAS_ORDEN,
    ordenPorDefecto: "fecha",
  });

  const supabase = await createClient();
  const [grupos, animalesActivos, mapaAnimales, { data: individuales }, { data: lote }] =
    await Promise.all([
      obtenerGrupos(supabase, { soloActivos: true }),
      obtenerAnimalesActivos(supabase),
      obtenerMapaAnimales(supabase),
      supabase.from("salidas_individuales").select("*").eq("anulado", false).returns<SalidaIndividual[]>(),
      supabase.from("salidas_lote").select("*").eq("anulado", false).returns<SalidaLote[]>(),
    ]);

  const gruposPorId = agruparPorId(grupos);

  const filas: Fila[] = [
    ...(individuales ?? []).map((s): Fila => {
      const animal = mapaAnimales[s.animal_id];
      const grupoNombre = animal ? gruposPorId[animal.grupo_id]?.nombre ?? animal.grupo_id : "—";
      return {
        id: s.id,
        fecha: s.fecha,
        created_at: s.created_at,
        grupoNombre,
        detalle: `Chapeta ${animal?.chapeta ?? "?"}`,
        cantidad: 1,
        destino: DESTINO_SALIDA_LABELS[s.destino],
        comprador: s.comprador,
        notas: s.notas,
      };
    }),
    ...(lote ?? []).map((s): Fila => ({
      id: s.id,
      fecha: s.fecha,
      created_at: s.created_at,
      grupoNombre: gruposPorId[s.grupo_id]?.nombre ?? s.grupo_id,
      detalle: `${s.cantidad} animal(es)`,
      cantidad: s.cantidad,
      destino: DESTINO_SALIDA_LABELS[s.destino],
      comprador: s.comprador,
      notas: s.notas,
    })),
  ];

  const filtradas = q
    ? filas.filter((f) =>
        `${f.grupoNombre} ${f.detalle} ${f.comprador ?? ""} ${f.notas ?? ""}`
          .toLowerCase()
          .includes(q.toLowerCase()),
      )
    : filas;

  filtradas.sort((a, b) => {
    const va = sort === "cantidad" ? a.cantidad : a.fecha;
    const vb = sort === "cantidad" ? b.cantidad : b.fecha;
    const cmp = va < vb ? -1 : va > vb ? 1 : a.created_at.localeCompare(b.created_at);
    return dir === "asc" ? cmp : -cmp;
  });

  const { pagina, total } = paginarEnMemoria(filtradas, page);
  const idsVisibles = pagina.map((f) => f.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Salidas</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Ventas u otras salidas de animales. El dinero se registra en el módulo financiero.
        </p>
      </div>

      <SalidaForm grupos={grupos} animales={animalesActivos} action={crearSalida} />

      <ListaBuscador
        basePath={RUTA}
        params={paramsBase}
        valorInicial={q}
        placeholder="Buscar por grupo, chapeta, comprador o notas…"
      />

      <SeleccionProvider idsVisibles={idsVisibles}>
        <AnularSeleccionadosBar idsVisibles={idsVisibles} action={anularSalidasLote} />

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <CheckboxTodo ids={idsVisibles} />
                  </th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Grupo</th>
                  <th className="px-4 py-3 font-medium">Detalle</th>
                  <th className="px-4 py-3 font-medium">Destino</th>
                  <th className="px-4 py-3 font-medium">Comprador</th>
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {pagina.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                      {q ? "No se encontraron salidas para esa búsqueda." : "Aún no hay salidas registradas."}
                    </td>
                  </tr>
                ) : (
                  pagina.map((f) => (
                    <tr key={f.id}>
                      <td className="px-4 py-3">
                        <CheckboxFila id={f.id} />
                      </td>
                      <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{formatFechaCorta(f.fecha)}</td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{f.grupoNombre}</td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{f.detalle}</td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{f.destino}</td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{f.comprador ?? "—"}</td>
                      <td className="px-4 py-3">
                        <AnularForm
                          id={f.id}
                          action={anularSalida}
                          mensaje="¿Seguro que deseas anular esta salida?"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <ListaPaginacion basePath={RUTA} params={paramsBase} page={page} total={total} />
        </div>
      </SeleccionProvider>
    </div>
  );
}
