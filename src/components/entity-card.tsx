import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ModuleColors } from "@/lib/business-units";

export function EntityCard({
  href,
  name,
  description,
  icon: Icon,
  colors,
}: {
  href: string;
  name: string;
  description: string;
  icon: LucideIcon;
  colors: ModuleColors;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm ring-1 ring-transparent transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 ${colors.ring}`}
    >
      <div
        className={`inline-flex size-12 items-center justify-center rounded-xl ${colors.iconBg}`}
      >
        <Icon className="size-6" strokeWidth={2} />
      </div>
      <div className="mt-4">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {name}
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      </div>
      <span className="mt-4 inline-flex items-center text-sm font-medium text-zinc-400 transition group-hover:text-zinc-600 dark:group-hover:text-zinc-300">
        Abrir →
      </span>
      <span
        className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r ${colors.gradient}`}
      />
    </Link>
  );
}
