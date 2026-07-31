// components/pawreport/PetParentLiveWalkViewer.tsx
"use client";

/**
 * Pet Parent phone realtime reception — SSE stream, route polyline,
 * event markers (break / potty), and top snackbar banners.
 */

import { useMemo } from "react";
import { useLiveWalkStream } from "@/hooks/useLiveWalkStream";
import type { WalkMapMarker } from "@/lib/pawreport/walk-events";

type PetParentLiveWalkViewerProps = {
  bookingId: string;
  className?: string;
};

function markerColor(kind: WalkMapMarker["kind"]) {
  if (kind === "start") return "#059669";
  if (kind === "end") return "#0284c7";
  if (kind === "break" || kind === "break_end") return "#d97706";
  if (kind === "potty_poop") return "#b45309";
  return "#0ea5e9";
}

function snackbarClasses(tone: string) {
  if (tone === "potty") return "border-amber-200 bg-amber-50 text-amber-950";
  if (tone === "break") return "border-sky-200 bg-sky-50 text-sky-950";
  if (tone === "success") return "border-emerald-200 bg-emerald-50 text-emerald-950";
  return "border-slate-200 bg-white text-slate-900";
}

export default function PetParentLiveWalkViewer({
  bookingId,
  className = "",
}: PetParentLiveWalkViewerProps) {
  const {
    trackingState,
    path,
    markers,
    snackbar,
    petName,
    distanceMiles,
    durationMinutes,
    isConnected,
    error,
    dismissSnackbar,
  } = useLiveWalkStream(bookingId);

  const polyline = useMemo(() => {
    if (path.length < 2) return "";
    return path
      .map((point, index) => {
        const x = 24 + (index / Math.max(path.length - 1, 1)) * 272;
        const y = 130 - ((point.lat % 1) * 80 + (point.lng % 1) * 20);
        return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }, [path]);

  const projectedMarkers = useMemo(() => {
    return markers.map((marker, index) => {
      const x = 40 + (index % 6) * 42 + (Math.abs(marker.lng) % 1) * 20;
      const y = 40 + (index % 4) * 28 + (Math.abs(marker.lat) % 1) * 30;
      return { ...marker, x: Math.min(300, Math.max(20, x)), y: Math.min(140, Math.max(20, y)) };
    });
  }, [markers]);

  return (
    <section
      className={`relative overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] ${className}`}
      style={{ fontFamily: "var(--font-sans), var(--sitguru-font-sans)" }}
    >
      {/* Live snackbar — top of phone viewport */}
      {snackbar ? (
        <div className="absolute inset-x-0 top-0 z-30 px-3 pt-3">
          <div
            className={`flex items-start justify-between gap-3 rounded-2xl border px-3.5 py-3 shadow-lg ${snackbarClasses(
              snackbar.tone,
            )}`}
            role="status"
          >
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.12em]">
                {snackbar.title}
              </p>
              <p className="mt-0.5 text-sm font-semibold leading-5">
                {snackbar.body}
              </p>
            </div>
            <button
              type="button"
              onClick={dismissSnackbar}
              className="shrink-0 rounded-full px-2 text-lg font-black opacity-70"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        </div>
      ) : null}

      <div className={`px-4 pb-4 pt-5 sm:px-5 ${snackbar ? "pt-24" : ""}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
              Live walk stream
            </p>
            <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-slate-950">
              {petName}&apos;s route
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {distanceMiles.toFixed(1)} mi · {durationMinutes.toFixed(0)} min
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1.5 text-[11px] font-black ${
              isConnected
                ? "bg-emerald-100 text-emerald-800"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {isConnected ? "SSE live" : "Connecting…"}
          </span>
        </div>

        {error ? (
          <p className="mt-3 text-xs font-bold text-amber-700">{error}</p>
        ) : null}

        <div className="relative mt-4 h-44 overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 sm:h-52">
          <svg
            viewBox="0 0 320 160"
            className="absolute inset-0 h-full w-full"
            role="img"
            aria-label={`${petName} live walk map`}
          >
            <defs>
              <linearGradient id="liveWalkStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
            </defs>

            {polyline ? (
              <path
                d={polyline}
                fill="none"
                stroke="url(#liveWalkStroke)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <text
                x="160"
                y="84"
                textAnchor="middle"
                className="fill-slate-400"
                style={{ fontSize: "12px", fontWeight: 700 }}
              >
                Waiting for live GPS…
              </text>
            )}

            {projectedMarkers.map((marker) => (
              <g key={marker.id}>
                <circle
                  cx={marker.x}
                  cy={marker.y}
                  r={marker.kind.startsWith("potty") ? 9 : 7}
                  fill={markerColor(marker.kind)}
                />
                <circle cx={marker.x} cy={marker.y} r={2.5} fill="#fff" />
              </g>
            ))}
          </svg>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-700">
            State: {trackingState}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-700">
            Markers: {markers.length}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-700">
            Points: {path.length}
          </span>
        </div>

        {markers.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {[...markers].reverse().slice(0, 5).map((marker) => (
              <li
                key={marker.id}
                className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2.5"
              >
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: markerColor(marker.kind) }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-900">
                    {marker.label}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-500">
                    {new Date(marker.createdAt).toLocaleTimeString()} ·{" "}
                    {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
