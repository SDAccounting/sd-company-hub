"use client";

import { useState, useTransition } from "react";
import { addCategory, renameCategory, setCategoryActive, deleteCategory } from "./actions";
import type { TimesheetCategory } from "@/lib/types";

export function CategoryList({ initialCategories }: { initialCategories: TimesheetCategory[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [, startTransition] = useTransition();

  function add() {
    if (!newName.trim()) return;
    const name = newName.trim();
    setCategories((prev) => [...prev, { id: crypto.randomUUID(), name, active: true, created_at: "" }]);
    setNewName("");
    startTransition(async () => {
      await addCategory(name);
    });
  }

  function startEdit(c: TimesheetCategory) {
    setEditingId(c.id);
    setEditingName(c.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName("");
  }

  function saveEdit(id: string) {
    if (!editingName.trim()) return;
    const name = editingName.trim();
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
    cancelEdit();
    startTransition(async () => {
      await renameCategory(id, name);
    });
  }

  function toggleActive(id: string, active: boolean) {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, active: !active } : c)));
    startTransition(async () => {
      await setCategoryActive(id, !active);
    });
  }

  function remove(id: string) {
    if (!confirm("Delete this category? It disappears from old timesheet entries too, not just the picker.")) return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    startTransition(async () => {
      await deleteCategory(id);
    });
  }

  return (
    <div className="mt-6 rounded-lg border border-slate-200 bg-white">
      <ul className="divide-y divide-slate-100">
        {categories.map((c) =>
          editingId === c.id ? (
            <li key={c.id} className="flex items-center gap-2 px-4 py-3">
              <input
                autoFocus
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit(c.id);
                  if (e.key === "Escape") cancelEdit();
                }}
                className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
              <button onClick={() => saveEdit(c.id)} className="text-xs font-medium text-slate-900 hover:underline">
                Save
              </button>
              <button onClick={cancelEdit} className="text-xs text-slate-400 hover:text-slate-700">
                Cancel
              </button>
            </li>
          ) : (
            <li key={c.id} className="flex items-center justify-between px-4 py-3">
              <span className={`text-sm ${c.active ? "text-slate-900" : "text-slate-400 line-through"}`}>
                {c.name}
              </span>
              <div className="flex items-center gap-3">
                <button onClick={() => startEdit(c)} className="text-xs text-slate-400 hover:text-slate-700">
                  Edit
                </button>
                <button
                  onClick={() => toggleActive(c.id, c.active)}
                  className="text-xs text-slate-400 hover:text-slate-700"
                >
                  {c.active ? "Deactivate" : "Reactivate"}
                </button>
                <button onClick={() => remove(c.id)} className="text-xs text-red-400 hover:text-red-600">
                  Delete
                </button>
              </div>
            </li>
          ),
        )}
        {categories.length === 0 && <li className="px-4 py-6 text-sm text-slate-500">No categories yet.</li>}
      </ul>
      <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="New category name…"
          className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
        <button
          onClick={add}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          Add
        </button>
      </div>
    </div>
  );
}
