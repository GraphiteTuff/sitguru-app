"use client";

/**
 * Refresh-on-focus / visibility fallback (req 106).
 * Protects against missed subscription events without high-frequency polling.
 */

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

function isTypingElement(element: Element | null) {
  if (!element) return false;
  const tagName = element.tagName.toLowerCase();
  return (
    tagName === "textarea" ||
    tagName === "input" ||
    tagName === "select" ||
    element.getAttribute("contenteditable") === "true"
  );
}

export type UseRefreshOnFocusOptions = {
  enabled?: boolean;
  /** Minimum gap between focus refreshes (ms). */
  minIntervalMs?: number;
  onRefresh?: () => void;
};

export function useRefreshOnFocus(options: UseRefreshOnFocusOptions = {}) {
  const router = useRouter();
  const enabled = options.enabled !== false;
  const minIntervalMs = options.minIntervalMs ?? 4000;
  const lastRef = useRef(0);
  const onRefreshRef = useRef(options.onRefresh);
  onRefreshRef.current = options.onRefresh;

  useEffect(() => {
    if (!enabled) return;

    function refresh() {
      if (document.visibilityState !== "visible") return;
      if (isTypingElement(document.activeElement)) return;
      const now = Date.now();
      if (now - lastRef.current < minIntervalMs) return;
      lastRef.current = now;
      if (onRefreshRef.current) onRefreshRef.current();
      else router.refresh();
    }

    function onVisibility() {
      if (document.visibilityState === "visible") refresh();
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", refresh);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", refresh);
    };
  }, [enabled, minIntervalMs, router]);
}
