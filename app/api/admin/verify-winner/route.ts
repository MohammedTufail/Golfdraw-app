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
"use client";
import { NextResponse } from "next/server";
import { createServerClientInstance } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  // Verify admin
  const supabase = await createServerClientInstance();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { winnerId, action } = (await req.json()) as {
    winnerId: string;
    action: "approve" | "reject" | "mark_paid";
  };

  if (!winnerId || !["approve", "reject", "mark_paid"].includes(action)) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  let updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (action === "approve") {
    updateData.verification_status = "approved";
    updateData.verified_at = new Date().toISOString();
  } else if (action === "reject") {
    updateData.verification_status = "rejected";
    updateData.proof_url = null; // Force re-upload
  } else if (action === "mark_paid") {
    updateData.payout_status = "paid";
    updateData.paid_at = new Date().toISOString();
  }

  const { error } = await supabaseAdmin
    .from("winners")
    .update(updateData)
    .eq("id", winnerId);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
