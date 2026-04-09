// Popup script for the GDocs injection spike.
// Sends a message to the content script in the active tab.

const statusEl = document.getElementById("status");
const textEl = document.getElementById("text");
const delayEl = document.getElementById("delay");
const typeBtn = document.getElementById("typeBtn");
const diagBtn = document.getElementById("diagBtn");

function setStatus(msg, isWarn = false) {
  statusEl.textContent = msg;
  statusEl.className = isWarn ? "warn" : "";
}

async function getActiveGDocsTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) {
    throw new Error("No active tab.");
  }
  if (!tab.url || !tab.url.includes("docs.google.com/document/")) {
    throw new Error("Active tab is not a Google Doc.");
  }
  return tab;
}

async function sendMessage(action, payload = {}) {
  const tab = await getActiveGDocsTab();
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tab.id, { action, ...payload }, (response) => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        reject(new Error(lastError.message || "sendMessage failed"));
        return;
      }
      resolve(response);
    });
  });
}

typeBtn.addEventListener("click", async () => {
  const text = textEl.value;
  const delayMs = Number(delayEl.value) || 80;

  if (!text) {
    setStatus("Enter some text to type.", true);
    return;
  }

  setStatus("Typing…");
  typeBtn.disabled = true;

  try {
    const response = await sendMessage("type", { text, delayMs });
    if (response?.ok) {
      const r = response.result;
      setStatus(
        `Done.\ntyped: ${r.typed}/${r.total}\nfailures: ${r.failures}`
      );
    } else {
      setStatus(`Error: ${response?.error ?? "unknown"}`, true);
    }
  } catch (e) {
    setStatus(`Error: ${e.message}`, true);
  } finally {
    typeBtn.disabled = false;
  }
});

diagBtn.addEventListener("click", async () => {
  setStatus("Running diagnosis…");
  try {
    const response = await sendMessage("diagnose");
    if (response?.ok) {
      setStatus(JSON.stringify(response.info, null, 2));
    } else {
      setStatus(`Error: ${response?.error ?? "unknown"}`, true);
    }
  } catch (e) {
    setStatus(`Error: ${e.message}`, true);
  }
});
