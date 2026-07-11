import Link from "next/link";
import type { PortalApp } from "@/lib/apps";

export function AppCard({ app }: { app: PortalApp }) {
  const Icon = app.icon;

  const content = (
    <>
      <div
        className={`inline-flex size-12 items-center justify-center rounded-xl ${app.colors.iconBg}`}
      >
        <Icon className="size-6" strokeWidth={2} />
      </div>
      <div className="mt-4">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {app.name}
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {app.description}
        </p>
      </div>
      <span
        className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r ${app.colors.gradient}`}
      />
    </>
  );

  if (!app.enabled) {
    return (
      <div
        aria-disabled="true"
        className="relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 p-5 opacity-60 dark:border-zinc-800 dark:bg-zinc-900/40"
      >
        {content}
        <span className="mt-4 inline-flex w-fit items-center rounded-full bg-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          Próximamente
        </span>
      </div>
    );
  }

  return (
    <Link
      href={app.href}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm ring-1 ring-transparent transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 ${app.colors.ring}`}
    >
      {content}
      <span className="mt-4 inline-flex items-center text-sm font-medium text-zinc-400 transition group-hover:text-zinc-600 dark:group-hover:text-zinc-300">
        Abrir →
      </span>
    </Link>
  );
}
