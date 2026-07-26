"use client";

import { useState, useTransition } from "react";
import { ConfirmSubmitButton } from "./confirm-submit-button";

export function AnularForm({
  id,
  action,
  mensaje,
  label = "Anular",
  pendingLabel = "Anulando…",
}: {
  id: string;
  action: (id: string) => Promise<{ error: string | null }>;
  mensaje: string;
  label?: string;
  pendingLabel?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-end gap-1">
      <form
        action={() => {
          setError(null);
          startTransition(async () => {
            const res = await action(id);
            setError(res.error);
          });
        }}
      >
        <ConfirmSubmitButton mensaje={mensaje} disabled={pending}>
          {pending ? pendingLabel : label}
        </ConfirmSubmitButton>
      </form>
      {error && (
        <p className="max-w-[16rem] text-right text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
