document.getElementById("toggle").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return setStatus("No active tab found.");

  // Skip restricted pages
  if (
    tab.url.startsWith("chrome://") ||
    tab.url.startsWith("edge://") ||
    tab.url.startsWith("about:") ||
    tab.url.startsWith("https://chrome.google.com")
  ) {
    return setStatus("This page is restricted. Try a normal website.");
  }

  // Try messaging
  chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_OVERLAY" }, async () => {
    if (chrome.runtime.lastError) {
      // Inject if missing
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content/content.js"],
      });

      // Wait until content.js confirms ready
      chrome.runtime.onMessage.addListener(function listener(msg) {
        if (msg.type === "CONTENT_READY") {
          chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_OVERLAY" });
          setStatus("Toggled overlay.");
          chrome.runtime.onMessage.removeListener(listener);
        }
      });
    } else {
      setStatus("Toggled overlay.");
    }
  });
});

function setStatus(text) {
  const el = document.getElementById("status");
  el.textContent = text;
  setTimeout(() => (el.textContent = ""), 3000);
}
