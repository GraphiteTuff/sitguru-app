import { supabaseAdmin } from "@/lib/supabase/admin";
import { isLivePetParentProfile } from "@/lib/admin/customers/pet-parents";
import {
  campaignTrackingUrl,
  channelLabel,
  slugifyCampaign,
} from "@/lib/admin/growth/constants";
import { formatRangeLabel, isoDateLabel } from "./date-range";
import { isGrowthCenterV2Enabled } from "./flag";
import { buildGrowthInsights } from "./insights";
import { METRIC_DEFINITIONS } from "./metrics";
import { loadSocialConnectorStatus } from "./social-connectors";
import type {
  GrowthAudience,
  GrowthCampaignRow,
  GrowthCenterFilters,
  GrowthCenterSnapshot,
  GrowthContentRow,
  GrowthFunnelStep,
  GrowthGoalProgress,
  MetricValue,
} from "./types";

type AnyRow = Record<string, unknown>;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function inWindow(iso: string, start: string, end: string) {
  return Boolean(iso) && iso >= start && iso < end;
}

async function safeRows<T>(
  query: PromiseLike<{ data: unknown; error: unknown }>,
  label: string,
): Promise<T[]> {
  try {
    const result = await query;
    if (result.error) {
      console.warn(`Growth Center v2 skipped ${label}:`, result.error);
      return [];
    }
    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Growth Center v2 skipped ${label}:`, error);
    return [];
  }
}

/** Soft-fail Reads signals so Growth Insights stay online if reads_* tables lag. */
async function loadReadsGrowthSignals(startIso: string, endIso: string) {
  const [events, queue, partners] = await Promise.all([
    safeRows<{ event_name?: string }>(
      supabaseAdmin
        .from("reads_analytics_events")
        .select("event_name")
        .gte("created_at", startIso)
        .lt("created_at", endIso)
        .limit(5000),
      "reads_analytics_events",
    ),
    safeRows<{ id?: string }>(
      supabaseAdmin
        .from("reads_content")
        .select("id")
        .in("status", ["submitted", "changes_requested"])
        .limit(500),
      "reads_content_queue",
    ),
    safeRows<{ id?: string }>(
      supabaseAdmin
        .from("reads_partners")
        .select("id")
        .in("status", ["new", "reviewing", "qualified"])
        .limit(500),
      "reads_partners",
    ),
  ]);

  let pageViews = 0;
  let videoPlays = 0;
  for (const row of events) {
    const name = text(row.event_name);
    if (name === "page_view") pageViews += 1;
    if (name === "video_play") videoPlays += 1;
  }

  return {
    pageViews,
    videoPlays,
    needsReview: queue.length,
    partnerLeads: partners.length,
  };
}

function isVisitEvent(type: string) {
  const t = type.toLowerCase();
  return t === "click" || t === "page_view" || t === "visit" || t === "qr_scan";
}

function isSignupEvent(type: string) {
  const t = type.toLowerCase();
  return t === "signup" || t.startsWith("signup_");
}

function metricValue(
  id: string,
  value: number | null,
  prior: number | null,
  source: string,
  availability: MetricValue["availability"] = value == null ? "unavailable" : "available",
  note?: string,
): MetricValue {
  const def = METRIC_DEFINITIONS[id];
  return {
    id,
    label: def?.label || id,
    value,
    prior,
    unit: def?.unit || "count",
    availability,
    definitionId: id,
    source,
    note,
  };
}

function countIn(
  rows: AnyRow[],
  start: string,
  end: string,
  predicate?: (row: AnyRow) => boolean,
) {
  return rows.filter((row) => {
    if (!inWindow(text(row.created_at), start, end)) return false;
    return predicate ? predicate(row) : true;
  }).length;
}

async function loadGoals(
  filters: GrowthCenterFilters,
  actuals: Record<string, number | null>,
): Promise<GrowthGoalProgress[]> {
  const goals: GrowthGoalProgress[] = [];

  const weeklyGoalRows = await safeRows<AnyRow>(
    supabaseAdmin
      .from("growth_weekly_goals")
      .select(
        "id,label,metric_id,target,owner_label,period_start,period_end,status",
      )
      .lte("period_start", filters.endIso)
      .gte("period_end", filters.startIso)
      .limit(40),
    "growth_weekly_goals",
  );

  for (const row of weeklyGoalRows) {
    const metricId = text(row.metric_id) || "pet_parent_registrations";
    const target = Number(row.target) || 0;
    const actual = actuals[metricId] ?? null;
    const percent =
      actual == null || target <= 0
        ? null
        : Math.round((actual / target) * 1000) / 10;
    const remaining = actual == null ? null : Math.max(target - actual, 0);
    let status: GrowthGoalProgress["status"] = "unavailable";
    if (actual != null && target > 0) {
      if (percent != null && percent >= 100) status = "ahead";
      else if (percent != null && percent >= 60) status = "on_track";
      else status = "at_risk";
    }
    goals.push({
      id: text(row.id) || `${metricId}-${text(row.label)}`,
      label: text(row.label) || METRIC_DEFINITIONS[metricId]?.label || metricId,
      metricId,
      target,
      actual,
      remaining,
      percentComplete: percent,
      status,
      ownerLabel: text(row.owner_label) || "Growth team",
      periodLabel: `${text(row.period_start).slice(0, 10)} → ${text(row.period_end).slice(0, 10)}`,
      source: "growth_weekly_goals",
    });
  }

  const managerGoals = await safeRows<AnyRow>(
    supabaseAdmin.from("manager_work_goals").select("owner_user_id,goals,updated_at").limit(20),
    "manager_work_goals",
  );

  for (const row of managerGoals) {
    const payload = row.goals;
    const list = Array.isArray(payload)
      ? payload
      : payload && typeof payload === "object"
        ? Object.values(payload as Record<string, unknown>)
        : [];
    for (const raw of list) {
      if (!raw || typeof raw !== "object") continue;
      const item = raw as AnyRow;
      const label = text(item.label) || text(item.title) || text(item.name);
      const target = Number(item.target ?? item.goal ?? item.value) || 0;
      const metricId =
        text(item.metric_id) ||
        text(item.metricId) ||
        (label.toLowerCase().includes("guru")
          ? "guru_registrations"
          : label.toLowerCase().includes("pet")
            ? "pet_parent_registrations"
            : "campaign_signups");
      if (!label || target <= 0) continue;
      const actual = actuals[metricId] ?? null;
      const percent =
        actual == null ? null : Math.round((actual / target) * 1000) / 10;
      goals.push({
        id: `mgr-${text(row.owner_user_id)}-${label}`,
        label,
        metricId,
        target,
        actual,
        remaining: actual == null ? null : Math.max(target - actual, 0),
        percentComplete: percent,
        status:
          actual == null
            ? "unavailable"
            : percent != null && percent >= 100
              ? "ahead"
              : percent != null && percent >= 60
                ? "on_track"
                : "at_risk",
        ownerLabel: "Manager weekly goals",
        periodLabel: formatRangeLabel(filters),
        source: "manager_work_goals",
      });
    }
  }

  if (!goals.length) {
    const defaults: Array<[string, number]> = [
      ["pet_parent_registrations", 10],
      ["guru_registrations", 5],
      ["campaign_signups", 8],
    ];
    for (const [metricId, target] of defaults) {
      const actual = actuals[metricId] ?? null;
      const percent =
        actual == null ? null : Math.round((actual / target) * 1000) / 10;
      goals.push({
        id: `default-${metricId}`,
        label: METRIC_DEFINITIONS[metricId]?.label || metricId,
        metricId,
        target,
        actual,
        remaining: actual == null ? null : Math.max(target - actual, 0),
        percentComplete: percent,
        status:
          actual == null
            ? "unavailable"
            : percent != null && percent >= 100
              ? "ahead"
              : percent != null && percent >= 60
                ? "on_track"
                : "at_risk",
        ownerLabel: "Suggested weekly target",
        periodLabel: formatRangeLabel(filters),
        source: "growth_center_v2_defaults",
      });
    }
  }

  return goals.slice(0, 12);
}

export async function loadGrowthCenterSnapshot(input: {
  audience: GrowthAudience;
  filters: GrowthCenterFilters;
  internUserId?: string | null;
}): Promise<GrowthCenterSnapshot> {
  const { audience, filters } = input;
  const flagEnabled = await isGrowthCenterV2Enabled();
  const coverageNotes: string[] = [];

  const [
    parentRows,
    guruRows,
    ambassadorRows,
    referralRows,
    eventRows,
    bookingRows,
    campaignRows,
    contentRows,
    social,
    communitySubs,
    campusProfiles,
    campusVisits,
    campusLeads,
  ] = await Promise.all([
    safeRows<AnyRow>(
      supabaseAdmin
        .from("profiles")
        .select(
          "id,role,account_type,signup_role,admin_status,is_demo,is_test_account,is_archived,archived_at,deleted_at,created_at",
        )
        .gte("created_at", filters.priorStartIso)
        .lt("created_at", filters.endIso)
        .limit(8000),
      "profiles",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("gurus")
        .select("id,created_at")
        .gte("created_at", filters.priorStartIso)
        .lt("created_at", filters.endIso)
        .limit(4000),
      "gurus",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("ambassadors")
        .select("id,created_at")
        .gte("created_at", filters.priorStartIso)
        .lt("created_at", filters.endIso)
        .limit(2000),
      "ambassadors",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("referral_clicks")
        .select("id,created_at,utm_source")
        .gte("created_at", filters.priorStartIso)
        .lt("created_at", filters.endIso)
        .limit(8000),
      "referral_clicks",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("growth_campaign_events")
        .select(
          "id,campaign_id,campaign_name,campaign_slug,event_type,source,medium,created_at",
        )
        .gte("created_at", filters.priorStartIso)
        .lt("created_at", filters.endIso)
        .limit(12000),
      "growth_campaign_events",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("bookings")
        .select("id,created_at,status")
        .gte("created_at", filters.priorStartIso)
        .lt("created_at", filters.endIso)
        .limit(4000),
      "bookings",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("growth_campaigns")
        .select(
          "id,campaign_name,campaign_slug,channel,status,destination_url,created_at",
        )
        .order("created_at", { ascending: false })
        .limit(80),
      "growth_campaigns",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("admin_marketing_content_calendar")
        .select(
          "id,title,platform,audience,campaign,status,planned_date,owner_name,created_at",
        )
        .order("planned_date", { ascending: false, nullsFirst: false })
        .limit(80),
      "content_calendar",
    ),
    loadSocialConnectorStatus(),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("community_studio_submissions")
        .select("id,created_at,status")
        .gte("created_at", filters.startIso)
        .lt("created_at", filters.endIso)
        .limit(2000),
      "community_studio_submissions",
    ),
    safeRows<AnyRow>(
      supabaseAdmin.from("campus_growth_profiles").select("id").limit(200),
      "campus_profiles",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("campus_growth_visits")
        .select("id,created_at")
        .gte("created_at", filters.startIso)
        .lt("created_at", filters.endIso)
        .limit(4000),
      "campus_visits",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("campus_growth_leads")
        .select("id,created_at")
        .gte("created_at", filters.startIso)
        .lt("created_at", filters.endIso)
        .limit(2000),
      "campus_leads",
    ),
  ]);

  const liveParents = parentRows.filter(isLivePetParentProfile);
  const petParents = countIn(liveParents, filters.startIso, filters.endIso);
  const priorPetParents = countIn(
    liveParents,
    filters.priorStartIso,
    filters.priorEndIso,
  );
  const gurus = countIn(guruRows, filters.startIso, filters.endIso);
  const priorGurus = countIn(guruRows, filters.priorStartIso, filters.priorEndIso);
  const ambassadors = countIn(ambassadorRows, filters.startIso, filters.endIso);
  const priorAmbassadors = countIn(
    ambassadorRows,
    filters.priorStartIso,
    filters.priorEndIso,
  );

  const platformFilter = filters.platform;
  const eventMatchesPlatform = (row: AnyRow) => {
    if (platformFilter === "all" || platformFilter === "sitguru") return true;
    const source = `${text(row.source)} ${text(row.medium)} ${text(row.campaign_slug)}`.toLowerCase();
    return source.includes(platformFilter);
  };

  const scopedEvents = eventRows.filter(eventMatchesPlatform);
  const visits = countIn(scopedEvents, filters.startIso, filters.endIso, (row) =>
    isVisitEvent(text(row.event_type)),
  );
  const priorVisits = countIn(
    scopedEvents,
    filters.priorStartIso,
    filters.priorEndIso,
    (row) => isVisitEvent(text(row.event_type)),
  );
  const signups = countIn(scopedEvents, filters.startIso, filters.endIso, (row) =>
    isSignupEvent(text(row.event_type)),
  );
  const priorSignups = countIn(
    scopedEvents,
    filters.priorStartIso,
    filters.priorEndIso,
    (row) => isSignupEvent(text(row.event_type)),
  );

  const referrals = countIn(referralRows, filters.startIso, filters.endIso);
  const priorReferrals = countIn(
    referralRows,
    filters.priorStartIso,
    filters.priorEndIso,
  );
  const bookings = countIn(bookingRows, filters.startIso, filters.endIso);
  const priorBookings = countIn(
    bookingRows,
    filters.priorStartIso,
    filters.priorEndIso,
  );

  const conversion =
    visits === 0 ? null : Math.round((signups / visits) * 1000) / 10;
  const priorConversion =
    priorVisits === 0 ? null : Math.round((priorSignups / priorVisits) * 1000) / 10;

  const followersSum = social.reduce((sum, row) => sum + (row.followers || 0), 0);
  const hasFollowerData = social.some((row) => row.followers != null);

  const content: GrowthContentRow[] = contentRows.map((row) => ({
    id: text(row.id),
    title: text(row.title) || "Untitled",
    platform: text(row.platform) || "—",
    audience: text(row.audience) || "—",
    campaign: text(row.campaign),
    status: text(row.status) || "Draft",
    plannedDate: text(row.planned_date) || null,
    owner: text(row.owner_name),
  }));

  const pendingReview = content.filter((item) =>
    ["Submitted to Ava", "Needs CEO Review"].includes(item.status),
  ).length;

  const campaignStats = new Map<
    string,
    { visits: number; signups: number; name: string; slug: string; channel: string; status: string }
  >();

  for (const row of campaignRows) {
    const id = text(row.id);
    if (!id) continue;
    const slug = text(row.campaign_slug) || slugifyCampaign(text(row.campaign_name));
    campaignStats.set(id, {
      visits: 0,
      signups: 0,
      name: text(row.campaign_name) || "Untitled campaign",
      slug,
      channel: channelLabel(text(row.channel) || "other"),
      status: text(row.status) || "active",
    });
  }

  for (const row of scopedEvents) {
    if (!inWindow(text(row.created_at), filters.startIso, filters.endIso)) continue;
    const campaignId = text(row.campaign_id);
    const slug = text(row.campaign_slug);
    let bucket =
      (campaignId && campaignStats.get(campaignId)) ||
      [...campaignStats.values()].find((c) => c.slug === slug);
    if (!bucket && (campaignId || slug)) {
      const key = campaignId || slug;
      bucket = {
        visits: 0,
        signups: 0,
        name: text(row.campaign_name) || slug || "Attributed campaign",
        slug: slug || key,
        channel: text(row.source) || "tracked",
        status: "tracked",
      };
      campaignStats.set(key, bucket);
    }
    if (!bucket) continue;
    if (isVisitEvent(text(row.event_type))) bucket.visits += 1;
    if (isSignupEvent(text(row.event_type))) bucket.signups += 1;
  }

  let campaigns: GrowthCampaignRow[] = [...campaignStats.entries()].map(
    ([id, stats]) => ({
      id,
      name: stats.name,
      slug: stats.slug,
      channel: stats.channel,
      status: stats.status,
      visits: stats.visits,
      signups: stats.signups,
      conversionRate:
        stats.visits === 0
          ? null
          : Math.round((stats.signups / stats.visits) * 1000) / 10,
      trackingUrl: campaignTrackingUrl(stats.slug),
    }),
  );

  if (filters.campaignId) {
    campaigns = campaigns.filter((c) => c.id === filters.campaignId);
  }
  campaigns.sort((a, b) => b.visits - a.visits || b.signups - a.signups);

  if (audience === "intern") {
    coverageNotes.push(
      "Intern view uses the same first-party totals without customer PII.",
    );
  }

  const kpis: MetricValue[] = [
    metricValue(
      "pet_parent_registrations",
      petParents,
      priorPetParents,
      "profiles",
    ),
    metricValue("guru_registrations", gurus, priorGurus, "gurus"),
    metricValue(
      "ambassador_registrations",
      ambassadors,
      priorAmbassadors,
      "ambassadors",
    ),
    metricValue("campaign_visits", visits, priorVisits, "growth_campaign_events"),
    metricValue("campaign_signups", signups, priorSignups, "growth_campaign_events"),
    metricValue(
      "registration_conversion_rate",
      conversion,
      priorConversion,
      "growth_campaign_events",
      conversion == null ? "unavailable" : "available",
      conversion == null ? "Unavailable when attributed visits are zero." : undefined,
    ),
    metricValue("referral_clicks", referrals, priorReferrals, "referral_clicks"),
    metricValue("booking_requests", bookings, priorBookings, "bookings"),
    metricValue(
      "content_in_review",
      pendingReview,
      null,
      "admin_marketing_content_calendar",
    ),
    metricValue(
      "social_followers",
      hasFollowerData ? followersSum : null,
      null,
      "social_platform_metrics",
      hasFollowerData ? "partial" : "unavailable",
      "Not unique people across platforms. Official APIs may still be disconnected.",
    ),
  ];

  if (filters.audience === "guru") {
    for (const kpi of kpis) {
      if (!["guru_registrations", "campaign_visits", "campaign_signups"].includes(kpi.id)) {
        // keep visible but note filter
      }
    }
  }

  const registrations = petParents + gurus;
  const funnel: GrowthFunnelStep[] = [
    {
      id: "visit",
      label: "Attributed visits",
      count: visits,
      availability: "available",
      conversionFromPrior: null,
      source: "growth_campaign_events",
    },
    {
      id: "registration",
      label: "Registrations (Pet Parent + Guru)",
      count: registrations,
      availability: "available",
      conversionFromPrior:
        visits === 0 ? null : Math.round((registrations / visits) * 1000) / 10,
      source: "profiles + gurus",
    },
    {
      id: "booking",
      label: "Bookings started",
      count: bookings,
      availability: "available",
      conversionFromPrior:
        registrations === 0
          ? null
          : Math.round((bookings / registrations) * 1000) / 10,
      source: "bookings",
    },
  ];

  const actuals: Record<string, number | null> = {
    pet_parent_registrations: petParents,
    guru_registrations: gurus,
    ambassador_registrations: ambassadors,
    campaign_visits: visits,
    campaign_signups: signups,
    referral_clicks: referrals,
    booking_requests: bookings,
  };

  const goals = await loadGoals(filters, actuals);

  const readsSignals = await loadReadsGrowthSignals(filters.startIso, filters.endIso);

  const insights = buildGrowthInsights({
    audience,
    filters,
    kpis,
    funnel,
    campaigns,
    contentPending: pendingReview,
    reads: readsSignals,
  });

  const communityCount = communitySubs.length;
  const communityAvailable = communityCount > 0 || communitySubs !== undefined;

  coverageNotes.push(
    "Social engagement/views from Meta/TikTok/YouTube/X require authorized APIs — status shown per platform.",
  );
  coverageNotes.push(
    "Unique viewers are never summed across platforms as unique people.",
  );

  return {
    version: 2,
    flagEnabled,
    audience,
    capturedAt: new Date().toISOString(),
    freshnessLabel: `Updated ${isoDateLabel(new Date().toISOString(), filters.timezone)}`,
    filters,
    kpis,
    funnel,
    social,
    campaigns: campaigns.slice(0, 40),
    content: content.slice(0, 40),
    goals,
    insights,
    community: {
      submissions: communityAvailable ? communityCount : null,
      events: null,
      packParticipants: null,
      availability: communityCount > 0 ? "available" : "partial",
      note:
        communityCount > 0
          ? "Community Studio submissions in range."
          : "No Community Studio submissions in this window (table may be empty).",
    },
    campus: {
      profiles: campusProfiles.length,
      visits: campusVisits.length,
      leads: campusLeads.length,
      availability:
        campusProfiles.length || campusVisits.length || campusLeads.length
          ? "available"
          : "partial",
      note:
        campusProfiles.length || campusVisits.length || campusLeads.length
          ? "Campus Growth tables have recorded activity."
          : "Campus Growth schema is ready; no visits/leads recorded yet.",
    },
    coverageNotes,
  };
}
