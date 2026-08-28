import { NextRequest, NextResponse } from "next/server";
import { fetchFeaturedHomepageEvents, fetchPublicEvents } from "@/lib/community/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const city = searchParams.get("city") || undefined;
  const state = searchParams.get("state") || undefined;

  const featuredEvents = await fetchFeaturedHomepageEvents({ city, state, limit: 1 });
  const featured = featuredEvents[0] || null;

  const upcoming = await fetchPublicEvents({
    city,
    state,
    limit: 5,
  });

  const locationLabel =
    city && state ? `${city}, ${state}` : city || state || undefined;

  return NextResponse.json({
    featured,
    upcoming,
    locationLabel,
  });
}
