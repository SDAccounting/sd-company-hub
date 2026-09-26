-- Two clearly-labeled test clients so there's something to click around
-- in Clients / Close Tracker while testing. Safe to edit or delete once
-- real client data (or the Ignition-triggered onboarding flow, down the
-- road) starts populating this table for real.

insert into clients (
  legal_name, display_name, status, entity_type,
  contact_name, email, phone, address,
  cra_business_number, hst_number, payroll_account_number, wsib_number, eht_number,
  year_end, accounting_software, billing_rate, billing_frequency, reporting_frequency,
  runs_payroll, payroll_frequency, payroll_platform,
  sop_content, notes
) values
(
  'Test Client One Inc.', 'Test Client One', 'active', 'Corporation',
  'Jamie Test', 'jamie@testclientone.example.com', '555-0100', '123 Test St, Toronto, ON',
  '123456789 RC0001', '123456789 RT0001', '123456789 RP0001', 'WSIB-TEST-001', 'EHT-TEST-001',
  '12-31', 'QuickBooks Online', 750, 'Monthly', 'Monthly',
  true, 'Bi-weekly', 'QuickBooks Online Payroll',
  'Test SOP notes: statements arrive by the 5th, reconcile by the 15th.',
  'Sample test client — safe to edit or delete.'
),
(
  'Test Client Two Ltd.', 'Test Client Two', 'active', 'Corporation',
  'Morgan Test', 'morgan@testclienttwo.example.com', '555-0200', null,
  '987654321 RC0001', '987654321 RT0001', null, null, null,
  '06-30', 'QuickBooks Online', 400, 'Monthly', 'Quarterly',
  false, null, null,
  null,
  'Sample test client — safe to edit or delete.'
);

-- Tax accounts + financial accounts for Test Client One only, so its
-- Tax & Payroll / Accounts tabs have something real to show.
insert into client_tax_accounts (client_id, tax_type, account_number, frequency, filing_months, we_pay)
select id, 'hst', '123456789 RT0001', 'Quarterly', array['Jan','Apr','Jul','Oct'], true
from clients where display_name = 'Test Client One';

insert into client_tax_accounts (client_id, tax_type, account_number, frequency, filing_months, we_pay)
select id, 'payroll_remittance', '123456789 RP0001', 'Monthly', null, true
from clients where display_name = 'Test Client One';

insert into client_financial_accounts (client_id, kind, name, institution, last4, sort_order)
select id, 'bank', 'Test Business Chequing', 'RBC', '4821', 1
from clients where display_name = 'Test Client One';

insert into client_financial_accounts (client_id, kind, name, institution, last4, sort_order)
select id, 'credit_card', 'Test Business Visa', 'RBC', '9012', 2
from clients where display_name = 'Test Client One';
