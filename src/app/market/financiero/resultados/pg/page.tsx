import { createClient } from "@/lib/supabase/server";
import { calcularPG, type ResumenPG } from "@/lib/financiero/pg";
import { ultimasSemanas, ultimosMeses } from "@/lib/financiero/dates";
import { formatCOP, formatFechaCorta } from "@/lib/financiero/types";

export const metadata = { title: "P&G · Módulo Financiero · Ciclo Market" };

export default async function PGPage() {
  const supabase = await createClient();
  const semanas = ultimasSemanas(8);
  const meses = ultimosMeses(6);

  const [pgSemanas, pgMeses] = await Promise.all([
    Promise.all(
      semanas.map((rango) => calcularPG(supabase, rango.desde, rango.hasta)),
    ),
    Promise.all(
      meses.map((rango) => calcularPG(supabase, rango.desde, rango.hasta)),
    ),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <TablaPG
        titulo="P&G semanal (últimas 8 semanas)"
        etiquetas={semanas.map((s) => `Sem. ${formatFechaCorta(s.desde)}`)}
        valores={pgSemanas}
      />
      <TablaPG
        titulo="P&G mensual (últimos 6 meses)"
        etiquetas={meses.map((m) => m.etiqueta)}
        valores={pgMeses}
      />
    </div>
  );
}

function TablaPG({
  titulo,
  etiquetas,
  valores,
}: {
  titulo: string;
  etiquetas: string[];
  valores: ResumenPG[];
}) {
  const filas: { label: string; key: keyof ResumenPG; negativo?: boolean }[] = [
    { label: "Ingresos", key: "ingresos" },
    { label: "Costo de producto", key: "costoProducto", negativo: true },
    { label: "Gasto de venta", key: "gastoVenta", negativo: true },
    { label: "Gasto administrativo", key: "gastoAdministrativo", negativo: true },
    { label: "Utilidad", key: "utilidad" },
  ];

  return (
    <section>
      <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {titulo}
      </h3>
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Concepto</th>
              {etiquetas.map((etiqueta) => (
                <th key={etiqueta} className="px-4 py-3 text-right font-medium whitespace-nowrap">
                  {etiqueta}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filas.map((fila) => (
              <tr key={fila.key} className={fila.key === "utilidad" ? "bg-zinc-50 dark:bg-zinc-950/40" : ""}>
                <td className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                  {fila.label}
                </td>
                {valores.map((v, i) => {
                  const valor = v[fila.key];
                  const mostrado = fila.negativo ? -valor : valor;
                  return (
                    <td
                      key={i}
                      className={`px-4 py-3 text-right whitespace-nowrap ${
                        mostrado < 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-zinc-900 dark:text-zinc-100"
                      }`}
                    >
                      {formatCOP(mostrado)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
