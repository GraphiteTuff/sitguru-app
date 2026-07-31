// components/pawreport/MediaGalleryCarousel.tsx
"use client";

import { useState } from "react";

type GalleryPhoto = {
  id: string;
  alt: string;
  /** Optional remote URL; falls back to gradient placeholder. */
  src?: string;
};

type MediaGalleryCarouselProps = {
  photos?: GalleryPhoto[];
  newCount?: number;
  /** Guru can upload; Pet Parent is view-only. */
  interactive?: boolean;
  onUploadPhoto?: () => void;
  className?: string;
};

const DEFAULT_PHOTOS: GalleryPhoto[] = [
  { id: "1", alt: "Scout at the park entrance" },
  { id: "2", alt: "Scout on the trail" },
  { id: "3", alt: "Scout resting after walk" },
];

const PLACEHOLDER_WASHES = [
  "from-emerald-200 via-emerald-100 to-sky-100",
  "from-sky-200 via-emerald-50 to-teal-100",
  "from-teal-200 via-sky-50 to-emerald-100",
];

/**
 * Placeholder media carousel — “3 new photos” badge + swipeable cards.
 */
export default function MediaGalleryCarousel({
  photos = DEFAULT_PHOTOS,
  newCount = 3,
  interactive = false,
  onUploadPhoto,
  className = "",
}: MediaGalleryCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const safePhotos = photos.length > 0 ? photos : DEFAULT_PHOTOS;
  const active = safePhotos[activeIndex] ?? safePhotos[0];

  function goPrev() {
    setActiveIndex((current) =>
      current === 0 ? safePhotos.length - 1 : current - 1,
    );
  }

  function goNext() {
    setActiveIndex((current) => (current + 1) % safePhotos.length);
  }

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
            Media gallery
          </p>
          <h3 className="mt-1 text-base font-black text-slate-950 sm:text-lg">
            Visit photos
          </h3>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-800">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-emerald-500"
          />
          {newCount} new photos
        </span>
      </div>

      <div className="relative mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
        <div
          className={`flex h-40 items-end bg-gradient-to-br p-4 sm:h-44 ${
            PLACEHOLDER_WASHES[activeIndex % PLACEHOLDER_WASHES.length]
          }`}
          role="img"
          aria-label={active.alt}
        >
          {active.src ? (
            <img
              src={active.src}
              alt={active.alt}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <p className="relative z-[1] text-sm font-bold text-slate-700">
              📸 {active.alt}
            </p>
          )}
        </div>

        {safePhotos.length > 1 ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 text-sm font-black text-slate-800 shadow-sm backdrop-blur"
              aria-label="Previous photo"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 text-sm font-black text-slate-800 shadow-sm backdrop-blur"
              aria-label="Next photo"
            >
              ›
            </button>
          </>
        ) : null}
      </div>

      <div className="mt-3 flex items-center justify-center gap-1.5">
        {safePhotos.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`Show photo ${index + 1}`}
            className={`h-2 rounded-full transition ${
              index === activeIndex
                ? "w-5 bg-emerald-600"
                : "w-2 bg-slate-300 hover:bg-slate-400"
            }`}
          />
        ))}
      </div>

      {interactive ? (
        <button
          type="button"
          onClick={onUploadPhoto}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-black text-emerald-800 transition hover:bg-emerald-100"
        >
          Upload photo
        </button>
      ) : null}
    </div>
  );
}
