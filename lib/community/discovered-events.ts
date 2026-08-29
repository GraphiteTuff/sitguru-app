import { supabaseAdmin } from "@/lib/supabase/admin";
import { GOOGLE_DISCOVERY_EVENT_TYPE } from "@/lib/community/event-preview";
import {
  effectivePetRelevanceScore,
} from "@/lib/community/pet-relevance";
import type { CommunityEventWithPartner } from "@/lib/community/types";

export type CommunityEventDiscoveryRow = {
  id: string;
  external_id: string;
  source: string;
  market_id?: string | null;
  county: string | null;
  search_query: string | null;
  title: string;
  short_description: string | null;
  venue_name: string | null;
  address_line: string | null;
  city: string | null;
  state: string | null;
  start_at: string;
  end_at: string | null;
  timezone: string | null;
  image_url: string | null;
  event_url: string;
  is_free: boolean;
  pet_friendly: boolean;
  pet_relevance_score?: number | null;
  pet_relevance_override?: number | null;
  qualifying_pet_event?: boolean | null;
  status?: string;
  synced_at: string;
  created_at?: string;
  updated_at?: string;
  community_markets?: {
    id: string;
    name: string;
    slug: string;
    county_name: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
};

function marketLabel(row: CommunityEventDiscoveryRow) {
  if (row.community_markets?.name) return row.community_markets.name;
  if (row.community_markets?.county_name) {
    return `${row.community_markets.county_name}, ${row.state || "PA"}`;
  }
  if (row.county === "bucks") return "Bucks County, PA";
  if (row.county === "montgomery") return "Montgomery County, PA";
  if (row.county) return row.county;
  return "Community Market";
}

function discoveryCountyLabel(row: CommunityEventDiscoveryRow) {
  if (row.community_markets?.county_name?.trim()) {
    return row.community_markets.county_name.trim();
  }
  if (row.community_markets?.name?.trim()) {
    return row.community_markets.name.split(",")[0]?.trim() || null;
  }
  if (row.county === "bucks") return "Bucks County";
  if (row.county === "montgomery") return "Montgomery County";
  if (row.county?.includes("county") || row.county?.includes("-")) {
    return row.county
      .replace(/-/g, " ")
      .replace(/\bpa\b/gi, "")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return row.city?.trim() || null;
}

export function mapDiscoveryToCommunityEvent(
  row: CommunityEventDiscoveryRow,
): CommunityEventWithPartner {
  const label = marketLabel(row);
  const petScore = effectivePetRelevanceScore(row);

  // Priority 3: highly relevant SerpApi pet events (lower number = higher in DB featured,
  // but discoveries never enter partner featured query — used for discovery sort only).
  const featuredPriority = petScore >= 90 ? 30 : petScore >= 70 ? 40 : 55;

  return {
    id: row.id,
    partner_id: "00000000-0000-0000-0000-000000000000",
    created_by: null,
    title: row.title,
    slug: `google-${row.external_id.slice(0, 48)}`,
    short_description:
      row.short_description ||
      `Discovered pet friendly event in ${label}.`,
    description: row.short_description,
    event_type: GOOGLE_DISCOVERY_EVENT_TYPE,
    categories: ["Community"],
    image_original_url: row.image_url,
    image_hero_url: row.image_url,
    image_card_url: row.image_url,
    image_mobile_url: row.image_url,
    social_square_url: null,
    social_story_url: null,
    social_landscape_url: null,
    image_storage_bucket: null,
    image_storage_path: null,
    start_at: row.start_at,
    end_at: row.end_at,
    timezone: row.timezone || "America/New_York",
    venue_name: row.venue_name,
    address_line_1: row.address_line,
    address_line_2: null,
    city: row.city,
    state: row.state || "PA",
    postal_code: null,
    country: "US",
    latitude: row.community_markets?.latitude ?? null,
    longitude: row.community_markets?.longitude ?? null,
    pet_friendly: row.pet_friendly || petScore >= 40,
    family_friendly: true,
    outdoor: true,
    is_free: row.is_free,
    registration_required: false,
    ticket_url: null,
    event_url: row.event_url,
    contact_email: null,
    status: "published",
    featured_status: "homepage",
    featured_priority: featuredPriority,
    featured_start_at: null,
    featured_end_at: null,
    featured_market_city: discoveryCountyLabel(row),
    featured_market_state: row.state || "PA",
    moderation_note: null,
    moderated_by: null,
    moderated_at: null,
    published_at: row.synced_at,
    cancelled_at: null,
    created_at: row.created_at || row.synced_at,
    updated_at: row.updated_at || row.synced_at,
    partners: {
      id: "00000000-0000-0000-0000-000000000001",
      business_name: "Community Event",
      slug: null,
      city: discoveryCountyLabel(row) || row.city,
      state: row.state || "PA",
      website: row.event_url,
      email: null,
    },
  };
}

function sortDiscoveriesForDisplay(rows: CommunityEventDiscoveryRow[]) {
  return [...rows].sort((a, b) => {
    const scoreDiff =
      effectivePetRelevanceScore(b) - effectivePetRelevanceScore(a);
    if (scoreDiff !== 0) return scoreDiff;
    return String(a.start_at).localeCompare(String(b.start_at));
  });
}

export async function fetchDiscoveredHomepageEvents(opts?: {
  limit?: number;
  marketId?: string;
  marketSlug?: string;
  city?: string;
  state?: string;
  county?: string;
  /** When true (default), only markets marked homepage_eligible on community_geographies. */
  homepageEligibleOnly?: boolean;
  /** Minimum effective pet relevance (default 40 for public surfaces). */
  minPetScore?: number;
}) {
  const limit = opts?.limit ?? 12;
  const minPetScore = opts?.minPetScore ?? 40;
  const homepageEligibleOnly = opts?.homepageEligibleOnly !== false;

  try {
    const now = new Date().toISOString();

    let eligibleMarketIds: string[] | null = null;
    if (homepageEligibleOnly && !opts?.marketId && !opts?.marketSlug) {
      try {
        const { listHomepageEligibleMarketIds } = await import(
          "@/lib/community/geography-queries"
        );
        const eligible = await listHomepageEligibleMarketIds();
        if (eligible.ready) {
          eligibleMarketIds = eligible.marketIds;
        }
      } catch (error) {
        console.warn(
          "fetchDiscoveredHomepageEvents geography lookup:",
          error,
        );
        eligibleMarketIds = null;
      }
    }

    // Fetch extra then sort by pet relevance (PostgREST can't easily express override).
    let query = supabaseAdmin
      .from("community_event_discoveries")
      .select(
        `
        *,
        community_markets:market_id (
          id,
          name,
          slug,
          county_name,
          latitude,
          longitude
        )
      `,
      )
      .eq("status", "active")
      .gte("start_at", now)
      .order("start_at", { ascending: true })
      .limit(Math.max(limit * 4, 48));

    if (opts?.marketId) {
      query = query.eq("market_id", opts.marketId);
    } else if (eligibleMarketIds && eligibleMarketIds.length > 0) {
      query = query.in("market_id", eligibleMarketIds);
    } else if (eligibleMarketIds && eligibleMarketIds.length === 0) {
      // Geography catalog is ready but nothing is homepage-eligible.
      return { events: [] as CommunityEventWithPartner[], lastSyncedAt: null };
    }

    if (opts?.state) {
      query = query.ilike("state", opts.state.trim().slice(0, 2));
    }

    const { data, error } = await query;

    if (error) {
      console.warn("fetchDiscoveredHomepageEvents:", error.message);
      const fallback = await supabaseAdmin
        .from("community_event_discoveries")
        .select("*")
        .gte("start_at", now)
        .order("start_at", { ascending: true })
        .limit(limit);

      const rows = sortDiscoveriesForDisplay(
        (fallback.data || []) as CommunityEventDiscoveryRow[],
      ).filter((row) => effectivePetRelevanceScore(row) >= minPetScore);
      return {
        events: rows.slice(0, limit).map(mapDiscoveryToCommunityEvent),
        lastSyncedAt: rows[0]?.synced_at || null,
      };
    }

    let rows = (data || []) as CommunityEventDiscoveryRow[];
    if (opts?.marketSlug) {
      rows = rows.filter(
        (row) =>
          row.community_markets?.slug === opts.marketSlug ||
          row.county === opts.marketSlug,
      );
    }

    const countyNeedle = opts?.county?.trim().toLowerCase();
    const cityNeedle = opts?.city?.trim().toLowerCase();
    if (countyNeedle) {
      const needle = countyNeedle.replace(/\s+county$/i, "");
      rows = rows.filter((row) => {
        const label = discoveryCountyLabel(row)?.toLowerCase() || "";
        const marketCounty =
          row.community_markets?.county_name?.toLowerCase() || "";
        return (
          label.includes(needle) ||
          marketCounty.includes(needle) ||
          (row.county || "").toLowerCase().includes(countyNeedle)
        );
      });
    } else if (cityNeedle) {
      rows = rows.filter((row) =>
        (row.city || "").toLowerCase().includes(cityNeedle),
      );
    }

    rows = sortDiscoveriesForDisplay(rows).filter(
      (row) => effectivePetRelevanceScore(row) >= minPetScore,
    );

    const lastSyncedAt =
      rows.reduce<string | null>((latest, row) => {
        if (!latest || row.synced_at > latest) return row.synced_at;
        return latest;
      }, null) ||
      rows[0]?.synced_at ||
      null;

    return {
      events: rows.slice(0, limit).map(mapDiscoveryToCommunityEvent),
      lastSyncedAt,
    };
  } catch (error) {
    console.warn("fetchDiscoveredHomepageEvents crashed:", error);
    return { events: [] as CommunityEventWithPartner[], lastSyncedAt: null };
  }
}
