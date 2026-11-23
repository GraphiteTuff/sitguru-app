import { supabaseAdmin } from "@/lib/supabase/admin";
import { loadSocialConnectorStatus } from "@/lib/growth-center-v2/social-connectors";
import { zonedParts, formatRangeLabel } from "@/lib/growth-center-v2/date-range";
import type { GrowthCenterFilters } from "@/lib/growth-center-v2/types";
import {
  SOCIAL_CHANNELS,
  SOCIAL_LABELS,
  type ImpactCounts,
  type PostMetrics,
  type SocialChannel,
  type SocialIntelligenceSnapshot,
  type SocialPost,
} from "./types";

type Row = Record<string, unknown>;
const EVENT_LIMIT = 16000;
const EMPTY_METRICS: PostMetrics = {
  views: null, reach: null, likes: null, comments: null, shares: null, saves: null,
  follows: null, hookRate: null, averageWatchSeconds: null, capturedAt: null, source: null,
};
const emptyImpact = (): ImpactCounts => ({
  pageViews: 0, linkClicks: 0, signupEvents: 0, bookingEvents: 0,
  paidBookings: null, netRevenueCents: null,
});
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const count = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
};
const channelOf = (source: unknown): SocialChannel | null => {
  const raw = text(source).toLowerCase().replace(/^@/, "");
  if (raw === "fb" || raw === "facebook_group" || raw === "meta_facebook") return "facebook";
  if (raw === "ig" || raw === "meta_instagram") return "instagram";
  if (raw === "twitter") return "x";
  return SOCIAL_CHANNELS.find((item) => item === raw) || null;
};
function day(iso: string) {
  const parts = zonedParts(new Date(iso));
  return [parts.year, String(parts.month).padStart(2, "0"), String(parts.day).padStart(2, "0")].join("-");
}
function inRange(row: Row, start: string, end: string) {
  const created = text(row.created_at);
  return created >= start && created < end;
}
function countEvent(impact: ImpactCounts, type: string) {
  if (type === "page_view") impact.pageViews += 1;
  else if (type === "click") impact.linkClicks += 1;
  else if (type === "signup" || type.startsWith("signup_")) impact.signupEvents += 1;
  else if (type === "booking") impact.bookingEvents += 1;
}
function audienceOf(row: Row) {
  const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata as Row : {};
  const attribution = metadata.attribution && typeof metadata.attribution === "object" ? metadata.attribution as Row : {};
  return text(metadata.role || attribution.role).toLowerCase();
}
function selectedEvent(row: Row, filters: GrowthCenterFilters) {
  const channel = channelOf(row.source || row.medium);
  if (!channel || (filters.platform !== "all" && filters.platform !== channel)) return false;
  if (filters.campaignId && text(row.campaign_slug) !== filters.campaignId && text(row.campaign_id) !== filters.campaignId) return false;
  if (filters.audience !== "all" && audienceOf(row) !== filters.audience) return false;
  return true;
}
function emptyPostMetrics(row?: Row): PostMetrics {
  if (!row) return { ...EMPTY_METRICS };
  return {
    views: count(row.views), reach: count(row.reach), likes: count(row.likes),
    comments: count(row.comments), shares: count(row.shares), saves: count(row.saves),
    follows: count(row.follows), hookRate: count(row.hook_rate),
    averageWatchSeconds: count(row.average_watch_seconds),
    capturedAt: text(row.captured_at) || null,
    source: text(row.source) || null,
  };
}
function matchedPostEvents(events: Row[], key: string) {
  if (!key) return [];
  return events.filter((row) => {
    const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata as Row : {};
    return text(metadata.utm_content) === key;
  });
}
async function rows(query: PromiseLike<{ data: unknown; error: unknown }>, label: string, notices: string[]): Promise<Row[]> {
  try {
    const response = await query;
    if (response.error) {
      notices.push(label + " is not connected or could not be read.");
      return [];
    }
    return Array.isArray(response.data) ? response.data as Row[] : [];
  } catch {
    notices.push(label + " is temporarily unavailable.");
    return [];
  }
}
function eventImpact(events: Row[], start: string, end: string) {
  const result = emptyImpact();
  for (const row of events) if (inRange(row, start, end)) countEvent(result, text(row.event_type));
  return result;
}
function eventDateSeries(events: Row[], filters: GrowthCenterFilters) {
  const grouped = new Map<string, { date: string; pageViews: number; linkClicks: number; signupEvents: number; bookingEvents: number }>();
  for (const row of events) {
    if (!inRange(row, filters.startIso, filters.endIso)) continue;
    const key = day(text(row.created_at));
    const item = grouped.get(key) || { date: key, pageViews: 0, linkClicks: 0, signupEvents: 0, bookingEvents: 0 };
    const type = text(row.event_type);
    if (type === "page_view") item.pageViews++;
    if (type === "click") item.linkClicks++;
    if (type === "signup" || type.startsWith("signup_")) item.signupEvents++;
    if (type === "booking") item.bookingEvents++;
    grouped.set(key, item);
  }
  const result: Array<{ date: string; pageViews: number; linkClicks: number; signupEvents: number; bookingEvents: number }> = [];
  for (let timestamp = Date.parse(filters.startIso); timestamp < Date.parse(filters.endIso); timestamp += 86400000) {
    const key = day(new Date(timestamp + 12 * 3600000).toISOString());
    // UTC day stepping can cross one extra local date at daylight-saving
    // transitions; never display activity beyond the requested end date.
    if (key > day(new Date(Date.parse(filters.endIso) - 1000).toISOString())) break;
    if (!result.some((item) => item.date === key)) {
      result.push(grouped.get(key) || { date: key, pageViews: 0, linkClicks: 0, signupEvents: 0, bookingEvents: 0 });
    }
  }
  return result.sort((a, b) => a.date.localeCompare(b.date));
}

/** Read-only, role-filtered Social Intelligence snapshot. No simulated social metrics. */
export async function loadSocialIntelligenceSnapshot(input: {
  filters: GrowthCenterFilters;
  internId?: string | null;
}): Promise<SocialIntelligenceSnapshot> {
  const { filters } = input;
  const notices: string[] = [];
  const contentQuery = supabaseAdmin.from("internship_content")
    .select("id,intern_id,title,platform,published_url,published_at,campaign_id,created_at")
    .not("published_url", "is", null)
    .limit(300);
  if (input.internId) contentQuery.eq("intern_id", input.internId);

  const [allEvents, publications, samples, legacyPosts, connections, metaSyncRows] = await Promise.all([
    rows(supabaseAdmin.from("growth_campaign_events")
      .select("id,campaign_id,campaign_name,campaign_slug,event_type,source,medium,created_at,metadata,booking_id")
      .gte("created_at", filters.priorStartIso).lt("created_at", filters.endIso)
      .order("created_at", { ascending: false }).limit(EVENT_LIMIT), "Campaign event history", notices),
    rows(supabaseAdmin.from("growth_social_publications")
      .select("id,studio_content_id,platform,provider_post_id,permalink,title,thumbnail_url,published_at,campaign_slug,tracking_key")
      .order("published_at", { ascending: false }).limit(350), "Published social post catalog", notices),
    rows(supabaseAdmin.from("growth_social_post_metrics")
      .select("publication_id,captured_at,views,reach,likes,comments,shares,saves,follows,hook_rate,average_watch_seconds,source")
      .order("captured_at", { ascending: false }).limit(5000), "Provider post insights", notices),
    rows(contentQuery, "Content Studio published posts", notices),
    loadSocialConnectorStatus(),
    rows(supabaseAdmin.from("growth_social_meta_sync_status")
      .select("platform,status,imported_posts,last_attempt_at,last_success_at")
      .limit(2), "Official Meta post import status", notices),
  ]);

  // Interns may only see attribution events and provider posts tied to their own
  // published, approved Content Studio items. Aggregate campaign totals and
  // unrelated post metrics must never leak through the service-role client.
  const allowedStudioIds = new Set(legacyPosts.map((row) => text(row.id)));
  const permittedPublications = input.internId
    ? publications.filter((row) => allowedStudioIds.has(text(row.studio_content_id)))
    : publications;
  // Every official channel stays visible in the published-content section,
  // even when a single platform filter is active. Keep counts inside the
  // user's permissions and selected date/campaign range, not the global catalog.
  const publishedChannelCounts: Record<SocialChannel, number> = {
    facebook: 0, instagram: 0, tiktok: 0, x: 0, youtube: 0,
  };
  const countedStudioIds = new Set<string>();
  for (const publication of permittedPublications) {
    const channel = channelOf(publication.platform);
    const publishedAt = text(publication.published_at);
    if (!channel || !publishedAt || publishedAt < filters.startIso || publishedAt >= filters.endIso) continue;
    if (filters.campaignId && text(publication.campaign_slug) !== filters.campaignId) continue;
    publishedChannelCounts[channel] += 1;
    const studioId = text(publication.studio_content_id);
    if (studioId) countedStudioIds.add(studioId);
  }
  for (const post of legacyPosts) {
    const channel = channelOf(post.platform);
    const publishedAt = text(post.published_at) || text(post.created_at);
    const studioId = text(post.id);
    if (!channel || !text(post.published_url).startsWith("https://") ||
      publishedAt < filters.startIso || publishedAt >= filters.endIso || countedStudioIds.has(studioId)) continue;
    publishedChannelCounts[channel] += 1;
  }
  const allowedTrackingKeys = new Set([
    ...permittedPublications.map((row) => text(row.tracking_key)).filter(Boolean),
    ...(input.internId ? legacyPosts.map((row) => "sg_" + text(row.id)) : []),
  ]);
  const scopedEvents = allEvents.filter((row) => {
    if (!selectedEvent(row, filters)) return false;
    if (!input.internId) return true;
    const metadata = row.metadata && typeof row.metadata === "object"
      ? row.metadata as Row : {};
    return allowedTrackingKeys.has(text(metadata.utm_content));
  });
  const currentEvents = scopedEvents.filter((row) => inRange(row, filters.startIso, filters.endIso));
  const total = eventImpact(scopedEvents, filters.startIso, filters.endIso);
  const prior = eventImpact(scopedEvents, filters.priorStartIso, filters.priorEndIso);

  const latest = new Map<string, Row>();
  const history = new Map<string, Row[]>();
  for (const sample of samples) {
    const id = text(sample.publication_id);
    if (!id) continue;
    if (!latest.has(id) && text(sample.captured_at) < filters.endIso) latest.set(id, sample);
    const list = history.get(id) || [];
    if (list.length < 100) list.push(sample);
    history.set(id, list);
  }

  const catalog: SocialPost[] = [];
  for (const row of permittedPublications) {
    const channel = channelOf(row.platform);
    if (!channel) continue;
    if (filters.platform !== "all" && filters.platform !== channel) continue;
    if (filters.campaignId && text(row.campaign_slug) !== filters.campaignId) continue;
    const publishedAt = text(row.published_at);
    if (publishedAt && (publishedAt < filters.startIso || publishedAt >= filters.endIso)) continue;
    const key = text(row.tracking_key);
    const postEvents = matchedPostEvents(currentEvents, key).filter((event) => channelOf(event.source || event.medium) === channel);
    const points = (history.get(text(row.id)) || [])
      .filter((sample) => text(sample.captured_at) >= filters.startIso && text(sample.captured_at) < filters.endIso)
      .map((sample) => ({ date: text(sample.captured_at), views: count(sample.views) }))
      .reverse();
    catalog.push({
      id: text(row.id), channel, title: text(row.title) || SOCIAL_LABELS[channel] + " post",
      publishedUrl: text(row.permalink), thumbnailUrl: text(row.thumbnail_url) || null,
      publishedAt: publishedAt || null, campaignSlug: text(row.campaign_slug), trackingKey: key,
      studioContentId: text(row.studio_content_id) || null,
      metrics: emptyPostMetrics(latest.get(text(row.id))),
      impact: eventImpact(postEvents, filters.startIso, filters.endIso),
      daily: points,
    });
  }
  for (const row of legacyPosts) {
    const url = text(row.published_url);
    const channel = channelOf(row.platform);
    if (!url.startsWith("https://") || !channel) continue;
    if (filters.platform !== "all" && filters.platform !== channel) continue;
    if (catalog.some((item) => item.studioContentId === text(row.id))) continue;
    const publishedAt = text(row.published_at) || text(row.created_at);
    if (publishedAt < filters.startIso || publishedAt >= filters.endIso) continue;
    const trackingKey = "sg_" + text(row.id);
    const postEvents = matchedPostEvents(currentEvents, trackingKey).filter((event) =>
      channelOf(event.source || event.medium) === channel,
    );
    catalog.push({
      id: text(row.id), channel, title: text(row.title) || "SitGuru post",
      publishedUrl: url, thumbnailUrl: null, publishedAt, campaignSlug: "",
      trackingKey, studioContentId: text(row.id),
      metrics: emptyPostMetrics(),
      impact: eventImpact(postEvents, filters.startIso, filters.endIso), daily: [],
    });
  }

  const channels = SOCIAL_CHANNELS.filter((channel) => filters.platform === "all" || filters.platform === channel)
    .map((channel) => {
      const events = scopedEvents.filter((row) => channelOf(row.source || row.medium) === channel);
      const connector = connections.find((row) => row.platform === channel);
      return {
        channel, impact: eventImpact(events, filters.startIso, filters.endIso),
        followers: connector?.followers ?? null, status: connector?.status ?? "not_configured" as const,
        lastSyncedAt: connector?.lastSyncedAt || null,
      };
    });
  const campaignGroups = new Map<string, { slug: string; label: string; channel: string; events: Row[] }>();
  for (const row of currentEvents) {
    const slug = text(row.campaign_slug);
    if (!slug) continue;
    const group = campaignGroups.get(slug) || { slug, label: text(row.campaign_name) || slug, channel: text(row.source), events: [] };
    group.events.push(row);
    campaignGroups.set(slug, group);
  }
  const campaigns = Array.from(campaignGroups.values())
    .map((group) => ({ slug: group.slug, label: group.label, channel: group.channel, impact: eventImpact(group.events, filters.startIso, filters.endIso) }))
    .sort((a, b) => (b.impact.pageViews + b.impact.linkClicks) - (a.impact.pageViews + a.impact.linkClicks));

  // Compare a provider's known cumulative views only for posts in this catalog.
  // Absence of a provider snapshot means unavailable, never zero.
  const metricPosts = catalog.filter((post) => post.metrics.views != null);
  const postViews = metricPosts.length ? metricPosts.reduce((sum, row) => sum + (row.metrics.views || 0), 0) : null;
  const engagedPosts = catalog.filter((post) => [post.metrics.likes,post.metrics.comments,post.metrics.shares,post.metrics.saves].some((n) => n != null));
  const postEngagements = engagedPosts.length
    ? engagedPosts.reduce((sum, post) => sum + (post.metrics.likes || 0) + (post.metrics.comments || 0) + (post.metrics.shares || 0) + (post.metrics.saves || 0), 0)
    : null;
  const latestAt = catalog.map((post) => post.metrics.capturedAt).filter((at): at is string => Boolean(at)).sort().at(-1) || null;
  const matchedPostEventCount = catalog.reduce((sum, post) => sum + post.impact.pageViews + post.impact.linkClicks + post.impact.signupEvents + post.impact.bookingEvents, 0);
  const truncated = allEvents.length === EVENT_LIMIT;
  if (truncated) notices.push("The selected range contains more activity than the event-read limit; first-party totals may be incomplete.");
  if (!catalog.length) notices.push("No published posts are linked to this date range yet. Publish or import verified post IDs to unlock Reel analytics.");
  if (!matchedPostEventCount) notices.push("Post-by-post conversions require a unique utm_content tracking key on each published link.");
  notices.push("Social views are lifetime provider snapshots, not unique people or views during the selected date range.");
  notices.push("Tracked signup and booking events are not equivalent to verified new customers or paid revenue.");
  notices.push("Revenue attribution is withheld until a verified booking-to-post payment link is recorded.");

  return {
    capturedAt: new Date().toISOString(), rangeLabel: formatRangeLabel(filters), preset: filters.preset,
    platform: filters.platform, audience: filters.audience, campaign: filters.campaignId || "",
    total, prior, postViews, postEngagements, postMetricsAt: latestAt,
    sourceCoverage: { eventsLoaded: allEvents.length, truncated, matchedPostEvents: matchedPostEventCount, bookingAttributionComplete: false },
    daily: eventDateSeries(currentEvents, filters), channels, campaigns, posts: catalog,
    publishedChannelCounts, connections,
    metaSync: (["facebook", "instagram"] as const).map((platform) => {
      const row = metaSyncRows.find((item) => text(item.platform) === platform);
      const status = text(row?.status);
      return {
        platform, status: (status === "success" || status === "error" || status === "attempted") ? status : "never",
        importedPosts: count(row?.imported_posts) || 0,
        lastAttemptAt: text(row?.last_attempt_at) || null,
        lastSuccessAt: text(row?.last_success_at) || null,
      };
    }),
    notices: Array.from(new Set(notices)),
  };
}
