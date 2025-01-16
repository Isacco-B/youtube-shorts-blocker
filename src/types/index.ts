export interface StorageValue {
  isHideShorts: boolean;
  isHideShortsTab: boolean;
  filterTags: string[];
}

export interface ExtensionMessage {
  action: "hideShorts" | "hideShortsTab";
  enabled: boolean;
}
