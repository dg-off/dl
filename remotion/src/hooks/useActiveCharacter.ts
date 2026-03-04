import { useRef } from "react";
import { toPortraitKey } from "../constants";
import type { Conversation } from "../types";
import {
  getActiveCharacter,
  getActiveConversationIndex,
  getParticipants,
} from "../utils/conversation";

export function useActiveCharacter(
  frame: number,
  conversations: Conversation[],
  convBoundaries: { start: number; end: number }[]
): { charKey: string | null; participants: string[] } {
  const lastCharRef = useRef<string | null>(null);
  const lastParticipantsRef = useRef<string[]>([]);

  const activeConvIdx = getActiveConversationIndex(frame, convBoundaries);
  const activeCharacter = getActiveCharacter(frame, conversations, convBoundaries);
  const currentParticipants =
    activeConvIdx !== null ? getParticipants(conversations[activeConvIdx].lines) : [];

  if (activeCharacter !== null) lastCharRef.current = activeCharacter;
  if (currentParticipants.length > 0) lastParticipantsRef.current = currentParticipants;

  return {
    charKey: lastCharRef.current ? toPortraitKey(lastCharRef.current) : null,
    participants: lastParticipantsRef.current,
  };
}
