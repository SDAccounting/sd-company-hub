const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** The Monday (as an ISO date string) of the week containing `date`. */
export function mondayOf(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay(); // 0 = Sun .. 6 = Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return toISODate(d);
}

export interface WeekDay {
  label: string; // "Mon"
  date: string; // ISO, e.g. "2026-09-22"
  dayOfMonth: number;
}

/** The 7 days (Mon..Sun) of the week starting at `mondayISO`. */
export function weekDays(mondayISO: string): WeekDay[] {
  const [y, m, d] = mondayISO.split("-").map(Number);
  const monday = new Date(Date.UTC(y, m - 1, d));
  return DAY_LABELS.map((label, i) => {
    const day = new Date(monday);
    day.setUTCDate(monday.getUTCDate() + i);
    return { label, date: toISODate(day), dayOfMonth: day.getUTCDate() };
  });
}

export function addWeeks(mondayISO: string, weeks: number): string {
  const [y, m, d] = mondayISO.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + weeks * 7);
  return toISODate(date);
}

export function formatWeekLabel(mondayISO: string): string {
  const days = weekDays(mondayISO);
  const start = new Date(days[0].date);
  const end = new Date(days[6].date);
  const startLabel = start.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
  const endLabel = end.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
  return `${startLabel} – ${endLabel}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}
