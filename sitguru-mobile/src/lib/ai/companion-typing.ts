/**
 * Mobile word-by-word reveal pace — mirrors web lib/chat/companion-typing.
 */

export const COMPANION_MIN_TYPING_MS = 180;
export const COMPANION_MAX_TYPING_MS = 700;
export const COMPANION_MS_PER_CHAR = 6;
export const COMPANION_MS_PER_WORD = 16;

export function companionTypingDelayMs(textLength: number): number {
  const length = Math.max(0, Math.floor(textLength));
  const paced = Math.round(length * COMPANION_MS_PER_CHAR);
  return Math.min(
    COMPANION_MAX_TYPING_MS,
    Math.max(COMPANION_MIN_TYPING_MS, paced),
  );
}

export function splitCompanionRevealTokens(text: string): string[] {
  const source = String(text || "");
  if (!source) return [];
  return source.split(/(\s+)/).filter((token) => token.length > 0);
}
