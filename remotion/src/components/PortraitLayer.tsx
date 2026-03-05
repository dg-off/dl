import React from "react";
import { Img } from "remotion";

type PortraitLayerProps = {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  imgX: number;
  imgY: number;
  imgScale: number;
  rotation?: number;
  opacity?: number;
  zIndex?: number;
};

const BASE_PORTRAIT_HEIGHT = 900;

export const PortraitLayer: React.FC<PortraitLayerProps> = ({
  src,
  x,
  y,
  width,
  height,
  imgX,
  imgY,
  imgScale,
  rotation = 0,
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
          height: BASE_PORTRAIT_HEIGHT,
          width: "auto",
          left: imgX,
          top: imgY,
          transform: `translate(-50%, -50%) scale(${imgScale}) rotate(${rotation}deg)`,
          transformOrigin: "center center",
          opacity,
        }}
      />
    </div>
  );
};
