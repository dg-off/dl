import React from "react";
import { interpolate } from "remotion";

type TransitionWindow = {
  startFrame: number;
  endFrame: number;
};

type ConversationTransitionOverlayProps = {
  frame: number;
  windows: TransitionWindow[];
};

export const ConversationTransitionOverlay: React.FC<ConversationTransitionOverlayProps> = ({
  frame,
  windows,
}) => {
  const activeWindow = windows.find(
    (window) => frame >= window.startFrame && frame < window.endFrame
  );

  if (!activeWindow) {
    return null;
  }

  const duration = Math.max(1, activeWindow.endFrame - activeWindow.startFrame);
  const localFrame = frame - activeWindow.startFrame;
  const blackoutFrame = Math.floor(duration / 2);
  const fadeOutEnd = Math.max(0, blackoutFrame - 1);
  const fadeInStart = Math.min(duration - 1, blackoutFrame + 1);
  let opacity = 0;

  // Hold exactly one full-black frame at the transition midpoint to hide participant swap.
  if (localFrame === blackoutFrame) {
    opacity = 1;
  } else if (localFrame < blackoutFrame) {
    opacity = interpolate(localFrame, [0, fadeOutEnd], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  } else {
    opacity = interpolate(localFrame, [fadeInStart, duration - 1], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#04060c",
        opacity,
        zIndex: 220,
        pointerEvents: "none",
      }}
    />
  );
};
