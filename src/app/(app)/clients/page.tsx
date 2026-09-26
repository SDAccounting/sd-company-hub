import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Client } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("clients")
    .select("id, display_name, legal_name, status, year_end")
    .eq("status", "active")
    .order("display_name");

  if (q) {
    query = query.ilike("display_name", `%${q}%`);
  }

  const { data: clients, error } = await query.returns<
    Pick<Client, "id" | "display_name" | "legal_name" | "status" | "year_end">[]
  >();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Clients</h1>
      </div>

      <form className="mt-4">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search clients…"
          className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </form>

      {error && (
        <p className="mt-6 text-sm text-red-600">
          Couldn&apos;t load clients: {error.message}. If the{" "}
          <code className="rounded bg-slate-100 px-1">clients</code> table
          doesn&apos;t exist yet, run the migrations in{" "}
          <code className="rounded bg-slate-100 px-1">supabase/migrations</code>.
        </p>
      )}

      <ul className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {clients?.map((c) => (
          <li key={c.id}>
            <Link
              href={`/clients/${c.id}`}
              className="flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50"
            >
              <span className="font-medium text-slate-900">{c.display_name}</span>
              <span className="text-slate-400">{c.year_end ?? "—"}</span>
            </Link>
          </li>
        ))}
        {clients?.length === 0 && (
          <li className="px-4 py-6 text-sm text-slate-500">
            No clients match yet — once the client master data is migrated in,
            it&apos;ll show up here.
          </li>
        )}
      </ul>
    </div>
  );
}
