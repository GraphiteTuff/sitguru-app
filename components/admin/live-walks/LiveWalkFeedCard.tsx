// components/admin/live-walks/LiveWalkFeedCard.tsx
"use client";

import { useEffect, useState } from "react";
import type { AdminLiveWalkRow } from "@/components/admin/live-walks/types";
import { formatDurationClock } from "@/components/admin/live-walks/types";

type LiveWalkFeedCardProps = {
  row: AdminLiveWalkRow;
  selected: boolean;
  onSelect: (bookingId: string) => void;
};

export default function LiveWalkFeedCard({
  row,
  selected,
  onSelect,
}: LiveWalkFeedCardProps) {
  const [elapsed, setElapsed] = useState(() =>
    row.startedAt
      ? Math.max(0, Math.floor((Date.now() - new Date(row.startedAt).getTime()) / 1000))
      : row.durationSeconds,
  );

  useEffect(() => {
    if (!row.startedAt || row.globalTrackingStatus === "COMPLETED") {
      setElapsed(row.durationSeconds);
      return;
    }
    const tick = () => {
      setElapsed(
        Math.max(
          0,
          Math.floor((Date.now() - new Date(row.startedAt!).getTime()) / 1000),
        ),
      );
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [row.startedAt, row.durationSeconds, row.bookingId, row.globalTrackingStatus]);

  const flagged =
    row.globalTrackingStatus === "FLAGGED_ALERT" || row.isStaleAlert;

  return (
    <button
      type="button"
      onClick={() => onSelect(row.bookingId)}
      className={[
        "w-full rounded-xl border bg-white p-4 text-left shadow-sm transition",
        selected
          ? "border-emerald-500 ring-2 ring-emerald-200"
          : "border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/40",
        flagged ? "animate-pulse border-rose-500 ring-2 ring-rose-200" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-black tracking-[-0.02em] text-slate-950">
            {row.petName}
          </p>
          <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
            Guru · {row.guruName}
          </p>
        </div>
        <span
          className={[
            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black",
            flagged
              ? "bg-rose-100 text-rose-900"
              : row.globalTrackingStatus === "COMPLETED"
                ? "bg-sky-100 text-sky-900"
                : "bg-emerald-50 text-emerald-800",
          ].join(" ")}
        >
          {row.globalTrackingStatus === "COMPLETED"
            ? "✅ Ended"
            : row.lastEventLabel || "🏃 Walking"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-slate-700">
        <div className="rounded-lg bg-slate-50 px-2.5 py-2">
          <p className="text-[10px] uppercase tracking-wide text-slate-400">
            Duration
          </p>
          <p className="mt-0.5 font-mono text-sm text-slate-900">
            {formatDurationClock(elapsed)}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 px-2.5 py-2">
          <p className="text-[10px] uppercase tracking-wide text-slate-400">
            Distance
          </p>
          <p className="mt-0.5 font-mono text-sm text-slate-900">
            {row.distanceMiles.toFixed(2)} mi
          </p>
        </div>
      </div>

      {flagged ? (
        <p className="mt-3 text-[11px] font-black uppercase tracking-wide text-rose-700">
          FLAGGED ALERT
          {row.staleMinutes != null ? ` · ${row.staleMinutes}m no GPS` : ""}
        </p>
      ) : (
        <p className="mt-3 truncate font-mono text-[10px] font-semibold text-slate-400">
          {row.bookingId}
        </p>
      )}
    </button>
  );
}
