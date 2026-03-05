import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { PortraitCard } from "./components/PortraitCard";
import { toKey, toPortraitKey } from "./constants";
import { DEFAULT_PORTRAIT_SETTINGS, getSlotSettings, type Props } from "./types";
import portraitTuneData from "../../data/portrait-tune.json";

type PortraitTune = {
  enabled?: boolean;
  charKey?: string;
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
};

export const DeadlockShort: React.FC<Props> = ({ portraitConfig = {} }) => {
  const tune = portraitTuneData as PortraitTune;
  const tuneCharKey = typeof tune.charKey === "string" ? toKey(tune.charKey) : "";
  const tuneEnabled = Boolean(tune.enabled && tuneCharKey);
  const leftKey = tuneEnabled ? tuneCharKey : "holliday";
  const rightKey = tuneEnabled ? tuneCharKey : "paradox";
  const leftSrc = staticFile(`portraits/${toPortraitKey(leftKey)}.png`);
  const rightSrc = staticFile(`portraits/${toPortraitKey(rightKey)}.png`);
  const leftBase = getSlotSettings(portraitConfig, leftKey);
  const rightBase = getSlotSettings(portraitConfig, rightKey);
  const tunedSettings = {
    x: Number.isFinite(tune.x) ? (tune.x as number) : DEFAULT_PORTRAIT_SETTINGS.x,
    y: Number.isFinite(tune.y) ? (tune.y as number) : DEFAULT_PORTRAIT_SETTINGS.y,
    scale: Number.isFinite(tune.scale)
      ? (tune.scale as number)
      : DEFAULT_PORTRAIT_SETTINGS.scale,
    rotation: Number.isFinite(tune.rotation)
      ? (tune.rotation as number)
      : DEFAULT_PORTRAIT_SETTINGS.rotation,
  };
  const leftSettings = tuneEnabled ? tunedSettings : leftBase;
  const rightSettings = tuneEnabled ? tunedSettings : rightBase;

  return (
    <AbsoluteFill style={{ background: "#0b0f17" }}>
      <PortraitCard
        src={leftSrc}
        x={100}
        y={380}
        width={430}
        height={680}
        frameInset={{ top: 120, right: 28, bottom: 70, left: 28 }}
        imgX={leftSettings.x}
        imgY={leftSettings.y}
        imgScale={leftSettings.scale}
        rotation={leftSettings.rotation}
        bgOpacity={0.55}
        fgOpacity={1}
        frameRadius={22}
      />

      <PortraitCard
        src={rightSrc}
        x={560}
        y={380}
        width={430}
        height={680}
        frameInset={{ top: 120, right: 28, bottom: 70, left: 28 }}
        imgX={rightSettings.x}
        imgY={rightSettings.y}
        imgScale={rightSettings.scale}
        rotation={rightSettings.rotation}
        bgOpacity={0.0}
        fgOpacity={1}
        frameRadius={22}
      />
    </AbsoluteFill>
  );
};
