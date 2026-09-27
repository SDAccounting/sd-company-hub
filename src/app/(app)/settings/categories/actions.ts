"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getStaffAccess } from "@/lib/access";

async function requireAdmin() {
  const access = await getStaffAccess();
  if (!access.staff || access.staff.role !== "admin") {
    throw new Error("Forbidden");
  }
}

export async function addCategory(name: string) {
  await requireAdmin();
  if (!name.trim()) return;
  const supabase = await createClient();
  await supabase.from("timesheet_categories").insert({ name: name.trim() });
  revalidatePath("/settings/categories");
  revalidatePath("/timesheet");
}

export async function renameCategory(id: string, name: string) {
  await requireAdmin();
  if (!name.trim()) return;
  const supabase = await createClient();
  await supabase.from("timesheet_categories").update({ name: name.trim() }).eq("id", id);
  revalidatePath("/settings/categories");
  revalidatePath("/timesheet");
}

export async function setCategoryActive(id: string, active: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("timesheet_categories").update({ active }).eq("id", id);
  revalidatePath("/settings/categories");
  revalidatePath("/timesheet");
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("timesheet_categories").delete().eq("id", id);
  revalidatePath("/settings/categories");
  revalidatePath("/timesheet");
}
