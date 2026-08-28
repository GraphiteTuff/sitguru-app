import type { SupabaseClient } from "@supabase/supabase-js";
import {
  deriveEventImageUrls,
  EVENT_MEDIA_BUCKET,
  getEventImageExtension,
  sanitizeEventImageSegment,
  validateEventImageFile,
} from "@/lib/community/event-image-shared";

export async function uploadEventImageWithClient(
  supabase: SupabaseClient,
  userId: string,
  file: File,
) {
  validateEventImageFile(file);

  const ext = getEventImageExtension(file);
  const path = `${sanitizeEventImageSegment(userId)}/${Date.now()}-${sanitizeEventImageSegment(file.name.replace(/\.[^.]+$/, ""))}.${ext}`;

  const { error } = await supabase.storage
    .from(EVENT_MEDIA_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || `image/${ext === "jpg" ? "jpeg" : ext}`,
    });

  if (error) {
    throw new Error(error.message || "Unable to upload event image.");
  }

  const { data } = supabase.storage.from(EVENT_MEDIA_BUCKET).getPublicUrl(path);
  const publicUrl = data.publicUrl;

  return {
    storage_bucket: EVENT_MEDIA_BUCKET,
    storage_path: path,
    publicUrl,
    ...deriveEventImageUrls(publicUrl),
  };
}
