import { NextRequest, NextResponse } from "next/server";
import { listCommunityMarkets } from "@/lib/community/market-queries";
import { fetchDiscoveredHomepageEvents } from "@/lib/community/discovered-events";

export const dynamic = "force-dynamic";

/** Shared public/mobile API for enabled discovery markets + optional events. */
export async function GET(request: NextRequest) {
  const includeEvents =
    request.nextUrl.searchParams.get("includeEvents") === "true";
  const marketSlug = request.nextUrl.searchParams.get("market") || undefined;
  const limit = Number(request.nextUrl.searchParams.get("limit") || 12);

  const markets = await listCommunityMarkets({ enabledOnly: true });
  const filtered = marketSlug
    ? markets.filter((market) => market.slug === marketSlug)
    : markets;

  if (!includeEvents) {
    return NextResponse.json({
      markets: filtered.map((market) => ({
        id: market.id,
        slug: market.slug,
        name: market.name,
        countyName: market.county_name,
        city: market.city,
        state: market.state,
        region: market.region,
        locationQuery: market.location_query,
        radiusMiles: market.radius_miles,
        eventCategories: market.event_categories,
        eventsDiscoveredCount: market.events_discovered_count,
        lastSuccessfulSyncAt: market.last_successful_sync_at,
        nextScheduledSyncAt: market.next_scheduled_sync_at,
      })),
    });
  }

  const discovered = await fetchDiscoveredHomepageEvents({
    limit: Number.isFinite(limit) ? Math.min(40, Math.max(1, limit)) : 12,
    marketSlug,
  });

  return NextResponse.json({
    markets: filtered.map((market) => ({
      id: market.id,
      slug: market.slug,
      name: market.name,
      countyName: market.county_name,
      city: market.city,
      state: market.state,
      region: market.region,
      locationQuery: market.location_query,
      radiusMiles: market.radius_miles,
      eventCategories: market.event_categories,
      eventsDiscoveredCount: market.events_discovered_count,
      lastSuccessfulSyncAt: market.last_successful_sync_at,
      nextScheduledSyncAt: market.next_scheduled_sync_at,
    })),
    events: discovered.events,
    lastSyncedAt: discovered.lastSyncedAt,
    source: "google",
  });
}
