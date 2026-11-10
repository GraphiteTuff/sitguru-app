"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

/** Public viewers have no private realtime channel. Recheck due publications while visible. */
export default function PackLiveRefresh() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    function refresh() {
      if (document.visibilityState === "visible" && navigator.onLine) startTransition(() => router.refresh());
    }
    const interval = window.setInterval(refresh, 30_000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("online", refresh);
    return () => { window.clearInterval(interval); document.removeEventListener("visibilitychange", refresh); window.removeEventListener("online", refresh); };
  }, [router]);
  return <button type="button" disabled={pending} onClick={() => startTransition(() => router.refresh())} className="mb-6 min-h-12 text-sm font-bold text-emerald-900 disabled:opacity-50">{pending ? "Checking for stories…" : "Refresh community stories ↻"}</button>;
}
