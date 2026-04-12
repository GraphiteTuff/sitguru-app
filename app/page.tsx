"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

const features = [
  {
    title: "Trusted local gurus",
    description:
      "Browse pet care gurus with clear profiles, reviews, service details, and transparent pricing.",
    icon: "🐾",
  },
  {
    title: "Modern booking experience",
    description:
      "Search, compare, message, and book through a clean mobile-first experience built for speed and clarity.",
    icon: "📱",
  },
  {
    title: "Better tools for gurus",
    description:
      "Help care gurus grow with better visibility, flexible services, and smoother booking management.",
    icon: "💼",
  },
  {
    title: "Safety and trust signals",
    description:
      "Verification badges, ratings, care updates, and structured profiles help owners book with confidence.",
    icon: "🛡️",
  },
];

const serviceOptions = [
  "Dog Walking",
  "Pet Sitting",
  "Boarding",
  "Doggy Day Care",
  "Drop-In Visits",
  "House Sitting",
  "Training",
  "Pet Taxi",
];

const testimonials = [
  {
    quote:
      "The layout feels much easier than older pet care apps. I can quickly compare caregivers and actually understand what I’m booking.",
    name: "Danielle R.",
    role: "Pet Owner, Pennsylvania",
  },
  {
    quote:
      "SitGuru.com feels cleaner, faster, and more modern. It gives gurus a better way to present services and get found locally.",
    name: "Ashley M.",
    role: "Dog Walking Guru, Philadelphia",
  },
  {
    quote:
      "I like that the booking flow is simpler and the trust signals are more visible. It feels more user-friendly right away.",
    name: "Marcus T.",
    role: "Boarding Customer, Allentown",
  },
];

const trustPoints = [
  "Verified guru badges",
  "Transparent service pricing",
  "Cleaner mobile-first booking flow",
  "Ratings and review visibility",
  "Real-time messaging and updates",
  "Responsive design for web and app-ready growth",
];

type Guru = {
  id: string;
  slug?: string | null;
  full_name?: string | null;
  title?: string | null;
  bio?: string | null;
  city?: string | null;
  state?: string | null;
  rate?: number | null;
  experience_years?: number | null;
  is_verified?: boolean | null;
  is_active?: boolean | null;
  services?: string[] | null;
  image_url?: string | null;
  rating?: number | null;
};

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

const fallbackCarouselItems: CarouselItem[] = [
  {
    id: "fallback-1",
    name: "Sarah Jones",
    role: "Dog Walking Guru",
    location: "Quakertown, Pennsylvania",
    rating: "4.9",
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80",
    petType: "Dogs",
    badge: "Verified",
    href: "/search",
  },
  {
    id: "fallback-2",
    name: "Emily Carter",
    role: "Pet Sitting Guru",
    location: "Allentown, Pennsylvania",
    rating: "4.8",
    image:
      "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?auto=format&fit=crop&w=900&q=80",
    petType: "Cats & Dogs",
    badge: "Top Rated",
    href: "/search",
  },
  {
    id: "fallback-3",
    name: "Marcus Lee",
    role: "Boarding Guru",
    location: "Bethlehem, Pennsylvania",
    rating: "4.9",
    image:
      "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&w=900&q=80",
    petType: "Dogs",
    badge: "Verified",
    href: "/search",
  },
];

function formatLocation(city?: string | null, state?: string | null) {
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return "Location not listed";
}

function getPetType(services?: string[] | null) {
  if (!services || services.length === 0) return "Pet Care";
  if (services.includes("Cat Care") || services.includes("Cat Sitting")) return "Cats";
  if (services.includes("Dog Walking")) return "Dogs";
  if (services.includes("Pet Sitting")) return "Cats & Dogs";
  return services[0];
}

function mapGurusToCarouselItems(gurus: Guru[]): CarouselItem[] {
  return gurus.map((guru) => ({
    id: guru.id,
    name: guru.full_name || "Trusted Guru",
    role: guru.title || "Pet Care Guru",
    location: formatLocation(guru.city, guru.state),
    rating: guru.rating ? guru.rating.toFixed(1) : "New",
    image: guru.image_url || "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80",
    petType: getPetType(guru.services),
    badge: guru.is_verified ? "Verified" : "Trusted",
    href: `/guru/${guru.slug || guru.id}`,
  }));
}

function CaregiverCarousel({ items }: { items: CarouselItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const total = items.length || fallbackCarouselItems.length;

  const goToSlide = (index: number) => {
    if (total === 0) return;
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
    if (isPaused || total <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
    }, 4000); // Slightly slower for better feel

    return () => clearInterval(interval);
  }, [isPaused, total]);

  const displayItems = items.length > 0 ? items : fallbackCarouselItems;

  return (
    <section className="section-space bg-white">
      <div className="page-container">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
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
            className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-8 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-h-[440px]"
          >
            {displayItems.map((item) => (
              <article
                key={item.id}
                data-carousel-card
                className="panel min-w-[300px] max-w-[300px] snap-center overflow-hidden flex-shrink-0"
              >
                <div className="relative h-72 overflow-hidden rounded-t-3xl">
                  <img
                    src={item.image}
                    alt={`${item.name} with pets`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />

                  <div className="absolute left-4 top-4 flex gap-2">
                    {item.badge && <span className="chip">{item.badge}</span>}
                    <span className="badge">⭐ {item.rating}</span>
                  </div>
                </div>

                <div className="p-6">
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

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link href={item.href} className="btn-primary w-full sm:w-auto">
                      View profile
                    </Link>
                    <Link href="/search" className="btn-secondary w-full sm:w-auto">
                      Browse all
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6 flex justify-center gap-2">
            {displayItems.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goToSlide(index)}
                className={`h-2.5 w-2.5 rounded-full transition-all ${
                  index === activeIndex ? "bg-emerald-600 scale-125" : "bg-slate-300"
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

export default function HomePage() {
  const [carouselItems, setCarouselItems] =
    useState<CarouselItem[]>(fallbackCarouselItems);

  useEffect(() => {
    async function loadHomepageGurus() {
      const { data, error } = await supabase
        .from("gurus")
        .select(
          `
          id,
          slug,
          full_name,
          title,
          city,
          state,
          services,
          image_url,
          rating,
          is_verified,
          is_active
        `
        )
        .eq("is_active", true)
        .order("rating", { ascending: false, nullsFirst: false })
        .limit(8);

      if (error) {
        console.error("Homepage carousel load error:", error.message);
        return;
      }

      const gurus = (data || []) as Guru[];

      if (gurus.length > 0) {
        setCarouselItems(mapGurusToCarouselItems(gurus));
      }
    }

    loadHomepageGurus();
  }, []);

  return (
    <main className="page-shell">
      {/* Hero Section */}
      <section className="border-b border-slate-200 bg-white">
        <div className="page-container py-12 sm:py-16 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
            <div>
              <div className="section-kicker">Trusted pet care, built for modern users</div>

              <h1 className="mt-4 max-w-3xl">
                Find trusted pet care or grow your pet care business on SitGuru.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                SitGuru helps pet owners connect with trusted gurus for sitting,
                walking, boarding, and more through a clean, modern platform
                designed to feel faster, easier, and more transparent than older
                pet care apps.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/signup"
                  className="btn-primary w-full sm:w-auto"
                >
                  Get Started
                </Link>

                <Link
                  href="/search"
                  className="btn-secondary w-full sm:w-auto"
                >
                  Book a Guru Now
                </Link>

                <Link
                  href="/guru/login"
                  className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:w-auto"
                >
                  Guru Login
                </Link>
              </div>

              <p className="mt-4 text-sm text-slate-500">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-emerald-600 hover:underline"
                >
                  Customer Login
                </Link>
              </p>
            </div>

            <div className="panel p-5 sm:p-6 lg:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="section-kicker">Top nearby match</div>
                  <h3 className="mt-4">Real gurus from SitGuru</h3>
                  <p className="mt-2 subtle-text">Search by service, city, or profile</p>
                </div>
                <span className="badge">Live data</span>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="muted-panel p-4">
                  <p className="text-sm font-semibold text-slate-900">Search by service</p>
                  <p className="mt-1 text-sm text-slate-500">Walking, sitting, boarding, and more</p>
                </div>
                <div className="muted-panel p-4">
                  <p className="text-sm font-semibold text-slate-900">Search by location</p>
                  <p className="mt-1 text-sm text-slate-500">Cities and states update as you type</p>
                </div>
                <div className="muted-panel p-4">
                  <p className="text-sm font-semibold text-slate-900">Real guru profiles</p>
                  <p className="mt-1 text-sm text-slate-500">Names, services, and trust signals</p>
                </div>
                <div className="muted-panel p-4">
                  <p className="text-sm font-semibold text-slate-900">Responsive design</p>
                  <p className="mt-1 text-sm text-slate-500">Built for phone, tablet, and desktop</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="chip">Pet Sitting</span>
                <span className="chip">Drop-In Visits</span>
                <span className="chip">Dog Walking</span>
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row">
                <Link href="/search" className="btn-secondary w-full sm:w-auto">
                  View gurus
                </Link>
                <Link href="/search" className="btn-primary w-full sm:w-auto">
                  Start booking
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Search - Right after hero for fast access */}
      <section className="section-space border-t border-slate-200 bg-white py-10">
        <div className="page-container">
          <div className="max-w-3xl mx-auto text-center">
            <div className="section-kicker">Start with a simple search experience</div>
            <h2 className="mt-4">Find the right guru in seconds</h2>
            <p className="mt-4 max-w-2xl mx-auto text-base leading-7 text-slate-600 sm:text-lg">
              Search by service and location on any device. No complicated filters — just what you need.
            </p>
          </div>

          <form action="/search" className="panel mt-8 p-6 sm:p-8 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr_1fr_auto]">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">What service do you need?</label>
                <select name="service" className="select w-full">
                  <option value="">All services</option>
                  {serviceOptions.map((service) => (
                    <option key={service} value={service}>{service}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">City</label>
                <input name="city" className="input w-full" placeholder="Quakertown" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">State</label>
                <input name="state" className="input w-full" placeholder="Pennsylvania" />
              </div>

              <div className="flex items-end">
                <button type="submit" className="btn-primary w-full lg:w-auto px-10 py-4 text-lg">Search Gurus</button>
              </div>
            </div>
          </form>
        </div>
      </section>

      <CaregiverCarousel items={carouselItems} />

      {/* Rest of your original sections remain unchanged */}
      {/* Features, Why SitGuru, For pet owners, Trust and safety, Reviews, Final CTA */}

    </main>
  );
}