# Flying Fingers — Tasks

> Rolling execution backlog. Keep `Now` to 1–2 items. Move items as reality changes. `plan.md` is the spec; this file is the workbench.

## Now

- [ ] Implement `tracker/ranks.ts` + XP math + rank progression

## Next

- [ ] Implement `tracker/ranks.ts` + XP math + rank progression
- [ ] Implement `tracker/observer.ts` — real-keystroke observer content script

## Later

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

- [x] **`tracker/session-log.ts` — Dexie schema + session recording (TDD)** — RED→GREEN cycle. 9/9 tests passing, typecheck clean. Mock implementation for testing in `session-log.mock.ts` using in-memory storage. Production code uses real Dexie/IndexedDB. (2026-04-12)
- [x] **Minimal popup UI** — rank display + XP progress + "Start Practice" button (TDD). 3/3 tests passing. Commit pending. (2026-04-12)
- [x] Brainstorming phase — requirements, research, approach decision (2026-04-08)
- [x] `plan.md` drafted and approved (2026-04-08)
- [x] `context.md` seeded with real intent and resume notes (2026-04-08)
- [x] `tasks.md` initialized (2026-04-08)
- [x] Repository initialized, first commit pushed to https://github.com/cbibbs/flying-fingers (2026-04-08)
- [x] **`adapters/trainer.ts` — in-app trainer adapter (TDD)** — RED→GREEN cycle via the team. 14/14 tests passing, typecheck clean. qe-reviewer PASS after one revision round (F1, F2, F3 addressed). Commit `[SHA pending]` as `feat(adapters): in-app trainer text injection`. (2026-04-12)
- [x] **`adapters/gdocs.ts` — Google Docs injection (TDD)** — RED→GREEN cycle via the team. 17/17 tests passing, typecheck clean. qe-reviewer PASS after one revision round (B1, B2, F1-F6 all addressed; F6 caught an impl bug). Commit `c05ed7a`. `plan.md` As-Built section updated. (2026-04-12)
- [x] **`adapters/base.ts` — interface scaffold** — Exported `SeededRng` type alias and `Adapter` interface with `canHandle()` and `injectText()`. Commit `953ed4e`. Typecheck passes. (2026-04-11)
- [x] **`engine/estimator.ts` — session duration predictor (TDD)** — RED→GREEN cycle via the team. 14/14 tests passing, typecheck clean. qe-reviewer PASS after one revision round (B1, F1-F5 addressed). Commit `c270056`. `plan.md` As-Built section updated. (2026-04-11)
- [x] **`engine/session.ts` — state machine (TDD)** — RED→GREEN cycle via the team. 25/25 tests passing, typecheck clean. qe-reviewer PASS after one revision round (F1, F2, F4, F5, N1 addressed; no BLOCKs). Commit `24a4b23`. `plan.md` As-Built section updated. (2026-04-11)
- [x] **`engine/timing.ts` — log-normal IKI sampler (TDD)** — RED→GREEN cycle via the team. Seedable RNG injected (not `Math.random`). 10/10 tests passing, typecheck clean. qe-reviewer PASS after one revision round (B1, B2, F1, F3, F5 addressed; F2/F4 deferred with reviewer acceptance). Commit `0d747eb`. `plan.md` As-Built section updated. (2026-04-09)
- [x] **Scaffolded the real project** — Vite + TypeScript + Preact + `@crxjs/vite-plugin@^2.0.4` + Dexie + Vitest. `npm install`, `npm run build`, `npm run typecheck` all green. Committed as `c7b53d6` on `main` (not pushed). Research recorded in `context.md` (4 sources). Uses TS `manifest.config.ts` with `defineManifest` rather than plain JSON. (2026-04-09)
- [x] **Validated the Google Docs injection technique** — spike v0.0.3 successfully typed 85 characters into a live Google Doc using `textInput` event dispatched to the inner contenteditable inside `iframe.docs-texteventtarget-iframe`. Three earlier iterations were needed: v0.0.1 failed on popup focus loss, v0.0.2 failed because top-level `document.execCommand` can't reach into iframe-owned editables, v0.0.3 crossed the iframe boundary and found the working technique (Path C: legacy `textInput` event). Full details and the exact code to lift into the real adapter recorded in `context.md`. (2026-04-08)
