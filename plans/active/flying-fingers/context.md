# Flying Fingers — Context

> Living discovery log. Appended to as work progresses. Resume-from-here document.

## Real Intent (internal)

The product's true purpose is to **fool on-screen observers into believing the user is typing** a document the user did not actually compose. The typing-tracker framing (ranks, XP, practice passages, stats dashboard) is plausible cover, designed to:

1. Hide the real feature behind unremarkable settings ("Advanced Mode → Custom Passages → Active Tab destination")
2. Give the product a believable reason to exist if anyone inspects it
3. Reuse the same typing engine for both the cover feature (paced practice) and the real feature (deceptive typing)

The README, store listing, screenshots, marketing copy, and any public documentation must describe this strictly as a typing trainer. Nothing in the public-facing surface may reference observer deception, cover stories, or the real intent. Internal plan docs and `docs/design/` may discuss it freely.

**When in doubt:** if a file could be read by someone other than the user or Claude, it's public and must stay in-character.

## Key Decisions Made (Brainstorming Phase)

- **Platform:** Chrome MV3 extension, sideloaded from GitHub initially; Chrome Web Store deferred
- **Tech stack:** Vite + TypeScript + Preact + Dexie + plain CSS (chosen for bundle size, type safety, and dev velocity)
- **Cover scope:** Medium — real tracker functionality, not just a façade; believable to a 5-minute inspection
- **Hidden mode:** semi-hidden via Settings → Advanced → "Enable custom practice passages" toggle. Not Konami code; not magic phrase. The real feature is one setting toggle + one destination selection away.
- **Typing engine:** log-normal IKI distribution (not Gaussian) based on Aalto research; fatigue modeling; optional typo generation with realistic correction latency
- **Google Docs injection:** character-by-character event sequencing per the AutoQuill reference pattern. Fragile — will likely need occasional patching as Google updates GDocs.
- **Adapter pattern:** site-specific injection logic isolated in `src/adapters/*`; engine remains DOM-free
- **Ranks:** 10 tiers from Hunt & Peck 🐾 to Flying Fingers ✨

## Critical Technical Unknowns

### Resolved
- ✅ Can a Chrome extension type into Google Docs? **Yes**, via event sequencing (AutoQuill proves it); not via `KeyboardEvent` dispatch alone.
- ✅ What's the right timing distribution? **Log-normal**, not Gaussian.
- ✅ What framework for the UI? **Preact** — React API, tiny bundle.

### Still Open
- ❓ Does Chromebook Chrome have any quirks with MV3 extensions vs. desktop Chrome? Low risk but untested.
- ❓ Will typing simulation trigger Google's abuse detection on a real Google account? Need to test with throwaway account first.
- ❓ Does the `textInput` event technique work on other GDocs-like editors (Slides, Sheets) or will each need its own research pass?

### Resolved During Execution

- ✅ **VALIDATED: Google Docs injection works via `textInput` events on the inner contenteditable.** Spike v0.0.3 ran a full 85-character test string through the real GDocs editor (2026-04-08). All characters appeared visibly on screen, one at a time. The working technique:
  1. Get `iframe.docs-texteventtarget-iframe` from the top document
  2. Read `iframe.contentDocument.activeElement` — this is a `DIV` with `contenteditable="true"` and `role="textbox"` inside the iframe's document
  3. Dispatch a legacy `textInput` event (plain `Event` with `data: char` property set) to that DIV with `bubbles: true`

  **What did NOT work (ruled out through the spike):**
  - Path A: `iframe.contentDocument.execCommand('insertText', false, char)` — returned false, nothing inserted
  - Path B: `InputEvent` with `inputType: 'insertText'` dispatched to the inner target — beforeinput was cancelled or ignored
  - Path D: `KeyboardEvent` triplet (keydown/keypress/keyup) to the inner target — not reached (C succeeded first), but the `isTrusted: false` on synthesized keyboard events makes this unlikely to work anyway

  **What also did NOT work (from earlier iterations):**
  - Any technique run against the top-level `document` or `document.activeElement` — because the editable is inside an iframe, not the top document
  - Popup-button trigger — steals focus from the page

  **This contradicts the brainstorming research that claimed `execCommand` works.** The real answer is more nuanced: `execCommand` is the wrong technique entirely, and the correct one (`textInput` on the inner contenteditable) is the legacy webkit-style event that GDocs still honors. Record this in the implementation notes of the real adapter. The spike proved it empirically.

  **Code location to lift into the real adapter:** `spike/gdocs-injection/content.js` — specifically `getEventTargetIframe()`, `getInnerTarget()`, and the Path C section of `typeCharacter()`. The four-path fallback structure itself should also be kept, because GDocs updates may eventually move to a different technique.

- ✅ **Popups steal focus from the page.** First spike iteration (2026-04-08) triggered `execCommand` from a popup button click — it silently failed because clicking the toolbar popup moves focus from the Google Docs document to the popup window. By the time the content script ran, no editable had focus. Diagnosis output confirmed this: `activeElementTag: "IFRAME"` (the editor iframe) was correct *before* the popup click, but the actual type-time context had lost document focus.

  **Fix:** trigger via `chrome.commands` keyboard shortcut instead. Keyboard shortcuts fire while the document is still focused, so `execCommand` has an editable to target. This is why production extensions (AutoQuill, Auto Typer Extension, etc.) all use keyboard-shortcut triggers instead of popup-click triggers.

  **Defense-in-depth:** content script also attempts `iframe.focus()` on `iframe.docs-texteventtarget-iframe` immediately before each inject attempt, in case focus was lost for any other reason.

- ✅ **What's the exact technique that works on current GDocs?** — Focused research on the AutoQuill source code (2026-04-08) confirms: `document.execCommand('insertText', false, char)`. No iframe targeting needed, no composition events needed, no custom `KeyboardEvent` dispatch. The deprecated `execCommand` API is explicitly preserved by the spec for undo-buffer compatibility, and GDocs still honors it. **Caveat:** only works when the document has focus (see popup-steals-focus finding above).

  **Note:** this conflicts with the initial brainstorming research, which called `execCommand` "unreliable". The focused follow-up (reading actual working production extension code) is more authoritative. If `execCommand` later breaks, the fallback techniques to try are:
  1. Dispatch `InputEvent` with `inputType: 'insertText'` and `data: char` to `document.activeElement`
  2. Target `iframe.docs-texteventtarget-iframe`'s `contentDocument.body` and dispatch synthesized keyboard events there
  3. Dispatch composition event triplet (`compositionstart` → `compositionupdate` → `compositionend`) — this is the IME path GDocs listens on

  Source: focused read of https://github.com/sohamgoswami7156/Autoquill content script (2026-04-08)

## Known Files / References

- **Upstream reference implementation:** https://github.com/sohamgoswami7156/Autoquill (MV3 GDocs typer — study event sequence)
- **Algorithm reference:** https://github.com/Lax3n/HumanTyping (Python, semi-Markov typing model)
- **Research dataset:** https://userinterfaces.aalto.fi/136Mkeystrokes/ (Aalto 136M keystrokes, log-normal IKI finding)
- **MV3 docs:** https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions

## Repository

- **GitHub:** https://github.com/cbibbs/flying-fingers
- **Local path:** /Users/cbibbs/development/flying-fingers
- **Default branch:** (to be confirmed — likely `main`)

## Project State

- Brainstorming: complete (2026-04-08)
- Plan drafted and approved: 2026-04-08
- Context document seeded: 2026-04-08
- Git initialized: pending
- Initial commit + push: pending
- Project scaffolding: pending
- First code: pending

## Scaffolding Research — @crxjs/vite-plugin (2026-04-09)

Focused research pass before scaffolding (per executing-plans 3+ sources rule).

**Key finding:** `@crxjs/vite-plugin` v2.x went stable in **June 2025** (after a 3+ year beta). Safe for production. Use `^2.0.4`+.

**Sources:**
1. https://github.com/crxjs/chrome-extension-tools — official repo; v2.0 stable June 2025; HMR works for popup/options; CSS Modules in content scripts break HMR (issue #898)
2. https://redreamality.com/blog/the-2025-state-of-browser-extension-frameworks-a-comparative-analysis-of-plasmo-wxt-and-crxjs/ — 2025 framework comparison; CRXJS best-in-class for Vite integration + HMR; lacks built-in storage/messaging abstractions (we'll write our own)
3. https://dev.to/zerodays/beyond-the-popup-crafting-next-level-chrome-extensions-with-crxjs-3elg — practical messaging patterns + real architecture
4. https://dev.to/jacksteamdev/advanced-config-for-rpce-3966 — advanced config patterns (legacy RPCE, still useful)

**Decisions lifted from research:**
- Use `defineManifest()` from `@crxjs/vite-plugin` in a TS `manifest.config.ts` (intellisense + version sync with `package.json`) rather than a plain `manifest.json`
- Use `@preact/preset-vite` for Preact
- Keep content scripts in ISOLATED world (default) — MAIN world has known Apple Silicon breakage (`chrome.runtime.getURL` undefined)
- Never `import` the generated `manifest.json` from app code — it overwrites the CRXJS-generated one
- Bootstrap command: `npm create crxjs@latest` — but we'll write files by hand to keep the shape exactly matching `plan.md`'s architecture
- HMR caveat: adding Tailwind classes to content scripts requires a Vite restart — not relevant because plan already rejected Tailwind

**Recommended deps:**
```
@crxjs/vite-plugin ^2.0.4
vite ^5
typescript ^5.3
preact ^10.19
@preact/preset-vite (latest)
dexie ^4
vitest ^1
```

## UI Implementation Notes (2026-04-12)

### Popup component structure
- Simple TDD: 3 tests, all green
- Uses inline styles (no CSS import needed at this scale)
- Mock rank data clearly marked with `MOCK_` prefix
- Progress bar shows visual XP progression (green bar, width = current/next percentage)
- Button handler is a stub ready for wiring to options page

### Next: tracker module dependencies
The popup currently displays mock data. To wire it to real data, we need:
1. `tracker/session-log.ts` — Dexie schema for recording typing sessions
2. `tracker/ranks.ts` — rank definitions and XP progression math
3. `tracker/observer.ts` — content script that watches real user keystrokes and records sessions

Once these exist, the popup will:
- Read the current session count + total XP from session-log via Dexie
- Calculate rank tier from total XP using ranks.ts
- Display the real data instead of mock

### vitest config update
Updated `vitest.config.ts` to include `.tsx` test files (in addition to `.test.ts`). Needed for Preact component testing.

## Next Session Resume Notes

If you're picking this up fresh:
1. Read `plan.md` first — it's the approved spec
2. Read this file for the real intent and context
3. Check `tasks.md` for the current `Now` slice
4. Follow `hyperpowers:executing-plans` to work through tasks
5. Keep this file updated with any new discoveries, file references, and open questions
