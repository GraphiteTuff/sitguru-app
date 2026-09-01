import { NextRequest, NextResponse } from "next/server";
import { mergeUniqueCommunityEvents } from "@/lib/community/dedupe-events";
import { fetchDiscoveredHomepageEvents } from "@/lib/community/discovered-events";
import { isGoogleDiscoveryEvent } from "@/lib/community/event-preview";
import { getHomepageDemoEvents, getUpcomingCuratedBucksMontgomeryPetEvents } from "@/lib/community/homepage-demo-events";
import { fetchFeaturedHomepageEvents, fetchPublicEvents } from "@/lib/community/queries";
import { lookupZipLocation, cleanZipCode } from "@/lib/location/zip-lookup";
import type { CommunityEventWithPartner } from "@/lib/community/types";

export const dynamic = "force-dynamic";

/** Homepage carousel: soonest first (partners still preferred when filling slots). */
function sortEventsChronologically(events: CommunityEventWithPartner[]) {
  return [...events].sort((a, b) => {
    const byStart =
      new Date(a.start_at).getTime() - new Date(b.start_at).getTime();
    if (byStart !== 0) return byStart;
    // Same start: Partner events before Community (discovery) events.
    const aDiscovery = isGoogleDiscoveryEvent(a) ? 1 : 0;
    const bDiscovery = isGoogleDiscoveryEvent(b) ? 1 : 0;
    if (aDiscovery !== bDiscovery) return aDiscovery - bDiscovery;
    return a.title.localeCompare(b.title);
  });
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

  const [featuredEvents, partnerUpcoming, discoveredLocal] = await Promise.all([
    fetchFeaturedHomepageEvents({ city, state, limit: 1 }),
    fetchPublicEvents({ city, state, limit: 8 }),
    fetchDiscoveredHomepageEvents({
      city,
      state,
      county,
      limit: 24,
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

  const partnerEvents = mergeUniqueCommunityEvents(
    featured ? [featured, ...upcoming] : upcoming,
    [],
    12,
  );

  let discovered = discoveredLocal;
  if (
    discovered.events.length === 0 &&
    (city || state || county)
  ) {
    discovered = await fetchDiscoveredHomepageEvents({
      limit: 24,
      homepageEligibleOnly: true,
    });
  }

  const curatedUpcoming = getUpcomingCuratedBucksMontgomeryPetEvents();
  const liveEvents = mergeUniqueCommunityEvents(
    partnerEvents,
    discovered.events,
    24,
  );
  let bannerEvents = sortEventsChronologically(
    mergeUniqueCommunityEvents(liveEvents, curatedUpcoming, 24),
  );
  let source: "live" | "google" | "demo" = partnerEvents.length
    ? "live"
    : discovered.events.length
      ? "google"
      : "demo";
  let previewMode = source === "demo";
  let lastSyncedAt = discovered.lastSyncedAt;

  if (bannerEvents.length === 0) {
    const demo = getHomepageDemoEvents(
      city && state
        ? `${city}, ${state}`
        : "Bucks & Montgomery Counties, PA",
    );
    bannerEvents = sortEventsChronologically(
      mergeUniqueCommunityEvents(
        demo.featured ? [demo.featured, ...demo.upcoming] : demo.upcoming,
        [],
        24,
      ),
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
