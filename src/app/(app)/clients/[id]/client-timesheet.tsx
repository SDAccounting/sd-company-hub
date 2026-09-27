import { createClient } from "@/lib/supabase/server";
import type { TimesheetCategory } from "@/lib/types";
import { ClientLogTimeForm } from "./client-log-time-form";

interface EntryRow {
  id: string;
  entry_date: string;
  hours: number;
  note: string | null;
  staff: { full_name: string } | null;
  timesheet_categories: { name: string } | null;
}

export async function ClientTimesheet({ clientId, clientName }: { clientId: string; clientName: string }) {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("timesheet_categories")
    .select("id, name, active, created_at")
    .eq("active", true)
    .order("name")
    .returns<TimesheetCategory[]>();

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  const monthStartISO = monthStart.toISOString().slice(0, 10);

  const { data: entries } = await supabase
    .from("time_entries")
    .select("id, entry_date, hours, note, staff(full_name), timesheet_categories(name)")
    .eq("client_id", clientId)
    .gt("hours", 0)
    .gte("entry_date", monthStartISO)
    .order("entry_date", { ascending: false })
    .returns<EntryRow[]>();

  const total = (entries ?? []).reduce((sum, e) => sum + Number(e.hours), 0);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
        Logging time here adds it to <span className="font-medium text-slate-700">your own</span> weekly
        timesheet too — this is just the {clientName}-only view of it.
      </div>

      <ClientLogTimeForm clientId={clientId} categories={categories ?? []} />

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">This month</h3>
          <span className="text-xs font-medium text-slate-500">{total} hrs total</span>
        </div>
        <ul className="divide-y divide-slate-100">
          {entries?.map((e) => (
            <li key={e.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <div>
                <span className="font-medium text-slate-900">{e.entry_date}</span>
                <span className="ml-2 text-slate-500">{e.timesheet_categories?.name ?? "—"}</span>
                {e.note && <span className="ml-2 text-slate-400">— {e.note}</span>}
              </div>
              <span className="flex items-center gap-3 text-xs text-slate-400">
                <span>{e.staff?.full_name}</span>
                <span className="font-medium text-slate-700">{e.hours} hrs</span>
              </span>
            </li>
          ))}
          {(!entries || entries.length === 0) && (
            <li className="px-4 py-6 text-sm text-slate-400">No time logged for this client yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
