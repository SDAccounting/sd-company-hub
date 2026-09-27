"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getStaffAccess } from "@/lib/access";

export async function clearSampleData() {
  const access = await getStaffAccess();
  if (!access.staff || access.staff.role !== "admin") {
    throw new Error("Forbidden");
  }
  const supabase = await createClient();
  await supabase.from("time_entries").delete().eq("is_sample", true);
  revalidatePath("/timesheet/report");
  revalidatePath("/timesheet");
}
