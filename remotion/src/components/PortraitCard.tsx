import React from "react";
import { Img } from "remotion";
import { getBackgroundRevealState, type SlideFrom } from "./backgroundReveal";
import { PortraitLayer } from "./PortraitLayer";

type Insets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

type PortraitCardProps = {
  src: string;
  nameSrc: string;
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
  bgZIndex?: number;
  fgZIndex?: number;
  frameRadius?: number;
  frameBorder?: string;
  frame: number;
  fps: number;
  activationFrame: number | null;
  slideFrom: SlideFrom;
};

export const PortraitCard: React.FC<PortraitCardProps> = ({
  src,
  nameSrc,
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
  bgZIndex = 10,
  fgZIndex = 100,
  frameRadius = 16,
  frameBorder = "3px solid rgba(255,255,255,0.72)",
  frame,
  fps,
  activationFrame,
  slideFrom,
}) => {
  // Geometry for frame crop, shadow, and nameplate alignment.
  const frameX = x + frameInset.left;
  const frameY = y + frameInset.top;
  const frameWidth = width - frameInset.left - frameInset.right;
  const frameHeight = height - frameInset.top - frameInset.bottom;
  const depthShadowZ = bgZIndex + 1;
  const nameplateWidth = Math.round(frameWidth * 0.72);
  const nameplateHeight = Math.round(frameHeight * 0.2);
  const nameplateX = frameX + (frameWidth - nameplateWidth) / 2;
  const nameplateY = frameY + frameHeight - Math.round(nameplateHeight * 0.52);
  const nameplateZ = fgZIndex + 10;
  const bgLayerFilterBase = "saturate(1.12) brightness(0.9) contrast(1.04)";

  // Reveal state is computed externally from timeline events, keeping this component visual-only.
  const reveal = getBackgroundRevealState({
    frame,
    fps,
    activationFrame,
    slideFrom,
  });

  // Layer order:
  // 1) trailing streaks, 2) animated blurred background, 3) frame shadow,
  // 4) clipped foreground portrait, 5) nameplate.
  return (
    <>
      {reveal.traces.map((trace, index) => (
        <div
          key={`trace-${index}`}
          style={{
            position: "absolute",
            left: x,
            top: y,
            width,
            height,
            zIndex: bgZIndex - (index + 1),
            transform: `translateX(${trace.translateX}px) scaleX(${trace.scaleX})`,
            transformOrigin: slideFrom === "left" ? "left center" : "right center",
            filter: `blur(${trace.blurPx}px) ${bgLayerFilterBase}`,
          }}
        >
          <PortraitLayer
            src={src}
            x={0}
            y={0}
            width={width}
            height={height}
            imgX={imgX}
            imgY={imgY}
            imgScale={imgScale}
            rotation={rotation}
            zIndex={0}
            opacity={bgOpacity * trace.opacity}
          />
        </div>
      ))}

      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width,
          height,
          zIndex: bgZIndex,
          transform: `translateX(${reveal.base.translateX}px)`,
          filter: `blur(${reveal.base.blurPx}px) ${bgLayerFilterBase}`,
        }}
      >
        <PortraitLayer
          src={src}
          x={0}
          y={0}
          width={width}
          height={height}
          imgX={imgX}
          imgY={imgY}
          imgScale={imgScale}
          rotation={rotation}
          zIndex={0}
          opacity={bgOpacity * reveal.base.opacity}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: frameX,
          top: frameY + 8,
          width: frameWidth,
          height: frameHeight,
          borderRadius: frameRadius + 2,
          background: "rgba(0,0,0,0.34)",
          filter: "blur(18px)",
          zIndex: depthShadowZ,
        }}
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
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.3), inset 0 -1px 0 rgba(255,255,255,0.24), 0 24px 46px rgba(0,0,0,0.5), 0 8px 18px rgba(0,0,0,0.34)",
          zIndex: fgZIndex,
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

      <div
        style={{
          position: "absolute",
          left: nameplateX,
          top: nameplateY,
          width: nameplateWidth,
          height: nameplateHeight,
          zIndex: nameplateZ,
          pointerEvents: "none",
          filter:
            "drop-shadow(2px 0 0 rgba(0,0,0,0.95)) drop-shadow(-2px 0 0 rgba(0,0,0,0.95)) drop-shadow(0 2px 0 rgba(0,0,0,0.95)) drop-shadow(0 -2px 0 rgba(0,0,0,0.95)) drop-shadow(1.5px 1.5px 0 rgba(0,0,0,0.95)) drop-shadow(-1.5px -1.5px 0 rgba(0,0,0,0.95))",
        }}
      >
        <Img
          src={nameSrc}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "center",
          }}
        />
      </div>
    </>
  );
};
