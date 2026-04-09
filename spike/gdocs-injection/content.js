// Flying Fingers — GDocs injection spike
// Goal: validate that character-by-character typing is visible in Google Docs.
// Technique: document.execCommand('insertText', false, char) per AutoQuill reference.
//
// This file is throwaway. Not part of the real extension.

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
 * Type a single character into whatever has focus.
 * Primary technique: document.execCommand('insertText').
 * Returns true if the call did not throw; false otherwise.
 * (execCommand returns a boolean too — we log it but don't rely on it,
 *  because GDocs has been observed to return false even when it worked.)
 */
function typeCharacter(char) {
  try {
    const result = document.execCommand("insertText", false, char);
    return { ok: true, execCommandReturned: result };
  } catch (e) {
    err("execCommand threw:", e);
    return { ok: false, error: String(e) };
  }
}

/**
 * Type a full string one character at a time, with a small delay
 * between characters so the user can see it happen.
 * Uses a fixed 80ms delay for the spike — the real engine will use
 * log-normal distribution later.
 */
async function typeString(text, interCharDelayMs = 80) {
  log(`Starting to type ${text.length} characters...`);
  let typed = 0;
  let failures = 0;

  for (const ch of text) {
    const r = typeCharacter(ch);
    if (r.ok) {
      typed += 1;
    } else {
      failures += 1;
    }
    // eslint-disable-next-line no-await-in-loop
    await sleep(interCharDelayMs);
  }

  log(`Done. typed=${typed} failures=${failures}`);
  return { typed, failures, total: text.length };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Try to locate the document's editable target. GDocs uses a hidden iframe
 * (`iframe.docs-texteventtarget-iframe`) for keyboard capture. We don't need
 * to target it directly for execCommand, but we log what we find for
 * diagnostic purposes — if the primary technique fails, this tells us what
 * the fallback paths would need to aim at.
 */
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
      info.iframeContentBodyEditable = iframe.contentDocument?.body?.isContentEditable ?? null;
      info.iframeContentActiveElement =
        iframe.contentDocument?.activeElement?.tagName ?? null;
    } catch (e) {
      warn("Could not read iframe.contentDocument (cross-origin?):", e);
    }
  }

  log("Diagnosis:", info);
  return info;
}

// Message bridge: the popup sends { action: 'type', text } and we attempt it.
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

    // Tell Chrome we'll respond asynchronously.
    return true;
  }

  if (message?.action === "diagnose") {
    sendResponse({ ok: true, info: diagnoseFocusTargets() });
    return false;
  }

  return false;
});

log("Content script loaded. Open the popup and click 'Type test string'.");
