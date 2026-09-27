import type { StaffRole } from "./types";

export type ModuleKey =
  | "clients"
  | "close_tracker"
  | "timesheet"
  | "tax_remittance"
  | "task_tracker"
  | "capacity_dashboard"
  | "calendar"
  | "stat_holiday_calculator"
  | "cleanup_ops"
  | "onboarding"
  | "settings_access";

/**
 * open      - every signed-in staff member sees it (e.g. Clients — "all
 *             staff need access").
 * grantable - hidden unless the staff member has an explicit row in
 *             module_access (e.g. Cleanup Ops: "let Janice and Lesley have
 *             access, but nobody else"). Admins can grant/revoke these.
 * adminOnly - admins only, full stop. Not grantable to anyone else, and
 *             doesn't appear in the access-settings grid (e.g. Capacity
 *             Dashboard — "not employee-facing, only an admin tool").
 */
export type ModuleAccessKind = "open" | "grantable" | "adminOnly";

export interface ModuleDef {
  key: ModuleKey;
  label: string;
  href: string;
  /** Route is live vs. still "Coming soon" on the homepage grid. */
  live: boolean;
  access: ModuleAccessKind;
}

export const MODULES: ModuleDef[] = [
  { key: "clients", label: "Clients", href: "/clients", live: true, access: "open" },
  { key: "close_tracker", label: "Close Tracker", href: "/close-tracker", live: true, access: "open" },
  { key: "timesheet", label: "Timesheet", href: "/timesheet", live: true, access: "open" },
  { key: "tax_remittance", label: "Tax remittance tracker", href: "/tax-remittance", live: false, access: "open" },
  { key: "task_tracker", label: "Task tracker", href: "/tasks", live: false, access: "open" },
  { key: "capacity_dashboard", label: "Capacity dashboard", href: "/capacity", live: false, access: "adminOnly" },
  { key: "calendar", label: "Calendar", href: "/calendar", live: false, access: "open" },
  { key: "stat_holiday_calculator", label: "Stat holiday calculator", href: "/stat-holiday", live: false, access: "open" },
  { key: "cleanup_ops", label: "Cleanup Ops", href: "/cleanup-ops", live: false, access: "grantable" },
  { key: "onboarding", label: "Onboarding", href: "/onboarding", live: false, access: "open" },
  { key: "settings_access", label: "Access settings", href: "/settings/access", live: true, access: "adminOnly" },
];

/** Modules an admin can grant to specific staff, shown in /settings/access. */
export const GRANTABLE_MODULES = MODULES.filter((m) => m.access === "grantable");

export function hasModuleAccess(
  module: ModuleDef,
  role: StaffRole,
  grantedKeys: ReadonlySet<ModuleKey>,
): boolean {
  if (role === "admin") return true;
  if (module.access === "open") return true;
  if (module.access === "grantable") return grantedKeys.has(module.key);
  return false; // adminOnly
}
