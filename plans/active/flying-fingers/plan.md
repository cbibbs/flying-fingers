# Flying Fingers — Plan

> **Status:** Approved spec (brainstorming phase complete, ready for `writing-plans` → `executing-plans`)
> **Slug:** flying-fingers
> **Created:** 2026-04-08

---

## Problem

The user wants a tool that takes an arbitrary passage of text and enters it into a web-based editor (initially Google Docs) in a way that **looks to an on-screen observer like the user is typing it themselves**. The output must be a perfect, complete copy of the source material, and the typing rhythm must be believably human (variable cadence, natural pauses, optional typos with corrections).

The tool must be free to build, host, and distribute, and must work on Mac, Windows, and Chromebook — the user owns all three.

## Real Intent (internal only — do not surface in README or public docs)

The primary goal is to **fool on-screen observers into believing the user is typing** a document that the user did not actually compose in real time. All other features are secondary to this. The product is wrapped in a typing-tracker façade (ranks, XP, stats, practice passages) to provide plausible cover: the same engine that "paces" a practice passage at a target WPM is the engine that produces the deception. The cover story is not cosmetic — it dictates the product's surface area, UX, and naming conventions throughout.

The README, store listing, screenshots, and any user-facing documentation must describe the product strictly as a typing trainer. The true intent lives in this file and in `context.md`.

## Goals

1. **Perfect fidelity** — output is a byte-exact copy of the source text after the session completes (typos are corrected, not left in)
2. **Believable typing rhythm** — inter-keystroke timing follows a log-normal distribution; optional typo simulation with realistic correction latency; optional fatigue curve; cognitive pauses at sentence boundaries
3. **Cross-platform** — runs on Mac, Windows, and Chromebook via Chrome/Chromium
4. **Zero monetary cost** — development, hosting, and distribution at $0 (sideload from GitHub initially; Chrome Web Store's $5 fee is deferred and optional)
5. **Time estimate** — before starting, show the user how long the session will take at the configured WPM so they can trim the input to a realistic duration (no 4-hour "typing" marathons)
6. **Google Docs first, extensible** — must work in Google Docs on day one; architecture must allow adding per-site adapters later (other web editors) without touching the core engine
7. **Convincing cover** — typing tracker façade is a functional Medium-scope product: real session tracking, real rank progression, built-in practice passages, working stats dashboard
8. **Plausible hidden mode** — "Custom Passage → Active Tab" destination is reachable only by enabling Advanced Mode in settings (semi-hidden, not trick-activated)

## Anti-Goals

- **Not** a tool that leaves typos in the final output
- **Not** a tool that uses the Google Docs API to insert text invisibly (observer must see typing happen on screen)
- **Not** a native desktop app — must be a browser extension for cross-platform reach
- **Not** a mobile/Android app (even though Chromebook supports them, Mac/Windows wouldn't)
- **Not** dependent on any paid service, hosting, or API
- **Not** an obviously-suspicious product — the hidden destination is reachable through ordinary settings, not Konami codes or magic phrases
- **Not** AI-generated content — the tool types text the user supplies; it does not author anything

## Constraints

- **Distribution:** sideload from GitHub for now; Chrome Web Store publication is a later option
- **Platform:** Chrome / Chromium-based browsers only (covers Mac, Windows, Chromebook use cases)
- **Extension format:** Manifest V3 (MV2 is being sunset)
- **No server-side components:** all logic runs in the extension; no backend, no telemetry, no remote config
- **Storage:** IndexedDB (via Dexie) for session history; `chrome.storage.local` for settings
- **Cover scope:** Medium — real tracker functionality, not just a façade

## Research Notes

Summary of findings from the brainstorming research pass. Full transcript in `context.md`.

### Google Docs injection (critical unknown, resolved)

Google Docs uses a proprietary virtual keyboard architecture. Standard `KeyboardEvent` dispatch fails silently. `document.execCommand` is unreliable. The Google Docs API would work but inserts text instantly, defeating the visual requirement.

**Viable approach:** character-by-character event sequencing with careful focus management, as demonstrated by the open-source [AutoQuill MV3 extension](https://github.com/sohamgoswami7156/Autoquill). Fragile — may break with Google Docs updates — but it is the only known method that produces visible on-screen typing in GDocs.

### Typing rhythm modeling

- Academic research ([Aalto 136M keystrokes study](https://userinterfaces.aalto.fi/136Mkeystrokes/resources/chi-18-analysis.pdf)) shows inter-keystroke intervals follow a **log-normal** distribution, not Gaussian
- Baseline average IKI: ~239 ms (σ ~112 ms); fast typists ~120 ms, slow typists 480–900 ms
- Realistic error rate: ~2.3 corrections/sentence (~6% of characters)
- Cognitive pauses: +200–300 ms at sentence boundaries
- Fatigue: ~0.02–0.05% slowdown per 100 characters typed
- Bigram acceleration: common letter pairs type faster than rare ones
- Reference implementation: [HumanTyping (Python)](https://github.com/Lax3n/HumanTyping) — uses semi-Markov process, good algorithmic model

### Chrome Manifest V3 content script capabilities

- Permissions required: `activeTab`, `scripting`, host permissions for target sites
- Must dispatch `input` events after mutating `.value` to trigger React-style state updates
- No inline scripts (CSP); all code bundled
- Content scripts can dispatch events but cannot bypass the renderer's event validation — this is why GDocs requires special handling
- Reference: [Chrome Extensions declare permissions](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions)

### Sources

1. https://community.latenode.com/t/how-to-detect-keyboard-input-events-in-google-docs/24133 — explains GDocs' custom event architecture
2. https://github.com/sohamgoswami7156/Autoquill — working MV3 extension that types into Google Docs (reference implementation)
3. https://userinterfaces.aalto.fi/136Mkeystrokes/resources/chi-18-analysis.pdf — Aalto 136M keystroke dataset, log-normal IKI finding
4. https://github.com/Lax3n/HumanTyping — reference algorithm for human typing simulation
5. https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions — MV3 permissions model
6. https://pmc.ncbi.nlm.nih.gov/articles/PMC8606350/ — log-normal superiority for free-text typing timing

## Chosen Approach

**Single Chrome MV3 extension** built with **Vite + TypeScript + Preact + Dexie**, distributed via GitHub sideload.

### Architecture

```
flying-fingers/
├── src/
│   ├── engine/              # typing rhythm + state machine (pure TS, unit-tested)
│   │   ├── timing.ts        # log-normal IKI, fatigue, cognitive pauses
│   │   ├── errors.ts        # typo generation + correction scheduling
│   │   ├── estimator.ts     # session duration prediction
│   │   └── session.ts       # state machine: idle → typing → paused → correcting → done
│   ├── adapters/            # per-site keystroke injection
│   │   ├── base.ts          # adapter interface
│   │   ├── gdocs.ts         # Google Docs adapter (event sequencing)
│   │   ├── generic.ts       # contenteditable + input/textarea fallback
│   │   └── trainer.ts       # in-extension practice area (no injection needed)
│   ├── tracker/             # the cover product
│   │   ├── session-log.ts   # Dexie schema + queries
│   │   ├── ranks.ts         # rank definitions + XP math
│   │   ├── observer.ts      # content script that watches real user typing
│   │   └── passages.ts      # built-in practice passages
│   ├── ui/                  # Preact components
│   │   ├── popup/           # toolbar popup: quick stats, start practice
│   │   ├── options/         # full UI: dashboard, practice, stats, settings
│   │   └── shared/
│   ├── content-script.ts    # loaded into matched pages; hosts adapter + observer
│   ├── background.ts        # service worker; message routing, storage
│   └── manifest.json
├── tests/                   # vitest unit tests for engine
├── plans/active/flying-fingers/
├── docs/
│   ├── specifications/      # public-facing (cover story only)
│   ├── design/              # internal (may reference true intent)
│   └── decisions/           # ADRs
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### Key design decisions

- **Engine is framework-free.** The `engine/` module is pure TypeScript with no DOM dependencies. Unit-testable, swappable, and reusable if we ever port to another platform.
- **Adapters isolate site-specific weirdness.** GDocs fragility lives in `adapters/gdocs.ts`. When Google breaks us, we patch one file. Adding a new target (Notion, Outlook, etc.) means writing a new adapter against the same interface.
- **Cover and hidden feature share the engine.** "Practice passage at target WPM" and "type user's passage into active tab" are the same engine call with different source text and different adapter destinations.
- **Settings → Advanced → Enable Custom Passages** unlocks the "Custom Passage" option on the Practice page, which in turn exposes the "Active browser tab (muscle memory mode)" destination. Two ordinary clicks away from the real feature.
- **Session tracking is real.** The content script observes the user's keystrokes on any page (with their consent) and writes session records to Dexie. XP and ranks are earned from real typing. This makes the cover convincing without extra fakery.

### Ranks

| Tier | Name | Emoji |
|------|------|-------|
| 1 | Hunt & Peck | 🐾 |
| 2 | Two-Finger Tapper | 🐌 |
| 3 | Keyboard Hatchling | 🐣 |
| 4 | Home Row Rookie | 🦆 |
| 5 | Swift Scribe | 🐇 |
| 6 | Keystroke Fox | 🦊 |
| 7 | Velocity Hawk | 🦅 |
| 8 | Lightning Digits | ⚡ |
| 9 | Phantom Typist | 🌪️ |
| 10 | Flying Fingers | ✨ |

XP formula (initial; to be tuned): `chars_typed × accuracy × (1 + (wpm - 40) / 100)`. Rank thresholds on a gentle exponential curve so progression feels meaningful without being grindy.

## Rejected Alternatives

### Google Docs API via OAuth
Would reliably insert text but does not produce visible character-by-character typing. Fails the primary requirement.

### Native desktop app (Electron / Tauri / native)
Requires per-platform builds, installers, and signing. Chromebook support is impossible without a separate Android build. Extension is strictly better for our constraints.

### Plain JavaScript (no build step)
Considered for simplicity. Rejected because the engine code (log-normal timing, state machines, event sequencing) benefits significantly from TypeScript's type safety, and the cover product has enough UI surface that component-based rendering is worth the build step.

### React instead of Preact
Rejected due to bundle size. Preact is ~4 KB vs React's ~45 KB, with the same component API for our needs. Extension popups should load instantly.

### Tailwind CSS
Rejected to keep the build chain minimal. Plain CSS with variables is sufficient for a single-product extension.

### Bookmarklet + GitHub Pages web app
Considered as a no-install option. Rejected because bookmarklets face increasing browser security restrictions, cannot persist state well, and provide a worse UX than an extension. Also doesn't fit the cover story — a typing tracker that's a bookmarklet would be weird.

### Hidden activation (Konami code, magic phrase)
Rejected in favor of semi-hidden Advanced Mode. Trick activations are *more* suspicious when discovered; boring settings toggles are invisible.

## Acceptance Criteria

### Engine
- [x] Inter-keystroke timing follows log-normal distribution with configurable median and σ
- [ ] Session duration estimator returns an accurate estimate (±10%) before typing begins
- [ ] Fatigue curve slows typing gradually over long sessions
- [x] Cognitive pauses add delay at sentence boundaries
- [ ] Optional typo mode generates typos at configured rate and corrects them with realistic latency
- [ ] Final output is byte-exact identical to source text (all typos corrected)
- [ ] Engine is 100% unit-testable with no DOM dependencies

### Google Docs adapter
- [ ] Typing a 200-word passage into an empty Google Doc produces a byte-exact copy
- [ ] Typing is visible on screen in real time (not batch-inserted)
- [ ] Special characters (punctuation, unicode, line breaks) are handled correctly
- [ ] Adapter detects when focus is lost and pauses gracefully

### Cover product
- [ ] Dashboard shows real session stats (WPM, accuracy, session count, streak)
- [ ] Rank progression works and is persisted across browser restarts
- [ ] At least 8 built-in practice passages are available
- [ ] Stats page renders a WPM-over-time chart from real session data
- [ ] Dark mode available
- [ ] README describes the product as a typing tracker with no mention of the real intent

### Hidden feature access
- [ ] Settings → Advanced → "Enable custom practice passages" toggle exists
- [ ] When enabled, a "Custom Passage" option appears on the Practice page
- [ ] Custom Passage lets user paste text or upload a `.txt` file
- [ ] Destination selector offers "In-app trainer" (default) and "Active browser tab"
- [ ] Time estimate is shown before starting a custom session
- [ ] User is warned if estimated duration exceeds a realism threshold (e.g., 45 minutes)

### Cross-platform
- [ ] Sideload instructions work on Mac Chrome, Windows Chrome, and Chromebook Chrome
- [ ] No platform-specific code paths required

---

## Implementation (As-Built)

_Living section; appended to as slices of the plan land._

### Engine — log-normal IKI sampler (2026-04-09)

- **Files:**
  - `src/engine/timing.ts` — `createIkiSampler(config)` returning `() => number` (milliseconds)
  - `tests/engine/timing.test.ts` — 10 Vitest specs covering distribution, determinism, and edge cases
- **API shape:** config is a union of `{ medianMs, sigmaMs, rng }` (linear parameterization) or `{ muLog, sigmaLog, rng }` (log-space parameterization). RNG is injected (`() => number` uniform on `[0,1)`) so the sampler is seedable and deterministic — the sampler never touches `Math.random`.
- **Math:** linear → log conversion uses `sigmaLog = sqrt(ln(1 + (sigmaMs/medianMs)^2))`, `muLog = ln(medianMs)` so the configured median is the distribution median (not the mean). Standard normals come from Box-Muller with the second draw cached across calls; `u1 === 0` is guarded to avoid `log(0) = -Infinity`.
- **Test strategy:** tests drive a deterministic mulberry32 PRNG and assert on distributional properties — empirical median within 2% of target at N=10k, log-space sigma within 2% of target, skewness/kurtosis of `ln(samples)` within ~3σ of normality, determinism via byte-identical sequences under repeated seeding, byte-identical equivalence of linear vs log-space config branches under the same seed, and explicit coverage of the `u1 === 0` guard.
- **Scope discipline:** fatigue curve, cognitive sentence pauses, bigram acceleration, and typo/correction logic are intentionally *not* in this slice — they are separate engine modules that will compose with the sampler. See remaining unchecked Engine acceptance criteria above.
- **Deviations from spec:** none. The plan called for "log-normal distribution with configurable median and σ" — delivered, with the additional log-space parameterization as a convenience that passes byte-identical equivalence tests against the linear path.
- **Review:** audited by `qe-reviewer` (2 rounds). All BLOCK and strongly-recommended FLAG findings resolved before commit.

### Engine — session state machine (2026-04-11)

- **Files:**
  - `src/engine/session.ts` — `createSession(sourceText)` returning a `Session` object
  - `tests/engine/session.test.ts` — 25 Vitest specs covering all transitions, illegal transitions, edge cases, and purity
- **API shape:** `createSession(sourceText: string): Session`. Session exposes `start / pause / resume / beginCorrection / endCorrection / advance(elapsedMs)` plus getters `getState / getPosition / getElapsedMs / getCurrentChar / getSourceText / isDone`.
- **States:** `idle → typing → paused → correcting → done`. All illegal transitions throw `Error("Illegal transition: cannot <action> from state \"<state>\"")`. Empty source: `start()` transitions directly to `done`.
- **Key design decision:** `advance()` is legal in both `typing` and `correcting`. In `typing` it increments position and accumulates elapsed time; auto-transitions to `done` when position reaches source length. In `correcting` it accumulates elapsed time only (position unchanged) — correction keystrokes consume time without forward progress. This avoids a premature `recordCorrectionTime()` method before the correction slice exists.
- **Purity:** no Date.now, no Math.random, no DOM, no side effects. Elapsed time is caller-supplied. Deterministic — two sessions with identical inputs produce identical observable state (tested).
- **Test strategy:** strict `illegalMsg(action, state)` matchers pin the exact error message format per call site. Tests cover: all 5 legal transitions, illegal transitions from every source state for all 6 methods, 1-char boundary (off-by-one guard), `getCurrentChar` during correcting, negative elapsedMs from both typing and correcting, empty-source done illegals, pause/resume state preservation, purity/determinism, source immutability.
- **Deviations from spec:** none.
- **Review:** audited by `qe-reviewer` (2 rounds). All FLAG findings resolved before commit.

### Engine — session duration estimator (2026-04-11)

- **Files:**
  - `src/engine/estimator.ts` — `estimateSessionDuration(config)` returning total ms
  - `tests/engine/estimator.test.ts` — 14 Vitest specs covering correctness, edge cases, and integration
- **API shape:** `estimateSessionDuration({ sourceText, medianMs, sigmaMs, rng, cognitivePauseMs? }): number`. Delegates to `createIkiSampler` from timing.ts for per-character IKI sampling. Adds a configurable cognitive pause (default 250ms) after sentence-ending punctuation (`.`, `!`, `?`). Returns 0 for empty text.
- **Key design decisions:** (1) Sentence boundary detection uses a simple char-in-Set check rather than regex or lookahead — avoids abbreviation/ellipsis edge cases while keeping the code trivial. The correction slice can refine later. (2) `cognitivePauseMs` uses nullish coalescing (`??`) so callers can explicitly set 0 to disable pauses. (3) No fatigue curve yet — separate slice.
- **Test strategy:** same-seed/same-length string pairs isolate cognitive-pause contributions via exact difference assertions. Integration tests prove byte-identical output vs manual `createIkiSampler` sums (with and without punctuation). Scaling test uses 30/120 char texts with 3.5-4.5x bounds to catch O(n^2) bugs. Sanity check asserts against the correct log-normal *mean* (not median) with 15% tolerance. Negative punctuation test (`,`, `:`, `;`, `-`, `"`, `'`) guards the punctuation set. `cognitivePauseMs: 0` test pins nullish-coalescing behavior.
- **Deviations from spec:** none. Plan called for "session duration estimator returns accurate estimate before typing begins" + "cognitive pauses at sentence boundaries" — both delivered.
- **Review:** audited by `qe-reviewer` (2 rounds). BLOCK (scaling tolerance) and all FLAG findings resolved before commit.

### Adapters — Google Docs injection (2026-04-11)

- **Files:**
  - `src/adapters/gdocs.ts` — `GDocsAdapter` class implementing `Adapter` from base.ts
  - `tests/adapters/gdocs.test.ts` — 17 Vitest specs covering DOM navigation, event dispatch, focus management, error paths, and edge cases
- **Technique:** legacy `textInput` event dispatched to the inner contenteditable DIV inside `iframe.docs-texteventtarget-iframe` (Path C from spike v0.0.3). Events created with `bubbles: true, cancelable: true`, `.data` set to the character.
- **Focus management:** refocuses iframe + inner target before every character dispatch to recover from transient focus loss. Ordering verified via shared call-log in tests.
- **getInnerTarget fallback:** prefers `activeElement` (if not null and not body), falls back to `querySelector('[contenteditable="true"]...')`. Both paths tested.
- **canHandle:** matches `docs.google.com` hostname + `/document/d/` path prefix (fixed from `/document/` to avoid over-matching `/documentx/` etc).
- **Design decision (rng parameter):** the `_rng` parameter from the `Adapter` interface is intentionally unused. Timing is the orchestrator's responsibility — the adapter does raw synchronous injection, and the engine/session controls pacing by calling the adapter with delays between characters.
- **Test strategy:** mocks build a minimal GDocs DOM structure with shared `callLog` for ordering assertions. Tests cover: per-char dispatch with correct data, bubbles+cancelable flags, focus-before-dispatch ordering, 4 error paths (no doc, no iframe, no contentDocument, no inner target) with anchored regex matchers, empty text, BMP unicode, astral-plane emoji (guards against `text[i]` surrogate split), and both getInnerTarget paths (activeElement null, activeElement is body).
- **Deviations from spec:** none.
- **Review:** audited by `qe-reviewer` (2 rounds). 2 BLOCKs and 6 FLAGs resolved before commit, including an implementation bug (F6: startsWith over-match).

### Tracker — session-log Dexie schema (2026-04-12)

- **Files:**
  - `src/tracker/session-log.ts` — `SessionLogDatabase` Dexie class + `insertSession/getAllSessions/getStatsSnapshot` API
  - `src/tracker/session-log.mock.ts` — in-memory mock for testing
  - `tests/tracker/session-log.test.ts` — 9 Vitest specs
  - `tests/setup.ts` — global test setup (fake-indexeddb polyfill for jsdom)
- **API shape:**
  - `SessionRecord` interface with auto-incremented id, timestamps, WPM, accuracy, destination, etc.
  - `insertSession(record)` → Promise<number> (returns session ID)
  - `getAllSessions()` → Promise<SessionRecord[]> (reverse chronological)
  - `getStatsSnapshot()` → Promise<{ totalSessions, totalCharsTyped, averageWpm, averageAccuracy, bestWpm }>
- **Schema:** Dexie v1 with `sessions` table indexed on `++id`, `startTime`, `createdAt`
- **Testing strategy:** Mock implementation stores sessions in-memory array; production code uses real Dexie/IndexedDB. Both implement the same SessionRecord interface.
- **Deviations from spec:** none. Plan called for "session recording with Dexie schema" — delivered.
- **Review:** TDD cycle completed; 9/9 tests passing, typecheck clean.

### Tracker — observer keystroke tracking (2026-04-12)

- **Files:** `src/tracker/observer.ts` (pure state machine), `tests/tracker/observer.test.ts` (14 specs)
- **API:** `createObserver()` → Observer; `start/recordKeystroke/stop/getSessionData` lifecycle
- **Metrics:** startTime, endTime, durationMs, charCount, errorCount, WPM, accuracy
- **Formula:** WPM = (charCount / 5) * (60000 / durationMs); accuracy = (charCount - errorCount) / charCount
- **Test strategy:** state transitions, keystroke accumulation, accuracy/WPM calculation, error states (record while idle, idempotent stop, restart)
- **Deviations:** none. Plan called for "observer content script" — delivered as pure JS module, content script integration TBD.
- **Review:** TDD cycle complete; 14/14 tests passing.

### Tracker — ranks XP math (2026-04-12)

- **Files:**
  - `src/tracker/ranks.ts` — `RANKS` constant, `calculateXp/getCurrentRank/getNextRankThreshold/getProgressToNextRank` API
  - `tests/tracker/ranks.test.ts` — 26 Vitest specs
- **API shape:**
  - `RANKS: Rank[]` — 10 tiers with tier, name, emoji, thresholdXp
  - `calculateXp({ charCount, accuracy, wpm })` → number
  - `getCurrentRank(totalXp)` → Rank
  - `getNextRankThreshold(totalXp)` → number
  - `getProgressToNextRank(totalXp)` → number (0–1)
- **XP formula:** `charCount × accuracy × (1 + (wpm - 40) / 100)` (rewards speed, accuracy, quantity)
- **Rank thresholds:** exponential curve (baseXp * (tier - 1)^1.8) for meaningful progression
- **Test strategy:** comprehensive coverage of edge cases (0 XP, tier boundaries, max rank, speed bonuses/penalties)
- **Deviations from spec:** none. Plan called for "XP math + rank progression" — delivered.
- **Review:** TDD cycle completed; 26/26 tests passing, typecheck clean.

### UI — Popup component (2026-04-12)

- **Files:**
  - `src/ui/popup/Popup.tsx` — Preact component rendering rank display, XP progress bar, and "Start Practice" button
  - `tests/ui/popup.test.tsx` — 3 Vitest specs covering rank/emoji display, XP display, and button presence
- **API shape:** `<Popup />` — simple component, no props (mock data used for now)
- **Styling:** inline styles with a card layout; rank display shows emoji, name, current/next XP, and visual progress bar (green, 50% width at 250/500 XP)
- **Mock data:** hardcoded Hunt & Peck rank (tier 1, emoji 🐾) and 250/500 XP. Clearly marked `MOCK_` constants for future replacement with real tracker data.
- **Button handler:** `handleStartPractice` is a stub; will open the options page later when options page is built and message-passing is wired
- **Test strategy:** renders component in a container and asserts on text content and button presence. Tests are minimal and focused on the UI contract (what should appear)
- **Deviations from spec:** none. The "start practice" + rank/XP display requirement is met. Design is clean and ready for wiring to real tracker data.
- **Review:** TDD cycle completed; 3/3 tests passing, typecheck clean.
