import type { PortraitCharConfig, PortraitConfig } from "../types";
import {
  DEFAULT_PORTRAIT_CHAR_CONFIG,
  DEFAULT_PORTRAIT_SETTINGS,
} from "../types";
import type { TunableBindingRegistry } from "./bindings";
import {
  parentRelativeTransformToPortraitSettings,
  portraitSettingsToParentRelativeTransform,
} from "./adapters/portrait";
import type { ParentRelativeTransform } from "./types";

const slotKey = (slotIndex: number): "left" | "right" =>
  slotIndex === 0 ? "left" : "right";

const readSlot = (
  config: PortraitConfig,
  key: string,
  slotIndex: number
) => {
  const entry = config[key] ?? DEFAULT_PORTRAIT_CHAR_CONFIG;
  const selected = slotKey(slotIndex) === "left" ? entry.left : entry.right;
  return portraitSettingsToParentRelativeTransform(selected ?? DEFAULT_PORTRAIT_SETTINGS);
};

const writeSlot = (
  config: PortraitConfig,
  key: string,
  slotIndex: number,
  transform: ParentRelativeTransform
): PortraitConfig => {
  const entry: PortraitCharConfig = config[key] ?? DEFAULT_PORTRAIT_CHAR_CONFIG;
  const side = slotKey(slotIndex);
  const nextSideSettings = parentRelativeTransformToPortraitSettings(transform);

  return {
    ...config,
    [key]: {
      left: side === "left" ? nextSideSettings : entry.left,
      right: side === "right" ? nextSideSettings : entry.right,
    },
  };
};

export const PORTRAIT_TUNABLE_BINDINGS: TunableBindingRegistry<PortraitConfig> = {
  "character.poster.shared": {
    id: "character.poster.shared",
    label: "Character Poster",
    read: readSlot,
    write: writeSlot,
  },
  "character.background.shared": {
    id: "character.background.shared",
    label: "Character Background",
    read: readSlot,
    write: writeSlot,
  },
};
