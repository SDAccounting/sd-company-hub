import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Client, ClientFinancialAccount, ClientTaxAccount } from "@/lib/types";
import { Card, Field, EmptyState } from "./card";
import { Tabs } from "./tabs";
import {
  addTaxAccount,
  deleteTaxAccount,
  addFinancialAccount,
  deleteFinancialAccount,
} from "./accounts-actions";

export const dynamic = "force-dynamic";

interface OpenTask {
  id: string;
  title: string;
  due_date: string | null;
  assigned_staff_name: string | null;
}

const TAX_TYPE_LABEL: Record<string, string> = {
  hst: "HST",
  wsib: "WSIB",
  eht: "EHT",
  payroll_remittance: "Payroll remittance",
  corporate_instalment: "Corporate instalment",
  qpp: "QPP",
  other: "Other",
};

const ACCOUNT_KIND_LABEL: Record<string, string> = {
  bank: "Bank",
  credit_card: "Credit card",
  loc: "Line of credit",
  loan: "Loan",
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .maybeSingle<Client>();

  if (!client) {
    notFound();
  }

  const { data: taskRows } = await supabase
    .from("tasks")
    .select("id, title, due_date, staff:assigned_staff_id(full_name)")
    .eq("client_id", id)
    .eq("status", "open")
    .order("due_date", { ascending: true, nullsFirst: false });

  const openTasks: OpenTask[] = (taskRows ?? []).map((t) => ({
    id: t.id as string,
    title: t.title as string,
    due_date: t.due_date as string | null,
    assigned_staff_name:
      (t.staff as unknown as { full_name: string } | null)?.full_name ?? null,
  }));

  const { data: taxAccountRows } = await supabase
    .from("client_tax_accounts")
    .select("*")
    .eq("client_id", id)
    .order("tax_type")
    .returns<ClientTaxAccount[]>();

  const { data: financialAccountRows } = await supabase
    .from("client_financial_accounts")
    .select("*")
    .eq("client_id", id)
    .eq("active", true)
    .order("kind")
    .order("sort_order")
    .returns<ClientFinancialAccount[]>();

  const taxAccounts = taxAccountRows ?? [];
  const financialAccounts = financialAccountRows ?? [];

  const hasContactInfo = client.contact_name || client.email || client.phone || client.address;
  const boundAddTaxAccount = addTaxAccount.bind(null, client.id);
  const boundAddFinancialAccount = addFinancialAccount.bind(null, client.id);

  const overviewTab = (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card title="Contact Info">
        {hasContactInfo ? (
          <div className="space-y-3">
            <Field label="Contact" value={client.contact_name} />
            <Field label="Email" value={client.email} />
            <Field label="Phone" value={client.phone} />
            <Field label="Address" value={client.address} />
          </div>
        ) : (
          <EmptyState text="No contact info yet." />
        )}
      </Card>

      <Card title="Overview">
        <div className="space-y-3">
          <Field label="Status" value={client.status} />
          <Field label="Entity type" value={client.entity_type} />
          <Field label="Year end" value={client.year_end} />
          <Field label="CRA business #" value={client.cra_business_number} />
        </div>
      </Card>

      <Card title="Engagement">
        <div className="space-y-3">
          <Field label="Accounting software" value={client.accounting_software} />
          <Field
            label="Billing rate"
            value={client.billing_rate != null ? `$${client.billing_rate}` : null}
          />
          <Field label="Billing frequency" value={client.billing_frequency} />
          <Field label="Reporting frequency" value={client.reporting_frequency} />
        </div>
      </Card>

      {client.notes && (
        <Card title="Notes" className="lg:col-span-3">
          <p className="whitespace-pre-wrap text-sm text-slate-900">{client.notes}</p>
        </Card>
      )}
    </div>
  );

  const taxTab = (
    <div className="space-y-4">
      <Card title="Payroll">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Runs payroll" value={client.runs_payroll ? "Yes" : "No"} />
          <Field label="Frequency" value={client.payroll_frequency} />
          <Field label="Platform" value={client.payroll_platform} />
        </div>
      </Card>

      <Card title="Tax accounts">
        {taxAccounts && taxAccounts.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-4 font-medium">Type</th>
                <th className="py-2 pr-4 font-medium">Account #</th>
                <th className="py-2 pr-4 font-medium">Frequency</th>
                <th className="py-2 pr-4 font-medium">Months</th>
                <th className="py-2 pr-4 font-medium">We pay</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {taxAccounts.map((t) => (
                <tr key={t.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-2 pr-4 text-slate-900">{TAX_TYPE_LABEL[t.tax_type] ?? t.tax_type}</td>
                  <td className="py-2 pr-4 text-slate-500">{t.account_number ?? "—"}</td>
                  <td className="py-2 pr-4 text-slate-500">{t.frequency ?? "—"}</td>
                  <td className="py-2 pr-4 text-slate-500">{t.filing_months?.join(", ") ?? "—"}</td>
                  <td className="py-2 pr-4 text-slate-500">{t.we_pay ? "Yes" : "—"}</td>
                  <td className="py-2 text-right">
                    <form action={deleteTaxAccount.bind(null, client.id, t.id)}>
                      <button type="submit" className="text-xs text-slate-400 hover:text-red-600">
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState text="No tax accounts added yet." />
        )}

        <form action={boundAddTaxAccount} className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 sm:grid-cols-6">
          <select name="tax_type" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" required>
            {Object.entries(TAX_TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input name="account_number" placeholder="Account #" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          <input name="frequency" placeholder="Frequency" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          <input name="filing_months" placeholder="Jan, Apr, Jul, Oct" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          <label className="flex items-center gap-1.5 px-1 text-xs text-slate-600">
            <input type="checkbox" name="we_pay" className="h-4 w-4 rounded border-slate-300 accent-slate-900" />
            We pay
          </label>
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
          >
            Add
          </button>
        </form>
      </Card>
    </div>
  );

  const accountsTab = (
    <Card title="Bank, credit, LOC & loan accounts">
      {financialAccounts && financialAccounts.length > 0 ? (
        <ul className="divide-y divide-slate-100">
          {financialAccounts.map((a) => (
            <li key={a.id} className="flex items-center justify-between py-2.5 text-sm">
              <div>
                <span className="font-medium text-slate-900">{a.name}</span>
                <span className="ml-2 text-xs text-slate-400">
                  {ACCOUNT_KIND_LABEL[a.kind]}
                  {a.institution ? ` · ${a.institution}` : ""}
                  {a.last4 ? ` · ...${a.last4}` : ""}
                </span>
              </div>
              <form action={deleteFinancialAccount.bind(null, client.id, a.id)}>
                <button type="submit" className="text-xs text-slate-400 hover:text-red-600">
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState text="No accounts added yet." />
      )}

      <form action={boundAddFinancialAccount} className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 sm:grid-cols-5">
        <select name="kind" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" required>
          {Object.entries(ACCOUNT_KIND_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input name="name" placeholder="Account name" required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm sm:col-span-2" />
        <input name="institution" placeholder="Institution" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
        <input name="last4" placeholder="Last 4" maxLength={4} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 sm:col-span-1"
        >
          Add
        </button>
      </form>
    </Card>
  );

  const sopTab = (
    <Card title="SOP" action={client.sop_url ? (
      <a href={client.sop_url} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-600 hover:text-orange-700">
        Open linked document →
      </a>
    ) : undefined}>
      {client.sop_content ? (
        <p className="whitespace-pre-wrap text-sm text-slate-900">{client.sop_content}</p>
      ) : (
        <EmptyState text="No SOP written yet." actionLabel="Add one in Edit Client" actionHref={`/clients/${client.id}/edit`} />
      )}
    </Card>
  );

  const tasksTab = (
    <Card title="Open Tasks">
      {openTasks.length > 0 ? (
        <ul className="divide-y divide-slate-100">
          {openTasks.map((t) => (
            <li key={t.id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-slate-900">{t.title}</span>
              <span className="flex items-center gap-3 text-xs text-slate-400">
                {t.assigned_staff_name && <span>{t.assigned_staff_name}</span>}
                {t.due_date && <span>{t.due_date}</span>}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState text="No open tasks. These will show up here once the Task Tracker is built." />
      )}
    </Card>
  );

  return (
    <div className="space-y-4">
      <Link href="/clients" className="text-sm text-slate-500 hover:text-slate-900">
        ← All clients
      </Link>

      <div className="flex items-start justify-between rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 flex-none items-center justify-center rounded-lg bg-slate-100 text-xl font-bold text-slate-400">
            {client.display_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{client.display_name}</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {client.entity_type ?? "—"} · {client.status}
            </p>
          </div>
        </div>
        <Link
          href={`/clients/${client.id}/edit`}
          className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Edit Client
        </Link>
      </div>

      <Tabs
        tabs={[
          { key: "overview", label: "Overview", content: overviewTab },
          { key: "tax", label: "Tax & Payroll", content: taxTab },
          { key: "accounts", label: "Accounts", content: accountsTab },
          { key: "sop", label: "SOP", content: sopTab },
          { key: "tasks", label: "Tasks", content: tasksTab },
        ]}
      />
    </div>
  );
}
