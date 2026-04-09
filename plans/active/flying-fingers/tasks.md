# Flying Fingers — Tasks

> Rolling execution backlog. Keep `Now` to 1–2 items. Move items as reality changes. `plan.md` is the spec; this file is the workbench.

## Now

- [ ] **Scaffold the real project** — Vite + TypeScript + Preact + `@crxjs/vite-plugin` + Dexie + Vitest. First substep: focused research on the current (2026) recommended `@crxjs/vite-plugin` setup for MV3 extensions (minimum 3 sources per executing-plans skill requirement). Then `npm init`, `vite.config.ts`, `manifest.json`, minimal popup + options pages, and a working dev loop that loads as an unpacked extension.

## Next

- [ ] Write the first unit tests for `engine/timing.ts` (log-normal IKI distribution) — TDD RED
- [ ] Implement `engine/timing.ts` to pass the tests — TDD GREEN
- [ ] Implement `engine/session.ts` state machine (idle → typing → paused → correcting → done) with tests
- [ ] Implement `engine/estimator.ts` session duration predictor with tests
- [ ] Define `adapters/base.ts` adapter interface
- [ ] Port the validated GDocs event-sequencing code into `adapters/gdocs.ts`
- [ ] Implement `adapters/trainer.ts` (in-app trainer destination — easiest adapter, useful for manual testing)
- [ ] Build the minimal popup UI (just "start practice" and rank/XP display)

## Later

- [ ] Implement `tracker/observer.ts` — real-keystroke observer content script
- [ ] Implement `tracker/ranks.ts` + XP math + rank progression
- [ ] Implement `tracker/session-log.ts` Dexie schema
- [ ] Build the options page: dashboard, practice, stats, settings
- [ ] Implement the WPM-over-time chart on the stats page
- [ ] Write 8+ built-in practice passages
- [ ] Add dark mode theme
- [ ] Wire up Settings → Advanced → "Enable custom practice passages" toggle
- [ ] Add "Custom Passage" flow with destination selector and time estimate warning
- [ ] Implement typo simulation (`engine/errors.ts`)
- [ ] Add fatigue curve to engine
- [ ] Add cognitive pauses at sentence boundaries
- [ ] Write sideload instructions (Mac/Windows/Chromebook) in README
- [ ] Test on all three platforms
- [ ] Add a generic contenteditable/input adapter (`adapters/generic.ts`) for non-GDocs sites
- [ ] Write `docs/specifications/` page (cover-story framing)
- [ ] Write `docs/design/typing-engine.md` (internal — may reference real intent)
- [ ] Write ADR for the adapter pattern choice
- [ ] Investigate Chrome Web Store submission (optional, deferred)

## Blocked

_(none yet)_

## Done

- [x] Brainstorming phase — requirements, research, approach decision (2026-04-08)
- [x] `plan.md` drafted and approved (2026-04-08)
- [x] `context.md` seeded with real intent and resume notes (2026-04-08)
- [x] `tasks.md` initialized (2026-04-08)
- [x] Repository initialized, first commit pushed to https://github.com/cbibbs/flying-fingers (2026-04-08)
- [x] **Validated the Google Docs injection technique** — spike v0.0.3 successfully typed 85 characters into a live Google Doc using `textInput` event dispatched to the inner contenteditable inside `iframe.docs-texteventtarget-iframe`. Three earlier iterations were needed: v0.0.1 failed on popup focus loss, v0.0.2 failed because top-level `document.execCommand` can't reach into iframe-owned editables, v0.0.3 crossed the iframe boundary and found the working technique (Path C: legacy `textInput` event). Full details and the exact code to lift into the real adapter recorded in `context.md`. (2026-04-08)
