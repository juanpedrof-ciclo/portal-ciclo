"use client";

import { useState, useTransition } from "react";

export function TareaAccionBoton({
  id,
  action,
  label,
  pendingLabel,
  className,
}: {
  id: string;
  action: (id: string) => Promise<{ error: string | null }>;
  label: string;
  pendingLabel: string;
  className: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await action(id);
            setError(res.error);
          });
        }}
        className={className}
      >
        {pending ? pendingLabel : label}
      </button>
      {error && <p className="max-w-[16rem] text-right text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
