import React from "react";
import { Composition } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import { z } from "zod";
import reelData from "../../data/reel.json";
import layoutData from "../../data/layout/layout.json";
import portraitConfigData from "../../data/portrait-config.json";
import { DeadlockShort } from "./Composition";
import "./fonts";
import { normalizeLayout } from "./layout/default-layout";
import type { LayoutConfig, RegionName } from "./layout/types";
import type { Props } from "./types";

import { TRANSITION_FRAMES } from "./constants";

const FPS = 30;

const defaultLayout = normalizeLayout(layoutData as LayoutConfig);
const studioDefaultLayout: LayoutConfig = {
  ...defaultLayout,
  ui: {
    ...defaultLayout.ui,
    showGuides: true,
  },
};

const regionSchema = (name: RegionName) => {
  const region = defaultLayout.regions[name];
  return z.object({
    name: z.literal(name).default(name),
    layer: z.literal(region.layer).default(region.layer),
    visible: z.boolean().default(region.visible),
    box: z.object({
      x: z.number().min(-300).max(1080).default(region.box.x),
      y: z.number().min(-400).max(1920).default(region.box.y),
      width: z.number().min(0).max(1400).default(region.box.width),
      height: z.number().min(0).max(2200).default(region.box.height),
    }),
  });
};

const layoutSchema = z.object({
  regions: z.object({
    BG_IMAGE: regionSchema("BG_IMAGE"),
    BG_GRADIENT: regionSchema("BG_GRADIENT"),
    BG_VIGNETTE: regionSchema("BG_VIGNETTE"),
    PROGRESS_BAR: regionSchema("PROGRESS_BAR"),
    POSTER_ROW: regionSchema("POSTER_ROW"),
    AUDIO_VISUALIZER: regionSchema("AUDIO_VISUALIZER"),
    SUBTITLE_BOX: regionSchema("SUBTITLE_BOX"),
    WATERMARK_ROW: regionSchema("WATERMARK_ROW"),
  }),
  ui: z.object({
    showGuides: z.boolean().default(defaultLayout.ui.showGuides),
    showLabels: z.boolean().default(defaultLayout.ui.showLabels),
    showLayer3: z.boolean().default(defaultLayout.ui.showLayer3),
    showLayer2: z.boolean().default(defaultLayout.ui.showLayer2),
    showLayer1: z.boolean().default(defaultLayout.ui.showLayer1),
  }),
  topo: z.object({
    enabled: z.boolean().default(defaultLayout.topo.enabled),
    showContours: z.boolean().default(defaultLayout.topo.showContours),
    opacityBack: z.number().min(0).max(1).default(defaultLayout.topo.opacityBack),
    opacityMid: z.number().min(0).max(1).default(defaultLayout.topo.opacityMid),
    opacityFront: z.number().min(0).max(1).default(defaultLayout.topo.opacityFront),
    contourSpacing: z.number().min(6).max(80).default(defaultLayout.topo.contourSpacing),
    contourStrokeOpacity: z
      .number()
      .min(0)
      .max(1)
      .default(defaultLayout.topo.contourStrokeOpacity),
  }),
});

const debugSchema = z.object({
  enableLayoutEditor: z.boolean().default(true),
  showLayoutJsonPanel: z.boolean().default(false),
});

const defaultDebug = {
  enableLayoutEditor: true,
  showLayoutJsonPanel: false,
};

const propsSchema = z
  .object({
    layout: layoutSchema.default(studioDefaultLayout),
    debug: debugSchema.default(defaultDebug),
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
      layout: normalizeLayout(props.layout ?? defaultLayout),
      debug: props.debug ?? defaultDebug,
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
        layout: studioDefaultLayout,
        debug: defaultDebug,
        portraitConfig: portraitConfigData,
      }}
      calculateMetadata={calculateMetadata}
      schema={propsSchema}
    />
  );
};
