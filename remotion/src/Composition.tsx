import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { PortraitCard } from "./components/PortraitCard";
import type { Props } from "./types";

export const DeadlockShort: React.FC<Props> = () => {
  const leftSrc = staticFile("portraits/holliday.png");
  const rightSrc = staticFile("portraits/paradox.png");

  return (
    <AbsoluteFill style={{ background: "#0b0f17" }}>
      <PortraitCard
        src={leftSrc}
        x={70}
        y={180}
        width={430}
        height={980}
        frameInset={{ top: 120, right: 28, bottom: 70, left: 28 }}
        zoom={1}
        frameRadius={22}
      />

      <PortraitCard
        src={rightSrc}
        x={580}
        y={180}
        width={430}
        height={980}
        frameInset={{ top: 120, right: 28, bottom: 70, left: 28 }}
        zoom={1.28}
        frameRadius={22}
      />
    </AbsoluteFill>
  );
};
