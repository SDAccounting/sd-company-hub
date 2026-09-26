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
