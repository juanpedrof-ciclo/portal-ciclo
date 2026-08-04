import { createClient } from "@/lib/supabase/server";
import { MovimientoForm } from "./movimiento-form";
import { conciliarMovimiento } from "./actions";
import {
  formatCOP,
  formatFechaCorta,
  type VistaSaldoBancoCaja,
} from "@/lib/financiero/types";

export const metadata = {
  title: "Conciliación bancaria · Módulo Financiero · Ciclo Market",
};

type MovimientoConPago = {
  id: string;
  fecha: string;
  descripcion: string | null;
  monto: number;
  tipo: "credito" | "debito";
  conciliado: boolean;
  pago_id: string | null;
  pagos: { tipo: string; fecha: string; monto: number; referencia: string | null } | null;
};

type PagoBanco = {
  id: string;
  tipo: string;
  fecha: string;
  monto: number;
  referencia: string | null;
};

export default async function ConciliacionPage() {
  const supabase = await createClient();

  const [{ data: movimientos }, { data: pagosBanco }, { data: saldos }] =
    await Promise.all([
      supabase
        .from("movimientos_bancarios")
        .select(
          "id, fecha, descripcion, monto, tipo, conciliado, pago_id, pagos ( tipo, fecha, monto, referencia )",
        )
        .order("fecha", { ascending: false })
        .returns<MovimientoConPago[]>(),
      supabase
        .from("pagos")
        .select("id, tipo, fecha, monto, referencia")
        .eq("destino", "banco")
        .eq("anulado", false)
        .order("fecha", { ascending: false })
        .returns<PagoBanco[]>(),
      supabase
        .from("vista_saldo_banco_caja")
        .select("destino, saldo_actual")
        .returns<Pick<VistaSaldoBancoCaja, "destino" | "saldo_actual">[]>(),
    ]);

  const saldoBanco = (saldos ?? []).find((s) => s.destino === "banco")?.saldo_actual ?? 0;
  const saldoCaja = (saldos ?? []).find((s) => s.destino === "caja")?.saldo_actual ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Saldo de banco
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {formatCOP(saldoBanco)}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Saldo inicial + pagos en banco + ajustes. Se configura en{" "}
            <a href="/market/financiero/resultados/banco-caja" className="underline">
              Banco y caja
            </a>
            .
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Saldo de caja (efectivo)
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {formatCOP(saldoCaja)}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Saldo inicial + pagos en caja + ajustes.
          </p>
        </div>
      </div>

      <MovimientoForm />

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Descripción</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 text-right font-medium">Monto</th>
              <th className="px-4 py-3 font-medium">Conciliación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {!movimientos || movimientos.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                  Aún no hay movimientos del extracto.
                </td>
              </tr>
            ) : (
              movimientos.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                    {formatFechaCorta(m.fecha)}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                    {m.descripcion ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                    {m.tipo === "credito" ? "Crédito" : "Débito"}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-zinc-100">
                    {formatCOP(m.monto)}
                  </td>
                  <td className="px-4 py-3">
                    {m.conciliado && m.pagos ? (
                      <form action={conciliarMovimiento} className="flex items-center gap-2">
                        <input type="hidden" name="movimiento_id" value={m.id} />
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                          Conciliado · {formatCOP(m.pagos.monto)} ({formatFechaCorta(m.pagos.fecha)})
                        </span>
                        <button
                          type="submit"
                          className="text-xs font-medium text-zinc-500 hover:underline dark:text-zinc-400"
                        >
                          Desconciliar
                        </button>
                      </form>
                    ) : (
                      <form action={conciliarMovimiento} className="flex items-center gap-2">
                        <input type="hidden" name="movimiento_id" value={m.id} />
                        <select
                          name="pago_id"
                          required
                          defaultValue=""
                          className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-900 outline-none focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                        >
                          <option value="" disabled>
                            Elegir pago…
                          </option>
                          {(pagosBanco ?? []).map((p) => (
                            <option key={p.id} value={p.id}>
                              {formatCOP(p.monto)} · {formatFechaCorta(p.fecha)}
                              {p.referencia ? ` · ${p.referencia}` : ""}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="rounded-lg bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
                        >
                          Conciliar
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
