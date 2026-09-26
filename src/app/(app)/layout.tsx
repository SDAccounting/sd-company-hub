import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/login/actions";
import { getStaffAccess, accessibleModules } from "@/lib/access";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const access = await getStaffAccess();

  // Covers both "not signed in" (proxy should already have redirected —
  // this is defense in depth) and "signed in but no staff row provisioned
  // yet" — either way there's nothing to show.
  if (!access.staff) {
    redirect("/login");
  }

  const modules = accessibleModules(access);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-56 flex-none flex-col border-r border-slate-200 bg-white">
        <div className="px-4 py-4">
          <span className="text-sm font-semibold text-slate-900">Company Hub</span>
        </div>
        <nav className="flex-1 space-y-0.5 px-2">
          <Link
            href="/"
            className="block rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            Home
          </Link>
          {modules.map((m) =>
            m.live ? (
              <Link
                key={m.key}
                href={m.href}
                className="block rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                {m.label}
              </Link>
            ) : (
              <div
                key={m.key}
                className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-slate-300"
              >
                <span>{m.label}</span>
                <span className="text-xs">Soon</span>
              </div>
            ),
          )}
        </nav>
        <div className="border-t border-slate-200 px-4 py-3 text-sm">
          <div className="truncate font-medium text-slate-900">{access.staff.full_name}</div>
          <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs uppercase tracking-wide text-slate-500">
            {access.staff.role}
          </span>
          <form action={signOut} className="mt-2">
            <button type="submit" className="text-slate-500 hover:text-slate-900">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-8 py-8">{children}</main>
    </div>
  );
}
