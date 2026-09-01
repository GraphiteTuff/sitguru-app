import { NextRequest, NextResponse } from "next/server";
import {
  PlacesDiscoveryError,
  placesSearchConfigured,
  searchPetFriendlyPlaces,
} from "@/lib/community/google-places";
import { formatEventDateRange } from "@/lib/community/format";
import { getEventBannerHref } from "@/lib/community/event-preview";
import { fetchPublicEvents } from "@/lib/community/queries";
import { mergeUniqueCommunityEvents } from "@/lib/community/dedupe-events";
import { fetchDiscoveredHomepageEvents } from "@/lib/community/discovered-events";
import { parsePlaceLane } from "@/lib/community/places";
import type { LinkedCommunityEvent, PlaceCategoryId } from "@/lib/community/places";
import {
  mobileCorsHeaders,
  optionsWithMobileCors,
} from "@/lib/supabase/request-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function OPTIONS(req: NextRequest) {
  return optionsWithMobileCors(req);
}

async function loadLinkedEvents(): Promise<LinkedCommunityEvent[]> {
  try {
    const [partnerEvents, discovered] = await Promise.all([
      fetchPublicEvents({ limit: 24 }),
      fetchDiscoveredHomepageEvents({ limit: 16 }),
    ]);
    const events = mergeUniqueCommunityEvents(
      partnerEvents,
      discovered.events,
      40,
    );
    return events.slice(0, 24).map((event) => {
      const { compactDate, timeLabel } = formatEventDateRange(
        event.start_at,
        event.end_at,
        event.timezone,
      );
      return {
        id: event.id,
        title: event.title,
        slug: event.slug,
        href: getEventBannerHref(event),
        whenLabel: [compactDate, timeLabel].filter(Boolean).join(" · "),
      };
    });
  } catch (error) {
    console.warn("SitGuru Places event overlay skipped", error);
    return [];
  }
}

export async function GET(req: NextRequest) {
  const cors = mobileCorsHeaders(req);

  if (!placesSearchConfigured()) {
    return NextResponse.json(
      {
        places: [],
        error:
          "Pet-friendly place search needs GOOGLE_PLACES_API_KEY with Places API (New) enabled. Geocoding continues to use GEOCODING_API_KEY.",
        code: "missing_key",
      },
      { status: 503, headers: cors },
    );
  }

  const { searchParams } = req.nextUrl;
  const lane = parsePlaceLane(searchParams.get("lane"));
  const category = (searchParams.get("category") || "") as PlaceCategoryId | "";
  const linkedEvents = await loadLinkedEvents();

  try {
    const result = await searchPetFriendlyPlaces({
      q: searchParams.get("q") || undefined,
      county: searchParams.get("county") || undefined,
      city: searchParams.get("city") || undefined,
      state: searchParams.get("state") || undefined,
      lane,
      category,
      highlyFriendly: searchParams.get("highlyFriendly") === "true",
      dogsIndoors: searchParams.get("dogsIndoors") === "true",
      outdoor: searchParams.get("outdoor") === "true",
      openNow: searchParams.get("openNow") === "true",
      linkedEvents,
    });

    return NextResponse.json(
      {
        places: result.places,
        center: result.center,
        source: result.source,
        query: result.query,
      },
      { headers: cors },
    );
  } catch (error) {
    if (error instanceof PlacesDiscoveryError) {
      return NextResponse.json(
        { places: [], error: error.message, code: error.code },
        { status: error.status, headers: cors },
      );
    }

    console.warn("SitGuru Places search failed", error);
    return NextResponse.json(
      {
        places: [],
        error:
          "Pet-Friendly Places could not complete this search. Try another city or try again shortly.",
        code: "google_unavailable",
      },
      { status: 502, headers: cors },
    );
  }
}
