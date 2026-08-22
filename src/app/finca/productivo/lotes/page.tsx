import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { obtenerGrupos } from "@/lib/productivo/consultas";
import type { VistaInventarioLote } from "@/lib/productivo/types";

export const metadata = { title: "Lotes · Módulo Productivo" };

export default async function LotesPage() {
  const supabase = await createClient();
  const [grupos, { data: inventario }] = await Promise.all([
    obtenerGrupos(supabase),
    supabase.from("vista_inventario_lote").select("*").returns<VistaInventarioLote[]>(),
  ]);

  const gruposLote = grupos.filter((g) => g.tipo_manejo === "lote");
  const inventarioPorGrupo = new Map((inventario ?? []).map((v) => [v.grupo_id, v]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Lotes</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Inventario por conteo total, sin chapeta individual.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {gruposLote.map((g) => {
          const inv = inventarioPorGrupo.get(g.id);
          if (!g.activo) {
            return (
              <div
                key={g.id}
                className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-5 opacity-60 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <p className="font-medium text-zinc-900 dark:text-zinc-50">{g.nombre}</p>
                <span className="w-fit rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  Próximamente
                </span>
              </div>
            );
          }
          return (
            <Link
              key={g.id}
              href={`/finca/productivo/lotes/${g.id}`}
              className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-green-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-green-700"
            >
              <p className="font-medium text-zinc-900 dark:text-zinc-50">{g.nombre}</p>
              <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
                {inv?.cantidad_actual ?? 0}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">animales en inventario</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
