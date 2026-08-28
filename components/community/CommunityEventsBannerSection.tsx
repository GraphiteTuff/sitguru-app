import UpcomingEventsBanner from "@/components/community/UpcomingEventsBanner";
import { fetchDiscoveredHomepageEvents } from "@/lib/community/discovered-events";
import { getCommunityBannerDemoEvents } from "@/lib/community/homepage-demo-events";
import { fetchFeaturedHomepageEvents, fetchPublicEvents } from "@/lib/community/queries";
import type { CommunityEventWithPartner } from "@/lib/community/types";

function mergeEvents(
  primary: CommunityEventWithPartner[],
  secondary: CommunityEventWithPartner[],
) {
  const seen = new Set<string>();
  const merged: CommunityEventWithPartner[] = [];

  for (const event of [...primary, ...secondary]) {
    const key = `${event.title}|${event.start_at}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(event);
  }

  return merged;
}

export default async function CommunityEventsBannerSection() {
  const [featuredEvents, partnerUpcoming, discovered] = await Promise.all([
    fetchFeaturedHomepageEvents({ limit: 1 }),
    fetchPublicEvents({ limit: 8 }),
    fetchDiscoveredHomepageEvents(16),
  ]);

  const featured = featuredEvents[0] || null;
  const partnerEvents = mergeEvents(
    featured ? [featured, ...partnerUpcoming] : partnerUpcoming,
    [],
  );

  let events = partnerEvents;
  let source: "live" | "google" | "demo" = partnerEvents.length ? "live" : "google";
  let previewMode = false;

  if (partnerEvents.length < 4 && discovered.events.length) {
    events = mergeEvents(partnerEvents, discovered.events);
    if (!partnerEvents.length) {
      source = "google";
      previewMode = true;
    }
  }

  if (!events.length) {
    events = getCommunityBannerDemoEvents();
    source = "demo";
    previewMode = true;
  }

  return (
    <UpcomingEventsBanner
      events={events}
      previewMode={previewMode}
      source={source}
      lastSyncedAt={discovered.lastSyncedAt}
      viewAllHref="/community/events"
      title="More upcoming events."
    />
  );
}
