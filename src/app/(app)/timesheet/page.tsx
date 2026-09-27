// VISION MOCKUP ONLY — hardcoded sample data, no database wiring yet.
// v2: a weekly GRID (client rows x day columns), matching the QuickBooks
// Desktop Weekly Timesheet layout staff already use, rather than a
// one-at-a-time entry list.

export const dynamic = "force-dynamic";

const DAYS = [
  { label: "Mon", date: "22" },
  { label: "Tue", date: "23" },
  { label: "Wed", date: "24" },
  { label: "Thu", date: "25" },
  { label: "Fri", date: "26" },
  { label: "Sat", date: "27" },
  { label: "Sun", date: "28" },
];

interface MockRow {
  id: string;
  client: string; // "Internal / Admin" for non-client rows
  hours: (number | null)[]; // one per day, Mon..Sun
  note: string;
}

const ROWS: MockRow[] = [
  { id: "1", client: "Test Client One", hours: [4, 2.5, null, 3, null, null, null], note: "Reconciliation + follow-up" },
  { id: "2", client: "CDI Demolition Inc.", hours: [3, null, 6, null, null, null, null], note: "Categorizing + month-end close" },
  { id: "3", client: "Test Client Two", hours: [null, 5, null, null, 4, null, null], note: "HST filing + financials sent" },
  { id: "4", client: "Internal / Admin", hours: [1, null, null, 0.5, null, null, null], note: "Team meeting, email" },
];

function rowTotal(row: MockRow) {
  return row.hours.reduce((sum: number, h) => sum + (h ?? 0), 0);
}

function dayTotal(dayIndex: number) {
  return ROWS.reduce((sum, row) => sum + (row.hours[dayIndex] ?? 0), 0);
}

const grandTotal = ROWS.reduce((sum, row) => sum + rowTotal(row), 0);

export default function TimesheetMockupPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">My Timesheet</h1>
          <p className="mt-1 text-sm text-slate-500">
            Layout mockup, v2 — grid style like QuickBooks Desktop. Not wired up yet.
          </p>
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

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Notes</th>
              {DAYS.map((d) => (
                <th key={d.label} className="px-2 py-3 text-center font-medium">
                  {d.label}
                  <div className="font-normal normal-case text-slate-300">{d.date}</div>
                </th>
              ))}
              <th className="px-3 py-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2">
                  <select defaultValue={row.client} className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-900">
                    <option>{row.client}</option>
                  </select>
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    defaultValue={row.note}
                    className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-600"
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
              </tr>
            ))}
            <tr>
              <td colSpan={2} className="px-4 py-2">
                <button className="text-sm text-orange-600 hover:text-orange-700">+ Add client row</button>
              </td>
              {DAYS.map((_, i) => (
                <td key={i} />
              ))}
              <td />
            </tr>
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
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex justify-end">
        <button className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Save week
        </button>
      </div>
    </div>
  );
}
