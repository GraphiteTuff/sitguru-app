"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

const heroServiceOptions = [
  "Dog Walking",
  "Pet Sitting",
  "Boarding",
  "Doggy Day Care",
  "Drop-In Visits",
  "House Sitting",
  "Training Support",
  "Medication Help",
  "Custom Care",
];

const serviceCards = [
  {
    title: "Dog Walking",
    description:
      "Book trusted local walking help for daily routines, midday breaks, and active dogs that need dependable exercise.",
    icon: "🐕",
  },
  {
    title: "Pet Sitting",
    description:
      "Find in-home care for pets who do best with familiar surroundings, personalized attention, and a calmer routine.",
    icon: "🏡",
  },
  {
    title: "Boarding",
    description:
      "Choose overnight care with local Gurus who offer a safe, home-style experience for pets while you are away.",
    icon: "🛏️",
  },
  {
    title: "Drop-In Visits",
    description:
      "Great for feedings, potty breaks, medication check-ins, litter care, and quick visits throughout the day.",
    icon: "⏰",
  },
  {
    title: "Doggy Day Care",
    description:
      "Perfect for daytime supervision, play, and companionship when your pet needs care while you work or travel locally.",
    icon: "☀️",
  },
  {
    title: "Training Support",
    description:
      "Connect with trainers and behavior-focused Gurus who can help with structure, routines, and confidence-building.",
    icon: "🎓",
  },
];

const specialties = [
  "Puppy Care",
  "Senior Pet Care",
  "Medication Support",
  "Special Needs Care",
  "Cat Care",
  "Multi-Pet Homes",
  "Training Support",
  "Pet Transport",
  "Custom Care Requests",
];

const pillars = [
  {
    number: "01",
    title: "Find a Guru",
    description:
      "Search local Gurus by service, profile, location, and availability with a cleaner browsing experience built for pet parents.",
  },
  {
    number: "02",
    title: "Choose a service",
    description:
      "Walking, sitting, boarding, drop-ins, day care, training support, and flexible care options all in one modern marketplace.",
  },
  {
    number: "03",
    title: "Match care to your pet",
    description:
      "Use pet profiles, care notes, service preferences, and special instructions to request more tailored help.",
  },
  {
    number: "04",
    title: "Book with confidence",
    description:
      "Trust signals, clearer profiles, review visibility, and structured information help customers feel better before they book.",
  },
  {
    number: "05",
    title: "Get support throughout care",
    description:
      "SitGuru is being built to support customers before, during, and after bookings with a more visible help experience.",
  },
];

const features = [
  {
    title: "Trusted local Gurus",
    description:
      "Browse pet care Gurus with clearer profiles, visible services, review signals, and a more modern local marketplace feel.",
    icon: "🐾",
  },
  {
    title: "Cleaner mobile-first booking",
    description:
      "The SitGuru experience is designed to feel easier on mobile, faster to understand, and better suited for real booking decisions.",
    icon: "📱",
  },
  {
    title: "Better trust visibility",
    description:
      "Verification, ratings, profile details, and structured sections help customers understand who they are considering.",
    icon: "🛡️",
  },
  {
    title: "Flexible care options",
    description:
      "SitGuru is positioned for standard pet care plus premium and specialty services that go beyond generic sitter listings.",
    icon: "✨",
  },
];

const trustPoints = [
  "Verified Guru badges",
  "Cleaner profile layouts",
  "Ratings and reviews that are easier to scan",
  "Clearer service and pricing visibility",
  "Pet-centered booking direction",
  "Responsive marketplace design built for growth",
];

const testimonials = [
  {
    quote:
      "This feels easier to understand than older pet care platforms. I can quickly compare providers and actually tell what makes each one different.",
    name: "Danielle R.",
    role: "Pet Owner, Pennsylvania",
  },
  {
    quote:
      "The trust signals feel more visible and the layout is easier on mobile. It gives a better first impression when I’m looking for someone to trust.",
    name: "Ashley M.",
    role: "Pet Parent, Philadelphia",
  },
  {
    quote:
      "It feels more modern, less cluttered, and more focused on what matters when choosing care for a pet.",
    name: "Marcus T.",
    role: "Pet Owner, Allentown",
  },
];

const guruTypes = [
  "Pet sitters",
  "Dog walkers",
  "Boarding providers",
  "Drop-in caregivers",
  "Dog trainers",
  "Experienced pet parents",
  "Students",
  "Professionals",
  "Trusted local helpers",
];

const launchHighlights = [
  "Something new is coming to pet care",
  "Early access for pet parents and future Gurus",
  "Warm, premium, pet-friendly brand feel",
  "Capture leads from Instagram, Facebook, TikTok, and more",
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

type InterestType = "customer" | "guru" | "both";

type LaunchFormState = {
  fullName: string;
  email: string;
  phone: string;
  zipCode: string;
  interestType: InterestType;
  petTypes: string;
  servicesOffered: string;
  notes: string;
  source: string;
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
    badge: "Trusted",
    href: "/search",
  },
];

const initialLaunchFormState: LaunchFormState = {
  fullName: "",
  email: "",
  phone: "",
  zipCode: "",
  interestType: "customer",
  petTypes: "",
  servicesOffered: "",
  notes: "",
  source: "direct",
};

const audienceOptions: {
  value: InterestType;
  label: string;
  description: string;
  emoji: string;
}[] = [
  {
    value: "customer",
    label: "Pet Parent",
    description: "I want trusted pet care when SitGuru launches.",
    emoji: "🐾",
  },
  {
    value: "guru",
    label: "Become a Guru",
    description: "I want to offer services and grow with SitGuru.",
    emoji: "⭐",
  },
  {
    value: "both",
    label: "Both",
    description: "I’m interested in care and offering services.",
    emoji: "✨",
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
    image:
      guru.image_url ||
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80",
    petType: getPetType(guru.services),
    badge: guru.is_verified ? "Verified" : "Trusted",
    href: `/gurus/${guru.slug || guru.id}`,
  }));
}

function detectSourceFromUrl() {
  if (typeof window === "undefined") return "direct";

  const params = new URLSearchParams(window.location.search);
  const sourceParam =
    params.get("source") ||
    params.get("utm_source") ||
    params.get("ref") ||
    "";

  const normalized = sourceParam.trim().toLowerCase();

  if (!normalized) return "direct";
  if (normalized.includes("instagram") || normalized === "ig") return "instagram";
  if (normalized.includes("facebook") || normalized === "fb") return "facebook";
  if (normalized.includes("tiktok") || normalized === "tt") return "tiktok";
  if (normalized.includes("referral")) return "referral";
  if (normalized.includes("email")) return "email";

  return normalized;
}

function CaregiverCarousel({ items }: { items: CarouselItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const displayItems = useMemo(
    () => (items.length > 0 ? items : fallbackCarouselItems),
    [items]
  );

  const total = displayItems.length;

  const scrollToIndex = (index: number) => {
    if (!trackRef.current) return;

    const cards = trackRef.current.querySelectorAll("[data-carousel-card]");
    const card = cards[index] as HTMLElement | undefined;

    if (!card) return;

    const track = trackRef.current;
    const left = card.offsetLeft - (track.clientWidth / 2 - card.clientWidth / 2);

    track.scrollTo({
      left: Math.max(left, 0),
      behavior: "smooth",
    });
  };

  const goToSlide = (index: number) => {
    if (total === 0) return;
    const safeIndex = (index + total) % total;
    setActiveIndex(safeIndex);
    scrollToIndex(safeIndex);
  };

  const nextSlide = () => goToSlide(activeIndex + 1);
  const prevSlide = () => goToSlide(activeIndex - 1);

  useEffect(() => {
    if (total <= 1 || isPaused) return;

    autoplayRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
    }, 5000);

    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [isPaused, total]);

  useEffect(() => {
    scrollToIndex(activeIndex);
  }, [activeIndex]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const handleScroll = () => {
      const cards = Array.from(
        track.querySelectorAll("[data-carousel-card]")
      ) as HTMLElement[];

      if (!cards.length) return;

      const trackCenter = track.scrollLeft + track.clientWidth / 2;
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      cards.forEach((card, index) => {
        const cardCenter = card.offsetLeft + card.clientWidth / 2;
        const distance = Math.abs(trackCenter - cardCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveIndex((prev) => (prev === closestIndex ? prev : closestIndex));
    };

    track.addEventListener("scroll", handleScroll, { passive: true });
    return () => track.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="section-space bg-white">
      <div className="page-container">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <div className="section-kicker">Trusted local pet care</div>
            <h2 className="mt-4 text-slate-950">
              Meet local Gurus pet owners can feel good about
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
              Browse real SitGuru providers in a warm, modern, easy-to-scan layout
              built for confidence and discovery.
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
            className="flex min-h-[440px] snap-x snap-mandatory gap-6 overflow-x-auto pb-8 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                      <h3 className="text-xl font-bold text-slate-900">{item.name}</h3>
                      <p className="mt-1 text-sm font-semibold text-emerald-700">
                        {item.role}
                      </p>
                    </div>
                    <span className="badge">{item.petType}</span>
                  </div>

                  <p className="mt-3 text-sm text-slate-600">{item.location}</p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link href={item.href} className="btn-primary w-full sm:w-auto">
                      View Profile
                    </Link>
                    <Link href="/search" className="btn-secondary w-full sm:w-auto">
                      Browse All
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
                  index === activeIndex ? "scale-125 bg-emerald-600" : "bg-slate-300"
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

  const [launchForm, setLaunchForm] =
    useState<LaunchFormState>(initialLaunchFormState);
  const [isSubmittingLaunch, setIsSubmittingLaunch] = useState(false);
  const [launchError, setLaunchError] = useState("");
  const [launchSuccess, setLaunchSuccess] = useState("");

  const isCustomerSelected = useMemo(
    () =>
      launchForm.interestType === "customer" || launchForm.interestType === "both",
    [launchForm.interestType]
  );

  const isGuruSelected = useMemo(
    () => launchForm.interestType === "guru" || launchForm.interestType === "both",
    [launchForm.interestType]
  );

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    const source = detectSourceFromUrl();

    setLaunchForm((prev) => ({
      ...prev,
      source,
    }));
  }, []);

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

  function updateLaunchField<K extends keyof LaunchFormState>(
    key: K,
    value: LaunchFormState[K]
  ) {
    setLaunchForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function scrollToLaunchForm(nextAudience?: InterestType) {
    if (nextAudience) {
      setLaunchForm((prev) => ({
        ...prev,
        interestType: nextAudience,
      }));
    }

    const section = document.getElementById("launch-list");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function handleLaunchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmittingLaunch(true);
    setLaunchError("");
    setLaunchSuccess("");

    try {
      const response = await fetch("/api/launch-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(launchForm),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to join the launch list right now.");
      }

      setLaunchSuccess(
        "You’re officially on the SitGuru launch list. We’ll share early access and launch updates soon."
      );

      setLaunchForm((prev) => ({
        ...initialLaunchFormState,
        source: prev.source || "direct",
      }));
    } catch (error) {
      setLaunchError(
        error instanceof Error
          ? error.message
          : "Something went wrong while submitting your information."
      );
    } finally {
      setIsSubmittingLaunch(false);
    }
  }

  return (
    <main className="page-shell bg-white text-slate-950">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-white via-slate-50 to-emerald-50">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-emerald-200/35 blur-3xl" />
          <div className="absolute right-0 top-8 h-72 w-72 rounded-full bg-slate-300/30 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-52 w-52 rounded-full bg-amber-200/25 blur-3xl" />
        </div>

        <div className="page-container relative py-14 sm:py-18 lg:py-24">
          <div className="grid items-start gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
            <div>
              <div className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-800 shadow-sm">
                Something New Is Coming to Pet Care
              </div>

              <h1 className="mt-5 max-w-4xl text-slate-950">
                Find the right Guru for your pet with more confidence.
              </h1>

              <div className="mt-5 space-y-4">
                <p className="max-w-3xl text-lg font-medium leading-8 text-slate-800 sm:text-xl">
                  SitGuru helps pet parents discover trusted local caregivers for{" "}
                  <span className="font-semibold text-emerald-700">
                    walking, sitting, boarding, day care, training support,
                  </span>{" "}
                  and more.
                </p>

                <p className="max-w-3xl text-base leading-7 text-slate-700 sm:text-lg sm:leading-8">
                  A Guru is a trusted pet care pro — someone pets love, parents trust,
                  and communities rely on. More than a sitter, a Guru is a trusted
                  guide in your pet’s care.
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/search" className="btn-primary w-full sm:w-auto">
                  Find a Guru
                </Link>

                <button
                  type="button"
                  onClick={() => scrollToLaunchForm("guru")}
                  className="btn-secondary w-full sm:w-auto"
                >
                  Become a Guru
                </button>

                <Link
                  href="/guru/login"
                  className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 sm:w-auto"
                >
                  Guru Login
                </Link>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                  Browse local care
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                  Compare services faster
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                  Built for mobile booking
                </span>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {launchHighlights.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <p className="mt-5 text-sm text-slate-700">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  Customer Login
                </Link>
              </p>
            </div>

            <div
              id="launch-list"
              className="rounded-[30px] border border-slate-200 bg-white/95 p-5 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-6 lg:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-amber-800">
                    Early access
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-slate-950">
                    Join the SitGuru launch list
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Be first to hear what’s coming. Join as a pet parent, future
                    Guru, or both.
                  </p>
                </div>

                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Live capture
                </span>
              </div>

              <form onSubmit={handleLaunchSubmit} className="mt-6 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Full name
                    </label>
                    <input
                      type="text"
                      value={launchForm.fullName}
                      onChange={(e) => updateLaunchField("fullName", e.target.value)}
                      placeholder="Your full name"
                      className="input w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Email
                    </label>
                    <input
                      type="email"
                      value={launchForm.email}
                      onChange={(e) => updateLaunchField("email", e.target.value)}
                      placeholder="you@example.com"
                      className="input w-full"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={launchForm.phone}
                      onChange={(e) => updateLaunchField("phone", e.target.value)}
                      placeholder="Optional"
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      ZIP code
                    </label>
                    <input
                      type="text"
                      value={launchForm.zipCode}
                      onChange={(e) => updateLaunchField("zipCode", e.target.value)}
                      placeholder="Optional"
                      className="input w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-sm font-semibold text-slate-800">
                    I’m interested as a...
                  </label>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {audienceOptions.map((option) => {
                      const selected = launchForm.interestType === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateLaunchField("interestType", option.value)}
                          className={`rounded-3xl border p-4 text-left transition ${
                            selected
                              ? "border-emerald-500 bg-emerald-50 shadow-sm ring-4 ring-emerald-100"
                              : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{option.emoji}</span>
                            <span className="text-sm font-black text-slate-900">
                              {option.label}
                            </span>
                          </div>
                          <p className="mt-2 text-xs leading-6 text-slate-600">
                            {option.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {isCustomerSelected ? (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Pet type(s)
                    </label>
                    <input
                      type="text"
                      value={launchForm.petTypes}
                      onChange={(e) => updateLaunchField("petTypes", e.target.value)}
                      placeholder="Dogs, cats, puppies, senior pets, etc."
                      className="input w-full"
                    />
                  </div>
                ) : null}

                {isGuruSelected ? (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Services offered
                    </label>
                    <input
                      type="text"
                      value={launchForm.servicesOffered}
                      onChange={(e) =>
                        updateLaunchField("servicesOffered", e.target.value)
                      }
                      placeholder="Pet sitting, walks, boarding, training support..."
                      className="input w-full"
                    />
                  </div>
                ) : null}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    What would make SitGuru exciting for you?
                  </label>
                  <textarea
                    value={launchForm.notes}
                    onChange={(e) => updateLaunchField("notes", e.target.value)}
                    rows={4}
                    placeholder="Tell us what you’d love to see."
                    className="input min-h-[120px] w-full resize-y"
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Social source
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {launchForm.source || "direct"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Use links like <span className="font-semibold">?source=instagram</span>,{" "}
                    <span className="font-semibold">?source=facebook</span>, or{" "}
                    <span className="font-semibold">?source=tiktok</span> in your bios.
                  </p>
                </div>

                {launchError ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                    {launchError}
                  </div>
                ) : null}

                {launchSuccess ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {launchSuccess}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmittingLaunch}
                  className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmittingLaunch ? "Joining Launch List..." : "Unlock Early Access"}
                </button>
              </form>

              <div className="mt-6 grid grid-cols-1 gap-3 border-t border-slate-200 pt-5 sm:grid-cols-2">
                {pillars.slice(0, 4).map((pillar) => (
                  <div
                    key={pillar.number}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                      {pillar.number}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {pillar.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {pillar.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Trust-first
                </span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Pet-centered
                </span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Social-ready
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Search */}
      <section className="section-space border-t border-slate-200 bg-white py-10">
        <div className="page-container">
          <div className="mx-auto max-w-3xl text-center">
            <div className="section-kicker">Find a Guru</div>
            <h2 className="mt-4 text-slate-950">Start with a simple search</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
              Search by service and location from any device. Start simple now,
              then continue into richer matching, pet details, and booking flow.
            </p>
          </div>

          <form action="/search" className="panel mx-auto mt-8 max-w-5xl p-6 sm:p-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr_1fr_auto]">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  What service do you need?
                </label>
                <select name="service" className="select w-full">
                  <option value="">All services</option>
                  {heroServiceOptions.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  City
                </label>
                <input
                  name="city"
                  className="input w-full"
                  placeholder="Quakertown"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  State
                </label>
                <input
                  name="state"
                  className="input w-full"
                  placeholder="Pennsylvania"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="btn-primary w-full px-10 py-4 text-lg lg:w-auto"
                >
                  Search Gurus
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* 5 Pillars */}
      <section className="section-space bg-slate-50">
        <div className="page-container">
          <div className="mx-auto max-w-3xl text-center">
            <div className="section-kicker">How SitGuru works</div>
            <h2 className="mt-4 text-slate-950">
              The 5 pillars guiding the SitGuru experience
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
              SitGuru is being shaped around trust, service clarity, better matching,
              modern discovery, and stronger customer confidence.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
            {pillars.map((pillar) => (
              <div
                key={pillar.number}
                className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                  {pillar.number}
                </p>
                <h3 className="mt-3 text-xl font-bold text-slate-950">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="section-space bg-white">
        <div className="page-container">
          <div className="mx-auto max-w-3xl text-center">
            <div className="section-kicker">Popular services</div>
            <h2 className="mt-4 text-slate-950">
              A marketplace that feels familiar but more elevated
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
              SitGuru should feel intuitive to customers coming from platforms like
              Rover, while offering a broader, more premium path for pet care.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {serviceCards.map((service) => (
              <div
                key={service.title}
                className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm"
              >
                <div className="text-3xl">{service.icon}</div>
                <h3 className="mt-4 text-xl font-bold text-slate-950">
                  {service.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  {service.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <h3 className="text-xl font-bold text-slate-950">
                  Premium and specialty care direction
                </h3>
                <p className="mt-3 text-base leading-7 text-slate-700">
                  SitGuru can stand out by supporting specialized requests like
                  puppy care, senior care, medication support, transport, and custom
                  pet care needs.
                </p>
              </div>

              <Link href="/search" className="btn-secondary w-full lg:w-auto">
                Browse Services Through Search
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {specialties.map((item) => (
                <span key={item} className="chip">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pet matching */}
      <section className="section-space bg-slate-50">
        <div className="page-container">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
              <div className="section-kicker">Match care to the pet</div>
              <h2 className="mt-4 text-slate-950">
                Better pet profiles make booking more accurate
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-700">
                SitGuru should not stop at service selection alone. Customers
                should be able to match care to the pet through photos, notes,
                medication details, temperament, feeding instructions, and special
                needs.
              </p>
              <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-700">
                <li>• Pet photos and profile details</li>
                <li>• Size, age, and care notes</li>
                <li>• Medication and special instructions</li>
                <li>• One-time and recurring care context</li>
              </ul>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-900 p-7 text-white shadow-sm sm:p-8">
              <div className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300">
                Better than generic booking
              </div>
              <h2 className="mt-4 text-white">
                SitGuru can feel smarter without feeling harder
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-300">
                The booking journey should stay simple while collecting the right
                information to help Gurus understand the pet and the requested care.
              </p>
              <div className="mt-6 grid gap-3">
                {[
                  "Choose service",
                  "Select pet(s)",
                  "Add care notes",
                  "Choose one-time or recurring",
                  "Review with confidence",
                ].map((step, index) => (
                  <div
                    key={step}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white"
                  >
                    {index + 1}. {step}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guru types */}
      <section className="section-space bg-white">
        <div className="page-container">
          <div className="mx-auto max-w-3xl text-center">
            <div className="section-kicker">Who are Gurus?</div>
            <h2 className="mt-4 text-slate-950">
              Real local caregivers from a variety of backgrounds
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
              The word Guru is flexible on purpose. It supports different types of
              pet care and trusted local providers while staying easy for pet
              parents to understand.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {guruTypes.map((type) => (
              <div
                key={type}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-base font-semibold text-slate-900">{type}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Audience split */}
      <section className="section-space bg-white">
        <div className="page-container">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
              <div className="section-kicker">For pet parents</div>
              <h2 className="mt-4 text-slate-950">
                Find care that feels more trustworthy from the start
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-700">
                Browse nearby Gurus, compare services, and choose someone who feels
                right for your pet. SitGuru is being shaped to reduce confusion and
                make booking feel more confident.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-700">
                <li>• Browse local pet care providers</li>
                <li>• Compare services and profile clarity</li>
                <li>• Look for visible trust signals</li>
                <li>• Book with more confidence</li>
              </ul>
              <div className="mt-6">
                <Link href="/search" className="btn-primary w-full sm:w-auto">
                  Search for a Guru
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-900 p-7 text-white shadow-sm sm:p-8">
              <div className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300">
                For Gurus
              </div>
              <h2 className="mt-4 text-white">
                Offer services through a stronger local marketplace identity
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-300">
                SitGuru gives care providers a more modern way to show services,
                build trust, and connect with local pet owners looking for help.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-200">
                <li>• Explain what makes you different</li>
                <li>• Offer multiple services</li>
                <li>• Build trust through profile clarity</li>
                <li>• Grow as a local Guru</li>
              </ul>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => scrollToLaunchForm("guru")}
                  className="inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 sm:w-auto"
                >
                  Join as a Guru
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CaregiverCarousel items={carouselItems} />

      {/* Features */}
      <section className="section-space bg-slate-50">
        <div className="page-container">
          <div className="mx-auto max-w-3xl text-center">
            <div className="section-kicker">Why pet parents will choose SitGuru</div>
            <h2 className="mt-4 text-slate-950">
              Cleaner, clearer, warmer, and more trust-first
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
              SitGuru is being built to make discovery feel modern for pet parents
              while making it easier to search, compare, and choose care.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="text-3xl">{feature.icon}</div>
                <h3 className="mt-4 text-xl font-bold text-slate-950">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="section-space bg-white">
        <div className="page-container">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <div className="section-kicker">Book with confidence</div>
              <h2 className="mt-4 text-slate-950">
                Trust signals should be visible, not buried
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
                Pet owners need reassurance. SitGuru should visibly support that
                through cleaner profiles, stronger trust presentation, and more
                understandable service information.
              </p>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-7">
              <div className="grid gap-3">
                {trustPoints.map((point) => (
                  <div
                    key={point}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm"
                  >
                    {point}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support */}
      <section className="section-space bg-slate-50">
        <div className="page-container">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
              <div className="section-kicker">Get support throughout care</div>
              <h2 className="mt-4 text-slate-950">
                Support should feel built into the experience
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-700">
                SitGuru should help customers before, during, and after bookings
                with clearer support access, trust guidance, and more visible help.
              </p>
              <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-700">
                <li>• Booking help and common questions</li>
                <li>• Trust and safety guidance</li>
                <li>• Easier support discovery from key pages</li>
                <li>• Better reassurance throughout care</li>
              </ul>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
              <div className="section-kicker">What comes next</div>
              <h2 className="mt-4 text-slate-950">
                Homepage sets the direction for the rest of the platform
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-700">
                After this page, the strongest next updates are the search page,
                public Guru profile, booking flow, customer dashboard, and My Pets
                experience.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="chip">Find a Guru page</span>
                <span className="chip">Guru public profile</span>
                <span className="chip">Booking flow</span>
                <span className="chip">Customer dashboard</span>
                <span className="chip">My Pets</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-space bg-white">
        <div className="page-container">
          <div className="mx-auto max-w-3xl text-center">
            <div className="section-kicker">Early impression and social proof</div>
            <h2 className="mt-4 text-slate-950">
              Messaging should feel human and easy to trust
            </h2>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm"
              >
                <p className="text-base leading-7 text-slate-700">
                  “{testimonial.quote}”
                </p>
                <div className="mt-6 border-t border-slate-200 pt-4">
                  <p className="font-semibold text-slate-950">{testimonial.name}</p>
                  <p className="text-sm text-slate-600">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-space bg-slate-950 text-white">
        <div className="page-container">
          <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,#0f172a,#111827_45%,#0b1220)] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.25)] sm:p-10">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1.5 text-sm font-semibold text-emerald-300">
                Ready to get started?
              </div>

              <h2 className="mt-5 !text-3xl !font-bold !leading-tight !text-white sm:!text-4xl">
                Search for trusted pet care through SitGuru
              </h2>

              <p className="mx-auto mt-4 max-w-2xl !text-base !leading-7 !text-slate-200 sm:!text-lg">
                Browse local Gurus, compare profiles, and start finding care that
                feels right for your pet. Or join the early-access list and be part
                of what launches next.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/search" className="btn-primary w-full sm:w-auto">
                  Find a Guru
                </Link>

                <button
                  type="button"
                  onClick={() => scrollToLaunchForm("both")}
                  className="inline-flex w-full items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold !text-white transition hover:bg-white/15 sm:w-auto"
                >
                  Join Launch List
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}