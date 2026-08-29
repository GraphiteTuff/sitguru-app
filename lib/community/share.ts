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

  return `Join us for ${event.title} on ${dateLabel} at ${location}. Hosted by ${host}. Bring your pup and meet local pet lovers on SitGuru Pet Events — @SitGuruOfficial`;
}

export function buildEventShareCaptionSocial(
  event: Pick<
    CommunityEventRow,
    "title" | "start_at" | "end_at" | "timezone" | "city" | "state" | "short_description"
  > & { venue_name?: string | null },
  partnerName?: string | null,
) {
  const { compactDate, timeLabel } = formatEventDateRange(
    event.start_at,
    event.end_at,
    event.timezone,
  );
  const cityState = [event.city, event.state].filter(Boolean).join(", ");
  const place = [event.venue_name?.trim(), cityState].filter(Boolean).join(" · ");
  const host = partnerName?.trim();
  const teaser = event.short_description?.trim();
  const when = [compactDate, timeLabel].filter(Boolean).join(" · ");

  const lines = [
    `🐾 ${event.title}`,
    when ? `${when}${place ? ` · ${place}` : ""}` : place || null,
    host ? `Presented by ${host}` : null,
    teaser || "Bring your pup and meet local pet lovers on SitGuru.",
    "Shared via SitGuru Pet Events — @SitGuruOfficial",
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
    "title" | "slug" | "short_description" | "start_at" | "city" | "state" | "image_hero_url" | "image_original_url" | "image_card_url"
  >,
  partnerName?: string | null,
  origin?: string,
) {
  const { compactDate } = formatEventDateRange(event.start_at, null, null);
  const cityState = [event.city, event.state].filter(Boolean).join(", ");
  const host = partnerName?.trim() || "SitGuru partner";

  return {
    title: `${event.title} | SitGuru Pet Events`,
    description:
      event.short_description?.trim() ||
      `${compactDate}${cityState ? ` • ${cityState}` : ""} — Hosted by ${host}. Find pet-friendly events on SitGuru.`,
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
  const body = buildEventShareBody(message, url);
  const encodedBody = encodeURIComponent(body);
  const encodedUrl = encodeURIComponent(url.trim());
  const encodedQuote = encodeURIComponent(message.trim());
  const subject = encodeURIComponent("SitGuru Pet Event");

  switch (platform) {
    case "whatsapp":
      // Single composed body (caption + URL once)
      return `https://wa.me/?text=${encodedBody}`;
    case "facebook":
      // u = link preview / OG; quote prefills caption when Facebook supports it
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedQuote}`;
    case "x":
      // Full caption + SitGuru + URL in one text param (no separate url= to avoid doubles)
      return `https://twitter.com/intent/tweet?text=${encodedBody}`;
    case "email":
      return `mailto:?subject=${subject}&body=${encodedBody}`;
    case "sms":
      // One body only — do NOT append url again after encodedText (that sent the event twice)
      return `sms:?body=${encodedBody}`;
    default:
      return url;
  }
}
