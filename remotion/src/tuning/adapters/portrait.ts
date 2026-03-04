import { DEFAULT_PORTRAIT_SETTINGS } from "../../types";
import type { PortraitSettings } from "../../types";
import { DEFAULT_PARENT_RELATIVE_TRANSFORM } from "../types";
import type { ParentRelativeTransform } from "../types";

export const portraitSettingsToParentRelativeTransform = (
  settings: PortraitSettings
): ParentRelativeTransform => ({
  xPct: settings.objectPositionX,
  yPct: settings.objectPositionY,
  scale: settings.scale,
  rotationDeg: settings.rotation,
  visible: true,
});

export const parentRelativeTransformToPortraitSettings = (
  transform: ParentRelativeTransform,
  fallback: PortraitSettings = DEFAULT_PORTRAIT_SETTINGS
): PortraitSettings => ({
  objectPositionX: Number.isFinite(transform.xPct)
    ? transform.xPct
    : Number.isFinite(DEFAULT_PARENT_RELATIVE_TRANSFORM.xPct)
      ? DEFAULT_PARENT_RELATIVE_TRANSFORM.xPct
      : fallback.objectPositionX,
  objectPositionY: Number.isFinite(transform.yPct)
    ? transform.yPct
    : Number.isFinite(DEFAULT_PARENT_RELATIVE_TRANSFORM.yPct)
      ? DEFAULT_PARENT_RELATIVE_TRANSFORM.yPct
      : fallback.objectPositionY,
  scale: Number.isFinite(transform.scale)
    ? transform.scale
    : Number.isFinite(DEFAULT_PARENT_RELATIVE_TRANSFORM.scale)
      ? DEFAULT_PARENT_RELATIVE_TRANSFORM.scale
      : fallback.scale,
  rotation: Number.isFinite(transform.rotationDeg)
    ? transform.rotationDeg
    : Number.isFinite(DEFAULT_PARENT_RELATIVE_TRANSFORM.rotationDeg)
      ? DEFAULT_PARENT_RELATIVE_TRANSFORM.rotationDeg
      : fallback.rotation,
});
