"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { logTime, deleteRow } from "./actions";
import type { WeekDay } from "@/lib/timesheet";

interface EntryFromServer {
  id: string;
  client_id: string | null;
  category_id: string | null;
  entry_date: string;
  hours: number;
  note: string | null;
}

interface Option {
  id: string;
  name: string;
}

interface GridRow {
  key: string; // `${clientId}|${categoryId}`
  clientId: string | null;
  categoryId: string | null;
  clientName: string;
  categoryName: string;
  hours: (number | null)[]; // per day, Mon..Sun
  notes: (string | null)[];
}

function rowKey(clientId: string | null, categoryId: string | null) {
  return `${clientId ?? "none"}|${categoryId ?? "none"}`;
}

function sortRows(rows: GridRow[]) {
  return [...rows].sort((a, b) => a.clientName.localeCompare(b.clientName));
}

function buildRows(
  entries: EntryFromServer[],
  days: WeekDay[],
  clientNames: Map<string, string>,
  categoryNames: Map<string, string>,
): GridRow[] {
  const byKey = new Map<string, GridRow>();
  for (const e of entries) {
    const key = rowKey(e.client_id, e.category_id);
    let row = byKey.get(key);
    if (!row) {
      row = {
        key,
        clientId: e.client_id,
        categoryId: e.category_id,
        clientName: e.client_id ? clientNames.get(e.client_id) ?? "Unknown client" : "Internal / Admin",
        categoryName: e.category_id ? categoryNames.get(e.category_id) ?? "—" : "—",
        hours: days.map(() => null),
        notes: days.map(() => null),
      };
      byKey.set(key, row);
    }
    const dayIndex = days.findIndex((d) => d.date === e.entry_date);
    if (dayIndex >= 0) {
      row.hours[dayIndex] = e.hours > 0 ? e.hours : null;
      row.notes[dayIndex] = e.note;
    }
  }
  return sortRows([...byKey.values()]);
}

export function TimesheetGrid({
  monday,
  prevWeekHref,
  nextWeekHref,
  weekLabel,
  days,
  clients,
  categories,
  entries,
  todayIso,
  canSeeReport,
  locks,
}: {
  monday: string;
  prevWeekHref: string;
  nextWeekHref: string;
  weekLabel: string;
  days: WeekDay[];
  clients: Option[];
  categories: Option[];
  entries: EntryFromServer[];
  todayIso: string;
  canSeeReport: boolean;
  locks: { start: string; end: string }[];
}) {
  const [, startTransition] = useTransition();
  const clientNames = useMemo(() => new Map(clients.map((c) => [c.id, c.name])), [clients]);
  const categoryNames = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

  const [rows, setRows] = useState<GridRow[]>(() => buildRows(entries, days, clientNames, categoryNames));
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [quickClientId, setQuickClientId] = useState("");
  const [quickCategoryId, setQuickCategoryId] = useState("");
  const [quickNote, setQuickNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const lockedDays = days.map((d) => locks.some((l) => d.date >= l.start && d.date <= l.end));
  const anyLocked = lockedDays.some(Boolean);

  const todayIndex = days.findIndex((d) => d.date === todayIso);
  const preferredIndex = todayIndex >= 0 ? todayIndex : 0;
  const defaultDayIndex = !lockedDays[preferredIndex] ? preferredIndex : lockedDays.findIndex((l) => !l);

  function persist(action: () => Promise<{ error?: string }>, revert: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
        revert();
      }
    });
  }

  function addRow() {
    if (defaultDayIndex < 0 || !quickClientId) return;
    const clientId = quickClientId === "internal" ? null : quickClientId;
    const categoryId = quickCategoryId || null;
    const key = rowKey(clientId, categoryId);
    const alreadyThere = rows.some((r) => r.key === key);
    const note = quickNote.trim();

    if (!alreadyThere) {
      setRows((prev) =>
        sortRows([
          ...prev,
          {
            key,
            clientId,
            categoryId,
            clientName: clientId ? clientNames.get(clientId) ?? "Unknown client" : "Internal / Admin",
            categoryName: categoryId ? categoryNames.get(categoryId) ?? "—" : "—",
            hours: days.map(() => null),
            notes: days.map((_, i) => (i === defaultDayIndex && note ? note : null)),
          },
        ]),
      );
    }

    persist(
      () =>
        logTime({
          clientId,
          categoryId,
          entryDate: days[defaultDayIndex].date,
          hours: 0,
          note: note || null,
        }),
      () => {
        if (!alreadyThere) setRows((prev) => prev.filter((r) => r.key !== key));
      },
    );

    setQuickClientId("");
    setQuickCategoryId("");
    setQuickNote("");
  }

  function editHours(row: GridRow, dayIndex: number, value: string) {
    const parsed = value === "" ? 0 : Number(value);
    const hours = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    const previous = row.hours[dayIndex];
    if ((previous ?? 0) === hours) return;

    setRows((prev) =>
      prev.map((r) =>
        r.key === row.key
          ? { ...r, hours: r.hours.map((h, i) => (i === dayIndex ? (hours > 0 ? hours : null) : h)) }
          : r,
      ),
    );
    persist(
      () =>
        logTime({
          clientId: row.clientId,
          categoryId: row.categoryId,
          entryDate: days[dayIndex].date,
          hours,
        }),
      () =>
        setRows((prev) =>
          prev.map((r) =>
            r.key === row.key ? { ...r, hours: r.hours.map((h, i) => (i === dayIndex ? previous : h)) } : r,
          ),
        ),
    );
  }

  function editNote(row: GridRow, dayIndex: number, value: string) {
    const previous = row.notes[dayIndex];
    const next = value.trim() || null;
    if ((previous ?? null) === next) return;

    setRows((prev) =>
      prev.map((r) => (r.key === row.key ? { ...r, notes: r.notes.map((n, i) => (i === dayIndex ? next : n)) } : r)),
    );
    persist(
      () =>
        logTime({
          clientId: row.clientId,
          categoryId: row.categoryId,
          entryDate: days[dayIndex].date,
          note: next,
        }),
      () =>
        setRows((prev) =>
          prev.map((r) => (r.key === row.key ? { ...r, notes: r.notes.map((n, i) => (i === dayIndex ? previous : n)) } : r)),
        ),
    );
  }

  function removeRow(row: GridRow) {
    if (!confirm(`Remove ${row.clientName} / ${row.categoryName} from this week? This deletes the logged hours.`)) {
      return;
    }
    setRows((prev) => prev.filter((r) => r.key !== row.key));
    persist(
      () => deleteRow(row.clientId, row.categoryId, monday),
      () => setRows((prev) => sortRows([...prev, row])),
    );
  }

  function rowTotal(row: GridRow) {
    return row.hours.reduce((sum: number, h) => sum + (h ?? 0), 0);
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
          <p className="mt-1 text-sm text-slate-500">Only you (and admins) can see your hours. Entries save as you type.</p>
        </div>
        <div className="flex items-center gap-3">
          {canSeeReport && (
            <Link href="/timesheet/report" className="text-sm text-slate-500 hover:text-slate-700">
              Report →
            </Link>
          )}
          <Link
            href={prevWeekHref}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-600 hover:bg-slate-50"
          >
            ←
          </Link>
          <span className="text-sm font-medium text-slate-700">{weekLabel}</span>
          <Link
            href={nextWeekHref}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-600 hover:bg-slate-50"
          >
            →
          </Link>
        </div>
      </div>

      {anyLocked && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          🔒 {lockedDays.every(Boolean) ? "This whole week is" : "Days marked 🔒 are"} in a closed pay period and can no
          longer be changed. Ask an admin if something needs correcting.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          Couldn&apos;t save that change: {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Add a client to this week</h2>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <select
            value={quickClientId}
            onChange={(e) => setQuickClientId(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:w-56"
          >
            <option value="">Pick a client…</option>
            <option value="internal">Internal / Admin</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={quickCategoryId}
            onChange={(e) => setQuickCategoryId(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:w-52"
          >
            <option value="">Category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <textarea
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            placeholder="Optional note for today…"
            rows={1}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            onClick={addRow}
            disabled={defaultDayIndex < 0}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-40"
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
              {days.map((d, i) => (
                <th key={d.label} className="px-2 py-3 text-center font-medium">
                  {d.label}
                  <div className="font-normal normal-case text-slate-300">
                    {d.dayOfMonth}
                    {lockedDays[i] && " 🔒"}
                  </div>
                </th>
              ))}
              <th className="px-3 py-3 text-right font-medium">Total</th>
              <th className="w-16 px-2 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const noteCount = row.notes.filter(Boolean).length;
              return (
                <Fragment key={row.key}>
                  <tr className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2 font-medium text-slate-900">{row.clientName}</td>
                    <td className="px-2 py-2 text-xs text-slate-600">{row.categoryName}</td>
                    {row.hours.map((h, i) => (
                      <td key={`${i}-${h ?? ""}`} className="px-1 py-2">
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          defaultValue={h ?? ""}
                          disabled={lockedDays[i]}
                          onBlur={(e) => editHours(row, i, e.target.value)}
                          placeholder="—"
                          className="w-14 rounded-md border border-slate-200 px-1.5 py-1 text-center text-sm disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right font-medium text-slate-900">{rowTotal(row)}</td>
                    <td className="px-2 py-2 text-center">
                      <button
                        onClick={() => setExpandedKey(expandedKey === row.key ? null : row.key)}
                        title={noteCount ? `${noteCount} note(s)` : "No notes"}
                        className={`rounded-full px-1.5 py-0.5 text-xs ${
                          noteCount
                            ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                            : "text-slate-300 hover:text-slate-500"
                        }`}
                      >
                        📝{noteCount > 0 && ` ${noteCount}`}
                      </button>
                      <button
                        onClick={() => removeRow(row)}
                        disabled={anyLocked}
                        title={anyLocked ? "Can't remove — part of this week is locked" : "Remove this row"}
                        className="ml-1 text-xs text-slate-300 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-slate-300"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                  {expandedKey === row.key && (
                    <tr className="bg-slate-50">
                      <td colSpan={days.length + 3} className="px-6 py-3">
                        {noteCount > 0 ? (
                          <ul className="space-y-1.5 text-sm">
                            {row.notes.map(
                              (n, i) =>
                                n && (
                                  <li key={i}>
                                    <span className="font-medium text-slate-500">
                                      {days[i].label} {days[i].dayOfMonth}:
                                    </span>{" "}
                                    <span className="text-slate-700">{n}</span>
                                  </li>
                                ),
                            )}
                          </ul>
                        ) : (
                          <p className="text-sm text-slate-400">No notes yet for {row.clientName} this week.</p>
                        )}
                        {defaultDayIndex >= 0 && (
                          <textarea
                            key={`${row.key}-${row.notes[defaultDayIndex] ?? ""}`}
                            defaultValue={row.notes[defaultDayIndex] ?? ""}
                            onBlur={(e) => editNote(row, defaultDayIndex, e.target.value)}
                            placeholder={`Add a note for ${row.clientName} on ${days[defaultDayIndex].label} ${days[defaultDayIndex].dayOfMonth}…`}
                            rows={2}
                            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                          />
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={days.length + 3} className="px-4 py-6 text-sm text-slate-400">
                  Nothing logged this week yet — add a client above to get started.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900">
              <td colSpan={2} className="px-4 py-2">
                Daily total
              </td>
              {days.map((_, i) => (
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
