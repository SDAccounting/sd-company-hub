-- Per-tool, per-staff-member module access.
--
-- Admins always have access to everything. A module is either:
--   - "default open"  (every staff member sees it, e.g. clients), or
--   - "grant-list"    (hidden by default; a row here grants one staff
--                       member access, e.g. Capacity Dashboard is
--                       admin-only with no grants at all; Cleanup Ops
--                       might grant just two specific people).
-- Which modules are which lives in code (src/lib/modules.ts), not here —
-- this table only records the per-person grants.

create table module_access (
  staff_id uuid not null references staff (id) on delete cascade,
  module_key text not null,
  granted_at timestamptz not null default now(),
  granted_by uuid references staff (id) on delete set null,
  primary key (staff_id, module_key)
);

alter table module_access enable row level security;

-- A staff member can see their own grants (needed to build their own nav);
-- admins can see everyone's (needed for the access-settings screen).
create policy "module_access readable by owner or admin"
  on module_access for select
  to authenticated
  using (
    staff_id = (select id from staff where auth_user_id = auth.uid())
    or current_staff_role() = 'admin'
  );

-- Only admins grant/revoke access.
create policy "module_access manageable by admins"
  on module_access for all
  to authenticated
  using (current_staff_role() = 'admin')
  with check (current_staff_role() = 'admin');
