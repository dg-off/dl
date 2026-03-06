import React from "react";
import { Img, interpolate } from "remotion";

type WatermarkBadgeProps = {
  frame: number;
  avatarSrc: string;
  label: string;
};

export const WatermarkBadge: React.FC<WatermarkBadgeProps> = ({
  frame,
  avatarSrc,
  label,
}) => {
  // Quick intro so branding appears intentionally instead of popping in.
  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(frame, [0, 12], [14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        bottom: 72,
        transform: `translate(-50%, ${translateY}px)`,
        opacity,
        zIndex: 240,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 14px 8px 8px",
        background: "rgba(8,12,20,0.78)",
        border: "1px solid rgba(255,255,255,0.26)",
        boxShadow: "0 10px 28px rgba(0,0,0,0.5)",
      }}
    >
      <Img
        src={avatarSrc}
        style={{
          width: 40,
          height: 40,
          objectFit: "cover",
          border: "1px solid rgba(255,255,255,0.45)",
        }}
      />
      <div
        style={{
          color: "rgba(255,255,255,0.95)",
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: 1.1,
          lineHeight: 1,
          textTransform: "uppercase",
          textShadow: "0 1px 0 rgba(0,0,0,0.55)",
        }}
      >
        {label}
      </div>
    </div>
  );
};
