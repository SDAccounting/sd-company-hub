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
