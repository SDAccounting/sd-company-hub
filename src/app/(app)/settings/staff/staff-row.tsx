"use client";

import { useTransition } from "react";
import { setStaffActive, setStaffRole } from "./actions";
import type { StaffRole } from "@/lib/types";

export function StaffRow({
  staffId,
  role,
  active,
  isSelf,
}: {
  staffId: string;
  role: StaffRole;
  active: boolean;
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3">
      <select
        defaultValue={role}
        disabled={pending || isSelf}
        onChange={(e) => {
          const value = e.target.value as StaffRole;
          startTransition(async () => {
            await setStaffRole(staffId, value);
          });
        }}
        className="rounded-md border border-slate-300 px-2 py-1 text-xs disabled:opacity-50"
      >
        <option value="staff">Staff</option>
        <option value="manager">Manager</option>
        <option value="admin">Admin</option>
      </select>
      <button
        disabled={pending || isSelf}
        onClick={() => {
          if (active && !confirm("Remove this person's access? They keep their history, but can't sign in.")) return;
          startTransition(async () => {
            await setStaffActive(staffId, !active);
          });
        }}
        className={`text-xs disabled:opacity-50 ${
          active ? "text-red-400 hover:text-red-600" : "text-slate-400 hover:text-slate-700"
        }`}
      >
        {active ? "Remove" : "Reactivate"}
      </button>
    </div>
  );
}
