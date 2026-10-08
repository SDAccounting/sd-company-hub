"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getStaffAccess } from "@/lib/access";

export async function clearSampleData(): Promise<{ error?: string }> {
  const access = await getStaffAccess();
  if (!access.staff || access.staff.role !== "admin") {
    throw new Error("Forbidden");
  }
  const supabase = await createClient();
  const { error } = await supabase.from("time_entries").delete().eq("is_sample", true);
  if (error) return { error: error.message };
  revalidatePath("/timesheet/report");
  revalidatePath("/timesheet");
  return {};
}
