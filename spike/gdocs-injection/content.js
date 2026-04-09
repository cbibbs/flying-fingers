// Flying Fingers — GDocs injection spike
// Goal: validate that character-by-character typing is visible in Google Docs.
// Primary technique: document.execCommand('insertText', false, char)
// Triggered by: chrome.commands keyboard shortcut (Alt+Shift+Y by default).
// Popup-click trigger was tried in v0.0.1 and failed because popups steal focus
// from the document. Do not revert.
//
// This file is throwaway.

const LOG_PREFIX = "[flying-fingers spike]";

function log(...args) {
  console.log(LOG_PREFIX, ...args);
}

function warn(...args) {
  console.warn(LOG_PREFIX, ...args);
}

function err(...args) {
  console.error(LOG_PREFIX, ...args);
}

/**
 * Defense-in-depth: attempt to restore focus to the Google Docs editor
 * before typing. GDocs captures keystrokes through a hidden iframe with
 * class `docs-texteventtarget-iframe`. Calling .focus() on it puts focus
 * back where execCommand expects it.
 *
 * Returns true if we found and focused the iframe; false otherwise.
 */
function tryRefocusEditor() {
  const iframe = document.querySelector("iframe.docs-texteventtarget-iframe");
  if (!iframe) {
    warn("no docs-texteventtarget-iframe found");
    return false;
  }
  try {
    iframe.focus();
    // Also try focusing the active element inside the iframe if we can reach it.
    const innerActive = iframe.contentDocument?.activeElement;
    if (innerActive && typeof innerActive.focus === "function") {
      innerActive.focus();
    }
    return true;
  } catch (e) {
    warn("iframe focus threw:", e);
    return false;
  }
}

/**
 * Type a single character into whatever has focus.
 * Primary: document.execCommand('insertText').
 * Secondary (only if primary returns false): try dispatching an InputEvent
 * with inputType 'insertText' to the active element.
 */
function typeCharacter(char) {
  // Primary
  try {
    const result = document.execCommand("insertText", false, char);
    if (result) {
      return { ok: true, path: "execCommand" };
    }
    warn(`execCommand returned false for char ${JSON.stringify(char)}, trying fallback`);
  } catch (e) {
    err("execCommand threw:", e);
  }

  // Fallback: dispatch InputEvent on the active element
  try {
    const target = document.activeElement;
    if (!target) {
      return { ok: false, error: "no active element for fallback" };
    }
    const inputEvent = new InputEvent("beforeinput", {
      inputType: "insertText",
      data: char,
      bubbles: true,
      cancelable: true,
    });
    target.dispatchEvent(inputEvent);
    const inputEvent2 = new InputEvent("input", {
      inputType: "insertText",
      data: char,
      bubbles: true,
      cancelable: false,
    });
    target.dispatchEvent(inputEvent2);
    return { ok: true, path: "InputEvent" };
  } catch (e) {
    err("InputEvent fallback threw:", e);
    return { ok: false, error: String(e) };
  }
}

async function typeString(text, interCharDelayMs = 80) {
  log(`Typing ${text.length} chars, delay=${interCharDelayMs}ms`);

  // Always try to re-focus the editor first. Does nothing harmful if focus
  // is already correct.
  const refocused = tryRefocusEditor();
  log(`refocus attempt: ${refocused ? "ok" : "skipped"}`);

  let typed = 0;
  let failures = 0;
  const pathCounts = {};

  for (const ch of text) {
    const r = typeCharacter(ch);
    if (r.ok) {
      typed += 1;
      pathCounts[r.path] = (pathCounts[r.path] || 0) + 1;
    } else {
      failures += 1;
    }
    // eslint-disable-next-line no-await-in-loop
    await sleep(interCharDelayMs);
  }

  log(`Done. typed=${typed} failures=${failures} paths=`, pathCounts);
  return { typed, failures, total: text.length, pathCounts };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function diagnoseFocusTargets() {
  const iframe = document.querySelector("iframe.docs-texteventtarget-iframe");
  const info = {
    url: location.href,
    activeElementTag: document.activeElement?.tagName,
    activeElementClass: document.activeElement?.className,
    hasEventTargetIframe: Boolean(iframe),
    iframeContentBodyEditable: null,
    iframeContentActiveElement: null,
  };

  if (iframe) {
    try {
      info.iframeContentBodyEditable =
        iframe.contentDocument?.body?.isContentEditable ?? null;
      info.iframeContentActiveElement =
        iframe.contentDocument?.activeElement?.tagName ?? null;
    } catch (e) {
      warn("Could not read iframe.contentDocument:", e);
    }
  }

  log("Diagnosis:", info);
  return info;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.action === "type") {
    const text = message.text ?? "Hello from flying fingers!";
    const delay = message.delayMs ?? 80;

    diagnoseFocusTargets();

    typeString(text, delay)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((e) => {
        err("typeString failed:", e);
        sendResponse({ ok: false, error: String(e) });
      });
    return true; // async
  }

  if (message?.action === "diagnose") {
    sendResponse({ ok: true, info: diagnoseFocusTargets() });
    return false;
  }

  return false;
});

log("Content script v0.0.2 loaded. Trigger with Alt+Shift+Y while focused in the doc.");
