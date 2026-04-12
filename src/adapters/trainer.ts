/**
 * In-app trainer adapter.
 *
 * Injects text character-by-character into an in-extension target element
 * (div or textarea). Used for the Practice feature and manual testing.
 * Simplest adapter — no cross-iframe navigation, no focus recovery.
 */

import type { Adapter, SeededRng } from "./base";

export class TrainerAdapter implements Adapter {
  private target: HTMLElement | null = null;

  /** Bind to a target element for text injection. */
  setTarget(el: HTMLElement): void {
    this.target = el;
  }

  canHandle(doc: Document): boolean {
    return doc.getElementById("flying-fingers-trainer") !== null;
  }

  async injectText(text: string, _rng: SeededRng): Promise<void> {
    const el = this.target;
    if (!el) throw new Error("No target element set — call setTarget() first");

    if (text.length === 0) return;

    const isTextarea = el instanceof HTMLTextAreaElement;

    // Clear before injecting
    if (isTextarea) {
      (el as HTMLTextAreaElement).value = "";
    } else {
      el.textContent = "";
    }

    for (const char of text) {
      if (isTextarea) {
        (el as HTMLTextAreaElement).value += char;
      } else {
        el.textContent = (el.textContent ?? "") + char;
      }
    }
  }
}
