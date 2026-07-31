// components/pawreport/PawReportLiveDashboard.tsx
"use client";

import { useState } from "react";
import MediaGalleryCarousel from "@/components/pawreport/MediaGalleryCarousel";
import StatusUpdates, {
  type CareStatusItem,
  type CareStatusKey,
} from "@/components/pawreport/StatusUpdates";
import WalkTracker from "@/components/pawreport/WalkTracker";
import { PawIcon } from "@/components/ui/PawIcon";

export type PawReportRole = "guru" | "pet_parent";

type HistoricVisit = {
  id: string;
  title: string;
  when: string;
  summary: string;
};

type PawReportLiveDashboardProps = {
  /** Active role view — Guru (input) vs Pet Parent (live read). */
  role?: PawReportRole;
  /** Allow switching roles in demos / homepage showcase. */
  allowRoleSwitch?: boolean;
  petName?: string;
  guruName?: string;
  className?: string;
};

const DEFAULT_HISTORY: HistoricVisit[] = [
  {
    id: "h1",
    title: "Afternoon walk",
    when: "Yesterday · 4:12 PM",
    summary: "1.2 mi · Photos + water logged",
  },
  {
    id: "h2",
    title: "Drop-in visit",
    when: "Mon · 11:40 AM",
    summary: "Food, potty, and play update",
  },
];

const INITIAL_STATUSES: CareStatusItem[] = [
  {
    key: "food",
    label: "Food",
    icon: "🍽️",
    detail: "Breakfast logged",
    done: true,
  },
  {
    key: "water",
    label: "Water",
    icon: "💧",
    detail: "Bowl refreshed",
    done: true,
  },
  {
    key: "potty",
    label: "Potty",
    icon: <PawIcon size={20} contrast="light" solid />,
    detail: "Break completed",
    done: true,
  },
  {
    key: "medication",
    label: "Medication",
    icon: "💊",
    detail: "Awaiting log",
    done: false,
  },
];

type MobileTab = "live" | "photos" | "status" | "history";

/**
 * PawReport Live dashboard — dual role (Guru / Pet Parent),
 * mobile-first stack + sticky bottom nav, desktop multi-column.
 */
export default function PawReportLiveDashboard({
  role: initialRole = "pet_parent",
  allowRoleSwitch = false,
  petName = "Scout",
  guruName = "Your Guru",
  className = "",
}: PawReportLiveDashboardProps) {
  const [role, setRole] = useState<PawReportRole>(initialRole);
  const [mobileTab, setMobileTab] = useState<MobileTab>("live");
  const [statuses, setStatuses] = useState<CareStatusItem[]>(INITIAL_STATUSES);
  const [flashMessage, setFlashMessage] = useState("");
  const isGuru = role === "guru";

  function flash(message: string) {
    setFlashMessage(message);
    window.setTimeout(() => setFlashMessage(""), 2200);
  }

  function handleToggleStatus(key: CareStatusKey) {
    if (!isGuru) return;
    setStatuses((previous) =>
      previous.map((item) =>
        item.key === key
          ? {
              ...item,
              done: !item.done,
              detail: !item.done ? "Just logged" : "Tap to log",
            }
          : item,
      ),
    );
    flash(`${key[0].toUpperCase()}${key.slice(1)} update saved`);
  }

  function handleLogWalk() {
    flash("Walk update logged");
  }

  function handleUploadPhoto() {
    flash("Photo upload placeholder ready");
  }

  const headerSubtitle = isGuru
    ? `Log live care updates for ${petName}`
    : `Live care updates from ${guruName}`;

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-[28px] border border-emerald-100 bg-white font-sans shadow-[0_22px_60px_rgba(15,23,42,0.09)] sm:rounded-[34px] ${className}`}
      style={{ fontFamily: "var(--font-sans), var(--sitguru-font-sans)" }}
    >
      {/* Header */}
      <div className="border-b border-emerald-100/80 bg-gradient-to-br from-emerald-50 via-white to-sky-50 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
              PawReport Live
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950 sm:text-3xl">
              {petName}&apos;s Walk
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {headerSubtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-[11px] font-black text-emerald-800 shadow-sm">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"
              />
              Live
            </span>

            {allowRoleSwitch ? (
              <div
                role="group"
                aria-label="Switch PawReport role view"
                className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setRole("pet_parent")}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-black transition ${
                    !isGuru
                      ? "bg-emerald-700 text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Pet Parent
                </button>
                <button
                  type="button"
                  onClick={() => setRole("guru")}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-black transition ${
                    isGuru
                      ? "bg-emerald-700 text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Guru
                </button>
              </div>
            ) : (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black text-slate-700 shadow-sm">
                {isGuru ? "Guru view" : "Pet Parent view"}
              </span>
            )}
          </div>
        </div>

        {flashMessage ? (
          <p
            role="status"
            className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800"
          >
            {flashMessage}
          </p>
        ) : null}
      </div>

      {/* Desktop / tablet multi-column */}
      <div className="hidden gap-5 p-5 md:grid md:grid-cols-2 lg:grid-cols-[1.15fr_0.85fr] lg:gap-6 lg:p-7">
        <div className="space-y-5">
          <WalkTracker
            interactive={isGuru}
            onLogWalk={handleLogWalk}
          />
          <StatusUpdates
            items={statuses}
            interactive={isGuru}
            onToggleStatus={handleToggleStatus}
          />
        </div>

        <div className="space-y-5">
          <MediaGalleryCarousel
            interactive={isGuru}
            onUploadPhoto={handleUploadPhoto}
          />
          <HistoricVisitsPanel visits={DEFAULT_HISTORY} />
          {isGuru ? <GuruComposerHint /> : <PetParentLiveHint />}
        </div>
      </div>

      {/* Mobile single-column + bottom action nav */}
      <div className="flex min-h-[34rem] flex-col md:hidden">
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {mobileTab === "live" ? (
            <>
              <WalkTracker
                interactive={isGuru}
                onLogWalk={handleLogWalk}
              />
              {isGuru ? <GuruComposerHint /> : <PetParentLiveHint />}
            </>
          ) : null}

          {mobileTab === "photos" ? (
            <MediaGalleryCarousel
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

          {mobileTab === "history" ? (
            <HistoricVisitsPanel visits={DEFAULT_HISTORY} />
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
                ["history", "🗂️", "History"],
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

function HistoricVisitsPanel({ visits }: { visits: HistoricVisit[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
        Visit history
      </p>
      <h3 className="mt-1 text-base font-black text-slate-950 sm:text-lg">
        Past PawReports
      </h3>

      <ul className="mt-4 space-y-2.5">
        {visits.map((visit) => (
          <li
            key={visit.id}
            className="rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-950">
                  {visit.title}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-slate-500">
                  {visit.when}
                </p>
              </div>
              <span aria-hidden="true" className="text-base">
                🗂️
              </span>
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-600">
              {visit.summary}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GuruComposerHint() {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-700 p-4 text-white sm:p-5">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-200">
        Guru actions
      </p>
      <h3 className="mt-1 text-lg font-black tracking-[-0.03em]">
        Keep parents in the loop
      </h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-emerald-50">
        Log walks, upload photos, and tap care statuses as you go. Parents see
        updates live on their PawReport.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {["Add note", "Start walk", "Upload photo"].map((label) => (
          <span
            key={label}
            className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[11px] font-black text-white"
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function PetParentLiveHint() {
  return (
    <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-4 sm:p-5">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
        Pet Parent view
      </p>
      <h3 className="mt-1 text-lg font-black tracking-[-0.03em] text-slate-950">
        Follow every step
      </h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        Watch walk progress, new photos, and care checklist updates as your Guru
        shares them — then revisit completed PawReports anytime.
      </p>
    </div>
  );
}
