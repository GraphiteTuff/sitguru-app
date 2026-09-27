import { useEffect, useMemo, useRef, useState } from 'react';

import {
  COMPANION_MS_PER_WORD,
  splitCompanionRevealTokens,
} from '@/lib/ai/companion-typing';

/** Word-by-word reveal for native companion bubbles. */
export function useCompanionTypewriter(
  fullText: string,
  options?: {
    enabled?: boolean;
    msPerWord?: number;
    resetKey?: string;
  },
) {
  const enabled = options?.enabled !== false;
  const msPerWord = options?.msPerWord ?? COMPANION_MS_PER_WORD;
  const resetKey = options?.resetKey ?? '';

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

    const timer = setTimeout(() => {
      setVisibleCount((count) => Math.min(tokens.length, count + 1));
    }, msPerWord);

    return () => clearTimeout(timer);
  }, [enabled, msPerWord, tokens.length, visibleCount]);

  const visibleText = enabled
    ? tokens.slice(0, visibleCount).join('')
    : fullText;
  const isComplete = !enabled || visibleCount >= tokens.length;

  return {
    visibleText,
    isComplete,
  };
}
