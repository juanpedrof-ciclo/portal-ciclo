import { createClient } from "@/lib/supabase/server";
import { EntradaForm } from "./entrada-form";
import { anularEntrada, anularEntradasLote, crearEntrada } from "./actions";
import { AnularForm } from "@/components/anular-form";
import { SeleccionProvider } from "@/components/seleccion-provider";
import { CheckboxFila, CheckboxTodo } from "@/components/checkbox-seleccion";
import { AnularSeleccionadosBar } from "@/components/anular-seleccionados-bar";
import { ListaBuscador } from "@/components/lista-buscador";
import { ListaPaginacion } from "@/components/lista-paginacion";
import { ThOrdenable } from "@/components/lista-th-ordenable";
import { normalizarListaParams, patronIlike } from "@/lib/financiero/list-query";
import { formatFechaCorta } from "@/lib/financiero/types";
import { obtenerInsumos } from "@/lib/productivo/consultas";
import { UNIDAD_MEDIDA_LABELS, formatNumero, type InsumoEntrada } from "@/lib/productivo/types";

export const metadata = { title: "Entradas de insumos · Módulo Productivo" };

const RUTA = "/finca/productivo/insumos/entradas";
const COLUMNAS_ORDEN = ["fecha", "cantidad"] as const;

type EntradaConInsumo = InsumoEntrada & { insumos: { nombre: string; unidad_medida: string } | null };

export default async function EntradasInsumosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; sort?: string; dir?: string }>;
}) {
  const { page, sort, dir, q, desde, hasta, paramsBase } = normalizarListaParams(
    await searchParams,
    { columnas: COLUMNAS_ORDEN, ordenPorDefecto: "fecha" },
  );

  const supabase = await createClient();
  const insumos = await obtenerInsumos(supabase);

  let query = supabase
    .from("insumo_entradas")
    .select("*, insumos(nombre, unidad_medida)", { count: "exact" })
    .eq("anulado", false);
  if (q) {
    const patron = patronIlike(q);
    query = query.or(`proveedor.ilike.${patron},notas.ilike.${patron}`);
  }
  const { data: entradas, count } = await query
    .order(sort, { ascending: dir === "asc" })
    .range(desde, hasta)
    .returns<EntradaConInsumo[]>();

  const idsVisibles = (entradas ?? []).map((e) => e.id);

  return (
    <div className="flex flex-col gap-6">
      <EntradaForm insumos={insumos} action={crearEntrada} />

      <ListaBuscador basePath={RUTA} params={paramsBase} valorInicial={q} placeholder="Buscar por proveedor o notas…" />

      <SeleccionProvider idsVisibles={idsVisibles}>
        <AnularSeleccionadosBar idsVisibles={idsVisibles} action={anularEntradasLote} />

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <CheckboxTodo ids={idsVisibles} />
                  </th>
                  <ThOrdenable basePath={RUTA} params={paramsBase} campo="fecha" label="Fecha" sortActual={sort} dirActual={dir} />
                  <th className="px-4 py-3 font-medium">Insumo</th>
                  <ThOrdenable basePath={RUTA} params={paramsBase} campo="cantidad" label="Cantidad" sortActual={sort} dirActual={dir} align="right" />
                  <th className="px-4 py-3 font-medium">Proveedor</th>
                  <th className="px-4 py-3 font-medium">Costo</th>
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {!entradas || entradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                      {q ? "No se encontraron entradas para esa búsqueda." : "Aún no hay entradas registradas."}
                    </td>
                  </tr>
                ) : (
                  entradas.map((e) => (
                    <tr key={e.id}>
                      <td className="px-4 py-3">
                        <CheckboxFila id={e.id} />
                      </td>
                      <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{formatFechaCorta(e.fecha)}</td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{e.insumos?.nombre ?? "—"}</td>
                      <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-zinc-100">
                        {formatNumero(e.cantidad, 2)}{" "}
                        {e.insumos ? UNIDAD_MEDIDA_LABELS[e.insumos.unidad_medida as keyof typeof UNIDAD_MEDIDA_LABELS] : ""}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{e.proveedor ?? "—"}</td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                        {e.costo != null ? formatNumero(e.costo, 2) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <AnularForm id={e.id} action={anularEntrada} mensaje="¿Seguro que deseas anular esta entrada?" />
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
