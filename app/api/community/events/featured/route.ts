import { NextRequest, NextResponse } from "next/server";
import { fetchDiscoveredHomepageEvents } from "@/lib/community/discovered-events";
import { getHomepageDemoEvents } from "@/lib/community/homepage-demo-events";
import { fetchFeaturedHomepageEvents, fetchPublicEvents } from "@/lib/community/queries";
import { lookupZipLocation, cleanZipCode } from "@/lib/location/zip-lookup";
import type { CommunityEventWithPartner } from "@/lib/community/types";

export const dynamic = "force-dynamic";

function mergeUniqueEvents(
  primary: CommunityEventWithPartner[],
  secondary: CommunityEventWithPartner[],
  limit = 16,
) {
  const seen = new Set<string>();
  const merged: CommunityEventWithPartner[] = [];

  for (const event of [...primary, ...secondary]) {
    const key = `${event.title}|${event.start_at}|${event.event_url || event.slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(event);
    if (merged.length >= limit) break;
  }

  return merged;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  let city = searchParams.get("city") || undefined;
  let state = searchParams.get("state") || undefined;
  let county = searchParams.get("county") || undefined;
  const zip = cleanZipCode(searchParams.get("zip"));

  if ((!city || !state || !county) && zip.length === 5) {
    try {
      const { resolveCommunityGeography } = await import(
        "@/lib/community/geography-queries"
      );
      const resolved = await resolveCommunityGeography({ zip });
      if (resolved?.ok) {
        city = city || resolved.city || undefined;
        state = state || resolved.state || undefined;
        county = county || resolved.county || undefined;
      } else {
        const location = await lookupZipLocation(zip);
        if (location?.city && location?.state) {
          city = city || location.city;
          state = state || location.state;
        }
      }
    } catch {
      try {
        const location = await lookupZipLocation(zip);
        if (location?.city && location?.state) {
          city = city || location.city;
          state = state || location.state;
        }
      } catch {
        // fall through
      }
    }
  }

  const [featuredEvents, partnerUpcoming, discovered] = await Promise.all([
    fetchFeaturedHomepageEvents({ city, state, limit: 1 }),
    fetchPublicEvents({ city, state, limit: 8 }),
    fetchDiscoveredHomepageEvents({
      city,
      state,
      county,
      limit: 16,
      homepageEligibleOnly: true,
    }),
  ]);

  let featured = featuredEvents[0] || null;
  if (!featured) {
    const nationalFeatured = await fetchFeaturedHomepageEvents({ limit: 1 });
    featured = nationalFeatured[0] || null;
  }

  let upcoming = partnerUpcoming;
  if (upcoming.length === 0) {
    upcoming = await fetchPublicEvents({ limit: 8 });
  }

  const partnerEvents = mergeUniqueEvents(
    featured ? [featured, ...upcoming] : upcoming,
    [],
    12,
  );

  // Partner SitGuru events always lead; Google discoveries fill remaining slots only.
  let bannerEvents = mergeUniqueEvents(partnerEvents, discovered.events, 16);
  let source: "live" | "google" | "demo" = partnerEvents.length
    ? "live"
    : discovered.events.length
      ? "google"
      : "demo";
  let previewMode = !partnerEvents.length && discovered.events.length > 0;
  let lastSyncedAt = discovered.lastSyncedAt;

  if (bannerEvents.length === 0) {
    const demo = getHomepageDemoEvents(
      city && state ? `${city}, ${state}` : "Bucks, Montgomery, Lehigh & Northampton County, PA",
    );
    bannerEvents = mergeUniqueEvents(
      demo.featured ? [demo.featured, ...demo.upcoming] : demo.upcoming,
      [],
      16,
    );
    source = "demo";
    previewMode = true;
    lastSyncedAt = null;
  }

  const locationLabel =
    [county, city, state].filter(Boolean).join(", ") || undefined;

  return NextResponse.json({
    featured,
    upcoming: bannerEvents.slice(featured ? 1 : 0),
    bannerEvents,
    locationLabel,
    county: county || null,
    source,
    previewMode,
    lastSyncedAt,
  });
}
