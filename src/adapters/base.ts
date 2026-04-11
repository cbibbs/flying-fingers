/**
 * Adapter interface for site-specific keystroke injection.
 *
 * Each adapter encapsulates the DOM-manipulation details required to produce
 * visible, character-by-character typing on a particular web editor. The core
 * engine remains DOM-free; adapters bridge the gap between an engine-driven
 * character stream and the target page's event model.
 *
 * To add support for a new site, implement this interface and register the
 * adapter so `content-script.ts` can select it at runtime.
 */

/**
 * A seeded pseudo-random number generator that returns uniform floats in
 * [0, 1). Inject a deterministic implementation (e.g. mulberry32) in tests;
 * use a time-seeded variant in production for natural variation.
 */
export type SeededRng = () => number;

/**
 * Contract that every site-specific injection adapter must satisfy.
 */
export interface Adapter {
  /**
   * Returns true if this adapter can handle the given document.
   *
   * The content script calls `canHandle` on each registered adapter in
   * priority order and selects the first match. Implementations should inspect
   * `doc.location.hostname` or the presence of known DOM landmarks — they
   * must NOT mutate the document.
   *
   * @param doc - The top-level document of the active tab.
   */
  canHandle(doc: Document): boolean;

  /**
   * Types `text` into the active editor on `doc`, one character at a time,
   * with timing governed by `rng`.
   *
   * Implementations are responsible for:
   * - Locating the correct editable target within `doc`
   * - Dispatching the appropriate DOM events for each character
   * - Pausing/resuming if the engine signals a pause (via session state)
   * - Ensuring the final content is a byte-exact copy of `text`
   *
   * The returned Promise resolves when the full passage has been typed.
   * It rejects if injection cannot proceed (e.g. focus lost, target not found).
   *
   * @param text - The complete passage to inject, already final-form (typos
   *               and corrections are handled by the engine before this call).
   * @param rng  - Seeded RNG used to sample inter-keystroke intervals.
   *               Injected so callers can produce deterministic output in tests.
   */
  injectText(text: string, rng: SeededRng): Promise<void>;
}
