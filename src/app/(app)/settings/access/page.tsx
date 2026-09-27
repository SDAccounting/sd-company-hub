import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStaffAccess } from "@/lib/access";
import { GRANTABLE_MODULES } from "@/lib/modules";
import type { ModuleAccessGrant, Staff } from "@/lib/types";
import { AccessToggle } from "./access-toggle";
import { SettingsNav } from "../settings-nav";

export const dynamic = "force-dynamic";

export default async function AccessSettingsPage() {
  const access = await getStaffAccess();
  if (!access.staff || access.staff.role !== "admin") {
    redirect("/");
  }

  const supabase = await createClient();

  const { data: staffList } = await supabase
    .from("staff")
    .select("id, auth_user_id, full_name, email, role, active")
    .eq("active", true)
    .order("full_name")
    .returns<Staff[]>();

  const { data: grants } = await supabase
    .from("module_access")
    .select("staff_id, module_key, granted_at, granted_by")
    .returns<ModuleAccessGrant[]>();

  const grantSet = new Set((grants ?? []).map((g) => `${g.staff_id}:${g.module_key}`));

  return (
    <div>
      <SettingsNav active="/settings/access" />
      <h1 className="text-lg font-semibold text-slate-900">Access settings</h1>
      <p className="mt-1 text-sm text-slate-500">
        Admins always have access to everything. Capacity Dashboard is
        admin-only and isn&apos;t grantable. Toggle who else can see each of
        the tools below.
      </p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3 font-medium">Staff</th>
              {GRANTABLE_MODULES.map((m) => (
                <th key={m.key} className="px-4 py-3 font-medium">
                  {m.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staffList?.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{s.full_name}</div>
                  <div className="text-xs text-slate-400">{s.role}</div>
                </td>
                {GRANTABLE_MODULES.map((m) => (
                  <td key={m.key} className="px-4 py-3">
                    {s.role === "admin" ? (
                      <span className="text-xs text-slate-400">Always</span>
                    ) : (
                      <AccessToggle
                        staffId={s.id}
                        moduleKey={m.key}
                        defaultChecked={grantSet.has(`${s.id}:${m.key}`)}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {staffList?.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-sm text-slate-500" colSpan={GRANTABLE_MODULES.length + 1}>
                  No staff yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
