/**
 * Session state machine for a typing run.
 *
 * Pure state transitions — no timers, no DOM, no Math.random, no Date.now.
 * Elapsed time is accumulated from caller-supplied deltas on advance().
 *
 * States: idle → typing → paused → correcting → done.
 * - start(): idle → typing (or idle → done if source is empty)
 * - pause(): typing → paused
 * - resume(): paused → typing
 * - beginCorrection(): typing → correcting
 * - endCorrection(): correcting → typing
 * - advance(ms): legal in typing or correcting; adds ms to elapsed.
 *     In `typing`, also increments position by 1; if this reaches the
 *     end of the source, transitions to `done`.
 *     In `correcting`, position is *not* advanced — correction keystrokes
 *     consume time but do not make forward progress on the source.
 *
 * All illegal transitions throw an Error with a descriptive message.
 */

export type SessionState = "idle" | "typing" | "paused" | "correcting" | "done";

export interface Session {
  start(): void;
  pause(): void;
  resume(): void;
  beginCorrection(): void;
  endCorrection(): void;
  advance(elapsedMs: number): void;
  getState(): SessionState;
  getPosition(): number;
  getElapsedMs(): number;
  getCurrentChar(): string | undefined;
  getSourceText(): string;
  isDone(): boolean;
}

function illegal(action: string, state: SessionState): Error {
  return new Error(`Illegal transition: cannot ${action} from state "${state}"`);
}

export function createSession(sourceText: string): Session {
  let state: SessionState = "idle";
  let position = 0;
  let elapsedMs = 0;

  return {
    start() {
      if (state !== "idle") throw illegal("start", state);
      state = sourceText.length === 0 ? "done" : "typing";
    },

    pause() {
      if (state !== "typing") throw illegal("pause", state);
      state = "paused";
    },

    resume() {
      if (state !== "paused") throw illegal("resume", state);
      state = "typing";
    },

    beginCorrection() {
      if (state !== "typing") throw illegal("beginCorrection", state);
      state = "correcting";
    },

    endCorrection() {
      if (state !== "correcting") throw illegal("endCorrection", state);
      state = "typing";
    },

    advance(ms: number) {
      if (state !== "typing" && state !== "correcting") {
        throw illegal("advance", state);
      }
      if (ms < 0) {
        throw new Error(`advance() requires elapsedMs >= 0, got ${ms}`);
      }
      elapsedMs += ms;
      if (state === "typing") {
        position += 1;
        if (position >= sourceText.length) {
          state = "done";
        }
      }
    },

    getState: () => state,
    getPosition: () => position,
    getElapsedMs: () => elapsedMs,
    getCurrentChar: () =>
      position < sourceText.length ? sourceText[position] : undefined,
    getSourceText: () => sourceText,
    isDone: () => state === "done",
  };
}
