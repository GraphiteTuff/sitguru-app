import "server-only";
import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Referral Tracking 2.0 is a reporting boundary, NEVER a deletion or reward reset.
 * Epoch rows are append-only, visible to the server service role only.
 */
export type ReferralReportingEpoch = {
  id: number;
  startedAt: string;
  label: string;
  reason: string;
};

export const getReferralReportingEpoch = cache(async (): Promise<ReferralReportingEpoch | null> => {
  const { data, error } = await supabaseAdmin
    .from("referral_reporting_epochs")
    .select("id,started_at,label,reason")
    .lte("started_at", new Date().toISOString())
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  // Fail visibly if the single source of truth is unavailable rather than
  // silently reverting to old lifetime counts or claiming a false zero.
  if (error) throw new Error("SitGuru referral baseline unavailable: " + error.message);
  if (!data) return null;
  return {
    id: Number(data.id),
    startedAt: String(data.started_at),
    label: String(data.label),
    reason: String(data.reason),
  };
});

export type ReferralReportingPeriod = "since_reset" | "7" | "30" | "90" | "history";

export function resolveReferralPeriod(
  epoch: ReferralReportingEpoch | null,
  period: ReferralReportingPeriod = "since_reset",
): string | null {
  if (period === "history") return null;
  const now = Date.now();
  const requestedDays = Number(period);
  const rollingStart = Number.isFinite(requestedDays) && requestedDays > 0
    ? new Date(now - requestedDays * 86_400_000).toISOString()
    : null;
  if (!epoch) return rollingStart;
  if (!rollingStart) return epoch.startedAt;
  return rollingStart > epoch.startedAt ? rollingStart : epoch.startedAt;
}

export function isReferralActivitySince(value: unknown, start: string | null): boolean {
  if (!start) return true;
  if (typeof value !== "string" || !value) return false;
  const stamp = Date.parse(value);
  return Number.isFinite(stamp) && stamp >= Date.parse(start);
}

export function baselineDateLabel(epoch: ReferralReportingEpoch | null): string {
  if (!epoch) return "Tracking reset not yet activated";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", year: "numeric", month: "short",
    day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short",
  }).format(new Date(epoch.startedAt));
}
