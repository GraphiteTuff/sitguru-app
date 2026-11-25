"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/** Refreshes server-rendered growth snapshots while a page is visible.
 * This is a UI refresh, not another call to each social API: the protected
 * scheduled jobs remain the source of verified platform data.
 */
export default function LiveSocialAutoRefresh({
  intervalMs = 90_000,
}: {
  intervalMs?: number;
}) {
  const router = useRouter();
  const lastCheckedAt = useRef<number | null>(null);

  useEffect(() => {
    lastCheckedAt.current ??= Date.now();
    const refreshIfActive = () => {
      const now = Date.now();
      if (lastCheckedAt.current !== null && now - lastCheckedAt.current < intervalMs) return;
      if (document.visibilityState !== "visible" || !navigator.onLine) return;
      lastCheckedAt.current = now;
      router.refresh();
    };
    const timer = window.setInterval(refreshIfActive, intervalMs);
    document.addEventListener("visibilitychange", refreshIfActive);
    window.addEventListener("focus", refreshIfActive);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshIfActive);
      window.removeEventListener("focus", refreshIfActive);
    };
  }, [intervalMs, router]);

  return null;
}
