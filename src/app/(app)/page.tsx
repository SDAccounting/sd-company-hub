import Link from "next/link";
import { getStaffAccess, accessibleModules } from "@/lib/access";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const access = await getStaffAccess();
  const modules = accessibleModules(access);

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">Company Hub</h1>
      <p className="mt-1 text-sm text-slate-500">
        Foundation is live: auth, roles, per-tool access, and the client
        directory. Everything else below gets built module by module on top
        of this.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {modules.map((m) => {
          const card = (
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm transition hover:border-slate-300">
              <p className="font-medium text-slate-900">{m.label}</p>
              <p
                className={
                  m.live
                    ? "mt-1 text-xs font-medium text-emerald-600"
                    : "mt-1 text-xs text-slate-400"
                }
              >
                {m.live ? "Live" : "Coming soon"}
              </p>
            </div>
          );
          return m.live ? (
            <Link key={m.key} href={m.href}>
              {card}
            </Link>
          ) : (
            <div key={m.key}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}
