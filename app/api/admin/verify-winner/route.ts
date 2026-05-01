/**
 * POST /api/admin/verify-winner
 *
 * WHY: Admin must review submitted proof screenshots before prizes are paid.
 * This prevents fraudulent claims — users must show their real golf platform scores.
 *
 * Actions:
 *   - "approve": sets verification_status to approved, payout_status to pending
 *   - "reject":  sets verification_status to rejected (user can re-upload)
 *   - "mark_paid": marks payout as completed after manual bank transfer
 */



import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClientInstance } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
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

  const { winnerId, action } = (await req.json()) as {
    winnerId: string;
    action: "approve" | "reject" | "mark_paid";
  };

  if (!winnerId || !["approve", "reject", "mark_paid"].includes(action)) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const now = new Date().toISOString();
  let updateData: Database["public"]["Tables"]["winners"]["Update"] = {
    updated_at: now,
  };

  if (action === "approve") {
    updateData = {
      ...updateData,
      verification_status: "approved",
      verified_at: now,
    };
  } else if (action === "reject") {
    updateData = {
      ...updateData,
      verification_status: "rejected",
      proof_url: null,
    };
  } else if (action === "mark_paid") {
    updateData = { ...updateData, payout_status: "paid", paid_at: now };
  }

  const { error } = await supabaseAdmin
    .from("winners")
    .update(updateData as never)
    .eq("id", winnerId);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
/*
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Admin client (server-side only)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
);

export async function POST(req: Request) {
  try {
    // -----------------------------
    // 1. Check Authorization Header
    // -----------------------------
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Missing authorization" },
        { status: 401 },
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // -----------------------------
    // 2. Verify User (Anon Client)
    // -----------------------------
    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // -----------------------------
    // 3. Check Admin Role
    // -----------------------------
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // -----------------------------
    // 4. Parse Request Body
    // -----------------------------
    const { winnerId, action } = await req.json();

    const validActions = ["approve", "reject", "mark_paid"];

    if (!winnerId || !validActions.includes(action)) {
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400 },
      );
    }

    // -----------------------------
    // 5. Prepare Update Data
    // -----------------------------
    const now = new Date().toISOString();

    let updateData: Record<string, any> = {
      updated_at: now,
    };

    if (action === "approve") {
      updateData.verification_status = "approved";
      updateData.verified_at = now;
    }

    if (action === "reject") {
      updateData.verification_status = "rejected";
      updateData.proof_url = null;
    }

    if (action === "mark_paid") {
      updateData.payout_status = "paid";
      updateData.paid_at = now;
    }

    // -----------------------------
    // 6. Update Database
    // -----------------------------
    const { error: updateError } = await supabaseAdmin
      .from("winners")
      .update(updateData)
      .eq("id", winnerId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // -----------------------------
    // 7. Success Response
    // -----------------------------
    return NextResponse.json({
      success: true,
    });
  } catch (err) {
    console.error("API Error:", err);

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
  */