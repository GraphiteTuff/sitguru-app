"use client";

import { useEffect, useState } from "react";
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

const fallbackCarouselItems: CarouselItem[] = [];

type CaregiverCarouselProps = {
  items?: CarouselItem[];
};

export default function CaregiverCarousel({
  items = [],
}: CaregiverCarouselProps) {
  const displayItems = items.length > 0 ? items : fallbackCarouselItems;

  const hasMultipleItems = displayItems.length > 1;

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!hasMultipleItems) {
      return;
    }

    const interval = setInterval(() => {
      setActiveIndex((currentIndex) =>
        currentIndex >= displayItems.length - 1 ? 0 : currentIndex + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [displayItems.length, hasMultipleItems]);

  const goToPrevious = () => {
    if (!hasMultipleItems) {
      return;
    }

    setActiveIndex((currentIndex) =>
      currentIndex <= 0 ? displayItems.length - 1 : currentIndex - 1
    );
  };

  const goToNext = () => {
    if (!hasMultipleItems) {
      return;
    }

    setActiveIndex((currentIndex) =>
      currentIndex >= displayItems.length - 1 ? 0 : currentIndex + 1
    );
  };

  const goToSlide = (index: number) => {
    setActiveIndex(index);
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
          style={
            {
              "--caregiver-slide-width": "328px",
            } as React.CSSProperties
          }
        >
          <div className="sm:[--caregiver-slide-width:364px] lg:[--caregiver-slide-width:384px]">
            <div
              className="flex gap-6 transition-transform duration-700 ease-in-out will-change-transform"
              style={{
                transform: `translateX(calc(-${activeIndex} * var(--caregiver-slide-width)))`,
              }}
            >
              {displayItems.map((item) => (
                <article
                  key={item.id}
                  className="panel flex h-auto min-w-[304px] max-w-[304px] flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:min-w-[340px] sm:max-w-[340px] lg:min-w-[360px] lg:max-w-[360px]"
                >
                  <Link href={item.href} className="group block">
                    <div className="relative h-72 overflow-hidden rounded-t-3xl bg-slate-100">
                      <img
                        src={item.image}
                        alt={`${item.name} with pets`}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
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
                key={item.id}
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