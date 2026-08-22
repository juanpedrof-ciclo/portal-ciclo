import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NuevoAnimalForm } from "./nuevo-animal-form";
import { crearAnimal } from "./actions";
import { ListaBuscador } from "@/components/lista-buscador";
import { ListaPaginacion } from "@/components/lista-paginacion";
import { ThOrdenable } from "@/components/lista-th-ordenable";
import { normalizarListaParams, patronIlike } from "@/lib/financiero/list-query";
import { formatFechaCorta } from "@/lib/financiero/types";
import { agruparPorId, obtenerAnimalesActivos, obtenerGrupos } from "@/lib/productivo/consultas";
import {
  ESTADO_ANIMAL_LABELS,
  ESTADO_REPRODUCTIVO_LABELS,
  type AnimalEstado,
} from "@/lib/productivo/types";

export const metadata = { title: "Animales · Módulo Productivo" };

const RUTA = "/finca/productivo/animales";
const COLUMNAS_ORDEN = ["chapeta", "grupo_id", "estado", "fecha_ingreso"] as const;

const ESTADO_BADGE: Record<string, string> = {
  activo: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  muerto: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  vendido: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

export default async function AnimalesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; sort?: string; dir?: string }>;
}) {
  const { page, sort, dir, q, desde, hasta, paramsBase } = normalizarListaParams(
    await searchParams,
    { columnas: COLUMNAS_ORDEN, ordenPorDefecto: "chapeta", dirPorDefecto: "asc" },
  );

  const supabase = await createClient();
  const grupos = await obtenerGrupos(supabase, { soloActivos: true });
  const gruposIndividuales = grupos.filter((g) => g.tipo_manejo === "individual");
  const gruposPorId = agruparPorId(grupos);
  const animalesParaMadre = await obtenerAnimalesActivos(supabase);

  let query = supabase.from("vista_animales_estado").select("*", { count: "exact" });
  if (q) query = query.ilike("chapeta", patronIlike(q));
  const { data: animales, count } = await query
    .order(sort, { ascending: dir === "asc" })
    .range(desde, hasta)
    .returns<AnimalEstado[]>();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Animales</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Búfalas de leche y cerdas de cría, con chapeta individual.
        </p>
      </div>

      <NuevoAnimalForm grupos={gruposIndividuales} animales={animalesParaMadre} action={crearAnimal} />

      <ListaBuscador basePath={RUTA} params={paramsBase} valorInicial={q} placeholder="Buscar por chapeta…" />

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <tr>
                <ThOrdenable basePath={RUTA} params={paramsBase} campo="chapeta" label="Chapeta" sortActual={sort} dirActual={dir} />
                <ThOrdenable basePath={RUTA} params={paramsBase} campo="grupo_id" label="Grupo" sortActual={sort} dirActual={dir} />
                <ThOrdenable basePath={RUTA} params={paramsBase} campo="estado" label="Estado" sortActual={sort} dirActual={dir} />
                <th className="px-4 py-3 font-medium">Estado reproductivo</th>
                <ThOrdenable basePath={RUTA} params={paramsBase} campo="fecha_ingreso" label="Ingreso" sortActual={sort} dirActual={dir} />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {!animales || animales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                    {q ? "No se encontraron animales para esa búsqueda." : "Aún no hay animales registrados."}
                  </td>
                </tr>
              ) : (
                animales.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3">
                      <Link
                        href={`${RUTA}/${a.id}`}
                        className="font-medium text-amber-700 hover:underline dark:text-amber-400"
                      >
                        {a.chapeta}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                      {gruposPorId[a.grupo_id]?.nombre ?? a.grupo_id}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_BADGE[a.estado]}`}>
                        {ESTADO_ANIMAL_LABELS[a.estado]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                      {a.estado_reproductivo ? ESTADO_REPRODUCTIVO_LABELS[a.estado_reproductivo] : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                      {formatFechaCorta(a.fecha_ingreso)}
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
