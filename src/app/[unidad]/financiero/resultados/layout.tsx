import { TabNav } from "@/components/tab-nav";

export default async function ResultadosLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ unidad: string }>;
}) {
  const { unidad } = await params;

  const SUBTABS = [
    { href: `/${unidad}/financiero/resultados/pg`, label: "P&G" },
    { href: `/${unidad}/financiero/resultados/cuentas-por-pagar`, label: "Cuentas por pagar" },
    { href: `/${unidad}/financiero/resultados/cuentas-por-cobrar`, label: "Cuentas por cobrar" },
    { href: `/${unidad}/financiero/resultados/cartera-clientes`, label: "Cartera clientes" },
    { href: `/${unidad}/financiero/resultados/conciliacion`, label: "Conciliación bancaria" },
    { href: `/${unidad}/financiero/resultados/banco-caja`, label: "Banco y caja" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Resultados
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Vistas calculadas a partir de ingresos, facturas y pagos.
        </p>
      </div>
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <TabNav items={SUBTABS} />
      </div>
      {children}
    </div>
  );
}
