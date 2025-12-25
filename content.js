let isEnabled = true;
let observer = null;
let rafId = null;

function removeShorts() {
  if (!isEnabled) return;

  const selectors = {
    desktop: "ytd-guide-entry-renderer",
    mobile: "ytd-mini-guide-entry-renderer",
    shorts: "ytd-rich-section-renderer",
    reel: "ytd-reel-shelf-renderer",
    video: "ytd-video-renderer",
    shelf: "ytd-shelf-renderer",
    grid: "ytd-grid-video-renderer",
    compact: "ytd-compact-video-renderer",
  };

  document.querySelectorAll(selectors.desktop).forEach((element) => {
    if (element.querySelector("a")?.title?.includes("Short")) {
      element.remove();
    }
  });

  document.querySelectorAll(selectors.mobile).forEach((element) => {
    if (element.querySelector("a")?.title?.includes("Short")) {
      element.remove();
    }
  });

  document.querySelectorAll(selectors.shorts).forEach((element) => {
    if (element.querySelector('a[href*="/shorts"]')) {
      element.remove();
    }
  });

  document.querySelectorAll(selectors.reel).forEach((element) => {
    element.remove();
  });

  document
    .querySelectorAll(
      `${selectors.video}, ${selectors.shelf}, ${selectors.grid}, ${selectors.compact}`
    )
    .forEach((element) => {
      const href = element.querySelector("a")?.href;
      if (href?.includes("/shorts/")) {
        element.remove();
      }
    });

  if (
    window.location.pathname.includes("/shorts/") &&
    !sessionStorage.getItem("shorts-redirected")
  ) {
    sessionStorage.setItem("shorts-redirected", "true");
    window.location.replace(
      window.location.href.replace("/shorts/", "/watch?v=")
    );
  }
}

function initializeBlocker() {
  if (observer) observer.disconnect();

  observer = new MutationObserver(() => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      removeShorts();
      rafId = null;
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
  removeShorts();
}

chrome.storage.sync.get(["shortsBlocked"], function (result) {
  isEnabled = result.shortsBlocked !== false;
  if (isEnabled) {
    initializeBlocker();
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "toggleShortsBlocking") {
    isEnabled = request.enabled;

    if (isEnabled) {
      initializeBlocker();
      removeShorts();
    } else {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    }

    sendResponse({ success: true });
  }
  return true;
});
