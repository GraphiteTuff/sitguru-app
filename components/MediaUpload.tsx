"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type MediaUploadProps = {
  bucket: "pet-media" | "provider-media";
  folder: string;
  onUploaded: (publicUrl: string) => Promise<void> | void;
  accept?: string;
  label?: string;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Upload failed.";
}

export default function MediaUpload({
  bucket,
  folder,
  onUploaded,
  accept = "image/*",
  label = "Upload File",
}: MediaUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const fileExt = file.name.split(".").pop() || "file";
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

      if (!data?.publicUrl) {
        throw new Error("Could not get public URL.");
      }

      await onUploaded(data.publicUrl);
      setSuccess("Upload successful.");
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="block w-full rounded-lg border border-gray-300 p-2 text-sm"
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {uploading ? "Uploading..." : label}
      </button>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-green-600">{success}</p> : null}
    </div>
  );
}