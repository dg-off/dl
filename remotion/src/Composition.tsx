import React, { useMemo } from "react";
import { AbsoluteFill, Series, useCurrentFrame, useVideoConfig } from "remotion";
import { Background } from "./components/Background";
import { CharacterBackground } from "./components/CharacterBackground";
import { CharacterPosterV3 } from "./components/CharacterPosterV3";
import { ConversationTransition } from "./components/ConversationTransition";
import { LineContent } from "./components/LineContent";
import { ProgressBar } from "./components/ProgressBar";
import { Watermark } from "./components/Watermark";
import { LayoutGuideOverlay } from "./components/debug/LayoutGuideOverlay";
import { TopoPlanesOverlay } from "./components/debug/TopoPlanesOverlay";
import { TRANSITION_FRAMES } from "./constants";
import { PortraitConfigContext } from "./context/PortraitConfigContext";
import { useActiveCharacter } from "./hooks/useActiveCharacter";
import { useLayoutSync } from "./hooks/useLayoutSync";
import { usePortraitSync } from "./hooks/usePortraitSync";
import { shouldRenderRegion, toAbsoluteStyle, zForRegion } from "./layout/default-layout";
import type { Props } from "./types";
import { DEFAULT_PORTRAIT_CHAR_CONFIG } from "./types";
import { getConvBoundaries, getParticipants } from "./utils/conversation";

export const DeadlockShort: React.FC<Props> = ({ conversations, layout, debug, portraitConfig }) => {
  const { fps } = useVideoConfig();
  const { effectiveLayout, layoutEditorEnabled } = useLayoutSync(layout, debug);
  const respectVisibility = layoutEditorEnabled;

  const { portraitConfig: effectivePortraitConfig, previewCharKey, bgVisibility, portraitVisibility } = usePortraitSync(
    portraitConfig ?? {}
  );

  const convBoundaries = useMemo(
    () => getConvBoundaries(conversations, TRANSITION_FRAMES),
    [conversations]
  );

  const frame = useCurrentFrame();
  const { charKey, participants: charParticipants } = useActiveCharacter(
    frame,
    conversations,
    convBoundaries
  );

  if (previewCharKey) {
    const previewCharConfig = effectivePortraitConfig[previewCharKey] ?? DEFAULT_PORTRAIT_CHAR_CONFIG;
    return (
      <PortraitConfigContext.Provider value={effectivePortraitConfig}>
        <AbsoluteFill style={{ fontFamily: "sans-serif", background: "#06101e" }}>
          {bgVisibility.left && (
            <CharacterBackground
              charKey={previewCharKey}
              participants={[previewCharKey, "__preview__"]}
              layout={effectiveLayout}
              respectVisibility={false}
            />
          )}
          {bgVisibility.right && (
            <CharacterBackground
              charKey={previewCharKey}
              participants={["__preview__", previewCharKey]}
              layout={effectiveLayout}
              respectVisibility={false}
            />
          )}
          <div
            style={toAbsoluteStyle(effectiveLayout.regions.POSTER_ROW.box, {
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              gap: 64,
              paddingInline: 32,
              zIndex: zForRegion(effectiveLayout, "POSTER_ROW"),
            })}
          >
            {portraitVisibility.left && (
              <CharacterPosterV3 character={previewCharKey} isActive={true} slotIndex={0} />
            )}
            {portraitVisibility.right && (
              <CharacterPosterV3 character={previewCharKey} isActive={true} slotIndex={1} />
            )}
          </div>
          {portraitVisibility.left && (
            <div
              style={{
                position: "absolute",
                bottom: 80,
                left: 0,
                width: "50%",
                textAlign: "center",
                color: "rgba(255,255,255,0.55)",
                fontFamily: "monospace",
                fontSize: 20,
                zIndex: 30,
              }}
            >
              L · X:{previewCharConfig.left.objectPositionX} Y:{previewCharConfig.left.objectPositionY} S:{previewCharConfig.left.scale} R:{previewCharConfig.left.rotation}°
            </div>
          )}
          {portraitVisibility.right && (
            <div
              style={{
                position: "absolute",
                bottom: 80,
                right: 0,
                width: "50%",
                textAlign: "center",
                color: "rgba(255,255,255,0.55)",
                fontFamily: "monospace",
                fontSize: 20,
                zIndex: 30,
              }}
            >
              R · X:{previewCharConfig.right.objectPositionX} Y:{previewCharConfig.right.objectPositionY} S:{previewCharConfig.right.scale} R:{previewCharConfig.right.rotation}°
            </div>
          )}
        </AbsoluteFill>
      </PortraitConfigContext.Provider>
    );
  }

  return (
    <PortraitConfigContext.Provider value={effectivePortraitConfig}>
      <AbsoluteFill style={{ fontFamily: "sans-serif", background: "#06101e" }}>
        <Background layout={effectiveLayout} respectVisibility={respectVisibility} />
        <CharacterBackground
          charKey={charKey}
          participants={charParticipants}
          layout={effectiveLayout}
          respectVisibility={respectVisibility}
        />
        {layoutEditorEnabled ? <TopoPlanesOverlay layout={effectiveLayout} /> : null}

        {shouldRenderRegion(effectiveLayout, "PROGRESS_BAR", respectVisibility) ? (
          <div
            data-layer="PROGRESS_BAR"
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: zForRegion(effectiveLayout, "PROGRESS_BAR"),
            }}
          >
            <ProgressBar
              convBoundaries={convBoundaries}
              box={effectiveLayout.regions.PROGRESS_BAR.box}
            />
          </div>
        ) : null}

        <div data-layer="CONVERSATION_CONTENT" style={{ position: "absolute", inset: 0 }}>
          <Series>
            {conversations.flatMap((conv, i) => {
              const totalConvFrames = conv.lines.reduce((s, l) => s + (l.durationInFrames ?? 0), 0);
              const participants = getParticipants(conv.lines);

              const items: React.ReactNode[] = [
                <Series.Sequence
                  key={conv.conversationId + "-" + i}
                  durationInFrames={totalConvFrames}
                >
                  <Series>
                    {conv.lines.map((line) => (
                      <Series.Sequence
                        key={line.audioFile}
                        durationInFrames={line.durationInFrames!}
                        premountFor={fps}
                      >
                        <LineContent
                          line={line}
                          participants={participants}
                          layout={effectiveLayout}
                          respectVisibility={respectVisibility}
                        />
                      </Series.Sequence>
                    ))}
                  </Series>
                </Series.Sequence>,
              ];

              if (i < conversations.length - 1) {
                items.push(
                  <Series.Sequence key={`transition-${i}`} durationInFrames={TRANSITION_FRAMES}>
                    <ConversationTransition />
                  </Series.Sequence>
                );
              }

              return items;
            })}
          </Series>
        </div>

        <Watermark layout={effectiveLayout} respectVisibility={respectVisibility} />
        {layoutEditorEnabled ? <LayoutGuideOverlay layout={effectiveLayout} /> : null}
      </AbsoluteFill>
    </PortraitConfigContext.Provider>
  );
};
