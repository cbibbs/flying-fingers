# GDocs Injection Spike

**Throwaway validation code.** Answers one question:

> Can a Chrome MV3 content script type characters into Google Docs one-at-a-time, visibly, in 2026?

## Version history

- **v0.0.1** — popup-button trigger. **Failed.** Clicking the popup steals focus from the document, so `execCommand` had no editable target by the time the content script ran.
- **v0.0.2** — keyboard-shortcut trigger. The popup is now a config screen only; actual typing fires from `Alt+Shift+Y`, which does not move focus away from the document. Also adds an `iframe.focus()` re-focus attempt as belt-and-braces, and an `InputEvent` fallback path if `execCommand` ever returns `false`.

## Files

- `manifest.json` — MV3 manifest with `commands`, `storage`, service worker
- `background.js` — service worker, listens for the keyboard shortcut, forwards to the content script
- `content.js` — runs on `docs.google.com/document/*`; does the typing via `execCommand`
- `popup.html` / `popup.js` — config UI; saves text + delay to `chrome.storage.local`

No build step. Load as-is.

## Load it

1. **Reload the extension if you had v0.0.1 installed:** go to `chrome://extensions`, find "GDocs Injection Spike", click the circular reload arrow. (If you never installed it, skip to step 3.)
2. If reload doesn't pick up the new files, click **Remove** and re-add.
3. Open `chrome://extensions`
4. Enable **Developer mode** (top-right)
5. Click **Load unpacked**
6. Select the `spike/gdocs-injection/` folder

## Test it

1. Open a new Google Doc: https://docs.google.com/document/u/0/create
2. Click the Flying Fingers toolbar icon to open the popup
3. Leave the default text or customize it
4. Click **Save settings** — you should see a green "Saved" confirmation
5. **Close the popup** (click anywhere outside it)
6. **Click into the Google Doc body** so the cursor is blinking in the doc
7. Press **Alt+Shift+Y**
8. Watch the document — characters should appear one at a time at the cursor

## Verifying the shortcut is registered

Go to `chrome://extensions/shortcuts` — you should see "GDocs Injection Spike" listed with the Alt+Shift+Y binding. If the shortcut conflicts with another extension or system binding, change it there.

## What success looks like

- Characters appear in the document one at a time, left to right, visibly
- Console in the GDocs tab (F12 → Console) shows `[flying-fingers spike] Done. typed=83 failures=0 paths= {execCommand: 83}`
- The doc content matches the test string exactly

## What failure looks like

- Nothing appears in the doc
- Console shows `typed=0 failures=83` or similar
- Text appears instantly (batch-inserted)
- Characters appear but garbled or out of order

## Debugging checklist if it fails

1. **Check the GDocs tab console** (F12 → Console) — look for `[flying-fingers spike]` messages
2. **Check the service worker console** — in `chrome://extensions`, find the extension, click "Service worker" to open its console. Look for `[flying-fingers spike bg]` messages
3. **Confirm the shortcut fired** — if the service worker console shows nothing when you press Alt+Shift+Y, the shortcut isn't registered. Check `chrome://extensions/shortcuts`
4. **Confirm the content script received the message** — if the GDocs console shows the diagnosis log but not "Typing N chars", the message from background isn't reaching content.js
5. **Share any `paths=` output** — it tells me which technique actually got the character in (`execCommand` primary or `InputEvent` fallback)
