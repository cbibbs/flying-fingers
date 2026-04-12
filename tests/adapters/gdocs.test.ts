import { describe, expect, it, vi } from "vitest";
import { GDocsAdapter } from "../../src/adapters/gdocs";

/** Build a minimal mock of the GDocs DOM structure. */
function mockGDocsDocument(url = "https://docs.google.com/document/d/abc/edit") {
  // Shared call log to verify ordering across mocks (F5).
  const callLog: string[] = [];

  const innerTarget = {
    tagName: "DIV",
    contentEditable: "true",
    getAttribute: (name: string) => (name === "role" ? "textbox" : null),
    focus: vi.fn(() => callLog.push("innerTarget.focus")),
    dispatchEvent: vi.fn((_ev: Event) => { callLog.push("dispatchEvent"); return true; }),
  };

  const innerDoc = {
    activeElement: innerTarget as object | null,
    body: { tagName: "BODY" },
    querySelector: vi.fn(() => innerTarget),
  };

  const iframe = {
    classList: { contains: (cls: string) => cls === "docs-texteventtarget-iframe" },
    className: "docs-texteventtarget-iframe",
    contentDocument: innerDoc,
    focus: vi.fn(() => callLog.push("iframe.focus")),
  };

  const doc = {
    location: { hostname: "docs.google.com", pathname: "/document/d/abc/edit", href: url },
    querySelector: vi.fn((sel: string) => {
      if (sel === "iframe.docs-texteventtarget-iframe") return iframe;
      return null;
    }),
  } as unknown as Document;

  return { doc, iframe, innerDoc, innerTarget, callLog };
}

function dummyRng(): number {
  return 0.5;
}

describe("GDocsAdapter", () => {
  describe("canHandle()", () => {
    it("returns true for docs.google.com/document/d/ URLs", () => {
      const adapter = new GDocsAdapter();
      const { doc } = mockGDocsDocument("https://docs.google.com/document/d/abc/edit");
      expect(adapter.canHandle(doc)).toBe(true);
    });

    it("returns false for non-Google-Docs hostnames", () => {
      const adapter = new GDocsAdapter();
      for (const hostname of ["example.com", "mail.google.com", "drive.google.com"]) {
        const doc = {
          location: { hostname, pathname: "/document/d/abc/edit" },
        } as unknown as Document;
        expect(adapter.canHandle(doc)).toBe(false);
      }
    });

    it("returns false for docs.google.com but non-document path", () => {
      const adapter = new GDocsAdapter();
      for (const pathname of ["/spreadsheets/d/abc/edit", "/documentx/foo", "/document", "/documentary/abc"]) {
        const doc = {
          location: { hostname: "docs.google.com", pathname },
        } as unknown as Document;
        expect(adapter.canHandle(doc)).toBe(false);
      }
    });
  });

  describe("injectText()", () => {
    it("dispatches a textInput event for each character", async () => {
      const adapter = new GDocsAdapter();
      const { doc, innerTarget } = mockGDocsDocument();
      adapter.setDocument(doc);

      await adapter.injectText("abc", dummyRng);

      expect(innerTarget.dispatchEvent).toHaveBeenCalledTimes(3);

      const calls = innerTarget.dispatchEvent.mock.calls as Array<[Event & { data?: string }]>;
      expect(calls[0][0].type).toBe("textInput");
      expect(calls[0][0].data).toBe("a");
      expect(calls[1][0].data).toBe("b");
      expect(calls[2][0].data).toBe("c");
    });

    it("dispatches events with bubbles: true and cancelable: true (B2)", async () => {
      const adapter = new GDocsAdapter();
      const { doc, innerTarget } = mockGDocsDocument();
      adapter.setDocument(doc);

      await adapter.injectText("x", dummyRng);

      const ev = innerTarget.dispatchEvent.mock.calls[0][0] as Event;
      expect(ev.bubbles).toBe(true);
      expect(ev.cancelable).toBe(true);
    });

    it("focuses the iframe and inner target before injecting", async () => {
      const adapter = new GDocsAdapter();
      const { doc, iframe, innerTarget } = mockGDocsDocument();
      adapter.setDocument(doc);

      await adapter.injectText("a", dummyRng);

      expect(iframe.focus).toHaveBeenCalled();
      expect(innerTarget.focus).toHaveBeenCalled();
    });

    it("calls focus before dispatchEvent for each character (F5 — ordering)", async () => {
      const adapter = new GDocsAdapter();
      const { doc, callLog } = mockGDocsDocument();
      adapter.setDocument(doc);

      await adapter.injectText("ab", dummyRng);

      // For each char: iframe.focus, innerTarget.focus, dispatchEvent
      // Pattern repeats for 2 chars.
      expect(callLog).toEqual([
        "iframe.focus", "innerTarget.focus", "dispatchEvent",
        "iframe.focus", "innerTarget.focus", "dispatchEvent",
      ]);
    });

    it("resolves the promise on success", async () => {
      const adapter = new GDocsAdapter();
      const { doc } = mockGDocsDocument();
      adapter.setDocument(doc);

      await expect(adapter.injectText("hi", dummyRng)).resolves.toBeUndefined();
    });

    it("rejects if setDocument was not called (F2)", async () => {
      const adapter = new GDocsAdapter();
      await expect(adapter.injectText("a", dummyRng)).rejects.toThrow(
        /No document set.*setDocument/,
      );
    });

    it("rejects if the iframe is not found", async () => {
      const adapter = new GDocsAdapter();
      const doc = {
        location: { hostname: "docs.google.com", pathname: "/document/d/abc/edit" },
        querySelector: vi.fn(() => null),
      } as unknown as Document;
      adapter.setDocument(doc);

      await expect(adapter.injectText("a", dummyRng)).rejects.toThrow(
        /^Google Docs iframe not found$/,
      );
    });

    it("rejects if the inner target is not found (both activeElement and querySelector null)", async () => {
      const adapter = new GDocsAdapter();
      const iframe = {
        contentDocument: {
          activeElement: null,
          body: { tagName: "BODY" },
          querySelector: vi.fn(() => null),
        },
        focus: vi.fn(),
      };
      const doc = {
        location: { hostname: "docs.google.com", pathname: "/document/d/abc/edit" },
        querySelector: vi.fn(() => iframe),
      } as unknown as Document;
      adapter.setDocument(doc);

      await expect(adapter.injectText("a", dummyRng)).rejects.toThrow(
        /^Cannot find inner editable target in iframe$/,
      );
    });

    it("rejects if iframe.contentDocument is null (cross-origin)", async () => {
      const adapter = new GDocsAdapter();
      const iframe = { contentDocument: null, focus: vi.fn() };
      const doc = {
        location: { hostname: "docs.google.com", pathname: "/document/d/abc/edit" },
        querySelector: vi.fn(() => iframe),
      } as unknown as Document;
      adapter.setDocument(doc);

      await expect(adapter.injectText("a", dummyRng)).rejects.toThrow(
        /^Cannot access iframe contentDocument/,
      );
    });

    it("handles empty text without dispatching events", async () => {
      const adapter = new GDocsAdapter();
      const { doc, innerTarget } = mockGDocsDocument();
      adapter.setDocument(doc);

      await adapter.injectText("", dummyRng);
      expect(innerTarget.dispatchEvent).not.toHaveBeenCalled();
    });

    it("handles BMP unicode and newline", async () => {
      const adapter = new GDocsAdapter();
      const { doc, innerTarget } = mockGDocsDocument();
      adapter.setDocument(doc);

      await adapter.injectText("é\n", dummyRng);

      const calls = innerTarget.dispatchEvent.mock.calls as Array<[Event & { data?: string }]>;
      expect(calls[0][0].data).toBe("é");
      expect(calls[1][0].data).toBe("\n");
    });

    it("handles astral-plane unicode (emoji) without splitting surrogates (F4)", async () => {
      const adapter = new GDocsAdapter();
      const { doc, innerTarget } = mockGDocsDocument();
      adapter.setDocument(doc);

      await adapter.injectText("😀", dummyRng);

      // 1 code point → 1 dispatchEvent call (not 2 surrogate halves)
      expect(innerTarget.dispatchEvent).toHaveBeenCalledTimes(1);
      const calls = innerTarget.dispatchEvent.mock.calls as Array<[Event & { data?: string }]>;
      expect(calls[0][0].data).toBe("😀");
    });

    it("falls back to querySelector when activeElement is null (B1a)", async () => {
      const adapter = new GDocsAdapter();
      const { doc, innerDoc, innerTarget } = mockGDocsDocument();
      // Simulate activeElement not settled yet
      innerDoc.activeElement = null;
      adapter.setDocument(doc);

      await adapter.injectText("a", dummyRng);

      // Should have found innerTarget via querySelector fallback and dispatched
      expect(innerTarget.dispatchEvent).toHaveBeenCalledTimes(1);
    });

    it("falls back to querySelector when activeElement is body (B1b)", async () => {
      const adapter = new GDocsAdapter();
      const { doc, innerDoc, innerTarget } = mockGDocsDocument();
      // Simulate activeElement pointing to body (the guard at gdocs.ts:63)
      innerDoc.activeElement = innerDoc.body;
      adapter.setDocument(doc);

      await adapter.injectText("a", dummyRng);

      // Should have found innerTarget via querySelector fallback and dispatched
      expect(innerTarget.dispatchEvent).toHaveBeenCalledTimes(1);
    });
  });
});
