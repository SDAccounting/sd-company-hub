"use client";

import { useTransition } from "react";
import { toggleChecklistItem } from "../actions";
import type { CloseChecklistItem } from "@/lib/types";

export function ChecklistItemRow({
  item,
  closeId,
  clientId,
}: {
  item: CloseChecklistItem;
  closeId: string;
  clientId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <li className="flex items-center gap-3 py-2.5">
      <input
        type="checkbox"
        checked={item.is_done}
        disabled={pending}
        onChange={(e) => {
          const checked = e.target.checked;
          startTransition(() => toggleChecklistItem(item.id, closeId, clientId, checked));
        }}
        className="h-4 w-4 rounded border-slate-300 accent-slate-900"
      />
      <span className={`text-sm ${item.is_done ? "text-slate-400 line-through" : "text-slate-900"}`}>
        {item.title}
      </span>
    </li>
  );
}
