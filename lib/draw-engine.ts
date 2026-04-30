/**
 * GolfDraw — Draw Engine
 * Supports: random draw & weighted draw (by score frequency)
 */

export type DrawType = "random" | "weighted";

export interface UserScore {
  userId: string;
  scores: number[]; // up to 5 stableford scores
}

export interface DrawResult {
  winningNumbers: number[];
  drawType: DrawType;
  metadata: {
    totalParticipants: number;
    scoreFrequencies: Record<number, number>;
  };
}

export interface MatchResult {
  userId: string;
  matchType: "5_match" | "4_match" | "3_match" | null;
  matchedNumbers: number[];
  matchCount: number;
}

/**
 * Run the draw and return 5 winning numbers
 */
export function runDraw(
  participants: UserScore[],
  drawType: DrawType,
): DrawResult {
  // Collect all scores from all participants
  const allScores = participants.flatMap((p) => p.scores);

  // Frequency map
  const freq: Record<number, number> = {};
  for (const s of allScores) {
    freq[s] = (freq[s] || 0) + 1;
  }

  let winningNumbers: number[];

  if (drawType === "random") {
    winningNumbers = pickRandom(allScores, 5);
  } else {
    winningNumbers = pickWeighted(freq, 5);
  }

  return {
    winningNumbers,
    drawType,
    metadata: {
      totalParticipants: participants.length,
      scoreFrequencies: freq,
    },
  };
}

/**
 * Random selection — standard lottery style
 * Picks 5 unique numbers from pool
 */
function pickRandom(pool: number[], count: number): number[] {
  const unique = [...new Set(pool)];
  const shuffled = unique.sort(() => Math.random() - 0.5);
  // If not enough unique scores, pad with random 1-45
  while (shuffled.length < count) {
    const n = Math.floor(Math.random() * 45) + 1;
    if (!shuffled.includes(n)) shuffled.push(n);
  }
  return shuffled.slice(0, count).sort((a, b) => a - b);
}

/**
 * Weighted selection — scores that appear more frequently get higher probability
 * (can also invert for "least frequent" draw)
 */
function pickWeighted(freq: Record<number, number>, count: number): number[] {
  const entries = Object.entries(freq).map(([score, f]) => ({
    score: parseInt(score),
    weight: f,
  }));

  const selected: number[] = [];
  const available = [...entries];

  while (selected.length < count && available.length > 0) {
    const totalWeight = available.reduce((sum, e) => sum + e.weight, 0);
    let rand = Math.random() * totalWeight;
    let idx = 0;
    for (let i = 0; i < available.length; i++) {
      rand -= available[i].weight;
      if (rand <= 0) {
        idx = i;
        break;
      }
    }
    selected.push(available[idx].score);
    available.splice(idx, 1);
  }

  // Pad if needed
  while (selected.length < count) {
    const n = Math.floor(Math.random() * 45) + 1;
    if (!selected.includes(n)) selected.push(n);
  }

  return selected.sort((a, b) => a - b);
}

/**
 * Check a user's scores against winning numbers
 */
export function checkMatch(
  userScores: number[],
  winningNumbers: number[],
): MatchResult | null {
  const matched = userScores.filter((s) => winningNumbers.includes(s));
  const count = matched.length;

  if (count >= 5) {
    return {
      userId: "",
      matchType: "5_match",
      matchedNumbers: matched,
      matchCount: 5,
    };
  } else if (count === 4) {
    return {
      userId: "",
      matchType: "4_match",
      matchedNumbers: matched,
      matchCount: 4,
    };
  } else if (count === 3) {
    return {
      userId: "",
      matchType: "3_match",
      matchedNumbers: matched,
      matchCount: 3,
    };
  }
  return null;
}

/**
 * Calculate prize distribution from total pool
 */
export interface PrizePool {
  jackpot: number; // 40% — 5-match
  pool4: number; // 35% — 4-match
  pool3: number; // 25% — 3-match
}

export function calculatePrizePools(
  totalPool: number,
  rolloverJackpot: number = 0,
): PrizePool {
  return {
    jackpot: totalPool * 0.4 + rolloverJackpot,
    pool4: totalPool * 0.35,
    pool3: totalPool * 0.25,
  };
}

/**
 * Split prize equally among multiple winners of same tier
 */
export function splitPrize(totalPrize: number, winnerCount: number): number {
  if (winnerCount === 0) return 0;
  return Math.floor((totalPrize / winnerCount) * 100) / 100; // 2dp
}
