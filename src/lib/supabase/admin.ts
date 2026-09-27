import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role Supabase client for admin-only server actions (inviting new
// auth users, etc). This bypasses RLS entirely -- never import it into
// client-side code, and every caller must check the signed-in staff
// member's role itself before using it.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey || serviceKey === "not-set-yet") {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in .env.local");
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
