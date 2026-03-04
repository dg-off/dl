import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { toPortraitKey } from "../constants";
import { SUBTITLE_FONT } from "../fonts";

export const POSTER_W = 396;
export const POSTER_H = 620;
export const POSTER_ACTIVE_SCALE = 1.06;

const BASE_SCALE = 1;
const ACTIVE_SCALE = POSTER_ACTIVE_SCALE;
const ANIM_FRAMES = 12;
const POSTER_LAYERS = {
  ROOT: "poster-root",
  FRAME: "poster-frame",
  IMAGE: "poster-image",
  TONE: "poster-tone",
  DIM: "poster-dim",
  NAME: "poster-name",
} as const;

type Props = {
  character: string;
  isActive: boolean;
  sizeScale?: number;
};

export const CharacterPosterV3: React.FC<Props> = ({
  character,
  isActive,
  sizeScale = 1,
}) => {
  const frame = useCurrentFrame();
  const key = toPortraitKey(character);

  const progress = interpolate(frame, [0, ANIM_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = interpolate(
    progress,
    [0, 1],
    [BASE_SCALE, isActive ? ACTIVE_SCALE : BASE_SCALE],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const overlayOpacity = interpolate(progress, [0, 1], [0.3, isActive ? 0.08 : 0.38], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const nameOpacity = interpolate(progress, [0, 1], [0.65, isActive ? 1 : 0.7], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      data-layer={POSTER_LAYERS.ROOT}
      style={{
        width: POSTER_W,
        transform: `scale(${scale * sizeScale})`,
        transformOrigin: "center bottom",
        opacity: isActive ? 1 : 0.88,
      }}
    >
      <div
        data-layer={POSTER_LAYERS.FRAME}
        style={{
          position: "relative",
          width: POSTER_W,
          height: POSTER_H,
          overflow: "hidden",
          background: "#0b1220",
          border: isActive ? "2px solid rgba(247, 210, 116, 0.95)" : "2px solid rgba(247, 210, 116, 0.45)",
          boxShadow: isActive
            ? "0 20px 60px rgba(0,0,0,0.6), 0 0 24px rgba(247,210,116,0.22)"
            : "0 16px 40px rgba(0,0,0,0.5)",
        }}
      >
        <Img
          data-layer={POSTER_LAYERS.IMAGE}
          src={staticFile(`portraits/${key}.png`)}
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
        <div
          data-layer={POSTER_LAYERS.TONE}
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(4,8,15,0.18) 0%, rgba(4,8,15,0.2) 52%, rgba(4,8,15,0.72) 100%)",
          }}
        />
        <div
          data-layer={POSTER_LAYERS.DIM}
          style={{
            position: "absolute",
            inset: 0,
            background: `rgba(0, 0, 0, ${overlayOpacity})`,
          }}
        />
      </div>

      <div
        data-layer={POSTER_LAYERS.NAME}
        style={{
          marginTop: 14,
          textAlign: "center",
          color: "#f7d274",
          fontFamily: SUBTITLE_FONT,
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          opacity: nameOpacity,
          textShadow: isActive ? "0 0 12px rgba(247, 210, 116, 0.35)" : "none",
        }}
      >
        {character}
      </div>
    </div>
  );
};
