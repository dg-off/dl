import type { VisualLayer } from "./layout/types";

// Number of frames for fade-to-black transition between conversations
export const TRANSITION_FRAMES = 15;

// Z-index per visual layer (layer 3 = back, layer 1 = front)
export const Z_LAYER: Record<VisualLayer, number> = { 3: 0, 2: 10, 1: 20 };

// Base RGB colors for topographic debug overlay per layer
export const TOPO_BASE_RGB: Record<VisualLayer, [number, number, number]> = {
  3: [255, 191, 227],
  2: [255, 130, 191],
  1: [206, 45, 126],
};

// Pink color for layout guide overlay borders and labels
export const GUIDE_PINK = "rgba(255, 20, 147, 0.95)";

// Watermark display name
export const WATERMARK = "PauseLock";

// Progress bar layout constants (shared between ProgressBar.tsx and default-layout.ts)
export const PROGRESS_BAR_LAYOUT = { TOP: 80, PADDING: 72, HEIGHT: 12, GAP: 6 } as const;

/** Per-character accent colors used for portrait glow and name label */
export const CHARACTER_COLORS: Record<string, string> = {
  abrams: "#ef4444",
  apollo: "#60a5fa",
  bebop: "#8b5cf6",
  billy: "#f59e0b",
  calico: "#f472b6",
  celeste: "#38bdf8",
  drifter: "#84cc16",
  dynamo: "#10b981",
  graves: "#a3a3a3",
  grey_talon: "#c084fc",
  haze: "#ec4899",
  holliday: "#f59e0b",
  infernus: "#f97316",
  ivy: "#22c55e",
  kelvin: "#38bdf8",
  lady_geist: "#c084fc",
  lash: "#6b7280",
  mcginnis: "#84cc16",
  mina: "#f9a8d4",
  mirage: "#fbbf24",
  paradox: "#06b6d4",
  seven: "#facc15",
  shiv: "#f87171",
  vindicta: "#fb923c",
  viscous: "#a78bfa",
  warden: "#94a3b8",
  yamato: "#e11d48",
};

export const DEFAULT_CHARACTER_COLOR = "#a78bfa";

/** Normalize a character name to a lookup key */
export const toKey = (character: string) =>
  character.toLowerCase().replace(/\s+/g, "_");

/** Aliases where the speaker name differs from the portrait filename */
const PORTRAIT_KEY_OVERRIDES: Record<string, string> = {
  mo: "mo_&_krill",
  krill: "mo_&_krill",
};

/** Normalize a character name to its portrait filename (without extension) */
export const toPortraitKey = (character: string): string => {
  const key = toKey(character);
  return PORTRAIT_KEY_OVERRIDES[key] ?? key;
};
