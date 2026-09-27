"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getStaffAccess } from "@/lib/access";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function matchRow(query: any, clientId: string | null, categoryId: string | null) {
  const withClient = clientId === null ? query.is("client_id", null) : query.eq("client_id", clientId);
  return categoryId === null ? withClient.is("category_id", null) : withClient.eq("category_id", categoryId);
}

/**
 * Creates or updates the one entry for (this staff member, client, category,
 * date) — the natural key a single grid cell / quick-add / note edit maps
 * to. Omitted fields (hours, note) keep their existing value; a brand-new
 * row defaults hours to 0 so a quick-add with no hours yet still creates a
 * visible row.
 */
export async function logTime(input: {
  clientId: string | null;
  categoryId: string | null;
  entryDate: string;
  hours?: number;
  note?: string | null;
}) {
  const access = await getStaffAccess();
  if (!access.staff) throw new Error("Not signed in");
  const supabase = await createClient();

  const existingResult = await matchRow(
    supabase.from("time_entries").select("id").eq("staff_id", access.staff.id).eq("entry_date", input.entryDate),
    input.clientId,
    input.categoryId,
  ).maybeSingle();
  const existing = existingResult.data as { id: string } | null;

  if (existing) {
    const patch: Record<string, unknown> = {};
    if (input.hours !== undefined) patch.hours = input.hours;
    if (input.note !== undefined) patch.note = input.note;
    if (Object.keys(patch).length > 0) {
      await supabase.from("time_entries").update(patch).eq("id", existing.id);
    }
  } else {
    await supabase.from("time_entries").insert({
      staff_id: access.staff.id,
      client_id: input.clientId,
      category_id: input.categoryId,
      entry_date: input.entryDate,
      hours: input.hours ?? 0,
      note: input.note ?? null,
    });
  }

  revalidatePath("/timesheet");
  if (input.clientId) revalidatePath(`/clients/${input.clientId}`);
}

export async function deleteRow(clientId: string | null, categoryId: string | null, mondayISO: string) {
  const access = await getStaffAccess();
  if (!access.staff) throw new Error("Not signed in");
  const supabase = await createClient();

  const weekEnd = new Date(mondayISO);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

  await matchRow(
    supabase
      .from("time_entries")
      .delete()
      .eq("staff_id", access.staff.id)
      .gte("entry_date", mondayISO)
      .lte("entry_date", weekEnd.toISOString().slice(0, 10)),
    clientId,
    categoryId,
  );

  revalidatePath("/timesheet");
  if (clientId) revalidatePath(`/clients/${clientId}`);
}
