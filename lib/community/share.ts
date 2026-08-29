import { formatEventDateRange, formatEventLocationInline } from "@/lib/community/format";
import type { CommunityEventRow } from "@/lib/community/types";
import { getPublicEventUrl } from "@/lib/community/slug";
import { getBrandedSocialGraphicUrl } from "@/lib/community/social-assets";

export function buildEventShareCaption(
  event: Pick<
    CommunityEventRow,
    "title" | "start_at" | "end_at" | "timezone" | "venue_name" | "city" | "state" | "short_description"
  >,
  partnerName?: string | null,
) {
  const { dateLabel } = formatEventDateRange(
    event.start_at,
    event.end_at,
    event.timezone,
  );
  const location = formatEventLocationInline(event);
  const host = partnerName?.trim() || "a SitGuru partner";

  return `Join us for ${event.title} on ${dateLabel} at ${location}. Hosted by ${host}. Bring your pup and meet local pet lovers, businesses, and members of the SitGuru community.`;
}

export function buildEventShareCaptionSocial(
  event: Pick<
    CommunityEventRow,
    "title" | "start_at" | "end_at" | "timezone" | "city" | "state" | "short_description"
  >,
) {
  const { compactDate } = formatEventDateRange(event.start_at, event.end_at, event.timezone);
  const cityState = [event.city, event.state].filter(Boolean).join(", ");
  const teaser = event.short_description?.trim();

  if (teaser) {
    return `Join us for ${event.title} on ${compactDate}${cityState ? ` in ${cityState}` : ""}! ${teaser} Find it on SitGuru — @SitGuruOfficial`;
  }

  return `Join us for ${event.title} on ${compactDate}${cityState ? ` in ${cityState}` : ""}! Bring your pup and meet local pet lovers on SitGuru. @SitGuruOfficial`;
}

export function buildEventShareMeta(
  event: Pick<
    CommunityEventRow,
    "title" | "slug" | "short_description" | "start_at" | "city" | "state" | "image_hero_url" | "image_original_url" | "image_card_url"
  >,
  partnerName?: string | null,
  origin?: string,
) {
  const { compactDate } = formatEventDateRange(event.start_at, null, null);
  const cityState = [event.city, event.state].filter(Boolean).join(", ");
  const host = partnerName?.trim() || "SitGuru partner";

  return {
    title: event.title,
    description:
      event.short_description?.trim() ||
      `${compactDate}${cityState ? ` • ${cityState}` : ""} — Hosted by ${host}. Pet-friendly community event on SitGuru.`,
    url: getPublicEventUrl(event.slug, origin),
    image: getBrandedSocialGraphicUrl(event.slug, "landscape", origin),
  };
}

export type SharePlatform = "facebook" | "x" | "email" | "sms" | "whatsapp";

export function buildEventShareHref(
  platform: SharePlatform,
  url: string,
  message: string,
) {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(message);
  const subject = encodeURIComponent("SitGuru Community Event");

  switch (platform) {
    case "whatsapp":
      return `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case "x":
      return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
    case "email":
      return `mailto:?subject=${subject}&body=${encodedText}%0A%0A${encodedUrl}`;
    case "sms":
      return `sms:?&body=${encodedText}%20${encodedUrl}`;
    default:
      return url;
  }
}
