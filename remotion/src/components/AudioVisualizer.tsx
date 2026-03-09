import React, { useMemo } from "react";
import {
  createSmoothSvgPath,
  useWindowedAudioData,
  visualizeAudioWaveform,
} from "@remotion/media-utils";
import { AUDIO_VISUALIZER_LAYOUT, PROGRESS_COLORS } from "../constants";

type AudioVisualizerProps = {
  currentAudioSrc: string | null;
  previousAudioSrc: string | null;
  currentFrame: number;
  previousFrame: number;
  crossfadeProgress: number;
  fps: number;
};

const SAMPLE_COUNT = 45;
const AUDIO_WINDOW_SECONDS = .9;
const WAVEFORM_WINDOW_SECONDS = 0.9;
const SVG_VERTICAL_PADDING = 66;
const AMPLITUDE_SCALE = AUDIO_VISUALIZER_LAYOUT.HEIGHT * 1.1;
const STROKE_WIDTH = 5;

const buildFlatWaveform = () => Array.from({ length: SAMPLE_COUNT }, () => 0);

// Keep extra vertical room so louder peaks are visible while the baseline stays fixed.
const toPath = (waveform: number[]) => {
  const baselineY = AUDIO_VISUALIZER_LAYOUT.HEIGHT / 2 + SVG_VERTICAL_PADDING;
  const points = waveform.map((sample, index) => ({
    x: (index / (waveform.length - 1)) * AUDIO_VISUALIZER_LAYOUT.WIDTH,
    y: baselineY + sample * AMPLITUDE_SCALE,
  }));

  return createSmoothSvgPath({ points });
};

const WaveformSvg: React.FC<{ waveform: number[] }> = ({ waveform }) => {
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: AUDIO_VISUALIZER_LAYOUT.TOP,
        width: AUDIO_VISUALIZER_LAYOUT.WIDTH,
        height: AUDIO_VISUALIZER_LAYOUT.HEIGHT,
        transform: "translateX(-50%)",
        zIndex: AUDIO_VISUALIZER_LAYOUT.Z_INDEX,
        pointerEvents: "none",
      }}
    >
      <svg
        width={AUDIO_VISUALIZER_LAYOUT.WIDTH}
        height={AUDIO_VISUALIZER_LAYOUT.HEIGHT + SVG_VERTICAL_PADDING * 2}
        viewBox={`0 0 ${AUDIO_VISUALIZER_LAYOUT.WIDTH} ${
          AUDIO_VISUALIZER_LAYOUT.HEIGHT + SVG_VERTICAL_PADDING * 2
        }`}
        style={{ overflow: "visible" }}
      >
        <path
          d={toPath(waveform)}
          fill="none"
          stroke={PROGRESS_COLORS.FILL}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  currentAudioSrc,
  currentFrame,
  fps,
}) => {
  if (!currentAudioSrc) {
    return <WaveformSvg waveform={buildFlatWaveform()} />;
  }

  const clampedFrame = Math.max(0, currentFrame);
  const { audioData, dataOffsetInSeconds } = useWindowedAudioData({
    src: currentAudioSrc,
    frame: clampedFrame,
    fps,
    windowInSeconds: AUDIO_WINDOW_SECONDS,
  });

  const waveform = useMemo(() => {
    if (!audioData) {
      return buildFlatWaveform();
    }

    return visualizeAudioWaveform({
      fps,
      frame: clampedFrame,
      audioData,
      numberOfSamples: SAMPLE_COUNT,
      windowInSeconds: WAVEFORM_WINDOW_SECONDS,
      dataOffsetInSeconds,
    });
  }, [audioData, clampedFrame, dataOffsetInSeconds, fps]);

  return <WaveformSvg waveform={waveform} />;
};
