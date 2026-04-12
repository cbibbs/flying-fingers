/**
 * Google Docs injection adapter.
 *
 * Injects text character-by-character into a Google Docs document via the
 * legacy `textInput` event dispatched to the inner contenteditable inside
 * the `iframe.docs-texteventtarget-iframe`. This is the "Path C" technique
 * validated in spike v0.0.3.
 *
 * Focus management: refocuses the iframe + inner target before each character
 * to recover from transient focus loss.
 */

import type { Adapter, SeededRng } from "./base";

export class GDocsAdapter implements Adapter {
  private doc: Document | null = null;

  /** Bind to a specific document (call before injectText). */
  setDocument(doc: Document): void {
    this.doc = doc;
  }

  canHandle(doc: Document): boolean {
    return (
      doc.location.hostname === "docs.google.com" &&
      doc.location.pathname.startsWith("/document/d/")
    );
  }

  async injectText(text: string, _rng: SeededRng): Promise<void> {
    const doc = this.doc;
    if (!doc) throw new Error("No document set — call setDocument() first");

    if (text.length === 0) return;

    const iframe = doc.querySelector(
      "iframe.docs-texteventtarget-iframe",
    ) as HTMLIFrameElement | null;
    if (!iframe) {
      throw new Error("Google Docs iframe not found");
    }

    const innerDoc = iframe.contentDocument;
    if (!innerDoc) {
      throw new Error("Cannot access iframe contentDocument (cross-origin?)");
    }

    const target = this.getInnerTarget(innerDoc);
    if (!target) {
      throw new Error("Cannot find inner editable target in iframe");
    }

    for (const char of text) {
      this.refocus(iframe, target);
      const ev = new Event("textInput", { bubbles: true, cancelable: true });
      (ev as Event & { data: string }).data = char;
      target.dispatchEvent(ev);
    }
  }

  private getInnerTarget(innerDoc: Document): Element | null {
    // Prefer the active element if it's not just <body>
    if (innerDoc.activeElement && innerDoc.activeElement !== innerDoc.body) {
      return innerDoc.activeElement;
    }
    // Fall back to any contenteditable or textbox role
    return innerDoc.querySelector(
      '[contenteditable="true"], [contenteditable="plaintext-only"], [role="textbox"]',
    );
  }

  private refocus(iframe: HTMLIFrameElement, target: Element): void {
    try {
      iframe.focus();
      if (typeof (target as HTMLElement).focus === "function") {
        (target as HTMLElement).focus();
      }
    } catch {
      // Best-effort; focus may fail if the page state changed
    }
  }
}
