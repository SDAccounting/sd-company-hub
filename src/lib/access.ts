import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { MODULES, hasModuleAccess, type ModuleDef, type ModuleKey } from "@/lib/modules";
import type { Staff } from "@/lib/types";

export interface StaffAccess {
  staff: Staff | null;
  grantedKeys: Set<ModuleKey>;
}

/**
 * The signed-in staff member plus their module_access grants. Cached per
 * request so the layout and a page can both call it without double-querying.
 */
export const getStaffAccess = cache(async (): Promise<StaffAccess> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { staff: null, grantedKeys: new Set() };

  const { data: staff } = await supabase
    .from("staff")
    .select("id, auth_user_id, full_name, email, role, active")
    .eq("auth_user_id", user.id)
    .maybeSingle<Staff>();

  if (!staff) return { staff: null, grantedKeys: new Set() };

  const { data: grants } = await supabase
    .from("module_access")
    .select("module_key")
    .eq("staff_id", staff.id);

  return {
    staff,
    grantedKeys: new Set((grants ?? []).map((g) => g.module_key as ModuleKey)),
  };
});

export function accessibleModules(access: StaffAccess): ModuleDef[] {
  if (!access.staff) return [];
  const role = access.staff.role;
  return MODULES.filter((m) => hasModuleAccess(m, role, access.grantedKeys));
}
