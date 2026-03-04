import React from "react";
import { useCurrentFrame } from "remotion";
import { PROGRESS_BAR_LAYOUT } from "../constants";
import type { RegionBox } from "../layout/types";

type ProgressBarProps = {
  convBoundaries: Array<{ start: number; end: number }>;
  box?: RegionBox;
};

export const ProgressBar: React.FC<ProgressBarProps> = ({ convBoundaries, box }) => {
  // Not inside any Sequence, so useCurrentFrame() returns the global frame.
  const frame = useCurrentFrame();

  const { GAP, PADDING, HEIGHT, TOP } = PROGRESS_BAR_LAYOUT;
  const left = box ? box.x : PADDING;
  const top = box ? box.y : TOP;
  const width = box ? box.width : 1080 - PADDING * 2;
  const height = box ? box.height : HEIGHT;
  const radius = Math.max(1, height / 2);

  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        width,
        height,
        display: "flex",
        gap: GAP,
        pointerEvents: "none",
      }}
    >
      {convBoundaries.map((boundary, i) => {
        let fill = 0;
        if (frame >= boundary.end) {
          fill = 1;
        } else if (frame > boundary.start) {
          fill = (frame - boundary.start) / (boundary.end - boundary.start);
        }

        const isActive = frame > boundary.start && frame < boundary.end;

        return (
          <div
            key={i}
            style={{
              flex: 1,
              height,
              borderRadius: radius,
              background: "rgba(255,255,255,0.12)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: `${fill * 100}%`,
                height: "100%",
                background: "#d4a230",
                borderRadius: radius,
                boxShadow: isActive
                  ? "2px 0 8px 2px rgba(212,168,48,0.65)"
                  : "none",
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
