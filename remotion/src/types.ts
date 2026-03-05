export type PortraitSettings = {
  x: number;        // image center X in pixels, from card top-left
  y: number;        // image center Y in pixels, from card top-left
  scale: number;    // scale multiplier around the center anchor
  rotation: number; // degrees, pivot = center of image
};

export type PortraitConfig = Record<string, PortraitSettings>;

export const DEFAULT_PORTRAIT_SETTINGS: PortraitSettings = {
  x: 215,
  y: 340,
  scale: 1.92,
  rotation: 0,
};

export function getSlotSettings(config: PortraitConfig, charKey: string): PortraitSettings {
  return config[charKey] ?? DEFAULT_PORTRAIT_SETTINGS;
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
  portraitConfig?: PortraitConfig;
};
