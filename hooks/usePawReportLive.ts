// hooks/usePawReportLive.ts
"use client";

/**
 * Frontend hook — place this in Pet Parent / Guru live views.
 *
 * Usage:
 *   const { report, isLoading, error, refresh } = usePawReportLive(bookingId);
 *
 * Polls GET /api/pawreports/[bookingId] so walk distance, time, and photos
 * stay fresh on desktop, mobile web, and native webviews.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { PawReportLivePayload } from "@/lib/pawreport/types";

type UsePawReportLiveOptions = {
  /** Poll interval in ms. Default 5000. Set 0 to disable polling. */
  pollIntervalMs?: number;
  enabled?: boolean;
};

type UsePawReportLiveResult = {
  report: PawReportLivePayload | null;
  isLoading: boolean;
  error: string;
  refresh: () => Promise<void>;
};

export function usePawReportLive(
  bookingId: string | null | undefined,
  options: UsePawReportLiveOptions = {},
): UsePawReportLiveResult {
  const pollIntervalMs = options.pollIntervalMs ?? 5000;
  const enabled = options.enabled ?? true;

  const [report, setReport] = useState<PawReportLivePayload | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(bookingId));
  const [error, setError] = useState("");
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    const id = String(bookingId || "").trim();
    if (!id || !enabled) return;

    try {
      const response = await fetch(`/api/pawreports/${encodeURIComponent(id)}`, {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        report?: PawReportLivePayload;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load PawReport.");
      }

      if (!mountedRef.current) return;
      setReport(payload?.report || null);
      setError("");
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : "Unable to load PawReport.");
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [bookingId, enabled]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!bookingId || !enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    void refresh();

    if (pollIntervalMs <= 0) return;

    const timer = window.setInterval(() => {
      void refresh();
    }, pollIntervalMs);

    return () => window.clearInterval(timer);
  }, [bookingId, enabled, pollIntervalMs, refresh]);

  return { report, isLoading, error, refresh };
}

/**
 * Guru write helper — POST/PATCH /api/guru/pawreports/[bookingId]
 * Call from GuruVisitTracker or PawReportLiveDashboard write actions.
 */
export async function mutateGuruPawReport(
  bookingId: string,
  method: "POST" | "PATCH",
  body: Record<string, unknown>,
) {
  const response = await fetch(
    `/api/guru/pawreports/${encodeURIComponent(bookingId)}`,
    {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    },
  );

  const payload = (await response.json().catch(() => null)) as {
    error?: string;
    report?: PawReportLivePayload;
  } | null;

  if (!response.ok) {
    throw new Error(payload?.error || "PawReport update failed.");
  }

  return payload?.report || null;
}
