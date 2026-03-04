import type { DebugConfig, LayoutConfig } from "./layout/types";

export type PortraitSettings = {
  objectPositionX: number; // 0–100 (%)
  objectPositionY: number; // 0–100 (%)
  scale: number;           // zoom, e.g. 1.92
  rotation: number;        // degrees, pivot = center of image
};

export type PortraitCharConfig = {
  left: PortraitSettings;
  right: PortraitSettings;
};

export type PortraitConfig = Record<string, PortraitCharConfig>;

export const DEFAULT_PORTRAIT_SETTINGS: PortraitSettings = {
  objectPositionX: 50,
  objectPositionY: 14,
  scale: 1.92,
  rotation: 0,
};

export const DEFAULT_PORTRAIT_CHAR_CONFIG: PortraitCharConfig = {
  left: DEFAULT_PORTRAIT_SETTINGS,
  right: DEFAULT_PORTRAIT_SETTINGS,
};

/** Returns slot-specific settings. slotIndex: 0 = left, 1 = right */
export function getSlotSettings(
  config: PortraitConfig,
  charKey: string,
  slotIndex: number
): PortraitSettings {
  const entry = config[charKey] ?? DEFAULT_PORTRAIT_CHAR_CONFIG;
  return slotIndex === 0 ? entry.left : entry.right;
}

export type DialogueLine = {
  order: number;
  character: string;
  audioFile: string;
  audioUrl: string;
  text: string;
  /** Duration in seconds — set by the Python pipeline */
  duration: number;
  /** Duration in frames — set by calculateMetadata */
  durationInFrames?: number;
};

export type Conversation = {
  conversationId: string;
  lines: DialogueLine[];
};

export type Props = {
  conversations: Conversation[];
  layout?: LayoutConfig;
  debug?: DebugConfig;
  portraitConfig?: PortraitConfig;
};
