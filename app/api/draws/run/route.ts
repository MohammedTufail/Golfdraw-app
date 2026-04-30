
/**
 * POST /api/draws/run
 *
 * BUG FIX: Previously this required subscriptions.status = 'active' to find
 * participants. But subscriptions table is empty if LemonSqueezy isn't set up,
 * so the draw always returned "No eligible participants".
 *
 * FIX: We now fetch ALL users who have 3+ scores directly from the scores table.
 * Subscription check is a soft filter — if subscriptions table has data we use it,
 * if it's empty (dev mode / LemonSqueezy not wired) we include everyone with scores.
 * Admin can also force-include all users via forceAll=true in the request body.
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
import type { Database } from "@/lib/supabase/types";

const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  // 1. Verify admin
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

  const body = await req.json();
  const {
    drawId,
    action,
    forceAll = false,
  } = body as {
    drawId: string;
    action: "simulate" | "publish";
    forceAll?: boolean;
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
  if (drawErr || !draw) {
    return NextResponse.json({ error: "Draw not found" }, { status: 404 });
  }

  const drawRow = draw as Database["public"]["Tables"]["draws"]["Row"];

  if (action === "simulate" && drawRow.status !== "pending") {
    return NextResponse.json(
      {
        error:
          "Draw is already simulated or published. Re-run is only available from the draws page.",
      },
      { status: 400 },
    );
  }
  if (action === "publish" && drawRow.status !== "simulated") {
    return NextResponse.json(
      { error: "Simulate the draw first before publishing." },
      { status: 400 },
    );
  }

  // 3. Get eligible user IDs
  // If subscriptions table has data, use it. Otherwise fall back to all users with scores.
  let eligibleUserIds: string[] = [];

  const { count: subCount } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id", { count: "exact", head: true })
    .eq("status", "active");

  const hasSubscriptions = (subCount ?? 0) > 0;

  if (hasSubscriptions && !forceAll) {
    const { data: activeSubs } = await supabaseAdmin
      .from("subscriptions")
      .select("user_id")
      .eq("status", "active");
    eligibleUserIds = (activeSubs || []).map(
      (s: { user_id: string }) => s.user_id,
    );
  } else {
    // Dev mode: include all users who have scores
    const { data: scoringUsers } = await supabaseAdmin
      .from("scores")
      .select("user_id");
    eligibleUserIds = [
      ...new Set(
        (scoringUsers || []).map((s: { user_id: string }) => s.user_id),
      ),
    ];
  }

  if (eligibleUserIds.length === 0) {
    return NextResponse.json(
      {
        error:
          "No users found. Make sure users have entered scores in the dashboard.",
      },
      { status: 400 },
    );
  }

  // 4. Fetch scores for eligible users
  const { data: allScores } = await supabaseAdmin
    .from("scores")
    .select("user_id, stableford_score")
    .in("user_id", eligibleUserIds);

  const participantMap: Record<string, number[]> = {};
  for (const row of allScores || []) {
    const r = row as { user_id: string; stableford_score: number };
    if (!participantMap[r.user_id]) participantMap[r.user_id] = [];
    participantMap[r.user_id].push(r.stableford_score);
  }

  // Need 3+ scores to qualify for the draw
  const participants: UserScore[] = Object.entries(participantMap)
    .filter(([, scores]) => scores.length >= 3)
    .map(([userId, scores]) => ({ userId, scores }));

  if (participants.length === 0) {
    return NextResponse.json(
      {
        error: `Found ${eligibleUserIds.length} user(s) with scores, but none have 3 or more scores. Each user needs at least 3 scores to enter.`,
      },
      { status: 400 },
    );
  }

  // 5. Run draw engine
  const result = runDraw(
    participants,
    drawRow.draw_type as "random" | "weighted",
  );

  // 6. Calculate prize pools (30% of each £9.99 subscription = ~£3/user)
  const totalSubscribers = eligibleUserIds.length;
  const prizePoolGBP = totalSubscribers * ((999 * 0.3) / 100);

  // Check for rollover from previous draw's unclaimed jackpot
  const { data: prevDraws } = await supabaseAdmin
    .from("draws")
    .select("jackpot_amount, jackpot_rolled_over")
    .eq("status", "published")
    .eq("jackpot_rolled_over", true)
    .order("draw_month", { ascending: false })
    .limit(1);

  const rolloverAmount =
    (
      prevDraws as Array<{
        jackpot_amount: number;
        jackpot_rolled_over: boolean;
      }> | null
    )?.[0]?.jackpot_amount ?? 0;
  const pools = calculatePrizePools(prizePoolGBP, rolloverAmount);

  // 7. Save simulated or published result
  const drawUpdatePayload: Database["public"]["Tables"]["draws"]["Update"] = {
    winning_numbers: result.winningNumbers,
    jackpot_amount: pools.jackpot,
    pool_4match: pools.pool4,
    pool_3match: pools.pool3,
    total_subscribers: totalSubscribers,
    status: action === "simulate" ? "simulated" : "published",
    published_at: action === "publish" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  await supabaseAdmin
    .from("draws")
    .update(drawUpdatePayload)
    .eq("id", drawId);

  // 8. On publish: find winners, create records
  if (action === "publish") {
    const fiveMatch: string[] = [];
    const fourMatch: string[] = [];
    const threeMatch: string[] = [];

    for (const p of participants) {
      const m = checkMatch(p.scores, result.winningNumbers);
      if (!m) continue;
      if (m.matchCount >= 5) fiveMatch.push(p.userId);
      else if (m.matchCount === 4) fourMatch.push(p.userId);
      else if (m.matchCount === 3) threeMatch.push(p.userId);
    }

    const inserts: Database["public"]["Tables"]["winners"]["Insert"][] = [];

    if (fiveMatch.length > 0) {
      const share = splitPrize(pools.jackpot, fiveMatch.length);
      for (const uid of fiveMatch) {
        const m = checkMatch(participantMap[uid], result.winningNumbers)!;
        inserts.push({
          draw_id: drawId,
          user_id: uid,
          match_type: "5_match",
          matched_numbers: m.matchedNumbers,
          prize_amount: share,
        });
      }
    } else {
      await supabaseAdmin
        .from("draws")
        .update({ jackpot_rolled_over: true })
        .eq("id", drawId);
    }

    if (fourMatch.length > 0) {
      const share = splitPrize(pools.pool4, fourMatch.length);
      for (const uid of fourMatch) {
        const m = checkMatch(participantMap[uid], result.winningNumbers)!;
        inserts.push({
          draw_id: drawId,
          user_id: uid,
          match_type: "4_match",
          matched_numbers: m.matchedNumbers,
          prize_amount: share,
        });
      }
    }

    if (threeMatch.length > 0) {
      const share = splitPrize(pools.pool3, threeMatch.length);
      for (const uid of threeMatch) {
        const m = checkMatch(participantMap[uid], result.winningNumbers)!;
        inserts.push({
          draw_id: drawId,
          user_id: uid,
          match_type: "3_match",
          matched_numbers: m.matchedNumbers,
          prize_amount: share,
        });
      }
    }

    if (inserts.length > 0) {
      await supabaseAdmin.from("winners").insert(inserts);
    }

    // Enrich winner details with names
    const allWinnerIds = [...fiveMatch, ...fourMatch, ...threeMatch];
    const winnerDetails = await Promise.all(
      allWinnerIds.map(async (uid) => {
        const { data: prof } = await supabaseAdmin
          .from("profiles")
          .select("full_name, email")
          .eq("id", uid)
          .single();
        const p = prof as { full_name: string | null; email: string } | null;
        const m = checkMatch(participantMap[uid], result.winningNumbers)!;
        return {
          userId: uid,
          name: p?.full_name || p?.email || uid,
          matchCount: m.matchCount,
          matchedNumbers: m.matchedNumbers,
        };
      }),
    );

    return NextResponse.json({
      success: true,
      mode:
        hasSubscriptions && !forceAll
          ? "subscriptions"
          : "all_users_with_scores",
      winningNumbers: result.winningNumbers,
      totalParticipants: participants.length,
      prizePool: {
        jackpot: pools.jackpot,
        pool4: pools.pool4,
        pool3: pools.pool3,
      },
      winners: {
        jackpot: fiveMatch.length,
        fourMatch: fourMatch.length,
        threeMatch: threeMatch.length,
        total: inserts.length,
        details: winnerDetails,
      },
    });
  }

  // Simulate response — who WOULD win
  const wouldWin = participants
    .map((p) => {
      const m = checkMatch(p.scores, result.winningNumbers);
      if (!m || m.matchCount < 3) return null;
      return {
        userId: p.userId,
        scores: p.scores,
        matchCount: m.matchCount,
        matchedNumbers: m.matchedNumbers,
      };
    })
    .filter(Boolean);

  const wouldWinWithNames = await Promise.all(
    (wouldWin as NonNullable<(typeof wouldWin)[0]>[]).map(async (p) => {
      const { data: prof } = await supabaseAdmin
        .from("profiles")
        .select("full_name, email")
        .eq("id", p.userId)
        .single();
      const pr = prof as { full_name: string | null; email: string } | null;
      return { ...p, name: pr?.full_name || pr?.email || p.userId };
    }),
  );

  return NextResponse.json({
    success: true,
    action: "simulated",
    mode:
      hasSubscriptions && !forceAll ? "subscriptions" : "all_users_with_scores",
    winningNumbers: result.winningNumbers,
    totalParticipants: participants.length,
    prizePool: {
      jackpot: pools.jackpot,
      pool4: pools.pool4,
      pool3: pools.pool3,
    },
    wouldWin: wouldWinWithNames,
  });
}







/* 
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from "@supabase/ssr";
import { runDraw, checkMatch, calculatePrizePools, splitPrize, type UserScore } from '@/lib/draw-engine'
 
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
 
export async function POST(req: Request) {
  // 1. Verify admin
const cookieStore = await cookies();

const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
    },
  },
);  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
 
  const { data: me } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
 
  const body = await req.json()
  const { drawId, action, forceAll = false } = body as { drawId: string; action: 'simulate' | 'publish'; forceAll?: boolean }
 
  if (!drawId || !['simulate', 'publish'].includes(action)) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
  }
 
  // 2. Load draw
  const { data: draw, error: drawErr } = await supabaseAdmin.from('draws').select('*').eq('id', drawId).single()
  if (drawErr || !draw) return NextResponse.json({ error: 'Draw not found' }, { status: 404 })
 
  if (action === 'simulate' && draw.status !== 'pending') {
    return NextResponse.json({ error: 'Draw is already simulated or published' }, { status: 400 })
  }
  if (action === 'publish' && draw.status !== 'simulated') {
    return NextResponse.json({ error: 'Simulate the draw first before publishing' }, { status: 400 })
  }
 
  // 3. Get eligible user IDs
  // Strategy: try active subscribers first. If none found (table empty / dev mode), fall back to all users with scores.
  let eligibleUserIds: string[] = []
 
  const { data: activeSubs, count: subCount } = await supabaseAdmin
    .from('subscriptions').select('user_id', { count: 'exact' }).eq('status', 'active')
 
  const hasSubscriptions = (subCount ?? 0) > 0
 
  if (hasSubscriptions && !forceAll) {
    eligibleUserIds = (activeSubs || []).map((s: { user_id: string }) => s.user_id)
  } else {
    // DEV MODE or forceAll: use all users who have entered scores
    const { data: allScoringUsers } = await supabaseAdmin
      .from('scores').select('user_id').order('user_id')
    const uniqueIds = [...new Set((allScoringUsers || []).map((s: { user_id: string }) => s.user_id))]
    eligibleUserIds = uniqueIds
  }
 
  if (eligibleUserIds.length === 0) {
    return NextResponse.json({ error: 'No users found. Add scores to at least one user account first.' }, { status: 400 })
  }
 
  // 4. Fetch all scores for eligible users
  const { data: allScores } = await supabaseAdmin
    .from('scores')
    .select('user_id, stableford_score')
    .in('user_id', eligibleUserIds)
 
  // Group by user
  const participantMap: Record<string, number[]> = {}
  for (const row of (allScores || [])) {
    if (!participantMap[row.user_id]) participantMap[row.user_id] = []
    participantMap[row.user_id].push(row.stableford_score)
  }
 
  // Must have 3+ scores to qualify
  const participants: UserScore[] = Object.entries(participantMap)
    .filter(([, scores]) => scores.length >= 3)
    .map(([userId, scores]) => ({ userId, scores }))
 
  if (participants.length === 0) {
    return NextResponse.json({
      error: `Found ${eligibleUserIds.length} users but none have 3+ scores. Each user needs at least 3 scores to enter the draw.`
    }, { status: 400 })
  }
 
  // 5. Run draw engine
  const result = runDraw(participants, draw.draw_type as 'random' | 'weighted')
 
  // 6. Calculate prize pools
  const totalSubscribers = eligibleUserIds.length
  const prizePoolGBP = totalSubscribers * (999 * 0.30 / 100) // £9.99 × 30%
 
  // Check rollover from previous unpublished jackpot
  const { data: prevDraws } = await supabaseAdmin
    .from('draws').select('id, jackpot_amount, jackpot_rolled_over')
    .eq('status', 'published').eq('jackpot_rolled_over', true)
    .order('draw_month', { ascending: false }).limit(1)
 
  const rolloverAmount = prevDraws?.[0]?.jackpot_amount || 0
  const pools = calculatePrizePools(prizePoolGBP, rolloverAmount)
 
  // 7. Save draw result
  await supabaseAdmin.from('draws').update({
    winning_numbers: result.winningNumbers,
    jackpot_amount: pools.jackpot,
    pool_4match: pools.pool4,
    pool_3match: pools.pool3,
    total_subscribers: totalSubscribers,
    status: action === 'simulate' ? 'simulated' : 'published',
    published_at: action === 'publish' ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq('id', drawId)
 
  // 8. On publish: match scores → create winner records
  if (action === 'publish') {
    const fiveMatch: string[] = []
    const fourMatch: string[] = []
    const threeMatch: string[] = []
 
    for (const p of participants) {
      const m = checkMatch(p.scores, result.winningNumbers)
      if (!m) continue
      if (m.matchCount >= 5) fiveMatch.push(p.userId)
      else if (m.matchCount === 4) fourMatch.push(p.userId)
      else if (m.matchCount === 3) threeMatch.push(p.userId)
    }
 
    const inserts: object[] = []
 
    if (fiveMatch.length > 0) {
      const share = splitPrize(pools.jackpot, fiveMatch.length)
      for (const uid of fiveMatch) {
        const m = checkMatch(participantMap[uid], result.winningNumbers)!
        inserts.push({ draw_id: drawId, user_id: uid, match_type: '5_match', matched_numbers: m.matchedNumbers, prize_amount: share })
      }
    } else {
      await supabaseAdmin.from('draws').update({ jackpot_rolled_over: true }).eq('id', drawId)
    }
 
    if (fourMatch.length > 0) {
      const share = splitPrize(pools.pool4, fourMatch.length)
      for (const uid of fourMatch) {
        const m = checkMatch(participantMap[uid], result.winningNumbers)!
        inserts.push({ draw_id: drawId, user_id: uid, match_type: '4_match', matched_numbers: m.matchedNumbers, prize_amount: share })
      }
    }
 
    if (threeMatch.length > 0) {
      const share = splitPrize(pools.pool3, threeMatch.length)
      for (const uid of threeMatch) {
        const m = checkMatch(participantMap[uid], result.winningNumbers)!
        inserts.push({ draw_id: drawId, user_id: uid, match_type: '3_match', matched_numbers: m.matchedNumbers, prize_amount: share })
      }
    }
 
    if (inserts.length > 0) {
      await supabaseAdmin.from('winners').insert(inserts)
    }
 
    // Fetch winner names for response
    const winnerDetails = await Promise.all(
      [...fiveMatch, ...fourMatch, ...threeMatch].map(async uid => {
        const { data: prof } = await supabaseAdmin.from('profiles').select('full_name, email').eq('id', uid).single()
        const m = checkMatch(participantMap[uid], result.winningNumbers)!
        return { userId: uid, name: prof?.full_name || prof?.email || uid, matchCount: m.matchCount, matchedNumbers: m.matchedNumbers }
      })
    )
 
    return NextResponse.json({
      success: true,
      mode: hasSubscriptions && !forceAll ? 'subscriptions' : 'all_users_with_scores',
      winningNumbers: result.winningNumbers,
      totalParticipants: participants.length,
      prizePool: { jackpot: pools.jackpot, pool4: pools.pool4, pool3: pools.pool3 },
      winners: {
        jackpot: fiveMatch.length,
        fourMatch: fourMatch.length,
        threeMatch: threeMatch.length,
        total: inserts.length,
        details: winnerDetails,
      },
    })
  }
 
  // Simulate response — show who WOULD win with these numbers
  const preview = participants.map(p => {
    const m = checkMatch(p.scores, result.winningNumbers)
    return { userId: p.userId, scores: p.scores, matchCount: m?.matchCount || 0, matchedNumbers: m?.matchedNumbers || [] }
  }).filter(p => p.matchCount >= 3)
 
  // Enrich with names
  const previewWithNames = await Promise.all(
    preview.map(async p => {
      const { data: prof } = await supabaseAdmin.from('profiles').select('full_name, email').eq('id', p.userId).single()
      return { ...p, name: prof?.full_name || prof?.email || p.userId }
    })
  )
 
  return NextResponse.json({
    success: true,
    action: 'simulated',
    mode: hasSubscriptions && !forceAll ? 'subscriptions' : 'all_users_with_scores',
    winningNumbers: result.winningNumbers,
    totalParticipants: participants.length,
    prizePool: { jackpot: pools.jackpot, pool4: pools.pool4, pool3: pools.pool3 },
    wouldWin: previewWithNames,
  })
}*/