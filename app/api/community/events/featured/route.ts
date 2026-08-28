import { NextRequest, NextResponse } from "next/server";
import { fetchFeaturedHomepageEvents, fetchPublicEvents } from "@/lib/community/queries";
import { lookupZipLocation, cleanZipCode } from "@/lib/location/zip-lookup";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  let city = searchParams.get("city") || undefined;
  let state = searchParams.get("state") || undefined;
  const zip = cleanZipCode(searchParams.get("zip"));

  if ((!city || !state) && zip.length === 5) {
    try {
      const location = await lookupZipLocation(zip);
      if (location?.city && location?.state) {
        city = city || location.city;
        state = state || location.state;
      }
    } catch {
      // fall through to national/default featured events
    }
  }

  const featuredEvents = await fetchFeaturedHomepageEvents({ city, state, limit: 1 });
  let featured = featuredEvents[0] || null;

  // Graceful fallback: if no market-matched featured event, show any featured/upcoming
  if (!featured) {
    const nationalFeatured = await fetchFeaturedHomepageEvents({ limit: 1 });
    featured = nationalFeatured[0] || null;
  }

  let upcoming = await fetchPublicEvents({
    city,
    state,
    limit: 5,
  });

  if (upcoming.length === 0) {
    upcoming = await fetchPublicEvents({ limit: 5 });
  }

  const locationLabel =
    city && state ? `${city}, ${state}` : city || state || undefined;

  return NextResponse.json({
    featured,
    upcoming,
    locationLabel,
  });
}
