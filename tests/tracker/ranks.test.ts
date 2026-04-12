import { describe, expect, it } from "vitest";
import {
  RANKS,
  calculateXp,
  getCurrentRank,
  getNextRankThreshold,
  getProgressToNextRank,
} from "../../src/tracker/ranks";

describe("ranks — XP math and rank progression", () => {
  describe("RANKS constant", () => {
    it("defines 10 ranks from tier 1 to 10", () => {
      expect(RANKS).toHaveLength(10);
      expect(RANKS[0].tier).toBe(1);
      expect(RANKS[9].tier).toBe(10);
    });

    it("gives Hunt & Peck tier 1 rank 🐾", () => {
      const rank = RANKS.find((r) => r.tier === 1);
      expect(rank?.name).toBe("Hunt & Peck");
      expect(rank?.emoji).toBe("🐾");
    });

    it("gives Flying Fingers tier 10 rank ✨", () => {
      const rank = RANKS.find((r) => r.tier === 10);
      expect(rank?.name).toBe("Flying Fingers");
      expect(rank?.emoji).toBe("✨");
    });

    it("all tiers have unique names and emojis", () => {
      const names = RANKS.map((r) => r.name);
      const emojis = RANKS.map((r) => r.emoji);
      expect(new Set(names).size).toBe(10);
      expect(new Set(emojis).size).toBe(10);
    });

    it("thresholds are in ascending order", () => {
      for (let i = 1; i < RANKS.length; i++) {
        expect(RANKS[i].thresholdXp).toBeGreaterThan(
          RANKS[i - 1].thresholdXp,
        );
      }
    });
  });

  describe("calculateXp()", () => {
    it("returns 0 for 0 characters", () => {
      const xp = calculateXp({ charCount: 0, accuracy: 1.0, wpm: 60 });
      expect(xp).toBe(0);
    });

    it("calculates XP using formula: charCount × accuracy × (1 + (wpm - 40) / 100)", () => {
      // 100 chars, 100% accuracy, 60 WPM
      // = 100 × 1.0 × (1 + (60 - 40) / 100)
      // = 100 × 1.0 × 1.2
      // = 120 XP
      const xp = calculateXp({ charCount: 100, accuracy: 1.0, wpm: 60 });
      expect(xp).toBe(120);
    });

    it("applies accuracy multiplier", () => {
      // 100 chars, 80% accuracy, 60 WPM
      // = 100 × 0.8 × 1.2 = 96 XP
      const xp = calculateXp({ charCount: 100, accuracy: 0.8, wpm: 60 });
      expect(xp).toBe(96);
    });

    it("rewards faster typing (WPM > 40)", () => {
      // 100 chars, 100% accuracy, 100 WPM
      // = 100 × 1.0 × (1 + 60/100) = 100 × 1.6 = 160 XP
      const xp = calculateXp({ charCount: 100, accuracy: 1.0, wpm: 100 });
      expect(xp).toBe(160);
    });

    it("penalizes slow typing (WPM < 40)", () => {
      // 100 chars, 100% accuracy, 20 WPM
      // = 100 × 1.0 × (1 + (20 - 40) / 100) = 100 × 0.8 = 80 XP
      const xp = calculateXp({ charCount: 100, accuracy: 1.0, wpm: 20 });
      expect(xp).toBe(80);
    });

    it("rounds to nearest integer", () => {
      // 37 chars, 0.85 accuracy, 73 WPM
      // = 37 × 0.85 × (1 + 33/100) = 37 × 0.85 × 1.33 ≈ 41.99... → 42
      const xp = calculateXp({ charCount: 37, accuracy: 0.85, wpm: 73 });
      expect(Number.isInteger(xp)).toBe(true);
    });
  });

  describe("getCurrentRank()", () => {
    it("returns Hunt & Peck for 0 XP", () => {
      const rank = getCurrentRank(0);
      expect(rank.tier).toBe(1);
      expect(rank.name).toBe("Hunt & Peck");
    });

    it("returns Hunt & Peck for XP below tier 2 threshold", () => {
      const tier2Threshold = RANKS[1].thresholdXp;
      const rank = getCurrentRank(tier2Threshold - 1);
      expect(rank.tier).toBe(1);
    });

    it("returns tier 2 at or above tier 2 threshold", () => {
      const tier2Threshold = RANKS[1].thresholdXp;
      const rank = getCurrentRank(tier2Threshold);
      expect(rank.tier).toBe(2);
    });

    it("returns Flying Fingers for very high XP", () => {
      const rank = getCurrentRank(1000000);
      expect(rank.tier).toBe(10);
      expect(rank.name).toBe("Flying Fingers");
    });

    it("returns correct rank for intermediate XP", () => {
      // Find a tier in the middle
      const tier5Threshold = RANKS[4].thresholdXp;
      const tier6Threshold = RANKS[5].thresholdXp;
      const midpointXp = (tier5Threshold + tier6Threshold) / 2;
      const rank = getCurrentRank(midpointXp);
      expect(rank.tier).toBe(5);
    });
  });

  describe("getNextRankThreshold()", () => {
    it("returns tier 2 threshold when at tier 1", () => {
      const nextThreshold = getNextRankThreshold(0);
      expect(nextThreshold).toBe(RANKS[1].thresholdXp);
    });

    it("returns tier 3 threshold when at tier 2", () => {
      const tier2Threshold = RANKS[1].thresholdXp;
      const nextThreshold = getNextRankThreshold(tier2Threshold);
      expect(nextThreshold).toBe(RANKS[2].thresholdXp);
    });

    it("returns current XP when already at tier 10 (no next rank)", () => {
      const tier10Threshold = RANKS[9].thresholdXp;
      const nextThreshold = getNextRankThreshold(tier10Threshold + 1000);
      expect(nextThreshold).toBe(tier10Threshold + 1000);
    });
  });

  describe("getProgressToNextRank()", () => {
    it("returns 0 progress at tier 1 with 0 XP", () => {
      const progress = getProgressToNextRank(0);
      expect(progress).toBe(0);
    });

    it("returns 0 when just reaching tier 2 threshold", () => {
      const tier2Threshold = RANKS[1].thresholdXp;
      const progress = getProgressToNextRank(tier2Threshold);
      expect(progress).toBeCloseTo(0, 2);
    });

    it("returns fractional progress between tiers", () => {
      const tier2Threshold = RANKS[1].thresholdXp;
      const midpointXp = tier2Threshold / 2;
      const progress = getProgressToNextRank(midpointXp);
      expect(progress).toBeCloseTo(0.5, 2);
    });

    it("returns 1.0 (100%) at tier 10 (maxed out)", () => {
      const tier10Threshold = RANKS[9].thresholdXp;
      const progress = getProgressToNextRank(tier10Threshold);
      expect(progress).toBe(1.0);
    });

    it("clamps to [0, 1]", () => {
      // Edge case: if somehow XP goes negative (shouldn't happen), clamp to 0
      const progress = getProgressToNextRank(0);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(1);
    });
  });

  describe("Rank progression flow", () => {
    it("advances from tier 1 to tier 2 at threshold", () => {
      const tier1Xp = 0;
      const rank1 = getCurrentRank(tier1Xp);
      expect(rank1.tier).toBe(1);

      const tier2Threshold = RANKS[1].thresholdXp;
      const rank2 = getCurrentRank(tier2Threshold);
      expect(rank2.tier).toBe(2);
      expect(rank2.name).toBe("Two-Finger Tapper");
    });

    it("progresses through all ranks with sufficient XP", () => {
      for (let i = 0; i < RANKS.length; i++) {
        const threshold = RANKS[i].thresholdXp;
        const rank = getCurrentRank(threshold);
        expect(rank.tier).toBe(i + 1);
      }
    });
  });
});
