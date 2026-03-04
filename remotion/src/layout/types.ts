export type VisualLayer = 1 | 2 | 3;

export type RegionName =
  | "BG_IMAGE"
  | "CHAR_BG"
  | "BG_GRADIENT"
  | "BG_VIGNETTE"
  | "PROGRESS_BAR"
  | "POSTER_ROW"
  | "AUDIO_VISUALIZER"
  | "SUBTITLE_BOX"
  | "WATERMARK_ROW";

export type RegionBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type LayoutRegionConfig = {
  name: RegionName;
  layer: VisualLayer;
  box: RegionBox;
  visible: boolean;
  opacity: number;
};

export type LayoutUiConfig = {
  showGuides: boolean;
  showLabels: boolean;
  showLayer3: boolean;
  showLayer2: boolean;
  showLayer1: boolean;
};

export type TopoConfig = {
  enabled: boolean;
  showContours: boolean;
  opacityBack: number;
  opacityMid: number;
  opacityFront: number;
  contourSpacing: number;
  contourStrokeOpacity: number;
};

export type LayoutConfig = {
  regions: Record<RegionName, LayoutRegionConfig>;
  ui: LayoutUiConfig;
  topo: TopoConfig;
};

export type DebugConfig = {
  enableLayoutEditor?: boolean;
  showLayoutJsonPanel?: boolean;
};
