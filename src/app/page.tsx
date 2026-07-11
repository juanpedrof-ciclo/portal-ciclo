import { AppCard } from "@/components/app-card";
import { apps } from "@/lib/apps";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-lg font-bold text-white">
            PC
          </div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Portal Ciclo
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Herramientas administrativas para gestión agropecuaria regenerativa
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <h2 className="mb-6 text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Aplicaciones
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => (
            <AppCard key={app.slug} app={app} />
          ))}
        </div>
      </main>

      <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-400 dark:border-zinc-800">
        Portal Ciclo · Gestión agropecuaria regenerativa
      </footer>
    </div>
  );
}
