"use client";

import { useActionState } from "react";
import { addStaffMember } from "./actions";

export function AddStaffForm() {
  const [state, formAction, pending] = useActionState(addStaffMember, undefined);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-2 border-t border-slate-100 px-4 py-3"
    >
      <div>
        <label className="block text-xs text-slate-500">Full name</label>
        <input
          name="fullName"
          required
          className="mt-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-500">Email</label>
        <input
          name="email"
          type="email"
          required
          className="mt-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-500">Role</label>
        <select
          name="role"
          defaultValue="staff"
          className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="staff">Staff</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Inviting…" : "Invite"}
      </button>
      {state?.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
      {state && "success" in state && state.success && (
        <p className="w-full text-sm text-emerald-600">{state.success}</p>
      )}
    </form>
  );
}
