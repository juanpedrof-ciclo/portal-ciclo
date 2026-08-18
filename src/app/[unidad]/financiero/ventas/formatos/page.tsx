import Link from "next/link";
import { BackLink } from "@/components/back-link";
import { AnularForm } from "@/components/anular-form";
import { createClient } from "@/lib/supabase/server";
import { eliminarFormato } from "./actions";
import type { FormatoCarga, Unidad } from "@/lib/financiero/types";
import { formatFechaCorta } from "@/lib/financiero/types";

export const metadata = { title: "Formatos de carga · Módulo Financiero" };

export default async function FormatosCargaPage({
  params,
}: {
  params: Promise<{ unidad: string }>;
}) {
  const { unidad } = (await params) as { unidad: Unidad };
  const supabase = await createClient();
  const { data: formatos } = await supabase
    .from("formatos_carga")
    .select("*")
    .eq("unidad", unidad)
    .order("nombre")
    .returns<FormatoCarga[]>();

  return (
    <div className="flex flex-col gap-4">
      <BackLink href={`/${unidad}/financiero/ventas`} label="Ventas" />

      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Formatos de carga
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Los formatos guardan el mapeo de columnas para leer los archivos de ventas de cada
          plataforma. Editar o eliminar uno solo afecta las próximas cargas; los pedidos ya
          cargados no se modifican.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Creado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {!formatos || formatos.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400"
                >
                  Aún no hay formatos guardados.
                </td>
              </tr>
            ) : (
              formatos.map((f) => (
                <tr key={f.id}>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    {f.nombre}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {formatFechaCorta(f.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/${unidad}/financiero/ventas/formatos/${f.id}`}
                        className="text-xs font-medium text-amber-700 hover:underline dark:text-amber-400"
                      >
                        Editar
                      </Link>
                      <AnularForm
                        id={f.id}
                        action={eliminarFormato.bind(null, unidad)}
                        mensaje="¿Seguro que deseas eliminar este formato? Los pedidos ya cargados con él no se afectan."
                        label="Eliminar"
                        pendingLabel="Eliminando…"
                      />
                    </div>
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
