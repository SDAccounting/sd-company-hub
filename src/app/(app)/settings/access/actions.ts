"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getStaffAccess } from "@/lib/access";
import { GRANTABLE_MODULES } from "@/lib/modules";

export async function setModuleAccess(staffId: string, moduleKey: string, granted: boolean) {
  const access = await getStaffAccess();
  if (!access.staff || access.staff.role !== "admin") {
    throw new Error("Forbidden");
  }
  if (!GRANTABLE_MODULES.some((m) => m.key === moduleKey)) {
    throw new Error("Not a grantable module");
  }

  const supabase = await createClient();

  if (granted) {
    await supabase
      .from("module_access")
      .upsert({ staff_id: staffId, module_key: moduleKey, granted_by: access.staff.id });
  } else {
    await supabase
      .from("module_access")
      .delete()
      .eq("staff_id", staffId)
      .eq("module_key", moduleKey);
  }

  revalidatePath("/settings/access");
}
