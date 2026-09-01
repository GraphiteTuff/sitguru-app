import type { CommunityEventRow, CommunityEventWithPartner } from "@/lib/community/types";
import { isHomepageDemoEvent } from "@/lib/community/homepage-demo-events";
import { getPublicEventPath } from "@/lib/community/slug";

export const GOOGLE_DISCOVERY_EVENT_TYPE = "google_discovery";

export function isGoogleDiscoveryEvent(
  event: Pick<CommunityEventRow, "event_type" | "id">,
) {
  return event.event_type === GOOGLE_DISCOVERY_EVENT_TYPE;
}

export function isHomepagePreviewEvent(
  event: Pick<CommunityEventRow, "event_type" | "id">,
) {
  return isHomepageDemoEvent(event.id) || isGoogleDiscoveryEvent(event);
}

export function getEventBannerHref(
  event: Pick<
    CommunityEventWithPartner,
    "id" | "slug" | "event_type" | "event_url"
  >,
) {
  if (isHomepageDemoEvent(event.id)) {
    return "/events";
  }

  return getPublicEventPath(event.slug);
}

export function isExternalEventLink(
  _event: Pick<CommunityEventRow, "event_type" | "id" | "event_url">,
) {
  return false;
}
