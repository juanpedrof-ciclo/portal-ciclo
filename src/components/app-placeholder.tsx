import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function AppPlaceholder({
  title,
  description,
  icon: Icon,
  iconBg,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
}) {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <ArrowLeft className="size-4" />
            Portal Ciclo
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <div
          className={`inline-flex size-14 items-center justify-center rounded-2xl ${iconBg}`}
        >
          <Icon className="size-7" strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {title}
        </h1>
        <p className="max-w-md text-sm text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
        <span className="mt-2 inline-flex items-center rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          Módulo en construcción
        </span>
      </main>
    </div>
  );
}
