-- One-off: seeds Brad's personal test/dummy staff account, separate from
-- 0002_seed_staff.sql (which only matches the real 6 team emails). Run
-- this AFTER inviting bradkernohan@gmail.com via Supabase Auth.
--
-- Role is 'staff' (the most restrictive tier) so testing shows the
-- tightest view — change the role below and re-run to test as
-- 'manager' instead; safe to re-run either way.

insert into staff (auth_user_id, full_name, email, role)
select u.id, 'Brad Kernohan (test)', 'bradkernohan@gmail.com', 'staff'
from auth.users u
where u.email = 'bradkernohan@gmail.com'
on conflict (email) do update set
  full_name = excluded.full_name,
  role = excluded.role;
