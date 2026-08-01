"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type SeleccionContextValor = {
  seleccionados: Set<string>;
  alternar: (id: string) => void;
  alternarTodos: (ids: string[]) => void;
  bloquear: (ids: string[]) => void;
};

const SeleccionContext = createContext<SeleccionContextValor | null>(null);

export function SeleccionProvider({
  idsVisibles,
  children,
}: {
  idsVisibles: string[];
  children: ReactNode;
}) {
  const [seleccionadosCrudo, setSeleccionadosCrudo] = useState<Set<string>>(new Set());

  // Se purgan acá (derivado en el render, no en un efecto) los ids que ya no están
  // visibles: por ejemplo si el usuario anuló una fila individualmente con su propio
  // botón mientras tenía otras filas marcadas, y el revalidatePath trajo una lista nueva.
  const seleccionados = useMemo(() => {
    const visibles = new Set(idsVisibles);
    return new Set([...seleccionadosCrudo].filter((id) => visibles.has(id)));
  }, [seleccionadosCrudo, idsVisibles]);

  function alternar(id: string) {
    setSeleccionadosCrudo((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(id)) siguiente.delete(id);
      else siguiente.add(id);
      return siguiente;
    });
  }

  function alternarTodos(ids: string[]) {
    setSeleccionadosCrudo((prev) => {
      const todosMarcados = ids.length > 0 && ids.every((id) => prev.has(id));
      return todosMarcados ? new Set() : new Set(ids);
    });
  }

  function bloquear(ids: string[]) {
    setSeleccionadosCrudo(new Set(ids));
  }

  return (
    <SeleccionContext.Provider value={{ seleccionados, alternar, alternarTodos, bloquear }}>
      {children}
    </SeleccionContext.Provider>
  );
}

export function useSeleccion() {
  const ctx = useContext(SeleccionContext);
  if (!ctx) throw new Error("useSeleccion debe usarse dentro de SeleccionProvider");
  return ctx;
}
