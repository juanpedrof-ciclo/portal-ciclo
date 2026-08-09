"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";

export function ListaBuscador({
  basePath,
  params,
  valorInicial,
  placeholder,
}: {
  basePath: string;
  params: Record<string, string>;
  valorInicial: string;
  placeholder: string;
}) {
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function manejarCambio(valor: string) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const sp = new URLSearchParams(params);
      sp.delete("q");
      if (valor.trim()) sp.set("q", valor.trim());
      sp.set("page", "1");
      const query = sp.toString();
      router.push(query ? `${basePath}?${query}` : basePath);
    }, 300);
  }

  return (
    <input
      type="search"
      defaultValue={valorInicial}
      onChange={(e) => manejarCambio(e.target.value)}
      placeholder={placeholder}
      className="w-full max-w-xs rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
      aria-label="Buscar"
    />
  );
}
