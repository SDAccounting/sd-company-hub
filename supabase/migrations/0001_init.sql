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
