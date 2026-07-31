// components/messaging/MediaAttachmentDrawer.tsx
"use client";

import { useRef, useState } from "react";
import { ImagePlus, X, Film } from "lucide-react";
import type { ChatMediaItem } from "@/lib/messaging/types";

type MediaAttachmentDrawerProps = {
  conversationId: string;
  open: boolean;
  onClose: () => void;
  onAttached: (items: ChatMediaItem[]) => void;
};

export default function MediaAttachmentDrawer({
  conversationId,
  open,
  onClose,
  onAttached,
}: MediaAttachmentDrawerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [previews, setPreviews] = useState<ChatMediaItem[]>([]);

  if (!open) return null;

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    setUploading(true);
    setError("");
    const uploaded: ChatMediaItem[] = [];

    try {
      for (const file of Array.from(fileList)) {
        const form = new FormData();
        form.append("file", file);
        form.append("conversationId", conversationId);
        const res = await fetch("/api/messaging/upload", {
          method: "POST",
          body: form,
        });
        const json = (await res.json().catch(() => null)) as {
          ok?: boolean;
          error?: string;
          media?: ChatMediaItem & { mimeType?: string };
        } | null;

        if (!res.ok || !json?.ok || !json.media?.url) {
          throw new Error(json?.error || "Upload failed");
        }

        uploaded.push({
          url: json.media.url,
          mimeType: json.media.mimeType || file.type,
          name: file.name,
          size: file.size,
        });
      }

      setPreviews((prev) => [...prev, ...uploaded]);
      onAttached(uploaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 rounded-t-3xl border border-emerald-100 bg-white p-4 shadow-[0_-12px_40px_rgba(15,23,42,0.18)]">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-black text-slate-900">Attach photo or video</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
          aria-label="Close attachments"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          disabled={uploading}
          onClick={() => {
            if (inputRef.current) {
              inputRef.current.accept = "image/*";
              inputRef.current.click();
            }
          }}
          className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-50 text-sm font-bold text-emerald-900"
        >
          <ImagePlus className="h-5 w-5" />
          Photo
        </button>
        <button
          type="button"
          disabled={uploading}
          onClick={() => {
            if (inputRef.current) {
              inputRef.current.accept = "video/*";
              inputRef.current.click();
            }
          }}
          className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-50 text-sm font-bold text-slate-800"
        >
          <Film className="h-5 w-5" />
          Video
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple
        onChange={(e) => void handleFiles(e.target.files)}
      />

      {uploading ? (
        <p className="mt-3 text-xs font-semibold text-slate-500">Uploading…</p>
      ) : null}
      {error ? (
        <p className="mt-3 text-xs font-semibold text-red-600">{error}</p>
      ) : null}

      {previews.length > 0 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {previews.map((item) => (
            <div
              key={item.url}
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100"
            >
              {item.mimeType.startsWith("video/") ? (
                <video src={item.url} className="h-full w-full object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.url}
                  alt={item.name || "Attachment"}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
