import { useEffect, useRef, useState } from "react";
import { getRemotionEnvironment } from "remotion";
import {
  PORTRAIT_CHANNEL_NAME,
  PORTRAIT_STORAGE_KEY,
  createPortraitCurrentMessage,
  isPortraitSyncMessage,
  loadPortraitsFromStorage,
  normalizePortraitConfig,
  savePortraitsToStorage,
} from "../layout/portrait-sync";
import type { PortraitConfig } from "../types";
import { portraitSettingsToParentRelativeTransform } from "../tuning/adapters/portrait";
import { PORTRAIT_TUNABLE_BINDINGS } from "../tuning/portrait-bindings";

export type PortraitSyncResult = {
  portraitConfig: PortraitConfig;
  previewCharKey: string | null;
  bgVisibility: { left: boolean; right: boolean };
  portraitVisibility: { left: boolean; right: boolean };
};

export function usePortraitSync(staticConfig: PortraitConfig): PortraitSyncResult {
  const env = getRemotionEnvironment();
  const posterBinding = PORTRAIT_TUNABLE_BINDINGS["character.poster.shared"];

  const [config, setConfig] = useState<PortraitConfig>(() => {
    if (env.isRendering) return staticConfig;
    return normalizePortraitConfig(loadPortraitsFromStorage(staticConfig));
  });
  const configRef = useRef(config);

  const [previewCharKey, setPreviewCharKey] = useState<string | null>(null);
  const [bgVisibility, setBgVisibility] = useState({ left: true, right: true });
  const [portraitVisibility, setPortraitVisibility] = useState({ left: true, right: true });

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    if (env.isRendering) {
      setConfig(staticConfig);
      return;
    }
    setConfig(normalizePortraitConfig(loadPortraitsFromStorage(staticConfig)));
  }, [env.isRendering, staticConfig]);

  useEffect(() => {
    if (env.isRendering || typeof window === "undefined") return;

    const onStorage = (event: StorageEvent) => {
      if (event.key !== PORTRAIT_STORAGE_KEY) return;
      if (!event.newValue) return;
      try {
        const parsed = JSON.parse(event.newValue) as PortraitConfig;
        setConfig((prev) => normalizePortraitConfig({ ...prev, ...parsed }));
      } catch {
        // ignore
      }
    };

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel(PORTRAIT_CHANNEL_NAME);
      channel.onmessage = (event: MessageEvent<unknown>) => {
        if (!isPortraitSyncMessage(event.data)) return;
        const msg = event.data;

        if (msg.type === "portrait:request-current") {
          channel?.postMessage(createPortraitCurrentMessage(configRef.current));
          return;
        }

        if (msg.type === "portrait:update") {
          setConfig((prev) => {
            const nextLeft = posterBinding.write(
              prev,
              msg.charKey,
              0,
              portraitSettingsToParentRelativeTransform(msg.charConfig.left)
            );
            const next = posterBinding.write(
              nextLeft,
              msg.charKey,
              1,
              portraitSettingsToParentRelativeTransform(msg.charConfig.right)
            );
            savePortraitsToStorage(next);
            return next;
          });
          return;
        }

        if (msg.type === "portrait:set-all") {
          const next = normalizePortraitConfig({ ...staticConfig, ...msg.config });
          setConfig(next);
          savePortraitsToStorage(next);
          return;
        }

        if (msg.type === "portrait:preview-character") {
          setPreviewCharKey(msg.charKey);
          return;
        }

        if (msg.type === "portrait:preview-bg-visibility") {
          setBgVisibility({ left: msg.leftVisible, right: msg.rightVisible });
          return;
        }

        if (msg.type === "portrait:preview-portrait-visibility") {
          setPortraitVisibility({ left: msg.leftVisible, right: msg.rightVisible });
          return;
        }
      };
    }

    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      channel?.close();
    };
  }, [env.isRendering, staticConfig]);

  return {
    portraitConfig: env.isRendering ? staticConfig : config,
    previewCharKey: env.isRendering ? null : previewCharKey,
    bgVisibility: env.isRendering ? { left: true, right: true } : bgVisibility,
    portraitVisibility: env.isRendering ? { left: true, right: true } : portraitVisibility,
  };
}
