import React from "react";
import { Img, staticFile } from "remotion";
import { toPortraitKey } from "../constants";
import { shouldRenderRegion } from "../layout/default-layout";
import type { LayoutConfig } from "../layout/types";
import { POSTER_ACTIVE_SCALE, POSTER_H, POSTER_W } from "./CharacterPosterV3";

type Props = {
  charKey: string | null;
  participants: string[];
  layout: LayoutConfig;
  respectVisibility: boolean;
};

export const CharacterBackground: React.FC<Props> = ({
  charKey,
  participants,
  layout,
  respectVisibility,
}) => {
  if (!shouldRenderRegion(layout, "CHAR_BG", respectVisibility) || !charKey) {
    return null;
  }

  const charBgCount = participants.length || 2;
  const charBgGap = charBgCount > 2 ? 28 : 64;
  const charBgSizeScale = charBgCount > 2 ? 0.74 : 1;
  const charBgPeakScale = POSTER_ACTIVE_SCALE * charBgSizeScale;
  const charBgCharIdx = Math.max(
    0,
    participants.findIndex((p) => toPortraitKey(p) === charKey)
  );
  const posterRowBox = layout.regions.POSTER_ROW.box;
  const charBgInnerW = posterRowBox.width - 64; // paddingInline: 32 each side
  const charBgTotalSlots = charBgCount * POSTER_W + (charBgCount - 1) * charBgGap;
  const charBgStartX = posterRowBox.x + 32 + Math.max(0, (charBgInnerW - charBgTotalSlots) / 2);
  const charBgCardCenterX = charBgStartX + charBgCharIdx * (POSTER_W + charBgGap) + POSTER_W / 2;
  const charBgVisualW = Math.round(POSTER_W * charBgPeakScale);
  const charBgVisualH = Math.round(POSTER_H * charBgPeakScale);
  // transformOrigin: center bottom — bottom of frame stays anchored at POSTER_ROW.y + POSTER_H
  const charBgX = Math.round(charBgCardCenterX - charBgVisualW / 2);
  const charBgY = Math.round(posterRowBox.y + POSTER_H - charBgVisualH);

  return (
    <div
      data-layer="CHAR_BG"
      style={{
        position: "absolute",
        left: charBgX,
        top: charBgY,
        width: charBgVisualW,
        height: charBgVisualH,
        overflow: "hidden",
        zIndex: 6,
        opacity: 1,
        pointerEvents: "none",
      }}
    >
      <Img
        src={staticFile(`portraits/${charKey}.png`)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "50% 14%",
          transform: "scale(1.92)",
          transformOrigin: "top center",
          display: "block",
        }}
      />
    </div>
  );
};
