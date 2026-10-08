"use client";

import { useState, useTransition } from "react";
import { clearSampleData } from "./actions";

export function ClearSampleButton({ sampleCount }: { sampleCount: number }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (sampleCount === 0) return null;

  return (
    <span className="flex items-center gap-2">
      {error && <span className="max-w-64 text-xs text-red-600">{error}</span>}
      <button
        disabled={pending}
        onClick={() => {
          if (!confirm(`Delete all ${sampleCount} sample time entries? This can't be undone.`)) return;
          setError(null);
          startTransition(async () => {
            const result = await clearSampleData();
            if (result.error) setError(result.error);
          });
        }}
        className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
      >
        {pending ? "Clearing…" : `Clear ${sampleCount} sample ${sampleCount === 1 ? "entry" : "entries"}`}
      </button>
    </span>
  );
}
