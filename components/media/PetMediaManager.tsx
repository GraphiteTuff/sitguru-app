"use client";

/**
 * Pet Media Upload Manager — Photo Gallery + Video Vault
 * Mobile: 2-col square grid · Desktop: 4-col grid
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, Video } from "lucide-react";
import {
  deletePetMediaRecord,
  insertPetMediaRow,
  listPetMedia,
  PET_PHOTO_ACCEPT,
  PET_VIDEO_ACCEPT,
  type PetMediaKind,
  type PetMediaRecord,
  uploadPetMediaWithProgress,
  validatePetMediaFile,
} from "@/lib/media/pet-media-upload";

type Props = {
  petId: string;
  userId: string;
  onPrimaryMediaChange?: (kind: PetMediaKind, url: string | null) => void;
};

type TabId = "photos" | "videos";

export default function PetMediaManager({
  petId,
  userId,
  onPrimaryMediaChange,
}: Props) {
  const [tab, setTab] = useState<TabId>("photos");
  const [items, setItems] = useState<PetMediaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const kind: PetMediaKind = tab === "photos" ? "photo" : "video";

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await listPetMedia(petId, kind);
      setItems(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load media.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [petId, kind]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError("");
    setMessage("");

    try {
      validatePetMediaFile(file, kind);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid file.");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const uploaded = await uploadPetMediaWithProgress(file, {
        userId,
        petId,
        kind,
        onUploadProgress: (p) => setProgress(p.percentage),
      });

      const row = await insertPetMediaRow({
        petId,
        userId,
        kind,
        file,
        bucket: uploaded.bucket,
        path: uploaded.path,
        publicUrl: uploaded.publicUrl,
      });

      setItems((prev) => [row, ...prev]);
      onPrimaryMediaChange?.(kind, uploaded.publicUrl);
      setMessage(
        kind === "photo" ? "Photo added to gallery." : "Video added to vault.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  async function handleDelete(row: PetMediaRecord) {
    if (!window.confirm("Delete this media file permanently?")) return;
    setDeletingId(row.id);
    setError("");
    setMessage("");

    try {
      await deletePetMediaRecord(row);
      const next = items.filter((item) => item.id !== row.id);
      setItems(next);
      if (items[0]?.id === row.id) {
        onPrimaryMediaChange?.(kind, next[0]?.file_url || null);
      }
      setMessage("Media deleted from gallery and storage.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 ring-1 ring-slate-100 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
            Media upload manager
          </p>
          <h3 className="mt-1 text-lg font-black text-slate-950">
            Pet photos & videos
          </h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            JPG/PNG ≤5MB · MP4/MOV ≤30MB · path{" "}
            <span className="font-mono">userId/petId/…</span>
          </p>
        </div>
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex min-h-[42px] items-center gap-2 rounded-2xl bg-emerald-600 px-4 text-xs font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {kind === "photo" ? (
            <ImagePlus className="h-4 w-4" />
          ) : (
            <Video className="h-4 w-4" />
          )}
          {kind === "photo" ? "Upload photo" : "Upload video"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={kind === "photo" ? PET_PHOTO_ACCEPT : PET_VIDEO_ACCEPT}
          className="sr-only"
          disabled={uploading}
          onChange={handleFileChange}
        />
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto whitespace-nowrap pb-1 scrollbar-none">
        {(
          [
            { id: "photos" as const, label: "Photo Gallery", icon: "📸" },
            { id: "videos" as const, label: "Video Vault", icon: "🎥" },
          ] as const
        ).map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setTab(entry.id)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-black transition ${
              tab === entry.id
                ? "bg-emerald-600 text-white"
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
            }`}
          >
            <span aria-hidden>{entry.icon}</span>
            {entry.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
          {message}
        </div>
      ) : null}

      <div className="relative mt-4 min-h-[120px]">
        {uploading ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[1.25rem] bg-white/90 px-6 backdrop-blur-sm">
            <p className="text-sm font-black text-slate-900">
              Uploading… {progress}%
            </p>
            <div className="mt-3 h-2.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-emerald-500 transition-[width] duration-150 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] font-bold text-slate-500">
              Saving to {kind === "photo" ? "pet-photos" : "pet-videos"}
            </p>
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm font-bold text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading media…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-white px-4 py-10 text-center">
            <p className="text-sm font-black text-slate-800">
              {kind === "photo" ? "No photos yet" : "No videos yet"}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Upload to build this pet&apos;s{" "}
              {kind === "photo" ? "gallery" : "vault"}.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {items.map((item) => (
              <li key={item.id} className="group relative aspect-square">
                <div className="h-full w-full overflow-hidden rounded-2xl bg-slate-200 ring-1 ring-slate-200">
                  {item.media_kind === "photo" ||
                  (item.file_type || "").startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.file_url}
                      alt={item.file_name || "Pet photo"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <video
                      src={item.file_url}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  )}
                </div>

                <div className="pointer-events-none absolute inset-0 flex items-end justify-end rounded-2xl bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-100 transition duration-200 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                  <button
                    type="button"
                    aria-label="Delete media"
                    disabled={deletingId === item.id}
                    onClick={() => void handleDelete(item)}
                    className="pointer-events-auto m-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white shadow-lg transition hover:bg-rose-500 disabled:opacity-60"
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
