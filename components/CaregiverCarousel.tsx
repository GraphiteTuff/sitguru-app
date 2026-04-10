"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type CarouselItem = {
  id: number;
  name: string;
  role: string;
  location: string;
  rating: string;
  image: string;
  petType: string;
  badge?: string;
};

const items: CarouselItem[] = [
  {
    id: 1,
    name: "Sarah Jones",
    role: "Dog Walker",
    location: "Quakertown, Pennsylvania",
    rating: "4.9",
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80",
    petType: "Dogs",
    badge: "Verified",
  },
  {
    id: 2,
    name: "Emily Carter",
    role: "Pet Sitter",
    location: "Allentown, Pennsylvania",
    rating: "4.8",
    image:
      "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?auto=format&fit=crop&w=900&q=80",
    petType: "Cats & Dogs",
    badge: "Top Rated",
  },
  {
    id: 3,
    name: "Marcus Lee",
    role: "Boarding Caretaker",
    location: "Bethlehem, Pennsylvania",
    rating: "4.9",
    image:
      "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&w=900&q=80",
    petType: "Dogs",
    badge: "Verified",
  },
  {
    id: 4,
    name: "Olivia Brooks",
    role: "Cat Care Specialist",
    location: "Doylestown, Pennsylvania",
    rating: "5.0",
    image:
      "https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=900&q=80",
    petType: "Cats",
    badge: "Popular",
  },
  {
    id: 5,
    name: "Daniel Rivera",
    role: "Pet Caretaker",
    location: "Philadelphia, Pennsylvania",
    rating: "4.7",
    image:
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80",
    petType: "Dogs & Cats",
    badge: "Trusted",
  },
  {
    id: 6,
    name: "Ava Thompson",
    role: "Drop-In Visits",
    location: "Easton, Pennsylvania",
    rating: "4.9",
    image:
      "https://images.unsplash.com/photo-1511044568932-338cba0ad803?auto=format&fit=crop&w=900&q=80",
    petType: "Cats & Dogs",
    badge: "Verified",
  },
];

export default function CaregiverCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const total = items.length;

  const goToSlide = (index: number) => {
    const safeIndex = (index + total) % total;
    setActiveIndex(safeIndex);

    if (!trackRef.current) return;

    const card = trackRef.current.querySelectorAll("[data-carousel-card]")[
      safeIndex
    ] as HTMLElement | undefined;

    if (card) {
      card.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  };

  const nextSlide = () => goToSlide(activeIndex + 1);
  const prevSlide = () => goToSlide(activeIndex - 1);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % total;

        if (trackRef.current) {
          const card = trackRef.current.querySelectorAll("[data-carousel-card]")[
            next
          ] as HTMLElement | undefined;

          if (card) {
            card.scrollIntoView({
              behavior: "smooth",
              inline: "center",
              block: "nearest",
            });
          }
        }

        return next;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [isPaused, total]);

  const visibleItems = useMemo(() => items, []);

  return (
    <section className="section-space bg-white">
      <div className="page-container">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <div className="section-kicker">Trusted local pet care</div>
            <h2 className="mt-4">
              Meet sitters, walkers, and caretakers pet owners can feel good about
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Show real people, happy pets, and care types in a way that feels warm,
              modern, and easy to browse.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={prevSlide}
              className="btn-secondary h-11 w-11 rounded-full p-0"
              aria-label="Previous slide"
            >
              ←
            </button>
            <button
              type="button"
              onClick={nextSlide}
              className="btn-secondary h-11 w-11 rounded-full p-0"
              aria-label="Next slide"
            >
              →
            </button>
          </div>
        </div>

        <div
          className="mt-8"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            ref={trackRef}
            className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {visibleItems.map((item, index) => (
              <article
                key={item.id}
                data-carousel-card
                className="panel min-w-[280px] max-w-[280px] snap-center overflow-hidden sm:min-w-[320px] sm:max-w-[320px]"
              >
                <div className="relative h-72 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={`${item.name} with pets`}
                    className="h-full w-full object-cover"
                  />

                  <div className="absolute left-4 top-4 flex gap-2">
                    {item.badge ? <span className="chip">{item.badge}</span> : null}
                    <span className="badge">⭐ {item.rating}</span>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">
                        {item.name}
                      </h3>
                      <p className="mt-1 text-sm font-semibold text-emerald-700">
                        {item.role}
                      </p>
                    </div>
                    <span className="badge">{item.petType}</span>
                  </div>

                  <p className="mt-3 text-sm text-slate-500">{item.location}</p>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <Link href="/search" className="btn-primary w-full sm:w-auto">
                      Find care
                    </Link>
                    <Link
                      href="/become-a-sitter"
                      className="btn-secondary w-full sm:w-auto"
                    >
                      Join PawNecto
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-5 flex justify-center gap-2">
            {items.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goToSlide(index)}
                className={`h-2.5 w-2.5 rounded-full transition ${
                  index === activeIndex ? "bg-emerald-600" : "bg-slate-300"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}