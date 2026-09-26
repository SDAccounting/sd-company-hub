# Company Hub

S+D Accounting's internal Company Hub — one app, one database, real auth and
roles, that consolidates the tools built separately so far (remittance
tracker, cleanup ops, task tracker) and adds what doesn't exist anywhere yet
(unified capacity/margin insight, calendars, onboarding, payroll automation).

Stack: Next.js 16 (App Router) + Supabase (Postgres, Auth, RLS).

## What's here so far (foundation)

- Real authentication (Supabase Auth, email + password) replacing the
  informal name/password scheme the remittance dashboard uses today.
- A `staff` table with role tiers (`admin` / `manager` / `staff`) mirroring
  Double's existing permission model.
- A `clients` table — the normalized master client record, replacing the
  87-tab, no-primary-key spreadsheet. Deliberately has **no credential
  fields** — client logins belong in the firm's password manager, not here.
- Row Level Security: every signed-in staff member can read all clients;
  only admins/managers can create or edit them.
- A working client directory: search + one page per client, matching the
  UI Brad described.

Everything else on the roadmap (tax remittance, task tracker, capacity
dashboard, calendars, stat holiday calculator, onboarding, etc.) builds on
top of this foundation as its own module.

## First-time setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com) —
   this needs to be done by Brad; an AI agent can't sign up for third-party
   services on your behalf. Suggested: name it `sd-company-hub`, region
   closest to Ontario (Canada Central if offered, else US East), and save
   the database password it asks you to set somewhere safe (a password
   manager, not this chat).
2. In the new project's **Settings → API** page, copy the **Project URL**
   and the **anon/public key**. Copy `.env.local.example` to `.env.local`
   in this repo and paste those two values in. (The service role key isn't
   needed yet — leave that line as the placeholder for now.)
3. In the Supabase dashboard's **SQL Editor**, paste the entire contents of
   `supabase/combined_bootstrap.sql` and run it. This creates every table
   built so far (staff, clients, module access, tasks, close tracker,
   client tax/financial accounts) in one shot.
4. **Invite staff** in Supabase Auth (Authentication → Users → Invite user)
   for each person who needs access, using their `@sdaccounting.ca` email.
   They'll get an email to set a password.
5. Once everyone's accepted their invite, go back to the SQL Editor and run
   `supabase/migrations/0002_seed_staff.sql` to link each Supabase Auth
   user to their role (admin/manager/staff — mirrors Double's tiers). Safe
   to re-run as more people are invited later.
6. Tell me it's done — I'll switch the app off its temporary preview data
   and back onto these real tables, then we verify it end-to-end together.
7. `npm install && npm run dev`, then sign in at `/login`.

Going forward, new schema changes land as a new numbered file in
`supabase/migrations/` (e.g. `0008_...sql`) — paste just that one file into
the SQL Editor when it shows up, no need to re-run the combined script.

## Project structure

```
src/
  app/
    login/            sign-in page + server actions (sign in / sign out)
    (app)/             everything behind auth
      layout.tsx       nav shell, current staff lookup, sign-out
      page.tsx         dashboard home (module status grid)
      clients/         client directory (search) + one-page client detail
  lib/
    supabase/          browser / server / proxy Supabase clients
    types.ts           shared TS types (Staff, Client, roles)
  proxy.ts             session refresh + auth gate (Next 16's renamed
                        "middleware" convention)
supabase/
  migrations/
    0001_init.sql      schema: staff, clients, RLS policies
    0002_seed_staff.sql seeds the staff directory from Double's roster
```

## Notes for whoever picks this up next

- This uses Next.js **16**, which has real breaking changes from earlier
  versions (e.g. `middleware.ts` → `proxy.ts`). If an AI coding agent is
  editing this later, `AGENTS.md` in this repo points at the
  version-matched docs bundled in `node_modules/next/dist/docs/` — read
  those before assuming older patterns still apply.
- No client credentials (usernames/passwords) are stored anywhere in this
  app or its database, by design — see the security note above.
