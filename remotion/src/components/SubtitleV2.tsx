import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Sequence } from "remotion";
import { SUBTITLE_FONT } from "../fonts";

type Props = {
  text: string;
  duration: number; // seconds
};

// Punctuation-aware greedy chunker.
//
// Hard breaks  (: . ! ?)  — always flush the current chunk right after the
//   word that carries the punctuation.  "In that case: Welcome to New York"
//   → ["In that case:", "Welcome to New York"]
//
// Soft breaks  (, ;)  — flush only when the current chunk already has ≥ 3
//   words, so short interjections ("Oh no, ...") stay together but longer
//   clauses ("First of all, we need to...") split at the comma.
//
// Character limit  (maxChars)  — greedy fallback: flush before adding a word
//   that would make the line too long, keeping each line roughly 3–5 words.
function chunkText(text: string, maxChars = 22): string[] {
  const words = text.trim().split(/\s+/);
  const chunks: string[] = [];
  let current = "";

  const flush = () => {
    if (current) {
      chunks.push(current);
      current = "";
    }
  };

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;

    // Greedy overflow: flush before adding if the line would get too long
    if (current && candidate.length > maxChars) {
      flush();
      current = word;
    } else {
      current = candidate;
    }

    // Hard break: colon / sentence-ending punctuation → flush immediately
    if (/[:.!?…]$/.test(word)) {
      flush();
      // Soft break: comma / semicolon → flush only if chunk is already 3+ words
    } else if (/[,;]$/.test(word)) {
      if (current.trim().split(/\s+/).length >= 3) {
        flush();
      }
    }
  }

  flush();
  return chunks;
}

// Single line that fades in when it first appears.
const ChunkLine: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, Math.round(fps * 0.08)], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        textAlign: "center",
        fontFamily: SUBTITLE_FONT,
        fontSize: 64,
        fontWeight: 700,
        letterSpacing: "0.02em",
        lineHeight: 1.25,
        color: "#ffffff",
        textShadow: [
          "0 2px 0 rgba(0,0,0,0.95)",
          "0 4px 24px rgba(0,0,0,0.95)",
          "0 0 80px rgba(0,0,0,0.7)",
        ].join(", "),
        WebkitTextStroke: "1.5px rgba(0,0,0,0.6)",
      }}
    >
      {text}
    </div>
  );
};

export const SubtitleV2: React.FC<Props> = ({ text, duration }) => {
  const { fps } = useVideoConfig();

  const chunks = chunkText(text);

  // Distribute duration proportionally by character count so longer chunks
  // stay on screen a bit longer than short ones.
  const charCounts = chunks.map((c) =>
    Math.max(c.replace(/\s/g, "").length, 2)
  );
  const totalChars = charCounts.reduce((a, b) => a + b, 0);

  // Shift each chunk's start slightly early so captions never lag behind speech.
  // Previous chunk's duration is trimmed to match — no overlap.
  const ANTICIPATION_FRAMES = 2; // ~100ms at 30fps

  let cumFrames = 0;
  const sequences: Array<{ chunk: string; from: number; dur: number }> = [];

  for (let i = 0; i < chunks.length; i++) {
    const naturalDur = Math.max(
      1,
      Math.round((charCounts[i] / totalChars) * duration * fps)
    );
    const from = i === 0 ? 0 : Math.max(0, cumFrames - ANTICIPATION_FRAMES);

    // Trim the previous chunk so it ends exactly when this one starts
    if (i > 0) {
      sequences[i - 1].dur = from - sequences[i - 1].from;
    }

    cumFrames += naturalDur;
    sequences.push({ chunk: chunks[i], from, dur: naturalDur });
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        paddingTop: 100,
        paddingInline: 72,
      }}
    >
      {sequences.map(({ chunk, from, dur }, i) => (
        <Sequence key={i} from={from} durationInFrames={dur} layout="none">
          <ChunkLine text={chunk} />
        </Sequence>
      ))}
    </div>
  );
};
