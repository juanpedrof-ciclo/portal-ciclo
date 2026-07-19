import { TabNav } from "@/components/tab-nav";

const SUBTABS = [
  { href: "/market/financiero/resultados/pg", label: "P&G" },
  { href: "/market/financiero/resultados/cuentas-por-pagar", label: "Cuentas por pagar" },
  { href: "/market/financiero/resultados/cuentas-por-cobrar", label: "Cuentas por cobrar" },
  { href: "/market/financiero/resultados/cartera-clientes", label: "Cartera clientes" },
  { href: "/market/financiero/resultados/conciliacion", label: "Conciliación bancaria" },
];

export default function ResultadosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
