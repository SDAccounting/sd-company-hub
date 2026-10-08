"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getStaffAccess } from "@/lib/access";

async function requireAdmin() {
  const access = await getStaffAccess();
  if (!access.staff || access.staff.role !== "admin") {
    throw new Error("Forbidden");
  }
  return access.staff;
}

export async function lockPeriod(_prevState: unknown, formData: FormData) {
  const admin = await requireAdmin();

  const start = String(formData.get("start") ?? "");
  const end = String(formData.get("end") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!start || !end) return { error: "Pick a start and end date." };
  if (end < start) return { error: "The end date has to be on or after the start date." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("timesheet_locks")
    .insert({ period_start: start, period_end: end, note, locked_by: admin.id });
  if (error) return { error: error.message };

  revalidatePath("/settings/timesheet-locks");
  revalidatePath("/timesheet");
  return { success: `Locked ${start} to ${end}.` };
}

export async function unlockPeriod(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("timesheet_locks").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/settings/timesheet-locks");
  revalidatePath("/timesheet");
  return {};
}
