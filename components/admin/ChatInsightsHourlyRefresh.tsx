"use client";

/**
 * Hourly auto-refresh for Chat Insights (RSC KPIs + ledger).
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

const HOUR_MS = 60 * 60 * 1000;

function formatClock(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ChatInsightsHourlyRefresh() {
  const router = useRouter();
  const [lastRefresh, setLastRefresh] = useState(() => new Date());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const tick = () => {
      setRefreshing(true);
      router.refresh();
      setLastRefresh(new Date());
      window.setTimeout(() => setRefreshing(false), 800);
    };

    const id = window.setInterval(tick, HOUR_MS);
    return () => window.clearInterval(id);
  }, [router]);

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-900">
      <RefreshCw
        className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
        aria-hidden
      />
      <span>
        Live · updates hourly · last {formatClock(lastRefresh)}
      </span>
    </div>
  );
}
