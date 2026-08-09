import Link from "next/link";
import type { DirOrden } from "@/lib/financiero/list-query";

export function ThOrdenable({
  basePath,
  params,
  campo,
  label,
  sortActual,
  dirActual,
  align,
}: {
  basePath: string;
  params: Record<string, string>;
  campo: string;
  label: string;
  sortActual: string;
  dirActual: DirOrden;
  align?: "right";
}) {
  const activo = sortActual === campo;
  const nuevaDir: DirOrden = activo && dirActual === "asc" ? "desc" : "asc";

  const sp = new URLSearchParams(params);
  sp.set("sort", campo);
  sp.set("dir", nuevaDir);
  sp.set("page", "1");

  return (
    <th className={`px-4 py-3 font-medium ${align === "right" ? "text-right" : ""}`}>
      <Link
        href={`${basePath}?${sp.toString()}`}
        className={`inline-flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100 ${
          align === "right" ? "flex-row-reverse" : ""
        }`}
      >
        {label}
        <span className="w-3 text-amber-600 dark:text-amber-400">
          {activo ? (dirActual === "asc" ? "↑" : "↓") : ""}
        </span>
      </Link>
    </th>
  );
}
