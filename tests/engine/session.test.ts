import { describe, expect, it } from "vitest";
import { createSession } from "../../src/engine/session";

const SRC = "hello";

// Strict matcher pinning the exact illegal-transition message shape
// (session.ts throws `Illegal transition: cannot <action> from state "<state>"`).
// Per-call-site matcher so a message-format regression breaks these tests.
const illegalMsg = (action: string, state: string) =>
  new RegExp(
    `^Illegal transition: cannot ${action} from state "${state}"$`,
  );

describe("createSession — state machine", () => {
  describe("initial state", () => {
    it("starts in the idle state with position 0 and elapsed 0", () => {
      const s = createSession(SRC);
      expect(s.getState()).toBe("idle");
      expect(s.getPosition()).toBe(0);
      expect(s.getElapsedMs()).toBe(0);
      expect(s.getSourceText()).toBe(SRC);
    });

    it("exposes the first source character before start (preview)", () => {
      const s = createSession(SRC);
      expect(s.getCurrentChar()).toBe("h");
    });

    it("isDone() is false initially", () => {
      expect(createSession(SRC).isDone()).toBe(false);
    });
  });

  describe("start()", () => {
    it("idle → typing", () => {
      const s = createSession(SRC);
      s.start();
      expect(s.getState()).toBe("typing");
    });

    it("is illegal from typing, paused, correcting, done", () => {
      const s = createSession(SRC);
      s.start();
      expect(() => s.start()).toThrow(illegalMsg("start", "typing"));

      s.pause();
      expect(() => s.start()).toThrow(illegalMsg("start", "paused"));

      s.resume();
      s.beginCorrection();
      expect(() => s.start()).toThrow(illegalMsg("start", "correcting"));

      s.endCorrection();
      // advance to done
      for (let i = 0; i < SRC.length; i++) s.advance(10);
      expect(s.getState()).toBe("done");
      expect(() => s.start()).toThrow(illegalMsg("start", "done"));
    });

    it("on an empty source, start() transitions directly to done", () => {
      const s = createSession("");
      s.start();
      expect(s.getState()).toBe("done");
      expect(s.isDone()).toBe(true);
      expect(s.getCurrentChar()).toBeUndefined();
    });

    it("all transitions are illegal from empty-source done state (N1)", () => {
      const s = createSession("");
      s.start(); // → done
      expect(() => s.start()).toThrow(illegalMsg("start", "done"));
      expect(() => s.pause()).toThrow(illegalMsg("pause", "done"));
      expect(() => s.resume()).toThrow(illegalMsg("resume", "done"));
      expect(() => s.beginCorrection()).toThrow(illegalMsg("beginCorrection", "done"));
      expect(() => s.endCorrection()).toThrow(illegalMsg("endCorrection", "done"));
      expect(() => s.advance(10)).toThrow(illegalMsg("advance", "done"));
    });
  });

  describe("pause() and resume()", () => {
    it("typing → paused, paused → typing", () => {
      const s = createSession(SRC);
      s.start();
      s.pause();
      expect(s.getState()).toBe("paused");
      s.resume();
      expect(s.getState()).toBe("typing");
    });

    it("pause is illegal from idle, paused, correcting, done", () => {
      const s = createSession(SRC);
      expect(() => s.pause()).toThrow(illegalMsg("pause", "idle"));
      s.start();
      s.pause();
      expect(() => s.pause()).toThrow(illegalMsg("pause", "paused"));
      s.resume();
      s.beginCorrection();
      expect(() => s.pause()).toThrow(illegalMsg("pause", "correcting"));
      s.endCorrection();
      for (let i = 0; i < SRC.length; i++) s.advance(10);
      expect(() => s.pause()).toThrow(illegalMsg("pause", "done"));
    });

    it("resume is illegal from idle, typing, correcting, done", () => {
      const s = createSession(SRC);
      expect(() => s.resume()).toThrow(illegalMsg("resume", "idle"));
      s.start();
      expect(() => s.resume()).toThrow(illegalMsg("resume", "typing"));
      s.beginCorrection();
      expect(() => s.resume()).toThrow(illegalMsg("resume", "correcting"));
      s.endCorrection();
      for (let i = 0; i < SRC.length; i++) s.advance(10);
      expect(() => s.resume()).toThrow(illegalMsg("resume", "done"));
    });

    it("pause/resume does not change position or elapsed time", () => {
      const s = createSession(SRC);
      s.start();
      s.advance(100);
      s.advance(50);
      const pos = s.getPosition();
      const elapsed = s.getElapsedMs();
      s.pause();
      expect(s.getPosition()).toBe(pos);
      expect(s.getElapsedMs()).toBe(elapsed);
      s.resume();
      expect(s.getPosition()).toBe(pos);
      expect(s.getElapsedMs()).toBe(elapsed);
    });
  });

  describe("beginCorrection() and endCorrection()", () => {
    it("typing → correcting, correcting → typing", () => {
      const s = createSession(SRC);
      s.start();
      s.beginCorrection();
      expect(s.getState()).toBe("correcting");
      s.endCorrection();
      expect(s.getState()).toBe("typing");
    });

    it("beginCorrection is illegal from idle, paused, correcting, done", () => {
      const s = createSession(SRC);
      expect(() => s.beginCorrection()).toThrow(illegalMsg("beginCorrection", "idle"));
      s.start();
      s.pause();
      expect(() => s.beginCorrection()).toThrow(illegalMsg("beginCorrection", "paused"));
      s.resume();
      s.beginCorrection();
      expect(() => s.beginCorrection()).toThrow(illegalMsg("beginCorrection", "correcting"));
      s.endCorrection();
      for (let i = 0; i < SRC.length; i++) s.advance(10);
      expect(() => s.beginCorrection()).toThrow(illegalMsg("beginCorrection", "done"));
    });

    it("endCorrection is illegal from idle, typing, paused, done", () => {
      const s = createSession(SRC);
      expect(() => s.endCorrection()).toThrow(illegalMsg("endCorrection", "idle"));
      s.start();
      expect(() => s.endCorrection()).toThrow(illegalMsg("endCorrection", "typing"));
      s.pause();
      expect(() => s.endCorrection()).toThrow(illegalMsg("endCorrection", "paused"));
      s.resume();
      for (let i = 0; i < SRC.length; i++) s.advance(10);
      expect(() => s.endCorrection()).toThrow(illegalMsg("endCorrection", "done"));
    });
  });

  describe("advance()", () => {
    it("increments position by 1 and accumulates elapsed time", () => {
      const s = createSession(SRC);
      s.start();
      s.advance(120);
      expect(s.getPosition()).toBe(1);
      expect(s.getElapsedMs()).toBe(120);
      s.advance(80);
      expect(s.getPosition()).toBe(2);
      expect(s.getElapsedMs()).toBe(200);
    });

    it("updates getCurrentChar() to the next source character", () => {
      const s = createSession(SRC);
      s.start();
      expect(s.getCurrentChar()).toBe("h");
      s.advance(10);
      expect(s.getCurrentChar()).toBe("e");
      s.advance(10);
      expect(s.getCurrentChar()).toBe("l");
    });

    it("transitions to done after the final character is typed", () => {
      const s = createSession(SRC);
      s.start();
      for (let i = 0; i < SRC.length; i++) s.advance(25);
      expect(s.getState()).toBe("done");
      expect(s.isDone()).toBe(true);
      expect(s.getPosition()).toBe(SRC.length);
      expect(s.getElapsedMs()).toBe(25 * SRC.length);
      expect(s.getCurrentChar()).toBeUndefined();
    });

    it("transitions to done correctly for a 1-character source (off-by-one boundary)", () => {
      const s = createSession("x");
      s.start();
      expect(s.getCurrentChar()).toBe("x");
      s.advance(10);
      expect(s.isDone()).toBe(true);
      expect(s.getState()).toBe("done");
      expect(s.getPosition()).toBe(1);
      expect(s.getCurrentChar()).toBeUndefined();
    });

    it("is legal while correcting (correction keystrokes count toward elapsed, not position)", () => {
      // During a correction, the session is spending time but not
      // making forward progress on the source. We still accept advance()
      // calls; let's define them as elapsed-only while correcting.
      //
      // Concretely: advance() in `correcting` adds to elapsed but
      // does NOT increment position (which tracks source position).
      const s = createSession(SRC);
      s.start();
      s.advance(100); // pos 1, elapsed 100
      s.beginCorrection();
      // F5: getCurrentChar() should still return the current source char
      // during correcting — the UI depends on this to show what comes next.
      expect(s.getCurrentChar()).toBe("e");
      s.advance(50); // pos 1 still, elapsed 150
      expect(s.getCurrentChar()).toBe("e");
      s.advance(50); // pos 1 still, elapsed 200
      expect(s.getState()).toBe("correcting");
      expect(s.getPosition()).toBe(1);
      expect(s.getElapsedMs()).toBe(200);
      s.endCorrection();
      s.advance(100); // pos 2, elapsed 300
      expect(s.getPosition()).toBe(2);
      expect(s.getElapsedMs()).toBe(300);
    });

    it("is illegal from idle, paused, done", () => {
      const s = createSession(SRC);
      expect(() => s.advance(10)).toThrow(illegalMsg("advance", "idle"));
      s.start();
      s.pause();
      expect(() => s.advance(10)).toThrow(illegalMsg("advance", "paused"));
      s.resume();
      for (let i = 0; i < SRC.length; i++) s.advance(25);
      expect(() => s.advance(10)).toThrow(illegalMsg("advance", "done"));
    });

    it("rejects negative elapsedMs from typing", () => {
      const s = createSession(SRC);
      s.start();
      expect(() => s.advance(-1)).toThrow(/elapsedMs >= 0/);
    });

    it("rejects negative elapsedMs from correcting (F2)", () => {
      // Ensures the ms < 0 guard fires before the state-branching logic.
      // A mutation that moved the guard inside `if (state === "typing")`
      // would silently accept negative ms during corrections.
      const s = createSession(SRC);
      s.start();
      s.beginCorrection();
      expect(() => s.advance(-5)).toThrow(/elapsedMs >= 0/);
    });

    it("accepts zero elapsedMs", () => {
      const s = createSession(SRC);
      s.start();
      s.advance(0);
      expect(s.getPosition()).toBe(1);
      expect(s.getElapsedMs()).toBe(0);
    });
  });

  describe("purity / determinism", () => {
    it("two sessions with identical inputs produce identical observable state", () => {
      const a = createSession(SRC);
      const b = createSession(SRC);
      a.start();
      b.start();
      for (const ms of [50, 75, 100, 125, 150]) {
        a.advance(ms);
        b.advance(ms);
      }
      expect(a.getState()).toBe(b.getState());
      expect(a.getPosition()).toBe(b.getPosition());
      expect(a.getElapsedMs()).toBe(b.getElapsedMs());
    });

    it("does not mutate the source text string", () => {
      const src = "abc";
      const s = createSession(src);
      s.start();
      s.advance(10);
      expect(s.getSourceText()).toBe("abc");
      expect(src).toBe("abc");
    });
  });
});
