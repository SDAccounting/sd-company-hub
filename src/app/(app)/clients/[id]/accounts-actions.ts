"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AccountKind, TaxType } from "@/lib/types";

export async function addTaxAccount(clientId: string, formData: FormData) {
  const supabase = await createClient();

  const monthsRaw = String(formData.get("filing_months") ?? "").trim();
  const filing_months = monthsRaw
    ? monthsRaw.split(",").map((m) => m.trim()).filter(Boolean)
    : null;

  await supabase.from("client_tax_accounts").insert({
    client_id: clientId,
    tax_type: String(formData.get("tax_type")) as TaxType,
    account_number: String(formData.get("account_number") ?? "").trim() || null,
    frequency: String(formData.get("frequency") ?? "").trim() || null,
    filing_months,
    we_pay: formData.get("we_pay") === "on",
  });

  revalidatePath(`/clients/${clientId}`);
}

export async function deleteTaxAccount(clientId: string, taxAccountId: string) {
  const supabase = await createClient();
  await supabase.from("client_tax_accounts").delete().eq("id", taxAccountId);
  revalidatePath(`/clients/${clientId}`);
}

export async function addFinancialAccount(clientId: string, formData: FormData) {
  const supabase = await createClient();

  await supabase.from("client_financial_accounts").insert({
    client_id: clientId,
    kind: String(formData.get("kind")) as AccountKind,
    name: String(formData.get("name") ?? "").trim(),
    institution: String(formData.get("institution") ?? "").trim() || null,
    last4: String(formData.get("last4") ?? "").trim() || null,
  });

  revalidatePath(`/clients/${clientId}`);
}

export async function deleteFinancialAccount(clientId: string, accountId: string) {
  const supabase = await createClient();
  await supabase.from("client_financial_accounts").delete().eq("id", accountId);
  revalidatePath(`/clients/${clientId}`);
}
