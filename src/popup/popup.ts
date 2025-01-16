import { ExtensionMessage, StorageValue } from "../types/index";
import { logger } from "../utils/util";

interface DOMElements {
  toggleShorts: HTMLInputElement | null;
  toggleShortsTab: HTMLInputElement | null;
  errorMessage: HTMLElement | null;
}

class PopupController {
  private elements: DOMElements;

  constructor() {
    this.elements = {
      toggleShorts: document.getElementById("hideShorts") as HTMLInputElement,
      toggleShortsTab: document.getElementById(
        "hideShortsTab"
      ) as HTMLInputElement,
      errorMessage: document.getElementById("errorMessage") as HTMLElement,
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.loadStorageState();
    await this.checkCurrentTab();
    this.setupEventListeners();
  }

  private async loadStorageState(): Promise<void> {
    try {
      const { toggleShorts, toggleShortsTab } = this.elements;

      const [shortsResult, shortsTabResult] = await Promise.all([
        this.getStorageValue("isHideShorts"),
        this.getStorageValue("isHideShortsTab"),
      ]);

      if (toggleShorts) {
        toggleShorts.checked = shortsResult !== false;
      }

      if (toggleShortsTab) {
        toggleShortsTab.checked = shortsTabResult !== false;
      }
    } catch (_error) {
      logger("Error loading storage state!", "error");
    }
  }

  private getStorageValue(
    key: keyof StorageValue
  ): Promise<boolean | string[]> {
    return new Promise((resolve) => {
      chrome.storage.sync.get<StorageValue>([key], (result) => {
        resolve(result[key]);
      });
    });
  }

  private async checkCurrentTab(): Promise<void> {
    try {
      const tabs = await this.getCurrentTab();
      const currentTab = tabs[0];

      if (currentTab?.url && !currentTab.url.includes("youtube.com")) {
        this.disableControls();
      }
    } catch (_error) {
      logger("Error checking current tab!", "error");
    }
  }

  private getCurrentTab(): Promise<chrome.tabs.Tab[]> {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs);
      });
    });
  }

  private disableControls(): void {
    const { errorMessage, toggleShorts, toggleShortsTab } = this.elements;

    if (errorMessage) {
      errorMessage.style.display = "block";
    }
    if (toggleShorts) {
      toggleShorts.disabled = true;
    }

    if (toggleShortsTab) {
      toggleShortsTab.disabled = true;
    }
  }

  private async sendMessageToTab(message: ExtensionMessage): Promise<void> {
    try {
      const tabs = await this.getCurrentTab();
      const currentTab = tabs[0];

      if (currentTab?.id) {
        await chrome.tabs.sendMessage(currentTab.id, message);
      }
    } catch (error) {
      console.error("Error sending message to tab:", error);
    }
  }

  private setupEventListeners(): void {
    this.setupToggleShortsListener();
    this.setupToggleShortsTabListener();
  }

  private setupToggleShortsListener(): void {
    const { toggleShorts } = this.elements;

    toggleShorts?.addEventListener("change", async () => {
      if (!toggleShorts) return;

      const toggleStatus = toggleShorts.checked;

      try {
        await chrome.storage.sync.set({ hideShorts: toggleStatus });
        await this.sendMessageToTab({
          action: "hideShorts",
          enabled: toggleStatus,
        });
      } catch (_error) {
        logger("Error in toggleShorts listener!", "error");
      }
    });
  }

  private setupToggleShortsTabListener(): void {
    const { toggleShortsTab } = this.elements;

    toggleShortsTab?.addEventListener("change", async () => {
      if (!toggleShortsTab) return;

      const toggleStatus = toggleShortsTab.checked;

      try {
        await chrome.storage.sync.set({ hideShortsTab: toggleStatus });
        await this.sendMessageToTab({
          action: "hideShortsTab",
          enabled: toggleStatus,
        });
      } catch (_error) {
        logger("Error in toggleShortsTab listener!", "error");
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new PopupController();
});
