import React from "react";
import { Img, staticFile } from "remotion";
import { shouldRenderRegion, toAbsoluteStyle, zForRegion } from "../layout/default-layout";
import type { LayoutConfig } from "../layout/types";

type Props = {
  layout: LayoutConfig;
  respectVisibility: boolean;
};

export const Background: React.FC<Props> = ({ layout, respectVisibility }) => {
  return (
    <>
      {/* BG_IMAGE disabled — commented out for CHAR_BG positioning
      {shouldRenderRegion(layout, "BG_IMAGE", respectVisibility) ? (
        <div
          data-layer="BG_IMAGE"
          style={toAbsoluteStyle(layout.regions.BG_IMAGE.box, {
            overflow: "hidden",
            zIndex: zForRegion(layout, "BG_IMAGE"),
          })}
        >
          <Img
            src={staticFile("bg.png")}
            style={{
              position: "absolute",
              inset: "-3%",
              width: "106%",
              height: "106%",
              objectFit: "cover",
              objectPosition: "center center",
              filter: "blur(0px) saturate(1) brightness(1)",
            }}
          />
        </div>
      ) : null}
      */}

      {shouldRenderRegion(layout, "BG_GRADIENT", respectVisibility) ? (
        <div
          data-layer="BG_GRADIENT"
          style={toAbsoluteStyle(layout.regions.BG_GRADIENT.box, {
            background:
              "linear-gradient(180deg, rgba(4,8,20,0.82) 0%, rgba(4,8,20,0.52) 20%, rgba(4,8,20,0.38) 50%, rgba(4,8,20,0.70) 72%, rgba(4,8,20,0.96) 100%)",
            pointerEvents: "none",
            zIndex: zForRegion(layout, "BG_GRADIENT"),
          })}
        />
      ) : null}

      {shouldRenderRegion(layout, "BG_VIGNETTE", respectVisibility) ? (
        <div
          data-layer="BG_VIGNETTE"
          style={toAbsoluteStyle(layout.regions.BG_VIGNETTE.box, {
            background: "radial-gradient(ellipse at 50% 50%, transparent 44%, rgba(0,0,0,0.72) 100%)",
            pointerEvents: "none",
            zIndex: zForRegion(layout, "BG_VIGNETTE"),
          })}
        />
      ) : null}
    </>
  );
};
