import { createClient } from "@/lib/supabase/server";
import { NuevoInsumoForm } from "./nuevo-insumo-form";
import { crearInsumo } from "./actions";
import { ListaBuscador } from "@/components/lista-buscador";
import { ListaPaginacion } from "@/components/lista-paginacion";
import { ThOrdenable } from "@/components/lista-th-ordenable";
import { normalizarListaParams, patronIlike } from "@/lib/financiero/list-query";
import { obtenerInsumoCategorias } from "@/lib/productivo/consultas";
import { UNIDAD_MEDIDA_LABELS, formatNumero, type VistaInventarioInsumo } from "@/lib/productivo/types";

export const metadata = { title: "Inventario de insumos · Módulo Productivo" };

const RUTA = "/finca/productivo/insumos/inventario";
const COLUMNAS_ORDEN = ["nombre", "categoria_nombre", "stock_actual"] as const;

export default async function InventarioInsumosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; sort?: string; dir?: string }>;
}) {
  const { page, sort, dir, q, desde, hasta, paramsBase } = normalizarListaParams(
    await searchParams,
    { columnas: COLUMNAS_ORDEN, ordenPorDefecto: "nombre", dirPorDefecto: "asc" },
  );

  const supabase = await createClient();
  const categorias = await obtenerInsumoCategorias(supabase);

  let query = supabase.from("vista_inventario_insumos").select("*", { count: "exact" });
  if (q) query = query.ilike("nombre", patronIlike(q));
  const { data: insumos, count } = await query
    .order(sort, { ascending: dir === "asc" })
    .range(desde, hasta)
    .returns<VistaInventarioInsumo[]>();

  return (
    <div className="flex flex-col gap-6">
      <NuevoInsumoForm categorias={categorias} action={crearInsumo} />

      <ListaBuscador basePath={RUTA} params={paramsBase} valorInicial={q} placeholder="Buscar por nombre…" />

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <tr>
                <ThOrdenable basePath={RUTA} params={paramsBase} campo="nombre" label="Insumo" sortActual={sort} dirActual={dir} />
                <ThOrdenable basePath={RUTA} params={paramsBase} campo="categoria_nombre" label="Categoría" sortActual={sort} dirActual={dir} />
                <ThOrdenable basePath={RUTA} params={paramsBase} campo="stock_actual" label="Stock actual" sortActual={sort} dirActual={dir} align="right" />
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {!insumos || insumos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                    {q ? "No se encontraron insumos para esa búsqueda." : "Aún no hay insumos registrados."}
                  </td>
                </tr>
              ) : (
                insumos.map((i) => (
                  <tr key={i.id}>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{i.nombre}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{i.categoria_nombre}</td>
                    <td className="px-4 py-3 text-right text-zinc-900 dark:text-zinc-100">
                      {formatNumero(i.stock_actual, 2)} {UNIDAD_MEDIDA_LABELS[i.unidad_medida]}
                    </td>
                    <td className="px-4 py-3">
                      {i.bajo_stock && (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-400">
                          Stock bajo
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <ListaPaginacion basePath={RUTA} params={paramsBase} page={page} total={count ?? 0} />
      </div>
    </div>
  );
}
