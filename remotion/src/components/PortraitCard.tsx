import React from "react";
import { PortraitLayer } from "./PortraitLayer";

type Insets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

type PortraitCardProps = {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  frameInset: Insets;
  imgX: number;
  imgY: number;
  imgScale: number;
  rotation?: number;
  bgOpacity?: number;
  fgOpacity?: number;
  frameRadius?: number;
  frameBorder?: string;
};

export const PortraitCard: React.FC<PortraitCardProps> = ({
  src,
  x,
  y,
  width,
  height,
  frameInset,
  imgX,
  imgY,
  imgScale,
  rotation = 0,
  bgOpacity = 1,
  fgOpacity = 1,
  frameRadius = 16,
  frameBorder = "2px solid rgba(255,255,255,0.2)",
}) => {
  const frameX = x + frameInset.left;
  const frameY = y + frameInset.top;
  const frameWidth = width - frameInset.left - frameInset.right;
  const frameHeight = height - frameInset.top - frameInset.bottom;

  return (
    <>
      <PortraitLayer
        src={src}
        x={x}
        y={y}
        width={width}
        height={height}
        imgX={imgX}
        imgY={imgY}
        imgScale={imgScale}
        rotation={rotation}
        zIndex={0}
        opacity={bgOpacity}
      />

      <div
        style={{
          position: "absolute",
          left: frameX,
          top: frameY,
          width: frameWidth,
          height: frameHeight,
          overflow: "hidden",
          borderRadius: frameRadius,
          border: frameBorder,
          zIndex: 1,
        }}
      >
        <PortraitLayer
          src={src}
          x={x - frameX}
          y={y - frameY}
          width={width}
          height={height}
          imgX={imgX}
          imgY={imgY}
          imgScale={imgScale}
          rotation={rotation}
          opacity={fgOpacity}
        />
      </div>
    </>
  );
};
