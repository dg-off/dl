import React from "react";
import { Composition } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import { z } from "zod";
import reelData from "../../data/reel.json";
import portraitConfigData from "../../data/portrait-config.json";
import { DeadlockShort } from "./Composition";
import "./fonts";
import { TRANSITION_FRAMES } from "./constants";
import type { Props } from "./types";

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

  return {
    durationInFrames: lineFrames + transitionFrames,
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
        portraitConfig: portraitConfigData,
      }}
      calculateMetadata={calculateMetadata}
      schema={propsSchema}
    />
  );
};
