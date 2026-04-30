/**
 * POST /api/draws/run
 *
 * WHY: The draw engine must run server-side with the service role client
 * so it can read ALL users' scores without RLS blocking it.
 * Two actions:
 *   - "simulate": runs the draw and saves numbers WITHOUT publishing (admin preview)
 *   - "publish":  finalises result, creates winner records, triggers rollover logic
 *
 * Security: Checks caller is admin before proceeding.
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClientInstance } from "@/lib/supabase/server";
import {
  runDraw,
  checkMatch,
  calculatePrizePools,
  splitPrize,
  type UserScore,
} from "@/lib/draw-engine";

// Admin Supabase client — bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  // 1. Verify caller is admin
  const supabaseUser = await createServerClientInstance();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { drawId, action } = body as {
    drawId: string;
    action: "simulate" | "publish";
  };

  if (!drawId || !["simulate", "publish"].includes(action)) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  // 2. Load draw record
  const { data: draw, error: drawErr } = await supabaseAdmin
    .from("draws")
    .select("*")
    .eq("id", drawId)
    .single();
  if (drawErr || !draw)
    return NextResponse.json({ error: "Draw not found" }, { status: 404 });

  if (action === "simulate" && draw.status !== "pending") {
    return NextResponse.json(
      { error: "Draw is not in pending state" },
      { status: 400 },
    );
  }
  if (action === "publish" && draw.status !== "simulated") {
    return NextResponse.json(
      { error: "Draw must be simulated first" },
      { status: 400 },
    );
  }

  // 3. Fetch all active subscribers' scores
  const { data: activeSubs } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id")
    .eq("status", "active");

  const activeUserIds = (activeSubs || []).map((s) => s.user_id);

  const { data: allScores } = await supabaseAdmin
    .from("scores")
    .select("user_id, stableford_score")
    .in("user_id", activeUserIds);

  // Group scores by user
  const participantMap: Record<string, number[]> = {};
  for (const row of allScores || []) {
    if (!participantMap[row.user_id]) participantMap[row.user_id] = [];
    participantMap[row.user_id].push(row.stableford_score);
  }

  // Only include users with at least 3 scores (minimum to qualify)
  const participants: UserScore[] = Object.entries(participantMap)
    .filter(([, scores]) => scores.length >= 3)
    .map(([userId, scores]) => ({ userId, scores }));

  if (participants.length === 0) {
    return NextResponse.json(
      { error: "No eligible participants (need at least 3 scores)" },
      { status: 400 },
    );
  }

  // 4. Run the draw engine
  const result = runDraw(participants, draw.draw_type as "random" | "weighted");

  // 5. Calculate prize pools
  //    Total pool = active subscribers × 30% of monthly fee (£9.99 × 30% = ~£3)
  const totalSubscribers = activeUserIds.length;
  const avgSubPence = 999; // use monthly as base approximation
  const prizePoolPence = totalSubscribers * Math.floor(avgSubPence * 0.3);
  const prizePoolGBP = prizePoolPence / 100;

  // Check previous unpaid jackpot rollover
  const { data: prevDraw } = await supabaseAdmin
    .from("draws")
    .select("jackpot_amount, jackpot_rolled_over")
    .eq("status", "published")
    .order("draw_month", { ascending: false })
    .limit(1)
    .single();

  // If previous jackpot had no 5-match winner, it rolls over
  const { data: prevJackpotWinner } = prevDraw
    ? await supabaseAdmin
        .from("winners")
        .select("id")
        .eq("match_type", "5_match")
        .limit(1)
        .maybeSingle()
    : { data: null };

  const rolloverAmount =
    prevDraw && !prevJackpotWinner ? prevDraw.jackpot_amount || 0 : 0;
  const pools = calculatePrizePools(prizePoolGBP, rolloverAmount);

  // 6. Save the simulated/published draw
  await supabaseAdmin
    .from("draws")
    .update({
      winning_numbers: result.winningNumbers,
      jackpot_amount: pools.jackpot,
      pool_4match: pools.pool4,
      pool_3match: pools.pool3,
      total_subscribers: totalSubscribers,
      status: action === "simulate" ? "simulated" : "published",
      published_at: action === "publish" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", drawId);

  // 7. On publish: find winners and create records
  if (action === "publish") {
    const fiveMatchWinners: string[] = [];
    const fourMatchWinners: string[] = [];
    const threeMatchWinners: string[] = [];

    // Check every participant's scores against winning numbers
    for (const participant of participants) {
      const matchResult = checkMatch(participant.scores, result.winningNumbers);
      if (!matchResult) continue;

      if (matchResult.matchCount >= 5)
        fiveMatchWinners.push(participant.userId);
      else if (matchResult.matchCount === 4)
        fourMatchWinners.push(participant.userId);
      else if (matchResult.matchCount === 3)
        threeMatchWinners.push(participant.userId);
    }

    const winnerInserts: any[] = [];

    // 5-match jackpot
    if (fiveMatchWinners.length > 0) {
      const share = splitPrize(pools.jackpot, fiveMatchWinners.length);
      for (const uid of fiveMatchWinners) {
        const m = checkMatch(participantMap[uid], result.winningNumbers)!;
        winnerInserts.push({
          draw_id: drawId,
          user_id: uid,
          match_type: "5_match",
          matched_numbers: m.matchedNumbers,
          prize_amount: share,
        });
      }
    } else {
      // No 5-match — jackpot rolls to next draw
      await supabaseAdmin
        .from("draws")
        .update({ jackpot_rolled_over: true })
        .eq("id", drawId);
    }

    // 4-match
    if (fourMatchWinners.length > 0) {
      const share = splitPrize(pools.pool4, fourMatchWinners.length);
      for (const uid of fourMatchWinners) {
        const m = checkMatch(participantMap[uid], result.winningNumbers)!;
        winnerInserts.push({
          draw_id: drawId,
          user_id: uid,
          match_type: "4_match",
          matched_numbers: m.matchedNumbers,
          prize_amount: share,
        });
      }
    }

    // 3-match
    if (threeMatchWinners.length > 0) {
      const share = splitPrize(pools.pool3, threeMatchWinners.length);
      for (const uid of threeMatchWinners) {
        const m = checkMatch(participantMap[uid], result.winningNumbers)!;
        winnerInserts.push({
          draw_id: drawId,
          user_id: uid,
          match_type: "3_match",
          matched_numbers: m.matchedNumbers,
          prize_amount: share,
        });
      }
    }

    if (winnerInserts.length > 0) {
      await supabaseAdmin.from("winners").insert(winnerInserts);
    }

    return NextResponse.json({
      success: true,
      winningNumbers: result.winningNumbers,
      totalParticipants: participants.length,
      winners: {
        jackpot: fiveMatchWinners.length,
        fourMatch: fourMatchWinners.length,
        threeMatch: threeMatchWinners.length,
      },
    });
  }

  return NextResponse.json({
    success: true,
    action: "simulated",
    winningNumbers: result.winningNumbers,
    totalParticipants: participants.length,
  });
}
