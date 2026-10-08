-- Timesheet beta hardening:
--   1. Staff can only see/change their OWN hours. Admins and managers can
--      read everyone's (for reports); only admins can edit someone else's.
--   2. Pay-period locks. Any entry dated inside a locked period can't be
--      inserted, changed or deleted by anyone -- enforced by a trigger so
--      no code path (grid, client tab, future Cleanup Ops sync) can skip it.
--      An admin unlocks by deleting the lock row (Settings -> Timesheet locks).

create or replace function current_staff_id()
returns uuid
language sql
security definer
stable
as $$
  select id from staff where auth_user_id = auth.uid();
$$;

drop policy "time entries readable by authenticated staff" on time_entries;
drop policy "time entries manageable by authenticated staff" on time_entries;

create policy "time entries readable by owner, admins and managers"
  on time_entries for select
  to authenticated
  using (staff_id = current_staff_id() or current_staff_role() in ('admin', 'manager'));

create policy "time entries manageable by owner or admins"
  on time_entries for all
  to authenticated
  using (staff_id = current_staff_id() or current_staff_role() = 'admin')
  with check (staff_id = current_staff_id() or current_staff_role() = 'admin');

create table timesheet_locks (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_end date not null check (period_end >= period_start),
  note text,
  locked_by uuid references staff (id) on delete set null,
  locked_at timestamptz not null default now()
);

alter table timesheet_locks enable row level security;

create policy "locks readable by authenticated staff"
  on timesheet_locks for select
  to authenticated
  using (true);

create policy "locks manageable by admins"
  on timesheet_locks for all
  to authenticated
  using (current_staff_role() = 'admin')
  with check (current_staff_role() = 'admin');

create or replace function enforce_timesheet_lock()
returns trigger
language plpgsql
security definer
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') and exists (
    select 1 from timesheet_locks where old.entry_date between period_start and period_end
  ) then
    raise exception 'That pay period is locked. Ask an admin to unlock it before changing these hours.';
  end if;

  if tg_op in ('INSERT', 'UPDATE') and exists (
    select 1 from timesheet_locks where new.entry_date between period_start and period_end
  ) then
    raise exception 'That pay period is locked. Ask an admin to unlock it before changing these hours.';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger time_entries_enforce_lock
  before insert or update or delete on time_entries
  for each row execute function enforce_timesheet_lock();
