import React from "react";
import { TOPO_BASE_RGB } from "../../constants";
import { layerOpacity, layerToggleKey, toAbsoluteStyle } from "../../layout/default-layout";
import { REGION_ORDER } from "../../layout/region-meta";
import type { LayoutConfig } from "../../layout/types";

const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

type Props = {
  layout: LayoutConfig;
};

export const TopoPlanesOverlay: React.FC<Props> = ({ layout }) => {
  if (!layout.topo.enabled) {
    return null;
  }

  const spacing = Math.max(6, Math.round(layout.topo.contourSpacing));
  const contourStart = Math.max(1, spacing - 1);

  return (
    <div
      data-layer="TOPO_PLANES"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 5,
        pointerEvents: "none",
      }}
    >
      {REGION_ORDER.map((name) => {
        const region = layout.regions[name];
        const layerEnabled = layout.ui[layerToggleKey(region.layer)];
        if (!layerEnabled || !region.visible) {
          return null;
        }

        const [r, g, b] = TOPO_BASE_RGB[region.layer];
        const opacity = clampNumber(layerOpacity(layout, region.layer), 0, 1);
        const borderAlpha = clampNumber(opacity + 0.2, 0, 0.72);
        const topFillAlpha = clampNumber(opacity + 0.08, 0, 1);
        const contourColor = `rgba(255, 240, 248, ${clampNumber(layout.topo.contourStrokeOpacity, 0, 1)})`;

        return (
          <div
            key={name}
            style={toAbsoluteStyle(region.box, {
              overflow: "hidden",
              background: `linear-gradient(180deg, rgba(${r}, ${g}, ${b}, ${topFillAlpha}) 0%, rgba(${r}, ${g}, ${b}, ${opacity}) 100%)`,
              border: `1px solid rgba(${r}, ${g}, ${b}, ${borderAlpha})`,
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)",
            })}
          >
            {layout.topo.showContours ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `repeating-linear-gradient(160deg, transparent 0px, transparent ${contourStart}px, ${contourColor} ${contourStart}px, ${contourColor} ${spacing}px)`,
                }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
