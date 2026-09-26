-- Seeds the staff directory once each person has accepted a Supabase Auth
-- invite (see README "First-time setup"). Matches on email, so this is safe
-- to re-run after inviting more people.
--
-- Role mapping was originally carried over from Double's existing tiers,
-- but Brad has since deliberately overridden Erica and Lesley to 'staff'
-- rather than 'manager' for now — this table is the actual source of
-- truth for Hub roles going forward, not a mirror of Double.
--
-- The shared "bookkeeping@sdaccounting.ca" mailbox from Double is
-- intentionally left out — it's a shared inbox, not an individual staff
-- member, and shouldn't be a named login here.

insert into staff (auth_user_id, full_name, email, role)
select u.id, v.full_name, v.email, v.role::staff_role
from (
  values
    ('Brad Kernohan',   'brad@sdaccounting.ca',   'admin'),
    ('Bradon Levalds',  'bradon@sdaccounting.ca', 'admin'),
    ('Erica Greeley',   'erica@sdaccounting.ca',  'staff'),
    ('Lesley Hodge',    'lesley@sdaccounting.ca', 'staff'),
    ('Joanne Robinson', 'joanne@sdaccounting.ca', 'staff'),
    ('Sue Coffell',     'sue@sdaccounting.ca',    'staff'),
    ('Janice',           'janice@sdaccounting.ca', 'staff') -- last name TBD
) as v(full_name, email, role)
join auth.users u on u.email = v.email
on conflict (email) do update set
  full_name = excluded.full_name,
  role = excluded.role;
