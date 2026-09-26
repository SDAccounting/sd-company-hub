import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Client } from "@/lib/types";
import { updateClient } from "./actions";

export const dynamic = "force-dynamic";

function TextField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: string | number | null;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue ?? ""}
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
      />
    </label>
  );
}

export default async function EditClientPage({
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

  const boundUpdate = updateClient.bind(null, client.id);

  return (
    <div>
      <Link href={`/clients/${client.id}`} className="text-sm text-slate-500 hover:text-slate-900">
        ← {client.display_name}
      </Link>
      <h1 className="mt-2 text-lg font-semibold text-slate-900">Edit client</h1>

      <form action={boundUpdate} className="mt-6 space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Basics</h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField name="display_name" label="Display name" defaultValue={client.display_name} />
            <TextField name="legal_name" label="Legal name" defaultValue={client.legal_name} />
            <TextField name="entity_type" label="Entity type" defaultValue={client.entity_type} />
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-slate-400">Status</span>
              <select
                name="status"
                defaultValue={client.status}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              >
                <option value="lead">Lead</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Contact info</h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField name="contact_name" label="Contact" defaultValue={client.contact_name} />
            <TextField name="email" label="Email" defaultValue={client.email} />
            <TextField name="phone" label="Phone" defaultValue={client.phone} />
            <TextField name="address" label="Address" defaultValue={client.address} />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Business numbers</h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <TextField name="cra_business_number" label="CRA business #" defaultValue={client.cra_business_number} />
            <TextField name="hst_number" label="HST #" defaultValue={client.hst_number} />
            <TextField name="payroll_account_number" label="Payroll (RP) #" defaultValue={client.payroll_account_number} />
            <TextField name="wsib_number" label="WSIB #" defaultValue={client.wsib_number} />
            <TextField name="eht_number" label="EHT #" defaultValue={client.eht_number} />
            <TextField name="year_end" label="Year end (MM-DD)" defaultValue={client.year_end} />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Engagement</h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TextField name="accounting_software" label="Accounting software" defaultValue={client.accounting_software} />
            <TextField name="billing_rate" label="Billing rate" defaultValue={client.billing_rate} />
            <TextField name="billing_frequency" label="Billing frequency" defaultValue={client.billing_frequency} />
            <TextField name="reporting_frequency" label="Reporting frequency" defaultValue={client.reporting_frequency} />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Payroll</h2>
          <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="runs_payroll"
              defaultChecked={client.runs_payroll}
              className="h-4 w-4 rounded border-slate-300 accent-slate-900"
            />
            This client runs payroll
          </label>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField name="payroll_frequency" label="Payroll frequency" defaultValue={client.payroll_frequency} />
            <TextField name="payroll_platform" label="Payroll platform" defaultValue={client.payroll_platform} />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">SOP</h2>
          <div className="mt-3">
            <TextField name="sop_url" label="Linked SOP document (optional)" defaultValue={client.sop_url} />
          </div>
          <label className="mt-4 block">
            <span className="text-xs uppercase tracking-wide text-slate-400">
              SOP notes (shown on the client page)
            </span>
            <textarea
              name="sop_content"
              defaultValue={client.sop_content ?? ""}
              rows={8}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </label>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Notes</h2>
          <textarea
            name="notes"
            defaultValue={client.notes ?? ""}
            rows={4}
            className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </section>

        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Save
          </button>
          <Link
            href={`/clients/${client.id}`}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
