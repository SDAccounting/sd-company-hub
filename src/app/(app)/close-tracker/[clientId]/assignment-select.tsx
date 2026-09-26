"use client";

import { useTransition } from "react";
import { setCloseAssignment } from "../actions";
import type { Staff } from "@/lib/types";

export function AssignmentSelect({
  closeId,
  clientId,
  field,
  staffList,
  value,
}: {
  closeId: string;
  clientId: string;
  field: "preparer_staff_id" | "reviewer_staff_id";
  staffList: Staff[];
  value: string | null;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={value ?? ""}
      disabled={pending}
      onChange={(e) => {
        const staffId = e.target.value || null;
        startTransition(() => setCloseAssignment(closeId, clientId, field, staffId));
      }}
      className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none disabled:opacity-50"
    >
      <option value="">— Unassigned —</option>
      {staffList.map((s) => (
        <option key={s.id} value={s.id}>
          {s.full_name}
        </option>
      ))}
    </select>
  );
}
