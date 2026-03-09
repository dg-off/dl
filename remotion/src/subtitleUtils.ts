export function splitIntoChunks(text: string, maxChars = 20): string[] {
  const segments = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];

  for (const segment of segments) {
    const words = segment.trim().split(/\s+/).filter(Boolean);
    let i = 0;
    while (i < words.length) {
      const chunk: string[] = [];
      while (i < words.length) {
        const next = words[i];
        const projected = chunk.length === 0 ? next : chunk.join(" ") + " " + next;
        // Always add at least one word (handles single very-long words)
        if (chunk.length > 0 && projected.length > maxChars) break;
        chunk.push(next);
        i++;
        // Break early at clause boundary if chunk has >= 2 words
        if (chunk.length >= 2 && /[,;:]$/.test(chunk[chunk.length - 1])) {
          break;
        }
      }
      if (chunk.length > 0) {
        chunks.push(chunk.join(" "));
      }
    }
  }

  return chunks.length > 0 ? chunks : [text];
}

export function getActiveChunkIndex(
  chunks: string[],
  totalFrames: number,
  localFrame: number
): number {
  if (chunks.length === 0) return 0;

  const weights = chunks.map((c) => c.length);
  const total = weights.reduce((a, b) => a + b, 0);

  let cursor = 0;
  for (let i = 0; i < chunks.length; i++) {
    cursor += Math.round((weights[i] / total) * totalFrames);
    if (localFrame < cursor || i === chunks.length - 1) {
      return i;
    }
  }

  return chunks.length - 1;
}
