"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

type MessageAutoRefreshProps = {
  intervalMs?: number;
};

export default function MessageAutoRefresh({
  intervalMs = 1000,
}: MessageAutoRefreshProps) {
  const router = useRouter();
  const lastRefreshRef = useRef<number>(0);

  useEffect(() => {
    let isMounted = true;

    // Keep it fast even if older pages pass 3500.
    const safeIntervalMs = Math.max(750, Math.min(intervalMs, 1000));

    function refreshPage(force = false) {
      if (!isMounted) return;
      if (document.visibilityState !== "visible") return;

      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshRef.current;

      // Prevent refresh spam while still feeling fast.
      if (!force && timeSinceLastRefresh < safeIntervalMs) return;

      lastRefreshRef.current = now;
      router.refresh();
    }

    // Refresh once shortly after the page loads.
    const initialRefresh = window.setTimeout(() => {
      refreshPage(true);
    }, 500);

    // Poll quickly while the page is visible.
    const interval = window.setInterval(() => {
      refreshPage();
    }, safeIntervalMs);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshPage(true);
      }
    }

    function handleWindowFocus() {
      refreshPage(true);
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      isMounted = false;
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [intervalMs, router]);

  return null;
}