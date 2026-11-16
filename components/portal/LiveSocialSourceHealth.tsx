"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import type { SocialConnectorStatus } from "@/lib/growth-center-v2/types";

function displayTime(value: string | null | undefined): string {
  if (!value || !Number.isFinite(Date.parse(value))) return "No verified sync timestamp";
  return new Date(value).toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }) + " ET";
}

/** Keeps the five existing source-health cards current without remounting
 * editable report forms or overwriting Ava's unsaved report entries.
 * Polls our authorized, server-side snapshot API, not the social networks.
 */
export default function LiveSocialSourceHealth({
  initialSocial,
}: {
  initialSocial: SocialConnectorStatus[];
}) {
  const [social, setSocial] = useState(initialSocial);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (signal?.aborted) return;
    setRefreshing(true);
    try {
      const response = await fetch("/api/growth-center/v2/social-status", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal,
      });
      if (!response.ok) throw new Error("Social status unavailable");
      const data = (await response.json()) as {
        social?: SocialConnectorStatus[];
        checkedAt?: string;
      };
      if (!Array.isArray(data.social) || data.social.length !== 5) {
        throw new Error("Invalid social status response");
      }
      if (signal?.aborted) return;
      setSocial(data.social);
      setCheckedAt(data.checkedAt || new Date().toISOString());
      setRefreshFailed(false);
    } catch {
      if (!signal?.aborted) setRefreshFailed(true);
    } finally {
      if (!signal?.aborted) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const updateWhenActive = () => {
      if (document.visibilityState !== "visible" || !navigator.onLine) return;
      void refresh(controller.signal);
    };
    const timer = window.setInterval(updateWhenActive, 60_000);
    document.addEventListener("visibilitychange", updateWhenActive);
    window.addEventListener("focus", updateWhenActive);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", updateWhenActive);
      window.removeEventListener("focus", updateWhenActive);
    };
  }, [refresh]);

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-[#0F2744]">Social analytics source health</h2>
          <p className="mt-1 text-xs font-semibold text-slate-600">
            Verified platform followers and timestamps update here automatically. Sandbox tests never enter official totals.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={refreshing}
          className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 text-xs font-bold text-sky-900 hover:bg-sky-100 disabled:opacity-60"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} aria-hidden />
          {refreshing ? "Checking..." : "Refresh status"}
        </button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {social.map((platform) => {
          const sandbox = platform.status === "sandbox_connected";
          const connected = platform.status === "connected" && platform.followers !== null;
          const date = sandbox ? platform.sandboxLastSyncedAt : platform.lastSyncedAt;
          return (
            <article key={platform.platform} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-black text-[#0F2744]">{platform.label}</p>
              <p className={"mt-1 text-xs font-black " + (
                connected ? "text-emerald-700" : sandbox ? "text-sky-700" : platform.status === "error" ? "text-rose-700" : "text-amber-800"
              )}>
                {connected ? "Connected • Verified API" : sandbox ? "Sandbox test connected" : platform.status.replace(/_/g, " ")}
              </p>
              <p className="mt-2 text-xs font-semibold text-slate-700">
                {connected
                  ? "Verified followers: " + platform.followers!.toLocaleString("en-US")
                  : sandbox && platform.sandboxFollowers !== null && platform.sandboxFollowers !== undefined
                    ? "Sandbox snapshot: " + platform.sandboxFollowers.toLocaleString("en-US") + " followers"
                    : "Followers: unavailable"}
              </p>
              {platform.accountLabel ? (
                <p className="mt-1 text-[11px] font-medium text-slate-600">{platform.accountLabel}</p>
              ) : null}
              <p className="mt-1 text-[11px] text-slate-500">
                {date ? (sandbox ? "Test updated " : "Updated ") + displayTime(date) : "No verified sync timestamp"}
              </p>
              {sandbox ? (
                <p className="mt-1 text-[11px] font-semibold text-sky-800">
                  Test data • excluded from official reporting totals
                </p>
              ) : null}
              {platform.status === "error" ? (
                <p className="mt-1 text-[11px] text-rose-700">{platform.setupHint}</p>
              ) : null}
            </article>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] font-medium text-slate-500" aria-live="polite">
        {refreshFailed
          ? "Could not refresh source status. Last available snapshot remains visible."
          : checkedAt
            ? "Source status checked " + displayTime(checkedAt) + ". Snapshots refresh when scheduled API sync completes."
            : "Source status refreshes while this page is open; platform API fetches run on their own schedules."}
      </p>
    </section>
  );
}