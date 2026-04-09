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
- ❓ How fragile is the GDocs adapter in practice? Need to validate on current GDocs build before committing to the approach. **← spike in progress**
- ❓ Does Chromebook Chrome have any quirks with MV3 extensions vs. desktop Chrome? Low risk but untested.
- ❓ Will typing simulation trigger Google's abuse detection on a real Google account? Need to test with throwaway account first.

### Resolved During Execution
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

## Next Session Resume Notes

If you're picking this up fresh:
1. Read `plan.md` first — it's the approved spec
2. Read this file for the real intent and context
3. Check `tasks.md` for the current `Now` slice
4. Follow `hyperpowers:executing-plans` to work through tasks
5. Keep this file updated with any new discoveries, file references, and open questions
