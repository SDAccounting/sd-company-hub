import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStaffAccess } from "@/lib/access";
import { mondayOf, formatWeekLabel } from "@/lib/timesheet";
import type { Client, Staff, TimesheetCategory } from "@/lib/types";
import { ClearSampleButton } from "./clear-sample-button";

export const dynamic = "force-dynamic";

interface EntryRow {
  hours: number;
  entry_date: string;
  is_sample: boolean;
  staff: { full_name: string } | null;
  clients: { display_name: string } | null;
}

function monthAgoISO() {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - 1);
  return d.toISOString().slice(0, 10);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default async function TimesheetReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; clientId?: string; staffId?: string; categoryId?: string }>;
}) {
  const access = await getStaffAccess();
  if (!access.staff || (access.staff.role !== "admin" && access.staff.role !== "manager")) {
    redirect("/");
  }

  const params = await searchParams;
  const from = params.from || monthAgoISO();
  const to = params.to || todayISO();

  const supabase = await createClient();

  const [{ data: clients }, { data: staffList }, { data: categories }] = await Promise.all([
    supabase.from("clients").select("id, display_name").order("display_name").returns<Pick<Client, "id" | "display_name">[]>(),
    supabase.from("staff").select("id, full_name").eq("active", true).order("full_name").returns<Pick<Staff, "id" | "full_name">[]>(),
    supabase.from("timesheet_categories").select("id, name").order("name").returns<Pick<TimesheetCategory, "id" | "name">[]>(),
  ]);

  let query = supabase
    .from("time_entries")
    .select("hours, entry_date, is_sample, staff(full_name), clients(display_name)")
    .gt("hours", 0)
    .gte("entry_date", from)
    .lte("entry_date", to);

  if (params.clientId === "internal") {
    query = query.is("client_id", null);
  } else if (params.clientId) {
    query = query.eq("client_id", params.clientId);
  }
  if (params.staffId) query = query.eq("staff_id", params.staffId);
  if (params.categoryId) query = query.eq("category_id", params.categoryId);

  const { data: entries } = await query.returns<EntryRow[]>();

  const byStaffWeek = new Map<string, { staffName: string; weekMonday: string; hours: number }>();
  const byClient = new Map<string, number>();
  let sampleCount = 0;

  for (const e of entries ?? []) {
    if (e.is_sample) sampleCount += 1;
    const staffName = e.staff?.full_name ?? "Unknown";
    const weekMonday = mondayOf(new Date(e.entry_date));
    const key = `${staffName}|${weekMonday}`;
    const existing = byStaffWeek.get(key) ?? { staffName, weekMonday, hours: 0 };
    existing.hours += Number(e.hours);
    byStaffWeek.set(key, existing);

    const clientName = e.clients?.display_name ?? "Internal / Admin";
    byClient.set(clientName, (byClient.get(clientName) ?? 0) + Number(e.hours));
  }

  const staffWeekRows = [...byStaffWeek.values()].sort(
    (a, b) => a.staffName.localeCompare(b.staffName) || a.weekMonday.localeCompare(b.weekMonday),
  );
  const clientRows = [...byClient.entries()].sort((a, b) => b[1] - a[1]);
  const grandTotal = clientRows.reduce((sum, [, h]) => sum + h, 0);

  const exportQuery = new URLSearchParams({
    from,
    to,
    ...(params.clientId ? { clientId: params.clientId } : {}),
    ...(params.staffId ? { staffId: params.staffId } : {}),
    ...(params.categoryId ? { categoryId: params.categoryId } : {}),
  }).toString();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Timesheet report</h1>
          <p className="mt-1 text-sm text-slate-500">
            {from} – {to} · {grandTotal.toFixed(2)} hrs total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ClearSampleButton sampleCount={sampleCount} />
          <a
            href={`/timesheet/report/export?${exportQuery}`}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Export CSV
          </a>
          <Link href="/timesheet" className="text-sm text-slate-500 hover:text-slate-700">
            ← Back to timesheet
          </Link>
        </div>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <label className="block text-xs text-slate-500">From</label>
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500">To</label>
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500">Client</label>
          <select
            name="clientId"
            defaultValue={params.clientId ?? ""}
            className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">All clients</option>
            <option value="internal">Internal / Admin</option>
            {clients?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.display_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500">Staff</label>
          <select
            name="staffId"
            defaultValue={params.staffId ?? ""}
            className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">All staff</option>
            {staffList?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500">Category</label>
          <select
            name="categoryId"
            defaultValue={params.categoryId ?? ""}
            className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">All categories</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Apply filters
        </button>
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white">
          <h2 className="border-b border-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Hours by staff, by week
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2 font-medium">Staff</th>
                <th className="px-2 py-2 font-medium">Week of</th>
                <th className="px-4 py-2 text-right font-medium">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffWeekRows.map((r) => (
                <tr key={`${r.staffName}|${r.weekMonday}`}>
                  <td className="px-4 py-2 text-slate-900">{r.staffName}</td>
                  <td className="px-2 py-2 text-slate-500">{formatWeekLabel(r.weekMonday)}</td>
                  <td className="px-4 py-2 text-right font-medium text-slate-900">{r.hours.toFixed(2)}</td>
                </tr>
              ))}
              {staffWeekRows.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-sm text-slate-400">
                    No entries in this range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white">
          <h2 className="border-b border-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Hours by client
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2 font-medium">Client</th>
                <th className="px-4 py-2 text-right font-medium">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clientRows.map(([name, hours]) => (
                <tr key={name}>
                  <td className="px-4 py-2 text-slate-900">{name}</td>
                  <td className="px-4 py-2 text-right font-medium text-slate-900">{hours.toFixed(2)}</td>
                </tr>
              ))}
              {clientRows.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-6 text-sm text-slate-400">
                    No entries in this range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
