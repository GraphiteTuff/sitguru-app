import UpcomingEventsBanner from "@/components/community/UpcomingEventsBanner";
import type { CommunityEventWithPartner } from "@/lib/community/types";
import type { EventsBannerSource } from "@/components/community/UpcomingEventsBanner";

type HomepageEventsSectionProps = {
  featured: CommunityEventWithPartner | null;
  upcoming: CommunityEventWithPartner[];
  bannerEvents?: CommunityEventWithPartner[];
  locationLabel?: string;
  previewMode?: boolean;
  source?: EventsBannerSource;
  lastSyncedAt?: string | null;
  adminHref?: string;
};

function mergeBannerEvents(
  featured: CommunityEventWithPartner | null,
  upcoming: CommunityEventWithPartner[],
  bannerEvents?: CommunityEventWithPartner[],
) {
  if (bannerEvents?.length) return bannerEvents;

  const merged: CommunityEventWithPartner[] = [];
  if (featured) merged.push(featured);

  for (const event of upcoming) {
    if (event.id === featured?.id) continue;
    merged.push(event);
  }

  return merged;
}

export default function HomepageEventsSection({
  featured,
  upcoming,
  bannerEvents,
  previewMode = false,
  source = "demo",
  lastSyncedAt = null,
  adminHref,
}: HomepageEventsSectionProps) {
  const events = mergeBannerEvents(featured, upcoming, bannerEvents);

  if (!events.length) return null;

  return (
    <UpcomingEventsBanner
      events={events}
      previewMode={previewMode}
      source={source}
      lastSyncedAt={lastSyncedAt}
      viewAllHref="/community/events"
      adminHref={adminHref}
      eyebrow="Local pet life"
      title="Where good pets gather."
    />
  );
}
