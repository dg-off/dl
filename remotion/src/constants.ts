// Number of frames for fade-to-black transition between conversations
export const TRANSITION_FRAMES = 15;

// Watermark display name
export const WATERMARK = "PauseLock";

// Progress bar layout constants
export const PROGRESS_BAR_LAYOUT = { TOP: 80, PADDING: 72, HEIGHT: 12, GAP: 6 } as const;

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
