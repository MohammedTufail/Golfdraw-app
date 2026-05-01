/**
 * lib/supabase/client.ts
 *
 * WHY NOT TYPED: Passing <Database> to createBrowserClient causes TypeScript
 * to enforce Insert/Update types so strictly that any .insert()/.update() in
 * client components fails with "never" during `next build` (even if it works
 * at runtime and in `next dev`).
 *
 * Solution: Use an untyped browser client for client components.
 * The Database type is used only in server-side code (API routes, server.ts)
 * where we have full control and use the admin client anyway.
 */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // No <Database> generic — avoids "never" type collapse on mutations
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
