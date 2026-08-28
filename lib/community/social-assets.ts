export type EventSocialAsset = {
  id: "square" | "story" | "landscape";
  label: string;
  dimensions: string;
  url: string | null;
  aspectClass: string;
};

export function getEventSocialAssets(event: {
  social_square_url?: string | null;
  social_story_url?: string | null;
  social_landscape_url?: string | null;
  image_hero_url?: string | null;
  image_card_url?: string | null;
  image_original_url?: string | null;
}): EventSocialAsset[] {
  const fallback =
    event.image_hero_url || event.image_card_url || event.image_original_url || null;

  return [
    {
      id: "square",
      label: "Square Post",
      dimensions: "1080×1080",
      url: event.social_square_url || fallback,
      aspectClass: "aspect-square",
    },
    {
      id: "story",
      label: "Story",
      dimensions: "1080×1920",
      url: event.social_story_url || fallback,
      aspectClass: "aspect-[9/16]",
    },
    {
      id: "landscape",
      label: "Landscape",
      dimensions: "1200×630",
      url: event.social_landscape_url || fallback,
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
