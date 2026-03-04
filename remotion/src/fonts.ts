import { loadFont } from "@remotion/fonts";
import { FOREVS_BOLD_DATA_URL } from "./fontData";

// Font is embedded as a base64 data URL, so no network request is needed.
loadFont({
  family: "ForeversBold",
  url: FOREVS_BOLD_DATA_URL,
  format: "opentype",
  weight: "700",
  display: "block",
});

export const SUBTITLE_FONT = "ForeversBold, sans-serif";
