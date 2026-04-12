/**
 * Real-keystroke observer for tracking user typing sessions.
 *
 * The observer listens to keystrokes on any page and records session metrics
 * (WPM, accuracy, char count). This data feeds the rank progression system
 * and provides the "real typing" that justifies the cover product's existence.
 *
 * This module is pure state machine logic; integration with the DOM happens
 * in the content script, which calls recordKeystroke() for each key event.
 */

/**
 * A single keystroke event from the user.
 */
export interface KeystrokeEvent {
  /** The character that was typed (or "Backspace", "Delete", etc.). */
  char: string;

  /** True if this is a correction keystroke (backspace/delete). */
  isCorrection: boolean;
}

/**
 * Session metrics accumulated during a typing session.
 *
 * These are built up incrementally as keystrokes are recorded, then returned
 * to the caller when the session ends.
 */
export interface SessionMetrics {
  /** Millisecond timestamp when recording started. */
  startTime: number;

  /** Millisecond timestamp when recording stopped. */
  endTime: number;

  /** Elapsed time in milliseconds. */
  durationMs: number;

  /** Total keystrokes (including corrections). */
  charCount: number;

  /** Number of correction keystrokes (backspace/delete). */
  errorCount: number;

  /** Words per minute: (charCount / 5) / (durationMs / 60000). */
  wpm: number;

  /** Accuracy: (charCount - errorCount) / charCount. */
  accuracy: number;

  /** Source of the typing: "in-app" (practice area) or adapter destination. */
  destination: "in-app" | string;
}

/**
 * Observer state: idle (not recording) or recording.
 */
type ObserverState = "idle" | "recording";

/**
 * The real-keystroke observer.
 *
 * In production, this is integrated into a content script that:
 * 1. Listens to window "keydown" or "input" events
 * 2. Calls recordKeystroke() for each user keystroke
 * 3. Periodically calls getSessionData() to display live metrics
 * 4. Calls stop() when the user closes the page or stops typing for a threshold
 */
export interface Observer {
  /** Get the observer's current state. */
  getState(): ObserverState;

  /** Start recording keystrokes. */
  start(): void;

  /** Record a single keystroke. Throws if not recording. */
  recordKeystroke(event: KeystrokeEvent): void;

  /** Stop recording and return final metrics. Returns undefined if already idle. */
  stop(): Promise<SessionMetrics | undefined>;

  /** Get current session data (live metrics while recording). */
  getSessionData(): Partial<SessionMetrics>;
}

/**
 * Create a new observer instance.
 *
 * Each observer tracks a single session. Create a new observer for each
 * distinct typing session.
 */
export function createObserver(): Observer {
  let state: ObserverState = "idle";
  let startTime: number = 0;
  let charCount: number = 0;
  let errorCount: number = 0;

  return {
    getState(): ObserverState {
      return state;
    },

    start(): void {
      state = "recording";
      startTime = Date.now();
      charCount = 0;
      errorCount = 0;
    },

    recordKeystroke(event: KeystrokeEvent): void {
      if (state !== "recording") {
        throw new Error("Cannot record keystroke while not recording");
      }
      charCount += 1;
      if (event.isCorrection) {
        errorCount += 1;
      }
    },

    async stop(): Promise<SessionMetrics | undefined> {
      if (state === "idle") {
        return undefined;
      }

      const endTime = Date.now();
      const durationMs = endTime - startTime;

      // WPM = (charCount / 5) / (durationSec / 60) = (charCount / 5) * (60000 / durationMs)
      const wpm = (charCount / 5) * (60000 / Math.max(1, durationMs));

      // Accuracy = (correct keystrokes) / (total keystrokes)
      const correctCount = charCount - errorCount;
      const accuracy = charCount > 0 ? correctCount / charCount : 1.0;

      const metrics: SessionMetrics = {
        startTime,
        endTime,
        durationMs,
        charCount,
        errorCount,
        wpm,
        accuracy,
        destination: "in-app",
      };

      state = "idle";
      return metrics;
    },

    getSessionData(): Partial<SessionMetrics> {
      if (state === "idle") {
        return {
          charCount: 0,
          errorCount: 0,
          destination: "in-app",
        };
      }

      const now = Date.now();
      const durationMs = now - startTime;
      const wpm = (charCount / 5) * (60000 / Math.max(1, durationMs));
      const correctCount = charCount - errorCount;
      const accuracy = charCount > 0 ? correctCount / charCount : 1.0;

      return {
        charCount,
        errorCount,
        wpm,
        accuracy,
        destination: "in-app",
      };
    },
  };
}
