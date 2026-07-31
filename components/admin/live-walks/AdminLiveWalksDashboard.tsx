// components/admin/live-walks/AdminLiveWalksDashboard.tsx
"use client";

/**
 * Desktop enterprise Live Walks Map Dashboard — realtime sync + Leaflet focus map.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LiveWalksKpiHeader from "@/components/admin/live-walks/LiveWalksKpiHeader";
import LiveWalkFeedPanel from "@/components/admin/live-walks/LiveWalkFeedPanel";
import LiveWalkFocusWorkspace from "@/components/admin/live-walks/LiveWalkFocusWorkspace";
import AdminWalkChatPanel from "@/components/messaging/AdminWalkChatPanel";
import type {
  AdminLiveWalkRow,
  AdminOverrideAction,
} from "@/components/admin/live-walks/types";
import { useAdminLiveWalksSync } from "@/hooks/useAdminLiveWalksSync";

type CompletedBanner = {
  bookingId: string;
  petName: string;
  distanceMiles: number;
  durationMinutes: number;
};

async function getAccessToken() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) throw error;
  if (!session?.access_token) {
    throw new Error("Please log in as an admin.");
  }
  return session.access_token;
}

export default function AdminLiveWalksDashboard() {
  const searchParams = useSearchParams();
  const initialBooking = searchParams.get("bookingId") || "";

  const [selectedBookingId, setSelectedBookingId] = useState(initialBooking);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [complianceNote, setComplianceNote] = useState("");
  const [completedBanner, setCompletedBanner] = useState<CompletedBanner | null>(
    null,
  );
  const [frozenCompletedRow, setFrozenCompletedRow] =
    useState<AdminLiveWalkRow | null>(null);

  const {
    rows,
    stats,
    isLoading,
    error: syncError,
    lastSyncedAt,
    syncMode,
    refresh,
  } = useAdminLiveWalksSync({ query, pollIntervalMs: 5000 });

  const prevStatusesRef = useRef<Map<string, string>>(new Map());

  // Auto-select first / flagged walk
  useEffect(() => {
    if (!selectedBookingId && rows.length) {
      const flagged = rows.find(
        (row) =>
          row.globalTrackingStatus === "FLAGGED_ALERT" || row.isStaleAlert,
      );
      setSelectedBookingId(flagged?.bookingId || rows[0].bookingId);
    }
  }, [rows, selectedBookingId]);

  // Detect COMPLETED transitions for graceful UI freeze
  useEffect(() => {
    const prev = prevStatusesRef.current;
    const next = new Map<string, string>();

    for (const row of rows) {
      next.set(row.bookingId, row.globalTrackingStatus);

      const was = prev.get(row.bookingId);
      if (
        row.bookingId === selectedBookingId &&
        was &&
        was !== "COMPLETED" &&
        row.globalTrackingStatus === "COMPLETED"
      ) {
        setCompletedBanner({
          bookingId: row.bookingId,
          petName: row.petName,
          distanceMiles: row.distanceMiles,
          durationMinutes: row.durationMinutes,
        });
        setFrozenCompletedRow({ ...row, globalTrackingStatus: "COMPLETED" });
      }

      if (row.bookingId === selectedBookingId && row.globalTrackingStatus !== "COMPLETED") {
        setFrozenCompletedRow(row);
      }
    }

    if (
      selectedBookingId &&
      prev.has(selectedBookingId) &&
      prev.get(selectedBookingId) !== "COMPLETED" &&
      !next.has(selectedBookingId)
    ) {
      setFrozenCompletedRow((current) => {
        if (!current || current.bookingId !== selectedBookingId) return current;
        const frozen = {
          ...current,
          globalTrackingStatus: "COMPLETED" as const,
          lastEventLabel: "✅ Ended",
          lastEventType: "ended",
        };
        setCompletedBanner({
          bookingId: frozen.bookingId,
          petName: frozen.petName,
          distanceMiles: frozen.distanceMiles,
          durationMinutes: frozen.durationMinutes,
        });
        return frozen;
      });
    }

    prevStatusesRef.current = next;
  }, [rows, selectedBookingId]);

  const displayRows = useMemo(() => {
    if (
      frozenCompletedRow &&
      frozenCompletedRow.globalTrackingStatus === "COMPLETED" &&
      !rows.some((row) => row.bookingId === frozenCompletedRow.bookingId)
    ) {
      return [frozenCompletedRow, ...rows];
    }
    return rows.map((row) =>
      frozenCompletedRow &&
      row.bookingId === frozenCompletedRow.bookingId &&
      frozenCompletedRow.globalTrackingStatus === "COMPLETED"
        ? { ...row, globalTrackingStatus: "COMPLETED" as const, lastEventLabel: "✅ Ended" }
        : row,
    );
  }, [rows, frozenCompletedRow]);

  const selected = useMemo(() => {
    const fromLive = displayRows.find(
      (row) => row.bookingId === selectedBookingId,
    );
    if (fromLive) return fromLive;
    if (
      frozenCompletedRow &&
      frozenCompletedRow.bookingId === selectedBookingId
    ) {
      return frozenCompletedRow;
    }
    return null;
  }, [displayRows, selectedBookingId, frozenCompletedRow]);

  async function runOverride(
    action: AdminOverrideAction,
    extras: Record<string, unknown> = {},
  ) {
    if (!selectedBookingId) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const token = await getAccessToken();
      const response = await fetch(
        `/api/admin/reports/${encodeURIComponent(selectedBookingId)}/override`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action, ...extras }),
        },
      );
      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Override failed.");
      }

      if (action === "force_end" && selected) {
        setCompletedBanner({
          bookingId: selected.bookingId,
          petName: selected.petName,
          distanceMiles: selected.distanceMiles,
          durationMinutes: selected.durationMinutes,
        });
        setFrozenCompletedRow({
          ...selected,
          globalTrackingStatus: "COMPLETED",
          lastEventLabel: "✅ Ended",
          lastEventType: "ended",
        });
      }

      setMessage(
        action === "force_end"
          ? "Walk force-ended."
          : action === "send_guru_sms"
            ? "SMS broadcast queued to Guru."
            : "Compliance note appended to PawReport history.",
      );
      if (action === "append_timeline") setComplianceNote("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Override failed.");
    } finally {
      setBusy(false);
    }
  }

  function handleIntervention(action: AdminOverrideAction) {
    if (action === "force_end") {
      if (
        !window.confirm(
          "Force end this walk session? This locks the route and notifies the Pet Parent.",
        )
      ) {
        return;
      }
      void runOverride("force_end", {
        note: "Admin force-end — dead zone / device offline intervention.",
      });
      return;
    }

    if (action === "send_guru_sms") {
      void runOverride("send_guru_sms", {
        message:
          complianceNote.trim() ||
          `SitGuru Ops: Please check in now — booking ${selectedBookingId.slice(0, 8)} needs GPS confirmation.`,
      });
      return;
    }

    if (action === "append_timeline") {
      if (!complianceNote.trim()) {
        setError("Add an internal compliance note before appending.");
        return;
      }
      void runOverride("append_timeline", {
        updateType: "note",
        note: complianceNote.trim(),
      });
    }
  }

  const bannerError = error || syncError;

  return (
    <div
      className="space-y-6"
      style={{ fontFamily: "var(--font-sans), var(--sitguru-font-sans)" }}
    >
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
            Operations · Fleet oversight
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-slate-950">
            Live Map Dashboard
          </h1>
          <p className="mt-1 max-w-2xl text-sm font-semibold text-slate-600">
            Realtime PawReport fleet map — simulation pings and Guru devices
            refresh KPIs, queue cards, and the focus polyline automatically.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-slate-600 shadow-sm">
            Sync · {syncMode}
            {lastSyncedAt
              ? ` · ${new Date(lastSyncedAt).toLocaleTimeString()}`
              : ""}
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter pet / guru / booking…"
            className="min-w-[220px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold shadow-sm"
          />
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </header>

      <LiveWalksKpiHeader stats={stats} />

      {bannerError ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">
          {bannerError}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          {message}
        </p>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-3">
          <LiveWalkFeedPanel
            rows={displayRows}
            selectedBookingId={selectedBookingId}
            isLoading={isLoading}
            onSelect={(bookingId) => {
              setSelectedBookingId(bookingId);
              if (completedBanner?.bookingId !== bookingId) {
                setCompletedBanner(null);
              }
            }}
          />
        </div>
        <div className="xl:col-span-5">
          <LiveWalkFocusWorkspace
            selected={selected}
            busy={busy}
            complianceNote={complianceNote}
            onComplianceNoteChange={setComplianceNote}
            onIntervention={handleIntervention}
            completedBanner={completedBanner}
            onDismissCompletedBanner={() => setCompletedBanner(null)}
          />
        </div>
        <div className="xl:col-span-4">
          <AdminWalkChatPanel
            bookingId={selectedBookingId || null}
            petName={selected?.petName}
            className="sticky top-4 max-h-[calc(100vh-7rem)]"
          />
        </div>
      </section>
    </div>
  );
}
