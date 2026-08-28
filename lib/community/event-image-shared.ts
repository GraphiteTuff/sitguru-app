export const EVENT_MEDIA_BUCKET = "event-media";
export const MAX_EVENT_IMAGE_BYTES = 8 * 1024 * 1024;
export const EVENT_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

const PHOTO_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const PHOTO_EXT = new Set(["jpg", "jpeg", "png", "webp"]);

export function validateEventImageFile(file: File) {
  const ext = (file.name.split(".").pop() || "").toLowerCase();

  if (!PHOTO_MIME.has(file.type) && !PHOTO_EXT.has(ext)) {
    throw new Error("Event images must be JPG, PNG, or WebP.");
  }

  if (file.size > MAX_EVENT_IMAGE_BYTES) {
    throw new Error("Event images must be 8MB or smaller.");
  }
}

function transformUrl(publicUrl: string, width: number, height?: number) {
  if (!publicUrl.includes("/storage/v1/object/public/")) {
    return publicUrl;
  }

  const renderBase = publicUrl.replace(
    "/storage/v1/object/public/",
    "/storage/v1/render/image/public/",
  );

  const params = new URLSearchParams({
    width: String(width),
    resize: "cover",
  });

  if (height) {
    params.set("height", String(height));
  }

  return `${renderBase}?${params.toString()}`;
}

export function deriveEventImageUrls(publicUrl: string) {
  return {
    image_original_url: publicUrl,
    image_hero_url: transformUrl(publicUrl, 1600, 900),
    image_card_url: transformUrl(publicUrl, 640, 400),
    image_mobile_url: transformUrl(publicUrl, 1080, 1350),
    social_square_url: transformUrl(publicUrl, 1080, 1080),
    social_story_url: transformUrl(publicUrl, 1080, 1920),
    social_landscape_url: transformUrl(publicUrl, 1200, 630),
  };
}

export function sanitizeEventImageSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80) || "file";
}

export function getEventImageExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase() || "";
  if (file.type === "image/png" || fromName === "png") return "png";
  if (file.type === "image/webp" || fromName === "webp") return "webp";
  return "jpg";
}
