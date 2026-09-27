"use client";

import { useRef, useTransition } from "react";
import { logTime } from "../../timesheet/actions";
import { todayISO } from "@/lib/timesheet";
import type { TimesheetCategory } from "@/lib/types";

export function ClientLogTimeForm({
  clientId,
  categories,
}: {
  clientId: string;
  categories: TimesheetCategory[];
}) {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);
        const hours = Number(data.get("hours"));
        if (!hours || hours <= 0) return;
        const categoryId = String(data.get("categoryId") || "") || null;
        const note = String(data.get("note") || "").trim() || null;
        startTransition(async () => {
          await logTime({ clientId, categoryId, entryDate: todayISO(), hours, note });
          form.reset();
        });
      }}
      className="flex flex-col gap-2 sm:flex-row"
    >
      <select
        name="categoryId"
        defaultValue=""
        className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:w-48"
      >
        <option value="">Category…</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <input
        name="hours"
        type="number"
        step="0.25"
        min="0.25"
        required
        placeholder="Hours"
        className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:w-24"
      />
      <input
        name="note"
        placeholder="What did you work on?"
        className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Logging…" : "Log time"}
      </button>
    </form>
  );
}
