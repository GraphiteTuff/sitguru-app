import { NextResponse } from "next/server";
import { fetchDiscoveredHomepageEvents } from "@/lib/community/discovered-events";

export const dynamic = "force-dynamic";

export async function GET() {
  const { events, lastSyncedAt } = await fetchDiscoveredHomepageEvents(16);

  return NextResponse.json({
    events,
    lastSyncedAt,
    source: events.length ? "google" : "none",
  });
}
