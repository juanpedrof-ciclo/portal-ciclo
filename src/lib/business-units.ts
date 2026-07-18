import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Sprout,
  Store,
  TrendingUp,
  Wallet,
  Wheat,
} from "lucide-react";

export type ModuleColors = {
  gradient: string;
  ring: string;
  iconBg: string;
};

export type PortalModule = {
  slug: string;
  name: string;
  description: string;
  icon: LucideIcon;
  colors: ModuleColors;
};

export type BusinessUnit = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  colors: ModuleColors;
  modules: PortalModule[];
};

export const businessUnits: BusinessUnit[] = [
  {
    slug: "finca",
    name: "Ciclo Finca",
    tagline: "Unidad productiva",
    description:
      "Gestión administrativa, financiera y productiva de la finca regenerativa.",
    icon: Sprout,
    colors: {
      gradient: "from-emerald-500 to-emerald-600",
      ring: "hover:ring-emerald-300 dark:hover:ring-emerald-800",
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    modules: [
      {
        slug: "administrativo-financiero",
        name: "Módulo Administrativo y Financiero",
        description: "Cartera, cobros, pagos y costos de la operación.",
        icon: Wallet,
        colors: {
          gradient: "from-amber-500 to-amber-600",
          ring: "hover:ring-amber-300 dark:hover:ring-amber-800",
          iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        },
      },
      {
        slug: "productivo",
        name: "Módulo Productivo",
        description: "Indicadores y seguimiento de la producción de la finca.",
        icon: Wheat,
        colors: {
          gradient: "from-green-500 to-green-600",
          ring: "hover:ring-green-300 dark:hover:ring-green-800",
          iconBg: "bg-green-500/10 text-green-600 dark:text-green-400",
        },
      },
    ],
  },
  {
    slug: "market",
    name: "Ciclo Market",
    tagline: "Marketplace de proteína regenerativa",
    description:
      "Operación comercial, financiera y administrativa del marketplace.",
    icon: Store,
    colors: {
      gradient: "from-sky-500 to-sky-600",
      ring: "hover:ring-sky-300 dark:hover:ring-sky-800",
      iconBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    },
    modules: [
      {
        slug: "financiero",
        name: "Módulo Financiero",
        description: "Cartera, cobros y pagos del marketplace.",
        icon: Wallet,
        colors: {
          gradient: "from-amber-500 to-amber-600",
          ring: "hover:ring-amber-300 dark:hover:ring-amber-800",
          iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        },
      },
      {
        slug: "analisis-comercial",
        name: "Módulo de Análisis Comercial",
        description: "Ventas, demanda y desempeño comercial.",
        icon: TrendingUp,
        colors: {
          gradient: "from-blue-500 to-blue-600",
          ring: "hover:ring-blue-300 dark:hover:ring-blue-800",
          iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
        },
      },
      {
        slug: "administrativo",
        name: "Módulo Administrativo",
        description: "Gestión administrativa y documental del marketplace.",
        icon: Building2,
        colors: {
          gradient: "from-violet-500 to-violet-600",
          ring: "hover:ring-violet-300 dark:hover:ring-violet-800",
          iconBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
        },
      },
    ],
  },
];

export function getBusinessUnit(slug: string) {
  return businessUnits.find((unit) => unit.slug === slug);
}

export function getModule(unitSlug: string, moduleSlug: string) {
  const unit = getBusinessUnit(unitSlug);
  return unit?.modules.find((mod) => mod.slug === moduleSlug);
}
