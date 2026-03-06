import React from "react";
import { Composition } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import { z } from "zod";
import reelData from "../../data/reel.json";
import portraitConfigData from "../../data/portrait-config.json";
import portraitTuneData from "../../data/portrait-tune.json";
import { DeadlockShort } from "./Composition";
import "./fonts";
import {
  CONVERSATION_LEAD_IN_FRAMES,
  INTRO_PREROLL_FRAMES,
  TRANSITION_FRAMES,
} from "./constants";
import type { PortraitConfig, Props } from "./types";
import { toPortraitKey } from "./constants";

const FPS = 30;

const portraitSettingsSchema = z.object({
  x: z.number(),
  y: z.number(),
  scale: z.number(),
  rotation: z.number(),
});

const propsSchema = z
  .object({
    portraitConfig: z.record(z.string(), portraitSettingsSchema).optional(),
  })
  .passthrough();

const mergedPortraitConfig = (() => {
  const base: PortraitConfig = { ...(portraitConfigData as PortraitConfig) };
  const tune = portraitTuneData as Record<string, unknown>;
  const isEnabled = tune.enabled !== false;
  const rawCharKey = typeof tune.charKey === "string" ? tune.charKey.trim() : "";
  if (!isEnabled || !rawCharKey) {
    return base;
  }

  const x = typeof tune.x === "number" && Number.isFinite(tune.x) ? tune.x : 215;
  const y = typeof tune.y === "number" && Number.isFinite(tune.y) ? tune.y : 340;
  const scale = typeof tune.scale === "number" && Number.isFinite(tune.scale) ? tune.scale : 1.92;
  const rotation =
    typeof tune.rotation === "number" && Number.isFinite(tune.rotation) ? tune.rotation : 0;

  base[toPortraitKey(rawCharKey)] = { x, y, scale, rotation };
  return base;
})();

const calculateMetadata: CalculateMetadataFunction<Props> = async ({ props }) => {
  const sourceConversations =
    props.conversations.length > 0
      ? props.conversations
      : (reelData as Props).conversations;

  const conversations = sourceConversations.map((conv) => ({
    ...conv,
    lines: conv.lines.map((line) => ({
      ...line,
      durationInFrames: Math.ceil(line.duration * FPS),
    })),
  }));

  const lineFrames = conversations.reduce(
    (sum, conv) =>
      sum + conv.lines.reduce((s, l) => s + (l.durationInFrames ?? 0), 0),
    0
  );
  const transitionFrames = (conversations.length - 1) * TRANSITION_FRAMES;
  const conversationLeadInFrames =
    Math.max(0, conversations.length - 1) * CONVERSATION_LEAD_IN_FRAMES;

  return {
    // Add a short hold before the first line starts speaking.
    durationInFrames:
      INTRO_PREROLL_FRAMES +
      lineFrames +
      transitionFrames +
      conversationLeadInFrames,
    props: {
      ...props,
      conversations,
    },
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="DeadlockShort"
      component={DeadlockShort}
      durationInFrames={300}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{
        conversations: [],
        portraitConfig: mergedPortraitConfig,
      }}
      calculateMetadata={calculateMetadata}
      schema={propsSchema}
    />
  );
};
