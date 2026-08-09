import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CargaForm } from "./carga-form";
import { anularPedido, anularPedidosLote } from "./actions";
import { AnularForm } from "@/components/anular-form";
import { SeleccionProvider } from "@/components/seleccion-provider";
import { CheckboxFila, CheckboxTodo } from "@/components/checkbox-seleccion";
import { AnularSeleccionadosBar } from "@/components/anular-seleccionados-bar";
import { ListaBuscador } from "@/components/lista-buscador";
import { ListaPaginacion } from "@/components/lista-paginacion";
import { ThOrdenable } from "@/components/lista-th-ordenable";
import { normalizarListaParams, patronIlike } from "@/lib/financiero/list-query";
import type { VistaPedidoSaldo } from "@/lib/financiero/types";
import { formatCOP, formatFechaCorta } from "@/lib/financiero/types";

export const metadata = { title: "Ventas · Módulo Financiero · Ciclo Market" };

const RUTA = "/market/financiero/ventas";
const COLUMNAS_ORDEN = [
  "fecha",
  "cliente_nombre",
  "plataforma",
  "monto_total",
  "saldo_pendiente",
] as const;

export default async function VentasPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; sort?: string; dir?: string }>;
}) {
  const { page, sort, dir, q, desde, hasta, paramsBase } = normalizarListaParams(
    await searchParams,
    { columnas: COLUMNAS_ORDEN, ordenPorDefecto: "fecha" },
  );

  const supabase = await createClient();
  let query = supabase.from("vista_pedidos_saldo").select("*", { count: "exact" });
  if (q) {
    const patron = patronIlike(q);
    query = query.or(`cliente_nombre.ilike.${patron},id_orden_externo.ilike.${patron}`);
  }
  const { data: pedidos, count } = await query
    .order(sort, { ascending: dir === "asc" })
    .range(desde, hasta)
    .returns<VistaPedidoSaldo[]>();

  const idsVisibles = (pedidos ?? []).map((p) => p.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Ventas</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Sube el archivo de ventas de cada plataforma; se agrupa por pedido y arma la
            cartera por cliente.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/market/financiero/ventas/formatos"
            className="whitespace-nowrap text-sm font-medium text-amber-700 hover:underline dark:text-amber-400"
          >
            Gestionar formatos
          </Link>
          <Link
            href="/market/financiero/clientes"
            className="whitespace-nowrap text-sm font-medium text-amber-700 hover:underline dark:text-amber-400"
          >
            Ver clientes
          </Link>
        </div>
      </div>

      <CargaForm />

      <ListaBuscador
        basePath={RUTA}
        params={paramsBase}
        valorInicial={q}
        placeholder="Buscar por cliente o nº de pedido…"
      />

      <SeleccionProvider idsVisibles={idsVisibles}>
        <AnularSeleccionadosBar idsVisibles={idsVisibles} action={anularPedidosLote} />

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <CheckboxTodo ids={idsVisibles} />
                  </th>
                  <ThOrdenable basePath={RUTA} params={paramsBase} campo="fecha" label="Fecha" sortActual={sort} dirActual={dir} />
                  <ThOrdenable basePath={RUTA} params={paramsBase} campo="cliente_nombre" label="Cliente" sortActual={sort} dirActual={dir} />
                  <ThOrdenable basePath={RUTA} params={paramsBase} campo="plataforma" label="Plataforma" sortActual={sort} dirActual={dir} />
                  <th className="px-4 py-3 font-medium">Pedido</th>
                  <ThOrdenable basePath={RUTA} params={paramsBase} campo="monto_total" label="Total" sortActual={sort} dirActual={dir} align="right" />
                  <ThOrdenable basePath={RUTA} params={paramsBase} campo="saldo_pendiente" label="Saldo" sortActual={sort} dirActual={dir} align="right" />
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {!pedidos || pedidos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                      {q ? "No se encontraron pedidos para esa búsqueda." : "Aún no hay pedidos cargados."}
                    </td>
                  </tr>
                ) : (
                pedidos.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3">
                      <CheckboxFila id={p.id} />
                    </td>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                      {formatFechaCorta(p.fecha)}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                      {p.cliente_nombre}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                      {p.plataforma}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                      {p.id_orden_externo}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-zinc-100">
                      {formatCOP(p.monto_total)}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-300">
                      {p.saldo_pendiente > 0 ? formatCOP(p.saldo_pendiente) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <AnularForm
                        id={p.id}
                        action={anularPedido}
                        mensaje="¿Seguro que deseas anular este pedido? Esta acción lo excluye de tus cálculos."
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
