/**
 * POST /api/winners/upload-proof
 *
 * WHY: Winners are required to submit a screenshot of their official golf
 * platform scores as verification before payouts are approved.
 * This endpoint handles secure file upload to Supabase Storage.
 *
 * HOW: Client sends multipart form with file + winnerId.
 * We validate ownership, upload to 'proofs' bucket, update winner record.
 */

import { NextResponse } from "next/server";
import { createServerClientInstance } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
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

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const winnerId = formData.get("winnerId") as string | null;

  if (!file || !winnerId) {
    return NextResponse.json(
      { error: "Missing file or winnerId" },
      { status: 400 },
    );
  }

  // Verify this winner record belongs to the current user
  const { data: winner } = await supabaseAdmin
    .from("winners")
    .select("id, user_id, verification_status")
    .eq("id", winnerId)
    .single();

  if (!winner || winner.user_id !== user.id) {
    return NextResponse.json(
      { error: "Winner record not found or unauthorised" },
      { status: 403 },
    );
  }

  if (winner.verification_status === "approved") {
    return NextResponse.json(
      { error: "Already approved — no changes allowed" },
      { status: 400 },
    );
  }

  // Validate file type (image only)
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Only image files allowed (JPEG, PNG, WebP)" },
      { status: 400 },
    );
  }

  // Max 5MB
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File too large — max 5MB" },
      { status: 400 },
    );
  }

  const ext = file.type.split("/")[1];
  const filePath = `proofs/${user.id}/${winnerId}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadErr } = await supabaseAdmin.storage
    .from("proofs")
    .upload(filePath, arrayBuffer, {
      contentType: file.type,
      upsert: true, // Replace if re-uploading
    });

  if (uploadErr) {
    console.error("Storage upload error:", uploadErr);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  // Get public URL
  const { data: urlData } = supabaseAdmin.storage
    .from("proofs")
    .getPublicUrl(filePath);

  // Update winner record with proof URL
  await supabaseAdmin
    .from("winners")
    .update({
      proof_url: urlData.publicUrl,
      verification_status: "pending", // Reset to pending for admin review
      updated_at: new Date().toISOString(),
    })
    .eq("id", winnerId);

  return NextResponse.json({ success: true, url: urlData.publicUrl });
}
