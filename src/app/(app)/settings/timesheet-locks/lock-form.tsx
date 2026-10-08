"use client";

import { useActionState } from "react";
import { lockPeriod } from "./actions";

export function LockForm({ suggestedStart }: { suggestedStart: string }) {
  const [state, formAction, pending] = useActionState(lockPeriod, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2 border-t border-slate-100 px-4 py-3">
      <div>
        <label className="block text-xs text-slate-500">Period start</label>
        <input
          type="date"
          name="start"
          required
          defaultValue={suggestedStart}
          className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-500">Period end</label>
        <input
          type="date"
          name="end"
          required
          className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="min-w-48 flex-1">
        <label className="block text-xs text-slate-500">Note (optional)</label>
        <input
          name="note"
          placeholder="e.g. Pay period ending Oct 15"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Locking…" : "Lock period"}
      </button>
      {state?.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
      {state && "success" in state && state.success && (
        <p className="w-full text-sm text-emerald-600">{state.success}</p>
      )}
    </form>
  );
}
