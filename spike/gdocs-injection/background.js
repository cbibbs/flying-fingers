// Service worker for the GDocs injection spike.
// Listens for the keyboard shortcut and forwards it to the content script
// in the active Google Docs tab.

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "type-now") return;

  console.log("[flying-fingers spike bg] command received:", command);

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab) {
      console.warn("[flying-fingers spike bg] no active tab");
      return;
    }

    if (!tab.url || !tab.url.includes("docs.google.com/document/")) {
      console.warn(
        "[flying-fingers spike bg] active tab is not a Google Doc:",
        tab.url
      );
      return;
    }

    // Pull the saved settings from storage.
    const { text, delayMs } = await chrome.storage.local.get([
      "text",
      "delayMs",
    ]);

    await chrome.tabs.sendMessage(tab.id, {
      action: "type",
      text: text || "Hello from flying fingers!",
      delayMs: typeof delayMs === "number" ? delayMs : 80,
    });
  } catch (e) {
    console.error("[flying-fingers spike bg] command handler failed:", e);
  }
});
