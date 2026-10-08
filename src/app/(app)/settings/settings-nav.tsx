import Link from "next/link";

const SETTINGS_LINKS = [
  { href: "/settings/staff", label: "Staff" },
  { href: "/settings/access", label: "Access" },
  { href: "/settings/categories", label: "Timesheet categories" },
  { href: "/settings/timesheet-locks", label: "Timesheet locks" },
];

export function SettingsNav({ active }: { active: string }) {
  return (
    <div className="mb-4 flex gap-1 border-b border-slate-200">
      {SETTINGS_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`border-b-2 px-3 py-2 text-sm font-medium transition ${
            active === link.href
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
