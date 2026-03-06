// Number of frames for fade-to-black transition between conversations
export const TRANSITION_FRAMES = 15;

// Intro hold before the first spoken line starts
export const INTRO_PREROLL_FRAMES = 6;

// Brief pause after each conversation transition before the next dialogue starts.
export const CONVERSATION_LEAD_IN_FRAMES = 4;

// Watermark display name
export const WATERMARK = "PAUSELOCK";

// Progress bar layout constants
export const PROGRESS_BAR_LAYOUT = {
  TOP: 122,
  PADDING_X: 72,
  BAR_HEIGHT: 20,
  DIVIDER_EXTRA_HEIGHT: 6,
  COLUMN_COUNT: 32,
  COLUMN_GAP: 6,
  DIVIDER_WIDTH: 4,
  DIVIDER_GAP: 10,
  DIVIDER_FLASH_FRAMES: 5,
} as const;

// Progress palette tuned to the avatar's greenish-blue tone.
export const PROGRESS_COLORS = {
  TRACK: "rgba(255,255,255,0.12)",
  FILL: "#b685ff",
  ACTIVE_SWEEP: "rgba(182,133,255,0.9)",
} as const;

/** Normalize a character name to a lookup key */
export const toKey = (character: string) =>
  character.toLowerCase().replace(/\s+/g, "_");

/** Aliases where the speaker name differs from the portrait filename */
const PORTRAIT_KEY_OVERRIDES: Record<string, string> = {
  mo: "mo_&_krill",
  krill: "mo_&_krill",
  viper: "vyper",
  doorman: "the_doorman",
};

/** Normalize a character name to its portrait filename (without extension) */
export const toPortraitKey = (character: string): string => {
  const key = toKey(character);
  return PORTRAIT_KEY_OVERRIDES[key] ?? key;
};

const QUIRKY_NAME_FILE_OVERRIDES: Record<string, string> = {
  mcginnis: "McGinnis_name.png",
};

/** Resolve portrait key to quirky name filename inside public/quirky_names */
export const toQuirkyNameFile = (portraitKey: string): string => {
  const key = toPortraitKey(portraitKey);
  const overridden = QUIRKY_NAME_FILE_OVERRIDES[key];
  if (overridden) {
    return overridden;
  }

  const titled = key
    .split("_")
    .map((segment) =>
      /^[a-z]/.test(segment)
        ? `${segment[0].toUpperCase()}${segment.slice(1)}`
        : segment
    )
    .join("_");

  return `${titled}_name.png`;
};
