import { useEffect, useMemo, useRef, useState } from "react";
import { getRemotionEnvironment } from "remotion";
import { createDefaultLayout, normalizeLayout } from "../layout/default-layout";
import {
  LAYOUT_CHANNEL_NAME,
  LAYOUT_STORAGE_KEY,
  LAYOUT_SYNC_SOURCE_DASHBOARD,
  LAYOUT_SYNC_SOURCE_STUDIO,
  createLayoutCurrentMessage,
  createLayoutRequestCurrentMessage,
  isLayoutSyncMessage,
  loadLayoutFromStorage,
  parseStoredLayout,
  saveLayoutToStorage,
} from "../layout/live-layout";
import type { DebugConfig, LayoutConfig } from "../layout/types";

export function useLayoutSync(layout?: LayoutConfig, debug?: DebugConfig) {
  const env = getRemotionEnvironment();
  const normalizedLayout = useMemo(() => normalizeLayout(layout ?? createDefaultLayout()), [layout]);

  const [editorLayout, setEditorLayout] = useState<LayoutConfig>(() => {
    if (env.isRendering) {
      return normalizedLayout;
    }
    return loadLayoutFromStorage(normalizedLayout);
  });
  const editorLayoutRef = useRef(editorLayout);

  useEffect(() => {
    editorLayoutRef.current = editorLayout;
  }, [editorLayout]);

  useEffect(() => {
    if (env.isRendering) {
      setEditorLayout(normalizedLayout);
      return;
    }
    setEditorLayout(loadLayoutFromStorage(normalizedLayout));
  }, [env.isRendering, normalizedLayout]);

  useEffect(() => {
    if (env.isRendering || typeof window === "undefined") {
      return;
    }

    const applyIncomingLayout = (incomingLayout: LayoutConfig) => {
      const next = normalizeLayout(incomingLayout);
      setEditorLayout(next);
      saveLayoutToStorage(next);
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key !== LAYOUT_STORAGE_KEY) {
        return;
      }
      setEditorLayout(parseStoredLayout(event.newValue, normalizedLayout));
    };

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel(LAYOUT_CHANNEL_NAME);
      channel.onmessage = (event: MessageEvent<unknown>) => {
        if (!isLayoutSyncMessage(event.data)) {
          return;
        }
        const message = event.data;

        if (message.type === "layout:request-current") {
          if (message.source === LAYOUT_SYNC_SOURCE_DASHBOARD) {
            channel?.postMessage(
              createLayoutCurrentMessage(LAYOUT_SYNC_SOURCE_STUDIO, editorLayoutRef.current)
            );
          }
          return;
        }

        if (message.source !== LAYOUT_SYNC_SOURCE_DASHBOARD) {
          return;
        }

        applyIncomingLayout(message.layout);
      };

      channel.postMessage(createLayoutRequestCurrentMessage(LAYOUT_SYNC_SOURCE_STUDIO));
    }

    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      channel?.close();
    };
  }, [env.isRendering, normalizedLayout]);

  useEffect(() => {
    if (env.isRendering) {
      return;
    }
    saveLayoutToStorage(editorLayout);
  }, [editorLayout, env.isRendering]);

  return {
    effectiveLayout: env.isRendering ? normalizedLayout : editorLayout,
    layoutEditorEnabled: !env.isRendering && (debug?.enableLayoutEditor ?? env.isStudio),
  };
}
