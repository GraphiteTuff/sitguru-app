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

function sortByStartAt(events: CommunityEventWithPartner[]) {
  return [...events].sort(
    (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
  );
}

export default async function CommunityEventsBannerSection() {
  const [featuredEvents, partnerUpcoming, discovered] = await Promise.all([
    fetchFeaturedHomepageEvents({ limit: 1 }),
    fetchPublicEvents({ limit: 8 }),
    fetchDiscoveredHomepageEvents({ limit: 16 }),
  ]);

  const featured = featuredEvents[0] || null;
  const partnerEvents = mergeEvents(
    featured ? [featured, ...partnerUpcoming] : partnerUpcoming,
    [],
  );

  // Fill with partners first, then discoveries; display soonest → later.
  let events = sortByStartAt(
    mergeEvents(partnerEvents, discovered.events).slice(0, 16),
  );
  let source: "live" | "google" | "demo" = partnerEvents.length
    ? "live"
    : discovered.events.length
      ? "google"
      : "demo";
  let previewMode = !partnerEvents.length && Boolean(discovered.events.length);

  if (!events.length) {
    events = sortByStartAt(getCommunityBannerDemoEvents());
    source = "demo";
    previewMode = true;
  }

  return (
    <UpcomingEventsBanner
      events={events}
      previewMode={previewMode}
      source={source}
      lastSyncedAt={discovered.lastSyncedAt}
      viewAllHref="/events"
      eyebrow="Local pet life"
      title="Where good pets gather."
    />
  );
}
