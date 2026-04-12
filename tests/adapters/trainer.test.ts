import { describe, expect, it } from "vitest";
import { TrainerAdapter } from "../../src/adapters/trainer";

function dummyRng(): number {
  return 0.5;
}

describe("TrainerAdapter", () => {
  describe("canHandle()", () => {
    it("returns true when #flying-fingers-trainer element exists", () => {
      const adapter = new TrainerAdapter();
      const el = document.createElement("div");
      el.id = "flying-fingers-trainer";
      document.body.appendChild(el);
      try {
        expect(adapter.canHandle(document)).toBe(true);
      } finally {
        el.remove();
      }
    });

    it("returns false when #flying-fingers-trainer element does not exist", () => {
      const adapter = new TrainerAdapter();
      expect(adapter.canHandle(document)).toBe(false);
    });
  });

  describe("injectText()", () => {
    it("appends each character to the target element's textContent", async () => {
      const adapter = new TrainerAdapter();
      const el = document.createElement("div");
      adapter.setTarget(el);

      await adapter.injectText("abc", dummyRng);

      expect(el.textContent).toBe("abc");
    });

    it("final output is byte-exact copy of source text", async () => {
      const adapter = new TrainerAdapter();
      const el = document.createElement("div");
      adapter.setTarget(el);

      const source = "Hello, world! 🌍\nLine two.";
      await adapter.injectText(source, dummyRng);

      expect(el.textContent).toBe(source);
    });

    it("builds up text incrementally (not all at once)", async () => {
      const adapter = new TrainerAdapter();
      const el = document.createElement("div");
      adapter.setTarget(el);

      // Track intermediate states via a MutationObserver-like approach:
      // override textContent setter to record snapshots.
      const snapshots: string[] = [];
      const originalDesc = Object.getOwnPropertyDescriptor(
        Node.prototype,
        "textContent",
      )!;
      Object.defineProperty(el, "textContent", {
        get() { return originalDesc.get!.call(this); },
        set(v: string) {
          originalDesc.set!.call(this, v);
          snapshots.push(v);
        },
        configurable: true,
      });

      await adapter.injectText("xyz", dummyRng);

      // Should have 4 writes: clear (""), then "x", "xy", "xyz"
      expect(snapshots.length).toBe(4);
      expect(snapshots[0]).toBe("");
      expect(snapshots[1]).toBe("x");
      expect(snapshots[2]).toBe("xy");
      expect(snapshots[3]).toBe("xyz");
    });

    it("resolves the promise on success", async () => {
      const adapter = new TrainerAdapter();
      const el = document.createElement("div");
      adapter.setTarget(el);

      await expect(adapter.injectText("hi", dummyRng)).resolves.toBeUndefined();
    });

    it("handles empty text without modifying the target", async () => {
      const adapter = new TrainerAdapter();
      const el = document.createElement("div");
      el.textContent = "pre-existing";
      adapter.setTarget(el);

      await adapter.injectText("", dummyRng);

      expect(el.textContent).toBe("pre-existing");
    });

    it("clears the target before injecting", async () => {
      const adapter = new TrainerAdapter();
      const el = document.createElement("div");
      el.textContent = "old content";
      adapter.setTarget(el);

      await adapter.injectText("new", dummyRng);

      expect(el.textContent).toBe("new");
    });

    it("rejects if no target is set", async () => {
      const adapter = new TrainerAdapter();
      await expect(adapter.injectText("a", dummyRng)).rejects.toThrow(
        /No target.*setTarget/,
      );
    });

    it("handles astral-plane unicode (emoji) correctly", async () => {
      const adapter = new TrainerAdapter();
      const el = document.createElement("div");
      adapter.setTarget(el);

      await adapter.injectText("😀🎉", dummyRng);

      expect(el.textContent).toBe("😀🎉");
    });

    it("works with a textarea element", async () => {
      const adapter = new TrainerAdapter();
      const el = document.createElement("textarea");
      adapter.setTarget(el);

      await adapter.injectText("test", dummyRng);

      expect(el.value).toBe("test");
    });

    it("builds up textarea value incrementally (not all at once)", async () => {
      const adapter = new TrainerAdapter();
      const el = document.createElement("textarea");
      adapter.setTarget(el);

      const snapshots: string[] = [];
      const originalDesc = Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        "value",
      )!;
      Object.defineProperty(el, "value", {
        get() { return originalDesc.get!.call(this); },
        set(v: string) {
          originalDesc.set!.call(this, v);
          snapshots.push(v);
        },
        configurable: true,
      });

      await adapter.injectText("test", dummyRng);

      // 5 writes: clear (""), then "t", "te", "tes", "test"
      expect(snapshots.length).toBe(5);
      expect(snapshots[0]).toBe("");
      expect(snapshots[1]).toBe("t");
      expect(snapshots[2]).toBe("te");
      expect(snapshots[3]).toBe("tes");
      expect(snapshots[4]).toBe("test");
    });

    it("clears textarea before injecting", async () => {
      const adapter = new TrainerAdapter();
      const el = document.createElement("textarea");
      el.value = "old content";
      adapter.setTarget(el);

      await adapter.injectText("new", dummyRng);

      expect(el.value).toBe("new");
    });

    it("handles emoji in textarea correctly", async () => {
      const adapter = new TrainerAdapter();
      const el = document.createElement("textarea");
      adapter.setTarget(el);

      await adapter.injectText("😀🎉", dummyRng);

      expect(el.value).toBe("😀🎉");
    });
  });
});
