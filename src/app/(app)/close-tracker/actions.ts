"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { currentMonthDate } from "@/lib/close-tracker";
import type { CloseChecklistTemplateItem, CloseStatus } from "@/lib/types";

/** Creates this month's close for a client, copying its checklist template. */
export async function startClose(clientId: string) {
  const supabase = await createClient();
  const monthDate = currentMonthDate();

  const { data: client } = await supabase
    .from("clients")
    .select("close_checklist_template_id")
    .eq("id", clientId)
    .maybeSingle();

  let templateId = client?.close_checklist_template_id ?? null;
  if (!templateId) {
    const { data: defaultTemplate } = await supabase
      .from("close_checklist_templates")
      .select("id")
      .eq("is_default", true)
      .maybeSingle();
    templateId = defaultTemplate?.id ?? null;
  }

  const { data: close, error } = await supabase
    .from("client_closes")
    .insert({ client_id: clientId, month_date: monthDate, status: "in_progress", started_at: new Date().toISOString() })
    .select("id")
    .single();

  if (error) throw new Error(`Couldn't start close: ${error.message}`);

  if (templateId) {
    const { data: templateItems } = await supabase
      .from("close_checklist_template_items")
      .select("phase, title, sort_order")
      .eq("template_id", templateId)
      .order("sort_order")
      .returns<Pick<CloseChecklistTemplateItem, "phase" | "title" | "sort_order">[]>();

    if (templateItems && templateItems.length > 0) {
      await supabase.from("close_checklist_items").insert(
        templateItems.map((item) => ({
          close_id: close.id,
          phase: item.phase,
          title: item.title,
          sort_order: item.sort_order,
        })),
      );
    }
  }

  revalidatePath("/close-tracker");
  revalidatePath(`/close-tracker/${clientId}`);
}

export async function toggleChecklistItem(itemId: string, closeId: string, clientId: string, done: boolean) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: staff } = user
    ? await supabase.from("staff").select("id").eq("auth_user_id", user.id).maybeSingle()
    : { data: null };

  await supabase
    .from("close_checklist_items")
    .update({
      is_done: done,
      done_by: done ? (staff?.id ?? null) : null,
      done_at: done ? new Date().toISOString() : null,
    })
    .eq("id", itemId);

  // If every item on the close is now done, flip the close itself to done;
  // if any item gets unchecked, drop it back to in_progress.
  const { data: items } = await supabase
    .from("close_checklist_items")
    .select("is_done")
    .eq("close_id", closeId);

  const allDone = (items ?? []).length > 0 && (items ?? []).every((i) => i.is_done);
  const nextStatus: CloseStatus = allDone ? "done" : "in_progress";

  await supabase
    .from("client_closes")
    .update({
      status: nextStatus,
      completed_at: allDone ? new Date().toISOString() : null,
    })
    .eq("id", closeId);

  revalidatePath("/close-tracker");
  revalidatePath(`/close-tracker/${clientId}`);
}

export async function setCloseAssignment(
  closeId: string,
  clientId: string,
  field: "preparer_staff_id" | "reviewer_staff_id",
  staffId: string | null,
) {
  const supabase = await createClient();
  await supabase
    .from("client_closes")
    .update({ [field]: staffId })
    .eq("id", closeId);

  revalidatePath(`/close-tracker/${clientId}`);
}
