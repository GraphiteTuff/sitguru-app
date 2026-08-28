export type EventSocialAsset = {
  id: "square" | "story" | "landscape";
  label: string;
  dimensions: string;
  url: string | null;
  aspectClass: string;
};

export function getBrandedSocialGraphicUrl(
  slug: string,
  format: "square" | "story" | "landscape",
  origin?: string,
) {
  const base =
    origin ||
    (typeof window !== "undefined" ? window.location.origin : "https://www.sitguru.com");

  return `${base.replace(/\/$/, "")}/api/community/events/${encodeURIComponent(slug)}/social/${format}`;
}

export function getEventSocialAssets(
  event: {
    slug?: string;
    social_square_url?: string | null;
    social_story_url?: string | null;
    social_landscape_url?: string | null;
    image_hero_url?: string | null;
    image_card_url?: string | null;
    image_original_url?: string | null;
  },
  options?: { preferBranded?: boolean; origin?: string },
): EventSocialAsset[] {
  const fallback =
    event.image_hero_url || event.image_card_url || event.image_original_url || null;
  const preferBranded = options?.preferBranded !== false && Boolean(event.slug);

  return [
    {
      id: "square",
      label: "Square Post",
      dimensions: "1080×1080",
      url: preferBranded
        ? getBrandedSocialGraphicUrl(event.slug!, "square", options?.origin)
        : event.social_square_url || fallback,
      aspectClass: "aspect-square",
    },
    {
      id: "story",
      label: "Story",
      dimensions: "1080×1920",
      url: preferBranded
        ? getBrandedSocialGraphicUrl(event.slug!, "story", options?.origin)
        : event.social_story_url || fallback,
      aspectClass: "aspect-[9/16]",
    },
    {
      id: "landscape",
      label: "Landscape",
      dimensions: "1200×630",
      url: preferBranded
        ? getBrandedSocialGraphicUrl(event.slug!, "landscape", options?.origin)
        : event.social_landscape_url || fallback,
      aspectClass: "aspect-[1200/630]",
    },
  ];
}

export async function downloadEventGraphic(url: string, filename: string) {
  const response = await fetch(url);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}
