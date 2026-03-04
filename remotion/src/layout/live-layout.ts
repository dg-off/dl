import { normalizeLayout } from "./default-layout";
import type { LayoutConfig } from "./types";

export const LAYOUT_STORAGE_KEY = "deadlock.layout.v1";
export const LAYOUT_CHANNEL_NAME = "deadlock-layout-channel";
export const LAYOUT_SYNC_SOURCE_DASHBOARD = "dashboard";
export const LAYOUT_SYNC_SOURCE_STUDIO = "studio";

export type LayoutSyncSource =
  | typeof LAYOUT_SYNC_SOURCE_DASHBOARD
  | typeof LAYOUT_SYNC_SOURCE_STUDIO;

export type LayoutSyncMessage =
  | {
      type: "layout:update";
      layout: LayoutConfig;
      source: LayoutSyncSource;
      ts: number;
    }
  | {
      type: "layout:request-current";
      source: LayoutSyncSource;
      ts: number;
    }
  | {
      type: "layout:current";
      layout: LayoutConfig;
      source: LayoutSyncSource;
      ts: number;
    };

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isSyncSource = (value: unknown): value is LayoutSyncSource => {
  return value === LAYOUT_SYNC_SOURCE_DASHBOARD || value === LAYOUT_SYNC_SOURCE_STUDIO;
};

export const isLayoutSyncMessage = (value: unknown): value is LayoutSyncMessage => {
  if (!isObject(value)) {
    return false;
  }

  const type = value.type;
  const source = value.source;
  const ts = value.ts;
  if (typeof type !== "string" || !isSyncSource(source) || typeof ts !== "number") {
    return false;
  }

  if (type === "layout:request-current") {
    return true;
  }

  if ((type === "layout:update" || type === "layout:current") && isObject(value.layout)) {
    return true;
  }

  return false;
};

export const parseStoredLayout = (raw: string | null, fallback: LayoutConfig): LayoutConfig => {
  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw) as LayoutConfig;
    return normalizeLayout(parsed);
  } catch {
    return fallback;
  }
};

export const loadLayoutFromStorage = (fallback: LayoutConfig): LayoutConfig => {
  if (typeof window === "undefined") {
    return fallback;
  }
  return parseStoredLayout(window.localStorage.getItem(LAYOUT_STORAGE_KEY), fallback);
};

export const saveLayoutToStorage = (layout: LayoutConfig): void => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // No-op: local storage may be blocked in hardened environments.
  }
};

export const createLayoutUpdateMessage = (
  source: LayoutSyncSource,
  layout: LayoutConfig
): LayoutSyncMessage => ({
  type: "layout:update",
  source,
  layout,
  ts: Date.now(),
});

export const createLayoutRequestCurrentMessage = (source: LayoutSyncSource): LayoutSyncMessage => ({
  type: "layout:request-current",
  source,
  ts: Date.now(),
});

export const createLayoutCurrentMessage = (
  source: LayoutSyncSource,
  layout: LayoutConfig
): LayoutSyncMessage => ({
  type: "layout:current",
  source,
  layout,
  ts: Date.now(),
});
