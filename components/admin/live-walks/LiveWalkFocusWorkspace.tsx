// components/admin/live-walks/LiveWalkFocusWorkspace.tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import AdminInterventionsMenu from "@/components/admin/live-walks/AdminInterventionsMenu";
import type {
  AdminLiveWalkRow,
  AdminOverrideAction,
} from "@/components/admin/live-walks/types";
import { useAdminWalkMapData } from "@/hooks/useAdminWalkMapData";

const LiveWalkLeafletMap = dynamic(
  () => import("@/components/admin/live-walks/LiveWalkLeafletMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[360px] items-center justify-center rounded-xl border border-emerald-100 bg-slate-50 text-sm font-bold text-slate-500 lg:min-h-[420px]">
        Loading map tiles…
      </div>
    ),
  },
);

type LiveWalkFocusWorkspaceProps = {
  selected: AdminLiveWalkRow | null;
  busy?: boolean;
  complianceNote: string;
  onComplianceNoteChange: (value: string) => void;
  onIntervention: (action: AdminOverrideAction) => void;
  /** Parent-detected COMPLETED transition for this booking */
  completedBanner?: {
    bookingId: string;
    petName: string;
    distanceMiles: number;
    durationMinutes: number;
  } | null;
  onDismissCompletedBanner?: () => void;
};

export default function LiveWalkFocusWorkspace({
  selected,
  busy,
  complianceNote,
  onComplianceNoteChange,
  onIntervention,
  completedBanner,
  onDismissCompletedBanner,
}: LiveWalkFocusWorkspaceProps) {
  if (!selected && !completedBanner) {
    return (
      <section className="flex min-h-[640px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-100 bg-white text-2xl shadow-sm">
          🗺️
        </div>
        <h2 className="text-xl font-black tracking-[-0.03em] text-slate-900">
          Focus Detail Map Workspace
        </h2>
        <p className="max-w-md text-sm font-semibold leading-6 text-slate-600">
          Select an active walk from the left panel to begin live oversight
          tracking.
        </p>
      </section>
    );
  }

  return (
    <SelectedWorkspace
      selected={selected}
      busy={busy}
      complianceNote={complianceNote}
      onComplianceNoteChange={onComplianceNoteChange}
      onIntervention={onIntervention}
      completedBanner={completedBanner}
      onDismissCompletedBanner={onDismissCompletedBanner}
    />
  );
}

function SelectedWorkspace({
  selected,
  busy,
  complianceNote,
  onComplianceNoteChange,
  onIntervention,
  completedBanner,
  onDismissCompletedBanner,
}: {
  selected: AdminLiveWalkRow | null;
  busy?: boolean;
  complianceNote: string;
  onComplianceNoteChange: (value: string) => void;
  onIntervention: (action: AdminOverrideAction) => void;
  completedBanner?: LiveWalkFocusWorkspaceProps["completedBanner"];
  onDismissCompletedBanner?: () => void;
}) {
  const bookingId = selected?.bookingId || completedBanner?.bookingId || null;
  const { data, isLoading, error } = useAdminWalkMapData(bookingId);
  const [showSuccess, setShowSuccess] = useState(false);
  const [frozen, setFrozen] = useState<{
    distanceMiles: number;
    durationMinutes: number;
  } | null>(null);

  const isCompleted =
    Boolean(completedBanner) ||
    Boolean(data?.isCompleted) ||
    selected?.globalTrackingStatus === "COMPLETED";

  useEffect(() => {
    if (isCompleted && data) {
      setShowSuccess(true);
      setFrozen({
        distanceMiles: data.distanceMiles,
        durationMinutes: data.durationMinutes,
      });
    }
  }, [isCompleted, data?.bookingId, data?.isCompleted]);

  useEffect(() => {
    // Reset success chrome when switching bookings
    setShowSuccess(false);
    setFrozen(null);
  }, [bookingId]);

  const petName =
    data?.petName || selected?.petName || completedBanner?.petName || "Scout";
  const distanceMiles =
    frozen?.distanceMiles ??
    data?.distanceMiles ??
    selected?.distanceMiles ??
    completedBanner?.distanceMiles ??
    0;
  const durationMinutes =
    frozen?.durationMinutes ??
    data?.durationMinutes ??
    selected?.durationMinutes ??
    completedBanner?.durationMinutes ??
    0;

  const statusToken =
    data?.globalTrackingStatus ||
    selected?.globalTrackingStatus ||
    (isCompleted ? "COMPLETED" : "ACTIVE_TRACKING");

  return (
    <section
      className={[
        "relative flex min-h-[640px] flex-col overflow-hidden rounded-xl border bg-white shadow-sm",
        selected?.isStaleAlert || statusToken === "FLAGGED_ALERT"
          ? "border-rose-400 ring-2 ring-rose-100"
          : "border-slate-200",
      ].join(" ")}
    >
      {showSuccess ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center px-4 pt-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-600/95 px-5 py-3 text-center text-white shadow-lg backdrop-blur transition duration-500 ease-out">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-100">
              Walk completed
            </p>
            <p className="mt-1 text-sm font-bold">
              {petName} is home safe · {distanceMiles.toFixed(2)} mi ·{" "}
              {Math.round(durationMinutes)} min — route frozen for audit
            </p>
            {onDismissCompletedBanner ? (
              <button
                type="button"
                className="pointer-events-auto mt-2 text-xs font-black uppercase tracking-wide text-emerald-50 underline"
                onClick={() => {
                  setShowSuccess(false);
                  onDismissCompletedBanner();
                }}
              >
                Dismiss
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700">
            Focus detail · {statusToken}
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-[-0.03em] text-slate-950">
            {petName}&apos;s live route
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            {selected ? `Guru ${selected.guruName} · ` : ""}
            {distanceMiles.toFixed(2)} mi · {Math.round(durationMinutes)} min
            {isCompleted ? " · frozen" : isLoading ? " · syncing map…" : ""}
          </p>
        </div>
        {selected && !isCompleted ? (
          <AdminInterventionsMenu
            disabled={busy}
            onAction={onIntervention}
          />
        ) : null}
      </header>

      {error ? (
        <p className="border-b border-amber-100 bg-amber-50 px-5 py-2 text-xs font-bold text-amber-800">
          {error}
        </p>
      ) : null}

      <div className="grid flex-1 gap-0 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.75fr)]">
        <div className="relative min-h-[360px] p-4">
          <LiveWalkLeafletMap
            path={data?.path || []}
            events={data?.events || []}
            lastPoint={data?.lastPoint || null}
            isCompleted={isCompleted}
            className="h-full min-h-[360px]"
          />
        </div>

        <aside className="flex flex-col border-t border-slate-100 bg-slate-50/80 lg:border-l lg:border-t-0">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              Real-time timeline
            </h3>
          </div>
          <ul className="flex-1 space-y-2 overflow-y-auto p-3">
            {[...(data?.events || [])].reverse().map((event) => (
              <li
                key={event.id}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm"
              >
                <p className="text-sm font-black text-slate-900">{event.label}</p>
                <p className="mt-1 text-[11px] font-semibold text-slate-500">
                  {event.at
                    ? new Date(event.at).toLocaleTimeString()
                    : "—"}{" "}
                  · {event.lat.toFixed(4)}, {event.lng.toFixed(4)}
                </p>
              </li>
            ))}
            {(data?.events || []).length === 0 ? (
              <li className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-8 text-center text-xs font-semibold text-slate-500">
                Timeline pins (potty / break) overlay the polyline as Guru
                events land.
              </li>
            ) : null}
          </ul>

          {!isCompleted ? (
            <div className="border-t border-slate-200 bg-white p-3">
              <label className="block text-[11px] font-black uppercase tracking-wide text-slate-500">
                Internal compliance note
                <textarea
                  value={complianceNote}
                  onChange={(e) => onComplianceNoteChange(e.target.value)}
                  rows={3}
                  placeholder="Document outreach, SOS context, or battery failure notes…"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900"
                />
              </label>
            </div>
          ) : (
            <div className="border-t border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-900">
              Session locked · metrics frozen for compliance review
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
