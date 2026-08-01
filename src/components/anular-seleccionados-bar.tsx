"use client";

import { useState, useTransition } from "react";
import { useSeleccion } from "./seleccion-provider";
import type { ResultadoAnulacionLote } from "@/lib/financiero/anulacion-lote";

export function AnularSeleccionadosBar({
  idsVisibles,
  action,
}: {
  idsVisibles: string[];
  action: (ids: string[]) => Promise<ResultadoAnulacionLote>;
}) {
  const { seleccionados, bloquear } = useSeleccion();
  const [resultado, setResultado] = useState<ResultadoAnulacionLote | null>(null);
  const [pending, startTransition] = useTransition();

  const visibles = new Set(idsVisibles);
  const idsSeleccionados = [...seleccionados].filter((id) => visibles.has(id));
  const n = idsSeleccionados.length;

  if (n === 0 && !resultado) return null;

  function manejarClick() {
    if (
      !window.confirm(
        `¿Seguro que deseas anular los ${n} registros seleccionados? Esta acción los excluye de tus cálculos.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await action(idsSeleccionados);
      setResultado(res);
      bloquear(res.bloqueados.map((b) => b.id));
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
      {n > 0 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-red-700 dark:text-red-300">
            {n} seleccionado{n === 1 ? "" : "s"}
          </p>
          <button
            type="button"
            onClick={manejarClick}
            disabled={pending}
            className="whitespace-nowrap rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Anulando…" : `Anular seleccionados (${n})`}
          </button>
        </div>
      )}

      {resultado && (
        <div className="text-sm text-zinc-700 dark:text-zinc-300">
          <p>{resultado.anulados} registro(s) anulado(s).</p>

          {resultado.bloqueados.length > 0 && (
            <>
              <p className="mt-1 font-medium text-red-700 dark:text-red-400">
                {resultado.bloqueados.length} no se pudieron anular:
              </p>
              <ul className="mt-1 max-h-40 list-disc space-y-0.5 overflow-y-auto pl-5">
                {resultado.bloqueados.map((b) => (
                  <li key={b.id}>
                    {b.referencia}: {b.motivo}.
                  </li>
                ))}
              </ul>
            </>
          )}

          {resultado.advertencias && resultado.advertencias.length > 0 && (
            <>
              <p className="mt-1 font-medium text-amber-700 dark:text-amber-400">Avisos:</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {resultado.advertencias.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </>
          )}

          <button
            type="button"
            onClick={() => setResultado(null)}
            className="mt-2 text-xs text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}
