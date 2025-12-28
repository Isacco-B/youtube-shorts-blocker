let isEnabled = true;
let observer = null;
let rafId = null;

const hiddenElements = new WeakMap();

const selectors = {
  desktop: "ytd-guide-entry-renderer",
  mobile: "ytd-mini-guide-entry-renderer",
  shorts: "ytd-rich-section-renderer",
  reel: "ytd-reel-shelf-renderer",
  video: "ytd-video-renderer",
  shelf: "ytd-shelf-renderer",
  grid: "ytd-grid-video-renderer",
  compact: "ytd-compact-video-renderer",
  search: "grid-shelf-view-model",
};

function hideShorts() {
  if (!isEnabled) return;

  function hideIfShort(element, condition) {
    if (condition(element) && !hiddenElements.has(element)) {
      hiddenElements.set(element, element.style.display || "");
      element.style.display = "none";
    }
  }

  document
    .querySelectorAll(selectors.desktop)
    .forEach((el) =>
      hideIfShort(el, (e) => e.querySelector("a")?.title?.includes("Short"))
    );
  document
    .querySelectorAll(selectors.mobile)
    .forEach((el) =>
      hideIfShort(el, (e) => e.querySelector("a")?.title?.includes("Short"))
    );

  document
    .querySelectorAll(selectors.shorts)
    .forEach((el) =>
      hideIfShort(el, (e) => e.querySelector('a[href*="/shorts"]'))
    );
  document
    .querySelectorAll(selectors.search)
    .forEach((el) =>
      hideIfShort(el, (e) => e.querySelector('a[href*="/shorts"]'))
    );
  document
    .querySelectorAll(selectors.reel)
    .forEach((el) => hideIfShort(el, () => true));

  document
    .querySelectorAll(
      `${selectors.video}, ${selectors.shelf}, ${selectors.grid}, ${selectors.compact}`
    )
    .forEach((el) =>
      hideIfShort(el, (e) => e.querySelector("a")?.href?.includes("/shorts/"))
    );

  if (window.location.pathname.includes("/shorts/")) {
    window.location.replace(
      window.location.href.replace("/shorts/", "/watch?v=")
    );
  }
}

function showAllShorts() {
  hiddenElements.forEach((originalDisplay, el) => {
    el.style.display = originalDisplay;
    hiddenElements.delete(el);
  });
}

function initializeBlocker() {
  if (observer) observer.disconnect();

  observer = new MutationObserver((mutations) => {
    const hasRelevantNodes = mutations.some((m) =>
      Array.from(m.addedNodes).some(
        (node) =>
          node.nodeType === 1 &&
          node.matches &&
          Object.values(selectors).some((sel) => node.matches(sel))
      )
    );
    if (!hasRelevantNodes) return;

    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      hideShorts();
      rafId = null;
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
  hideShorts();
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
      hideShorts();
    } else {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      showAllShorts();
    }

    sendResponse({ success: true });
  }
  return true;
});
