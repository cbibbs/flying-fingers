import { describe, expect, it } from "vitest";
import { estimateSessionDuration } from "../../src/engine/estimator";
import { createIkiSampler } from "../../src/engine/timing";

/**
 * Deterministic PRNG (mulberry32) — same as in timing.test.ts.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Repeat a string to a target length. */
function repeat(s: string, n: number): string {
  return s.repeat(Math.ceil(n / s.length)).slice(0, n);
}

describe("estimateSessionDuration", () => {
  it("returns a positive number for non-empty text", () => {
    const d = estimateSessionDuration({
      sourceText: "hello",
      medianMs: 239,
      sigmaMs: 112,
      rng: mulberry32(1),
    });
    expect(d).toBeGreaterThan(0);
    expect(Number.isFinite(d)).toBe(true);
  });

  it("returns 0 for empty text", () => {
    const d = estimateSessionDuration({
      sourceText: "",
      medianMs: 239,
      sigmaMs: 112,
      rng: mulberry32(1),
    });
    expect(d).toBe(0);
  });

  it("is deterministic — same seed produces identical estimates", () => {
    const cfg = { sourceText: "the quick brown fox", medianMs: 239, sigmaMs: 112 };
    const a = estimateSessionDuration({ ...cfg, rng: mulberry32(42) });
    const b = estimateSessionDuration({ ...cfg, rng: mulberry32(42) });
    expect(a).toBe(b);
  });

  it("different seeds produce different estimates", () => {
    const cfg = { sourceText: "the quick brown fox", medianMs: 239, sigmaMs: 112 };
    const a = estimateSessionDuration({ ...cfg, rng: mulberry32(1) });
    const b = estimateSessionDuration({ ...cfg, rng: mulberry32(2) });
    expect(a).not.toBe(b);
  });

  it("estimate scales roughly linearly with text length (no punctuation)", () => {
    // Use longer texts (30 vs 120 chars) so CLT tightens the ratio.
    // Expected ratio of sums is exactly 4.0. At these lengths the sum CV is
    // small enough that 3.5-4.5 (~3σ) is safe and catches O(n^2) bugs.
    const short = repeat("abcdefghij", 30); // 30 chars
    const long = repeat("abcdefghij", 120); // 120 chars
    const cfg = { medianMs: 200, sigmaMs: 50 };
    const dShort = estimateSessionDuration({ ...cfg, sourceText: short, rng: mulberry32(7) });
    const dLong = estimateSessionDuration({ ...cfg, sourceText: long, rng: mulberry32(8) });
    const ratio = dLong / dShort;
    expect(ratio).toBeGreaterThan(3.5);
    expect(ratio).toBeLessThan(4.5);
  });

  it("adds cognitive pauses at sentence boundaries (. ! ?)", () => {
    // "ab" = 2 chars, 0 sentence endings → estimate = sum of 2 IKIs
    // "a." = 2 chars, 1 sentence ending → estimate = sum of 2 IKIs + 1 pause
    // With the same seed, the IKI samples are identical, so the difference
    // should be exactly the cognitive pause.
    const pauseMs = 250;
    const cfg = { medianMs: 200, sigmaMs: 50, cognitivePauseMs: pauseMs };
    const noPause = estimateSessionDuration({ ...cfg, sourceText: "ab", rng: mulberry32(10) });
    const withPause = estimateSessionDuration({ ...cfg, sourceText: "a.", rng: mulberry32(10) });
    expect(withPause - noPause).toBeCloseTo(pauseMs, 5);
  });

  it("counts multiple sentence boundaries correctly", () => {
    // "a.b!c?" has 3 sentence-ending chars → 3 pauses
    const pauseMs = 300;
    const cfg = { medianMs: 200, sigmaMs: 50, cognitivePauseMs: pauseMs };
    const noPause = estimateSessionDuration({ ...cfg, sourceText: "abcabc", rng: mulberry32(5) });
    const threePauses = estimateSessionDuration({ ...cfg, sourceText: "a.b!c?", rng: mulberry32(5) });
    // Same char count, same seed, same IKIs → difference is exactly 3 * pauseMs.
    expect(threePauses - noPause).toBeCloseTo(3 * pauseMs, 5);
  });

  it("non-sentence punctuation does NOT trigger a cognitive pause (F2)", () => {
    // Comma, colon, semicolon, dash, quotes — none should add a pause.
    // Same seed, same char count: "a," vs "ab" → difference should be 0.
    const pauseMs = 250;
    const cfg = { medianMs: 200, sigmaMs: 50, cognitivePauseMs: pauseMs };
    for (const punct of [",", ":", ";", "-", '"', "'"]) {
      const withPunct = estimateSessionDuration({
        ...cfg, sourceText: `a${punct}`, rng: mulberry32(10),
      });
      const noPunct = estimateSessionDuration({
        ...cfg, sourceText: "ab", rng: mulberry32(10),
      });
      expect(withPunct - noPunct).toBeCloseTo(0, 5);
    }
  });

  it("uses the default cognitive pause (~250ms) when not configured", () => {
    // Without cognitivePauseMs, the estimator should still add pauses.
    const cfg = { medianMs: 200, sigmaMs: 50 };
    const noPunct = estimateSessionDuration({ ...cfg, sourceText: "ab", rng: mulberry32(3) });
    const withPunct = estimateSessionDuration({ ...cfg, sourceText: "a.", rng: mulberry32(3) });
    const diff = withPunct - noPunct;
    // Default should be in [200, 300] range per plan.md.
    expect(diff).toBeGreaterThanOrEqual(200);
    expect(diff).toBeLessThanOrEqual(300);
  });

  it("cognitivePauseMs: 0 disables pauses entirely (F3 — pins ?? vs || behavior)", () => {
    // Explicitly setting cognitivePauseMs to 0 should NOT fall back to the
    // default. With 0 pause, punctuated text should have the same duration
    // as non-punctuated text of the same length and seed.
    const cfg = { medianMs: 200, sigmaMs: 50, cognitivePauseMs: 0 };
    const withPunct = estimateSessionDuration({ ...cfg, sourceText: "a.", rng: mulberry32(10) });
    const noPunct = estimateSessionDuration({ ...cfg, sourceText: "ab", rng: mulberry32(10) });
    expect(withPunct - noPunct).toBeCloseTo(0, 5);
  });

  it("a lower medianMs (faster typist) produces a shorter estimate", () => {
    const text = "the quick brown fox jumps over the lazy dog";
    const fast = estimateSessionDuration({
      sourceText: text, medianMs: 120, sigmaMs: 50, rng: mulberry32(1),
    });
    const slow = estimateSessionDuration({
      sourceText: text, medianMs: 480, sigmaMs: 150, rng: mulberry32(1),
    });
    expect(fast).toBeLessThan(slow);
    // With 43 chars, sum CVs are small. Expected ratio of means ≈ 3.97.
    // 3.0-5.0 is ~2.5σ — tight enough to catch median-ignoring bugs.
    const ratio = slow / fast;
    expect(ratio).toBeGreaterThan(3.0);
    expect(ratio).toBeLessThan(5.0);
  });

  it("estimate for plain text approximates charCount * mean IKI (within 15%)", () => {
    // Log-normal mean = exp(mu + sigma^2/2) = median * exp(sigma_log^2/2).
    // For M=200, S=50: sigma_log = sqrt(ln(1 + (50/200)^2)) ≈ 0.2462.
    // Mean ≈ 200 * exp(0.2462^2 / 2) ≈ 206.1. At 26 chars, sum CV ≈ 0.048,
    // so 15% (~3σ) is tight but safe.
    const text = "abcdefghijklmnopqrstuvwxyz"; // 26 chars, no punctuation
    const medianMs = 200;
    const sigmaMs = 50;
    const sigmaLog = Math.sqrt(Math.log(1 + (sigmaMs / medianMs) ** 2));
    const meanIki = medianMs * Math.exp(sigmaLog ** 2 / 2);
    const d = estimateSessionDuration({
      sourceText: text, medianMs, sigmaMs, rng: mulberry32(99),
    });
    const expected = text.length * meanIki;
    expect(Math.abs(d - expected) / expected).toBeLessThan(0.15);
  });

  it("uses createIkiSampler internally (integration check via determinism, no punctuation)", () => {
    // Build a sampler directly and sum N IKIs. Compare to the estimator's
    // output for a text of the same length with no punctuation. Both should
    // produce the exact same total, proving the estimator delegates to
    // createIkiSampler rather than rolling its own math.
    const text = "abcde"; // 5 chars, no sentence boundaries
    const cfg = { medianMs: 200, sigmaMs: 50 };

    // Manual sum via createIkiSampler with the same seed:
    const sampler = createIkiSampler({ ...cfg, rng: mulberry32(77) });
    let manualTotal = 0;
    for (let i = 0; i < text.length; i++) manualTotal += sampler();

    const estimated = estimateSessionDuration({ ...cfg, sourceText: text, rng: mulberry32(77) });
    expect(estimated).toBe(manualTotal);
  });

  it("integration: IKI sum + pauses matches estimator for punctuated text (F4)", () => {
    // Manual sum via createIkiSampler plus explicit cognitive pauses.
    // Proves the estimator adds pauses on top of sampled IKIs.
    const text = "ab.c"; // 4 chars, 1 sentence boundary at index 2
    const cfg = { medianMs: 200, sigmaMs: 50 };
    const pauseMs = 275;

    const sampler = createIkiSampler({ ...cfg, rng: mulberry32(33) });
    let manualTotal = 0;
    for (let i = 0; i < text.length; i++) {
      manualTotal += sampler();
      if (text[i] === ".") manualTotal += pauseMs;
    }

    const estimated = estimateSessionDuration({
      ...cfg, sourceText: text, rng: mulberry32(33), cognitivePauseMs: pauseMs,
    });
    expect(estimated).toBe(manualTotal);
  });
});
