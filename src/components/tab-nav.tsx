"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function TabNav({
  items,
}: {
  items: { href: string; label: string }[];
}) {
  const pathname = usePathname();

  return (
    <nav className="-mb-px flex gap-1 overflow-x-auto">
      {items.map((item) => {
        const active =
          item.href === pathname || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-t-lg border-b-2 px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "border-amber-600 text-amber-700 dark:border-amber-500 dark:text-amber-400"
                : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-200"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
