import { NextRequest, NextResponse } from "next/server";
import { fetchDiscoveredHomepageEvents } from "@/lib/community/discovered-events";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const marketId = request.nextUrl.searchParams.get("marketId") || undefined;
  const marketSlug = request.nextUrl.searchParams.get("market") || undefined;
  const limit = Number(request.nextUrl.searchParams.get("limit") || 16);

  const { events, lastSyncedAt } = await fetchDiscoveredHomepageEvents({
    limit: Number.isFinite(limit) ? Math.min(40, Math.max(1, limit)) : 16,
    marketId,
    marketSlug,
  });

  return NextResponse.json({
    events,
    lastSyncedAt,
    source: events.length ? "google" : "none",
  });
}
