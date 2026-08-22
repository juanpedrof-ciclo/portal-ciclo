import { TabNav } from "@/components/tab-nav";

const SUBTABS = [
  { href: "/finca/productivo/reproduccion/servicios", label: "Servicios" },
  { href: "/finca/productivo/reproduccion/confirmacion-prenez", label: "Confirmación de preñez" },
  { href: "/finca/productivo/reproduccion/destetes", label: "Destetes" },
];

export default function ReproduccionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Reproducción
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Servicio → confirmación de preñez → parto → lactancia → destete → vacía.
        </p>
      </div>
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <TabNav items={SUBTABS} />
      </div>
      {children}
    </div>
  );
}
