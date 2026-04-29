"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type GuruMediaUploaderProps = {
  userId: string;
  guruProfileId?: string | null;
  displayName: string;
  initialPhotoUrl?: string | null;
};

const PHOTO_BUCKETS = ["guru-photos", "profile-photos", "avatars"];

function getFileExtension(file: File) {
  const nameExtension = file.name.split(".").pop()?.toLowerCase();

  if (nameExtension) return nameExtension === "jpeg" ? "jpg" : nameExtension;

  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";

  return "jpg";
}

function isValidPhoto(file: File) {
  return ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
    file.type
  );
}

async function uploadToFirstAvailableBucket({
  buckets,
  file,
  path,
}: {
  buckets: string[];
  file: File;
  path: string;
}) {
  let lastError = "Upload failed.";

  for (const bucket of buckets) {
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

    if (!error) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return {
        bucket,
        path,
        publicUrl: data.publicUrl,
      };
    }

    lastError = error.message || lastError;
  }

  throw new Error(lastError);
}

async function updateGuruPhotoUrl({
  userId,
  guruProfileId,
  publicUrl,
  path,
}: {
  userId: string;
  guruProfileId?: string | null;
  publicUrl: string;
  path: string;
}) {
  const timestamp = new Date().toISOString();

  const guruPhotoPayloads = [
    { image_url: publicUrl, media_updated_at: timestamp },
    { avatar_url: publicUrl, media_updated_at: timestamp },
    { photo_url: publicUrl, media_updated_at: timestamp },
    { profile_photo_url: publicUrl, media_updated_at: timestamp },
    { image_url: publicUrl },
    { avatar_url: publicUrl },
    { photo_url: publicUrl },
    { profile_photo_url: publicUrl },
  ];

  const profilePhotoPayloads = [
    { avatar_url: publicUrl, avatar_path: path, avatar_updated_at: timestamp },
    { profile_photo_url: publicUrl, avatar_path: path, avatar_updated_at: timestamp },
    { image_url: publicUrl, avatar_path: path, avatar_updated_at: timestamp },
    { avatar_url: publicUrl },
    { profile_photo_url: publicUrl },
    { image_url: publicUrl },
  ];

  let guruUpdated = false;
  let lastError = "Photo uploaded, but the Guru profile record could not be updated.";

  for (const payload of guruPhotoPayloads) {
    if (guruProfileId) {
      const { error } = await supabase
        .from("gurus")
        .update(payload)
        .eq("id", guruProfileId);

      if (!error) {
        guruUpdated = true;
        break;
      }

      lastError = error.message || lastError;
    }

    const { error } = await supabase
      .from("gurus")
      .update(payload)
      .eq("user_id", userId);

    if (!error) {
      guruUpdated = true;
      break;
    }

    lastError = error.message || lastError;
  }

  for (const payload of profilePhotoPayloads) {
    const { error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", userId);

    if (!error) break;
  }

  if (!guruUpdated) {
    throw new Error(lastError);
  }
}

export default function GuruMediaUploader({
  userId,
  guruProfileId,
  displayName,
  initialPhotoUrl,
}: GuruMediaUploaderProps) {
  const router = useRouter();
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl || "");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleUpload(file?: File | null) {
    if (!file) return;

    setMessage("");
    setError("");

    if (!isValidPhoto(file)) {
      setError("Please upload a JPG, PNG, or WEBP profile photo.");
      return;
    }

    const maxPhotoBytes = 8 * 1024 * 1024;

    if (file.size > maxPhotoBytes) {
      setError("Profile photos must be 8MB or smaller.");
      return;
    }

    setUploading(true);

    try {
      const extension = getFileExtension(file);
      const path = `${userId}/${String(
        guruProfileId || "guru"
      )}/profile-photo-${Date.now()}.${extension}`;

      const uploaded = await uploadToFirstAvailableBucket({
        buckets: PHOTO_BUCKETS,
        file,
        path,
      });

      await updateGuruPhotoUrl({
        userId,
        guruProfileId,
        publicUrl: uploaded.publicUrl,
        path: uploaded.path,
      });

      setPhotoUrl(uploaded.publicUrl);
      setMessage("Profile photo uploaded. Your Guru avatar has been updated.");
      router.refresh();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "We could not upload that photo right now."
      );
    } finally {
      setUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  }

  return (
    <div className="mt-5 w-full rounded-[1.5rem] border border-white/70 bg-white/95 p-4 text-left shadow-[0_14px_34px_rgba(15,23,42,0.12)] ring-1 ring-emerald-100/70 backdrop-blur">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-50 text-lg font-extrabold text-emerald-700 ring-4 ring-emerald-100">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt={`${displayName} avatar preview`}
                className="h-full w-full object-cover"
              />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>

          <div>
            <p
              className="text-base font-extrabold"
              style={{ color: "#000000" }}
            >
              Profile photo
            </p>
            <p
              className="mt-1 text-sm font-semibold leading-6"
              style={{ color: "#000000" }}
            >
              Add a clear photo so pet families recognize you.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => photoInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center justify-center rounded-[1.35rem] bg-slate-950 px-5 py-4 text-sm font-extrabold leading-5 text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {uploading ? "Uploading photo..." : "Upload photo"}
        </button>
      </div>

      <input
        ref={photoInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={(event) => handleUpload(event.target.files?.[0])}
      />

      {message ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}
