import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStaffAccess } from "@/lib/access";
import type { TimesheetCategory } from "@/lib/types";
import { SettingsNav } from "../settings-nav";
import { CategoryList } from "./category-list";

export const dynamic = "force-dynamic";

export default async function CategoriesSettingsPage() {
  const access = await getStaffAccess();
  if (!access.staff || access.staff.role !== "admin") {
    redirect("/");
  }

  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("timesheet_categories")
    .select("id, name, active, created_at")
    .order("name")
    .returns<TimesheetCategory[]>();

  return (
    <div>
      <SettingsNav active="/settings/categories" />
      <h1 className="text-lg font-semibold text-slate-900">Timesheet categories</h1>
      <p className="mt-1 text-sm text-slate-500">
        Manage the category list staff pick from when logging time (e.g. &quot;Month-end reconciliation,&quot;
        &quot;Year-end tax remittance&quot;). Deactivating keeps a category on old entries but drops it from the
        picker for new ones; deleting removes it everywhere.
      </p>

      <CategoryList initialCategories={categories ?? []} />
    </div>
  );
}
