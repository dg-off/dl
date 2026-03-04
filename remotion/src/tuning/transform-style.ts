import type { CSSProperties } from "react";
import type { ParentRelativeTransform } from "./types";

const safe = (value: number, fallback: number): number =>
  Number.isFinite(value) ? value : fallback;

export const toParentRelativeImageTransform = (
  transform: ParentRelativeTransform
): string => {
  const scale = Math.max(0.001, safe(transform.scale, 1));
  const xPct = safe(transform.xPct, 50);
  const yPct = safe(transform.yPct, 0);

  const tx = ((50 - xPct) * (scale - 1)) / scale;
  const ty = (-yPct * (scale - 1)) / scale;

  return `scale(${scale}) translateX(${tx}%) translateY(${ty}%)`;
};

export const toParentRelativeRotationStyle = (
  transform: ParentRelativeTransform
): CSSProperties => ({
  transform: `rotate(${safe(transform.rotationDeg, 0)}deg)`,
  transformOrigin: "center center",
});

export const toParentRelativeDivTransform = (
  transform: ParentRelativeTransform
): CSSProperties => {
  const xPct = safe(transform.xPct, 50);
  const yPct = safe(transform.yPct, 50);
  const scale = Math.max(0.001, safe(transform.scale, 1));
  const rotationDeg = safe(transform.rotationDeg, 0);

  return {
    left: `${xPct}%`,
    top: `${yPct}%`,
    transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotationDeg}deg)`,
    transformOrigin: "center center",
  };
};
