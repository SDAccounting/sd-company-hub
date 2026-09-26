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
