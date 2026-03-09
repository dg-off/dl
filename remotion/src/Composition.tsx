import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ConversationProgressBar } from "./components/ConversationProgressBar";
import { PortraitCard } from "./components/PortraitCard";
import { ConversationTransitionOverlay } from "./components/ConversationTransitionOverlay";
import { WatermarkBadge } from "./components/WatermarkBadge";
import { AudioVisualizer } from "./components/AudioVisualizer";
import { SubtitleDisplay } from "./components/SubtitleDisplay";
import {
  CONVERSATION_LEAD_IN_FRAMES,
  INTRO_PREROLL_FRAMES,
  TRANSITION_FRAMES,
  WATERMARK,
} from "./constants";
import { toKey, toPortraitKey, toQuirkyNameFile } from "./constants";
import {
  getSlotSettings,
  type Conversation,
  type ConversationRange,
  type DialogueLine,
  type Props,
} from "./types";

const ACTIVE_BG_OPACITY = .8;
const INACTIVE_BG_OPACITY = 0;
const VISUALIZER_LINE_CROSSFADE_FRAMES = 8;

// Timeline model types
type FrameState = {
  participants: [string, string];
  activeSpeaker: string | null;
};

type ActivationEvent = {
  speakerKey: string;
  frame: number;
};

type TransitionWindow = {
  startFrame: number;
  endFrame: number;
};

type ActiveLineState = {
  currentLine: DialogueLine | null;
  previousLine: DialogueLine | null;
  currentLineLocalFrame: number;
  currentLineFrames: number;
  previousLineTailFrame: number;
  crossfadeProgress: number;
};

type AudioSegment = {
  from: number;
  durationInFrames: number;
  src: string;
};

const FALLBACK_PARTICIPANTS: [string, string] = ["holliday", "paradox"];

// Timeline helpers
const getParticipants = (conversation: Conversation): [string, string] => {
  const seen = new Set<string>();
  const participants: string[] = [];

  for (const line of conversation.lines) {
    const key = toKey(line.character);
    if (!seen.has(key)) {
      seen.add(key);
      participants.push(key);
    }
    if (participants.length === 2) {
      break;
    }
  }

  if (participants.length === 0) {
    return FALLBACK_PARTICIPANTS;
  }
  if (participants.length === 1) {
    return [participants[0], participants[0]];
  }

  return [participants[0], participants[1]];
};

const getLineDurationInFrames = (durationInFrames: number | undefined, duration: number, fps: number) => {
  if (typeof durationInFrames === "number" && Number.isFinite(durationInFrames)) {
    return Math.max(1, Math.ceil(durationInFrames));
  }

  return Math.max(1, Math.ceil(duration * fps));
};

const getLastSpeakerKey = (conversation: Conversation): string | null => {
  if (conversation.lines.length === 0) {
    return null;
  }
  return toKey(conversation.lines[conversation.lines.length - 1].character);
};

const getConversationRanges = (conversations: Conversation[], fps: number): ConversationRange[] => {
  const ranges: ConversationRange[] = [];
  let cursor = INTRO_PREROLL_FRAMES;

  for (let convIndex = 0; convIndex < conversations.length; convIndex++) {
    const conversation = conversations[convIndex];
    const startFrame = cursor;

    if (convIndex > 0) {
      cursor += CONVERSATION_LEAD_IN_FRAMES;
    }

    for (const line of conversation.lines) {
      cursor += getLineDurationInFrames(line.durationInFrames, line.duration, fps);
    }

    if (convIndex < conversations.length - 1) {
      // Keep transition frames inside the current conversation block so boundary
      // separators line up with the first frame of the next conversation.
      cursor += TRANSITION_FRAMES;
    }

    ranges.push({
      index: convIndex,
      startFrame,
      endFrame: cursor,
    });
  }

  return ranges;
};

const getFrameStateWithPreroll = (
  conversations: Conversation[],
  frame: number,
  fps: number
): FrameState => {
  if (conversations.length === 0) {
    return { participants: FALLBACK_PARTICIPANTS, activeSpeaker: null };
  }

  const initialParticipants = getParticipants(conversations[0]);
  if (frame < INTRO_PREROLL_FRAMES) {
    return { participants: initialParticipants, activeSpeaker: null };
  }

  // Convert a global frame into the dialogue timeline frame.
  const dialogueFrame = frame - INTRO_PREROLL_FRAMES;
  let cursor = 0;

  for (let convIndex = 0; convIndex < conversations.length; convIndex++) {
    const conversation = conversations[convIndex];
    const participants = getParticipants(conversation);

    if (convIndex > 0) {
      const leadInEnd = cursor + CONVERSATION_LEAD_IN_FRAMES;
      if (dialogueFrame < leadInEnd) {
        return { participants, activeSpeaker: null };
      }
      cursor = leadInEnd;
    }

    for (const line of conversation.lines) {
      const lineFrames = getLineDurationInFrames(line.durationInFrames, line.duration, fps);
      const end = cursor + lineFrames;
      if (dialogueFrame < end) {
        return { participants, activeSpeaker: toKey(line.character) };
      }
      cursor = end;
    }

    const isLastConversation = convIndex === conversations.length - 1;
    if (!isLastConversation) {
      const nextConversation = conversations[convIndex + 1];
      const transitionStart = cursor;
      const transitionEnd = transitionStart + TRANSITION_FRAMES;
      if (dialogueFrame < transitionEnd) {
        const localTransitionFrame = dialogueFrame - transitionStart;
        const blackoutFrame = Math.floor(TRANSITION_FRAMES / 2);
        const outgoingParticipants = participants;
        const incomingParticipants = getParticipants(nextConversation);
        const outgoingSpeaker = getLastSpeakerKey(conversation);

        // Fade out with current pair, swap at blackout frame, fade in with next pair.
        if (localTransitionFrame < blackoutFrame) {
          return { participants: outgoingParticipants, activeSpeaker: outgoingSpeaker };
        }
        return { participants: incomingParticipants, activeSpeaker: null };
      }
      cursor = transitionEnd;
    }
  }

  const lastConversation = conversations[conversations.length - 1];
  return { participants: getParticipants(lastConversation), activeSpeaker: null };
};

const getActivationEvents = (conversations: Conversation[], fps: number): ActivationEvent[] => {
  const events: ActivationEvent[] = [];
  let cursor = INTRO_PREROLL_FRAMES;
  let prevSpeaker: string | null = null;

  for (let convIndex = 0; convIndex < conversations.length; convIndex++) {
    const conversation = conversations[convIndex];
    if (convIndex > 0) {
      cursor += CONVERSATION_LEAD_IN_FRAMES;
      // Always allow first line in a new conversation to trigger the reveal.
      prevSpeaker = null;
    }

    for (const line of conversation.lines) {
      const speakerKey = toKey(line.character);
      if (speakerKey !== prevSpeaker) {
        // Trigger reveal only when ownership of the line changes.
        events.push({ speakerKey, frame: cursor });
      }

      const lineFrames = getLineDurationInFrames(line.durationInFrames, line.duration, fps);
      cursor += lineFrames;
      prevSpeaker = speakerKey;
    }

    if (convIndex < conversations.length - 1) {
      cursor += TRANSITION_FRAMES;
    }
  }

  return events;
};

const getTransitionWindows = (conversations: Conversation[], fps: number): TransitionWindow[] => {
  const windows: TransitionWindow[] = [];
  let cursor = INTRO_PREROLL_FRAMES;

  for (let convIndex = 0; convIndex < conversations.length; convIndex++) {
    const conversation = conversations[convIndex];
    if (convIndex > 0) {
      cursor += CONVERSATION_LEAD_IN_FRAMES;
    }
    for (const line of conversation.lines) {
      cursor += getLineDurationInFrames(line.durationInFrames, line.duration, fps);
    }

    const isLastConversation = convIndex === conversations.length - 1;
    if (!isLastConversation) {
      windows.push({
        startFrame: cursor,
        endFrame: cursor + TRANSITION_FRAMES,
      });
      cursor += TRANSITION_FRAMES;
    }
  }

  return windows;
};

const normalizeAudioUrl = (audioUrl: string) => {
  if (/^https?:\/\//i.test(audioUrl)) {
    return audioUrl;
  }
  const normalized = audioUrl.replace(/^\/+/, "");
  return staticFile(normalized);
};

const getActiveLineState = (
  conversations: Conversation[],
  frame: number,
  fps: number
): ActiveLineState => {
  if (frame < INTRO_PREROLL_FRAMES) {
    return {
      currentLine: null,
      previousLine: null,
      currentLineLocalFrame: 0,
      currentLineFrames: 0,
      previousLineTailFrame: 0,
      crossfadeProgress: 1,
    };
  }

  let cursor = INTRO_PREROLL_FRAMES;
  let previousLine: DialogueLine | null = null;

  for (let convIndex = 0; convIndex < conversations.length; convIndex++) {
    if (convIndex > 0) {
      const leadInEnd = cursor + CONVERSATION_LEAD_IN_FRAMES;
      if (frame < leadInEnd) {
        return {
          currentLine: null,
          previousLine,
          currentLineLocalFrame: 0,
          currentLineFrames: 0,
          previousLineTailFrame: previousLine
            ? Math.max(0, getLineDurationInFrames(previousLine.durationInFrames, previousLine.duration, fps) - 1)
            : 0,
          crossfadeProgress: 1,
        };
      }
      cursor = leadInEnd;
    }

    const conversation = conversations[convIndex];
    for (const line of conversation.lines) {
      const lineFrames = getLineDurationInFrames(line.durationInFrames, line.duration, fps);
      const lineEnd = cursor + lineFrames;
      if (frame < lineEnd) {
        const currentLineLocalFrame = Math.max(0, frame - cursor);
        const crossfadeProgress = Math.min(
          1,
          Math.max(0, (currentLineLocalFrame + 1) / VISUALIZER_LINE_CROSSFADE_FRAMES)
        );
        const previousLineTailFrame = previousLine
          ? Math.max(
              0,
              getLineDurationInFrames(previousLine.durationInFrames, previousLine.duration, fps) -
                Math.max(1, VISUALIZER_LINE_CROSSFADE_FRAMES - currentLineLocalFrame)
            )
          : 0;

        return {
          currentLine: line,
          previousLine,
          currentLineLocalFrame,
          currentLineFrames: lineFrames,
          previousLineTailFrame,
          crossfadeProgress,
        };
      }
      cursor = lineEnd;
      previousLine = line;
    }

    if (convIndex < conversations.length - 1) {
      const transitionEnd = cursor + TRANSITION_FRAMES;
      if (frame < transitionEnd) {
        return {
          currentLine: null,
          previousLine,
          currentLineLocalFrame: 0,
          currentLineFrames: 0,
          previousLineTailFrame: previousLine
            ? Math.max(0, getLineDurationInFrames(previousLine.durationInFrames, previousLine.duration, fps) - 1)
            : 0,
          crossfadeProgress: 1,
        };
      }
      cursor = transitionEnd;
    }
  }

  return {
    currentLine: null,
    previousLine,
    currentLineLocalFrame: 0,
    currentLineFrames: 0,
    previousLineTailFrame: previousLine
      ? Math.max(0, getLineDurationInFrames(previousLine.durationInFrames, previousLine.duration, fps) - 1)
      : 0,
    crossfadeProgress: 1,
  };
};

const getAudioSegments = (conversations: Conversation[], fps: number): AudioSegment[] => {
  const segments: AudioSegment[] = [];
  let cursor = INTRO_PREROLL_FRAMES;

  for (let convIndex = 0; convIndex < conversations.length; convIndex++) {
    const conversation = conversations[convIndex];
    if (convIndex > 0) {
      cursor += CONVERSATION_LEAD_IN_FRAMES;
    }

    for (const line of conversation.lines) {
      const lineFrames = getLineDurationInFrames(line.durationInFrames, line.duration, fps);
      segments.push({
        from: cursor,
        durationInFrames: lineFrames,
        src: normalizeAudioUrl(line.audioUrl),
      });
      cursor += lineFrames;
    }

    if (convIndex < conversations.length - 1) {
      cursor += TRANSITION_FRAMES;
    }
  }

  return segments;
};

const getLatestActivationFrame = (
  events: ActivationEvent[],
  speakerKey: string,
  frame: number
): number | null => {
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    if (event.frame > frame) {
      continue;
    }
    if (event.speakerKey === speakerKey) {
      return event.frame;
    }
  }

  return null;
};

// Composition render
export const DeadlockShort: React.FC<Props> = ({ conversations, portraitConfig = {} }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const frameState = useMemo(
    () => getFrameStateWithPreroll(conversations, frame, fps),
    [conversations, frame, fps]
  );
  const conversationRanges = useMemo(
    () => getConversationRanges(conversations, fps),
    [conversations, fps]
  );
  const activationEvents = useMemo(
    () => getActivationEvents(conversations, fps),
    [conversations, fps]
  );
  const transitionWindows = useMemo(
    () => getTransitionWindows(conversations, fps),
    [conversations, fps]
  );
  const audioSegments = useMemo(
    () => getAudioSegments(conversations, fps),
    [conversations, fps]
  );
  const activeLineState = useMemo(
    () => getActiveLineState(conversations, frame, fps),
    [conversations, frame, fps]
  );

  const [leftKey, rightKey] = frameState.participants;
  const activeSpeaker = frameState.activeSpeaker;
  const leftPortraitKey = toPortraitKey(leftKey);
  const rightPortraitKey = toPortraitKey(rightKey);
  const leftSrc = staticFile(`portraits/${leftPortraitKey}.png`);
  const rightSrc = staticFile(`portraits/${rightPortraitKey}.png`);
  const leftNameSrc = staticFile(`quirky_names/${toQuirkyNameFile(leftPortraitKey)}`);
  const rightNameSrc = staticFile(`quirky_names/${toQuirkyNameFile(rightPortraitKey)}`);
  // Prefer portrait-key settings (supports aliases like viper->vyper),
  // then fall back to speaker-key settings for backwards compatibility.
  const leftSettings = portraitConfig[leftPortraitKey] ?? getSlotSettings(portraitConfig, leftKey);
  const rightSettings = portraitConfig[rightPortraitKey] ?? getSlotSettings(portraitConfig, rightKey);
  const isLeftActive = activeSpeaker === leftKey;
  const isRightActive = activeSpeaker === rightKey;
  const leftActivationFrame = getLatestActivationFrame(activationEvents, leftKey, frame);
  const rightActivationFrame = getLatestActivationFrame(activationEvents, rightKey, frame);
  // Keep all foreground cards above backgrounds.
  // Active background can be above inactive background, but never above either foreground.
  const leftBgZ = isLeftActive ? 20 : 10;
  const rightBgZ = isRightActive ? 20 : 10;
  const leftFgZ = 100;
  const rightFgZ = 100;
  const currentAudioSrc = activeLineState.currentLine
    ? normalizeAudioUrl(activeLineState.currentLine.audioUrl)
    : null;
  const previousAudioSrc = activeLineState.previousLine
    ? normalizeAudioUrl(activeLineState.previousLine.audioUrl)
    : null;

  return (
    <AbsoluteFill style={{ background: "#070612" }}>
      {audioSegments.map((segment, index) => (
        <Sequence
          key={`line-audio-${index}`}
          from={segment.from}
          durationInFrames={segment.durationInFrames}
        >
          <Audio src={segment.src} />
        </Sequence>
      ))}

      <ConversationProgressBar
        frame={frame}
        durationInFrames={durationInFrames}
        conversationRanges={conversationRanges}
      />

      <PortraitCard
        src={leftSrc}
        nameSrc={leftNameSrc}
        x={100}
        y={380}
        width={430}
        height={680}
        frameInset={{ top: 120, right: 28, bottom: 70, left: 28 }}
        imgX={leftSettings.x}
        imgY={leftSettings.y}
        imgScale={leftSettings.scale}
        rotation={leftSettings.rotation}
        bgOpacity={isLeftActive ? ACTIVE_BG_OPACITY : INACTIVE_BG_OPACITY}
        fgOpacity={1}
        bgZIndex={leftBgZ}
        fgZIndex={leftFgZ}
        frameRadius={22}
        frame={frame}
        fps={fps}
        activationFrame={leftActivationFrame}
        slideFrom="left"
      />

      <PortraitCard
        src={rightSrc}
        nameSrc={rightNameSrc}
        x={560}
        y={380}
        width={430}
        height={680}
        frameInset={{ top: 120, right: 28, bottom: 70, left: 28 }}
        imgX={rightSettings.x}
        imgY={rightSettings.y}
        imgScale={rightSettings.scale}
        rotation={rightSettings.rotation}
        bgOpacity={isRightActive ? ACTIVE_BG_OPACITY : INACTIVE_BG_OPACITY}
        fgOpacity={1}
        bgZIndex={rightBgZ}
        fgZIndex={rightFgZ}
        frameRadius={22}
        frame={frame}
        fps={fps}
        activationFrame={rightActivationFrame}
        slideFrom="right"
      />

      <AudioVisualizer
        currentAudioSrc={currentAudioSrc}
        previousAudioSrc={previousAudioSrc}
        currentFrame={activeLineState.currentLineLocalFrame}
        previousFrame={activeLineState.previousLineTailFrame}
        crossfadeProgress={activeLineState.crossfadeProgress}
        fps={fps}
      />

      <ConversationTransitionOverlay
        frame={frame}
        windows={transitionWindows}
      />

      <SubtitleDisplay
        currentLine={activeLineState.currentLine}
        currentLineLocalFrame={activeLineState.currentLineLocalFrame}
        lineFrames={activeLineState.currentLineFrames}
      />

      <WatermarkBadge
        frame={frame}
        avatarSrc={staticFile("avatar.jpg")}
        label={WATERMARK}
      />
    </AbsoluteFill>
  );
};
