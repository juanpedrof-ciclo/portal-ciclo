import Link from "next/link";
import {
  Banknote,
  FileText,
  Landmark,
  Receipt,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { calcularPG } from "@/lib/financiero/pg";
import { rangoMesActual, nombreMes } from "@/lib/financiero/dates";
import { formatCOP } from "@/lib/financiero/types";
import type { Unidad } from "@/lib/financiero/types";
import { getBusinessUnit } from "@/lib/business-units";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ unidad: string }>;
}) {
  const { unidad } = await params;
  const unit = getBusinessUnit(unidad);
  return { title: `Módulo Financiero · ${unit?.name ?? unidad} · Portal Ciclo` };
}

export default async function FinancieroDashboardPage({
  params,
}: {
  params: Promise<{ unidad: string }>;
}) {
  const { unidad } = (await params) as { unidad: Unidad };

  const ACCESOS = [
    {
      href: `/${unidad}/financiero/ingresos`,
      label: "Registrar ingresos",
      description: "Total de venta de la semana.",
      icon: TrendingUp,
    },
    {
      href: `/${unidad}/financiero/costos`,
      label: "Registrar factura",
      description: "Costos y gastos por proveedor.",
      icon: Receipt,
    },
    {
      href: `/${unidad}/financiero/pagos`,
      label: "Registrar pago",
      description: "Cruces contra facturas o ventas.",
      icon: Banknote,
    },
    {
      href: `/${unidad}/financiero/resultados/conciliacion`,
      label: "Conciliación bancaria",
      description: "Extracto vs. movimientos.",
      icon: Landmark,
    },
  ];

  const supabase = await createClient();
  const { desde, hasta } = rangoMesActual();
  const pg = await calcularPG(supabase, unidad, desde, hasta);

  return (
    <div className="flex flex-col gap-8">
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            P&amp;G de {nombreMes(desde)}
          </h2>
          <Link
            href={`/${unidad}/financiero/resultados/pg`}
            className="text-sm font-medium text-amber-700 hover:underline dark:text-amber-400"
          >
            Ver detalle
          </Link>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <TarjetaPG label="Ingresos" valor={pg.ingresos} />
          <TarjetaPG label="Costo de producto" valor={-pg.costoProducto} />
          <TarjetaPG label="Gasto de venta" valor={-pg.gastoVenta} />
          <TarjetaPG label="Gasto administrativo" valor={-pg.gastoAdministrativo} />
          <TarjetaPG label="Utilidad" valor={pg.utilidad} destacado />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Accesos rápidos
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ACCESOS.map((acceso) => (
            <Link
              key={acceso.href}
              href={acceso.href}
              className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="inline-flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <acceso.icon className="size-5" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {acceso.label}
                </h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {acceso.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Otras vistas
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/${unidad}/financiero/resultados/cuentas-por-pagar`}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-amber-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <FileText className="size-4" />
            Cuentas por pagar
          </Link>
          <Link
            href={`/${unidad}/financiero/resultados/cuentas-por-cobrar`}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-amber-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <TrendingDown className="size-4" />
            Cuentas por cobrar
          </Link>
        </div>
      </section>
    </div>
  );
}

function TarjetaPG({
  label,
  valor,
  destacado = false,
}: {
  label: string;
  valor: number;
  destacado?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        destacado
          ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      }`}
    >
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p
        className={`mt-1 text-base font-semibold ${
          valor < 0
            ? "text-red-600 dark:text-red-400"
            : "text-zinc-900 dark:text-zinc-50"
        }`}
      >
        {formatCOP(valor)}
      </p>
    </div>
  );
}
