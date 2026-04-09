/**
 * Log-normal inter-keystroke-interval (IKI) sampler.
 *
 * Based on the Aalto 136M keystrokes study finding that human typing
 * inter-keystroke intervals follow a log-normal (not Gaussian) distribution.
 * Baseline parameters (median ~239ms, linear sigma ~112ms) correspond to an
 * average typist; fast typists cluster around ~120ms median, slow around
 * 480-900ms.
 *
 * The RNG is injected so callers (and tests) can seed it for determinism.
 * `rng` must return uniform floats in [0, 1).
 */

export type LinearIkiConfig = {
  /** Target median inter-keystroke interval in milliseconds. */
  medianMs: number;
  /** Target linear standard deviation in milliseconds. */
  sigmaMs: number;
  rng: () => number;
};

export type LogSpaceIkiConfig = {
  /** Mean of ln(IKI). Equivalent to ln(medianMs). */
  muLog: number;
  /** Standard deviation of ln(IKI). */
  sigmaLog: number;
  rng: () => number;
};

export type IkiSamplerConfig = LinearIkiConfig | LogSpaceIkiConfig;

function isLogSpace(c: IkiSamplerConfig): c is LogSpaceIkiConfig {
  return (c as LogSpaceIkiConfig).muLog !== undefined;
}

/**
 * Create a seeded log-normal IKI sampler. Each call returns one IKI in
 * milliseconds. The returned value is always strictly positive.
 */
export function createIkiSampler(config: IkiSamplerConfig): () => number {
  let muLog: number;
  let sigmaLog: number;

  if (isLogSpace(config)) {
    muLog = config.muLog;
    sigmaLog = config.sigmaLog;
  } else {
    if (config.medianMs <= 0) {
      throw new Error("medianMs must be > 0");
    }
    if (config.sigmaMs < 0) {
      throw new Error("sigmaMs must be >= 0");
    }
    // Convert (linear median M, linear stddev S) to log-space (mu, sigma).
    // For a log-normal with log-space params (mu, sigma):
    //   median_linear = exp(mu)
    //   var_linear    = (exp(sigma^2) - 1) * exp(2*mu + sigma^2)
    // Median-parameterized, var_linear = M^2 * (exp(sigma^2) - 1), so:
    //   sigma = sqrt(ln(1 + (S/M)^2))
    const ratio = config.sigmaMs / config.medianMs;
    sigmaLog = Math.sqrt(Math.log(1 + ratio * ratio));
    muLog = Math.log(config.medianMs);
  }

  const rng = config.rng;

  // Box-Muller transform: consume two uniforms, emit one standard normal.
  // We cache the second draw so consecutive sampler calls stay cheap and
  // the RNG stream is used efficiently.
  let cachedNormal: number | null = null;

  const standardNormal = (): number => {
    if (cachedNormal !== null) {
      const v = cachedNormal;
      cachedNormal = null;
      return v;
    }
    // Guard against u1 === 0 which would yield log(0) = -Infinity.
    let u1 = rng();
    while (u1 === 0) u1 = rng();
    const u2 = rng();
    const mag = Math.sqrt(-2 * Math.log(u1));
    const z0 = mag * Math.cos(2 * Math.PI * u2);
    const z1 = mag * Math.sin(2 * Math.PI * u2);
    cachedNormal = z1;
    return z0;
  };

  return () => Math.exp(muLog + sigmaLog * standardNormal());
}
