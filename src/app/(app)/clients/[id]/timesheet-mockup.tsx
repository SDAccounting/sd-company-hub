// VISION MOCKUP ONLY — client-side state only, nothing persists yet.
// Same underlying idea as /timesheet, just filtered to one client:
// logging time here is meant to land on the logged-in staff member's
// own weekly timesheet grid too (same table, different door in).

"use client";

import { useState } from "react";

const MOCK_CATEGORIES = [
  "Month-end reconciliation",
  "Year-end tax remittance",
  "Bookkeeping catch-up",
  "Ad-hoc / client request",
  "Onboarding",
];

interface Entry {
  id: string;
  date: string;
  staff: string;
  category: string;
  hours: number;
  note: string;
}

const INITIAL_ENTRIES: Entry[] = [
  { id: "1", date: "Sep 22", staff: "Brad Kernohan", category: "Month-end reconciliation", hours: 4, note: "Reconciled bank + credit card" },
  { id: "2", date: "Sep 23", staff: "Brad Kernohan", category: "Month-end reconciliation", hours: 2.5, note: "Waiting on missing statement" },
];

export function ClientTimesheetMockup({ clientName }: { clientName: string }) {
  const [entries, setEntries] = useState(INITIAL_ENTRIES);
  const [category, setCategory] = useState("");
  const [hours, setHours] = useState("");
  const [note, setNote] = useState("");

  function addEntry() {
    if (!hours.trim()) return;
    setEntries((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        date: "Today",
        staff: "You",
        category: category.trim() || "—",
        hours: Number(hours),
        note: note.trim(),
      },
    ]);
    setCategory("");
    setHours("");
    setNote("");
  }

  const total = entries.reduce((sum, e) => sum + e.hours, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
        Logging time here adds it to <span className="font-medium text-slate-700">your own</span>{" "}
        weekly timesheet too — this is just the {clientName}-only view of it.
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          list="mock-categories-client"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category…"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:w-48"
        />
        <datalist id="mock-categories-client">
          {MOCK_CATEGORIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <input
          type="number"
          step="0.25"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          placeholder="Hours"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:w-24"
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What did you work on?"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          onClick={addEntry}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Log time
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">This month</h3>
          <span className="text-xs font-medium text-slate-500">{total} hrs total</span>
        </div>
        <ul className="divide-y divide-slate-100">
          {entries.map((e) => (
            <li key={e.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <div>
                <span className="font-medium text-slate-900">{e.date}</span>
                <span className="ml-2 text-slate-500">{e.category}</span>
                <span className="ml-2 text-slate-400">— {e.note}</span>
              </div>
              <span className="flex items-center gap-3 text-xs text-slate-400">
                <span>{e.staff}</span>
                <span className="font-medium text-slate-700">{e.hours} hrs</span>
              </span>
            </li>
          ))}
          {entries.length === 0 && (
            <li className="px-4 py-6 text-sm text-slate-400">No time logged for this client yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
