import React, { useMemo } from "react";
import { PROGRESS_BAR_LAYOUT, PROGRESS_COLORS } from "../constants";
import type { ConversationRange } from "../types";

type ConversationProgressBarProps = {
  frame: number;
  durationInFrames: number;
  conversationRanges: ConversationRange[];
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
  const activeConversationIndex = getConversationIndexAtFrame(conversationRanges, frame);

  // Precompute geometry and per-column state for this frame.
  const { columns, dividers } = useMemo(() => {
    const availableWidth = 1080 - PROGRESS_BAR_LAYOUT.PADDING_X * 2;
    const conversationCount = Math.max(1, conversationRanges.length);
    const baseColumnsPerConversation = Math.floor(
      PROGRESS_BAR_LAYOUT.COLUMN_COUNT / conversationCount
    );
    const extraColumns = PROGRESS_BAR_LAYOUT.COLUMN_COUNT % conversationCount;
    const columnsPerConversation = conversationRanges.map((_, index) =>
      baseColumnsPerConversation + (index < extraColumns ? 1 : 0)
    );
    const boundaryGapWidth =
      PROGRESS_BAR_LAYOUT.DIVIDER_WIDTH + PROGRESS_BAR_LAYOUT.DIVIDER_GAP * 2;
    const interiorGapCount = PROGRESS_BAR_LAYOUT.COLUMN_COUNT - conversationCount;
    const boundaryGapCount = Math.max(0, conversationCount - 1);
    const totalGapWidth =
      interiorGapCount * PROGRESS_BAR_LAYOUT.COLUMN_GAP +
      boundaryGapCount * boundaryGapWidth;
    const columnWidth = (availableWidth - totalGapWidth) / PROGRESS_BAR_LAYOUT.COLUMN_COUNT;

    let cursorLeft = PROGRESS_BAR_LAYOUT.PADDING_X;
    const nextDividers: { left: number; flash: boolean }[] = [];
    const nextColumns = conversationRanges.flatMap((range, conversationIndex) => {
      const columnCount = columnsPerConversation[conversationIndex];
      const conversationDuration = Math.max(1, range.endFrame - range.startFrame);
      const isLastConversation = conversationIndex === conversationRanges.length - 1;
      const filledCount =
        frame < range.startFrame
          ? 0
          : frame >= range.endFrame
            ? columnCount
            : Math.min(
                columnCount,
                Math.floor(
                  ((frame - range.startFrame) * columnCount) / conversationDuration
                ) + 1
              );

      return Array.from({ length: columnCount }, (_, localIndex) => {
        const localStartFrame =
          range.startFrame + Math.floor((localIndex / columnCount) * conversationDuration);
        const localEndFrame =
          range.startFrame +
          Math.floor(((localIndex + 1) / columnCount) * conversationDuration);
        const isFilled = localIndex < filledCount;
        const isInActiveSegment = conversationIndex === activeConversationIndex;
        const columnColor = isFilled ? PROGRESS_COLORS.FILL : PROGRESS_COLORS.TRACK;
        const localCenterFrame = Math.floor((localStartFrame + localEndFrame) / 2);
        const localDistance = Math.abs(localCenterFrame - frame);
        const sweepIntensity =
          isFilled && isInActiveSegment
            ? Math.max(0, 1 - localDistance / Math.max(1, durationInFrames * 0.08))
            : 0;
        const left = cursorLeft;

        cursorLeft += columnWidth;

        const isLastColumnInConversation = localIndex === columnCount - 1;
        if (!isLastColumnInConversation) {
          cursorLeft += PROGRESS_BAR_LAYOUT.COLUMN_GAP;
        } else if (!isLastConversation) {
          nextDividers.push({
            left: cursorLeft + PROGRESS_BAR_LAYOUT.DIVIDER_GAP,
            flash:
              frame >= conversationRanges[conversationIndex + 1].startFrame &&
              frame <
                conversationRanges[conversationIndex + 1].startFrame +
                  PROGRESS_BAR_LAYOUT.DIVIDER_FLASH_FRAMES,
          });
          cursorLeft += boundaryGapWidth;
        }
        return {
          key: `${conversationIndex}-${localIndex}`,
          left,
          width: columnWidth,
          color: columnColor,
          sweepIntensity,
        };
      });
    });

    return {
      columns: nextColumns,
      dividers: nextDividers,
    };
  }, [activeConversationIndex, conversationRanges, durationInFrames, frame]);

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
      {columns.map((column) => (
        <div
          key={`progress-column-${column.key}`}
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
