// Popup script for the GDocs injection spike (v0.0.2).
// The popup now persists config to chrome.storage.local. The actual typing
// is triggered by the Alt+Shift+Y keyboard shortcut, not a button in the popup,
// so the document never loses focus.

const statusEl = document.getElementById("status");
const textEl = document.getElementById("text");
const delayEl = document.getElementById("delay");
const saveBtn = document.getElementById("saveBtn");
const diagBtn = document.getElementById("diagBtn");

function setStatus(msg, variant = "") {
  statusEl.textContent = msg;
  statusEl.className = variant;
}

// Load saved settings on popup open.
(async function loadSettings() {
  try {
    const { text, delayMs } = await chrome.storage.local.get([
      "text",
      "delayMs",
    ]);
    if (typeof text === "string") textEl.value = text;
    if (typeof delayMs === "number") delayEl.value = String(delayMs);
  } catch (e) {
    setStatus(`Failed to load settings: ${e.message}`, "warn");
  }
})();

saveBtn.addEventListener("click", async () => {
  const text = textEl.value;
  const delayMs = Number(delayEl.value) || 80;

  if (!text) {
    setStatus("Enter some text first.", "warn");
    return;
  }

  try {
    await chrome.storage.local.set({ text, delayMs });
    setStatus(
      `Saved. Focus the doc and press Alt+Shift+Y to type ${text.length} chars.`,
      "ok"
    );
  } catch (e) {
    setStatus(`Save failed: ${e.message}`, "warn");
  }
});

diagBtn.addEventListener("click", async () => {
  setStatus("Running diagnosis…");
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.url?.includes("docs.google.com/document/")) {
      setStatus("Active tab is not a Google Doc.", "warn");
      return;
    }

    chrome.tabs.sendMessage(tab.id, { action: "diagnose" }, (response) => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        setStatus(`Error: ${lastError.message}`, "warn");
        return;
      }
      if (response?.ok) {
        setStatus(JSON.stringify(response.info, null, 2));
      } else {
        setStatus(`Error: ${response?.error ?? "unknown"}`, "warn");
      }
    });
  } catch (e) {
    setStatus(`Error: ${e.message}`, "warn");
  }
});
