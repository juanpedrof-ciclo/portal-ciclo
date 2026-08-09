import { createClient } from "@/lib/supabase/server";
import { FacturaForm } from "./factura-form";
import { anularFactura, anularFacturasLote } from "./actions";
import { AnularForm } from "@/components/anular-form";
import { SeleccionProvider } from "@/components/seleccion-provider";
import { CheckboxFila, CheckboxTodo } from "@/components/checkbox-seleccion";
import { AnularSeleccionadosBar } from "@/components/anular-seleccionados-bar";
import { ListaBuscador } from "@/components/lista-buscador";
import { ListaPaginacion } from "@/components/lista-paginacion";
import { ThOrdenable } from "@/components/lista-th-ordenable";
import { normalizarListaParams, patronIlike } from "@/lib/financiero/list-query";
import type { Categoria, Proveedor, VistaFacturaSaldo } from "@/lib/financiero/types";
import { formatCOP, formatFechaCorta } from "@/lib/financiero/types";

export const metadata = { title: "Costos y gastos · Módulo Financiero · Ciclo Market" };

const RUTA = "/market/financiero/costos";
const COLUMNAS_ORDEN = [
  "fecha",
  "proveedor_nombre",
  "categoria_nombre",
  "monto",
  "saldo_pendiente",
  "estado",
] as const;

export default async function CostosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; sort?: string; dir?: string }>;
}) {
  const { page, sort, dir, q, desde, hasta, paramsBase } = normalizarListaParams(
    await searchParams,
    { columnas: COLUMNAS_ORDEN, ordenPorDefecto: "fecha" },
  );

  const supabase = await createClient();

  let facturasQuery = supabase.from("vista_facturas_saldo").select("*", { count: "exact" });
  if (q) {
    const patron = patronIlike(q);
    facturasQuery = facturasQuery.or(
      `proveedor_nombre.ilike.${patron},numero_factura.ilike.${patron}`,
    );
  }

  const [{ data: proveedores }, { data: categorias }, { data: facturas, count }] =
    await Promise.all([
      supabase
        .from("proveedores")
        .select("*")
        .order("nombre")
        .returns<Proveedor[]>(),
      supabase
        .from("categorias")
        .select("*")
        .order("nombre")
        .returns<Categoria[]>(),
      facturasQuery
        .order(sort, { ascending: dir === "asc" })
        .range(desde, hasta)
        .returns<VistaFacturaSaldo[]>(),
    ]);

  const idsVisibles = (facturas ?? []).map((f) => f.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Costos y gastos
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Registra cada factura de proveedor.
        </p>
      </div>

      <FacturaForm proveedores={proveedores ?? []} categorias={categorias ?? []} />

      <ListaBuscador
        basePath={RUTA}
        params={paramsBase}
        valorInicial={q}
        placeholder="Buscar por proveedor o nº de factura…"
      />

      <SeleccionProvider idsVisibles={idsVisibles}>
        <AnularSeleccionadosBar idsVisibles={idsVisibles} action={anularFacturasLote} />

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <CheckboxTodo ids={idsVisibles} />
                  </th>
                  <ThOrdenable basePath={RUTA} params={paramsBase} campo="fecha" label="Fecha" sortActual={sort} dirActual={dir} />
                  <ThOrdenable basePath={RUTA} params={paramsBase} campo="proveedor_nombre" label="Proveedor" sortActual={sort} dirActual={dir} />
                  <th className="px-4 py-3 font-medium">Nº factura</th>
                  <ThOrdenable basePath={RUTA} params={paramsBase} campo="categoria_nombre" label="Categoría" sortActual={sort} dirActual={dir} />
                  <ThOrdenable basePath={RUTA} params={paramsBase} campo="monto" label="Monto" sortActual={sort} dirActual={dir} align="right" />
                  <ThOrdenable basePath={RUTA} params={paramsBase} campo="saldo_pendiente" label="Saldo" sortActual={sort} dirActual={dir} align="right" />
                  <ThOrdenable basePath={RUTA} params={paramsBase} campo="estado" label="Estado" sortActual={sort} dirActual={dir} />
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {!facturas || facturas.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                      {q ? "No se encontraron facturas para esa búsqueda." : "Aún no hay facturas registradas."}
                    </td>
                  </tr>
                ) : (
                facturas.map((f) => (
                  <tr key={f.id}>
                    <td className="px-4 py-3">
                      <CheckboxFila id={f.id} />
                    </td>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                      {formatFechaCorta(f.fecha)}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                      {f.proveedor_nombre}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                      {f.numero_factura ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                      {f.categoria_nombre}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-zinc-100">
                      {formatCOP(f.monto)}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-300">
                      {f.saldo_pendiente > 0 ? formatCOP(f.saldo_pendiente) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                          f.estado === "pagado"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                        }`}
                      >
                        {f.estado === "pagado" ? "Pagado" : "Pendiente"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <AnularForm
                        id={f.id}
                        action={anularFactura}
                        mensaje="¿Seguro que deseas anular esta factura? Esta acción la excluye de tus cálculos."
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
