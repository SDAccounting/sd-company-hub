-- ============================================================
-- Combined bootstrap script: everything EXCEPT staff seeding.
-- Run this first, in the Supabase SQL Editor, in one paste.
-- 0002_seed_staff.sql runs SEPARATELY, after you've invited staff
-- via Authentication -> Users (it needs their auth.users rows to
-- already exist to link against).
-- ============================================================

-- ---- 0001_init.sql ----
-- Company Hub — foundation schema
-- Staff (role/permission tier) + Clients (master record) tables, with RLS.
-- Deliberately does NOT include any credential/password columns — those stay
-- in the firm's separate password manager tool.

create type staff_role as enum ('admin', 'manager', 'staff');
create type client_status as enum ('lead', 'active', 'inactive', 'archived');

-- One row per staff member, linked 1:1 to a Supabase Auth user.
create table staff (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role staff_role not null default 'staff',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- The client master table. Fields drafted from the existing MASTER Client
-- Info Sheets workbook, normalized: one row per client, stable UUID primary
-- key instead of free-text name matching, explicit status instead of a
-- hidden/visible spreadsheet tab.
create table clients (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  display_name text not null,
  status client_status not null default 'active',
  entity_type text,
  cra_business_number text,
  hst_number text,
  payroll_account_number text,
  wsib_number text,
  eht_number text,
  year_end text, -- "MM-DD"
  accounting_software text,
  qbo_realm_id text,
  billing_rate numeric(10, 2),
  billing_frequency text,
  reporting_frequency text,
  primary_staff_id uuid references staff (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clients_display_name_idx on clients using gin (to_tsvector('simple', display_name));
create index clients_status_idx on clients (status);

-- Keep updated_at current on every edit.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger clients_set_updated_at
  before update on clients
  for each row execute function set_updated_at();

-- Helper: does the currently-authenticated user have a given role or higher?
create or replace function current_staff_role()
returns staff_role
language sql
security definer
stable
as $$
  select role from staff where auth_user_id = auth.uid();
$$;

alter table staff enable row level security;
alter table clients enable row level security;

-- Staff table: everyone signed in can see the staff directory (needed for
-- assignment dropdowns); only admins can add/edit/deactivate staff.
create policy "staff readable by authenticated users"
  on staff for select
  to authenticated
  using (true);

create policy "staff manageable by admins"
  on staff for all
  to authenticated
  using (current_staff_role() = 'admin')
  with check (current_staff_role() = 'admin');

-- Clients table: every staff member can read every client (matches "all
-- staff need access" from the original brief); creating/editing/deleting
-- clients is restricted to admins and managers, not front-line staff.
create policy "clients readable by authenticated staff"
  on clients for select
  to authenticated
  using (true);

create policy "clients manageable by admins and managers"
  on clients for all
  to authenticated
  using (current_staff_role() in ('admin', 'manager'))
  with check (current_staff_role() in ('admin', 'manager'));

-- ---- 0003_module_access.sql ----
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

-- ---- 0004_client_contact_and_tasks.sql ----
-- Adds contact fields to clients (present in the old MASTER Client Info
-- sheets but dropped from the first cut of the schema), plus a lightweight
-- tasks table. Tasks gets its own module later (the real Task Tracker),
-- but it needs a client_id from day one so a client's open tasks can show
-- up on that client's own page as well as in the tracker itself.

alter table clients
  add column contact_name text,
  add column email text,
  add column phone text,
  add column address text;

create type task_status as enum ('open', 'done');

create table tasks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients (id) on delete cascade,
  title text not null,
  status task_status not null default 'open',
  assigned_staff_id uuid references staff (id) on delete set null,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_client_id_idx on tasks (client_id) where status = 'open';
create index tasks_assigned_staff_id_idx on tasks (assigned_staff_id) where status = 'open';

create trigger tasks_set_updated_at
  before update on tasks
  for each row execute function set_updated_at();

alter table tasks enable row level security;

-- Same "all staff need access" model as clients for now — the full Task
-- Tracker module can tighten this later (e.g. staff only editing their own
-- tasks) once that module actually exists.
create policy "tasks readable by authenticated staff"
  on tasks for select
  to authenticated
  using (true);

create policy "tasks manageable by authenticated staff"
  on tasks for all
  to authenticated
  using (true)
  with check (true);

-- ---- 0005_close_tracker.sql ----
-- Close Tracker: recurring monthly close workflow, client-agnostic (works
-- for every client regardless of Double status). Mirrors the useful parts
-- of Double's close-tracking (checklist templates, phases, preparer/
-- reviewer assignment) without the timer/punch-clock piece, which isn't
-- actually used.

create table close_checklist_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_default boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table close_checklist_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references close_checklist_templates (id) on delete cascade,
  phase text not null,
  title text not null,
  sort_order integer not null default 0
);

alter table clients
  add column close_checklist_template_id uuid references close_checklist_templates (id) on delete set null;

create type close_status as enum ('not_started', 'in_progress', 'done');

-- One row per client per month.
create table client_closes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  month_date date not null, -- always the 1st of the month this close covers
  status close_status not null default 'not_started',
  preparer_staff_id uuid references staff (id) on delete set null,
  reviewer_staff_id uuid references staff (id) on delete set null,
  due_date date,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (client_id, month_date)
);

-- Instantiated from a template when a close is started; edited per-close
-- from there (the template isn't touched again once copied).
create table close_checklist_items (
  id uuid primary key default gen_random_uuid(),
  close_id uuid not null references client_closes (id) on delete cascade,
  phase text not null,
  title text not null,
  sort_order integer not null default 0,
  is_done boolean not null default false,
  done_by uuid references staff (id) on delete set null,
  done_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index client_closes_client_id_idx on client_closes (client_id);
create index client_closes_month_idx on client_closes (month_date);
create index close_checklist_items_close_id_idx on close_checklist_items (close_id);

create trigger close_checklist_items_set_updated_at
  before update on close_checklist_items
  for each row execute function set_updated_at();

alter table close_checklist_templates enable row level security;
alter table close_checklist_template_items enable row level security;
alter table client_closes enable row level security;
alter table close_checklist_items enable row level security;

create policy "close templates readable by authenticated staff"
  on close_checklist_templates for select to authenticated using (true);
create policy "close templates manageable by admins"
  on close_checklist_templates for all to authenticated
  using (current_staff_role() = 'admin') with check (current_staff_role() = 'admin');

create policy "close template items readable by authenticated staff"
  on close_checklist_template_items for select to authenticated using (true);
create policy "close template items manageable by admins"
  on close_checklist_template_items for all to authenticated
  using (current_staff_role() = 'admin') with check (current_staff_role() = 'admin');

-- Same "all staff need access" model as clients/tasks — everyone works
-- closes, not just admins.
create policy "client closes readable by authenticated staff"
  on client_closes for select to authenticated using (true);
create policy "client closes manageable by authenticated staff"
  on client_closes for all to authenticated using (true) with check (true);

create policy "close checklist items readable by authenticated staff"
  on close_checklist_items for select to authenticated using (true);
create policy "close checklist items manageable by authenticated staff"
  on close_checklist_items for all to authenticated using (true) with check (true);

-- ---- 0006_close_tracker_seed.sql ----
-- Default close checklist template. This covers the common bookkeeping
-- close steps as a reasonable starting point — Brad/admins should review
-- and adjust the actual steps (there's no template-editor UI yet, so
-- edits go through the SQL editor for now; see README).

insert into close_checklist_templates (id, name, is_default, active)
values ('00000000-0000-0000-0000-000000000001', 'Standard Monthly Close', true, true);

insert into close_checklist_template_items (template_id, phase, title, sort_order) values
  ('00000000-0000-0000-0000-000000000001', 'Intake', 'Request bank & credit card statements', 1),
  ('00000000-0000-0000-0000-000000000001', 'Intake', 'Confirm all statements received', 2),
  ('00000000-0000-0000-0000-000000000001', 'Processing', 'Import transactions into QBO', 3),
  ('00000000-0000-0000-0000-000000000001', 'Processing', 'Categorize new transactions', 4),
  ('00000000-0000-0000-0000-000000000001', 'Processing', 'Review uncategorized items', 5),
  ('00000000-0000-0000-0000-000000000001', 'Reconciliation', 'Reconcile bank accounts', 6),
  ('00000000-0000-0000-0000-000000000001', 'Reconciliation', 'Reconcile credit card accounts', 7),
  ('00000000-0000-0000-0000-000000000001', 'Reconciliation', 'Reconcile loans / lines of credit', 8),
  ('00000000-0000-0000-0000-000000000001', 'Review', 'Review P&L for anomalies or variances', 9),
  ('00000000-0000-0000-0000-000000000001', 'Review', 'Review balance sheet', 10),
  ('00000000-0000-0000-0000-000000000001', 'Wrap-up', 'Send financials to client', 11),
  ('00000000-0000-0000-0000-000000000001', 'Wrap-up', 'Mark close complete', 12);

-- ---- 0007_client_source_of_truth.sql ----
-- Expands the client record into the actual source of truth: per-tax-type
-- filing frequencies (generalizes what the remittance dashboard tracks per
-- client — HST/WSIB/EHT frequency + months + "we pay"), payroll info, the
-- client's standing financial accounts (bank/credit/LOC/loan), and an SOP
-- section. The financial accounts list is the important structural piece:
-- Close Tracker and the SOP both read from the SAME account list, instead
-- of each keeping their own copy (the exact duplication problem we found
-- in the old Excel workbooks).

alter table clients
  add column runs_payroll boolean not null default false,
  add column payroll_frequency text,
  add column payroll_platform text,
  add column sop_url text,
  add column sop_content text;

create type tax_type as enum (
  'hst', 'wsib', 'eht', 'payroll_remittance', 'corporate_instalment', 'qpp', 'other'
);

create table client_tax_accounts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  tax_type tax_type not null,
  account_number text,
  frequency text, -- "Monthly" / "Quarterly" / "Annual" — freeform to match how staff already talk about it
  filing_months text[], -- e.g. {Jan,Apr,Jul,Oct}
  we_pay boolean not null default false, -- true = the firm remits on the client's behalf
  notes text,
  created_at timestamptz not null default now()
);

create type account_kind as enum ('bank', 'credit_card', 'loc', 'loan');

-- The client's standing financial accounts — the list Close Tracker's
-- reconciliation checklist and the SOP both read from.
create table client_financial_accounts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  kind account_kind not null,
  name text not null, -- e.g. "RBC Business Chequing"
  institution text,
  last4 text,
  active boolean not null default true,
  sort_order integer not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create index client_tax_accounts_client_id_idx on client_tax_accounts (client_id);
create index client_financial_accounts_client_id_idx on client_financial_accounts (client_id) where active;

alter table client_tax_accounts enable row level security;
alter table client_financial_accounts enable row level security;

create policy "client tax accounts readable by authenticated staff"
  on client_tax_accounts for select to authenticated using (true);
create policy "client tax accounts manageable by admins and managers"
  on client_tax_accounts for all to authenticated
  using (current_staff_role() in ('admin', 'manager'))
  with check (current_staff_role() in ('admin', 'manager'));

create policy "client financial accounts readable by authenticated staff"
  on client_financial_accounts for select to authenticated using (true);
create policy "client financial accounts manageable by admins and managers"
  on client_financial_accounts for all to authenticated
  using (current_staff_role() in ('admin', 'manager'))
  with check (current_staff_role() in ('admin', 'manager'));

