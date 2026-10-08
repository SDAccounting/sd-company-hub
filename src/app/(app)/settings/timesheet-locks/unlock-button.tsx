"use client";

import { useState, useTransition } from "react";
import { unlockPeriod } from "./actions";

export function UnlockButton({ id, label }: { id: string; label: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <button
        disabled={pending}
        onClick={() => {
          if (!confirm(`Unlock ${label}? Staff will be able to change hours in that period again.`)) return;
          setError(null);
          startTransition(async () => {
            const result = await unlockPeriod(id);
            if (result.error) setError(result.error);
          });
        }}
        className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50"
      >
        {pending ? "Unlocking…" : "Unlock"}
      </button>
    </span>
  );
}
