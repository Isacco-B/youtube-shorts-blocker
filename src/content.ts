import { ExtensionMessage, StorageValue } from "./types/index";

class YouTubeShortsBlocker {
  private _isHideShorts: boolean = true;
  private _isHideShortsTab: boolean = true;
  private observer: MutationObserver | null = null;

  private readonly selectors = {
    desktop: "ytd-guide-entry-renderer",
    mobile: "ytd-mini-guide-entry-renderer",
    shorts: "ytd-rich-section-renderer",
    reel: "ytd-reel-shelf-renderer",
    video: "ytd-video-renderer",
    shelf: "ytd-shelf-renderer",
    grid: "ytd-grid-video-renderer",
    compact: "ytd-compact-video-renderer",
  };

  constructor() {
    this.initializeState();
    this.setupMessageListener();
  }

  private initializeState(): void {
    chrome.storage.sync.get<StorageValue>(["isHideShortsTab"], (result) => {
      this._isHideShortsTab = result.isHideShortsTab !== false;
    });
    chrome.storage.sync.get<StorageValue>(["isHideShorts"], (result) => {
      this._isHideShorts = result.isHideShorts !== false;
      if (this._isHideShorts) {
        this.initializeBlocker();
      }
    });
  }

  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((request: ExtensionMessage) => {
      if (request.action === "hideShorts") {
        this._isHideShorts = request.enabled;
        if (this._isHideShorts) {
          this.initializeBlocker();
        } else {
          window.location.reload();
        }
      }
    });
  }

  private removeShorts(): void {
    if (!this._isHideShorts) return;

    const removeElements = (
      selector: string,
      condition?: (element: Element) => boolean
    ): void => {
      document.querySelectorAll(selector).forEach((element) => {
        if (condition) {
          if (condition(element)) {
            element.remove();
          }
        } else {
          element.remove();
        }
      });
    };

    if (this._isHideShortsTab) {
      removeElements(
        this.selectors.desktop,
        (element) =>
          element.querySelector("a")?.title?.includes("Short") ?? false
      );

      removeElements(
        this.selectors.mobile,
        (element) =>
          element.querySelector("a")?.title?.includes("Short") ?? false
      );
    }

    removeElements(
      this.selectors.shorts,
      (element) => !!element.querySelector('a[href*="/shorts"]')
    );

    removeElements(this.selectors.reel);

    const combinedSelector = `
      ${this.selectors.video},
      ${this.selectors.shelf},
      ${this.selectors.grid},
      ${this.selectors.compact}
    `;

    removeElements(
      combinedSelector,
      (element) =>
        element.querySelector("a")?.href?.includes("/shorts/") ?? false
    );

    if (window.location.pathname.includes("/shorts/")) {
      window.location.replace(
        window.location.href.replace("/shorts/", "/watch?v=")
      );
    }
  }

  private throttle<T extends (...args: any[]) => void>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle = false;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  private initializeBlocker(): void {
    if (this.observer) {
      this.observer.disconnect();
    }

    const observerConfig: MutationObserverInit = {
      childList: true,
      subtree: true,
    };

    this.observer = new MutationObserver(
      this.throttle(() => this.removeShorts(), 100)
    );

    this.observer.observe(document.body, observerConfig);
    this.removeShorts();
  }
}

new YouTubeShortsBlocker();
