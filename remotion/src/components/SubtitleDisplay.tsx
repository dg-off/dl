import React, { useMemo } from "react";
import "../fonts";
import { SUBTITLE_FONT } from "../fonts";
import { splitIntoChunks, getActiveChunkIndex } from "../subtitleUtils";
import type { DialogueLine } from "../types";

type Props = {
  currentLine: DialogueLine | null;
  currentLineLocalFrame: number;
  lineFrames: number;
};

export const SubtitleDisplay: React.FC<Props> = ({
  currentLine,
  currentLineLocalFrame,
  lineFrames,
}) => {
  const chunks = useMemo(
    () => (currentLine ? splitIntoChunks(currentLine.text) : []),
    [currentLine]
  );

  // Advance by 5 frames so chunk switches feel in sync rather than lagging behind.
  const ADVANCE_FRAMES = 5;
  const activeChunkIndex = useMemo(
    () => getActiveChunkIndex(chunks, lineFrames, currentLineLocalFrame + ADVANCE_FRAMES),
    [chunks, lineFrames, currentLineLocalFrame]
  );

  if (!currentLine || chunks.length === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 480,
        left: 0,
        right: 0,
        textAlign: "center",
        paddingLeft: 60,
        paddingRight: 60,
        zIndex: 200,
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          fontFamily: SUBTITLE_FONT,
          fontSize: 72,
          fontWeight: 700,
          color: "white",
          WebkitTextStroke: "4px black",
          textShadow: "0 2px 12px rgba(0,0,0,0.8)",
          lineHeight: 1.1,
        }}
      >
        {chunks[activeChunkIndex]}
      </span>
    </div>
  );
};
