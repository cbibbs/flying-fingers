/**
 * Session duration estimator.
 *
 * Walks through the source text character-by-character, sampling an
 * inter-keystroke interval from the log-normal sampler (timing.ts) for
 * each character. Adds a configurable cognitive pause after sentence-ending
 * punctuation (., !, ?). Returns the total estimated duration in milliseconds.
 *
 * Pure function — no DOM, no timers, no side effects. Deterministic when
 * given a seeded RNG.
 */

import { createIkiSampler } from "./timing";

const SENTENCE_ENDERS = new Set([".", "!", "?"]);
const DEFAULT_COGNITIVE_PAUSE_MS = 250;

export interface EstimatorConfig {
  sourceText: string;
  medianMs: number;
  sigmaMs: number;
  rng: () => number;
  /** Extra pause (ms) added after sentence-ending chars. Default 250. */
  cognitivePauseMs?: number;
}

export function estimateSessionDuration(config: EstimatorConfig): number {
  const { sourceText } = config;
  if (sourceText.length === 0) return 0;

  const sampler = createIkiSampler({
    medianMs: config.medianMs,
    sigmaMs: config.sigmaMs,
    rng: config.rng,
  });

  const pauseMs = config.cognitivePauseMs ?? DEFAULT_COGNITIVE_PAUSE_MS;

  let total = 0;
  for (let i = 0; i < sourceText.length; i++) {
    total += sampler();
    if (SENTENCE_ENDERS.has(sourceText[i])) {
      total += pauseMs;
    }
  }

  return total;
}
