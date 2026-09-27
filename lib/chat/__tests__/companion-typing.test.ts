import { describe, expect, it } from "vitest";

import {
  COMPANION_MAX_TYPING_MS,
  COMPANION_MIN_TYPING_MS,
  companionTypingDelayMs,
  splitCompanionRevealTokens,
} from "../companion-typing";

describe("companionTypingDelayMs", () => {
  it("never drops below the minimum typing beat", () => {
    expect(companionTypingDelayMs(0)).toBe(COMPANION_MIN_TYPING_MS);
    expect(companionTypingDelayMs(5)).toBe(COMPANION_MIN_TYPING_MS);
  });

  it("scales with reply length and caps the wait", () => {
    const mid = companionTypingDelayMs(80);
    expect(mid).toBeGreaterThan(COMPANION_MIN_TYPING_MS);
    expect(mid).toBeLessThanOrEqual(COMPANION_MAX_TYPING_MS);
    expect(companionTypingDelayMs(10_000)).toBe(COMPANION_MAX_TYPING_MS);
  });
});

describe("splitCompanionRevealTokens", () => {
  it("keeps spaces so word-by-word join rebuilds the sentence", () => {
    const tokens = splitCompanionRevealTokens("hey Jason! What's your ZIP?");
    expect(tokens.join("")).toBe("hey Jason! What's your ZIP?");
    expect(tokens.filter((token) => token.trim()).length).toBeGreaterThan(3);
  });
});
