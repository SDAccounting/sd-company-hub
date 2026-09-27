-- Sample time entries so the Timesheet report (Settings → Timesheet →
-- Report, or /timesheet/report) has something real to look at. Every row
-- is flagged is_sample = true, so cleanup is one statement once you're
-- done reviewing:
--
--   delete from time_entries where is_sample = true;
--
-- (There's also a "Clear N sample entries" button right on the report
-- page itself, which runs the same delete.)
--
-- Attributed to your own account (brad@sdaccounting.ca) since it's
-- guaranteed to exist; spread across the two test clients plus
-- Internal/Admin (client_id null) over the last few weeks.

insert into time_entries (staff_id, client_id, category_id, entry_date, hours, note, is_sample)
select
  (select id from staff where email = 'brad@sdaccounting.ca'),
  client_id,
  (select id from timesheet_categories where name = category_name),
  entry_date,
  hours,
  note,
  true
from (
  values
    ((select id from clients where display_name = 'Test Client One'), 'Month-end reconciliation', (current_date - 16), 4.0, 'Reconciled bank + credit card'),
    ((select id from clients where display_name = 'Test Client One'), 'Month-end reconciliation', (current_date - 15), 2.5, 'Waiting on missing statement'),
    ((select id from clients where display_name = 'Test Client One'), 'Month-end reconciliation', (current_date - 13), 3.0, 'Reviewed P&L, flagged an anomaly'),
    ((select id from clients where display_name = 'Test Client Two'), 'Year-end tax remittance', (current_date - 14), 5.0, null),
    ((select id from clients where display_name = 'Test Client Two'), 'Year-end tax remittance', (current_date - 10), 4.0, 'Filed HST return'),
    (null, 'Ad-hoc / client request', (current_date - 12), 1.0, 'Internal admin catch-up'),
    ((select id from clients where display_name = 'Test Client One'), 'Bookkeeping catch-up', (current_date - 9), 6.0, null),
    ((select id from clients where display_name = 'Test Client One'), 'Bookkeeping catch-up', (current_date - 8), 3.5, null),
    ((select id from clients where display_name = 'Test Client Two'), 'Month-end reconciliation', (current_date - 7), 2.0, null),
    (null, 'Onboarding', (current_date - 6), 1.5, 'New client paperwork'),
    ((select id from clients where display_name = 'Test Client One'), 'Month-end reconciliation', (current_date - 2), 4.5, null),
    ((select id from clients where display_name = 'Test Client Two'), 'Ad-hoc / client request', (current_date - 1), 2.0, 'Client called with a question')
) as v(client_id, category_name, entry_date, hours, note);
