import { BackLink } from "@/components/back-link";
import { EntityCard } from "@/components/entity-card";
import type { BusinessUnit } from "@/lib/business-units";

export function UnitView({ unit }: { unit: BusinessUnit }) {
  const Icon = unit.icon;

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <BackLink href="/" label="Portal Ciclo" />
          <div className="mt-4 flex items-center gap-3">
            <div
              className={`inline-flex size-10 items-center justify-center rounded-xl ${unit.colors.iconBg}`}
            >
              <Icon className="size-5" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {unit.name}
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {unit.tagline}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <h2 className="mb-6 text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Módulos
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {unit.modules.map((mod) => (
            <EntityCard
              key={mod.slug}
              href={`/${unit.slug}/${mod.slug}`}
              name={mod.name}
              description={mod.description}
              icon={mod.icon}
              colors={mod.colors}
            />
          ))}
        </div>
      </main>

      <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-400 dark:border-zinc-800">
        Portal Ciclo · {unit.name}
      </footer>
    </div>
  );
}
