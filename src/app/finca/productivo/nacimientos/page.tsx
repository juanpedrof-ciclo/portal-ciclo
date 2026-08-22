import { createClient } from "@/lib/supabase/server";
import { NacimientoForm } from "./nacimiento-form";
import { anularNacimiento, anularNacimientosLote, crearNacimiento } from "./actions";
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
import type { NacimientoIndividual, NacimientoLote } from "@/lib/productivo/types";

export const metadata = { title: "Nacimientos · Módulo Productivo" };

const RUTA = "/finca/productivo/nacimientos";
const COLUMNAS_ORDEN = ["fecha", "cantidad"] as const;

type Fila = {
  id: string;
  fecha: string;
  created_at: string;
  grupoNombre: string;
  detalle: string;
  cantidad: number;
  notas: string | null;
};

export default async function NacimientosPage({
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
      supabase
        .from("nacimientos_individuales")
        .select("*")
        .eq("anulado", false)
        .returns<NacimientoIndividual[]>(),
      supabase
        .from("nacimientos_lote")
        .select("*")
        .eq("anulado", false)
        .returns<NacimientoLote[]>(),
    ]);

  const gruposPorId = agruparPorId(grupos);

  const filas: Fila[] = [
    ...(individuales ?? []).map((n): Fila => {
      const madre = mapaAnimales[n.madre_id];
      const grupoNombre = madre ? gruposPorId[madre.grupo_id]?.nombre ?? madre.grupo_id : "—";
      const criaTexto = n.cria_chapeta ? ` · cría con chapeta ${n.cria_chapeta}` : "";
      return {
        id: n.id,
        fecha: n.fecha,
        created_at: n.created_at,
        grupoNombre,
        detalle: `Madre ${madre?.chapeta ?? "?"} — ${n.crias_vivas} viva(s) / ${n.crias_muertas} muerta(s)${criaTexto}`,
        cantidad: n.num_crias,
        notas: n.notas,
      };
    }),
    ...(lote ?? []).map((n): Fila => ({
      id: n.id,
      fecha: n.fecha,
      created_at: n.created_at,
      grupoNombre: gruposPorId[n.grupo_id]?.nombre ?? n.grupo_id,
      detalle: `${n.cantidad} nacido(s)`,
      cantidad: n.cantidad,
      notas: n.notas,
    })),
  ];

  const filtradas = q
    ? filas.filter((f) => {
        const texto = `${f.grupoNombre} ${f.detalle} ${f.notas ?? ""}`.toLowerCase();
        return texto.includes(q.toLowerCase());
      })
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
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Nacimientos
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Suman al inventario del grupo o del animal individual.
        </p>
      </div>

      <NacimientoForm grupos={grupos} animales={animalesActivos} action={crearNacimiento} />

      <ListaBuscador
        basePath={RUTA}
        params={paramsBase}
        valorInicial={q}
        placeholder="Buscar por grupo, chapeta o notas…"
      />

      <SeleccionProvider idsVisibles={idsVisibles}>
        <AnularSeleccionadosBar idsVisibles={idsVisibles} action={anularNacimientosLote} />

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
                  <th className="px-4 py-3 font-medium">Notas</th>
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {pagina.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                      {q ? "No se encontraron nacimientos para esa búsqueda." : "Aún no hay nacimientos registrados."}
                    </td>
                  </tr>
                ) : (
                  pagina.map((f) => (
                    <tr key={f.id}>
                      <td className="px-4 py-3">
                        <CheckboxFila id={f.id} />
                      </td>
                      <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                        {formatFechaCorta(f.fecha)}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{f.grupoNombre}</td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{f.detalle}</td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{f.notas ?? "—"}</td>
                      <td className="px-4 py-3">
                        <AnularForm
                          id={f.id}
                          action={anularNacimiento}
                          mensaje="¿Seguro que deseas anular este nacimiento? Esta acción lo excluye del inventario."
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
