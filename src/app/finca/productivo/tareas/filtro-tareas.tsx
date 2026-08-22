"use client";

import { useRouter } from "next/navigation";
import { ESTADO_TAREA_LABELS, type Trabajador } from "@/lib/productivo/types";
import { inputClass } from "@/components/form-field";

export function FiltroTareas({
  basePath,
  params,
  trabajadores,
  trabajadorActual,
  estadoActual,
}: {
  basePath: string;
  params: Record<string, string>;
  trabajadores: Trabajador[];
  trabajadorActual: string;
  estadoActual: string;
}) {
  const router = useRouter();

  function actualizar(clave: string, valor: string) {
    const sp = new URLSearchParams(params);
    sp.delete(clave);
    if (valor) sp.set(clave, valor);
    sp.set("page", "1");
    const query = sp.toString();
    router.push(query ? `${basePath}?${query}` : basePath);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <select
        value={trabajadorActual}
        onChange={(e) => actualizar("trabajador", e.target.value)}
        className={`${inputClass} w-auto py-2`}
        aria-label="Filtrar por trabajador"
      >
        <option value="">Todos los trabajadores</option>
        {trabajadores.map((t) => (
          <option key={t.id} value={t.id}>
            {t.nombre}
          </option>
        ))}
      </select>

      <select
        value={estadoActual}
        onChange={(e) => actualizar("estado", e.target.value)}
        className={`${inputClass} w-auto py-2`}
        aria-label="Filtrar por estado"
      >
        <option value="">Todos los estados</option>
        {Object.entries(ESTADO_TAREA_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
        <option value="vencida">Vencidas</option>
      </select>
    </div>
  );
}
