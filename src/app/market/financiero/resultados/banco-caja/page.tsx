import { createClient } from "@/lib/supabase/server";
import { SaldoInicialForm } from "./saldo-inicial-form";
import { AjusteForm } from "./ajuste-form";
import { anularAjuste } from "./actions";
import { AnularForm } from "@/components/anular-form";
import {
  DESTINO_CUENTA_LABELS,
  formatCOP,
  formatFechaCorta,
  type AjusteCajaBanco,
  type DestinoCuenta,
  type VistaSaldoBancoCaja,
} from "@/lib/financiero/types";

export const metadata = {
  title: "Banco y caja · Módulo Financiero · Ciclo Market",
};

export default async function BancoCajaPage() {
  const supabase = await createClient();

  const [{ data: saldos }, { data: ajustes }] = await Promise.all([
    supabase
      .from("vista_saldo_banco_caja")
      .select("*")
      .returns<VistaSaldoBancoCaja[]>(),
    supabase
      .from("ajustes_caja_banco")
      .select("*")
      .eq("anulado", false)
      .order("fecha", { ascending: false })
      .limit(50)
      .returns<AjusteCajaBanco[]>(),
  ]);

  const saldoBanco = (saldos ?? []).find((s) => s.destino === "banco") ?? null;
  const saldoCaja = (saldos ?? []).find((s) => s.destino === "caja") ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Banco y caja
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Saldo actual, saldo inicial de arranque y ajustes manuales.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {([saldoBanco, saldoCaja] as (VistaSaldoBancoCaja | null)[]).map((s, i) => {
          const destino: DestinoCuenta = i === 0 ? "banco" : "caja";
          return (
            <div
              key={destino}
              className="rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-sm dark:border-amber-800 dark:bg-amber-950/40"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Saldo {DESTINO_CUENTA_LABELS[destino]}
              </p>
              <p
                className={`mt-1 text-2xl font-semibold ${
                  (s?.saldo_actual ?? 0) < 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-zinc-900 dark:text-zinc-50"
                }`}
              >
                {formatCOP(s?.saldo_actual ?? 0)}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {s?.saldo_inicial_fecha
                  ? `Saldo inicial ${formatCOP(s.saldo_inicial_monto)} al ${formatFechaCorta(
                      s.saldo_inicial_fecha,
                    )}, + pagos ${formatCOP(s.monto_pagos)} + ajustes ${formatCOP(s.monto_ajustes)}`
                  : "Sin saldo inicial registrado: se está sumando todo el histórico de pagos."}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SaldoInicialForm />
        <AjusteForm />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Cuenta</th>
              <th className="px-4 py-3 text-right font-medium">Monto</th>
              <th className="px-4 py-3 font-medium">Motivo</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {!ajustes || ajustes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                  Aún no hay ajustes registrados.
                </td>
              </tr>
            ) : (
              ajustes.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                    {formatFechaCorta(a.fecha)}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                    {DESTINO_CUENTA_LABELS[a.destino]}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-medium ${
                      a.monto < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-zinc-900 dark:text-zinc-100"
                    }`}
                  >
                    {formatCOP(a.monto)}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{a.motivo}</td>
                  <td className="px-4 py-3">
                    <AnularForm
                      id={a.id}
                      action={anularAjuste}
                      mensaje="¿Seguro que deseas anular este ajuste? Se excluirá del saldo."
                    />
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
