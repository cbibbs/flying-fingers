# GDocs Injection Spike

**This is throwaway code.** Its only purpose is to answer one question:

> Can a Chrome MV3 content script type characters into Google Docs one-at-a-time, visibly, in 2026?

If yes, we lift the technique into `src/adapters/gdocs.ts` in the real extension and continue the plan. If no, we revisit `plan.md` and pick a different injection path.

## What it does

The spike is a minimal Chrome MV3 extension with four files:

- `manifest.json` — MV3 manifest, content script targets `https://docs.google.com/document/*`
- `content.js` — runs in the page, calls `document.execCommand('insertText', false, char)` per character
- `popup.html` — toolbar popup UI
- `popup.js` — sends a message to the content script when you click the button

There is no build step. It loads as-is.

## How to load it

1. Open Chrome and navigate to `chrome://extensions`
2. Toggle **Developer mode** on (top-right)
3. Click **Load unpacked**
4. Select the `spike/gdocs-injection/` folder
5. The extension appears in your toolbar as "GDocs Injection Spike". Pin it if you want.

## How to test it

1. Open a new Google Doc: https://docs.google.com/document/u/0/create
2. **Click into the document body** so the cursor is blinking inside the doc (critical — focus must be in the editor)
3. Click the Flying Fingers toolbar icon to open the popup
4. Leave the default text or customize it
5. Click **Type test string**
6. Switch your attention to the document — you should see characters appearing one at a time at the cursor

## What success looks like

- Characters appear in the document one at a time, left to right, visibly
- The popup status shows `typed: 83/83  failures: 0` (or whatever the length of your test string is)
- The doc content matches the test string exactly

## What failure looks like

- Nothing appears in the doc
- `failures > 0` in the popup status
- Text appears instantly (batch-inserted) instead of one char at a time
- Content is garbled or characters are missing

If it fails, click **Run diagnosis only** and share the JSON output — it tells me which DOM targets are available so I can try a fallback technique.

## Known caveats

- **Cursor must be focused in the document** before you click the button. If focus is in the popup or the toolbar, the injection happens into nothing.
- **`execCommand` is deprecated.** It still works (the spec preserves it for undo-buffer compatibility) but this is why we're spiking — to confirm GDocs still honors it today.
- **Cross-origin iframe contents may not be readable** from the content script. The diagnosis may show `iframeContentBodyEditable: null` — that's OK as long as the primary typing path works.
- This spike uses a **fixed 80ms delay** per character. The real engine will use a log-normal distribution.

## Next steps based on the result

- **If it works:** move to the next task in `plans/active/flying-fingers/tasks.md` → scaffold the real Vite project.
- **If it fails:** fall back to the alternatives listed in `context.md` under "Resolved During Execution" (InputEvent dispatch, iframe targeting, composition events). Update the plan if none work.
