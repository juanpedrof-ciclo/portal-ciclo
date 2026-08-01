"use client";

import { useEffect, useRef } from "react";
import { useSeleccion } from "./seleccion-provider";

export function CheckboxFila({ id }: { id: string }) {
  const { seleccionados, alternar } = useSeleccion();

  return (
    <input
      type="checkbox"
      checked={seleccionados.has(id)}
      onChange={() => alternar(id)}
      className="size-4 rounded border-zinc-300 text-amber-600 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-800"
      aria-label="Seleccionar fila"
    />
  );
}

export function CheckboxTodo({ ids }: { ids: string[] }) {
  const { seleccionados, alternarTodos } = useSeleccion();
  const ref = useRef<HTMLInputElement>(null);

  const marcados = ids.filter((id) => seleccionados.has(id)).length;
  const todoMarcado = ids.length > 0 && marcados === ids.length;
  const indeterminado = marcados > 0 && !todoMarcado;

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminado;
  }, [indeterminado]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={todoMarcado}
      onChange={() => alternarTodos(ids)}
      disabled={ids.length === 0}
      className="size-4 rounded border-zinc-300 text-amber-600 focus:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800"
      aria-label="Seleccionar todo"
    />
  );
}
