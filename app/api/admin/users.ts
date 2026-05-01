/**
 * GET /api/admin/users
 *
 * WHY THIS EXISTS: The admin users page uses a client-side Supabase call
 * with the anon key. Supabase RLS only allows users to see their OWN profile row.
 * Even with an admin role, the anon key cannot read all rows.
 *
 * FIX: This server route uses the SERVICE ROLE key which bypasses RLS entirely,
 * verifies the caller is admin first, then returns all users safely.
 */


import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClientInstance } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET() {
  // 1. Verify caller is admin (using anon client — respects RLS for auth check)
  const supabase = await createServerClientInstance();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: me } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if ((me as { role: string } | null)?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 2. Fetch ALL profiles with joined data (service role bypasses RLS)
  const { data: profiles, error } = await supabaseAdmin
    .from("profiles")
    .select(
      `
      id, email, full_name, role, charity_contribution_pct, created_at,
      charities ( id, name ),
      subscriptions ( id, plan, status, amount_pence, renewal_date )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 3. Get score counts per user
  const { data: scoreCounts } = await supabaseAdmin
    .from("scores")
    .select("user_id");

  const scoreMap: Record<string, number> = {};
  for (const row of (scoreCounts as { user_id: string }[]) || []) {
    scoreMap[row.user_id] = (scoreMap[row.user_id] || 0) + 1;
  }

  const enriched = (profiles || []).map((p: any) => ({
    ...p,
    score_count: scoreMap[p.id] || 0,
  }));

  return NextResponse.json({ users: enriched });
}









/*
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: Request) {
  // 1. Verify the requester is an authenticated admin
const cookieStore = cookies();

const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
    },
  },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: me } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // 2. Fetch ALL profiles with joined charity + subscription data
  const { data: profiles, error } = await supabaseAdmin
    .from("profiles")
    .select(
      `
      id,
      email,
      full_name,
      role,
      charity_contribution_pct,
      created_at,
      charities ( id, name ),
      subscriptions ( id, plan, status, amount_pence, renewal_date, created_at )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Admin users fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 3. Also fetch score counts per user in one query
  const { data: scoreCounts } = await supabaseAdmin
    .from("scores")
    .select("user_id");

  const scoreMap: Record<string, number> = {};
  for (const row of scoreCounts || []) {
    scoreMap[row.user_id] = (scoreMap[row.user_id] || 0) + 1;
  }

  // 4. Merge score counts into profiles
  const enriched = (profiles || []).map((p) => ({
    ...p,
    score_count: scoreMap[p.id] || 0,
  }));

  return NextResponse.json({ users: enriched });
}
*/