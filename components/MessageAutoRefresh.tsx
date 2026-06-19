"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

type MessageAutoRefreshProps = {
  intervalMs?: number;
};

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

export default function MessageAutoRefresh({
  intervalMs = 5000,
}: MessageAutoRefreshProps) {
  const router = useRouter();
  const lastRefreshRef = useRef<number>(0);

  useEffect(() => {
    let isMounted = true;
    const safeIntervalMs = Math.max(2500, Math.min(intervalMs, 15000));

    function refreshPage(force = false) {
      if (!isMounted) return;
      if (document.visibilityState !== "visible") return;

      if (!force && isTypingElement(document.activeElement)) return;

      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshRef.current;

      if (!force && timeSinceLastRefresh < safeIntervalMs) return;

      lastRefreshRef.current = now;
      router.refresh();
    }

    const initialRefresh = window.setTimeout(() => {
      refreshPage(true);
    }, 750);

    const interval = window.setInterval(() => {
      refreshPage();
    }, safeIntervalMs);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") refreshPage(true);
    }

    function handleWindowFocus() {
      refreshPage(true);
    }

    function handleManualRefresh() {
      refreshPage(true);
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("sitguru:messages-refresh", handleManualRefresh);

    return () => {
      isMounted = false;
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("sitguru:messages-refresh", handleManualRefresh);
    };
  }, [intervalMs, router]);

  return null;
}
