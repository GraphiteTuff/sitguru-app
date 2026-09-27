/**
 * Shared pacing for AI Companion replies (Rogue / Scout / Taco / Delilah).
 * Keeps local FAQ/benefits answers and fast streams from popping in instantly.
 */

/** Floor so every reply shows a short "typing…" beat. */
export const COMPANION_MIN_TYPING_MS = 850;

/** Cap so long canned answers do not feel stuck. */
export const COMPANION_MAX_TYPING_MS = 2400;

/** Rough human typing pace used for local (non-streamed) replies. */
export const COMPANION_MS_PER_CHAR = 18;

/** Word-by-word reveal pace once the bubble starts filling in. */
export const COMPANION_MS_PER_WORD = 52;

export function companionTypingDelayMs(textLength: number): number {
  const length = Math.max(0, Math.floor(textLength));
  const paced = Math.round(length * COMPANION_MS_PER_CHAR);
  return Math.min(
    COMPANION_MAX_TYPING_MS,
    Math.max(COMPANION_MIN_TYPING_MS, paced),
  );
}

/** Split on whitespace while keeping spaces so markdown spacing stays intact. */
export function splitCompanionRevealTokens(text: string): string[] {
  const source = String(text || "");
  if (!source) return [];
  return source.split(/(\s+)/).filter((token) => token.length > 0);
}

export function companionTypewriterDurationMs(textLength: number): number {
  const words = Math.max(1, Math.ceil(Math.max(0, textLength) / 5));
  return words * COMPANION_MS_PER_WORD;
}
