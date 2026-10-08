import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStaffAccess } from "@/lib/access";
import { SettingsNav } from "../settings-nav";
import { LockForm } from "./lock-form";
import { UnlockButton } from "./unlock-button";

export const dynamic = "force-dynamic";

interface LockRow {
  id: string;
  period_start: string;
  period_end: string;
  note: string | null;
  locked_at: string;
  staff: { full_name: string } | null;
}

function dayAfter(iso: string) {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default async function TimesheetLocksPage() {
  const access = await getStaffAccess();
  if (!access.staff || access.staff.role !== "admin") {
    redirect("/");
  }

  const supabase = await createClient();
  const { data: locks } = await supabase
    .from("timesheet_locks")
    .select("id, period_start, period_end, note, locked_at, staff:locked_by(full_name)")
    .order("period_start", { ascending: false })
    .returns<LockRow[]>();

  const latestEnd = (locks ?? []).reduce((max, l) => (l.period_end > max ? l.period_end : max), "");
  const suggestedStart = latestEnd ? dayAfter(latestEnd) : "";

  return (
    <div>
      <SettingsNav active="/settings/timesheet-locks" />
      <h1 className="text-lg font-semibold text-slate-900">Timesheet locks</h1>
      <p className="mt-1 text-sm text-slate-500">
        Lock a pay period once it&apos;s been processed. Nobody — staff or admins — can add, change or delete hours
        dated inside a locked period until you unlock it here.
      </p>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white">
        <ul className="divide-y divide-slate-100">
          {locks?.map((l) => (
            <li key={l.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-sm font-medium text-slate-900">
                  🔒 {l.period_start} → {l.period_end}
                </div>
                <div className="text-xs text-slate-400">
                  Locked {new Date(l.locked_at).toLocaleDateString("en-CA")}
                  {l.staff?.full_name && ` by ${l.staff.full_name}`}
                  {l.note && ` · ${l.note}`}
                </div>
              </div>
              <UnlockButton id={l.id} label={`${l.period_start} → ${l.period_end}`} />
            </li>
          ))}
          {(!locks || locks.length === 0) && (
            <li className="px-4 py-6 text-sm text-slate-500">No periods locked yet.</li>
          )}
        </ul>
        <LockForm suggestedStart={suggestedStart} />
      </div>
    </div>
  );
}
