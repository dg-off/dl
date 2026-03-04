import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { TRANSITION_FRAMES } from "../constants";

const FADE_IN_END = 5; // 0-5: fade in
const HOLD_END = 8; // 5-8: brief hold at full opacity
const FADE_OUT_END = TRANSITION_FRAMES - 1; // 8-14: fade out

export const ConversationTransition: React.FC = () => {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame,
    [0, FADE_IN_END, HOLD_END, FADE_OUT_END],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        background: "#000",
        opacity,
      }}
    />
  );
};
