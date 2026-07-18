import { BackLink } from "@/components/back-link";
import type { LucideIcon } from "lucide-react";
import type { ModuleColors } from "@/lib/business-units";

export function ModulePlaceholder({
  unitName,
  unitHref,
  moduleName,
  icon: Icon,
  colors,
}: {
  unitName: string;
  unitHref: string;
  moduleName: string;
  icon: LucideIcon;
  colors: ModuleColors;
}) {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <BackLink href={unitHref} label={unitName} />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <div
          className={`inline-flex size-14 items-center justify-center rounded-2xl ${colors.iconBg}`}
        >
          <Icon className="size-7" strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {moduleName}
        </h1>
        <span className="mt-2 inline-flex items-center rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          En construcción
        </span>
        <BackLink href={unitHref} label={`Volver a ${unitName}`} />
      </main>
    </div>
  );
}
