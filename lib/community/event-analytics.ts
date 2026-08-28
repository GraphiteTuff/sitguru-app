import { supabaseAdmin } from "@/lib/supabase/admin";

export type EventPromotionStats = {
  views: number;
  shares: number;
  clicks: number;
  viewsDelta: number | null;
  sharesDelta: number | null;
  clicksDelta: number | null;
};

function countEvents(
  rows: Array<{ event_name: string; metadata: Record<string, unknown> | null }>,
  eventId: string,
  slug: string,
  names: string[],
) {
  return rows.filter((row) => {
    if (!names.includes(row.event_name)) return false;
    const metadata = row.metadata || {};
    const rowEventId = String(metadata.eventId || metadata.event_id || "");
    const rowSlug = String(metadata.slug || "");
    return rowEventId === eventId || rowSlug === slug;
  }).length;
}

export async function getEventPromotionStats(
  eventId: string,
  slug: string,
): Promise<EventPromotionStats> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000).toISOString();

  const eventNames = [
    "event_view",
    "event_share",
    "event_link_copy",
    "event_partner_click",
    "event_guru_click",
    "event_registration_click",
  ];

  const [recentResult, priorResult] = await Promise.all([
    supabaseAdmin
      .from("analytics_events")
      .select("event_name, metadata, created_at")
      .in("event_name", eventNames)
      .gte("created_at", sevenDaysAgo)
      .limit(5000),
    supabaseAdmin
      .from("analytics_events")
      .select("event_name, metadata, created_at")
      .in("event_name", eventNames)
      .gte("created_at", fourteenDaysAgo)
      .lt("created_at", sevenDaysAgo)
      .limit(5000),
  ]);

  const recent = (recentResult.data || []) as Array<{
    event_name: string;
    metadata: Record<string, unknown> | null;
  }>;
  const prior = (priorResult.data || []) as Array<{
    event_name: string;
    metadata: Record<string, unknown> | null;
  }>;

  const viewsRecent = countEvents(recent, eventId, slug, ["event_view"]);
  const sharesRecent = countEvents(recent, eventId, slug, ["event_share", "event_link_copy"]);
  const clicksRecent = countEvents(recent, eventId, slug, [
    "event_partner_click",
    "event_guru_click",
    "event_registration_click",
  ]);

  const viewsPrior = countEvents(prior, eventId, slug, ["event_view"]);
  const sharesPrior = countEvents(prior, eventId, slug, ["event_share", "event_link_copy"]);
  const clicksPrior = countEvents(prior, eventId, slug, [
    "event_partner_click",
    "event_guru_click",
    "event_registration_click",
  ]);

  function deltaPercent(current: number, previous: number) {
    if (previous <= 0) return current > 0 ? 100 : null;
    return Math.round(((current - previous) / previous) * 100);
  }

  return {
    views: viewsRecent,
    shares: sharesRecent,
    clicks: clicksRecent,
    viewsDelta: deltaPercent(viewsRecent, viewsPrior),
    sharesDelta: deltaPercent(sharesRecent, sharesPrior),
    clicksDelta: deltaPercent(clicksRecent, clicksPrior),
  };
}
