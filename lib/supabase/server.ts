import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

/**
 * Server-side Supabase client (anon key, respects RLS)
 * Use in Server Components and API routes for user-scoped queries.
 */
export async function createServerClientInstance() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* ignore in Server Components */
          }
        },
      },
    },
  );
}

/**
 * Admin Supabase client (service role key, bypasses RLS)
 * Use ONLY in API routes that have already verified the user is admin.
 * NEVER expose this client to the browser.
 */
export function createAdminClient() {
  const { createClient } = require("@supabase/supabase-js");
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
