/**
 * Secure pet media upload helpers for Supabase Storage.
 *
 * Note: `@supabase/storage-js` FileOptions do not currently implement
 * `onUploadProgress`. We honor that callback shape by uploading through
 * the Storage REST endpoint with XMLHttpRequest progress events, then
 * use the Supabase client for public URLs and deletes.
 */

import { supabase } from "@/lib/supabase";

export const PET_PHOTO_BUCKET = "pet-photos";
export const PET_VIDEO_BUCKET = "pet-videos";

export const MAX_PET_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAX_PET_VIDEO_BYTES = 30 * 1024 * 1024;

export const PET_PHOTO_ACCEPT = "image/jpeg,image/png,.jpg,.jpeg,.png";
export const PET_VIDEO_ACCEPT = "video/mp4,video/quicktime,.mp4,.mov";

export type PetMediaKind = "photo" | "video";

export type PetMediaRecord = {
  id: string;
  pet_id: string;
  user_id: string | null;
  media_kind: PetMediaKind;
  file_url: string;
  file_type: string | null;
  file_name: string | null;
  storage_bucket: string;
  storage_path: string;
  visibility: string | null;
  created_at: string | null;
};

export type UploadProgressEvent = {
  loaded: number;
  total: number;
  percentage: number;
};

const PHOTO_MIME = new Set(["image/jpeg", "image/png"]);
const VIDEO_MIME = new Set(["video/mp4", "video/quicktime"]);
const PHOTO_EXT = new Set(["jpg", "jpeg", "png"]);
const VIDEO_EXT = new Set(["mp4", "mov"]);

function sanitizeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80) || "file";
}

function getExtension(file: File, kind: PetMediaKind) {
  const fromName = file.name.split(".").pop()?.toLowerCase() || "";
  if (kind === "photo") {
    if (file.type === "image/png" || fromName === "png") return "png";
    return "jpg";
  }
  if (file.type === "video/quicktime" || fromName === "mov") return "mov";
  return "mp4";
}

export function validatePetMediaFile(file: File, kind: PetMediaKind) {
  const ext = (file.name.split(".").pop() || "").toLowerCase();

  if (kind === "photo") {
    if (!PHOTO_MIME.has(file.type) && !PHOTO_EXT.has(ext)) {
      throw new Error("Photos must be JPG or PNG.");
    }
    if (file.size > MAX_PET_PHOTO_BYTES) {
      throw new Error("Photos must be 5MB or smaller.");
    }
    return;
  }

  if (!VIDEO_MIME.has(file.type) && !VIDEO_EXT.has(ext)) {
    throw new Error("Videos must be MP4 or MOV.");
  }
  if (file.size > MAX_PET_VIDEO_BYTES) {
    throw new Error("Videos must be 30MB or smaller.");
  }
}

/** Path format: userId/petId/filename-timestamp.ext */
export function buildPetMediaStoragePath(
  userId: string,
  petId: string,
  file: File,
  kind: PetMediaKind,
) {
  const ext = getExtension(file, kind);
  const base = sanitizeSegment(
    file.name.replace(/\.[^.]+$/, "") || (kind === "photo" ? "photo" : "video"),
  );
  return `${userId}/${petId}/${base}-${Date.now()}.${ext}`;
}

export function bucketForKind(kind: PetMediaKind) {
  return kind === "photo" ? PET_PHOTO_BUCKET : PET_VIDEO_BUCKET;
}

function getStorageRestUrl(bucket: string, path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  return `${base}/storage/v1/object/${bucket}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

/**
 * Equivalent intent to:
 * `supabase.storage.from(bucket).upload(path, file, { onUploadProgress })`
 * with a working progress callback via XHR.
 */
export async function uploadPetMediaWithProgress(
  file: File,
  options: {
    userId: string;
    petId: string;
    kind: PetMediaKind;
    onUploadProgress?: (progress: UploadProgressEvent) => void;
  },
): Promise<{ bucket: string; path: string; publicUrl: string }> {
  validatePetMediaFile(file, options.kind);

  const bucket = bucketForKind(options.kind);
  const path = buildPetMediaStoragePath(
    options.userId,
    options.petId,
    file,
    options.kind,
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Please sign in again to upload media.");
  }

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error("Missing Supabase anon/publishable key.");
  }

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", getStorageRestUrl(bucket, path));
    xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
    xhr.setRequestHeader("apikey", anonKey);
    xhr.setRequestHeader("x-upsert", "false");

    const body = new FormData();
    body.append("cacheControl", "3600");
    body.append("", file);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const percentage = Math.min(
        100,
        Math.round((event.loaded / event.total) * 100),
      );
      options.onUploadProgress?.({
        loaded: event.loaded,
        total: event.total,
        percentage,
      });
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        options.onUploadProgress?.({
          loaded: file.size,
          total: file.size,
          percentage: 100,
        });
        resolve();
        return;
      }
      let message = `Upload failed (${xhr.status}).`;
      try {
        const parsed = JSON.parse(xhr.responseText) as {
          message?: string;
          error?: string;
        };
        message = parsed.message || parsed.error || message;
      } catch {
        // keep default
      }
      reject(new Error(message));
    };

    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.onabort = () => reject(new Error("Upload cancelled."));
    xhr.send(body);
  });

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data.publicUrl) {
    throw new Error("Upload succeeded but public URL was unavailable.");
  }

  return { bucket, path, publicUrl: data.publicUrl };
}

export async function insertPetMediaRow(input: {
  petId: string;
  userId: string;
  kind: PetMediaKind;
  file: File;
  bucket: string;
  path: string;
  publicUrl: string;
}): Promise<PetMediaRecord> {
  const payload = {
    pet_id: input.petId,
    user_id: input.userId,
    media_kind: input.kind,
    file_url: input.publicUrl,
    file_type: input.file.type || (input.kind === "photo" ? "image/jpeg" : "video/mp4"),
    file_name: input.file.name,
    storage_bucket: input.bucket,
    storage_path: input.path,
    visibility: "private",
  };

  const { data, error } = await supabase
    .from("pet_media")
    .insert(payload)
    .select(
      "id, pet_id, user_id, media_kind, file_url, file_type, file_name, storage_bucket, storage_path, visibility, created_at",
    )
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Media row was not returned after insert.");

  // Keep legacy single-URL columns in sync for passport cards / bookings.
  const primaryPatch =
    input.kind === "photo"
      ? { photo_url: input.publicUrl, updated_at: new Date().toISOString() }
      : { video_url: input.publicUrl, updated_at: new Date().toISOString() };

  await supabase.from("pets").update(primaryPatch).eq("id", input.petId);

  return data as PetMediaRecord;
}

export async function listPetMedia(
  petId: string,
  kind?: PetMediaKind,
): Promise<PetMediaRecord[]> {
  const { data, error } = await supabase
    .from("pet_media")
    .select(
      "id, pet_id, user_id, media_kind, file_url, file_type, file_name, storage_bucket, storage_path, visibility, created_at",
    )
    .eq("pet_id", petId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data || []) as PetMediaRecord[];
  if (!kind) return rows;

  return rows.filter((row) => {
    if (row.media_kind === kind) return true;
    if (row.media_kind) return false;
    const type = (row.file_type || "").toLowerCase();
    if (kind === "photo") return type.includes("image");
    return type.includes("video");
  });
}

export async function deletePetMediaRecord(
  row: PetMediaRecord,
): Promise<void> {
  if (row.storage_bucket && row.storage_path) {
    const { error: storageError } = await supabase.storage
      .from(row.storage_bucket)
      .remove([row.storage_path]);
    if (storageError) {
      // Still remove DB row if object is already gone
      const missing =
        /not found|404|No such file/i.test(storageError.message || "");
      if (!missing) throw storageError;
    }
  } else if (row.file_url) {
    // Best-effort parse public URL → bucket/path
    const match = row.file_url.match(
      /\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/,
    );
    if (match) {
      await supabase.storage.from(match[1]).remove([decodeURIComponent(match[2])]);
    }
  }

  const { error } = await supabase.from("pet_media").delete().eq("id", row.id);
  if (error) throw error;
}
