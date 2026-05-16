"use client";

import { Open_Sans } from "next/font/google";
import Link from "next/link";
import type { CSSProperties } from "react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics/track";
import { supabase } from "@/lib/supabase";

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const heroImagePath = "/images/hero/sitguru-dog-walking-hero.jpg";

const homepageDemoGuruNames = [
  "Maya Reynolds",
  "Sofia Martinez",
  "Avery Johnson",
  "Nina Patel",
  "Caleb Brooks",
  "Olivia Chen",
  "Darius Miller",
  "Emma Walsh",
];

const heroServiceOptions = [
  "Dog Walking",
  "Pet Sitting",
  "Boarding",
  "Drop-In Visits",
  "Doggy Day Care",
  "Training Support",
];

const zipCodeFallbackMap: Record<
  string,
  { city: string; state: string; stateAbbreviation: string }
> = {
  "08030": {
    city: "Camden",
    state: "New Jersey",
    stateAbbreviation: "NJ",
  },
  "18018": {
    city: "Bethlehem",
    state: "Pennsylvania",
    stateAbbreviation: "PA",
  },
  "18101": {
    city: "Allentown",
    state: "Pennsylvania",
    stateAbbreviation: "PA",
  },
  "18951": {
    city: "Quakertown",
    state: "Pennsylvania",
    stateAbbreviation: "PA",
  },
  "19103": {
    city: "Philadelphia",
    state: "Pennsylvania",
    stateAbbreviation: "PA",
  },
};

type ZipLookupResult = {
  city: string;
  state: string;
  stateAbbreviation: string;
};

type ZipLookupStatus = "idle" | "loading" | "found" | "not-found" | "error";

type SearchFormState = {
  service: string;
  city: string;
  state: string;
  zipCode: string;
};

const initialSearchFormState: SearchFormState = {
  service: "",
  city: "",
  state: "",
  zipCode: "",
};

type Guru = {
  [key: string]: unknown;
  id: string | number;
  user_id?: string | null;
  slug?: string | null;
  display_name?: string | null;
  full_name?: string | null;
  title?: string | null;
  city?: string | null;
  state?: string | null;
  hourly_rate?: number | null;
  rate?: number | null;
  rating_avg?: number | null;
  rating?: number | null;
  review_count?: number | null;
  is_verified?: boolean | null;
  profile_photo_url?: string | null;
  photo_url?: string | null;
  avatar_url?: string | null;
  image_url?: string | null;
  services?: string[] | null;
  is_public?: boolean | null;
  is_active?: boolean | null;
};

type GuruCard = {
  id: string;
  name: string;
  role: string;
  location: string;
  rating: string;
  reviewCount: number;
  priceLabel: string;
  image: string;
  badge: string;
  href: string;
};

type ProgramCard = {
  title: string;
  eyebrow: string;
  description: string;
  href: string;
  applyHref: string;
  icon: string;
  image: string;
  imageAlt: string;
  primaryCta: string;
  secondaryCta: string;
  featured: boolean;
};

const trustItems = [
  "Trusted local Gurus",
  "Verified & reviewed",
  "Secure & safe",
  "Care you can count on",
];

const programPathways = [
  {
    title: "Pet Parents",
    description: "Anyone can join SitGuru to find trusted local care",
    href: "/search",
    icon: "🐾",
  },
  {
    title: "Gurus",
    description: "Anyone can apply to offer care through SitGuru",
    href: "/guru/signup",
    icon: "🦮",
  },
  {
    title: "SitGuru Programs",
    description: "Additional ways to earn, refer, and grow the community",
    href: "/programs",
    icon: "🤝",
  },
];

const homepagePrograms: ProgramCard[] = [
  {
    title: "Student Hire Program",
    eyebrow: "Featured earning pathway",
    description:
      "For students, recent grads, summer workers, and pet lovers who want a flexible way to earn extra cash after class, between classes, on weekends, during school breaks, or all summer.",
    href: "/programs#student-hire",
    applyHref: "/programs/apply?program=student-hire",
    icon: "🎓",
    image: "/images/ambassadors/student-hire2.jpg",
    imageAlt: "Student pet caregiver taking a selfie with a dog",
    primaryCta: "Start Student Hire",
    secondaryCta: "Student Details",
    featured: true,
  },
  {
    title: "Veterans Hire Program",
    eyebrow: "Military-connected pathway",
    description:
      "For veterans, eligible service members, National Guard, reservists, military spouses, qualified dependents over 18, and approved SkillBridge applicants who want to grow with SitGuru.",
    href: "/programs#veterans-hire",
    applyHref: "/programs/apply?program=veterans-hire",
    icon: "🎖️",
    image: "/images/ambassadors/veteran-ambassador2.jpg",
    imageAlt: "Veteran or military-connected pet caregiver relaxing with a dog",
    primaryCta: "Apply Today",
    secondaryCta: "Veterans Details",
    featured: false,
  },
  {
    title: "Ambassador Program",
    eyebrow: "Together, we grow together",
    description:
      "For Vet Techs, Veterinarians, Trainers, pet-care professionals, friends, family, and community supporters who want to refer Pet Parents and Gurus while helping SitGuru grow.",
    href: "/ambassadors",
    applyHref: "/programs/ambassadors/apply",
    icon: "🤝",
    image: "/images/ambassadors/ambassador-program2.jpg",
    imageAlt: "Pet-care professionals smiling while caring for a pet",
    primaryCta: "Become an Ambassador",
    secondaryCta: "Ambassador Details",
    featured: false,
  },
];

const popularServices = [
  {
    title: "Dog Walking",
    icon: "🐕",
    href: "/search?service=Dog%20Walking",
  },
  {
    title: "Pet Sitting",
    icon: "🏡",
    href: "/search?service=Pet%20Sitting",
  },
  {
    title: "Boarding",
    icon: "🛏️",
    href: "/search?service=Boarding",
  },
  {
    title: "Drop-In Visits",
    icon: "⏰",
    href: "/search?service=Drop-In%20Visits",
  },
  {
    title: "Doggy Day Care",
    icon: "☀️",
    href: "/search?service=Doggy%20Day%20Care",
  },
  {
    title: "Training Support",
    icon: "🎓",
    href: "/search?service=Training%20Support",
  },
];

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0 fill-current"
    >
      <path d="M16.37 1.51c0 1.08-.44 2.13-1.16 2.91-.77.84-2.04 1.48-3.09 1.39-.13-1.04.39-2.18 1.1-2.94.78-.85 2.15-1.48 3.15-1.36z" />
      <path d="M20.62 17.47c-.55 1.27-.82 1.84-1.53 2.96-.99 1.51-2.38 3.39-4.11 3.4-1.54.01-1.94-1-4.02-.99-2.08.01-2.52 1-4.06.99-1.73-.01-3.05-1.71-4.04-3.22-2.76-4.22-3.05-9.18-1.35-11.82 1.2-1.87 3.1-2.97 4.88-2.97 1.81 0 2.95 1 4.45 1 1.45 0 2.34-1 4.44-1 1.59 0 3.27.87 4.47 2.36-3.93 2.16-3.29 7.78.87 9.29z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0 fill-current"
    >
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.61 21 3 13.39 3 4c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.24.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
    </svg>
  );
}

function detectSourceFromUrl() {
  if (typeof window === "undefined") return "direct";

  const params = new URLSearchParams(window.location.search);
  const sourceParam =
    params.get("source") || params.get("utm_source") || params.get("ref") || "";

  const normalized = sourceParam.trim().toLowerCase();

  if (!normalized) return "direct";
  if (normalized.includes("instagram") || normalized === "ig")
    return "instagram";
  if (normalized.includes("facebook") || normalized === "fb") return "facebook";
  if (normalized.includes("tiktok") || normalized === "tt") return "tiktok";
  if (normalized.includes("referral")) return "referral";
  if (normalized.includes("email")) return "email";

  return normalized;
}

function normalizeZipCode(value: string) {
  return value.replace(/\D/g, "").slice(0, 5);
}

function formatLocation(city?: string | null, state?: string | null) {
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return "Local area";
}

async function lookupZipCode(zipCode: string): Promise<ZipLookupResult | null> {
  const normalizedZip = normalizeZipCode(zipCode);

  if (normalizedZip.length !== 5) return null;

  const fallback = zipCodeFallbackMap[normalizedZip];

  if (fallback) return fallback;

  const response = await fetch(`https://api.zippopotam.us/us/${normalizedZip}`);

  if (!response.ok) return null;

  const payload = await response.json();
  const place = payload?.places?.[0];

  if (!place) return null;

  return {
    city: String(place["place name"] || "").trim(),
    state: String(place.state || "").trim(),
    stateAbbreviation: String(place["state abbreviation"] || "").trim(),
  };
}

function getGuruName(guru: Guru) {
  return guru.display_name || guru.full_name || "Trusted Guru";
}

function getGuruPhotoUrl(guru: Guru) {
  const possiblePhoto =
    guru.profile_photo_url || guru.photo_url || guru.avatar_url || guru.image_url || "";

  const photoUrl = String(possiblePhoto || "").trim();

  if (!photoUrl) return "";

  const lowerPhotoUrl = photoUrl.toLowerCase();

  if (
    lowerPhotoUrl.startsWith("/images/") ||
    lowerPhotoUrl.includes("sitguru-logo") ||
    lowerPhotoUrl.includes("sitguru-message-avatar") ||
    lowerPhotoUrl.includes("sitguru-admin-avatar")
  ) {
    return "";
  }

  return photoUrl;
}

function getGuruHref(guru: Guru) {
  if (guru.slug) return `/guru/${guru.slug}`;
  return `/guru/${guru.id}`;
}

function getGuruRating(guru: Guru) {
  if (typeof guru.rating_avg === "number") return guru.rating_avg;
  if (typeof guru.rating === "number") return guru.rating;
  return 0;
}

function getGuruRate(guru: Guru) {
  if (typeof guru.hourly_rate === "number") return guru.hourly_rate;
  if (typeof guru.rate === "number") return guru.rate;
  return null;
}

function getGuruRole(guru: Guru) {
  if (guru.title) return guru.title;
  const services = Array.isArray(guru.services) ? guru.services : [];
  const firstService = services.find((service) => typeof service === "string");

  if (firstService) return `${firstService} Guru`;

  return "Pet Care Guru";
}

function mapGurusToCards(gurus: Guru[]): GuruCard[] {
  return gurus
    .map((guru) => {
      const photoUrl = getGuruPhotoUrl(guru);

      if (!photoUrl) {
        console.warn("Homepage Guru skipped because no account photo is wired:", {
          id: guru.id,
          slug: guru.slug,
          name: getGuruName(guru),
        });

        return null;
      }

      const rate = getGuruRate(guru);
      const rating = getGuruRating(guru);
      const reviews = Number(guru.review_count || 0);

      return {
        id: String(guru.id),
        name: getGuruName(guru),
        role: getGuruRole(guru),
        location: formatLocation(guru.city, guru.state),
        rating: rating > 0 ? rating.toFixed(1) : "New",
        reviewCount: reviews,
        priceLabel:
          rate !== null && Number.isFinite(rate)
            ? `From $${rate} / visit`
            : "View pricing",
        image: photoUrl,
        badge: guru.is_verified ? "Verified" : "Trusted",
        href: getGuruHref(guru),
      };
    })
    .filter((guru): guru is GuruCard => Boolean(guru));
}

function buildSearchHref(searchForm: SearchFormState) {
  const params = new URLSearchParams();

  if (searchForm.service) params.set("service", searchForm.service);
  if (searchForm.zipCode) params.set("zip", searchForm.zipCode);
  if (searchForm.city) params.set("city", searchForm.city);
  if (searchForm.state) params.set("state", searchForm.state);

  const queryString = params.toString();

  return queryString ? `/search?${queryString}` : "/search";
}

function TrustRow() {
  return (
    <div className="grid grid-cols-4 gap-2 rounded-2xl border border-slate-100 bg-white/90 px-3 py-3 shadow-sm backdrop-blur">
      {trustItems.map((item) => (
        <div
          key={item}
          className="flex flex-col items-center gap-1 text-center text-[9px] font-black leading-tight text-slate-700 sm:flex-row sm:text-left sm:text-xs"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            ✓
          </span>
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

function HeroSignupCard({
  onGoogleSignup,
  onTrack,
}: {
  onGoogleSignup: () => void;
  onTrack: (label: string, destination: string) => void;
}) {
  return (
    <aside className="w-full max-w-[340px] rounded-[28px] border border-slate-200 bg-white/96 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.14)] backdrop-blur sm:p-6 xl:max-w-[360px]">
      <h2 className="text-[2.15rem] font-black leading-[0.96] tracking-[-0.05em] text-slate-950 xl:text-[2.65rem]">
        Create your free account
      </h2>
      <p className="mt-2 text-sm font-semibold text-slate-500">
        Join in less than a minute.
      </p>

      <div className="mt-6 grid gap-3">
        <button
          type="button"
          onClick={onGoogleSignup}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/50"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Apple login is coming soon"
          className="flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-400 shadow-sm"
        >
          <AppleIcon />
          Continue with Apple — Coming Soon
        </button>

        <Link
          href="/signup"
          onClick={() => onTrack("Continue with phone", "/signup")}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/50"
        >
          <PhoneIcon />
          Continue with phone
        </Link>
      </div>

      <div className="my-5 flex items-center gap-4">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-bold text-slate-400">or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="grid gap-3">
        <Link
          href="/signup"
          onClick={() => onTrack("Full Name Sign Up", "/signup")}
          className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50/50"
        >
          Full name
        </Link>
        <Link
          href="/signup"
          onClick={() => onTrack("Email Sign Up", "/signup")}
          className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50/50"
        >
          Email
        </Link>
        <Link
          href="/signup"
          onClick={() => onTrack("Zip Sign Up", "/signup")}
          className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50/50"
        >
          ZIP code optional
        </Link>
        <Link
          href="/signup"
          onClick={() => onTrack("Sign Up Free Hero Card", "/signup")}
          className="mt-1 rounded-xl bg-emerald-700 px-5 py-3 text-center text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800"
        >
          Sign Up Free
        </Link>
      </div>

      <p className="mt-4 text-center text-xs font-semibold text-slate-500">
        Already have an account?{" "}
        <Link
          href="/login"
          onClick={() => onTrack("Login From Hero Card", "/login")}
          className="font-black text-emerald-700 hover:text-emerald-800 hover:underline"
        >
          Log in
        </Link>
      </p>
    </aside>
  );
}

function HeroVisual() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,1)_0%,rgba(250,252,252,0.97)_42%,rgba(236,253,245,0.78)_100%)]" />

      <img
        src={heroImagePath}
        alt=""
        className="absolute right-[-142px] top-[54px] h-[360px] w-[485px] max-w-none object-cover object-center opacity-100 sm:right-[-88px] sm:top-[38px] sm:h-[470px] sm:w-[620px] lg:right-[24%] lg:top-[20px] lg:h-[585px] lg:w-[680px] xl:right-[25%] xl:top-[12px] xl:h-[640px] xl:w-[740px] 2xl:right-[26%]"
        style={{
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.14) 12%, rgba(0,0,0,0.45) 27%, rgba(0,0,0,0.82) 43%, black 62%, black 100%), linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.46) 7%, black 18%, black 88%, transparent 100%)",
          maskImage:
            "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.14) 12%, rgba(0,0,0,0.45) 27%, rgba(0,0,0,0.82) 43%, black 62%, black 100%), linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.46) 7%, black 18%, black 88%, transparent 100%)",
          WebkitMaskComposite: "source-in",
          maskComposite: "intersect",
        }}
        loading="eager"
      />

      <div className="absolute inset-y-0 left-0 w-[60%] bg-gradient-to-r from-white via-white/78 to-white/10" />
      <div className="absolute inset-y-0 left-[36%] w-[24%] bg-gradient-to-r from-white/24 via-white/8 to-transparent blur-3xl" />
      <div className="absolute inset-y-0 right-0 w-[18%] bg-gradient-to-l from-emerald-50/62 via-emerald-50/18 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-[16%] bg-gradient-to-b from-white/76 via-white/28 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[34%] bg-gradient-to-t from-emerald-50/82 via-white/8 to-transparent" />
    </div>
  );
}

function GuruCardView({
  guru,
  onTrack,
}: {
  guru: GuruCard;
  onTrack: (label: string, destination: string) => void;
}) {
  return (
    <Link
      href={guru.href}
      onClick={() => onTrack(`Guru Card ${guru.name}`, guru.href)}
      className="group min-w-[230px] max-w-[230px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_14px_35px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(15,23,42,0.12)] sm:min-w-[260px] sm:max-w-[260px]"
    >
      <div className="relative h-28 overflow-hidden sm:h-36">
        <img
          src={guru.image}
          alt={`${guru.name}, ${guru.role}`}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <span className="absolute left-2 top-2 rounded-full border border-white/80 bg-white/95 px-2 py-1 text-[9px] font-black text-emerald-800 shadow-sm sm:left-3 sm:top-3 sm:text-[10px]">
          {guru.badge}
        </span>
        <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-emerald-700 shadow-sm">
          ♡
        </span>
      </div>

      <div className="p-3 sm:p-4">
        <h3 className="text-sm font-black text-slate-950 sm:text-base">
          {guru.name}
        </h3>
        <p className="mt-1 text-[10px] font-bold text-emerald-700 sm:text-xs">
          {guru.role}
        </p>
        <p className="mt-1 text-[10px] text-slate-600 sm:text-xs">
          {guru.location}
        </p>

        <div className="mt-3 flex items-end justify-between gap-2 sm:mt-4">
          <p className="text-[10px] font-black text-slate-900 sm:text-xs">
            <span className="text-amber-500">★</span> {guru.rating}
          </p>
          <p className="text-[10px] font-black text-emerald-800 sm:text-xs">
            {guru.priceLabel}
          </p>
        </div>
      </div>
    </Link>
  );
}

function ProgramHeroCard({
  program,
  onTrack,
}: {
  program: ProgramCard;
  onTrack: (label: string, destination: string) => void;
}) {
  return (
    <article
      className={`overflow-hidden rounded-[28px] border transition ${
        program.featured
          ? "border-amber-200 bg-amber-50 shadow-[0_18px_40px_rgba(245,158,11,0.12)]"
          : "border-slate-200 bg-white shadow-[0_14px_35px_rgba(15,23,42,0.07)]"
      }`}
    >
      <div
        className={`relative overflow-hidden ${
          program.featured ? "h-72 bg-sky-100 lg:h-60" : "h-64 lg:h-60"
        }`}
      >
        <img
          src={program.image}
          alt={program.imageAlt}
          className="h-full w-full object-cover object-center transition duration-500 hover:scale-105"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/48 via-slate-950/10 to-transparent" />

        <div
          className={`absolute bottom-4 left-4 flex h-12 w-12 items-center justify-center rounded-2xl text-2xl shadow-lg ${
            program.featured
              ? "bg-amber-400 text-amber-950 shadow-amber-900/10"
              : "bg-emerald-700 text-white shadow-emerald-900/15"
          }`}
        >
          {program.icon}
        </div>
      </div>

      <div className="p-5">
        <p
          className={`text-xs font-black uppercase tracking-[0.16em] ${
            program.featured ? "text-amber-700" : "text-emerald-700"
          }`}
        >
          {program.eyebrow}
        </p>

        <h3 className="mt-2 text-xl font-black tracking-[-0.03em] text-slate-950">
          {program.title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-700">
          {program.description}
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <Link
            href={program.applyHref}
            onClick={() =>
              onTrack(
                `${program.primaryCta} ${program.title}`,
                program.applyHref,
              )
            }
            className={`inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-black transition ${
              program.featured
                ? "bg-amber-400 text-amber-950 hover:bg-amber-300"
                : "bg-emerald-700 text-white hover:bg-emerald-800"
            }`}
          >
            {program.primaryCta}
          </Link>

          <Link
            href={program.href}
            onClick={() =>
              onTrack(`${program.secondaryCta} ${program.title}`, program.href)
            }
            className={`inline-flex items-center justify-center rounded-full border bg-white px-4 py-2.5 text-sm font-black transition ${
              program.featured
                ? "border-amber-300 text-amber-900 hover:bg-amber-50"
                : "border-emerald-200 text-emerald-800 hover:bg-emerald-50"
            }`}
          >
            {program.secondaryCta}
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function HomePage() {
  const [searchForm, setSearchForm] = useState<SearchFormState>(
    initialSearchFormState,
  );
  const [zipLookupStatus, setZipLookupStatus] =
    useState<ZipLookupStatus>("idle");
  const [zipLookupMessage, setZipLookupMessage] = useState("");
  const [guruCards, setGuruCards] = useState<GuruCard[]>([]);
  const [source, setSource] = useState("direct");
  const [isGuruCarouselPaused, setIsGuruCarouselPaused] = useState(false);
  const guruCarouselRef = useRef<HTMLDivElement | null>(null);

  const searchHref = useMemo(() => buildSearchHref(searchForm), [searchForm]);
  const visibleGuruCards = useMemo(() => guruCards, [guruCards]);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    const carousel = guruCarouselRef.current;

    if (!carousel || visibleGuruCards.length <= 1) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) return;

    let animationFrameId = 0;

    function moveCarousel() {
      if (!carousel) return;

      const resetPoint = carousel.scrollWidth / 2;

      if (!isGuruCarouselPaused && resetPoint > carousel.clientWidth) {
        carousel.scrollLeft += 0.42;

        if (carousel.scrollLeft >= resetPoint - 2) {
          carousel.scrollLeft = 0;
        }
      }

      animationFrameId = window.requestAnimationFrame(moveCarousel);
    }

    animationFrameId = window.requestAnimationFrame(moveCarousel);

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [isGuruCarouselPaused, visibleGuruCards.length]);

  useEffect(() => {
    const detectedSource = detectSourceFromUrl();
    setSource(detectedSource);

    trackEvent({
      eventName: "homepage_visit",
      eventType: "traffic",
      source: detectedSource,
      metadata: {
        referrer: document.referrer || "",
        url: window.location.href,
        search: window.location.search,
        pathname: window.location.pathname,
        version: "launch_optimized_clear_audiences",
      },
    });
  }, []);

  useEffect(() => {
    async function loadHomepageGurus() {
      const { data, error } = await supabase
        .from("gurus")
        .select("*")
        .in("full_name", homepageDemoGuruNames)
        .eq("is_public", true)
        .eq("is_active", true)
        .eq("is_bookable", true)
        .order("is_verified", { ascending: false })
        .order("rating_avg", { ascending: false, nullsFirst: false });

      if (error) {
        console.error("Homepage Guru load error:", error.message);

        trackEvent({
          eventName: "homepage_guru_load_error",
          eventType: "system",
          source: detectSourceFromUrl(),
          metadata: {
            error: error.message,
            version: "launch_optimized_clear_audiences",
          },
        });

        return;
      }

      const gurus = Array.from(
        new Map(
          ((data || []) as Guru[])
            .sort(
              (a, b) =>
                homepageDemoGuruNames.indexOf(getGuruName(a)) -
                homepageDemoGuruNames.indexOf(getGuruName(b)),
            )
            .map((guru) => [getGuruName(guru), guru]),
        ).values(),
      );

      trackEvent({
        eventName: "homepage_gurus_loaded",
        eventType: "system",
        source: detectSourceFromUrl(),
        metadata: {
          guru_count: gurus.length,
          guru_card_count: mapGurusToCards(gurus).length,
          using_account_photos_only: true,
          version: "launch_optimized_clear_audiences",
        },
      });

      const mappedGuruCards = mapGurusToCards(gurus);

      if (mappedGuruCards.length === 0) {
        console.warn(
          "Homepage Guru carousel found Guru rows but no account-photo-backed cards. Check profile_photo_url, photo_url, avatar_url, or image_url on gurus.",
          { guru_count: gurus.length },
        );
      }

      setGuruCards(mappedGuruCards);
    }

    loadHomepageGurus();
  }, []);

  useEffect(() => {
    const normalizedZip = normalizeZipCode(searchForm.zipCode);

    if (!normalizedZip) {
      setZipLookupStatus("idle");
      setZipLookupMessage("");
      return;
    }

    if (normalizedZip.length < 5) {
      setZipLookupStatus("idle");
      setZipLookupMessage("Enter a 5-digit ZIP code to autofill your area.");
      return;
    }

    let isMounted = true;

    async function runLookup() {
      setZipLookupStatus("loading");
      setZipLookupMessage("Looking up ZIP code...");

      try {
        const result = await lookupZipCode(normalizedZip);

        if (!isMounted) return;

        if (!result?.city || !result?.state) {
          setZipLookupStatus("not-found");
          setZipLookupMessage(
            "We could not autofill that ZIP code. You can still search.",
          );
          return;
        }

        setSearchForm((prev) => ({
          ...prev,
          zipCode: normalizedZip,
          city: result.city,
          state: result.stateAbbreviation || result.state,
        }));

        setZipLookupStatus("found");
        setZipLookupMessage(
          `Autofilled ${result.city}, ${
            result.stateAbbreviation || result.state
          }.`,
        );
      } catch (error) {
        if (!isMounted) return;

        console.error("ZIP code lookup failed:", error);
        setZipLookupStatus("error");
        setZipLookupMessage(
          "ZIP autofill is unavailable right now. You can still search.",
        );
      }
    }

    const timeout = window.setTimeout(runLookup, 350);

    return () => {
      isMounted = false;
      window.clearTimeout(timeout);
    };
  }, [searchForm.zipCode]);

  function updateSearchField<K extends keyof SearchFormState>(
    key: K,
    value: SearchFormState[K],
  ) {
    setSearchForm((prev) => ({
      ...prev,
      [key]: key === "zipCode" ? normalizeZipCode(String(value)) : value,
    }));
  }

  function trackHomepageClick(label: string, destination: string) {
    trackEvent({
      eventName: "homepage_cta_clicked",
      eventType: "navigation",
      source,
      metadata: {
        label,
        destination,
        version: "launch_optimized_clear_audiences",
      },
    });
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    trackEvent({
      eventName: "search_started",
      eventType: "search",
      source,
      role: "customer",
      metadata: {
        location: "homepage_hero_search",
        service: searchForm.service,
        city: searchForm.city,
        state: searchForm.state,
        zip_code: searchForm.zipCode,
        destination: searchHref,
        version: "launch_optimized_clear_audiences",
      },
    });

    if (
      !searchForm.service &&
      !searchForm.zipCode &&
      !searchForm.city &&
      !searchForm.state
    ) {
      event.preventDefault();
      window.location.href = "/search";
    }
  }

  async function handleOAuthSignup() {
    const callbackUrl =
      typeof window !== "undefined"
        ? new URL("/auth/callback", window.location.origin)
        : null;

    if (callbackUrl) {
      callbackUrl.searchParams.set("next", "/customer/dashboard/profile");
      callbackUrl.searchParams.set("type", "customer");
    }

    trackEvent({
      eventName: "homepage_social_signup_clicked",
      eventType: "auth",
      source,
      role: "customer",
      metadata: {
        provider: "google",
        location: "homepage_launch_signup_card",
        selected_next_path: "/customer/dashboard/profile",
        version: "launch_optimized_clear_audiences",
      },
    });

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl?.toString(),
        queryParams: {
          prompt: "select_account",
        },
      },
    });
  }

  return (
    <main
      className={`${openSans.className} min-h-screen bg-white text-slate-950`}
      style={{ fontWeight: 300 } as CSSProperties}
    >
      <section className="relative overflow-hidden border-b border-slate-100 bg-white">
        <HeroVisual />

        <div className="relative z-10 mx-auto grid max-w-7xl gap-6 px-4 pb-5 pt-10 sm:px-6 sm:py-10 lg:min-h-[690px] lg:grid-cols-[minmax(0,690px)_minmax(240px,1fr)_350px] lg:items-center lg:gap-7 lg:px-8 lg:py-12 xl:grid-cols-[minmax(0,720px)_minmax(270px,1fr)_370px] xl:gap-8">
          <div className="lg:py-8">
            <div className="grid gap-4 lg:block">
              <div>
                <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50/95 px-3 py-1 text-[10px] font-black text-emerald-800 shadow-sm backdrop-blur sm:text-xs">
                  A new way to pet care is here
                </div>

                <div className="mt-4 max-w-[76%] sm:max-w-[590px] lg:max-w-[640px] xl:max-w-[680px]">
                  <h1 className="text-[2.1rem] font-black leading-[0.98] tracking-[-0.055em] text-slate-950 sm:text-[4rem] lg:text-[4.25rem] xl:text-[4.75rem]">
                    Trusted pet care.
                    <br />
                    Made <span className="text-emerald-600">simple.</span>
                  </h1>

                  <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-slate-700 sm:text-lg sm:leading-8 lg:max-w-[610px] lg:text-[1.05rem] xl:text-lg">
                    SitGuru is a new way for Pet Parents to find trusted local
                    Gurus for walks, sitting, boarding, training and more —
                    with care, convenience, and community built in.
                  </p>
                </div>
              </div>

              <form
                action="/search"
                onSubmit={handleSearchSubmit}
                className="relative z-20 mt-9 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.13)] backdrop-blur sm:mt-8 lg:mt-7 lg:w-[690px] xl:w-[720px]"
              >
                <input type="hidden" name="city" value={searchForm.city} />
                <input type="hidden" name="state" value={searchForm.state} />

                <div className="grid gap-3 md:grid-cols-[1.45fr_1fr_auto]">
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-500">
                      What service do you need?
                    </span>
                    <select
                      name="service"
                      value={searchForm.service}
                      onChange={(event) =>
                        updateSearchField("service", event.target.value)
                      }
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    >
                      <option value="">All services</option>
                      {heroServiceOptions.map((service) => (
                        <option key={service} value={service}>
                          {service}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-500">
                      ZIP code
                    </span>
                    <div className="relative">
                      <input
                        name="zip"
                        value={searchForm.zipCode}
                        onChange={(event) =>
                          updateSearchField("zipCode", event.target.value)
                        }
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-bold text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                        inputMode="numeric"
                        maxLength={5}
                        placeholder="19511"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                        ⌖
                      </span>
                    </div>
                  </label>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="h-12 w-full rounded-xl bg-emerald-700 px-7 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 md:w-auto"
                    >
                      Search Gurus
                    </button>
                  </div>
                </div>

                {zipLookupMessage ? (
                  <p
                    className={`mt-3 text-xs font-bold ${
                      zipLookupStatus === "found"
                        ? "text-emerald-700"
                        : zipLookupStatus === "loading"
                          ? "text-slate-500"
                          : "text-amber-700"
                    }`}
                  >
                    {zipLookupMessage}
                  </p>
                ) : null}
              </form>
              <div className="relative z-20 mt-6 flex justify-center lg:hidden">
                <HeroSignupCard
                  onGoogleSignup={handleOAuthSignup}
                  onTrack={trackHomepageClick}
                />
              </div>

              <div className="relative z-20 mt-4 lg:mt-6 lg:w-[640px] xl:w-[670px]">
                <TrustRow />
              </div>
            </div>
          </div>

          <div className="hidden min-h-[500px] lg:block" />

          <div className="relative z-20 hidden lg:block">
            <HeroSignupCard
              onGoogleSignup={handleOAuthSignup}
              onTrack={trackHomepageClick}
            />
          </div>
        </div>
      </section>

      <section className="bg-white py-5 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-black tracking-[-0.035em] text-slate-950 sm:text-3xl">
                Meet local Gurus Pet Parents love
              </h2>
              <p className="mt-1 text-xs font-semibold text-slate-600 sm:text-sm">
                Real people. Real care. Real reviews.
              </p>
            </div>

            <Link
              href="/search"
              onClick={() => trackHomepageClick("View all Gurus", "/search")}
              className="text-xs font-black text-emerald-700 hover:text-emerald-800 hover:underline sm:text-sm"
            >
              View all Gurus
            </Link>
          </div>

          {visibleGuruCards.length > 0 ? (
            <div
              ref={guruCarouselRef}
              onMouseEnter={() => setIsGuruCarouselPaused(true)}
              onMouseLeave={() => setIsGuruCarouselPaused(false)}
              onTouchStart={() => setIsGuruCarouselPaused(true)}
              onTouchEnd={() => setIsGuruCarouselPaused(false)}
              onFocus={() => setIsGuruCarouselPaused(true)}
              onBlur={() => setIsGuruCarouselPaused(false)}
              className="mt-5 flex gap-3 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden"
              aria-label="Featured local Gurus carousel"
            >
              {[...visibleGuruCards, ...visibleGuruCards].map((guru, index) => (
                <GuruCardView
                  key={`${guru.id}-${index}`}
                  guru={guru}
                  onTrack={trackHomepageClick}
                />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-3xl border border-emerald-100 bg-emerald-50/50 p-5 text-sm font-semibold text-slate-700">
              Guru profiles are loading from account photos. Visit Find Care to
              view all available Gurus while profile photos finish syncing to the
              homepage carousel.
            </div>
          )}
        </div>
      </section>

      <section className="bg-white pb-7 sm:pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid overflow-hidden rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 shadow-[0_18px_45px_rgba(15,23,42,0.08)] lg:grid-cols-3">
            <div className="border-b border-emerald-100 p-5 lg:border-b-0 lg:border-r lg:p-6">
              <h2 className="text-lg font-black tracking-[-0.03em] text-slate-950 lg:text-xl">
                Share SitGuru. Earn PetPerks.
              </h2>

              <div className="mt-5 grid gap-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-xl">
                    🐾
                  </span>
                  <div>
                    <p className="font-black text-slate-950">
                      Give $10. Get $10.
                    </p>
                    <p className="text-sm font-semibold text-slate-600">
                      for Pet Parents
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-xl">
                    🤝
                  </span>
                  <div>
                    <p className="font-black text-slate-950">
                      Refer a Guru. Earn $20.
                    </p>
                    <p className="text-sm font-semibold text-slate-600">
                      for future Gurus
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="/signup"
                onClick={() =>
                  trackHomepageClick("PetPerks Learn More", "/signup")
                }
                className="mt-6 inline-flex rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-black text-white transition hover:bg-emerald-800"
              >
                Learn more
              </Link>
            </div>

            <div className="border-b border-emerald-100 p-5 lg:border-b-0 lg:border-r lg:p-6">
              <h2 className="text-lg font-black tracking-[-0.03em] text-slate-950 lg:text-xl">
                Anyone can join. Anyone can apply.
              </h2>

              <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                Pet Parents use SitGuru to find trusted local care. Gurus apply
                to offer care. SitGuru Programs create additional ways to earn,
                refer, and help grow the SitGuru Pet Community.
              </p>

              <div className="mt-5 grid gap-4">
                {programPathways.map((program) => (
                  <Link
                    key={program.title}
                    href={program.href}
                    onClick={() =>
                      trackHomepageClick(program.title, program.href)
                    }
                    className="group flex items-start gap-3 rounded-2xl p-2 transition hover:bg-white"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                      {program.icon}
                    </span>
                    <div>
                      <p className="font-black text-slate-950 group-hover:text-emerald-800">
                        {program.title}
                      </p>
                      <p className="text-sm font-semibold leading-5 text-slate-600">
                        {program.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href="/search"
                  onClick={() => trackHomepageClick("Find Care", "/search")}
                  className="inline-flex rounded-full bg-emerald-700 px-4 py-2 text-xs font-black text-white transition hover:bg-emerald-800"
                >
                  Find Care
                </Link>

                <Link
                  href="/guru/signup"
                  onClick={() =>
                    trackHomepageClick("Become a Guru", "/guru/signup")
                  }
                  className="inline-flex rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-black text-emerald-800 transition hover:bg-emerald-50"
                >
                  Become a Guru
                </Link>

                <Link
                  href="/programs"
                  onClick={() =>
                    trackHomepageClick("Explore Programs", "/programs")
                  }
                  className="inline-flex rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-black text-emerald-800 transition hover:bg-emerald-50"
                >
                  Explore Programs
                </Link>
              </div>
            </div>

            <div className="p-5 lg:p-6">
              <h2 className="text-lg font-black tracking-[-0.03em] text-slate-950 lg:text-xl">
                How SitGuru works
              </h2>

              <div className="mt-5 grid gap-4">
                {[
                  [
                    "1",
                    "Find a Guru",
                    "Search local care by service & location",
                  ],
                  ["2", "Choose a service", "Pick the right care for your pet"],
                  [
                    "3",
                    "Book with confidence",
                    "Secure, trusted, and supported",
                  ],
                ].map(([number, title, description]) => (
                  <div key={title} className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-black text-white">
                      {number}
                    </span>
                    <div>
                      <p className="font-black text-slate-950">{title}</p>
                      <p className="text-sm font-semibold text-slate-600">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/how-it-works"
                onClick={() =>
                  trackHomepageClick("See how it works", "/how-it-works")
                }
                className="mt-6 inline-flex items-center gap-2 text-sm font-black text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                See how it works →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-white via-emerald-50/30 to-white pb-8 sm:pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[34px] border border-emerald-100 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:p-6 lg:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
              <div>
                <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-emerald-800">
                  SitGuru Programs
                </div>

                <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-0.045em] text-slate-950 sm:text-4xl">
                  Anyone can join. Anyone can apply.
                </h2>

                <p className="mt-4 text-base leading-8 text-slate-700 sm:text-lg">
                  Pet Parents use SitGuru to find trusted local care. Gurus apply
                  to offer care. SitGuru Programs create additional ways to earn,
                  refer, and help grow the SitGuru Pet Community.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href="/search"
                    onClick={() =>
                      trackHomepageClick("Find Care Programs Section", "/search")
                    }
                    className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-sky-400 px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:brightness-105 sm:w-auto"
                  >
                    Find Care
                  </Link>

                  <Link
                    href="/guru/signup"
                    onClick={() =>
                      trackHomepageClick(
                        "Become a Guru Programs Section",
                        "/guru/signup",
                      )
                    }
                    className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 sm:w-auto"
                  >
                    Become a Guru
                  </Link>

                  <Link
                    href="/programs"
                    onClick={() =>
                      trackHomepageClick("Explore Programs", "/programs")
                    }
                    className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 sm:w-auto"
                  >
                    Explore Programs
                  </Link>
                </div>

                <div className="mt-7 flex flex-wrap gap-3">
                  {[
                    "Student Hire",
                    "Veterans Hire",
                    "SkillBridge applicants",
                    "Ambassador Program",
                    "Referral rewards",
                    "Community growth",
                  ].map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-800"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                {homepagePrograms.map((program) => (
                  <ProgramHeroCard
                    key={program.title}
                    program={program}
                    onTrack={trackHomepageClick}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white pb-8 sm:pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950 sm:text-2xl">
              Popular services
            </h2>

            <Link
              href="/search"
              onClick={() =>
                trackHomepageClick("Browse all services", "/search")
              }
              className="text-sm font-black text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              Browse all services
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4">
            {popularServices.map((service) => (
              <Link
                key={service.title}
                href={service.href}
                onClick={() => trackHomepageClick(service.title, service.href)}
                className="group rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:bg-emerald-50/40 hover:shadow-md"
              >
                <div className="text-2xl">{service.icon}</div>
                <p className="mt-2 text-xs font-black text-slate-800 group-hover:text-emerald-800">
                  {service.title}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white pb-10 sm:pb-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[30px] bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 p-6 text-center text-white shadow-[0_24px_70px_rgba(6,78,59,0.28)] sm:p-9">
            <h2 className="text-2xl font-black tracking-[-0.04em] text-white sm:text-3xl">
              Ready to get started?
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-6 text-emerald-50 sm:text-base">
              Find trusted pet care or join SitGuru and be part of something
              new.
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/search"
                onClick={() =>
                  trackHomepageClick("Find Care Near Me Final CTA", "/search")
                }
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-400"
              >
                ⌖ Find Care Near Me
              </Link>

              <Link
                href="/guru/signup"
                onClick={() =>
                  trackHomepageClick(
                    "Become a Guru Final CTA",
                    "/guru/signup",
                  )
                }
                className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-black text-white transition hover:bg-white/15"
              >
                Become a Guru
              </Link>

              <Link
                href="/programs"
                onClick={() =>
                  trackHomepageClick("Explore Programs Final CTA", "/programs")
                }
                className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-black text-white transition hover:bg-white/15"
              >
                Explore Programs
              </Link>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
            {[
              "Secure payments",
              "Trust & Safety focused",
              "ID verified",
              "Protected by SitGuru",
            ].map((item) => (
              <div key={item} className="text-xs font-black text-slate-600">
                <span className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 text-emerald-700">
                  ⛨
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}