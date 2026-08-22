import { createClient } from "@/lib/supabase/server";
import { MuerteForm } from "./muerte-form";
import { anularMuerte, anularMuertesLote, crearMuerte } from "./actions";
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
import { CAUSA_MUERTE_LABELS, type MuerteIndividual, type MuerteLote } from "@/lib/productivo/types";

export const metadata = { title: "Muertes · Módulo Productivo" };

const RUTA = "/finca/productivo/muertes";
const COLUMNAS_ORDEN = ["fecha", "cantidad"] as const;

type Fila = {
  id: string;
  fecha: string;
  created_at: string;
  grupoNombre: string;
  detalle: string;
  cantidad: number;
  causa: string;
  notas: string | null;
};

export default async function MuertesPage({
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
      supabase.from("muertes_individuales").select("*").eq("anulado", false).returns<MuerteIndividual[]>(),
      supabase.from("muertes_lote").select("*").eq("anulado", false).returns<MuerteLote[]>(),
    ]);

  const gruposPorId = agruparPorId(grupos);

  const filas: Fila[] = [
    ...(individuales ?? []).map((m): Fila => {
      const animal = mapaAnimales[m.animal_id];
      const grupoNombre = animal ? gruposPorId[animal.grupo_id]?.nombre ?? animal.grupo_id : "—";
      return {
        id: m.id,
        fecha: m.fecha,
        created_at: m.created_at,
        grupoNombre,
        detalle: `Chapeta ${animal?.chapeta ?? "?"}`,
        cantidad: 1,
        causa: CAUSA_MUERTE_LABELS[m.causa],
        notas: m.notas,
      };
    }),
    ...(lote ?? []).map((m): Fila => ({
      id: m.id,
      fecha: m.fecha,
      created_at: m.created_at,
      grupoNombre: gruposPorId[m.grupo_id]?.nombre ?? m.grupo_id,
      detalle: `${m.cantidad} animal(es)`,
      cantidad: m.cantidad,
      causa: CAUSA_MUERTE_LABELS[m.causa],
      notas: m.notas,
    })),
  ];

  const filtradas = q
    ? filas.filter((f) => `${f.grupoNombre} ${f.detalle} ${f.notas ?? ""}`.toLowerCase().includes(q.toLowerCase()))
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
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Muertes</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Restan del inventario del grupo o marcan el animal como muerto.
        </p>
      </div>

      <MuerteForm grupos={grupos} animales={animalesActivos} action={crearMuerte} />

      <ListaBuscador
        basePath={RUTA}
        params={paramsBase}
        valorInicial={q}
        placeholder="Buscar por grupo, chapeta o notas…"
      />

      <SeleccionProvider idsVisibles={idsVisibles}>
        <AnularSeleccionadosBar idsVisibles={idsVisibles} action={anularMuertesLote} />

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
                  <th className="px-4 py-3 font-medium">Causa</th>
                  <th className="px-4 py-3 font-medium">Notas</th>
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {pagina.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                      {q ? "No se encontraron muertes para esa búsqueda." : "Aún no hay muertes registradas."}
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
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{f.causa}</td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{f.notas ?? "—"}</td>
                      <td className="px-4 py-3">
                        <AnularForm
                          id={f.id}
                          action={anularMuerte}
                          mensaje="¿Seguro que deseas anular este registro de muerte?"
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
