import Link from "next/link";
import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/server";
import type { Cliente } from "@/lib/financiero/types";
import { formatFechaCorta } from "@/lib/financiero/types";

export const metadata = { title: "Clientes · Módulo Financiero · Ciclo Market" };

export default async function ClientesPage() {
  const supabase = await createClient();
  const { data: clientes } = await supabase
    .from("clientes")
    .select("*")
    .order("nombre")
    .returns<Cliente[]>();

  return (
    <div className="flex flex-col gap-4">
      <BackLink href="/market/financiero/ventas" label="Ventas" />

      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Clientes</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Se registran solos al cargar pedidos; identificados por nombre + teléfono.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Teléfono</th>
              <th className="px-4 py-3 font-medium">Registrado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {!clientes || clientes.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                  Aún no hay clientes registrados.
                </td>
              </tr>
            ) : (
              clientes.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                    <Link
                      href={`/market/financiero/resultados/cartera-clientes/${c.id}`}
                      className="font-medium text-amber-700 hover:underline dark:text-amber-400"
                    >
                      {c.nombre}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                    {c.telefono || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {formatFechaCorta(c.created_at)}
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
