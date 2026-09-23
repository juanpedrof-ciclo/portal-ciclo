"use client";

export function BreadcrumbDrilldown({
  items,
  onCerrar,
}: {
  items: { label: string; onClick?: () => void }[];
  onCerrar: () => void;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-zinc-400">›</span>}
            {item.onClick ? (
              <button
                type="button"
                onClick={item.onClick}
                className="font-medium text-amber-700 hover:underline dark:text-amber-400"
              >
                {item.label}
              </button>
            ) : (
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{item.label}</span>
            )}
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={onCerrar}
        className="text-xs text-zinc-500 hover:underline dark:text-zinc-400"
      >
        Cerrar
      </button>
    </div>
  );
}
