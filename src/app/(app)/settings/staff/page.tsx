import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStaffAccess } from "@/lib/access";
import type { Staff } from "@/lib/types";
import { SettingsNav } from "../settings-nav";
import { StaffRow } from "./staff-row";
import { AddStaffForm } from "./add-staff-form";

export const dynamic = "force-dynamic";

export default async function StaffSettingsPage() {
  const access = await getStaffAccess();
  if (!access.staff || access.staff.role !== "admin") {
    redirect("/");
  }

  const supabase = await createClient();
  const { data: staffList } = await supabase
    .from("staff")
    .select("id, auth_user_id, full_name, email, role, active")
    .order("active", { ascending: false })
    .order("full_name")
    .returns<Staff[]>();

  return (
    <div>
      <SettingsNav active="/settings/staff" />
      <h1 className="text-lg font-semibold text-slate-900">Staff</h1>
      <p className="mt-1 text-sm text-slate-500">
        Invite new staff, change roles, or remove someone&apos;s access.
        Removing keeps their history (tasks, timesheets, close checklists)
        intact — they just can&apos;t sign in anymore.
      </p>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white">
        <ul className="divide-y divide-slate-100">
          {staffList?.map((s) => (
            <li key={s.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className={`text-sm font-medium ${s.active ? "text-slate-900" : "text-slate-400 line-through"}`}>
                  {s.full_name}
                </div>
                <div className="text-xs text-slate-400">{s.email}</div>
              </div>
              <StaffRow
                staffId={s.id}
                role={s.role}
                active={s.active}
                isSelf={s.id === access.staff!.id}
              />
            </li>
          ))}
          {staffList?.length === 0 && (
            <li className="px-4 py-6 text-sm text-slate-500">No staff yet.</li>
          )}
        </ul>
        <AddStaffForm />
      </div>
    </div>
  );
}
