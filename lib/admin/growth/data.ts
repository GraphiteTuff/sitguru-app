import { supabaseAdmin } from "@/lib/supabase/admin";
import { isLivePetParentProfile } from "@/lib/admin/customers/pet-parents";
import { isPubliclyVisibleGuruProfile } from "@/lib/gurus/public-visibility";
import {
  campaignTrackingUrl,
  channelLabel,
  getPublicSiteUrl,
  kindMeta,
  slugifyCampaign,
} from "@/lib/admin/growth/constants";
import { compareKpi, isoDaysAgo, type KpiTrend } from "@/lib/sitguru/kpi-trend";

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
      console.warn(`Growth portal skipped ${label}:`, result.error);
      return [];
    }
    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Growth portal skipped ${label}:`, error);
    return [];
  }
}

export type GrowthCampaign = {
  id: string;
  name: string;
  slug: string;
  channel: string;
  channelLabel: string;
  kind: string;
  market: string;
  destination: string;
  trackingUrl: string;
  status: string;
  notes: string;
  createdAt: string | null;
};

export type GrowthContent = {
  id: string;
  title: string;
  platform: string;
  audience: string;
  campaign: string;
  status: string;
  plannedDate: string | null;
  caption: string;
  owner: string;
  createdAt: string | null;
};

export type GrowthPromoteItem = {
  id: string;
  name: string;
  detail: string;
  href: string;
  imageUrl: string;
  market: string;
};

export type GrowthMediaItem = {
  id: string;
  title: string;
  proofType: string;
  source: string;
  status: string;
  campaignUse: string;
  suggestedUse: string;
  notes: string;
};

function toCampaign(row: AnyRow): GrowthCampaign {
  const slug = text(row.campaign_slug) || slugifyCampaign(text(row.campaign_name));
  return {
    id: text(row.id),
    name: text(row.campaign_name) || "Untitled campaign",
    slug,
    channel: text(row.channel) || "other",
    channelLabel: channelLabel(text(row.channel) || "other"),
    kind: text(row.campaign_type) || "marketing",
    market:
      text(row.target_location) ||
      [text(row.target_city), text(row.target_state)].filter(Boolean).join(", "),
    destination: text(row.destination_url) || "/",
    trackingUrl: campaignTrackingUrl(slug),
    status: text(row.status) || "active",
    notes: text(row.notes),
    createdAt: text(row.created_at) || null,
  };
}

export async function listGrowthCampaigns(): Promise<GrowthCampaign[]> {
  const rows = await safeRows<AnyRow>(
    supabaseAdmin
      .from("growth_campaigns")
      .select(
        "id,campaign_name,campaign_slug,channel,campaign_type,target_location,target_city,target_state,destination_url,status,notes,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(80),
    "growth_campaigns",
  );
  return rows.map(toCampaign);
}

export async function getGrowthCampaign(id: string) {
  const rows = await safeRows<AnyRow>(
    supabaseAdmin
      .from("growth_campaigns")
      .select(
        "id,campaign_name,campaign_slug,channel,campaign_type,target_location,target_city,target_state,destination_url,status,notes,created_at,utm_source,utm_medium,utm_campaign",
      )
      .eq("id", id)
      .limit(1),
    "growth_campaign_one",
  );
  return rows[0] ? toCampaign(rows[0]) : null;
}

export async function listGrowthContent(): Promise<GrowthContent[]> {
  const rows = await safeRows<AnyRow>(
    supabaseAdmin
      .from("admin_marketing_content_calendar")
      .select(
        "id,title,platform,audience,campaign,status,planned_date,caption_direction,owner_name,created_at",
      )
      .order("planned_date", { ascending: false, nullsFirst: false })
      .limit(80),
    "growth_content",
  );

  return rows.map((row) => ({
    id: text(row.id),
    title: text(row.title) || "Untitled",
    platform: text(row.platform) || "Instagram",
    audience: text(row.audience) || "Pet Parents",
    campaign: text(row.campaign),
    status: text(row.status) || "Draft",
    plannedDate: text(row.planned_date) || null,
    caption: text(row.caption_direction),
    owner: text(row.owner_name),
    createdAt: text(row.created_at) || null,
  }));
}

export async function listPromotableGurus(): Promise<GrowthPromoteItem[]> {
  const rows = await safeRows<AnyRow>(
    supabaseAdmin
      .from("gurus")
      .select(
        "id,slug,full_name,display_name,name,headline,title,city,state,service_city,service_state,services,specialty,image_url,profile_photo_url,photo_url,avatar_url,is_verified,is_public,is_public_visible,is_active,is_archived,is_test_account,application_status,status,public_status",
      )
      .order("created_at", { ascending: false })
      .limit(80),
    "growth_gurus",
  );

  return rows
    .filter((row) => {
      if (row.is_archived === true || row.is_test_account === true) return false;
      return isPubliclyVisibleGuruProfile(row);
    })
    .map((row) => {
      const name =
        text(row.display_name) ||
        text(row.full_name) ||
        text(row.name) ||
        "Guru";
      const city = text(row.service_city) || text(row.city);
      const state = text(row.service_state) || text(row.state);
      const slug = text(row.slug);
      return {
        id: text(row.id),
        name,
        detail:
          text(row.headline) ||
          text(row.title) ||
          text(row.specialty) ||
          "Public Guru profile",
        href: slug ? `/guru/${slug}` : "/signup?role=pet_parent",
        imageUrl:
          text(row.profile_photo_url) ||
          text(row.image_url) ||
          text(row.photo_url) ||
          text(row.avatar_url),
        market: [city, state].filter(Boolean).join(", "),
      };
    });
}

export async function listPromotableEvents(): Promise<GrowthPromoteItem[]> {
  const rows = await safeRows<AnyRow>(
    supabaseAdmin
      .from("community_events")
      .select(
        "id,title,slug,short_description,city,state,start_at,image_card_url,image_hero_url,status,venue_name",
      )
      .order("start_at", { ascending: true })
      .limit(40),
    "growth_events",
  );

  return rows
    .filter((row) => {
      const status = text(row.status).toLowerCase();
      return !status || ["published", "active", "approved", "live"].includes(status);
    })
    .map((row) => ({
      id: text(row.id),
      name: text(row.title) || "Pet event",
      detail: text(row.short_description) || text(row.venue_name) || "Local pet event",
      href: text(row.slug) ? `/community/events/${text(row.slug)}` : "/community",
      imageUrl: text(row.image_card_url) || text(row.image_hero_url),
      market: [text(row.city), text(row.state)].filter(Boolean).join(", "),
    }));
}

export async function listPromotablePartners(): Promise<GrowthPromoteItem[]> {
  const rows = await safeRows<AnyRow>(
    supabaseAdmin
      .from("partners")
      .select("id,business_name,slug,partner_type,city,state,website,status")
      .order("created_at", { ascending: false })
      .limit(40),
    "growth_partners",
  );

  return rows
    .filter((row) => {
      const status = text(row.status).toLowerCase();
      return !status || ["active", "approved"].includes(status);
    })
    .map((row) => ({
      id: text(row.id),
      name: text(row.business_name) || "Partner",
      detail: text(row.partner_type).replaceAll("_", " ") || "Local partner",
      href: text(row.slug) ? `/partners/${text(row.slug)}` : "/partners",
      imageUrl: "",
      market: [text(row.city), text(row.state)].filter(Boolean).join(", "),
    }));
}

export async function listGrowthMedia(): Promise<GrowthMediaItem[]> {
  const rows = await safeRows<AnyRow>(
    supabaseAdmin
      .from("admin_marketing_proof_library")
      .select(
        "id,title,proof_type,source,status,campaign_use,suggested_use,notes,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(60),
    "growth_media",
  );

  return rows.map((row) => ({
    id: text(row.id),
    title: text(row.title) || "Untitled asset",
    proofType: text(row.proof_type) || "Link",
    source: text(row.source),
    status: text(row.status) || "Collected",
    campaignUse: text(row.campaign_use),
    suggestedUse: text(row.suggested_use),
    notes: text(row.notes),
  }));
}

export type GrowthHomeStats = {
  petParents: number;
  gurus: number;
  referrals: number;
  visits: number;
  signups: number;
  conversion: string;
  campaigns: number;
  pendingReview: number;
  trends: {
    petParents: KpiTrend;
    gurus: KpiTrend;
    referrals: KpiTrend;
    visits: KpiTrend;
    signups: KpiTrend;
    conversion: KpiTrend | null;
    campaigns: KpiTrend;
    pendingReview: KpiTrend;
  };
};

export async function getGrowthHomeStats(): Promise<GrowthHomeStats> {
  const nowIso = new Date().toISOString();
  const thisWeekStart = isoDaysAgo(7);
  const priorWeekStart = isoDaysAgo(14);

  const [parentRows, guruRows, referralRows, events, campaigns, content] =
    await Promise.all([
      safeRows<AnyRow>(
        supabaseAdmin
          .from("profiles")
          .select(
            "id,role,account_type,signup_role,admin_status,is_demo,is_test_account,is_archived,archived_at,deleted_at,created_at",
          )
          .gte("created_at", priorWeekStart)
          .limit(4000),
        "growth_week_profiles",
      ),
      safeRows<AnyRow>(
        supabaseAdmin
          .from("gurus")
          .select("id,created_at")
          .gte("created_at", priorWeekStart)
          .limit(1000),
        "growth_week_gurus",
      ),
      safeRows<AnyRow>(
        supabaseAdmin
          .from("referral_clicks")
          .select("id,created_at")
          .gte("created_at", priorWeekStart)
          .limit(4000),
        "growth_week_referrals",
      ),
      safeRows<AnyRow>(
        supabaseAdmin
          .from("growth_campaign_events")
          .select("id,event_type,created_at")
          .gte("created_at", priorWeekStart)
          .limit(8000),
        "growth_week_events",
      ),
      listGrowthCampaigns(),
      listGrowthContent(),
    ]);

  const countRows = (
    rows: AnyRow[],
    start: string,
    end: string,
    predicate?: (row: AnyRow) => boolean,
  ) =>
    rows.filter((row) => {
      if (!inWindow(text(row.created_at), start, end)) return false;
      return predicate ? predicate(row) : true;
    }).length;

  const isVisit = (row: AnyRow) => {
    const type = text(row.event_type).toLowerCase();
    return type === "click" || type === "page_view";
  };
  const isSignup = (row: AnyRow) =>
    text(row.event_type).toLowerCase() === "signup";

  const liveParents = parentRows.filter(isLivePetParentProfile);
  const petParents = countRows(liveParents, thisWeekStart, nowIso);
  const priorPetParents = countRows(liveParents, priorWeekStart, thisWeekStart);
  const gurus = countRows(guruRows, thisWeekStart, nowIso);
  const priorGurus = countRows(guruRows, priorWeekStart, thisWeekStart);
  const referrals = countRows(referralRows, thisWeekStart, nowIso);
  const priorReferrals = countRows(referralRows, priorWeekStart, thisWeekStart);
  const visits = countRows(events, thisWeekStart, nowIso, isVisit);
  const priorVisits = countRows(events, priorWeekStart, thisWeekStart, isVisit);
  const signups = countRows(events, thisWeekStart, nowIso, isSignup);
  const priorSignups = countRows(
    events,
    priorWeekStart,
    thisWeekStart,
    isSignup,
  );
  const conversionRate = visits === 0 ? null : (signups / visits) * 100;
  const priorConversionRate =
    priorVisits === 0 ? null : (priorSignups / priorVisits) * 100;
  const conversion =
    conversionRate == null ? "—" : `${conversionRate.toFixed(1)}%`;

  const activeCampaigns = campaigns.filter((item) => item.status === "active");
  const pending = content.filter((item) => item.status === "Needs CEO Review");
  const campaignsThisWeek = activeCampaigns.filter((item) =>
    inWindow(item.createdAt || "", thisWeekStart, nowIso),
  ).length;
  const campaignsPriorWeek = activeCampaigns.filter((item) =>
    inWindow(item.createdAt || "", priorWeekStart, thisWeekStart),
  ).length;
  const pendingThisWeek = pending.filter((item) =>
    inWindow(item.createdAt || "", thisWeekStart, nowIso),
  ).length;
  const pendingPriorWeek = pending.filter((item) =>
    inWindow(item.createdAt || "", priorWeekStart, thisWeekStart),
  ).length;

  return {
    petParents,
    gurus,
    referrals,
    visits,
    signups,
    conversion,
    campaigns: activeCampaigns.length,
    pendingReview: pending.length,
    trends: {
      petParents: compareKpi(petParents, priorPetParents),
      gurus: compareKpi(gurus, priorGurus),
      referrals: compareKpi(referrals, priorReferrals),
      visits: compareKpi(visits, priorVisits),
      signups: compareKpi(signups, priorSignups),
      conversion:
        conversionRate == null && priorConversionRate == null
          ? null
          : compareKpi(conversionRate ?? 0, priorConversionRate ?? 0, {
              decimals: 1,
            }),
      campaigns: compareKpi(campaignsThisWeek, campaignsPriorWeek),
      pendingReview: compareKpi(pendingThisWeek, pendingPriorWeek, {
        invert: true,
      }),
    },
  };
}

export async function uniqueCampaignSlug(base: string) {
  const clean = slugifyCampaign(base);
  const existing = await safeRows<AnyRow>(
    supabaseAdmin
      .from("growth_campaigns")
      .select("campaign_slug")
      .eq("campaign_slug", clean)
      .limit(1),
    "growth_slug_check",
  );
  if (!existing.length) return clean;
  return `${clean}-${Date.now().toString(36).slice(-4)}`;
}

export function resolveDestination(kind: string, sourceHref?: string) {
  if (sourceHref) {
    if (sourceHref.startsWith("http")) return sourceHref;
    return `${getPublicSiteUrl()}${sourceHref.startsWith("/") ? "" : "/"}${sourceHref}`;
  }
  const dest = kindMeta(kind).destination;
  return `${getPublicSiteUrl()}${dest}`;
}
