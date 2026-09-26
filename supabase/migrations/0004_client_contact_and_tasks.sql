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
