import UpcomingEventsBanner from "@/components/community/UpcomingEventsBanner";
import { getCommunityBannerDemoEvents } from "@/lib/community/homepage-demo-events";
import { fetchFeaturedHomepageEvents, fetchPublicEvents } from "@/lib/community/queries";

export default async function CommunityEventsBannerSection() {
  const [featuredEvents, upcomingEvents] = await Promise.all([
    fetchFeaturedHomepageEvents({ limit: 1 }),
    fetchPublicEvents({ limit: 8 }),
  ]);

  const featured = featuredEvents[0] || null;
  const merged = [
    ...(featured ? [featured] : []),
    ...upcomingEvents.filter((event) => event.id !== featured?.id),
  ].slice(0, 8);

  const events = merged.length ? merged : getCommunityBannerDemoEvents();
  const previewMode = merged.length === 0;

  return (
    <UpcomingEventsBanner
      events={events}
      previewMode={previewMode}
      viewAllHref="/community/events"
      title="More Upcoming Events"
    />
  );
}
