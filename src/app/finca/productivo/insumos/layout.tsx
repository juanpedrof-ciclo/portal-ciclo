import { TabNav } from "@/components/tab-nav";

const SUBTABS = [
  { href: "/finca/productivo/insumos/inventario", label: "Inventario" },
  { href: "/finca/productivo/insumos/entradas", label: "Entradas" },
  { href: "/finca/productivo/insumos/salidas", label: "Salidas" },
];

export default function InsumosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Insumos</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Alimento, medicamentos, herramientas y demás materiales de la finca.
        </p>
      </div>
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <TabNav items={SUBTABS} />
      </div>
      {children}
    </div>
  );
}
