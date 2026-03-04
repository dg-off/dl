import type { DebugConfig, LayoutConfig } from "./layout/types";

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
};
