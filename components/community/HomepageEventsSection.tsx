import UpcomingEventsBanner from "@/components/community/UpcomingEventsBanner";
import type { CommunityEventWithPartner } from "@/lib/community/types";

type HomepageEventsSectionProps = {
  featured: CommunityEventWithPartner | null;
  upcoming: CommunityEventWithPartner[];
  locationLabel?: string;
  previewMode?: boolean;
  adminHref?: string;
};

function mergeBannerEvents(
  featured: CommunityEventWithPartner | null,
  upcoming: CommunityEventWithPartner[],
) {
  const merged: CommunityEventWithPartner[] = [];

  if (featured) merged.push(featured);

  for (const event of upcoming) {
    if (event.id === featured?.id) continue;
    merged.push(event);
  }

  return merged.slice(0, 8);
}

export default function HomepageEventsSection({
  featured,
  upcoming,
  previewMode = false,
  adminHref,
}: HomepageEventsSectionProps) {
  const events = mergeBannerEvents(featured, upcoming);

  if (!events.length) return null;

  return (
    <UpcomingEventsBanner
      events={events}
      previewMode={previewMode}
      viewAllHref="/community/events"
      adminHref={adminHref}
      eyebrow="Community events"
      title="More upcoming events."
    />
  );
}
