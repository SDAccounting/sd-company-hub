// VISION MOCKUP ONLY — hardcoded sample data, no database wiring yet.
// Purely for Brad to react to the layout before any schema/build work.

export const dynamic = "force-dynamic";

interface MockEntry {
  id: string;
  client: string | null; // null = internal/admin, no client
  hours: number;
  notes: string;
}

interface MockDay {
  label: string; // "Monday"
  date: string; // "Sep 22"
  entries: MockEntry[];
}

const WEEK: MockDay[] = [
  {
    label: "Monday",
    date: "Sep 22",
    entries: [
      { id: "1", client: "Test Client One", hours: 4, notes: "Reconciled bank + credit card" },
      { id: "2", client: "CDI Demolition Inc.", hours: 3, notes: "Categorized September transactions" },
      { id: "3", client: null, hours: 1, notes: "Team meeting" },
    ],
  },
  {
    label: "Tuesday",
    date: "Sep 23",
    entries: [
      { id: "4", client: "Test Client Two", hours: 5, notes: "HST filing prep" },
      { id: "5", client: "Test Client One", hours: 2.5, notes: "Follow-up on missing statements" },
    ],
  },
  {
    label: "Wednesday",
    date: "Sep 24",
    entries: [
      { id: "6", client: "CDI Demolition Inc.", hours: 6, notes: "Month-end close" },
    ],
  },
  {
    label: "Thursday",
    date: "Sep 25",
    entries: [
      { id: "7", client: "Test Client One", hours: 3, notes: "Review P&L for anomalies" },
      { id: "8", client: null, hours: 0.5, notes: "Admin / email" },
    ],
  },
  {
    label: "Friday",
    date: "Sep 26",
    entries: [
      { id: "9", client: "Test Client Two", hours: 4, notes: "Financials sent to client" },
    ],
  },
  { label: "Saturday", date: "Sep 27", entries: [] },
  { label: "Sunday", date: "Sep 28", entries: [] },
];

function dayTotal(day: MockDay) {
  return day.entries.reduce((sum, e) => sum + e.hours, 0);
}

const CLIENT_OPTIONS = ["Test Client One", "Test Client Two", "CDI Demolition Inc.", "— Internal / Admin —"];

export default function TimesheetMockupPage() {
  const weekTotal = WEEK.reduce((sum, d) => sum + dayTotal(d), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">My Timesheet</h1>
          <p className="mt-1 text-sm text-slate-500">Layout mockup — not wired up yet.</p>
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

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Log time</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <input
            type="date"
            defaultValue="2026-09-26"
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <select className="rounded-md border border-slate-300 px-2 py-1.5 text-sm sm:col-span-2" defaultValue="">
            <option value="" disabled>
              Client…
            </option>
            {CLIENT_OPTIONS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input
            type="number"
            step="0.25"
            placeholder="Hours"
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <input
            type="text"
            placeholder="What did you work on?"
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm sm:col-span-4"
          />
          <button className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800">
            Add
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">This week</h2>
          <span className="text-sm font-medium text-slate-500">{weekTotal} hrs total</span>
        </div>
        <div className="divide-y divide-slate-100">
          {WEEK.map((day) => (
            <div key={day.label} className="px-5 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-900">
                  {day.label} <span className="text-slate-400">· {day.date}</span>
                </span>
                <span className="text-xs text-slate-400">
                  {dayTotal(day) > 0 ? `${dayTotal(day)} hrs` : "—"}
                </span>
              </div>
              {day.entries.length > 0 ? (
                <ul className="mt-2 space-y-1.5">
                  {day.entries.map((e) => (
                    <li key={e.id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">
                        <span className="font-medium text-slate-900">{e.client ?? "Internal / Admin"}</span>
                        <span className="text-slate-400"> — {e.notes}</span>
                      </span>
                      <span className="flex items-center gap-3">
                        <span className="text-slate-500">{e.hours} hrs</span>
                        <button className="text-xs text-slate-400 hover:text-slate-700">Edit</button>
                        <button className="text-xs text-slate-400 hover:text-red-600">Remove</button>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-xs text-slate-300">No entries</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
