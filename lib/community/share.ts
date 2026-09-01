import { formatEventDateRange, formatEventLocationInline } from "@/lib/community/format";
import type { CommunityEventRow } from "@/lib/community/types";
import { getPublicEventUrl } from "@/lib/community/slug";
import { getBrandedSocialGraphicUrl } from "@/lib/community/social-assets";

function isGenericHostName(value?: string | null) {
  const host = value?.trim() || "";
  return !host || /^pet event$/i.test(host);
}

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
  const host = isGenericHostName(partnerName) ? null : partnerName?.trim();

  return [
    `Join us for ${event.title} on ${dateLabel} at ${location}.`,
    host ? `Hosted by ${host}.` : null,
    "RSVP on SitGuru.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildEventShareCaptionSocial(
  event: Pick<
    CommunityEventRow,
    "title" | "start_at" | "end_at" | "timezone" | "city" | "state" | "short_description"
  > & { venue_name?: string | null },
  _partnerName?: string | null,
) {
  const { compactDate, timeLabel } = formatEventDateRange(
    event.start_at,
    event.end_at,
    event.timezone,
  );
  const cityState = [event.city, event.state].filter(Boolean).join(", ");
  const place = [event.venue_name?.trim(), cityState].filter(Boolean).join(" · ");
  const when = [compactDate, timeLabel].filter(Boolean).join(" · ");

  const lines = [
    `🐾 ${event.title}`,
    when ? `${when}${place ? ` · ${place}` : ""}` : place || null,
    "RSVP on SitGuru",
  ].filter(Boolean);

  return lines.join("\n");
}

/**
 * One share body: caption + URL exactly once (avoids duplicate event text in SMS).
 */
export function buildEventShareBody(message: string, url: string) {
  const text = message.trim();
  const link = url.trim();
  if (!link) return text;
  if (!text) return link;
  if (text.includes(link)) return text;
  return `${text}\n\n${link}`;
}

export function buildEventShareMeta(
  event: Pick<
    CommunityEventRow,
    "title" | "slug" | "short_description" | "start_at" | "city" | "state" | "image_hero_url" | "image_original_url" | "image_card_url" | "venue_name"
  >,
  partnerName?: string | null,
  origin?: string,
) {
  const { compactDate } = formatEventDateRange(event.start_at, null, null);
  const cityState = [event.city, event.state].filter(Boolean).join(", ");
  const place = [event.venue_name?.trim(), cityState].filter(Boolean).join(", ");
  const host = isGenericHostName(partnerName) ? null : partnerName?.trim();
  const summary =
    event.short_description?.trim() ||
    [compactDate, place, host].filter(Boolean).join(" • ") ||
    "Pet friendly event";

  return {
    title: `${event.title} | SitGuru Events`,
    description: `${summary.replace(/\s+/g, " ").trim()} RSVP on SitGuru.`,
    url: getPublicEventUrl(event.slug, origin),
    image: getBrandedSocialGraphicUrl(event.slug, "landscape", origin),
  };
}

export type SharePlatform = "facebook" | "x" | "email" | "sms" | "whatsapp";

export function buildEventShareHref(
  platform: SharePlatform,
  url: string,
  message: string,
  subjectLine = "SitGuru Events",
) {
  const body = buildEventShareBody(message, url);
  const encodedBody = encodeURIComponent(body);
  const encodedUrl = encodeURIComponent(url.trim());
  const encodedQuote = encodeURIComponent(message.trim());
  const subject = encodeURIComponent(subjectLine);

  switch (platform) {
    case "whatsapp":
      return `https://wa.me/?text=${encodedBody}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedQuote}`;
    case "x":
      return `https://twitter.com/intent/tweet?text=${encodedBody}`;
    case "email":
      return `mailto:?subject=${subject}&body=${encodedBody}`;
    case "sms":
      return `sms:?body=${encodedBody}`;
    default:
      return url;
  }
}
