"use client";

import { useTransition } from "react";
import { startClose } from "./actions";

export function StartCloseButton({ clientId }: { clientId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => startClose(clientId))}
      className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
    >
      {pending ? "Starting…" : "Start close"}
    </button>
  );
}
