import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { createObserver, type Observer } from "../../src/tracker/observer";

describe("observer — real-keystroke tracking", () => {
  let observer: Observer;

  beforeEach(() => {
    observer = createObserver();
  });

  afterEach(() => {
    observer.stop();
  });

  describe("createObserver()", () => {
    it("creates an observer in idle state", () => {
      expect(observer.getState()).toBe("idle");
      expect(observer.getSessionData().charCount).toBe(0);
    });
  });

  describe("session lifecycle", () => {
    it("transitions from idle to recording on start()", () => {
      observer.start();
      expect(observer.getState()).toBe("recording");
    });

    it("records keystrokes while recording", () => {
      observer.start();
      observer.recordKeystroke({ char: "a", isCorrection: false });
      observer.recordKeystroke({ char: "b", isCorrection: false });
      expect(observer.getSessionData().charCount).toBe(2);
    });

    it("stops recording and returns metrics on stop()", async () => {
      observer.start();
      observer.recordKeystroke({ char: "h", isCorrection: false });
      observer.recordKeystroke({ char: "i", isCorrection: false });

      const metrics = await observer.stop();
      expect(metrics).toBeDefined();
      expect(metrics?.charCount).toBe(2);
      expect(observer.getState()).toBe("idle");
    });

    it("calculates WPM from char count and duration", async () => {
      observer.start();

      // Record keystrokes; WPM = (charCount / 5) / (durationSec / 60)
      for (let i = 0; i < 60; i++) {
        observer.recordKeystroke({ char: "x", isCorrection: false });
      }

      const metrics = observer.getSessionData();
      expect(metrics.charCount).toBe(60);
      // WPM should be well-defined (even if high due to fast test execution)
      expect(metrics.wpm).toBeGreaterThan(0);
    });

    it("distinguishes corrections from normal keystrokes", () => {
      observer.start();
      observer.recordKeystroke({ char: "a", isCorrection: false });
      observer.recordKeystroke({ char: "b", isCorrection: false });
      observer.recordKeystroke({ char: "Backspace", isCorrection: true });
      observer.recordKeystroke({ char: "c", isCorrection: false });

      const data = observer.getSessionData();
      expect(data.charCount).toBe(4);
      expect(data.errorCount).toBe(1);
    });

    it("calculates accuracy as correctChars / totalChars", () => {
      observer.start();
      // 9 correct, 1 correction = 90% accuracy
      observer.recordKeystroke({ char: "a", isCorrection: false });
      observer.recordKeystroke({ char: "b", isCorrection: false });
      observer.recordKeystroke({ char: "c", isCorrection: false });
      observer.recordKeystroke({ char: "d", isCorrection: false });
      observer.recordKeystroke({ char: "e", isCorrection: false });
      observer.recordKeystroke({ char: "f", isCorrection: false });
      observer.recordKeystroke({ char: "g", isCorrection: false });
      observer.recordKeystroke({ char: "h", isCorrection: false });
      observer.recordKeystroke({ char: "i", isCorrection: false });
      observer.recordKeystroke({ char: "Backspace", isCorrection: true });

      const data = observer.getSessionData();
      expect(data.accuracy).toBeCloseTo(0.9, 2);
    });
  });

  describe("timing and metrics", () => {
    it("tracks startTime and endTime", async () => {
      const beforeStart = Date.now();
      observer.start();
      observer.recordKeystroke({ char: "x", isCorrection: false });
      const metrics = await observer.stop();
      const afterStop = Date.now();

      expect(metrics?.startTime).toBeGreaterThanOrEqual(beforeStart);
      expect(metrics?.endTime).toBeLessThanOrEqual(afterStop);
      expect(metrics!.endTime).toBeGreaterThanOrEqual(metrics!.startTime);
    });

    it("calculates durationMs correctly", async () => {
      observer.start();
      observer.recordKeystroke({ char: "x", isCorrection: false });
      const metrics = await observer.stop();
      expect(metrics?.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe("error states", () => {
    it("throws when recording keystrokes while idle", () => {
      expect(() => {
        observer.recordKeystroke({ char: "a", isCorrection: false });
      }).toThrow();
    });

    it("is idempotent: stopping twice is safe", async () => {
      observer.start();
      observer.recordKeystroke({ char: "a", isCorrection: false });
      const metrics1 = await observer.stop();
      const metrics2 = await observer.stop();
      expect(metrics1).toBeDefined();
      expect(metrics2).toBeUndefined();
    });

    it("can restart after stopping", async () => {
      observer.start();
      observer.recordKeystroke({ char: "a", isCorrection: false });
      await observer.stop();

      observer.start();
      observer.recordKeystroke({ char: "b", isCorrection: false });
      const metrics = await observer.stop();
      expect(metrics?.charCount).toBe(1);
    });
  });

  describe("getSessionData()", () => {
    it("returns current session metrics while recording", () => {
      observer.start();
      observer.recordKeystroke({ char: "x", isCorrection: false });
      const data = observer.getSessionData();
      expect(data.charCount).toBe(1);
    });

    it("includes destination in session data", () => {
      observer.start();
      const data = observer.getSessionData();
      expect(data.destination).toBe("in-app");
    });
  });
});
