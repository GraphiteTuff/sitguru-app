import { trackEvent } from "@/lib/analytics/track";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ReadsAnalyticsEventName } from "./types";

export type ReadsTrackInput = {
  eventName: ReadsAnalyticsEventName;
  contentId?: string;
  contentType?: string;
  pagePath?: string;
  referrer?: string;
  sessionId?: string;
  userId?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
  metadata?: Record<string, unknown>;
};

/** Client-safe tracker — posts to /api/reads/analytics and Growth track. */
export async function trackReadsEvent(input: ReadsTrackInput) {
  try {
    await Promise.allSettled([
      trackEvent({
        eventName: `reads_${input.eventName}`,
        eventType: "reads",
        source: "reads_listen",
        pagePath: input.pagePath,
        metadata: {
          contentId: input.contentId || null,
          contentType: input.contentType || null,
          ...input.metadata,
          utm: input.utm || null,
        },
      }),
      fetch("/api/reads/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    ]);
  } catch (error) {
    console.error("Unable to track Reads event:", error);
  }
}

/** Server-side persistence for analytics (service role). */
export async function persistReadsAnalyticsEvent(input: ReadsTrackInput) {
  const { error } = await supabaseAdmin.from("reads_analytics_events").insert({
    event_name: input.eventName,
    content_id: input.contentId || null,
    content_type: input.contentType || null,
    session_id: input.sessionId || null,
    user_id: input.userId || null,
    page_path: input.pagePath || null,
    referrer: input.referrer || null,
    utm_source: input.utm?.source || null,
    utm_medium: input.utm?.medium || null,
    utm_campaign: input.utm?.campaign || null,
    metadata: input.metadata || {},
  });

  if (error) {
    // Table may not exist yet in some environments — fail soft.
    console.error("reads_analytics_events insert failed:", error.message);
  }
}

export async function summarizeReadsAnalytics(options?: {
  sinceDays?: number;
  createdBy?: string;
}) {
  const sinceDays = options?.sinceDays ?? 30;
  const since = new Date(
    Date.now() - sinceDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  const query = supabaseAdmin
    .from("reads_analytics_events")
    .select("event_name, content_id, content_type, created_at, metadata")
    .gte("created_at", since)
    .limit(5000);

  const { data, error } = await query;
  if (error || !data) {
    return {
      totals: {} as Record<string, number>,
      topContent: [] as Array<{ content_id: string; count: number }>,
      rows: [] as Array<{
        event_name: string;
        content_id: string | null;
        content_type: string | null;
        created_at: string;
        metadata: Record<string, unknown> | null;
      }>,
    };
  }

  const totals: Record<string, number> = {};
  const byContent: Record<string, number> = {};

  for (const row of data) {
    const name = String(row.event_name || "");
    totals[name] = (totals[name] || 0) + 1;
    if (row.content_id) {
      byContent[row.content_id] = (byContent[row.content_id] || 0) + 1;
    }
  }

  const topContent = Object.entries(byContent)
    .map(([content_id, count]) => ({ content_id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  return { totals, topContent, rows: data };
}
