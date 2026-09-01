"use client";

import { trackEvent } from "@/lib/analytics/track";
import { buildEventShareCaptionSocial } from "@/lib/community/share";
import { getPublicEventPath, getPublicEventUrl } from "@/lib/community/slug";

export type NativeShareEvent = {
  id?: string;
  title: string;
  slug: string;
  sharePath?: string;
  startAt: string;
  endAt?: string | null;
  timezone?: string | null;
  city?: string | null;
  state?: string | null;
  shortDescription?: string | null;
  partnerName?: string | null;
  venueName?: string | null;
};

export function canUseNativeShare() {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

export function eventPublicShareUrl(event: Pick<NativeShareEvent, "slug" | "sharePath">) {
  const path = event.sharePath || getPublicEventPath(event.slug);
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (typeof window !== "undefined") {
    return `${window.location.origin}${normalized}`;
  }
  if (event.sharePath) {
    return `https://www.sitguru.com${normalized}`;
  }
  return getPublicEventUrl(event.slug);
}

export async function shareEventNatively(
  event: NativeShareEvent,
  source: string,
): Promise<"shared" | "cancelled" | "unavailable"> {
  if (!canUseNativeShare()) return "unavailable";

  const url = eventPublicShareUrl(event);
  const text = buildEventShareCaptionSocial(
    {
      title: event.title,
      start_at: event.startAt,
      end_at: event.endAt || null,
      timezone: event.timezone || null,
      city: event.city || null,
      state: event.state || null,
      short_description: event.shortDescription || null,
      venue_name: event.venueName || null,
    },
    event.partnerName,
  );

  void trackEvent({
    eventName: "event_share",
    eventType: "community",
    source,
    metadata: { slug: event.slug, channel: "native", eventId: event.id },
  });

  try {
    await navigator.share({
      title: event.title,
      text,
      url,
    });
    return "shared";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return "cancelled";
    }
    return "unavailable";
  }
}
