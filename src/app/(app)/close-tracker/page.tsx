import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { currentMonthDate, formatMonthLabel } from "@/lib/close-tracker";
import type { Client, ClientClose, CloseChecklistItem } from "@/lib/types";
import { StartCloseButton } from "./start-close-button";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Done",
};

const STATUS_STYLE: Record<string, string> = {
  not_started: "bg-slate-100 text-slate-500",
  in_progress: "bg-amber-100 text-amber-700",
  done: "bg-emerald-100 text-emerald-700",
};

export default async function CloseTrackerPage() {
  const supabase = await createClient();
  const monthDate = currentMonthDate();
  const monthLabel = formatMonthLabel(monthDate);

  const { data: clients } = await supabase
    .from("clients")
    .select("id, display_name")
    .eq("status", "active")
    .order("display_name")
    .returns<Pick<Client, "id" | "display_name">[]>();

  const { data: closes } = await supabase
    .from("client_closes")
    .select("id, client_id, status")
    .eq("month_date", monthDate)
    .returns<Pick<ClientClose, "id" | "client_id" | "status">[]>();

  const closeIds = (closes ?? []).map((c) => c.id);
  const { data: items } = closeIds.length
    ? await supabase
        .from("close_checklist_items")
        .select("close_id, is_done")
        .in("close_id", closeIds)
        .returns<Pick<CloseChecklistItem, "close_id" | "is_done">[]>()
    : { data: [] as Pick<CloseChecklistItem, "close_id" | "is_done">[] };

  const closeByClient = new Map((closes ?? []).map((c) => [c.client_id, c]));
  const progressByClose = new Map<string, { done: number; total: number }>();
  for (const item of items ?? []) {
    const p = progressByClose.get(item.close_id) ?? { done: 0, total: 0 };
    p.total += 1;
    if (item.is_done) p.done += 1;
    progressByClose.set(item.close_id, p);
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">Close Tracker</h1>
      <p className="mt-1 text-sm text-slate-500">{monthLabel} close, all active clients.</p>

      <ul className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {clients?.map((client) => {
          const close = closeByClient.get(client.id);
          const progress = close ? progressByClose.get(close.id) : undefined;
          return (
            <li key={client.id} className="flex items-center justify-between px-4 py-3">
              {close ? (
                <Link
                  href={`/close-tracker/${client.id}`}
                  className="text-sm font-medium text-slate-900 hover:text-slate-600"
                >
                  {client.display_name}
                </Link>
              ) : (
                <span className="text-sm font-medium text-slate-900">{client.display_name}</span>
              )}

              <div className="flex items-center gap-3">
                {progress && (
                  <span className="text-xs text-slate-400">
                    {progress.done}/{progress.total} steps
                  </span>
                )}
                {close ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[close.status]}`}
                  >
                    {STATUS_LABEL[close.status]}
                  </span>
                ) : (
                  <StartCloseButton clientId={client.id} />
                )}
              </div>
            </li>
          );
        })}
        {clients?.length === 0 && (
          <li className="px-4 py-6 text-sm text-slate-500">No active clients yet.</li>
        )}
      </ul>
    </div>
  );
}
