// One-off admin utility: sets a user's password directly via Supabase's
// Admin API, bypassing email entirely (useful when the built-in email
// rate limit is blocking invite/reset emails, or any time you just need
// to set someone's password without a round trip).
//
// Usage (from the company-hub folder):
//   node --env-file=.env.local scripts/admin-set-password.mjs <email> <newPassword>
//
// Requires SUPABASE_SERVICE_ROLE_KEY to be set in .env.local (Settings ->
// API -> "secret key" / service_role in your Supabase project). Never
// commit that key — .env.local is already gitignored.

import { createClient } from "@supabase/supabase-js";

const [, , email, password] = process.argv;

if (!email || !password) {
  console.error("Usage: node --env-file=.env.local scripts/admin-set-password.mjs <email> <newPassword>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey || serviceKey === "not-set-yet") {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey);

const { data, error: listError } = await admin.auth.admin.listUsers();
if (listError) {
  console.error("Couldn't list users:", listError.message);
  process.exit(1);
}

const user = data.users.find((u) => u.email === email);
if (!user) {
  console.error(`No auth user found with email ${email}`);
  process.exit(1);
}

const { error: updateError } = await admin.auth.admin.updateUserById(user.id, { password });
if (updateError) {
  console.error("Couldn't set password:", updateError.message);
  process.exit(1);
}

console.log(`Password set for ${email}.`);
