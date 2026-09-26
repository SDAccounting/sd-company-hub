import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currentMonthDate, formatMonthLabel, buildStatementRequestMailto } from "@/lib/close-tracker";
import type { Client, ClientClose, CloseChecklistItem, Staff } from "@/lib/types";
import { StartCloseButton } from "../start-close-button";
import { ChecklistItemRow } from "./checklist-item-row";
import { AssignmentSelect } from "./assignment-select";

export const dynamic = "force-dynamic";

export default async function ClientClosePage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .maybeSingle<Client>();

  if (!client) notFound();

  const monthDate = currentMonthDate();
  const monthLabel = formatMonthLabel(monthDate);

  const { data: close } = await supabase
    .from("client_closes")
    .select("*")
    .eq("client_id", clientId)
    .eq("month_date", monthDate)
    .maybeSingle<ClientClose>();

  const { data: items } = close
    ? await supabase
        .from("close_checklist_items")
        .select("*")
        .eq("close_id", close.id)
        .order("sort_order")
        .returns<CloseChecklistItem[]>()
    : { data: [] as CloseChecklistItem[] };

  const { data: staffList } = await supabase
    .from("staff")
    .select("id, auth_user_id, full_name, email, role, active")
    .eq("active", true)
    .order("full_name")
    .returns<Staff[]>();

  const phases = Array.from(new Set((items ?? []).map((i) => i.phase)));
  const mailto = buildStatementRequestMailto(client, monthLabel);

  return (
    <div className="space-y-4">
      <Link href="/close-tracker" className="text-sm text-slate-500 hover:text-slate-900">
        ← Close Tracker
      </Link>

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{client.display_name}</h1>
          <p className="mt-0.5 text-sm text-slate-500">{monthLabel} close</p>
        </div>
        {mailto && (
          <a
            href={mailto}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Request statements
          </a>
        )}
      </div>

      {!close ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
          <p className="text-sm text-slate-500">No close started for {monthLabel} yet.</p>
          <div className="mt-3 flex justify-center">
            <StartCloseButton clientId={client.id} />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <span className="text-xs uppercase tracking-wide text-slate-400">Preparer</span>
              <AssignmentSelect
                closeId={close.id}
                clientId={client.id}
                field="preparer_staff_id"
                staffList={staffList ?? []}
                value={close.preparer_staff_id}
              />
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <span className="text-xs uppercase tracking-wide text-slate-400">Reviewer</span>
              <AssignmentSelect
                closeId={close.id}
                clientId={client.id}
                field="reviewer_staff_id"
                staffList={staffList ?? []}
                value={close.reviewer_staff_id}
              />
            </div>
          </div>

          {phases.map((phase) => (
            <div key={phase} className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{phase}</h2>
              <ul className="mt-3 divide-y divide-slate-100">
                {items!
                  .filter((i) => i.phase === phase)
                  .map((item) => (
                    <ChecklistItemRow key={item.id} item={item} closeId={close.id} clientId={client.id} />
                  ))}
              </ul>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
