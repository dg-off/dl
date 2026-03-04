import type { CSSProperties } from "react";
import { PROGRESS_BAR_LAYOUT, Z_LAYER } from "../constants";
import { REGION_LAYER_MAP, REGION_ORDER } from "./region-meta";
import type {
  LayoutConfig,
  LayoutRegionConfig,
  LayoutUiConfig,
  RegionName,
  TopoConfig,
  VisualLayer,
} from "./types";

export const COMPOSITION_WIDTH = 1080;
export const COMPOSITION_HEIGHT = 1920;

const defaultRegionBoxes: Record<RegionName, LayoutRegionConfig["box"]> = {
  BG_IMAGE: { x: 0, y: 0, width: COMPOSITION_WIDTH, height: COMPOSITION_HEIGHT },
  CHAR_BG: { x: 0, y: 0, width: COMPOSITION_WIDTH, height: COMPOSITION_HEIGHT },
  BG_GRADIENT: { x: 0, y: 0, width: COMPOSITION_WIDTH, height: COMPOSITION_HEIGHT },
  BG_VIGNETTE: { x: 0, y: 0, width: COMPOSITION_WIDTH, height: COMPOSITION_HEIGHT },
  PROGRESS_BAR: {
    x: PROGRESS_BAR_LAYOUT.PADDING,
    y: PROGRESS_BAR_LAYOUT.TOP,
    width: COMPOSITION_WIDTH - PROGRESS_BAR_LAYOUT.PADDING * 2,
    height: PROGRESS_BAR_LAYOUT.HEIGHT,
  },
  POSTER_ROW: { x: 0, y: 0, width: COMPOSITION_WIDTH, height: 1160 },
  AUDIO_VISUALIZER: { x: 0, y: 1230, width: COMPOSITION_WIDTH, height: 130 },
  SUBTITLE_BOX: { x: 0, y: 1310, width: COMPOSITION_WIDTH, height: 530 },
  WATERMARK_ROW: { x: 0, y: 1820, width: COMPOSITION_WIDTH, height: 64 },
};

const defaultUi: LayoutUiConfig = {
  showGuides: false,
  showLabels: true,
  showLayer3: true,
  showLayer2: true,
  showLayer1: true,
};

const defaultTopo: TopoConfig = {
  enabled: true,
  showContours: true,
  opacityBack: 0.16,
  opacityMid: 0.24,
  opacityFront: 0.34,
  contourSpacing: 18,
  contourStrokeOpacity: 0.28,
};

const toRegion = (name: RegionName, layer: VisualLayer, opacity = 1): LayoutRegionConfig => ({
  name,
  layer,
  box: { ...defaultRegionBoxes[name] },
  visible: true,
  opacity,
});

export const createDefaultLayout = (): LayoutConfig => ({
  regions: {
    BG_IMAGE: toRegion("BG_IMAGE", REGION_LAYER_MAP.BG_IMAGE),
    CHAR_BG: toRegion("CHAR_BG", REGION_LAYER_MAP.CHAR_BG, 0.35),
    BG_GRADIENT: toRegion("BG_GRADIENT", REGION_LAYER_MAP.BG_GRADIENT),
    BG_VIGNETTE: toRegion("BG_VIGNETTE", REGION_LAYER_MAP.BG_VIGNETTE),
    PROGRESS_BAR: toRegion("PROGRESS_BAR", REGION_LAYER_MAP.PROGRESS_BAR),
    POSTER_ROW: toRegion("POSTER_ROW", REGION_LAYER_MAP.POSTER_ROW),
    AUDIO_VISUALIZER: toRegion("AUDIO_VISUALIZER", REGION_LAYER_MAP.AUDIO_VISUALIZER),
    SUBTITLE_BOX: toRegion("SUBTITLE_BOX", REGION_LAYER_MAP.SUBTITLE_BOX),
    WATERMARK_ROW: toRegion("WATERMARK_ROW", REGION_LAYER_MAP.WATERMARK_ROW),
  },
  ui: { ...defaultUi },
  topo: { ...defaultTopo },
});

export const normalizeLayout = (layout?: LayoutConfig): LayoutConfig => {
  const defaults = createDefaultLayout();
  if (!layout) {
    return defaults;
  }

  const regions = REGION_ORDER.reduce((acc, name) => {
    const current = layout.regions?.[name];
    const fallback = defaults.regions[name];
    acc[name] = {
      name,
      layer: current?.layer ?? fallback.layer,
      visible: current?.visible ?? fallback.visible,
      opacity: current?.opacity ?? fallback.opacity,
      box: {
        x: current?.box?.x ?? fallback.box.x,
        y: current?.box?.y ?? fallback.box.y,
        width: current?.box?.width ?? fallback.box.width,
        height: current?.box?.height ?? fallback.box.height,
      },
    };
    return acc;
  }, {} as LayoutConfig["regions"]);

  return {
    regions,
    ui: {
      showGuides: layout.ui?.showGuides ?? defaults.ui.showGuides,
      showLabels: layout.ui?.showLabels ?? defaults.ui.showLabels,
      showLayer3: layout.ui?.showLayer3 ?? defaults.ui.showLayer3,
      showLayer2: layout.ui?.showLayer2 ?? defaults.ui.showLayer2,
      showLayer1: layout.ui?.showLayer1 ?? defaults.ui.showLayer1,
    },
    topo: {
      enabled: layout.topo?.enabled ?? defaults.topo.enabled,
      showContours: layout.topo?.showContours ?? defaults.topo.showContours,
      opacityBack: layout.topo?.opacityBack ?? defaults.topo.opacityBack,
      opacityMid: layout.topo?.opacityMid ?? defaults.topo.opacityMid,
      opacityFront: layout.topo?.opacityFront ?? defaults.topo.opacityFront,
      contourSpacing: layout.topo?.contourSpacing ?? defaults.topo.contourSpacing,
      contourStrokeOpacity:
        layout.topo?.contourStrokeOpacity ?? defaults.topo.contourStrokeOpacity,
    },
  };
};

export const layerToggleKey = (layer: VisualLayer): keyof LayoutUiConfig => {
  if (layer === 3) {
    return "showLayer3";
  }
  if (layer === 2) {
    return "showLayer2";
  }
  return "showLayer1";
};

export const isLayerVisible = (layout: LayoutConfig, layer: VisualLayer): boolean => {
  return layout.ui[layerToggleKey(layer)];
};

export const shouldRenderRegion = (
  layout: LayoutConfig,
  name: RegionName,
  respectVisibility: boolean
): boolean => {
  if (!respectVisibility) {
    return true;
  }
  const region = layout.regions[name];
  return region.visible && isLayerVisible(layout, region.layer);
};

export const toAbsoluteStyle = (
  box: LayoutRegionConfig["box"],
  extra: CSSProperties = {}
): CSSProperties => ({
  position: "absolute",
  left: box.x,
  top: box.y,
  width: box.width,
  height: box.height,
  ...extra,
});

export const zForRegion = (layout: LayoutConfig, name: RegionName): number =>
  Z_LAYER[layout.regions[name].layer];

export const layerOpacity = (layout: LayoutConfig, layer: VisualLayer): number => {
  if (layer === 3) return layout.topo.opacityBack;
  if (layer === 2) return layout.topo.opacityMid;
  return layout.topo.opacityFront;
};
