import React from "react";
import { Img, staticFile } from "remotion";
import { toPortraitKey } from "../constants";
import { usePortraitConfig } from "../context/PortraitConfigContext";
import { COMPOSITION_HEIGHT, COMPOSITION_WIDTH, shouldRenderRegion } from "../layout/default-layout";
import type { LayoutConfig } from "../layout/types";
import { DEFAULT_PORTRAIT_SETTINGS, getSlotSettings } from "../types";
import { portraitSettingsToParentRelativeTransform } from "../tuning/adapters/portrait";
import {
  toParentRelativeImageTransform,
  toParentRelativeRotationStyle,
} from "../tuning/transform-style";
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
  const portraitConfig = usePortraitConfig();

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
  const settings = charKey ? getSlotSettings(portraitConfig, charKey, charBgCharIdx) : DEFAULT_PORTRAIT_SETTINGS;
  const transform = portraitSettingsToParentRelativeTransform(settings);
  const posterRowBox = layout.regions.POSTER_ROW.box;
  const charBgInnerW = posterRowBox.width - 64; // paddingInline: 32 each side
  const charBgTotalSlots = charBgCount * POSTER_W + (charBgCount - 1) * charBgGap;
  const charBgStartX = posterRowBox.x + 32 + Math.max(0, (charBgInnerW - charBgTotalSlots) / 2);
  const charBgCardCenterX = charBgStartX + charBgCharIdx * (POSTER_W + charBgGap) + POSTER_W / 2;
  const charBgVisualW = Math.round(POSTER_W * charBgPeakScale);
  const charBgVisualH = Math.round(POSTER_H * charBgPeakScale);
  // Anchor at center-bottom of the poster card (same as poster's transformOrigin: center bottom)
  const charBgX = Math.round(charBgCardCenterX - charBgVisualW / 2);
  const charBgY = Math.round(posterRowBox.y + POSTER_H - charBgVisualH);

  return (
    // Full-frame plane — portrait can be positioned anywhere within the frame
    <div
      data-layer="CHAR_BG"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: COMPOSITION_WIDTH,
        height: COMPOSITION_HEIGHT,
        overflow: "hidden",
        zIndex: 6,
        opacity: layout.regions.CHAR_BG.opacity,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: charBgX,
          top: charBgY,
          width: charBgVisualW,
          height: charBgVisualH,
          ...toParentRelativeRotationStyle(transform),
        }}
      >
        <Img
          src={staticFile(`portraits/${charKey}.png`)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: toParentRelativeImageTransform(transform),
            transformOrigin: "top center",
            display: "block",
          }}
        />
      </div>
    </div>
  );
};
