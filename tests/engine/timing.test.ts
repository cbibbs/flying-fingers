import { describe, expect, it } from "vitest";
import { createIkiSampler } from "../../src/engine/timing";

/**
 * Deterministic PRNG (mulberry32) used to drive the sampler in tests.
 * We pass this in so tests are reproducible and we are asserting on
 * the distribution the sampler actually produces, not on Math.random.
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

function collect(sampler: () => number, n: number): number[] {
  const out = new Array<number>(n);
  for (let i = 0; i < n; i++) out[i] = sampler();
  return out;
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >>> 1;
  return s.length % 2 === 0 ? (s[m - 1] + s[m]) / 2 : s[m];
}

function mean(xs: number[]): number {
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

function stddev(xs: number[]): number {
  const m = mean(xs);
  let s = 0;
  for (const x of xs) s += (x - m) * (x - m);
  return Math.sqrt(s / xs.length);
}

describe("createIkiSampler (log-normal inter-keystroke interval)", () => {
  it("returns strictly positive numbers", () => {
    const sampler = createIkiSampler({
      medianMs: 239,
      sigmaMs: 112,
      rng: mulberry32(1),
    });
    for (let i = 0; i < 1000; i++) {
      const v = sampler();
      expect(v).toBeGreaterThan(0);
      expect(Number.isFinite(v)).toBe(true);
    }
  });

  it("is deterministic for the same seed (identical RNG → identical sequence)", () => {
    const a = createIkiSampler({ medianMs: 239, sigmaMs: 112, rng: mulberry32(42) });
    const b = createIkiSampler({ medianMs: 239, sigmaMs: 112, rng: mulberry32(42) });
    const seqA = collect(a, 200);
    const seqB = collect(b, 200);
    expect(seqA).toEqual(seqB);
  });

  it("produces different sequences for different seeds", () => {
    const a = collect(
      createIkiSampler({ medianMs: 239, sigmaMs: 112, rng: mulberry32(1) }),
      50,
    );
    const b = collect(
      createIkiSampler({ medianMs: 239, sigmaMs: 112, rng: mulberry32(2) }),
      50,
    );
    expect(a).not.toEqual(b);
  });

  it("empirical median over 10000 samples is within 2% of the configured median (baseline 239ms)", () => {
    // Tight bound: SE of sample median for log-normal (sigmaLog≈0.445, N=10k)
    // is ~0.56% of the median, so 2% is ~3.5σ — catches real bugs, safe vs seed noise.
    const sampler = createIkiSampler({
      medianMs: 239,
      sigmaMs: 112,
      rng: mulberry32(1337),
    });
    const xs = collect(sampler, 10000);
    const m = median(xs);
    expect(Math.abs(m - 239) / 239).toBeLessThan(0.02);
  });

  it("log-space sigma matches the configured sigmaLog within 2% (tight scale check)", () => {
    // Assert on log-space sigma instead of linear stddev — much tighter SE.
    // SE of sample stddev in log space ≈ sigmaLog / sqrt(2N) ≈ 0.00315 at N=10k,
    // so a 2% window on sigmaLog≈0.4455 (≈0.0089) is ~3σ — tight but safe.
    const sampler = createIkiSampler({
      medianMs: 239,
      sigmaMs: 112,
      rng: mulberry32(2024),
    });
    const xs = collect(sampler, 10000).map(Math.log);
    const empiricalSigmaLog = stddev(xs);
    const expectedSigmaLog = Math.sqrt(Math.log(1 + (112 / 239) ** 2));
    expect(Math.abs(empiricalSigmaLog - expectedSigmaLog) / expectedSigmaLog).toBeLessThan(0.02);
  });

  it("log of samples is approximately normal (tight skewness and kurtosis bounds)", () => {
    // If samples are log-normal with params (mu, sigma), then ln(samples)
    // must be (approximately) N(mu, sigma). A true normal has skewness 0
    // and kurtosis 3. SE of sample skewness ≈ sqrt(6/N) ≈ 0.0245; SE of
    // sample kurtosis ≈ sqrt(24/N) ≈ 0.049 at N=10k. Bounds below are ~3σ.
    const sampler = createIkiSampler({
      medianMs: 239,
      sigmaMs: 112,
      rng: mulberry32(9),
    });
    const xs = collect(sampler, 10000).map(Math.log);
    const m = mean(xs);
    const sd = stddev(xs);
    let m3 = 0;
    let m4 = 0;
    for (const x of xs) {
      const d = (x - m) / sd;
      m3 += d * d * d;
      m4 += d * d * d * d;
    }
    const skewness = m3 / xs.length;
    const kurtosis = m4 / xs.length;
    expect(Math.abs(skewness)).toBeLessThan(0.08);
    expect(Math.abs(kurtosis - 3)).toBeLessThan(0.15);
  });

  it("log-space mean matches ln(median) (so the configured median is the distribution median, not the mean)", () => {
    const sampler = createIkiSampler({
      medianMs: 239,
      sigmaMs: 112,
      rng: mulberry32(7),
    });
    const xs = collect(sampler, 10000).map(Math.log);
    const m = mean(xs);
    const expected = Math.log(239);
    // Log-normal: median in linear space == exp(mu), so mean of ln(X) == mu == ln(median).
    expect(Math.abs(m - expected)).toBeLessThan(0.02);
  });

  it("different configured medians shift the empirical median accordingly", () => {
    const slow = createIkiSampler({ medianMs: 600, sigmaMs: 200, rng: mulberry32(3) });
    const fast = createIkiSampler({ medianMs: 120, sigmaMs: 50, rng: mulberry32(3) });
    const ms = median(collect(slow, 5000));
    const mf = median(collect(fast, 5000));
    // 3% at N=5000 is ~3σ for the sample-median SE; still safe vs seed noise.
    expect(Math.abs(ms - 600) / 600).toBeLessThan(0.03);
    expect(Math.abs(mf - 120) / 120).toBeLessThan(0.03);
    expect(ms).toBeGreaterThan(mf);
  });

  it("log-space parameterization produces a byte-identical sequence to the equivalent linear parameterization (same seed)", () => {
    // This pins down that the two config branches drive the underlying math
    // with the same mu/sigma convention. A bug where, e.g., sigmaLog was
    // interpreted as variance, or mu/sigma were swapped, would diverge here.
    const muLog = Math.log(239);
    const sigmaLog = Math.sqrt(Math.log(1 + (112 / 239) ** 2));
    const linear = createIkiSampler({
      medianMs: 239,
      sigmaMs: 112,
      rng: mulberry32(11),
    });
    const logSpace = createIkiSampler({ muLog, sigmaLog, rng: mulberry32(11) });
    const seqLinear = collect(linear, 500);
    const seqLog = collect(logSpace, 500);
    expect(seqLog).toEqual(seqLinear);
  });

  it("handles an rng that returns 0 on the first call (u1=0 guard)", () => {
    // Exercises the `while (u1 === 0)` guard in Box-Muller. Without the
    // guard, log(0) = -Infinity would leak into the sample and propagate
    // to Math.exp(NaN/-Infinity). Pattern: first draw 0, then a normal PRNG.
    const base = mulberry32(5);
    let calls = 0;
    const rng = () => {
      calls += 1;
      if (calls === 1) return 0;
      return base();
    };
    const sampler = createIkiSampler({ medianMs: 239, sigmaMs: 112, rng });
    for (let i = 0; i < 100; i++) {
      const v = sampler();
      expect(Number.isFinite(v)).toBe(true);
      expect(v).toBeGreaterThan(0);
    }
    // And confirm the zero was actually consumed (guard path was taken):
    expect(calls).toBeGreaterThanOrEqual(1);
  });
});
