import { createClient } from "@/lib/supabase/server";
import { getStaffAccess } from "@/lib/access";
import { toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

interface EntryRow {
  entry_date: string;
  hours: number;
  note: string | null;
  is_sample: boolean;
  staff: { full_name: string } | null;
  clients: { display_name: string } | null;
  timesheet_categories: { name: string } | null;
}

export async function GET(request: Request) {
  const access = await getStaffAccess();
  if (!access.staff || (access.staff.role !== "admin" && access.staff.role !== "manager")) {
    return new Response("Forbidden", { status: 403 });
  }

  const url = new URL(request.url);
  const from = url.searchParams.get("from") ?? "";
  const to = url.searchParams.get("to") ?? "";
  const clientId = url.searchParams.get("clientId") ?? "";
  const staffId = url.searchParams.get("staffId") ?? "";
  const categoryId = url.searchParams.get("categoryId") ?? "";

  const supabase = await createClient();

  let query = supabase
    .from("time_entries")
    .select("entry_date, hours, note, is_sample, staff(full_name), clients(display_name), timesheet_categories(name)")
    .gt("hours", 0)
    .order("entry_date");

  if (from) query = query.gte("entry_date", from);
  if (to) query = query.lte("entry_date", to);
  if (clientId === "internal") {
    query = query.is("client_id", null);
  } else if (clientId) {
    query = query.eq("client_id", clientId);
  }
  if (staffId) query = query.eq("staff_id", staffId);
  if (categoryId) query = query.eq("category_id", categoryId);

  const { data: entries } = await query.returns<EntryRow[]>();

  const csv = toCsv(
    ["Date", "Staff", "Client", "Category", "Hours", "Note", "Sample"],
    (entries ?? []).map((e) => [
      e.entry_date,
      e.staff?.full_name ?? "Unknown",
      e.clients?.display_name ?? "Internal / Admin",
      e.timesheet_categories?.name ?? "",
      e.hours,
      e.note ?? "",
      e.is_sample ? "yes" : "",
    ]),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="timesheet-${from || "all"}-to-${to || "all"}.csv"`,
    },
  });
}
