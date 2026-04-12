/**
 * Typing rank progression system.
 *
 * Defines 10 ranks (tiers) from Hunt & Peck to Flying Fingers, with XP calculations
 * and progression thresholds. Ranks give the typing tracker cover product a sense
 * of progression and achievement.
 */

/**
 * A single rank tier.
 */
export interface Rank {
  /** Tier number (1–10). */
  tier: number;

  /** Display name (e.g., "Hunt & Peck"). */
  name: string;

  /** Emoji for this tier (e.g., "🐾"). */
  emoji: string;

  /** XP required to reach this tier. */
  thresholdXp: number;
}

/**
 * All 10 ranks, in order.
 *
 * Thresholds follow a gentle exponential curve: each successive tier requires
 * more XP than the last, creating a sense of meaningful progression without
 * feeling grindy. Calculated as: baseXp * (tier - 1)^1.8.
 */
export const RANKS: Rank[] = [
  { tier: 1, name: "Hunt & Peck", emoji: "🐾", thresholdXp: 0 },
  {
    tier: 2,
    name: "Two-Finger Tapper",
    emoji: "🐌",
    thresholdXp: Math.round(100 * Math.pow(1, 1.8)),
  },
  {
    tier: 3,
    name: "Keyboard Hatchling",
    emoji: "🐣",
    thresholdXp: Math.round(100 * Math.pow(2, 1.8)),
  },
  {
    tier: 4,
    name: "Home Row Rookie",
    emoji: "🦆",
    thresholdXp: Math.round(100 * Math.pow(3, 1.8)),
  },
  {
    tier: 5,
    name: "Swift Scribe",
    emoji: "🐇",
    thresholdXp: Math.round(100 * Math.pow(4, 1.8)),
  },
  {
    tier: 6,
    name: "Keystroke Fox",
    emoji: "🦊",
    thresholdXp: Math.round(100 * Math.pow(5, 1.8)),
  },
  {
    tier: 7,
    name: "Velocity Hawk",
    emoji: "🦅",
    thresholdXp: Math.round(100 * Math.pow(6, 1.8)),
  },
  {
    tier: 8,
    name: "Lightning Digits",
    emoji: "⚡",
    thresholdXp: Math.round(100 * Math.pow(7, 1.8)),
  },
  {
    tier: 9,
    name: "Phantom Typist",
    emoji: "🌪️",
    thresholdXp: Math.round(100 * Math.pow(8, 1.8)),
  },
  {
    tier: 10,
    name: "Flying Fingers",
    emoji: "✨",
    thresholdXp: Math.round(100 * Math.pow(9, 1.8)),
  },
];

/**
 * Calculate XP earned from a typing session.
 *
 * Formula: charCount × accuracy × (1 + (wpm - 40) / 100)
 *
 * This rewards:
 * - More characters typed (quantity)
 * - Higher accuracy (quality)
 * - Faster typing above 40 WPM baseline
 * - Slower typing still earns XP but at reduced rate (floor at 0)
 *
 * @param session - Session metrics: charCount, accuracy (0–1), wpm
 * @returns XP earned (rounded to nearest integer)
 */
export function calculateXp(session: {
  charCount: number;
  accuracy: number;
  wpm: number;
}): number {
  const { charCount, accuracy, wpm } = session;
  if (charCount === 0) return 0;

  const speedBonus = 1 + (wpm - 40) / 100;
  const xp = charCount * accuracy * speedBonus;
  return Math.round(xp);
}

/**
 * Get the rank tier for a given total XP.
 *
 * @param totalXp - Cumulative XP earned
 * @returns The rank the user is currently at
 */
export function getCurrentRank(totalXp: number): Rank {
  // Find the highest rank whose threshold is <= totalXp
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (totalXp >= RANKS[i].thresholdXp) {
      return RANKS[i];
    }
  }
  return RANKS[0];
}

/**
 * Get the XP threshold for the next rank above the current one.
 *
 * Used to show users how far they have to go to reach the next rank.
 *
 * @param totalXp - Current total XP
 * @returns The threshold XP for the next rank (or current XP if at max rank)
 */
export function getNextRankThreshold(totalXp: number): number {
  const currentRank = getCurrentRank(totalXp);
  if (currentRank.tier >= RANKS.length) {
    // Already at max rank; return current XP (no progress towards anything)
    return totalXp;
  }

  const nextRankIndex = currentRank.tier;
  return RANKS[nextRankIndex].thresholdXp;
}

/**
 * Get progress towards the next rank as a fraction in [0, 1].
 *
 * Returns 0 when just advancing to a new tier, 1.0 when at the next tier's threshold.
 * Used for drawing progress bars.
 *
 * @param totalXp - Current total XP
 * @returns Fraction of progress to next rank (0 to 1)
 */
export function getProgressToNextRank(totalXp: number): number {
  const currentRank = getCurrentRank(totalXp);
  const currentThreshold = currentRank.thresholdXp;
  const nextThreshold = getNextRankThreshold(totalXp);

  if (currentRank.tier >= RANKS.length) {
    // At max rank
    return 1.0;
  }

  const progressXp = totalXp - currentThreshold;
  const requiredXp = nextThreshold - currentThreshold;

  if (requiredXp === 0) {
    // Edge case: shouldn't happen, but clamp
    return 0;
  }

  const progress = progressXp / requiredXp;
  return Math.max(0, Math.min(1, progress));
}
