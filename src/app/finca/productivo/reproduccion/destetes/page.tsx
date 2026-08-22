import { createClient } from "@/lib/supabase/server";
import { DesteteForm } from "./destete-form";
import { anularDestete, anularDestetesLote, crearDestete } from "./actions";
import { AnularForm } from "@/components/anular-form";
import { SeleccionProvider } from "@/components/seleccion-provider";
import { CheckboxFila, CheckboxTodo } from "@/components/checkbox-seleccion";
import { AnularSeleccionadosBar } from "@/components/anular-seleccionados-bar";
import { ListaBuscador } from "@/components/lista-buscador";
import { ListaPaginacion } from "@/components/lista-paginacion";
import { ThOrdenable } from "@/components/lista-th-ordenable";
import { normalizarListaParams, patronIlike } from "@/lib/financiero/list-query";
import { formatFechaCorta } from "@/lib/financiero/types";
import { obtenerAnimalesActivos, obtenerMapaAnimales } from "@/lib/productivo/consultas";
import type { Destete } from "@/lib/productivo/types";

export const metadata = { title: "Destetes · Módulo Productivo" };

const RUTA = "/finca/productivo/reproduccion/destetes";
const COLUMNAS_ORDEN = ["fecha"] as const;

export default async function DestetesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; sort?: string; dir?: string }>;
}) {
  const { page, sort, dir, q, desde, hasta, paramsBase } = normalizarListaParams(
    await searchParams,
    { columnas: COLUMNAS_ORDEN, ordenPorDefecto: "fecha" },
  );

  const supabase = await createClient();
  const [animales, mapaAnimales] = await Promise.all([
    obtenerAnimalesActivos(supabase),
    obtenerMapaAnimales(supabase),
  ]);

  let query = supabase.from("destetes").select("*", { count: "exact" }).eq("anulado", false);
  if (q) query = query.ilike("notas", patronIlike(q));
  const { data: registros, count } = await query
    .order(sort, { ascending: dir === "asc" })
    .range(desde, hasta)
    .returns<Destete[]>();

  const idsVisibles = (registros ?? []).map((r) => r.id);

  return (
    <div className="flex flex-col gap-6">
      <DesteteForm animales={animales} action={crearDestete} />

      <ListaBuscador basePath={RUTA} params={paramsBase} valorInicial={q} placeholder="Buscar por notas…" />

      <SeleccionProvider idsVisibles={idsVisibles}>
        <AnularSeleccionadosBar idsVisibles={idsVisibles} action={anularDestetesLote} />

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <CheckboxTodo ids={idsVisibles} />
                  </th>
                  <ThOrdenable basePath={RUTA} params={paramsBase} campo="fecha" label="Fecha" sortActual={sort} dirActual={dir} />
                  <th className="px-4 py-3 font-medium">Chapeta</th>
                  <th className="px-4 py-3 font-medium">Notas</th>
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {!registros || registros.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                      {q ? "No se encontraron destetes para esa búsqueda." : "Aún no hay destetes registrados."}
                    </td>
                  </tr>
                ) : (
                  registros.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-3">
                        <CheckboxFila id={r.id} />
                      </td>
                      <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{formatFechaCorta(r.fecha)}</td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                        {mapaAnimales[r.animal_id]?.chapeta ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{r.notas ?? "—"}</td>
                      <td className="px-4 py-3">
                        <AnularForm
                          id={r.id}
                          action={anularDestete}
                          mensaje="¿Seguro que deseas anular este destete?"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <ListaPaginacion basePath={RUTA} params={paramsBase} page={page} total={count ?? 0} />
        </div>
      </SeleccionProvider>
    </div>
  );
}
