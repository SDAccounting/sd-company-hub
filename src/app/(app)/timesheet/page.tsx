import { createClient } from "@/lib/supabase/server";
import { getStaffAccess } from "@/lib/access";
import { mondayOf, weekDays, addWeeks, formatWeekLabel, todayISO } from "@/lib/timesheet";
import type { Client, TimesheetCategory } from "@/lib/types";
import { TimesheetGrid } from "./timesheet-grid";

export const dynamic = "force-dynamic";

export default async function TimesheetPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const monday = week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? week : mondayOf(new Date());
  const days = weekDays(monday);

  const access = await getStaffAccess();
  if (!access.staff) return null;

  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("clients")
    .select("id, display_name")
    .eq("status", "active")
    .order("display_name")
    .returns<Pick<Client, "id" | "display_name">[]>();

  const { data: categories } = await supabase
    .from("timesheet_categories")
    .select("id, name, active, created_at")
    .eq("active", true)
    .order("name")
    .returns<TimesheetCategory[]>();

  const { data: entries } = await supabase
    .from("time_entries")
    .select("id, client_id, category_id, entry_date, hours, note")
    .eq("staff_id", access.staff.id)
    .gte("entry_date", days[0].date)
    .lte("entry_date", days[6].date);

  const { data: locks } = await supabase
    .from("timesheet_locks")
    .select("period_start, period_end")
    .lte("period_start", days[6].date)
    .gte("period_end", days[0].date)
    .returns<{ period_start: string; period_end: string }[]>();

  return (
    <TimesheetGrid
      key={monday}
      locks={(locks ?? []).map((l) => ({ start: l.period_start, end: l.period_end }))}
      monday={monday}
      prevWeekHref={`/timesheet?week=${addWeeks(monday, -1)}`}
      nextWeekHref={`/timesheet?week=${addWeeks(monday, 1)}`}
      weekLabel={formatWeekLabel(monday)}
      days={days}
      clients={(clients ?? []).map((c) => ({ id: c.id, name: c.display_name }))}
      categories={(categories ?? []).map((c) => ({ id: c.id, name: c.name }))}
      entries={entries ?? []}
      todayIso={todayISO()}
      canSeeReport={access.staff.role === "admin" || access.staff.role === "manager"}
    />
  );
}
