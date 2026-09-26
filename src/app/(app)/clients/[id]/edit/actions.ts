"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ClientStatus } from "@/lib/types";

const TEXT_FIELDS = [
  "legal_name",
  "display_name",
  "entity_type",
  "contact_name",
  "email",
  "phone",
  "address",
  "cra_business_number",
  "hst_number",
  "payroll_account_number",
  "wsib_number",
  "eht_number",
  "year_end",
  "accounting_software",
  "billing_frequency",
  "reporting_frequency",
  "payroll_frequency",
  "payroll_platform",
  "sop_url",
  "sop_content",
  "notes",
] as const;

export async function updateClient(clientId: string, formData: FormData) {
  const supabase = await createClient();

  const update: Record<string, string | number | boolean | null> = {};
  for (const field of TEXT_FIELDS) {
    const value = String(formData.get(field) ?? "").trim();
    update[field] = value === "" ? null : value;
  }

  update.status = String(formData.get("status") ?? "active") as ClientStatus;
  update.runs_payroll = formData.get("runs_payroll") === "on";

  const rate = String(formData.get("billing_rate") ?? "").trim();
  update.billing_rate = rate === "" ? null : Number(rate);

  const { error } = await supabase.from("clients").update(update).eq("id", clientId);

  if (error) {
    throw new Error(`Couldn't save client: ${error.message}`);
  }

  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}`);
}
