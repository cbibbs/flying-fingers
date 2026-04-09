// Flying Fingers — GDocs injection spike v0.0.3
// Goal: validate that character-by-character typing is visible in Google Docs.
//
// v0.0.3 pivot: the previous versions operated on the top-level `document`,
// but Google Docs' focused editable lives inside the hidden iframe
// `iframe.docs-texteventtarget-iframe`. At the top level, document.activeElement
// returns the IFRAME element itself (the boundary), not the element inside it.
// execCommand only operates on the document it's called on, so
// top-level document.execCommand() has nothing to insert into.
//
// Fix: target iframe.contentDocument and iframe.contentDocument.activeElement.
// Try multiple techniques and log which one (if any) produces visible text.
//
// Throwaway code.

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

/** Locate the GDocs keystroke-capture iframe. */
function getEventTargetIframe() {
  return document.querySelector("iframe.docs-texteventtarget-iframe");
}

/** Get the editable element inside the iframe, if we can reach it. */
function getInnerTarget(iframe) {
  if (!iframe?.contentDocument) return null;
  const doc = iframe.contentDocument;
  // Active element first (what the user has focused)
  if (doc.activeElement && doc.activeElement !== doc.body) {
    return doc.activeElement;
  }
  // Fall back to any contenteditable
  const editable = doc.querySelector('[contenteditable="true"], [contenteditable="plaintext-only"], [role="textbox"]');
  if (editable) return editable;
  // Last resort: the body
  return doc.body;
}

function tryRefocusEditor() {
  const iframe = getEventTargetIframe();
  if (!iframe) {
    warn("no docs-texteventtarget-iframe found");
    return false;
  }
  try {
    iframe.focus();
    const inner = getInnerTarget(iframe);
    if (inner && typeof inner.focus === "function") {
      inner.focus();
    }
    return true;
  } catch (e) {
    warn("refocus threw:", e);
    return false;
  }
}

/**
 * Attempt to inject a single character using multiple techniques.
 * Returns { ok, path } where path is the name of the technique that worked,
 * or { ok: false, error } if all failed.
 *
 * Techniques, in order:
 *   A. iframe.contentDocument.execCommand('insertText', false, char)
 *   B. Dispatch beforeinput + input events to inner target with inputType='insertText'
 *   C. Dispatch textInput event to inner target (old webkit-style)
 *   D. Dispatch KeyboardEvent (keydown/keypress/keyup) to inner target
 */
function typeCharacter(char) {
  const iframe = getEventTargetIframe();
  if (!iframe) {
    return { ok: false, error: "no iframe" };
  }

  const innerDoc = iframe.contentDocument;
  if (!innerDoc) {
    return { ok: false, error: "no iframe.contentDocument (cross-origin?)" };
  }

  const target = getInnerTarget(iframe);
  if (!target) {
    return { ok: false, error: "no inner target" };
  }

  // Path A: execCommand on the iframe's document
  try {
    const result = innerDoc.execCommand("insertText", false, char);
    if (result) {
      return { ok: true, path: "A:innerExecCommand" };
    }
  } catch (e) {
    warn("A threw:", e);
  }

  // Path B: InputEvent dispatch to inner target
  try {
    const before = new InputEvent("beforeinput", {
      inputType: "insertText",
      data: char,
      bubbles: true,
      cancelable: true,
      composed: true,
    });
    const beforeResult = target.dispatchEvent(before);

    const input = new InputEvent("input", {
      inputType: "insertText",
      data: char,
      bubbles: true,
      cancelable: false,
      composed: true,
    });
    target.dispatchEvent(input);

    // If beforeinput wasn't cancelled, GDocs may have processed it.
    // We can't verify from here, but we report the path attempted.
    if (beforeResult) {
      return { ok: true, path: "B:innerInputEvent" };
    }
  } catch (e) {
    warn("B threw:", e);
  }

  // Path C: textInput event (legacy)
  try {
    const textEv = new Event("textInput", { bubbles: true, cancelable: true });
    textEv.data = char;
    target.dispatchEvent(textEv);
    return { ok: true, path: "C:textInput" };
  } catch (e) {
    warn("C threw:", e);
  }

  // Path D: KeyboardEvent triplet
  try {
    const opts = { bubbles: true, cancelable: true, key: char, composed: true };
    target.dispatchEvent(new KeyboardEvent("keydown", opts));
    target.dispatchEvent(new KeyboardEvent("keypress", opts));
    target.dispatchEvent(new KeyboardEvent("keyup", opts));
    return { ok: true, path: "D:keyboardEvent" };
  } catch (e) {
    err("D threw:", e);
  }

  return { ok: false, error: "all paths failed" };
}

async function typeString(text, interCharDelayMs = 80) {
  log(`Typing ${text.length} chars, delay=${interCharDelayMs}ms`);

  const refocused = tryRefocusEditor();
  log(`refocus attempt: ${refocused ? "ok" : "skipped"}`);

  // One-time diagnostic on the first character so we know what we're working with
  const iframe = getEventTargetIframe();
  const innerDoc = iframe?.contentDocument;
  const target = getInnerTarget(iframe);
  log("inner doc/target diagnostic:", {
    hasIframe: Boolean(iframe),
    hasInnerDoc: Boolean(innerDoc),
    innerDocURL: innerDoc?.URL,
    targetTag: target?.tagName,
    targetClass: target?.className,
    targetContentEditable: target?.contentEditable,
    targetIsActive: innerDoc?.activeElement === target,
  });

  let typed = 0;
  let failures = 0;
  const pathCounts = {};
  const firstFailure = { error: null };

  for (const ch of text) {
    const r = typeCharacter(ch);
    if (r.ok) {
      typed += 1;
      pathCounts[r.path] = (pathCounts[r.path] || 0) + 1;
    } else {
      failures += 1;
      if (!firstFailure.error) firstFailure.error = r.error;
    }
    // eslint-disable-next-line no-await-in-loop
    await sleep(interCharDelayMs);
  }

  log(`Done. typed=${typed} failures=${failures} paths=`, pathCounts);
  if (failures > 0) log("first failure reason:", firstFailure.error);
  return { typed, failures, total: text.length, pathCounts, firstFailure };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function diagnoseFocusTargets() {
  const iframe = getEventTargetIframe();
  const info = {
    url: location.href,
    topActiveElementTag: document.activeElement?.tagName,
    topActiveElementClass: document.activeElement?.className,
    hasEventTargetIframe: Boolean(iframe),
    innerDocAccessible: false,
    innerActiveElementTag: null,
    innerActiveElementClass: null,
    innerActiveElementContentEditable: null,
    innerActiveElementRole: null,
  };

  if (iframe?.contentDocument) {
    info.innerDocAccessible = true;
    const inner = iframe.contentDocument.activeElement;
    info.innerActiveElementTag = inner?.tagName ?? null;
    info.innerActiveElementClass = inner?.className ?? null;
    info.innerActiveElementContentEditable = inner?.contentEditable ?? null;
    info.innerActiveElementRole = inner?.getAttribute?.("role") ?? null;
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

log("Content script v0.0.3 loaded. Trigger with Option+Y (Alt+Shift+Y on Win) while focused in the doc.");
