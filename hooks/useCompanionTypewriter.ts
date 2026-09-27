"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  COMPANION_MS_PER_WORD,
  splitCompanionRevealTokens,
} from "@/lib/chat/companion-typing";

/**
 * Reveals companion reply text word-by-word so it feels like someone typing.
 * Target text can grow (streaming) — the reveal catches up without restarting.
 */
export function useCompanionTypewriter(
  fullText: string,
  options?: {
    enabled?: boolean;
    msPerWord?: number;
    /** Reset reveal when this identity changes (message id). */
    resetKey?: string;
  },
) {
  const enabled = options?.enabled !== false;
  const msPerWord = options?.msPerWord ?? COMPANION_MS_PER_WORD;
  const resetKey = options?.resetKey ?? "";

  const tokens = useMemo(
    () => splitCompanionRevealTokens(fullText),
    [fullText],
  );
  const [visibleCount, setVisibleCount] = useState(() =>
    enabled ? 0 : tokens.length,
  );
  const resetKeyRef = useRef(resetKey);

  useEffect(() => {
    if (resetKeyRef.current !== resetKey) {
      resetKeyRef.current = resetKey;
      setVisibleCount(enabled ? 0 : tokens.length);
      return;
    }

    if (!enabled) {
      setVisibleCount(tokens.length);
    }
  }, [enabled, resetKey, tokens.length]);

  useEffect(() => {
    if (!enabled) return;
    if (visibleCount >= tokens.length) return;

    const timer = window.setTimeout(() => {
      setVisibleCount((count) => Math.min(tokens.length, count + 1));
    }, msPerWord);

    return () => window.clearTimeout(timer);
  }, [enabled, msPerWord, tokens.length, visibleCount]);

  const visibleText = enabled
    ? tokens.slice(0, visibleCount).join("")
    : fullText;
  const isRevealing = enabled && visibleCount < tokens.length && tokens.length > 0;
  const isComplete = !enabled || visibleCount >= tokens.length;

  return {
    visibleText,
    isRevealing,
    isComplete,
  };
}
