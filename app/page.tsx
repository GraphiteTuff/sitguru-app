"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

const features = [
  {
    title: "Trusted local caregivers",
    description:
      "Browse sitters and walkers with clear profiles, reviews, service details, and transparent pricing.",
    icon: "🐾",
  },
  {
    title: "Modern booking experience",
    description:
      "Search, compare, message, and book through a clean mobile-first experience built for speed and clarity.",
    icon: "📱",
  },
  {
    title: "Better tools for sitters",
    description:
      "Help care providers grow with better visibility, flexible services, and smoother booking management.",
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
      "PawNecto feels cleaner, faster, and more modern. It gives sitters a better way to present services and get found locally.",
    name: "Ashley M.",
    role: "Dog Walker, Philadelphia",
  },
  {
    quote:
      "I like that the booking flow is simpler and the trust signals are more visible. It feels more user-friendly right away.",
    name: "Marcus T.",
    role: "Boarding Customer, Allentown",
  },
];

const trustPoints = [
  "Verified caregiver badges",
  "Transparent service pricing",
  "Cleaner mobile-first booking flow",
  "Ratings and review visibility",
  "Real-time messaging and updates",
  "Responsive design for web and app-ready growth",
];

type Sitter = {
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
  review_count?: number | null;
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
    role: "Dog Walker",
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
    role: "Pet Sitter",
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
    role: "Boarding Caretaker",
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
  if (services.includes("Cat Care") || services.includes("Cat Sitting")) {
    return "Cats";
  }
  if (services.includes("Dog Walking")) return "Dogs";
  if (services.includes("Pet Sitting")) return "Cats & Dogs";
  return services[0];
}

function mapSittersToCarouselItems(sitters: Sitter[]): CarouselItem[] {
  return sitters.map((sitter) => ({
    id: sitter.id,
    name: sitter.full_name || "Trusted Caregiver",
    role: sitter.title || "Pet Care Provider",
    location: formatLocation(sitter.city, sitter.state),
    rating: sitter.rating ? sitter.rating.toFixed(1) : "New",
    image:
      sitter.image_url ||
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80",
    petType: getPetType(sitter.services),
    badge: sitter.is_verified ? "Verified" : "Trusted",
    href: `/sitter/${sitter.slug || sitter.id}`,
  }));
}

function CaregiverCarousel({ items }: { items: CarouselItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const total = items.length;

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

  const visibleItems = useMemo(() => items, [items]);

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
              Browse real caregivers and pet care providers from PawNecto in a
              warm, modern, easy-to-scan layout.
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
            {visibleItems.map((item) => (
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
                    <Link href={item.href} className="btn-primary w-full sm:w-auto">
                      View profile
                    </Link>
                    <Link
                      href="/search"
                      className="btn-secondary w-full sm:w-auto"
                    >
                      Browse all
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-5 flex justify-center gap-2">
            {visibleItems.map((_, index) => (
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

export default function HomePage() {
  const [carouselItems, setCarouselItems] =
    useState<CarouselItem[]>(fallbackCarouselItems);

  useEffect(() => {
    async function loadHomepageSitters() {
      const { data, error } = await supabase
        .from("sitters")
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

      const sitters = (data || []) as Sitter[];

      if (sitters.length > 0) {
        setCarouselItems(mapSittersToCarouselItems(sitters));
      }
    }

    loadHomepageSitters();
  }, []);

  return (
    <main className="page-shell">
      <section className="border-b border-slate-200 bg-white">
        <div className="page-container py-12 sm:py-16 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
            <div>
              <div className="section-kicker">Trusted pet care, built for modern users</div>

              <h1 className="mt-4 max-w-3xl">
                Find trusted pet care or grow your pet care business.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                PawNecto helps pet owners connect with trusted sitters, walkers,
                and boarders through a clean, modern platform designed to feel
                faster, easier, and more transparent than older pet care apps.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/search" className="btn-primary w-full sm:w-auto">
                  Find pet care
                </Link>
                <Link
                  href="/become-a-sitter"
                  className="btn-secondary w-full sm:w-auto"
                >
                  Become a sitter
                </Link>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="panel p-4 sm:p-5">
                  <p className="text-2xl font-black text-slate-900">Fast</p>
                  <p className="mt-1 text-sm text-slate-500">
                    search and compare flow
                  </p>
                </div>
                <div className="panel p-4 sm:p-5">
                  <p className="text-2xl font-black text-slate-900">Clear</p>
                  <p className="mt-1 text-sm text-slate-500">
                    pricing and profiles
                  </p>
                </div>
                <div className="panel p-4 sm:p-5">
                  <p className="text-2xl font-black text-slate-900">Mobile</p>
                  <p className="mt-1 text-sm text-slate-500">
                    first and app-ready design
                  </p>
                </div>
              </div>
            </div>

            <div className="panel p-5 sm:p-6 lg:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="section-kicker">Top nearby match</div>
                  <h3 className="mt-4">Real sitters from PawNecto</h3>
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
                  <p className="text-sm font-semibold text-slate-900">Real caregiver profiles</p>
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
                  View sitters
                </Link>
                <Link href="/bookings" className="btn-primary w-full sm:w-auto">
                  Start booking
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CaregiverCarousel items={carouselItems} />

      <section className="section-space">
        <div className="page-container">
          <div className="max-w-3xl">
            <div className="section-kicker">Quick search</div>
            <h2 className="mt-4">Start with a simple search experience</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Make it easy for pet owners to search by service and location on
              any device without overwhelming them with too many controls.
            </p>
          </div>

          <form action="/search" className="panel mt-8 p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr_1fr_auto]">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Service
                </label>
                <select name="service" className="select">
                  <option value="">All services</option>
                  {serviceOptions.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  City
                </label>
                <input name="city" className="input" placeholder="Quakertown" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  State
                </label>
                <input
                  name="state"
                  className="input"
                  placeholder="Pennsylvania"
                />
              </div>

              <div className="flex items-end">
                <button type="submit" className="btn-primary w-full lg:w-auto">
                  Search now
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      <section className="section-space border-t border-slate-200 bg-white">
        <div className="page-container">
          <div className="max-w-3xl">
            <div className="section-kicker">Why PawNecto</div>
            <h2 className="mt-4">A cleaner and more modern pet care platform</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Standardized layouts, strong trust signals, and responsive design
              help the platform feel easier to use for both pet owners and care
              providers.
            </p>
          </div>

          <div className="card-grid-4 mt-8">
            {features.map((feature) => (
              <div key={feature.title} className="panel p-5 sm:p-6">
                <div className="text-3xl">{feature.icon}</div>
                <h3 className="mt-4">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="page-container">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="panel p-6 sm:p-7">
              <div className="section-kicker">For pet owners</div>
              <h2 className="mt-4">Book with more confidence</h2>
              <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
                Compare trusted profiles, check reviews, understand service types,
                and book with a flow that works smoothly on phone, tablet, and desktop.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/search" className="btn-primary w-full sm:w-auto">
                  Explore sitters
                </Link>
                <Link href="/signup" className="btn-secondary w-full sm:w-auto">
                  Create account
                </Link>
              </div>
            </div>

            <div className="panel p-6 sm:p-7">
              <div className="section-kicker">For sitters and walkers</div>
              <h2 className="mt-4">Grow your pet care business</h2>
              <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
                Showcase services, manage availability, and get discovered by more
                local pet owners with a profile structure designed to highlight trust and value.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/become-a-sitter"
                  className="btn-primary w-full sm:w-auto"
                >
                  Start offering services
                </Link>
                <Link href="/dashboard" className="btn-secondary w-full sm:w-auto">
                  View dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-space border-t border-slate-200 bg-white">
        <div className="page-container">
          <div className="max-w-3xl">
            <div className="section-kicker">Trust and safety</div>
            <h2 className="mt-4">Make trust visible across the booking journey</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              A strong pet care experience should make important information easy
              to see before, during, and after every booking.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trustPoints.map((point) => (
              <div key={point} className="panel p-5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-emerald-600">✔</span>
                  <p className="text-sm font-medium text-slate-700 sm:text-base">
                    {point}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="page-container">
          <div className="max-w-3xl">
            <div className="section-kicker">Reviews</div>
            <h2 className="mt-4">A more user-friendly experience stands out fast</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              The easiest way to build trust is to make the platform feel simple,
              clear, and consistent across every page.
            </p>
          </div>

          <div className="card-grid-3 mt-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="panel p-6">
                <p className="text-base leading-8 text-slate-700">“{testimonial.quote}”</p>
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <p className="font-bold text-slate-900">{testimonial.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="page-container">
          <div className="rounded-[2rem] bg-slate-900 px-6 py-10 text-white shadow-xl sm:px-8 sm:py-12 lg:px-10">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-emerald-300">
                Ready to grow PawNecto
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Build a pet care platform people actually enjoy using.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                Use a consistent UI system, responsive layouts, and trust-first
                design to make PawNecto feel modern from the first click.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/search" className="btn-primary w-full sm:w-auto">
                  Search sitters
                </Link>
                <Link
                  href="/become-a-sitter"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-slate-500 px-5 text-sm font-semibold text-white transition hover:border-white"
                >
                  Join as a sitter
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}