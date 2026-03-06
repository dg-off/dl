import React, { useMemo } from "react";
import { PROGRESS_BAR_LAYOUT, PROGRESS_COLORS } from "../constants";
import type { ConversationRange } from "../types";

type ConversationProgressBarProps = {
  frame: number;
  durationInFrames: number;
  conversationRanges: ConversationRange[];
};

const getFrameRatio = (frame: number, durationInFrames: number) => {
  if (durationInFrames <= 1) {
    return 0;
  }
  return Math.min(1, Math.max(0, frame / (durationInFrames - 1)));
};

const getConversationIndexAtFrame = (ranges: ConversationRange[], frame: number) => {
  for (const range of ranges) {
    if (frame >= range.startFrame && frame < range.endFrame) {
      return range.index;
    }
  }
  return ranges.length > 0 ? ranges[ranges.length - 1].index : -1;
};

export const ConversationProgressBar: React.FC<ConversationProgressBarProps> = ({
  frame,
  durationInFrames,
  conversationRanges,
}) => {
  // Frame-accurate progress value. Do not ease this, or boundaries drift.
  const globalProgress = getFrameRatio(frame, durationInFrames);
  const activeConversationIndex = getConversationIndexAtFrame(conversationRanges, frame);

  // Precompute geometry and per-column state for this frame.
  const { columns, dividers } = useMemo(() => {
    const availableWidth = 1080 - PROGRESS_BAR_LAYOUT.PADDING_X * 2;
    const totalGap = (PROGRESS_BAR_LAYOUT.COLUMN_COUNT - 1) * PROGRESS_BAR_LAYOUT.COLUMN_GAP;
    const columnWidth = (availableWidth - totalGap) / PROGRESS_BAR_LAYOUT.COLUMN_COUNT;
    const nextDividers = conversationRanges
      .slice(1)
      .map((range) => {
        const ratio = getFrameRatio(range.startFrame, durationInFrames);
        const flash = frame >= range.startFrame && frame < range.startFrame + PROGRESS_BAR_LAYOUT.DIVIDER_FLASH_FRAMES;
        return {
          left: PROGRESS_BAR_LAYOUT.PADDING_X + availableWidth * ratio - PROGRESS_BAR_LAYOUT.DIVIDER_WIDTH / 2,
          flash,
        };
      });

    const nextColumns = Array.from({ length: PROGRESS_BAR_LAYOUT.COLUMN_COUNT }, (_, index) => {
      const left =
        PROGRESS_BAR_LAYOUT.PADDING_X +
        index * (columnWidth + PROGRESS_BAR_LAYOUT.COLUMN_GAP);
      const right = left + columnWidth;
      const centerFrame = Math.floor(
        ((index + 0.5) / PROGRESS_BAR_LAYOUT.COLUMN_COUNT) * (durationInFrames - 1)
      );
      const centerRatio = getFrameRatio(centerFrame, durationInFrames);
      const isFilled = centerRatio <= globalProgress;
      const segment = conversationRanges.find(
        (range) => centerFrame >= range.startFrame && centerFrame < range.endFrame
      );
      const isInActiveSegment = segment?.index === activeConversationIndex;
      const columnColor = isFilled ? PROGRESS_COLORS.FILL : PROGRESS_COLORS.TRACK;

      // Visual polish only: sheen intensity follows the playhead, but timing stays raw.
      const sweepCenterRatio = getFrameRatio(frame, durationInFrames);
      const distance = Math.abs(centerRatio - sweepCenterRatio);
      const sweepIntensity =
        isFilled && isInActiveSegment ? Math.max(0, 1 - distance / 0.1) : 0;

      const intersectsDividerGap = nextDividers.some((divider) => {
        const gapStart = divider.left - PROGRESS_BAR_LAYOUT.DIVIDER_GAP;
        const gapEnd =
          divider.left +
          PROGRESS_BAR_LAYOUT.DIVIDER_WIDTH +
          PROGRESS_BAR_LAYOUT.DIVIDER_GAP;
        return right > gapStart && left < gapEnd;
      });

      if (intersectsDividerGap) {
        return null;
      }

      return {
        left,
        width: columnWidth,
        color: columnColor,
        sweepIntensity,
      };
    });

    return {
      columns: nextColumns,
      dividers: nextDividers,
    };
  }, [activeConversationIndex, conversationRanges, durationInFrames, frame, globalProgress]);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: PROGRESS_BAR_LAYOUT.TOP,
        height: PROGRESS_BAR_LAYOUT.BAR_HEIGHT + PROGRESS_BAR_LAYOUT.DIVIDER_EXTRA_HEIGHT + 8,
        pointerEvents: "none",
        zIndex: 250,
      }}
    >
      {columns.map((column, index) => (
        column ? (
        <div
          key={`progress-column-${index}`}
          style={{
            position: "absolute",
            left: column.left,
            top: 4,
            width: column.width,
            height: PROGRESS_BAR_LAYOUT.BAR_HEIGHT,
            background: column.color,
            boxShadow:
              column.sweepIntensity > 0
                ? `0 0 ${8 + column.sweepIntensity * 8}px rgba(182,133,255,0.62), 0 0 ${14 + column.sweepIntensity * 10}px rgba(182,133,255,0.34)`
                : "none",
          }}
        />
        ) : null
      ))}

      {dividers.map((divider, index) => (
        <div
          key={`progress-divider-${index}`}
          style={{
            position: "absolute",
            left: divider.left,
            top: 1,
            width: PROGRESS_BAR_LAYOUT.DIVIDER_WIDTH,
            height: PROGRESS_BAR_LAYOUT.BAR_HEIGHT + PROGRESS_BAR_LAYOUT.DIVIDER_EXTRA_HEIGHT,
            background: divider.flash ? "rgba(182,133,255,0.96)" : "rgba(182,133,255,0.66)",
            boxShadow: divider.flash
              ? "0 0 16px rgba(182,133,255,0.8)"
              : "0 0 8px rgba(182,133,255,0.42)",
          }}
        />
      ))}
    </div>
  );
};
