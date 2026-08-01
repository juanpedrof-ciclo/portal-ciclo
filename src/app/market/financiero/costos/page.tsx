import { createClient } from "@/lib/supabase/server";
import { FacturaForm } from "./factura-form";
import { anularFactura, anularFacturasLote } from "./actions";
import { AnularForm } from "@/components/anular-form";
import { SeleccionProvider } from "@/components/seleccion-provider";
import { CheckboxFila, CheckboxTodo } from "@/components/checkbox-seleccion";
import { AnularSeleccionadosBar } from "@/components/anular-seleccionados-bar";
import type { Categoria, Proveedor, VistaFacturaSaldo } from "@/lib/financiero/types";
import { formatCOP, formatFechaCorta } from "@/lib/financiero/types";

export const metadata = { title: "Costos y gastos · Módulo Financiero · Ciclo Market" };

export default async function CostosPage() {
  const supabase = await createClient();

  const [{ data: proveedores }, { data: categorias }, { data: facturas }] =
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
      supabase
        .from("vista_facturas_saldo")
        .select("*")
        .order("fecha", { ascending: false })
        .limit(50)
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

      <SeleccionProvider idsVisibles={idsVisibles}>
        <AnularSeleccionadosBar idsVisibles={idsVisibles} action={anularFacturasLote} />

        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <tr>
                <th className="w-10 px-4 py-3">
                  <CheckboxTodo ids={idsVisibles} />
                </th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Proveedor</th>
                <th className="px-4 py-3 font-medium">Nº factura</th>
                <th className="px-4 py-3 font-medium">Categoría</th>
                <th className="px-4 py-3 text-right font-medium">Monto</th>
                <th className="px-4 py-3 text-right font-medium">Saldo</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {!facturas || facturas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                    Aún no hay facturas registradas.
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
      </SeleccionProvider>
    </div>
  );
}
