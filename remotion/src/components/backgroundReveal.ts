import { interpolate, spring } from "remotion";

export type SlideFrom = "left" | "right";

type RevealLayerStyle = {
  translateX: number;
  blurPx: number;
  opacity: number;
  scaleX: number;
};

export type BackgroundRevealState = {
  base: RevealLayerStyle;
  traces: RevealLayerStyle[];
};

type RevealParams = {
  frame: number;
  fps: number;
  activationFrame: number | null;
  slideFrom: SlideFrom;
};

// Tuning values: fast entry, low overshoot, and short-lived motion trails.
const REVEAL_DURATION_FRAMES = 12;
const REVEAL_SLIDE_DISTANCE = 110;
const TRACE_LAG_FRAMES = [2, 3] as const;
const TRACE_OPACITY_MULTIPLIER = [0.58, 0.34] as const;
const BASE_BLUR = 1.2;
const ENTRY_BLUR = 3.8;

const getDirection = (slideFrom: SlideFrom) => {
  return slideFrom === "left" ? -1 : 1;
};

// Computes one layer transform from a local reveal frame (0 = activation start).
const getLayerStyle = (localFrame: number, fps: number, direction: number): RevealLayerStyle => {
  const progress = spring({
    frame: localFrame,
    fps,
    config: {
      damping: 14,
      stiffness: 260,
      mass: 0.7,
    },
  });

  const translateX = direction * REVEAL_SLIDE_DISTANCE * (1 - progress);
  const blurPx = interpolate(localFrame, [0, REVEAL_DURATION_FRAMES], [ENTRY_BLUR, BASE_BLUR], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return { translateX, blurPx, opacity: 1, scaleX: 1 };
};

export const getBackgroundRevealState = ({
  frame,
  fps,
  activationFrame,
  slideFrom,
}: RevealParams): BackgroundRevealState => {
  // Without an activation event, keep the background in its resting state.
  if (activationFrame === null) {
    return {
      base: { translateX: 0, blurPx: BASE_BLUR, opacity: 1, scaleX: 1 },
      traces: [],
    };
  }

  const localFrame = frame - activationFrame;
  // Stop animation work outside the reveal window.
  if (localFrame < 0 || localFrame > REVEAL_DURATION_FRAMES) {
    return {
      base: { translateX: 0, blurPx: BASE_BLUR, opacity: 1, scaleX: 1 },
      traces: [],
    };
  }

  const direction = getDirection(slideFrom);
  const base = getLayerStyle(localFrame, fps, direction);

  // Trails deliberately sample earlier frames and add offset/stretch so they read as streaks.
  const traces: RevealLayerStyle[] = [];
  TRACE_LAG_FRAMES.forEach((lag, index) => {
    const traceFrame = localFrame - lag;
    if (traceFrame < 0) {
      return;
    }

    const traced = getLayerStyle(traceFrame, fps, direction);
    const trailOffset = direction * (18 + index * 10);
    traces.push({
      translateX: traced.translateX + trailOffset,
      blurPx: traced.blurPx + 2.6 + index * 1.0,
      opacity: TRACE_OPACITY_MULTIPLIER[index] ?? 0.2,
      scaleX: 1.08 + index * 0.04,
    });
  });

  return { base, traces };
};
