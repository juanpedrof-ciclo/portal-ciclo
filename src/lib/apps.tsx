import type { LucideIcon } from "lucide-react";
import { FileText, PawPrint, Sprout, TrendingUp, Wallet, Wheat } from "lucide-react";

export type PortalApp = {
  slug: string;
  name: string;
  description: string;
  icon: LucideIcon;
  href: string;
  enabled: boolean;
  colors: {
    gradient: string;
    ring: string;
    iconBg: string;
  };
};

export const apps: PortalApp[] = [
  {
    slug: "comercial",
    name: "Comercial",
    description: "Ventas semanales",
    icon: TrendingUp,
    href: "/comercial",
    enabled: true,
    colors: {
      gradient: "from-sky-500 to-sky-600",
      ring: "hover:ring-sky-300 dark:hover:ring-sky-800",
      iconBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    },
  },
  {
    slug: "cartera",
    name: "Cartera",
    description: "Cobros y pagos",
    icon: Wallet,
    href: "/cartera",
    enabled: true,
    colors: {
      gradient: "from-amber-500 to-amber-600",
      ring: "hover:ring-amber-300 dark:hover:ring-amber-800",
      iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
  },
  {
    slug: "invergenesis",
    name: "Invergénesis",
    description: "Costos y cartera proveedor",
    icon: Sprout,
    href: "/invergenesis",
    enabled: true,
    colors: {
      gradient: "from-emerald-500 to-emerald-600",
      ring: "hover:ring-emerald-300 dark:hover:ring-emerald-800",
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
  },
  {
    slug: "hato",
    name: "Hato",
    description: "Gestión de ganado",
    icon: PawPrint,
    href: "/hato",
    enabled: false,
    colors: {
      gradient: "from-stone-400 to-stone-500",
      ring: "",
      iconBg: "bg-stone-500/10 text-stone-500 dark:text-stone-400",
    },
  },
  {
    slug: "produccion",
    name: "Producción",
    description: "Indicadores de producción",
    icon: Wheat,
    href: "/produccion",
    enabled: false,
    colors: {
      gradient: "from-stone-400 to-stone-500",
      ring: "",
      iconBg: "bg-stone-500/10 text-stone-500 dark:text-stone-400",
    },
  },
  {
    slug: "documentos",
    name: "Documentos",
    description: "Archivos y contratos",
    icon: FileText,
    href: "/documentos",
    enabled: false,
    colors: {
      gradient: "from-stone-400 to-stone-500",
      ring: "",
      iconBg: "bg-stone-500/10 text-stone-500 dark:text-stone-400",
    },
  },
];
