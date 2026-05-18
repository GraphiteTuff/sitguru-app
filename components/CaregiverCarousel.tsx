"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type CarouselItem = {
  id: string;
  name: string;
  role: string;
  location: string;
  rating: string;
  image: string;
  petType: string;
  badge?: string;
  href: string;
};

const approvedGuruImages: Record<string, string> = {
  "Avery Johnson": "/images/demo/avery-johnson.png",
  "Brad Norway": "/images/demo/brad-norway.png",
  "Caleb Brooks": "/images/demo/caleb-brooks.png",
  "Darius Miller": "/images/demo/darius-miller.png",
  "Emma Walsh": "/images/demo/emma-walsh.png",
  "Maya Reynolds": "/images/demo/maya-reynolds.png",
  "Nina Patel": "/images/demo/nina-patel.png",
  "Olivia Chen": "/images/demo/olivia-chen.png",
  "Sofia Martinez": "/images/demo/sofia-martinez.png",
  "Suzy Q": "/images/demo/suzy-q.png",
};

const approvedGuruNames = new Set(Object.keys(approvedGuruImages));

const fallbackCarouselItems: CarouselItem[] = [];

type CaregiverCarouselProps = {
  items?: CarouselItem[];
};

function getSafeImageForItem(item: CarouselItem) {
  const approvedImage = approvedGuruImages[item.name];

  if (approvedImage) {
    return approvedImage;
  }

  return item.image || "/images/demo/avery-johnson.png";
}

function dedupeAndApproveItems(items: CarouselItem[]) {
  const seenNames = new Set<string>();

  return items
    .filter((item) => approvedGuruNames.has(item.name))
    .filter((item) => {
      if (seenNames.has(item.name)) {
        return false;
      }

      seenNames.add(item.name);
      return true;
    })
    .map((item) => ({
      ...item,
      image: getSafeImageForItem(item),
      badge: item.badge || "Verified",
    }));
}

export default function CaregiverCarousel({
  items = [],
}: CaregiverCarouselProps) {
  const displayItems = useMemo(() => {
    const approvedItems = dedupeAndApproveItems(items);

    if (approvedItems.length > 0) {
      return approvedItems;
    }

    return fallbackCarouselItems;
  }, [items]);

  const hasMultipleItems = displayItems.length > 1;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const resumeTimeoutRef = useRef<number | null>(null);

  const clearResumeTimer = () => {
    if (resumeTimeoutRef.current !== null) {
      window.clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
  };

  const pauseCarousel = () => {
    clearResumeTimer();
    setIsPaused(true);
  };

  const resumeCarouselSoon = () => {
    clearResumeTimer();

    resumeTimeoutRef.current = window.setTimeout(() => {
      setIsPaused(false);
      resumeTimeoutRef.current = null;
    }, 1800);
  };

  useEffect(() => {
    if (!hasMultipleItems || isPaused) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((currentIndex) =>
        currentIndex >= displayItems.length - 1 ? 0 : currentIndex + 1,
      );
    }, 3600);

    return () => window.clearInterval(interval);
  }, [displayItems.length, hasMultipleItems, isPaused]);

  useEffect(() => {
    if (activeIndex > displayItems.length - 1) {
      setActiveIndex(0);
    }
  }, [activeIndex, displayItems.length]);

  useEffect(() => {
    return () => {
      clearResumeTimer();
    };
  }, []);

  const goToPrevious = () => {
    if (!hasMultipleItems) {
      return;
    }

    pauseCarousel();

    setActiveIndex((currentIndex) =>
      currentIndex <= 0 ? displayItems.length - 1 : currentIndex - 1,
    );

    resumeCarouselSoon();
  };

  const goToNext = () => {
    if (!hasMultipleItems) {
      return;
    }

    pauseCarousel();

    setActiveIndex((currentIndex) =>
      currentIndex >= displayItems.length - 1 ? 0 : currentIndex + 1,
    );

    resumeCarouselSoon();
  };

  const goToSlide = (index: number) => {
    pauseCarousel();
    setActiveIndex(index);
    resumeCarouselSoon();
  };

  if (displayItems.length === 0) {
    return null;
  }

  return (
    <section className="section-space overflow-hidden bg-white">
      <div className="page-container">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <div className="section-kicker">Trusted local pet care</div>

            <h2 className="mt-4">
              Meet local gurus pet owners can feel good about
            </h2>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Browse real pet care gurus from SitGuru in a warm, modern,
              easy-to-scan layout.
            </p>
          </div>

          {hasMultipleItems && (
            <div className="hidden items-center gap-3 md:flex">
              <button
                type="button"
                aria-label="Previous caregiver"
                onClick={goToPrevious}
                className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-xl font-bold text-slate-900 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 focus:outline-none focus:ring-4 focus:ring-emerald-100"
              >
                ←
              </button>

              <button
                type="button"
                aria-label="Next caregiver"
                onClick={goToNext}
                className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-xl font-bold text-slate-900 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 focus:outline-none focus:ring-4 focus:ring-emerald-100"
              >
                →
              </button>
            </div>
          )}
        </div>

        <div
          className="relative mt-8 overflow-hidden"
          onMouseEnter={pauseCarousel}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={pauseCarousel}
          onTouchEnd={resumeCarouselSoon}
          onTouchCancel={resumeCarouselSoon}
          onFocus={pauseCarousel}
          onBlur={() => setIsPaused(false)}
          style={
            {
              "--caregiver-slide-width": "304px",
              "--caregiver-slide-gap": "24px",
              WebkitOverflowScrolling: "touch",
              touchAction: "pan-y",
            } as React.CSSProperties
          }
        >
          <div className="sm:[--caregiver-slide-width:340px] lg:[--caregiver-slide-width:360px]">
            <div
              className="flex gap-6 transition-transform duration-700 ease-in-out will-change-transform"
              style={{
                transform: `translate3d(calc(-${activeIndex} * (var(--caregiver-slide-width) + var(--caregiver-slide-gap))), 0, 0)`,
                WebkitTransform: `translate3d(calc(-${activeIndex} * (var(--caregiver-slide-width) + var(--caregiver-slide-gap))), 0, 0)`,
              }}
            >
              {displayItems.map((item) => (
                <article
                  key={`${item.id}-${item.name}`}
                  className="panel flex h-auto min-w-[304px] max-w-[304px] flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:min-w-[340px] sm:max-w-[340px] lg:min-w-[360px] lg:max-w-[360px]"
                >
                  <Link href={item.href} className="group block">
                    <div className="relative h-72 overflow-hidden rounded-t-3xl bg-slate-100">
                      <img
                        src={item.image}
                        alt={`${item.name}, ${item.role}`}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.src = getSafeImageForItem(item);
                        }}
                      />

                      <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                        {item.badge && (
                          <span className="chip">{item.badge}</span>
                        )}

                        <span className="badge">⭐ {item.rating}</span>
                      </div>
                    </div>
                  </Link>

                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Link href={item.href} className="group">
                          <h3 className="text-xl font-bold text-slate-900 transition group-hover:text-emerald-700">
                            {item.name}
                          </h3>
                        </Link>

                        <p className="mt-1 text-sm font-semibold text-emerald-700">
                          {item.role}
                        </p>
                      </div>

                      <span className="badge shrink-0">{item.petType}</span>
                    </div>

                    <p className="mt-3 text-sm text-slate-500">
                      {item.location}
                    </p>

                    <div className="mt-auto flex flex-col gap-3 pt-6 sm:flex-row">
                      <Link
                        href={item.href}
                        className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                      >
                        View Profile
                      </Link>

                      <Link
                        href="/search"
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
                      >
                        Find Care
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        {hasMultipleItems && (
          <div className="mt-8 flex items-center justify-center gap-3">
            {displayItems.map((item, index) => (
              <button
                key={`${item.id}-${item.name}-dot`}
                type="button"
                aria-label={`Go to caregiver ${index + 1}`}
                onClick={() => goToSlide(index)}
                className={`h-3 w-3 rounded-full transition-all duration-300 ${
                  activeIndex === index
                    ? "bg-emerald-600"
                    : "bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}