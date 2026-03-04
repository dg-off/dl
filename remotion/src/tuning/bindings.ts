import type { ParentRelativeTransform } from "./types";

export type TunableBinding<TConfig> = {
  id: string;
  label: string;
  read: (config: TConfig, key: string, slotIndex: number) => ParentRelativeTransform;
  write: (
    config: TConfig,
    key: string,
    slotIndex: number,
    value: ParentRelativeTransform
  ) => TConfig;
};

export type TunableBindingRegistry<TConfig> = Record<string, TunableBinding<TConfig>>;
