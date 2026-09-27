-- Real Timesheet backend, replacing the client-side mockups on /timesheet,
-- the client-page Timesheet tab, and /settings/categories. `is_sample`
-- flags rows created purely to preview the reports so they're one DELETE
-- to clean up afterwards (see supabase/sample_timesheet_data.sql).

create table timesheet_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into timesheet_categories (name) values
  ('Month-end reconciliation'),
  ('Year-end tax remittance'),
  ('Bookkeeping catch-up'),
  ('Ad-hoc / client request'),
  ('Onboarding');

create table time_entries (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff (id) on delete cascade,
  client_id uuid references clients (id) on delete cascade,
  category_id uuid references timesheet_categories (id) on delete set null,
  entry_date date not null,
  hours numeric(5, 2) not null default 0 check (hours >= 0),
  note text,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index time_entries_staff_id_idx on time_entries (staff_id, entry_date);
create index time_entries_client_id_idx on time_entries (client_id, entry_date);
create index time_entries_entry_date_idx on time_entries (entry_date);

create trigger time_entries_set_updated_at
  before update on time_entries
  for each row execute function set_updated_at();

alter table timesheet_categories enable row level security;
alter table time_entries enable row level security;

-- Same "all authenticated staff" model as tasks/clients: the Timesheet
-- module's own nav gating (open to everyone right now) is what actually
-- controls who sees this feature at all.
create policy "categories readable by authenticated staff"
  on timesheet_categories for select
  to authenticated
  using (true);

create policy "categories manageable by admins"
  on timesheet_categories for all
  to authenticated
  using (current_staff_role() = 'admin')
  with check (current_staff_role() = 'admin');

create policy "time entries readable by authenticated staff"
  on time_entries for select
  to authenticated
  using (true);

create policy "time entries manageable by authenticated staff"
  on time_entries for all
  to authenticated
  using (true)
  with check (true);
