// VISION MOCKUP ONLY — client-side state only, nothing persists yet.
// v4: adds a searchable Client field and a searchable Category field
// (Double calls this concept "workstreams" — same idea, admin-managed
// list). Client/category search here uses a native <datalist> as a
// stand-in for "search or dropdown" — fine for a mockup; the real build
// can use a nicer combobox once there's real data behind it.

"use client";

import { Fragment, useState } from "react";

const DAYS = [
  { label: "Mon", date: "22" },
  { label: "Tue", date: "23" },
  { label: "Wed", date: "24" },
  { label: "Thu", date: "25" },
  { label: "Fri", date: "26" },
  { label: "Sat", date: "27" },
  { label: "Sun", date: "28" },
];

// Stand-ins for the real clients table and the admin-managed category
// list (see the Categories settings mockup at /settings/categories).
const MOCK_CLIENTS = ["Test Client One", "Test Client Two", "CDI Demolition Inc.", "Internal / Admin"];
const MOCK_CATEGORIES = [
  "Month-end reconciliation",
  "Year-end tax remittance",
  "Bookkeeping catch-up",
  "Ad-hoc / client request",
  "Onboarding",
];

interface DayNote {
  day: string; // "Mon 22"
  note: string;
}

interface MockRow {
  id: string;
  client: string;
  category: string;
  hours: (number | null)[]; // one per day, Mon..Sun
  notes: DayNote[];
}

const INITIAL_ROWS: MockRow[] = [
  {
    id: "1",
    client: "Test Client One",
    category: "Month-end reconciliation",
    hours: [4, 2.5, null, 3, null, null, null],
    notes: [
      { day: "Mon 22", note: "Reconciled bank + credit card, all clean." },
      { day: "Tue 23", note: "Waiting on a missing October statement before continuing." },
      { day: "Thu 25", note: "Reviewed P&L, flagged a $2,400 anomaly for Brad." },
    ],
  },
  {
    id: "2",
    client: "CDI Demolition Inc.",
    category: "Month-end reconciliation",
    hours: [3, null, 6, null, null, null, null],
    notes: [{ day: "Wed 24", note: "Month-end close complete, sent financials." }],
  },
  {
    id: "3",
    client: "Test Client Two",
    category: "Year-end tax remittance",
    hours: [null, 5, null, null, 4, null, null],
    notes: [],
  },
  {
    id: "4",
    client: "Internal / Admin",
    category: "Ad-hoc / client request",
    hours: [1, null, null, 0.5, null, null, null],
    notes: [],
  },
];

function rowTotal(row: MockRow) {
  return row.hours.reduce((sum: number, h) => sum + (h ?? 0), 0);
}

export default function TimesheetMockupPage() {
  const [rows, setRows] = useState(INITIAL_ROWS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [quickClient, setQuickClient] = useState("");
  const [quickCategory, setQuickCategory] = useState("");
  const [quickNote, setQuickNote] = useState("");

  function addRow() {
    if (!quickClient.trim()) return;
    setRows((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        client: quickClient.trim(),
        category: quickCategory.trim(),
        hours: [null, null, null, null, null, null, null],
        notes: quickNote.trim() ? [{ day: "Mon 22", note: quickNote.trim() }] : [],
      },
    ]);
    setQuickClient("");
    setQuickCategory("");
    setQuickNote("");
  }

  function dayTotal(dayIndex: number) {
    return rows.reduce((sum, row) => sum + (row.hours[dayIndex] ?? 0), 0);
  }

  const grandTotal = rows.reduce((sum, row) => sum + rowTotal(row), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">My Timesheet</h1>
          <p className="mt-1 text-sm text-slate-500">Layout mockup, v4 — client + category search.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-600 hover:bg-slate-50">
            ←
          </button>
          <span className="text-sm font-medium text-slate-700">Sep 22 – Sep 28, 2026</span>
          <button className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-600 hover:bg-slate-50">
            →
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Add a client to this week</h2>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            list="mock-clients"
            value={quickClient}
            onChange={(e) => setQuickClient(e.target.value)}
            placeholder="Search or pick a client…"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:w-56"
          />
          <datalist id="mock-clients">
            {MOCK_CLIENTS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>

          <input
            list="mock-categories"
            value={quickCategory}
            onChange={(e) => setQuickCategory(e.target.value)}
            placeholder="Category…"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:w-52"
          />
          <datalist id="mock-categories">
            {MOCK_CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>

          <textarea
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            placeholder="Optional note for today…"
            rows={1}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            onClick={addRow}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Add
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-2 py-3 font-medium">Category</th>
              {DAYS.map((d) => (
                <th key={d.label} className="px-2 py-3 text-center font-medium">
                  {d.label}
                  <div className="font-normal normal-case text-slate-300">{d.date}</div>
                </th>
              ))}
              <th className="px-3 py-3 text-right font-medium">Total</th>
              <th className="w-10 px-2 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Fragment key={row.id}>
                <tr className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2 font-medium text-slate-900">{row.client}</td>
                  <td className="px-2 py-2">
                    <input
                      list="mock-categories"
                      defaultValue={row.category}
                      placeholder="Category…"
                      className="w-40 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600"
                    />
                  </td>
                  {row.hours.map((h, i) => (
                    <td key={i} className="px-1 py-2">
                      <input
                        type="number"
                        step="0.25"
                        defaultValue={h ?? ""}
                        placeholder="—"
                        className="w-14 rounded-md border border-slate-200 px-1.5 py-1 text-center text-sm"
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right font-medium text-slate-900">{rowTotal(row)}</td>
                  <td className="px-2 py-2 text-center">
                    <button
                      onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                      title={row.notes.length ? `${row.notes.length} note(s)` : "No notes"}
                      className={`rounded-full px-1.5 py-0.5 text-xs ${
                        row.notes.length
                          ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                          : "text-slate-300 hover:text-slate-500"
                      }`}
                    >
                      📝{row.notes.length > 0 && ` ${row.notes.length}`}
                    </button>
                  </td>
                </tr>
                {expandedId === row.id && (
                  <tr className="bg-slate-50">
                    <td colSpan={DAYS.length + 3} className="px-6 py-3">
                      {row.notes.length > 0 ? (
                        <ul className="space-y-1.5 text-sm">
                          {row.notes.map((n, i) => (
                            <li key={i}>
                              <span className="font-medium text-slate-500">{n.day}:</span>{" "}
                              <span className="text-slate-700">{n.note}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-400">No notes yet for {row.client} this week.</p>
                      )}
                      <textarea
                        placeholder={`Add a note for ${row.client} today…`}
                        rows={2}
                        className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900">
              <td colSpan={2} className="px-4 py-2">
                Daily total
              </td>
              {DAYS.map((_, i) => (
                <td key={i} className="px-1 py-2 text-center">
                  {dayTotal(i) || "—"}
                </td>
              ))}
              <td className="px-3 py-2 text-right">{grandTotal}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
