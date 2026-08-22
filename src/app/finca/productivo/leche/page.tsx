import { createClient } from "@/lib/supabase/server";
import { LecheForm } from "./leche-form";
import { anularLeche, anularLecheLote, crearLeche } from "./actions";
import { AnularForm } from "@/components/anular-form";
import { SeleccionProvider } from "@/components/seleccion-provider";
import { CheckboxFila, CheckboxTodo } from "@/components/checkbox-seleccion";
import { AnularSeleccionadosBar } from "@/components/anular-seleccionados-bar";
import { ListaBuscador } from "@/components/lista-buscador";
import { ListaPaginacion } from "@/components/lista-paginacion";
import { ThOrdenable } from "@/components/lista-th-ordenable";
import { normalizarListaParams, patronIlike } from "@/lib/financiero/list-query";
import { formatFechaCorta } from "@/lib/financiero/types";
import { obtenerAnimalesActivos } from "@/lib/productivo/consultas";
import { TURNO_LABELS, type LecheRegistro } from "@/lib/productivo/types";

export const metadata = { title: "Leche · Módulo Productivo" };

const RUTA = "/finca/productivo/leche";
const COLUMNAS_ORDEN = ["fecha", "turno", "litros"] as const;

type LecheConAnimal = LecheRegistro & { animales: { chapeta: string } | null };

export default async function LechePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; sort?: string; dir?: string }>;
}) {
  const { page, sort, dir, q, desde, hasta, paramsBase } = normalizarListaParams(
    await searchParams,
    { columnas: COLUMNAS_ORDEN, ordenPorDefecto: "fecha" },
  );

  const supabase = await createClient();
  const bufalas = await obtenerAnimalesActivos(supabase, "bufalas_leche");

  let query = supabase
    .from("leche_registros")
    .select("*, animales(chapeta)", { count: "exact" })
    .eq("anulado", false);
  if (q) query = query.ilike("notas", patronIlike(q));
  const { data: registros, count } = await query
    .order(sort, { ascending: dir === "asc" })
    .range(desde, hasta)
    .returns<LecheConAnimal[]>();

  const idsVisibles = (registros ?? []).map((r) => r.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Producción de leche
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Un registro por búfala y ordeño (mañana/tarde).
        </p>
      </div>

      <LecheForm bufalas={bufalas} action={crearLeche} />

      <ListaBuscador
        basePath={RUTA}
        params={paramsBase}
        valorInicial={q}
        placeholder="Buscar por notas…"
      />

      <SeleccionProvider idsVisibles={idsVisibles}>
        <AnularSeleccionadosBar idsVisibles={idsVisibles} action={anularLecheLote} />

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
                  <ThOrdenable basePath={RUTA} params={paramsBase} campo="turno" label="Turno" sortActual={sort} dirActual={dir} />
                  <ThOrdenable basePath={RUTA} params={paramsBase} campo="litros" label="Litros" sortActual={sort} dirActual={dir} align="right" />
                  <th className="px-4 py-3 font-medium">Notas</th>
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {!registros || registros.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                      {q ? "No se encontraron registros para esa búsqueda." : "Aún no hay producción de leche registrada."}
                    </td>
                  </tr>
                ) : (
                  registros.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-3">
                        <CheckboxFila id={r.id} />
                      </td>
                      <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                        {formatFechaCorta(r.fecha)}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                        {r.animales?.chapeta ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                        {TURNO_LABELS[r.turno]}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-zinc-100">
                        {r.litros}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                        {r.notas ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <AnularForm
                          id={r.id}
                          action={anularLeche}
                          mensaje="¿Seguro que deseas anular este registro de leche?"
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
