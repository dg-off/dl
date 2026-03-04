import React from "react";
import { GUIDE_PINK } from "../../constants";
import { layerToggleKey, toAbsoluteStyle } from "../../layout/default-layout";
import { REGION_LABELS, REGION_ORDER } from "../../layout/region-meta";
import type { LayoutConfig } from "../../layout/types";

type Props = {
  layout: LayoutConfig;
};

export const LayoutGuideOverlay: React.FC<Props> = ({ layout }) => {
  if (!layout.ui.showGuides) {
    return null;
  }

  return (
    <div
      data-layer="LAYOUT_GUIDES"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 9998,
        pointerEvents: "none",
      }}
    >
      {REGION_ORDER.map((name) => {
        const region = layout.regions[name];
        const layerEnabled = layout.ui[layerToggleKey(region.layer)];

        if (!layerEnabled) {
          return null;
        }

        return (
          <div
            key={name}
            style={toAbsoluteStyle(region.box, {
              border: `2px dashed ${GUIDE_PINK}`,
              background: "transparent",
              opacity: region.visible ? 1 : 0.45,
            })}
          >
            {layout.ui.showLabels ? (
              <div
                style={{
                  position: "absolute",
                  top: 6,
                  left: 6,
                  padding: "4px 8px",
                  background: "rgba(10, 11, 18, 0.9)",
                  color: GUIDE_PINK,
                  border: `1px solid ${GUIDE_PINK}`,
                  fontFamily: "monospace",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                }}
              >
                {`${REGION_LABELS[name]} | L${region.layer}${region.visible ? "" : " | OFF"}`}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
