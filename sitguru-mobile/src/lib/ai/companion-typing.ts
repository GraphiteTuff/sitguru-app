/**
 * Mobile pacing for AI Companion replies — mirrors web lib/chat/companion-typing.
 */

export const COMPANION_MIN_TYPING_MS = 850;
export const COMPANION_MAX_TYPING_MS = 2400;
export const COMPANION_MS_PER_CHAR = 18;

export function companionTypingDelayMs(textLength: number): number {
  const length = Math.max(0, Math.floor(textLength));
  const paced = Math.round(length * COMPANION_MS_PER_CHAR);
  return Math.min(
    COMPANION_MAX_TYPING_MS,
    Math.max(COMPANION_MIN_TYPING_MS, paced),
  );
}
