"use client";

import { useTransition } from "react";
import { setModuleAccess } from "./actions";

export function AccessToggle({
  staffId,
  moduleKey,
  defaultChecked,
}: {
  staffId: string;
  moduleKey: string;
  defaultChecked: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <input
      type="checkbox"
      defaultChecked={defaultChecked}
      disabled={pending}
      aria-label={`Grant ${moduleKey} access`}
      onChange={(e) => {
        const checked = e.target.checked;
        startTransition(async () => {
          await setModuleAccess(staffId, moduleKey, checked);
        });
      }}
      className="h-4 w-4 rounded border-slate-300 accent-slate-900 disabled:opacity-50"
    />
  );
}
