import type { PortraitCharConfig, PortraitConfig, PortraitSettings } from "../types";
import { DEFAULT_PORTRAIT_CHAR_CONFIG, DEFAULT_PORTRAIT_SETTINGS } from "../types";
import {
  createSyncMessage,
  isSyncMessage,
  loadJsonFromStorage,
  saveJsonToStorage,
} from "../tuning/live-transform-sync";

export const PORTRAIT_STORAGE_KEY = "deadlock.portraits.v2";
export const PORTRAIT_CHANNEL_NAME = "deadlock-portrait-channel";

export type PortraitSyncMessage =
  | {
      type: "portrait:update";
      charKey: string;
      charConfig: PortraitCharConfig;
      ts: number;
    }
  | {
      type: "portrait:set-all";
      config: PortraitConfig;
      ts: number;
    }
  | {
      type: "portrait:request-current";
      ts: number;
    }
  | {
      type: "portrait:current";
      config: PortraitConfig;
      ts: number;
    }
  | {
      type: "portrait:preview-character";
      charKey: string | null;
      ts: number;
    }
  | {
      type: "portrait:preview-bg-visibility";
      leftVisible: boolean;
      rightVisible: boolean;
      ts: number;
    }
  | {
      type: "portrait:preview-portrait-visibility";
      leftVisible: boolean;
      rightVisible: boolean;
      ts: number;
    };

export const isPortraitSyncMessage = (value: unknown): value is PortraitSyncMessage => {
  if (
    !isSyncMessage(value, [
      "portrait:update",
      "portrait:set-all",
      "portrait:request-current",
      "portrait:current",
      "portrait:preview-character",
      "portrait:preview-bg-visibility",
      "portrait:preview-portrait-visibility",
    ])
  ) {
    return false;
  }

  if (value.type === "portrait:request-current") return true;
  if (value.type === "portrait:update")
    return typeof value.charKey === "string" && typeof value.charConfig === "object" && value.charConfig !== null;
  if (value.type === "portrait:set-all" || value.type === "portrait:current")
    return typeof value.config === "object" && value.config !== null;
  if (value.type === "portrait:preview-character")
    return value.charKey === null || typeof value.charKey === "string";
  if (value.type === "portrait:preview-bg-visibility" || value.type === "portrait:preview-portrait-visibility")
    return typeof value.leftVisible === "boolean" && typeof value.rightVisible === "boolean";
  return false;
};

export const loadPortraitsFromStorage = (fallback: PortraitConfig): PortraitConfig => {
  const parsed = loadJsonFromStorage<PortraitConfig>(PORTRAIT_STORAGE_KEY, fallback);
  return { ...fallback, ...parsed };
};

export const savePortraitsToStorage = (config: PortraitConfig): void => {
  saveJsonToStorage(PORTRAIT_STORAGE_KEY, config);
};

export const createPortraitUpdateMessage = (
  charKey: string,
  charConfig: PortraitCharConfig
): PortraitSyncMessage => ({
  ...createSyncMessage("portrait:update", {
  charKey,
  charConfig,
  }),
});

export const createPortraitSetAllMessage = (config: PortraitConfig): PortraitSyncMessage => ({
  ...createSyncMessage("portrait:set-all", {
  config,
  }),
});

export const createPortraitRequestCurrentMessage = (): PortraitSyncMessage => ({
  ...createSyncMessage("portrait:request-current", {}),
});

export const createPortraitCurrentMessage = (config: PortraitConfig): PortraitSyncMessage => ({
  ...createSyncMessage("portrait:current", {
  config,
  }),
});

export const createPortraitPreviewCharacterMessage = (
  charKey: string | null
): PortraitSyncMessage => ({
  ...createSyncMessage("portrait:preview-character", {
  charKey,
  }),
});

export const createPortraitPreviewBgVisibilityMessage = (
  leftVisible: boolean,
  rightVisible: boolean
): PortraitSyncMessage => ({
  ...createSyncMessage("portrait:preview-bg-visibility", {
  leftVisible,
  rightVisible,
  }),
});

export const createPortraitPreviewPortraitVisibilityMessage = (
  leftVisible: boolean,
  rightVisible: boolean
): PortraitSyncMessage => ({
  ...createSyncMessage("portrait:preview-portrait-visibility", {
  leftVisible,
  rightVisible,
  }),
});

/** Merge a single character update into an existing config */
export const mergePortraitUpdate = (
  config: PortraitConfig,
  charKey: string,
  charConfig: PortraitCharConfig
): PortraitConfig => ({ ...config, [charKey]: charConfig });

/** Normalize a settings object, filling in missing fields */
const normalizeSettings = (s: Partial<PortraitSettings>): PortraitSettings => ({
  objectPositionX: s.objectPositionX ?? DEFAULT_PORTRAIT_SETTINGS.objectPositionX,
  objectPositionY: s.objectPositionY ?? DEFAULT_PORTRAIT_SETTINGS.objectPositionY,
  scale: s.scale ?? DEFAULT_PORTRAIT_SETTINGS.scale,
  rotation: s.rotation ?? DEFAULT_PORTRAIT_SETTINGS.rotation,
});

/** Ensure every character key has a valid PortraitCharConfig, falling back to defaults */
export const normalizePortraitConfig = (config: PortraitConfig): PortraitConfig => {
  const result: PortraitConfig = {};
  for (const key of Object.keys(config)) {
    const entry = config[key];
    result[key] = {
      left: normalizeSettings((entry as PortraitCharConfig).left ?? DEFAULT_PORTRAIT_CHAR_CONFIG.left),
      right: normalizeSettings((entry as PortraitCharConfig).right ?? DEFAULT_PORTRAIT_CHAR_CONFIG.right),
    };
  }
  return result;
};
