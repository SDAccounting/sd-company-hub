"use client";

import { useTransition } from "react";
import { clearSampleData } from "./actions";

export function ClearSampleButton({ sampleCount }: { sampleCount: number }) {
  const [pending, startTransition] = useTransition();

  if (sampleCount === 0) return null;

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm(`Delete all ${sampleCount} sample time entries? This can't be undone.`)) return;
        startTransition(async () => {
          await clearSampleData();
        });
      }}
      className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
    >
      {pending ? "Clearing…" : `Clear ${sampleCount} sample ${sampleCount === 1 ? "entry" : "entries"}`}
    </button>
  );
}
