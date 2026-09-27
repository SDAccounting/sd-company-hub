"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffAccess } from "@/lib/access";
import type { StaffRole } from "@/lib/types";

async function requireAdmin() {
  const access = await getStaffAccess();
  if (!access.staff || access.staff.role !== "admin") {
    throw new Error("Forbidden");
  }
  return access.staff;
}

export async function addStaffMember(_prevState: unknown, formData: FormData) {
  await requireAdmin();

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "staff") as StaffRole;

  if (!fullName || !email) {
    return { error: "Enter a name and email." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email);
  if (error || !data.user) {
    return { error: error?.message ?? "Couldn't create the auth account." };
  }

  const supabase = await createClient();
  const { error: insertError } = await supabase.from("staff").insert({
    auth_user_id: data.user.id,
    full_name: fullName,
    email,
    role,
  });
  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath("/settings/staff");
  return { success: `Invited ${email}.` };
}

export async function setStaffActive(staffId: string, active: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("staff").update({ active }).eq("id", staffId);
  if (error) throw new Error(error.message);
  revalidatePath("/settings/staff");
}

export async function setStaffRole(staffId: string, role: StaffRole) {
  const admin = await requireAdmin();
  if (admin.id === staffId && role !== "admin") {
    throw new Error("You can't demote your own account");
  }
  const supabase = await createClient();
  const { error } = await supabase.from("staff").update({ role }).eq("id", staffId);
  if (error) throw new Error(error.message);
  revalidatePath("/settings/staff");
}
