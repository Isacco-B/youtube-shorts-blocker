chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.storage.sync.set({
      shortsBlocked: true,
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getState") {
    chrome.storage.sync.get("shortsBlocked", (result) => {
      sendResponse({ enabled: result.shortsBlocked !== false });
    });
    return true;
  }
});
