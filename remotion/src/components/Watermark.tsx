import React from "react";
import { Img, staticFile } from "remotion";
import { WATERMARK } from "../constants";
import { SUBTITLE_FONT } from "../fonts";
import { shouldRenderRegion, toAbsoluteStyle, zForRegion } from "../layout/default-layout";
import type { LayoutConfig } from "../layout/types";

type Props = {
  layout: LayoutConfig;
  respectVisibility: boolean;
};

export const Watermark: React.FC<Props> = ({ layout, respectVisibility }) => {
  if (!shouldRenderRegion(layout, "WATERMARK_ROW", respectVisibility)) {
    return null;
  }

  return (
    <div
      data-layer="WATERMARK_ROW"
      style={toAbsoluteStyle(layout.regions.WATERMARK_ROW.box, {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
        pointerEvents: "none",
        zIndex: zForRegion(layout, "WATERMARK_ROW"),
      })}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          overflow: "hidden",
          border: "1.5px solid rgba(212,168,67,0.55)",
          flexShrink: 0,
        }}
      >
        <Img
          src={staticFile("avatar.jpg")}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>

      <div
        style={{
          fontFamily: SUBTITLE_FONT,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.42)",
          textShadow: "0 1px 8px rgba(0,0,0,0.9)",
        }}
      >
        {WATERMARK}
      </div>
    </div>
  );
};
