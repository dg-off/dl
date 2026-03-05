import React from "react";
import { Img } from "remotion";

type PortraitLayerProps = {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
  rotation?: number;
  focusX?: number;
  focusY?: number;
  opacity?: number;
  zIndex?: number;
};

export const PortraitLayer: React.FC<PortraitLayerProps> = ({
  src,
  x,
  y,
  width,
  height,
  zoom,
  rotation = 0,
  focusX = 50,
  focusY = 50,
  opacity = 1,
  zIndex = 0,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        zIndex,
      }}
    >
      <Img
        src={src}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: `${focusX}% ${focusY}%`,
          transform: `scale(${zoom}) rotate(${rotation}deg)`,
          transformOrigin: "center center",
          opacity,
        }}
      />
    </div>
  );
};
