// VISION MOCKUP ONLY — client-side state only, nothing persists yet.
// Lets an admin manage the category list staff pick from on the
// timesheet (Double calls the same concept "workstreams").

"use client";

import { useState } from "react";
import { SettingsNav } from "../settings-nav";

interface Category {
  id: string;
  name: string;
  active: boolean;
}

const INITIAL_CATEGORIES: Category[] = [
  { id: "1", name: "Month-end reconciliation", active: true },
  { id: "2", name: "Year-end tax remittance", active: true },
  { id: "3", name: "Bookkeeping catch-up", active: true },
  { id: "4", name: "Ad-hoc / client request", active: true },
  { id: "5", name: "Onboarding", active: true },
];

export default function CategoriesSettingsPage() {
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [newName, setNewName] = useState("");

  function addCategory() {
    if (!newName.trim()) return;
    setCategories((prev) => [...prev, { id: crypto.randomUUID(), name: newName.trim(), active: true }]);
    setNewName("");
  }

  function toggleActive(id: string) {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c)));
  }

  return (
    <div>
      <SettingsNav active="/settings/categories" />
      <h1 className="text-lg font-semibold text-slate-900">Timesheet categories</h1>
      <p className="mt-1 text-sm text-slate-500">
        Manage the category list staff pick from when logging time (e.g.
        &quot;Month-end reconciliation,&quot; &quot;Year-end tax remittance&quot;).
        Inactive categories stay on old entries but drop out of the picker for
        new ones.
      </p>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white">
        <ul className="divide-y divide-slate-100">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between px-4 py-3">
              <span className={`text-sm ${c.active ? "text-slate-900" : "text-slate-400 line-through"}`}>
                {c.name}
              </span>
              <button
                onClick={() => toggleActive(c.id)}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                {c.active ? "Deactivate" : "Reactivate"}
              </button>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New category name…"
            className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          />
          <button
            onClick={addCategory}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
