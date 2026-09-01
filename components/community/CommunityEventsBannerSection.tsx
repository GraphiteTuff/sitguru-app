import UpcomingEventsBanner from "@/components/community/UpcomingEventsBanner";
import { mergeUniqueCommunityEvents } from "@/lib/community/dedupe-events";
import { fetchDiscoveredHomepageEvents } from "@/lib/community/discovered-events";
import { getCommunityBannerDemoEvents } from "@/lib/community/homepage-demo-events";
import { fetchFeaturedHomepageEvents, fetchPublicEvents } from "@/lib/community/queries";
import type { CommunityEventWithPartner } from "@/lib/community/types";

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
  const partnerEvents = mergeUniqueCommunityEvents(
    featured ? [featured, ...partnerUpcoming] : partnerUpcoming,
    [],
    16,
  );

  // Fill with partners first, then discoveries; display soonest → later.
  let events = sortByStartAt(
    mergeUniqueCommunityEvents(partnerEvents, discovered.events, 16),
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
      title="Where tails wag together."
    />
  );
}
