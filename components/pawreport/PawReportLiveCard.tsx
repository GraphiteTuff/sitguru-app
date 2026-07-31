// components/pawreport/PawReportLiveCard.tsx
"use client";

/**
 * Live booking-backed PawReport card.
 * -----------------------------------------------------------------------
 * Place on customer/guru visit-updates pages (NOT the marketing homepage).
 *
 * Hooks into GET /api/pawreports/[bookingId] via usePawReportLive.
 * Guru writes go through mutateGuruPawReport → /api/guru/pawreports/[bookingId].
 */

import { useEffect, useMemo, useState } from "react";
import MediaGalleryCarousel from "@/components/pawreport/MediaGalleryCarousel";
import StatusUpdates, {
  type CareStatusItem,
  type CareStatusKey,
} from "@/components/pawreport/StatusUpdates";
import WalkTracker from "@/components/pawreport/WalkTracker";
import {
  mutateGuruPawReport,
  usePawReportLive,
} from "@/hooks/usePawReportLive";
import type { PawReportLivePayload } from "@/lib/pawreport/types";

type PawReportLiveCardProps = {
  bookingId: string;
  /** Force role chrome; otherwise derived from API viewerRole. */
  roleHint?: "guru" | "pet_parent";
  className?: string;
};

const STATUS_ICONS: Record<CareStatusKey, string> = {
  food: "🍽️",
  water: "💧",
  potty: "🐾",
  medication: "💊",
};

function mapStatusLogs(report: PawReportLivePayload | null): CareStatusItem[] {
  if (!report) {
    return [
      {
        key: "food",
        label: "Food",
        icon: STATUS_ICONS.food,
        detail: "Waiting for live data…",
        done: false,
      },
      {
        key: "water",
        label: "Water",
        icon: STATUS_ICONS.water,
        detail: "Waiting for live data…",
        done: false,
      },
      {
        key: "potty",
        label: "Potty",
        icon: STATUS_ICONS.potty,
        detail: "Waiting for live data…",
        done: false,
      },
      {
        key: "medication",
        label: "Medication",
        icon: STATUS_ICONS.medication,
        detail: "Waiting for live data…",
        done: false,
      },
    ];
  }

  return report.statusLogs.map((item) => ({
    key: item.key,
    label: item.label,
    icon: STATUS_ICONS[item.key],
    detail: item.detail,
    done: item.done,
  }));
}

type MobileTab = "live" | "photos" | "status" | "notes";

export default function PawReportLiveCard({
  bookingId,
  roleHint,
  className = "",
}: PawReportLiveCardProps) {
  const { report, isLoading, error, refresh } = usePawReportLive(bookingId, {
    pollIntervalMs: 5000,
  });

  const [mobileTab, setMobileTab] = useState<MobileTab>("live");
  const [flashMessage, setFlashMessage] = useState("");
  const [isMutating, setIsMutating] = useState(false);

  const viewerRole =
    roleHint ||
    (report?.viewerRole === "guru" ? "guru" : "pet_parent");
  const isGuru = viewerRole === "guru" && Boolean(report?.canWrite);
  const statuses = useMemo(() => mapStatusLogs(report), [report]);

  const photos = useMemo(
    () =>
      (report?.photos || []).map((photo) => ({
        id: photo.id,
        alt: photo.note || "Visit photo",
        src: photo.url,
      })),
    [report],
  );

  useEffect(() => {
    if (!flashMessage) return;
    const timer = window.setTimeout(() => setFlashMessage(""), 2200);
    return () => window.clearTimeout(timer);
  }, [flashMessage]);

  async function runGuruMutation(
    method: "POST" | "PATCH",
    body: Record<string, unknown>,
    successMessage: string,
  ) {
    if (!isGuru || isMutating) return;
    setIsMutating(true);
    try {
      await mutateGuruPawReport(bookingId, method, body);
      await refresh();
      setFlashMessage(successMessage);
    } catch (err) {
      setFlashMessage(
        err instanceof Error ? err.message : "Could not save update.",
      );
    } finally {
      setIsMutating(false);
    }
  }

  function handleToggleStatus(key: CareStatusKey) {
    void runGuruMutation(
      "PATCH",
      {
        action: "status_log",
        updateType: key,
        note: `${key} logged from PawReport Live.`,
      },
      `${key[0].toUpperCase()}${key.slice(1)} update saved`,
    );
  }

  function handleLogWalk() {
    void runGuruMutation(
      "POST",
      { action: "start_walk" },
      "Walk update logged",
    );
  }

  function handleUploadPhoto() {
    setFlashMessage(
      "Upload photos from the Guru visit tracker — URL posts via action: add_update + updateType: photo.",
    );
  }

  const petName = report?.petName || "Your pet";
  const guruName = report?.guruName || "Your Guru";

  return (
    <div
      className={`relative flex w-full max-w-full flex-col overflow-hidden rounded-[28px] border border-emerald-100 bg-white font-sans shadow-[0_22px_60px_rgba(15,23,42,0.09)] sm:rounded-[34px] ${className}`}
      style={{ fontFamily: "var(--font-sans), var(--sitguru-font-sans)" }}
    >
      <div className="border-b border-emerald-100/80 bg-gradient-to-br from-emerald-50 via-white to-sky-50 px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
              PawReport Live
            </p>
            <h2 className="mt-1 truncate text-2xl font-black tracking-[-0.04em] text-slate-950 sm:text-3xl">
              {petName}&apos;s visit
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {isGuru
                ? `Log live care updates for ${petName}`
                : `Live care updates from ${guruName}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-[11px] font-black text-emerald-800 shadow-sm">
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full bg-emerald-500 ${
                  report?.walk.isActive ? "animate-pulse" : ""
                }`}
              />
              {report?.walk.isActive
                ? "Walk live"
                : report?.session.status === "in_progress"
                  ? "Visit live"
                  : isLoading
                    ? "Connecting…"
                    : "Synced"}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black text-slate-700 shadow-sm">
              {isGuru ? "Guru view" : "Pet Parent view"}
            </span>
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
            {error}
          </p>
        ) : null}

        {flashMessage ? (
          <p
            role="status"
            className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800"
          >
            {flashMessage}
          </p>
        ) : null}
      </div>

      {/* Desktop / tablet multi-column — reflows for webapp + native webviews */}
      <div className="hidden gap-5 p-4 md:grid md:grid-cols-2 md:p-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="min-w-0 space-y-5">
          <WalkTracker
            distanceLabel={report?.walk.distanceLabel || "0.0 mi"}
            durationLabel={report?.walk.durationLabel || "0 min"}
            statusLabel={
              report?.walk.isActive ? "Walk in progress" : "Walk summary"
            }
            interactive={isGuru}
            onLogWalk={handleLogWalk}
          />
          <StatusUpdates
            items={statuses}
            interactive={isGuru}
            onToggleStatus={handleToggleStatus}
          />
        </div>

        <div className="min-w-0 space-y-5">
          <MediaGalleryCarousel
            photos={
              photos.length
                ? photos
                : [{ id: "empty", alt: "Photos will appear here" }]
            }
            newCount={report?.newPhotoCount || 0}
            interactive={isGuru}
            onUploadPhoto={handleUploadPhoto}
          />
          <RecentNotesPanel notes={report?.recentNotes || []} />
        </div>
      </div>

      {/* Mobile: single column + bottom nav */}
      <div className="flex min-h-[32rem] flex-col md:hidden">
        <div className="min-w-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {mobileTab === "live" ? (
            <WalkTracker
              distanceLabel={report?.walk.distanceLabel || "0.0 mi"}
              durationLabel={report?.walk.durationLabel || "0 min"}
              statusLabel={
                report?.walk.isActive ? "Walk in progress" : "Walk summary"
              }
              interactive={isGuru}
              onLogWalk={handleLogWalk}
            />
          ) : null}

          {mobileTab === "photos" ? (
            <MediaGalleryCarousel
              photos={
                photos.length
                  ? photos
                  : [{ id: "empty", alt: "Photos will appear here" }]
              }
              newCount={report?.newPhotoCount || 0}
              interactive={isGuru}
              onUploadPhoto={handleUploadPhoto}
            />
          ) : null}

          {mobileTab === "status" ? (
            <StatusUpdates
              items={statuses}
              interactive={isGuru}
              onToggleStatus={handleToggleStatus}
            />
          ) : null}

          {mobileTab === "notes" ? (
            <RecentNotesPanel notes={report?.recentNotes || []} />
          ) : null}
        </div>

        <nav
          aria-label="PawReport mobile actions"
          className="shrink-0 border-t border-emerald-100 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur"
        >
          <div className="grid grid-cols-4 gap-1">
            {(
              [
                ["live", "🚶", "Live"],
                ["photos", "📸", "Photos"],
                ["status", "✅", "Status"],
                ["notes", "📝", "Notes"],
              ] as const
            ).map(([tab, icon, label]) => {
              const active = mobileTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setMobileTab(tab)}
                  className={`flex min-h-14 flex-col items-center justify-center rounded-2xl px-1 text-[10px] font-black transition ${
                    active
                      ? "bg-emerald-700 text-white"
                      : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
                  }`}
                >
                  <span aria-hidden="true" className="text-base leading-none">
                    {icon}
                  </span>
                  <span className="mt-1">{label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

function RecentNotesPanel({
  notes,
}: {
  notes: PawReportLivePayload["recentNotes"];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
        Timeline
      </p>
      <h3 className="mt-1 text-base font-black text-slate-950 sm:text-lg">
        Recent updates
      </h3>

      {notes.length === 0 ? (
        <p className="mt-4 text-sm font-semibold text-slate-500">
          No updates yet for this visit.
        </p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-3"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">
                {note.updateType}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {note.note || "Update logged"}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">
                {new Date(note.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
