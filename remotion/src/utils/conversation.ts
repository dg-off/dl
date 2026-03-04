import { staticFile } from "remotion";
import type { Conversation, DialogueLine } from "../types";

export function getParticipants(lines: DialogueLine[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const line of lines) {
    if (!seen.has(line.character)) {
      seen.add(line.character);
      result.push(line.character);
    }
  }
  return result;
}

export function getConvBoundaries(
  conversations: Conversation[],
  transitionFrames: number
): { start: number; end: number }[] {
  return conversations.reduce(
    (acc, conv, i) => {
      const prevEnd = i === 0 ? 0 : acc[i - 1].end + transitionFrames;
      const dur = conv.lines.reduce((s, l) => s + (l.durationInFrames ?? 0), 0);
      return [...acc, { start: prevEnd, end: prevEnd + dur }];
    },
    [] as Array<{ start: number; end: number }>
  );
}

export function getActiveConversationIndex(
  frame: number,
  convBoundaries: { start: number; end: number }[]
): number | null {
  for (let i = 0; i < convBoundaries.length; i++) {
    if (frame >= convBoundaries[i].start && frame < convBoundaries[i].end) return i;
  }
  return null;
}

export function getActiveCharacter(
  frame: number,
  conversations: Conversation[],
  convBoundaries: { start: number; end: number }[]
): string | null {
  for (let i = 0; i < conversations.length; i++) {
    const { start, end } = convBoundaries[i];
    if (frame >= start && frame < end) {
      let offset = frame - start;
      for (const line of conversations[i].lines) {
        const dur = line.durationInFrames ?? 0;
        if (offset < dur) return line.character;
        offset -= dur;
      }
    }
  }
  return null;
}

export function resolveAudio(url: string): string {
  return url.startsWith("http") ? url : staticFile(url);
}
