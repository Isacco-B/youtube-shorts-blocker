document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("toggleShorts");
  const container = document.querySelector(".container");

  chrome.storage.sync.get(["shortsBlocked"], (result) => {
    toggle.checked = result.shortsBlocked !== false;
  });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    if (!currentTab.url?.includes("youtube.com")) {
      container.classList.add("disabled");
      toggle.disabled = true;
    }
  });

  toggle.addEventListener("change", () => {
    const isEnabled = toggle.checked;

    chrome.storage.sync.set({
      shortsBlocked: isEnabled,
    });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        {
          action: "toggleShortsBlocking",
          enabled: isEnabled,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            chrome.tabs.reload(tabs[0].id);
          }
        }
      );
    });
  });
});
