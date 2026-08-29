import { getEventAttendanceCounts } from "@/lib/community/attendance";
import { COMMUNITY_MARKET_SEEDS } from "@/lib/community/market-seed";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { CommunityEventRow } from "@/lib/community/types";

export type CommandCenterRange = "month" | "30d" | "90d" | "all";

export type PartnerEventCardMetrics = {
  eventId: string;
  views: number;
  shares: number;
  clicks: number;
  interested: number;
  going: number;
  maybe: number;
  petParents: number;
  gurus: number;
  ambassadors: number;
};

export type PartnerCommandCenterStats = {
  range: CommandCenterRange;
  upcoming: number;
  views: number;
  interested: number;
  shares: number;
  clicks: number;
  petParents: number;
  gurus: number;
  ambassadors: number;
  viewsByDay: { date: string; views: number }[];
  perEvent: PartnerEventCardMetrics[];
  reachLabels: string[];
};

function rangeStart(range: CommandCenterRange): string | null {
  const now = Date.now();
  if (range === "all") return null;
  if (range === "month") {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }
  const days = range === "30d" ? 30 : 90;
  return new Date(now - days * 86400000).toISOString();
}

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

export async function fetchAllPartnerEvents(partnerId: string) {
  const { data, error } = await supabaseAdmin
    .from("community_events")
    .select("*")
    .eq("partner_id", partnerId)
    .order("start_at", { ascending: true })
    .limit(200);

  if (error) {
    console.error("fetchAllPartnerEvents:", error);
    return [] as CommunityEventRow[];
  }

  return (data || []) as CommunityEventRow[];
}

export function resolveCommunityReachLabels(
  events: Pick<CommunityEventRow, "city" | "state" | "featured_market_city">[],
  partner?: { city?: string | null; state?: string | null } | null,
): string[] {
  const labels = new Set<string>();
  labels.add("Pet Parent Events");
  labels.add("Guru Community");

  const cities = [
    ...events.map((e) => e.city?.trim()).filter(Boolean),
    partner?.city?.trim(),
  ].filter(Boolean) as string[];

  const states = [
    ...events.map((e) => e.state?.trim().toUpperCase()).filter(Boolean),
    partner?.state?.trim().toUpperCase(),
  ].filter(Boolean) as string[];

  for (const event of events) {
    if (event.featured_market_city?.trim()) {
      labels.add(event.featured_market_city.trim());
    }
  }

  for (const seed of COMMUNITY_MARKET_SEEDS) {
    const cityHit = cities.some(
      (city) =>
        city.toLowerCase() === seed.city.toLowerCase() ||
        seed.city_anchors.some((a) => a.toLowerCase() === city.toLowerCase()),
    );
    const stateHit = states.includes(seed.state);
    if (cityHit || (stateHit && cities.length === 0)) {
      labels.add(seed.county_name);
      if (seed.region) labels.add(seed.region);
    }
  }

  for (const city of cities.slice(0, 4)) {
    labels.add(`${city} Community`);
  }

  return Array.from(labels).slice(0, 8);
}

export async function getPartnerCommandCenterStats(
  events: CommunityEventRow[],
  range: CommandCenterRange = "month",
  partner?: { city?: string | null; state?: string | null } | null,
): Promise<PartnerCommandCenterStats> {
  const now = Date.now();
  const upcoming = events.filter(
    (event) =>
      new Date(event.start_at).getTime() >= now - 6 * 60 * 60 * 1000 &&
      ["draft", "pending_review", "changes_requested", "approved", "published"].includes(
        event.status,
      ) &&
      event.status !== "cancelled",
  ).length;

  const publishedOrLive = events.filter((e) => e.status !== "draft").slice(0, 40);
  const start = rangeStart(range);

  const eventNames = [
    "event_view",
    "event_share",
    "event_link_copy",
    "event_partner_click",
    "event_guru_click",
    "event_registration_click",
  ];

  let analyticsQuery = supabaseAdmin
    .from("analytics_events")
    .select("event_name, metadata, created_at")
    .in("event_name", eventNames)
    .limit(8000);

  if (start) {
    analyticsQuery = analyticsQuery.gte("created_at", start);
  }

  const [{ data: analyticsRows }, attendanceLists] = await Promise.all([
    analyticsQuery,
    Promise.all(
      publishedOrLive.map(async (event) => {
        const counts = await getEventAttendanceCounts(event.id);
        return { eventId: event.id, counts };
      }),
    ),
  ]);

  const idSet = new Set(events.map((e) => e.id));
  const slugSet = new Set(events.map((e) => e.slug));
  const rows = (analyticsRows || []) as Array<{
    event_name: string;
    metadata: Record<string, unknown> | null;
    created_at: string;
  }>;

  const matchesEvent = (row: (typeof rows)[number]) => {
    const metadata = row.metadata || {};
    const rowEventId = String(metadata.eventId || metadata.event_id || "");
    const rowSlug = String(metadata.slug || "");
    return idSet.has(rowEventId) || slugSet.has(rowSlug);
  };

  const relevant = rows.filter(matchesEvent);
  const views = relevant.filter((r) => r.event_name === "event_view").length;
  const shares = relevant.filter((r) =>
    ["event_share", "event_link_copy"].includes(r.event_name),
  ).length;
  const clicks = relevant.filter((r) =>
    [
      "event_partner_click",
      "event_guru_click",
      "event_registration_click",
    ].includes(r.event_name),
  ).length;

  const viewsByDayMap = new Map<string, number>();
  for (const row of relevant) {
    if (row.event_name !== "event_view") continue;
    const key = dayKey(row.created_at);
    viewsByDayMap.set(key, (viewsByDayMap.get(key) || 0) + 1);
  }

  const viewsByDay = Array.from(viewsByDayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, dayViews]) => ({ date, views: dayViews }));

  const attendanceById = new Map(
    attendanceLists.map((item) => [item.eventId, item.counts]),
  );

  let interested = 0;
  let petParents = 0;
  let gurus = 0;
  let ambassadors = 0;

  const perEvent: PartnerEventCardMetrics[] = events.map((event) => {
    const attendance = attendanceById.get(event.id);
    const going = attendance?.totalGoing || 0;
    const maybe = attendance?.totalMaybe || 0;
    const eventInterested = going + maybe;
    interested += eventInterested;
    petParents += attendance?.petParents || 0;
    gurus += attendance?.gurus || 0;
    ambassadors += attendance?.ambassadors || 0;

    const eventViews = relevant.filter((row) => {
      if (row.event_name !== "event_view") return false;
      const metadata = row.metadata || {};
      return (
        String(metadata.eventId || metadata.event_id || "") === event.id ||
        String(metadata.slug || "") === event.slug
      );
    }).length;

    const eventShares = relevant.filter((row) => {
      if (!["event_share", "event_link_copy"].includes(row.event_name)) {
        return false;
      }
      const metadata = row.metadata || {};
      return (
        String(metadata.eventId || metadata.event_id || "") === event.id ||
        String(metadata.slug || "") === event.slug
      );
    }).length;

    const eventClicks = relevant.filter((row) => {
      if (
        ![
          "event_partner_click",
          "event_guru_click",
          "event_registration_click",
        ].includes(row.event_name)
      ) {
        return false;
      }
      const metadata = row.metadata || {};
      return (
        String(metadata.eventId || metadata.event_id || "") === event.id ||
        String(metadata.slug || "") === event.slug
      );
    }).length;

    return {
      eventId: event.id,
      views: eventViews,
      shares: eventShares,
      clicks: eventClicks,
      interested: eventInterested,
      going,
      maybe,
      petParents: attendance?.petParents || 0,
      gurus: attendance?.gurus || 0,
      ambassadors: attendance?.ambassadors || 0,
    };
  });

  return {
    range,
    upcoming,
    views,
    interested,
    shares,
    clicks,
    petParents,
    gurus,
    ambassadors,
    viewsByDay,
    perEvent,
    reachLabels: resolveCommunityReachLabels(events, partner),
  };
}
