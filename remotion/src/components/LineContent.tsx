import React from "react";
import { Audio } from "@remotion/media";
import { useCurrentFrame } from "remotion";
import { shouldRenderRegion, toAbsoluteStyle, zForRegion } from "../layout/default-layout";
import type { LayoutConfig } from "../layout/types";
import type { DialogueLine } from "../types";
import { resolveAudio } from "../utils/conversation";
import { AudioVisualizer } from "./AudioVisualizer";
import { CharacterPosterV3 } from "./CharacterPosterV3";
import { SubtitleV2 } from "./SubtitleV2";

type Props = {
  line: DialogueLine;
  participants: string[];
  layout: LayoutConfig;
  respectVisibility: boolean;
};

export const LineContent: React.FC<Props> = ({ line, participants, layout, respectVisibility }) => {
  const frame = useCurrentFrame();
  const audioSrc = resolveAudio(line.audioUrl);
  const posterGap = participants.length > 2 ? 28 : 64;
  const posterScale = participants.length > 2 ? 0.74 : 1;

  return (
    <>
      <Audio src={audioSrc} />

      {shouldRenderRegion(layout, "POSTER_ROW", respectVisibility) ? (
        <div
          data-layer="POSTER_ROW"
          style={toAbsoluteStyle(layout.regions.POSTER_ROW.box, {
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            gap: posterGap,
            paddingInline: 32,
            zIndex: zForRegion(layout, "POSTER_ROW"),
          })}
        >
          {participants.map((character, idx) => (
            <CharacterPosterV3
              key={character}
              character={character}
              isActive={character === line.character}
              sizeScale={posterScale}
              slotIndex={idx}
            />
          ))}
        </div>
      ) : null}

      {shouldRenderRegion(layout, "AUDIO_VISUALIZER", respectVisibility) ? (
        <div
          data-layer="AUDIO_VISUALIZER"
          style={toAbsoluteStyle(layout.regions.AUDIO_VISUALIZER.box, {
            display: "flex",
            alignItems: "center",
            zIndex: zForRegion(layout, "AUDIO_VISUALIZER"),
          })}
        >
          <AudioVisualizer src={audioSrc} frame={frame} color="rgba(255,255,255,0.82)" />
        </div>
      ) : null}

      {shouldRenderRegion(layout, "SUBTITLE_BOX", respectVisibility) ? (
        <div
          data-layer="SUBTITLE_BOX"
          style={toAbsoluteStyle(layout.regions.SUBTITLE_BOX.box, {
            zIndex: zForRegion(layout, "SUBTITLE_BOX"),
          })}
        >
          <SubtitleV2 text={line.text} duration={line.duration} />
        </div>
      ) : null}
    </>
  );
};
