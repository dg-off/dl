import React from "react";
import { useWindowedAudioData, visualizeAudio } from "@remotion/media-utils";
import { useVideoConfig, interpolate } from "remotion";

// frame is passed from the parent — do NOT call useCurrentFrame() here
type Props = {
  src: string;
  frame: number;
  color: string;
};

const SVG_W = 450;
const SVG_H = 110;
const NUM_BINS = 64;
const MAX_AMPLITUDE = SVG_H * 0.46;

// Power-curve boost: amplifies quiet speech signals into visible spikes.
// e.g. raw 0.05 → boosted 0.24,  raw 0.15 → boosted 0.44,  raw 0.3 → 0.62
const boost = (y: number) => Math.pow(Math.abs(y), 0.42);

export const AudioVisualizer: React.FC<Props> = ({ src, frame, color }) => {
  const { fps } = useVideoConfig();
  const center = SVG_H / 2;

  const { audioData, dataOffsetInSeconds } = useWindowedAudioData({
    src,
    frame,
    fps,
    windowInSeconds: 10,
  });

  const fadeIn = interpolate(frame, [0, Math.round(fps * 0.3)], [0, 1], {
    extrapolateRight: "clamp",
  });

  let upperPoints: string;

  if (audioData) {
    const freqs = visualizeAudio({
      fps,
      frame,
      audioData,
      numberOfSamples: NUM_BINS,
      optimizeFor: "speed",
      dataOffsetInSeconds,
    });

    upperPoints = freqs
      .map((freq, i) => {
        const x = (i / (freqs.length - 1)) * SVG_W;
        const y = center - boost(freq) * MAX_AMPLITUDE;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  } else {
    // Flat baseline while audio data loads
    upperPoints = `0,${center} ${SVG_W},${center}`;
  }

  return (
    <div
      style={{
        width: "100%",
        height: SVG_H,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: fadeIn,
      }}
    >
      <svg
        width={SVG_W}
        height={SVG_H}
        style={{ overflow: "visible", display: "block" }}
      >
        {/* Faint baseline rule */}
        <line
          x1={0}
          y1={center}
          x2={SVG_W}
          y2={center}
          stroke={color}
          strokeWidth={0.5}
          strokeOpacity={0.15}
        />

        {/* ── Upper arm ────────────────────────────────── */}
        {/* Outer glow */}
        <polyline
          points={upperPoints}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeOpacity={0.1}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Mid glow */}
        <polyline
          points={upperPoints}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeOpacity={0.25}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Sharp line */}
        <polyline
          points={upperPoints}
          fill="none"
          stroke={color}
          strokeWidth={1.8}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* ── Lower arm — mirror of upper via SVG transform ─ */}
        {/* Mirror: flip Y around the center line.
            scale(1,-1) flips vertically, translate(0,-SVG_H) puts it back. */}
        <g transform={`scale(1,-1) translate(0,-${SVG_H})`}>
          {/* Outer glow */}
          <polyline
            points={upperPoints}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeOpacity={0.1}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Mid glow */}
          <polyline
            points={upperPoints}
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeOpacity={0.25}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Sharp line */}
          <polyline
            points={upperPoints}
            fill="none"
            stroke={color}
            strokeWidth={1.8}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
};
