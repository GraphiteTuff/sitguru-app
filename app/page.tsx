"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import PaymentIntegrationsGrid from "@/components/payments/PaymentIntegrationsGrid";
import HomepageEventsSectionClient from "@/components/community/HomepageEventsSectionClient";
import HomepageAppsComingSoon from "@/components/marketing/HomepageAppsComingSoon";
import AcademyGraduateBadge from "@/components/university/AcademyGraduateBadge";
import { PawIcon } from "@/components/ui/PawIcon";
import { trackEvent } from "@/lib/analytics/track";
import {
  getGuruProfilePhotoUrl,
  hasGuruProfilePhoto,
} from "@/lib/gurus/profile-photo";
import { SEARCH_SERVICE_OPTIONS } from "@/lib/search/service-options";
import { supabase } from "@/lib/supabase";
import {
  companionChatHref,
  openCompanionChat,
} from "@/lib/companions/open-companion-chat";

const heroVideoPaths = [
  "/videos/sitguru-homepage-hero.mp4",
  "/videos/sitguru-homepage-hero-2.mp4",
  "/videos/sitguru-homepage-hero-3-ambassadors.mp4",
] as const;

const heroVideoLabels = [
  "Dog Walking",
  "Drop-In Visits",
  "Join the SitGuru Community",
] as const;

const heroVideoPosterPath = "/images/sitguru-homepage-hero-poster.jpg";
const heroVideoPlaybackRates = [1, 1, 0.9] as const;
const heroVideoTransitionMs = 420;
const defaultGuruAvatarPath = "/images/sitguru-message-avatar.jpg";

const heroServiceOptions = SEARCH_SERVICE_OPTIONS;

const popularServices = [
  { title: "Dog Walking", icon: "🐕", href: "/search?service=Dog%20Walking" },
  { title: "Pet Sitting", icon: "🏡", href: "/search?service=Pet%20Sitting" },
  { title: "Boarding", icon: "🛏️", href: "/search?service=Boarding" },
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

/** Homepage AI Pet Companions — avatar, statement, and open-chat actions. */
const aiPetCompanions = [
  {
    id: "rogue" as const,
    name: "Rogue",
    role: "Chief Treat Officer",
    avatarSrc: "/images/rogue-avatar.png",
    objectPosition: "50% 28%",
    statement:
      "Just like zoomies, I'm quick to find you the local pet care you deserve. I've got your pack's back 24/7!",
    ctaLabel: "Chat with Rogue",
  },
  {
    id: "taco" as const,
    name: "Taco",
    role: "Ambassador Advocate",
    avatarSrc: "/images/taco-avatar.png",
    objectPosition: "center 22%",
    statement:
      "I'm here to cheer on our Ambassadors. I'll fetch your links and track your work!",
    ctaLabel: "Chat with Taco",
  },
  {
    id: "scout" as const,
    name: "Scout",
    role: "Guru Matching Officer",
    avatarSrc: "/images/scout-avatar.png",
    objectPosition: "center 22%",
    statement:
      "Scout reporting for duty. I'm here to help seamlessly match our local Pet Gurus to the perfect Pet Parents.",
    ctaLabel: "Chat with Scout",
  },
  {
    id: "delilah" as const,
    name: "Delilah",
    role: "Pet Event Coordinator",
    avatarSrc: "/images/delilah-avatar.png",
    objectPosition: "50% 28%",
    statement:
      "I'm your Pet Event Coordinator — helping planners, hosts, and Pet Parents with listings, RSVPs, and pack gathers near you!",
    ctaLabel: "Chat with Delilah",
  },
] as const;

type FeaturedHomepageGuruTarget = {
  label: string;
  fullName?: string;
  firstName?: string;
};

const featuredHomepageGuruTargets: FeaturedHomepageGuruTarget[] = [
  { label: "Adonai", firstName: "adonai" },
  { label: "Amanda Costello", fullName: "amanda costello" },
  { label: "Anna Fryer", fullName: "anna fryer" },
  { label: "Bethany Staab", fullName: "bethany staab" },
  { label: "Carol Detweiler", fullName: "carol detweiler" },
  { label: "George Medina", fullName: "george medina" },
  { label: "Jazzy", firstName: "jazzy" },
  { label: "Latavea Tillman", fullName: "latavea tillman" },
  { label: "Marie Lao", fullName: "marie lao" },
  { label: "Millisant George", fullName: "millisant george" },
  { label: "Norah Wallace", fullName: "norah wallace" },
  { label: "Olivia Goode", fullName: "olivia goode" },
  { label: "Ru", firstName: "ru" },
  { label: "Vanessa Guedez", fullName: "vanessa guedez" },
];

const zipCodeFallbackMap: Record<
  string,
  { city: string; state: string; stateAbbreviation: string }
> = {
  "08030": { city: "Camden", state: "New Jersey", stateAbbreviation: "NJ" },
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

const petParentSignupHref = "/signup?role=pet_parent&next=/customer/dashboard";
const petParentLoginHref = "/login?role=pet_parent&mode=phone&next=/customer/dashboard";
const guruSignupHref = "/become-a-guru";
const sitGuruLoginHref = "/login?mode=phone";

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

type HomepageAssistTopic =
  | "pet-parent"
  | "guru"
  | "ambassador"
  | "partner"
  | "support"
  | "general";

type HomepageAssistFormState = {
  fullName: string;
  email: string;
  phone: string;
  topic: HomepageAssistTopic;
  message: string;
};

type HomepageMessengerSession = {
  conversationId: string;
  token: string;
  visitorName?: string;
  startedAt?: number;
};

type HomepageMessengerMessage = {
  id: string;
  content: string;
  senderRole: "admin" | "visitor" | "user";
  senderName: string;
  createdAt: string;
};

const initialHomepageAssistForm: HomepageAssistFormState = {
  fullName: "",
  email: "",
  phone: "",
  topic: "general",
  message: "",
};

const homepageAssistTopicLabels: Record<HomepageAssistTopic, string> = {
  "pet-parent": "Pet Parent",
  guru: "Guru",
  ambassador: "Ambassador",
  partner: "Partner",
  support: "Support",
  general: "General",
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
  service_city?: string | null;
  service_state?: string | null;
  zip_code?: string | null;
  postal_code?: string | null;
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
  userId?: string;
  name: string;
  role: string;
  location: string;
  rating: string;
  reviewCount: number;
  priceLabel: string;
  image: string;
  imagePositionClass?: string;
  imageScaleClass?: string;
  badge: string;
  href: string;
  isAcademyCertified?: boolean;
  isFoundingGuru?: boolean;
};

type PublicAcademyCertificationResponse = {
  certifiedUserIds?: string[];
};

function normalizeZipCode(value: string) {
  return value.replace(/\D/g, "").slice(0, 5);
}

function detectSourceFromUrl() {
  if (typeof window === "undefined") return "direct";

  const params = new URLSearchParams(window.location.search);
  const sourceParam =
    params.get("source") || params.get("utm_source") || params.get("ref") || "";
  const normalized = sourceParam.trim().toLowerCase();

  if (!normalized) return "direct";
  if (normalized.includes("instagram") || normalized === "ig") return "instagram";
  if (normalized.includes("facebook") || normalized === "fb") return "facebook";
  if (normalized.includes("tiktok") || normalized === "tt") return "tiktok";
  if (normalized.includes("referral")) return "referral";
  if (normalized.includes("indeed")) return "indeed";
  if (normalized.includes("careerlink")) return "careerlink";
  if (normalized.includes("handshake")) return "handshake";
  if (normalized.includes("ambassador")) return "ambassador";
  if (normalized.includes("email")) return "email";

  return normalized;
}

function formatLocation(city?: string | null, state?: string | null) {
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return "Local area";
}

function getGuruCardLocation(guru: Guru) {
  const city = String(guru.service_city || guru.city || "").trim();
  const state = String(guru.service_state || guru.state || "").trim();
  return formatLocation(city, state);
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

function buildSearchHref(searchForm: SearchFormState) {
  const params = new URLSearchParams();

  if (searchForm.service) params.set("service", searchForm.service);
  if (searchForm.zipCode) params.set("zip", searchForm.zipCode);
  if (searchForm.city) params.set("city", searchForm.city);
  if (searchForm.state) params.set("state", searchForm.state);

  const queryString = params.toString();
  return queryString ? `/search?${queryString}` : "/search";
}

function getGuruName(guru: Guru) {
  return guru.display_name || guru.full_name || "Local Pet Guru";
}

function normalizeGuruDisplayName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function doesGuruMatchFeaturedTarget(
  guru: Guru,
  target: FeaturedHomepageGuruTarget,
) {
  const normalizedName = normalizeGuruDisplayName(getGuruName(guru));

  if (target.fullName) {
    return normalizedName === target.fullName;
  }

  if (target.firstName) {
    const firstName = normalizedName.split(/\s+/)[0] || "";
    return firstName === target.firstName;
  }

  return false;
}

function getFoundingGuruOrder(guru: Guru) {
  return featuredHomepageGuruTargets.findIndex((target) =>
    doesGuruMatchFeaturedTarget(guru, target),
  );
}

function orderHomepageGurus(gurus: Guru[]) {
  return gurus
    .map((guru, originalIndex) => ({
      guru,
      originalIndex,
      foundingOrder: getFoundingGuruOrder(guru),
    }))
    .sort((left, right) => {
      const leftIsFounding = left.foundingOrder >= 0;
      const rightIsFounding = right.foundingOrder >= 0;

      if (leftIsFounding && rightIsFounding) {
        return left.foundingOrder - right.foundingOrder;
      }

      if (leftIsFounding) return -1;
      if (rightIsFounding) return 1;

      return left.originalIndex - right.originalIndex;
    })
    .map(({ guru }) => guru);
}

function getGuruPhotoUrl(guru: Guru) {
  return getGuruProfilePhotoUrl(guru) || defaultGuruAvatarPath;
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

function getGuruRole(guru: Guru) {
  if (guru.title) return guru.title;

  const services = Array.isArray(guru.services) ? guru.services : [];
  const firstService = services.find((service) => typeof service === "string");

  if (firstService) return `${firstService} Guru`;
  return "Pet Care Guru";
}

function getGuruCertificationUserId(guru: Guru) {
  return String(guru.user_id || "").trim();
}

function getGuruPriceLabel(guru: Guru) {
  const amount =
    typeof guru.hourly_rate === "number"
      ? guru.hourly_rate
      : typeof guru.rate === "number"
        ? guru.rate
        : 0;

  return amount > 0 ? `From $${amount}` : "View care options";
}

function getGuruImagePositionClass(guru: Guru) {
  const normalizedName = normalizeGuruDisplayName(getGuruName(guru));

  const featuredImagePositions: Record<string, string> = {
    "bethany staab":
      "object-[center_18%] sm:object-[center_24%] lg:object-[center_30%]",
    "millisant george":
      "object-[center_1%] sm:object-[center_4%] lg:object-[center_6%]",
    "norah wallace":
      "object-[center_12%] sm:object-[center_18%] lg:object-[center_24%]",
    "olivia goode":
      "object-[center_10%] sm:object-[center_16%] lg:object-[center_22%]",
  };

  return (
    featuredImagePositions[normalizedName] ||
    "object-[center_18%] sm:object-[center_26%] lg:object-[center_34%]"
  );
}

function getGuruImageScaleClass(guru: Guru) {
  const normalizedName = normalizeGuruDisplayName(getGuruName(guru));

  const featuredImageScales: Record<string, string> = {
    "millisant george": "scale-[0.88] sm:scale-[0.9] lg:scale-[0.92]",
  };

  return featuredImageScales[normalizedName] || "";
}

function isFoundingHomepageGuru(guru: Guru) {
  return featuredHomepageGuruTargets.some((target) =>
    doesGuruMatchFeaturedTarget(guru, target),
  );
}

async function loadCertifiedHomepageGuruUserIds(guruUserIds: string[]) {
  const safeUserIds = Array.from(
    new Set(guruUserIds.map((id) => String(id || "").trim()).filter(Boolean)),
  );

  if (!safeUserIds.length) return new Set<string>();

  try {
    const response = await fetch(
      `/api/public/academy-certifications?academyType=guru&userIds=${encodeURIComponent(
        safeUserIds.join(","),
      )}`,
      { cache: "no-store" },
    );

    if (!response.ok) return new Set<string>();

    const payload = (await response.json()) as PublicAcademyCertificationResponse;
    return new Set(
      (payload.certifiedUserIds || [])
        .map((id) => String(id || "").trim())
        .filter(Boolean),
    );
  } catch (error) {
    console.warn("Could not load Guru Academy certifications:", error);
    return new Set<string>();
  }
}

function mapGurusToCards(
  gurus: Guru[],
  certifiedGuruUserIds: Set<string>,
): GuruCard[] {
  return gurus.map((guru) => {
    const userId = getGuruCertificationUserId(guru);
    const rating = getGuruRating(guru);

    return {
      id: `live-${String(guru.id)}`,
      userId,
      name: getGuruName(guru),
      role: getGuruRole(guru),
      location: getGuruCardLocation(guru),
      rating: rating > 0 ? rating.toFixed(1) : "New",
      reviewCount: Number(guru.review_count || 0),
      priceLabel: getGuruPriceLabel(guru),
      image: getGuruPhotoUrl(guru),
      imagePositionClass: getGuruImagePositionClass(guru),
      badge: guru.is_verified ? "Verified" : "Profile",
      href: getGuruHref(guru),
      isAcademyCertified: userId
        ? certifiedGuruUserIds.has(userId)
        : false,
      isFoundingGuru: isFoundingHomepageGuru(guru),
    };
  });
}

function getMessengerInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "V";

  const first = parts[0]?.[0] || "";
  const second = parts.length > 1 ? parts[1]?.[0] || "" : "";
  return `${first}${second}`.toUpperCase() || "V";
}

function HeroVisual({
  onActiveVideoChange,
  onVideoTransitionChange,
}: {
  onActiveVideoChange: (index: number) => void;
  onVideoTransitionChange: (isTransitioning: boolean) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const transitionTimeoutRef = useRef<number | null>(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const [isVideoTransitioning, setIsVideoTransitioning] = useState(false);

  const activeVideoPath = heroVideoPaths[activeVideoIndex];
  const activeVideoPlaybackRate = heroVideoPlaybackRates[activeVideoIndex] ?? 1;

  useEffect(() => {
    onActiveVideoChange(activeVideoIndex);
  }, [activeVideoIndex, onActiveVideoChange]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = activeVideoPlaybackRate;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      video.currentTime = 0;
      setIsVideoPaused(true);
      return;
    }

    void video.play().catch(() => setIsVideoPaused(true));
  }, [activeVideoIndex, activeVideoPlaybackRate]);

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  function playActiveVideo() {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = activeVideoPlaybackRate;
    void video
      .play()
      .then(() => {
        setIsVideoPaused(false);
        setIsVideoTransitioning(false);
        onVideoTransitionChange(false);
      })
      .catch(() => {
        setIsVideoPaused(true);
        setIsVideoTransitioning(false);
        onVideoTransitionChange(false);
      });
  }

  function rotateToNextVideo() {
    if (transitionTimeoutRef.current !== null) {
      window.clearTimeout(transitionTimeoutRef.current);
    }

    setIsVideoTransitioning(true);
    onVideoTransitionChange(true);
    transitionTimeoutRef.current = window.setTimeout(() => {
      setActiveVideoIndex(
        (currentIndex) => (currentIndex + 1) % heroVideoPaths.length,
      );
      transitionTimeoutRef.current = null;
    }, heroVideoTransitionMs);
  }

  function toggleHeroVideo() {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      playActiveVideo();
      return;
    }

    video.pause();
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-slate-950">
      <video
        key={activeVideoPath}
        ref={videoRef}
        className={`absolute inset-0 h-full w-full object-cover object-[62%_center] transition-opacity duration-500 sm:object-[58%_center] lg:object-center ${
          isVideoTransitioning ? "opacity-0" : "opacity-100"
        }`}
        poster={heroVideoPosterPath}
        autoPlay
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
        onCanPlay={(event) => {
          event.currentTarget.playbackRate = activeVideoPlaybackRate;
          playActiveVideo();
        }}
        onEnded={rotateToNextVideo}
        onPlay={() => setIsVideoPaused(false)}
        onPause={() => setIsVideoPaused(true)}
      >
        <source src={activeVideoPath} type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-black/15" />
      <div className="absolute inset-y-0 left-0 w-[95%] bg-gradient-to-r from-black/80 via-black/50 to-transparent sm:w-[82%] lg:w-[68%]" />
      <div className="absolute inset-x-0 bottom-0 h-[32%] bg-gradient-to-t from-black/45 to-transparent" />

      <button
        type="button"
        onClick={toggleHeroVideo}
        className="pointer-events-auto absolute right-5 top-5 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/45 text-sm font-black text-white shadow-lg backdrop-blur transition hover:bg-black/70 focus:outline-none focus:ring-4 focus:ring-white/25 sm:right-6 sm:top-6 lg:bottom-5 lg:right-5 lg:top-auto"
        aria-label={isVideoPaused ? "Play homepage videos" : "Pause homepage videos"}
        title={isVideoPaused ? "Play homepage videos" : "Pause homepage videos"}
      >
        <span aria-hidden="true">{isVideoPaused ? "▶" : "Ⅱ"}</span>
      </button>
    </div>
  );
}

function SearchPanel({
  searchForm,
  zipLookupMessage,
  zipLookupStatus,
  onSubmit,
  onChange,
}: {
  searchForm: SearchFormState;
  zipLookupMessage: string;
  zipLookupStatus: ZipLookupStatus;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: <K extends keyof SearchFormState>(
    key: K,
    value: SearchFormState[K],
  ) => void;
}) {
  return (
    <form
      action="/search"
      onSubmit={onSubmit}
      className="rounded-3xl border border-white/25 bg-white/95 p-3 shadow-[0_24px_70px_rgba(0,0,0,0.20)] backdrop-blur-md sm:p-4"
    >
      <input type="hidden" name="city" value={searchForm.city} />
      <input type="hidden" name="state" value={searchForm.state} />

      <div className="grid gap-3 md:grid-cols-[1.35fr_0.85fr_auto] md:items-end">
        <label className="block min-w-0">
          <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-500">
            Service
          </span>
          <select
            name="service"
            value={searchForm.service}
            onChange={(event) => onChange("service", event.target.value)}
            className="min-h-12 h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 text-base font-bold text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 sm:text-sm"
          >
            <option value="">All services</option>
            {heroServiceOptions.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
        </label>

        <label className="block min-w-0">
          <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-500">
            ZIP code
          </span>
          <input
            name="zip"
            value={searchForm.zipCode}
            onChange={(event) => onChange("zipCode", event.target.value)}
            className="min-h-12 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 sm:text-sm"
            inputMode="numeric"
            maxLength={5}
            autoComplete="postal-code"
            placeholder="Enter ZIP"
          />
        </label>

        <button
          type="submit"
          className="min-h-12 h-12 w-full rounded-xl bg-emerald-700 px-6 text-base font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 sm:text-sm md:w-auto"
        >
          See Gurus Near Me
        </button>
      </div>

      {zipLookupMessage ? (
        <p
          className={`mt-2 text-xs font-bold ${
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
  );
}

function GuruCardView({
  guru,
  onTrack,
  isClone = false,
}: {
  guru: GuruCard;
  onTrack: (label: string, destination: string) => void;
  isClone?: boolean;
}) {
  return (
    <Link
      href={guru.href}
      onClick={() => onTrack(`Guru Card ${guru.name}`, guru.href)}
      tabIndex={isClone ? -1 : undefined}
      aria-hidden={isClone ? true : undefined}
      className="block h-full overflow-hidden rounded-[26px] border border-emerald-100 bg-white shadow-[0_14px_35px_rgba(15,23,42,0.08)]"
    >
      <div className="relative h-72 overflow-hidden bg-slate-100 sm:h-64 lg:h-56">
        <img
          src={guru.image}
          alt={`${guru.name}, ${guru.role}`}
          className={`h-full w-full object-cover ${
            guru.imageScaleClass || ""
          } ${
            guru.imagePositionClass ||
            "object-[center_18%] sm:object-[center_26%] lg:object-[center_34%]"
          }`}
          loading="lazy"
        />
      </div>

      <div className="p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {guru.isFoundingGuru ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-amber-900">
              <span aria-hidden="true">★</span>
              Founding Guru
            </span>
          ) : null}

          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-800">
            {guru.badge}
          </span>
        </div>

        <div className="flex items-start gap-2">
          <h3 className="min-w-0 flex-1 text-base font-black text-slate-950">
            {guru.name}
          </h3>
          {guru.isAcademyCertified ? (
            <AcademyGraduateBadge academyType="guru" variant="mini" />
          ) : null}
        </div>

        <p className="mt-1 text-xs font-bold text-emerald-700">{guru.role}</p>
        <p className="mt-1 text-xs text-slate-600">{guru.location}</p>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <p className="text-xs font-black text-slate-900">
            <span className="text-amber-500">★</span> {guru.rating}
            {guru.reviewCount > 0 ? ` (${guru.reviewCount})` : ""}
          </p>
          <p className="text-xs font-black text-emerald-800">
            {guru.priceLabel}
          </p>
        </div>
      </div>
    </Link>
  );
}

function PawReportSection({
  onTrack,
}: {
  onTrack: (label: string, destination: string) => void;
}) {
  const benefits = [
    {
      icon: "🚶",
      title: "Follow walks",
      body: "See walk time, progress, distance, and available route details.",
    },
    {
      icon: "📸",
      title: "Receive updates",
      body: "Get photos and notes about food, water, potty, medication, and play.",
    },
    {
      icon: "🗂️",
      title: "Keep history",
      body: "Review completed PawReports from past bookings in one place.",
    },
  ];

  return (
    <section className="bg-gradient-to-br from-emerald-50 via-white to-sky-50 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-[34px] border border-emerald-100 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.09)] lg:grid-cols-[0.9fr_1.1fr]">
          {/* Marketing mock only — live PawReport lives on booking dashboards */}
          <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-700 p-6 sm:p-8 lg:p-10">
            <div className="mx-auto max-w-md overflow-hidden rounded-[28px] border border-white/15 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
              <div className="border-b border-slate-100 bg-emerald-50 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                  PawReport Live
                </p>
                <h3 className="mt-1 text-2xl font-black text-slate-950">
                  Scout&apos;s Walk
                </h3>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  Live care updates from your Guru
                </p>
              </div>

              <div className="space-y-3 p-5">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                        Walk in progress
                      </p>
                      <p className="mt-1 text-xl font-black text-slate-950">
                        0.8 mi · 18 min
                      </p>
                    </div>
                    <span className="text-3xl">🚶</span>
                  </div>
                  <div className="relative mt-4 h-32 overflow-hidden rounded-2xl border border-emerald-100 bg-[radial-gradient(circle_at_18%_72%,#10b981_0_3px,transparent_4px),radial-gradient(circle_at_42%_48%,#38bdf8_0_3px,transparent_4px),radial-gradient(circle_at_70%_30%,#10b981_0_3px,transparent_4px),linear-gradient(135deg,#ecfdf5,#f8fafc)]">
                    <div className="absolute left-[19%] top-[68%] h-[2px] w-[29%] -rotate-[25deg] rounded-full bg-emerald-400" />
                    <div className="absolute left-[43%] top-[49%] h-[2px] w-[32%] -rotate-[18deg] rounded-full bg-sky-400" />
                  </div>
                </div>

                {[
                  ["📸", "3 new photos"],
                  ["💧", "Water refreshed"],
                  ["📝", "Scout loved the park"],
                ].map(([icon, label]) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"
                  >
                    <span className="text-xl">{icon}</span>
                    <p className="text-sm font-bold text-slate-800">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-12">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
              The SitGuru care experience
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] text-slate-950 sm:text-4xl lg:text-5xl">
              Know how every visit went.
            </h2>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-600">
              PawReport keeps walk progress, photos, care notes, and completed
              visit history connected to the booking.
            </p>

            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {benefits.map((benefit) => (
                <div key={benefit.title}>
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-xl">
                    {benefit.icon}
                  </span>
                  <h3 className="mt-3 font-black text-slate-950">
                    {benefit.title}
                  </h3>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                    {benefit.body}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/search"
                onClick={() => onTrack("Find a Guru PawReport", "/search")}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-700 px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800"
              >
                Find a Guru
              </Link>
              <Link
                href="/pawreport-live"
                onClick={() =>
                  onTrack("See how PawReport works", "/pawreport-live")
                }
                className="inline-flex min-h-12 items-center justify-center px-3 py-3 text-sm font-black text-emerald-800 hover:underline"
              >
                See how PawReport works →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CompactPartnerSection({
  onTrack,
}: {
  onTrack: (label: string, destination: string) => void;
}) {
  const partners = [
    {
      name: "Annabel's Touch Chiropractic",
      href: "https://annabelstouchchiropracticandrehab.janeapp.com/",
      image: "/images/partners/annabels-touch-chiropractic.png",
      imageClassName: "h-auto max-h-24 w-full object-contain",
      imageWrapperClassName: "bg-white",
    },
    {
      name: "Doylestown Animal Medical Clinic",
      href: "https://doylestownanimalmedicalclinic.com/",
      image: "/images/partners/doylestown-animal-medical-clinic.png",
      imageClassName: "h-16 w-full object-contain",
      imageWrapperClassName: "bg-white",
    },
    {
      name: "Outcast Rescue",
      href: "https://www.outcastrescue.com/",
      image: "/images/partners/outcast-rescue.webp",
      imageClassName: "h-20 w-full object-contain",
      imageWrapperClassName: "bg-black",
    },
    {
      name: "Mostly Muttz Rescue",
      href: "https://www.mostlymuttz.org/",
      image:
        "https://static.wixstatic.com/media/571106_b2fad3bdb2c84b218f39dd5d847cb0c3~mv2.jpg",
      imageClassName: "h-16 w-full object-contain",
      imageWrapperClassName: "bg-white",
    },
    {
      name: "Zeppa Studios",
      href: "https://zeppastudios.com/",
      image: "/images/partners/zeppa-studios.png",
      imageClassName: "h-auto max-h-20 w-full object-contain",
      imageWrapperClassName: "bg-white",
    },
    {
      name: "Crimson Cat Studios",
      href: "https://www.crimsoncatstudios.com/",
      image: "/images/partners/crimson-cat-studios-light.png",
      imageClassName: "h-auto max-h-20 w-full object-contain",
      imageWrapperClassName: "bg-white",
    },
    {
      name: "Acorn Valley Pet Boarding",
      href: "https://acornvalleypetboarding.com/",
      image: "/images/partners/acorn-valley-pet-boarding-light.png",
      imageClassName: "h-auto max-h-20 w-full object-contain",
      imageWrapperClassName: "bg-white",
    },
  ] as const;

  return (
    <section className="border-y border-slate-100 bg-white py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
          SitGuru Partner Network
        </p>
        <h2 className="mx-auto mt-2 max-w-3xl text-2xl font-black tracking-[-0.035em] text-slate-950 sm:text-3xl">
          Explore our growing network of local pet care partners.
        </h2>

        <div
          aria-label="SitGuru partner carousel"
          aria-roledescription="carousel"
          className="sitguru-partner-carousel-viewport -mx-4 mt-7 overflow-hidden px-4 py-8"
        >
          <div className="sitguru-partner-carousel-track flex w-max will-change-transform">
            {[0, 1].map((groupIndex) => (
              <div
                key={groupIndex}
                className="flex shrink-0 items-center gap-4 pr-4 sm:gap-5 sm:pr-5"
                aria-hidden={groupIndex === 1 ? true : undefined}
              >
                {partners.map((partner) => (
                  <a
                    key={`${groupIndex}-${partner.name}`}
                    href={partner.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onTrack(partner.name, partner.href)}
                    aria-label={`Visit ${partner.name}`}
                    tabIndex={groupIndex === 1 ? -1 : undefined}
                    className="sitguru-partner-carousel-card relative z-0 flex h-32 w-[260px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm focus-visible:z-20 focus-visible:border-emerald-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 sm:w-72"
                  >
                    <div
                      className={`flex h-full w-full items-center justify-center overflow-hidden rounded-xl px-4 ${partner.imageWrapperClassName}`}
                    >
                      <img
                        src={partner.image}
                        alt={`${partner.name} logo`}
                        className={partner.imageClassName}
                        loading="lazy"
                      />
                    </div>
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes sitguru-partner-carousel-loop {
            from {
              transform: translateX(0);
            }

            to {
              transform: translateX(-50%);
            }
          }

          .sitguru-partner-carousel-track {
            animation: sitguru-partner-carousel-loop 45s linear infinite;
          }

          @media (hover: hover) and (pointer: fine) {
            .sitguru-partner-carousel-viewport:hover
              .sitguru-partner-carousel-track,
            .sitguru-partner-carousel-viewport:focus-within
              .sitguru-partner-carousel-track {
              animation-play-state: paused;
            }

            .sitguru-partner-carousel-card {
              transition:
                transform 280ms ease,
                border-color 280ms ease,
                box-shadow 280ms ease;
            }

            .sitguru-partner-carousel-card:hover,
            .sitguru-partner-carousel-card:focus-visible {
              z-index: 30;
              transform: translateY(-4px) scale(1.045);
              border-color: rgb(110 231 183);
              box-shadow: 0 20px 45px rgba(15, 23, 42, 0.16);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .sitguru-partner-carousel-track {
              animation: none;
            }
          }
        `}</style>

        <Link
          href="/partners"
          onClick={() => onTrack("Become a SitGuru Partner", "/partners")}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2.5 text-sm font-black text-emerald-700 hover:bg-emerald-50 hover:underline"
        >
          Become a partner →
        </Link>
      </div>
    </section>
  );
}

function HomepageAssistPopup({
  source,
  onTrack,
}: {
  source: string;
  onTrack: (label: string, destination: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<HomepageAssistFormState>(
    initialHomepageAssistForm,
  );
  const [session, setSession] = useState<HomepageMessengerSession | null>(null);
  const [messages, setMessages] = useState<HomepageMessengerMessage[]>([]);
  const [hasNewAdminReply, setHasNewAdminReply] = useState(false);
  const latestAdminMessageIdRef = useRef("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshingMessages, setIsRefreshingMessages] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const messengerSessionStorageKey = "sitguru-homepage-messenger-session";

  function clearStoredMessengerSession() {
    window.sessionStorage.removeItem(messengerSessionStorageKey);
    window.localStorage.removeItem(messengerSessionStorageKey);
  }

  function saveCurrentMessengerSession(nextSession: HomepageMessengerSession) {
    window.sessionStorage.setItem(
      messengerSessionStorageKey,
      JSON.stringify(nextSession),
    );
    window.localStorage.removeItem(messengerSessionStorageKey);
  }

  useEffect(() => {
    window.localStorage.removeItem(messengerSessionStorageKey);

    const savedSession = window.sessionStorage.getItem(
      messengerSessionStorageKey,
    );

    if (!savedSession) return;

    try {
      const parsed = JSON.parse(savedSession) as HomepageMessengerSession;
      if (!parsed?.conversationId || !parsed?.token) return;

      setSession(parsed);
      if (parsed.visitorName) {
        setForm((previous) => ({
          ...previous,
          fullName: parsed.visitorName || previous.fullName,
        }));
      }
    } catch {
      clearStoredMessengerSession();
    }
  }, []);

  function applyMessengerMessages(
    nextMessages: HomepageMessengerMessage[],
    options: { alertOnAdminReply?: boolean } = {},
  ) {
    const latestAdminMessage = [...nextMessages]
      .reverse()
      .find((message) => message.senderRole === "admin");
    const latestAdminMessageId = latestAdminMessage?.id || "";

    if (
      options.alertOnAdminReply &&
      latestAdminMessageId &&
      latestAdminMessageId !== latestAdminMessageIdRef.current
    ) {
      setHasNewAdminReply(true);
    }

    if (latestAdminMessageId) {
      latestAdminMessageIdRef.current = latestAdminMessageId;
    }

    setMessages(nextMessages);
  }

  async function loadMessengerMessages(
    options: { alertOnAdminReply?: boolean } = {},
  ) {
    if (!session?.conversationId || !session.token) return;

    try {
      const params = new URLSearchParams({
        conversationId: session.conversationId,
        token: session.token,
      });

      const response = await fetch(
        `/api/homepage-messenger?${params.toString()}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        if (response.status === 404) {
          clearStoredMessengerSession();
          setSession(null);
          setMessages([]);
          setHasNewAdminReply(false);
          latestAdminMessageIdRef.current = "";
        }
        return;
      }

      const payload = (await response.json().catch(() => null)) as {
        messages?: HomepageMessengerMessage[];
        conversationStatus?: string;
      } | null;

      const conversationStatus = String(
        payload?.conversationStatus || "",
      ).toLowerCase();

      if (["closed", "archived", "resolved"].includes(conversationStatus)) {
        clearStoredMessengerSession();
        setSession(null);
        setMessages([]);
        setHasNewAdminReply(false);
        latestAdminMessageIdRef.current = "";
        setIsOpen(false);
        return;
      }

      applyMessengerMessages(payload?.messages || [], options);
    } catch (error) {
      console.warn("Unable to refresh homepage messenger:", error);
    }
  }

  useEffect(() => {
    if (!session?.conversationId || !session.token) return;

    let isMounted = true;

    async function loadMessages() {
      if (!isMounted) return;
      await loadMessengerMessages({ alertOnAdminReply: true });
    }

    loadMessages();

    const channel = supabase
      .channel(`sitguru-homepage-messenger-${session.conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${session.conversationId}`,
        },
        () => {
          loadMessages();
        },
      )
      .subscribe();

    const interval = window.setInterval(loadMessages, 10000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [session]);

  function updateAssistField<K extends keyof HomepageAssistFormState>(
    key: K,
    value: HomepageAssistFormState[K],
  ) {
    setForm((previous) => ({ ...previous, [key]: value }));
    if (formError) setFormError("");
    if (formSuccess) setFormSuccess("");
  }

  async function closeConversation() {
    const activeSession = session;

    try {
      if (activeSession?.conversationId && activeSession.token) {
        await fetch("/api/homepage-messenger", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "close",
            conversationId: activeSession.conversationId,
            token: activeSession.token,
          }),
        });
      }
    } catch (error) {
      console.warn("Unable to close homepage conversation:", error);
    } finally {
      clearStoredMessengerSession();
      setSession(null);
      setMessages([]);
      setHasNewAdminReply(false);
      setFormSuccess("");
      setFormError("");
      latestAdminMessageIdRef.current = "";
      setIsOpen(false);
    }
  }

  async function refreshMessages() {
    if (!session?.conversationId || !session.token) return;

    setIsRefreshingMessages(true);
    try {
      await loadMessengerMessages();
      setHasNewAdminReply(false);
    } finally {
      setIsRefreshingMessages(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanMessage = form.message.trim();
    const cleanFullName = form.fullName.trim();

    if (!cleanFullName) {
      setFormError("Please enter your name.");
      return;
    }

    if (!cleanMessage) {
      setFormError("Please enter a message.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");
    setFormSuccess("");

    try {
      const response = await fetch("/api/homepage-messenger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: session?.conversationId || "",
          token: session?.token || "",
          fullName: cleanFullName,
          email: form.email,
          phone: form.phone,
          topic: form.topic,
          programInterest:
            form.topic === "ambassador" ? "Ambassador Program" : "",
          message: cleanMessage,
          source: "homepage-assist-popup",
          pagePath:
            typeof window !== "undefined"
              ? `${window.location.pathname}${window.location.search}`
              : "/",
          referrer: typeof document !== "undefined" ? document.referrer : "",
          trafficSource: source,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        conversationId?: string;
        token?: string;
        messages?: HomepageMessengerMessage[];
      } | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to send your message.");
      }

      if (payload?.conversationId && payload.token) {
        const nextSession: HomepageMessengerSession = {
          conversationId: payload.conversationId,
          token: payload.token,
          visitorName: cleanFullName,
          startedAt: Date.now(),
        };

        setSession(nextSession);
        saveCurrentMessengerSession(nextSession);
      }

      applyMessengerMessages(payload?.messages || []);

      trackEvent({
        eventName: "homepage_assist_popup_submitted",
        eventType: "lead",
        source,
        role: form.topic,
        metadata: {
          topic: form.topic,
          has_email: Boolean(form.email.trim()),
          has_phone: Boolean(form.phone.trim()),
          version: "homepage_conversion_cleanup_v1",
        },
      });

      setFormSuccess("Message sent. SitGuru Admin can reply here.");
      setForm((previous) => ({
        ...initialHomepageAssistForm,
        fullName: previous.fullName,
        email: previous.email,
        phone: previous.phone,
        topic: previous.topic,
      }));
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to send your message.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleQuickLink(label: string, destination: string) {
    onTrack(label, destination);
    setIsOpen(false);
  }

  return (
    <div className="fixed bottom-[calc(16px+env(safe-area-inset-bottom))] right-4 z-[80] max-w-[calc(100vw-32px)] sm:bottom-5 sm:right-5 sm:w-[400px]">
      {isOpen ? (
        <section className="flex max-h-[78dvh] flex-col overflow-hidden rounded-[24px] border border-emerald-200 bg-white shadow-[0_22px_65px_rgba(15,23,42,0.22)]">
          <div className="bg-emerald-700 px-5 py-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-100">
                  SitGuru Help
                </p>
                <h2 className="mt-1 text-xl font-black">How can we help?</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-lg font-black hover:bg-white/25"
                aria-label="Close SitGuru chat"
              >
                ×
              </button>
            </div>
          </div>

          <div className="overflow-y-auto p-4">
            <div className="grid grid-cols-3 gap-2">
              <Link
                href={petParentSignupHref}
                onClick={() =>
                  handleQuickLink("Chat Pet Parent Signup", petParentSignupHref)
                }
                className="rounded-xl bg-emerald-50 px-2 py-2.5 text-center text-[11px] font-black text-emerald-800"
              >
                Pet Parent
              </Link>
              <Link
                href={guruSignupHref}
                onClick={() =>
                  handleQuickLink("Chat Guru Signup", guruSignupHref)
                }
                className="rounded-xl border border-slate-200 px-2 py-2.5 text-center text-[11px] font-black text-slate-800"
              >
                Guru
              </Link>
              <Link
                href="/ambassadors"
                onClick={() =>
                  handleQuickLink("Chat Ambassador", "/ambassadors")
                }
                className="rounded-xl border border-slate-200 px-2 py-2.5 text-center text-[11px] font-black text-slate-800"
              >
                Ambassador
              </Link>
            </div>

            {messages.length > 0 ? (
              <div className="mt-4 max-h-52 space-y-2 overflow-y-auto rounded-2xl bg-emerald-50/60 p-3">
                {messages.map((message) => {
                  const fromAdmin = message.senderRole === "admin";
                  const displayName = fromAdmin
                    ? message.senderName?.trim() || "SitGuru Admin"
                    : message.senderName?.trim() || form.fullName || "Visitor";

                  return (
                    <div
                      key={message.id}
                      className={`flex items-end gap-2 ${
                        fromAdmin ? "justify-start" : "justify-end"
                      }`}
                    >
                      {fromAdmin ? (
                        <img
                          src={defaultGuruAvatarPath}
                          alt="SitGuru Admin"
                          className="h-8 w-8 rounded-full border border-emerald-100 object-cover"
                        />
                      ) : null}

                      <div
                        className={`max-w-[82%] rounded-2xl px-3 py-2 text-xs font-semibold leading-5 ${
                          fromAdmin
                            ? "border border-emerald-100 bg-white text-slate-800"
                            : "bg-emerald-700 text-white"
                        }`}
                      >
                        <p className="mb-1 text-[9px] font-black uppercase tracking-[0.12em] opacity-70">
                          {displayName}
                        </p>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>

                      {!fromAdmin ? (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-black text-emerald-800">
                          {getMessengerInitials(displayName)}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
              <select
                value={form.topic}
                onChange={(event) =>
                  updateAssistField(
                    "topic",
                    event.target.value as HomepageAssistTopic,
                  )
                }
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              >
                {Object.entries(homepageAssistTopicLabels).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>

              <textarea
                value={form.message}
                onChange={(event) =>
                  updateAssistField("message", event.target.value)
                }
                rows={3}
                placeholder="How can we help?"
                className="resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />

              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={form.fullName}
                  onChange={(event) =>
                    updateAssistField("fullName", event.target.value)
                  }
                  placeholder="Your name"
                  required
                  className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    updateAssistField("email", event.target.value)
                  }
                  placeholder="Email optional"
                  className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <input
                type="tel"
                value={form.phone}
                onChange={(event) =>
                  updateAssistField("phone", event.target.value)
                }
                placeholder="Phone optional"
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />

              {formError ? (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                  {formError}
                </p>
              ) : null}

              {formSuccess ? (
                <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
                  <p>{formSuccess}</p>
                  <button
                    type="button"
                    onClick={refreshMessages}
                    disabled={isRefreshingMessages}
                    className="mt-2 w-full rounded-lg bg-emerald-700 px-3 py-2 text-white"
                  >
                    {isRefreshingMessages ? "Refreshing..." : "Refresh replies"}
                  </button>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-11 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-black text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {isSubmitting ? "Sending..." : "Send message"}
              </button>

              {session?.conversationId ? (
                <button
                  type="button"
                  onClick={closeConversation}
                  className="text-xs font-black text-slate-500 hover:text-rose-700"
                >
                  Close conversation
                </button>
              ) : null}
            </form>
          </div>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setHasNewAdminReply(false);
          }}
          className={`flex min-h-11 items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-black text-white shadow-[0_12px_30px_rgba(15,23,42,0.22)] transition ${
            hasNewAdminReply
              ? "bg-amber-500 hover:bg-amber-600"
              : "bg-emerald-700 hover:bg-emerald-800"
          }`}
        >
          <PawIcon size={14} contrast="dark" solid />
          {hasNewAdminReply ? "SitGuru replied" : "Questions?"}
        </button>
      )}
    </div>
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
  const [isLoadingGurus, setIsLoadingGurus] = useState(true);
  const [source, setSource] = useState("direct");
  const [activeHeroVideoIndex, setActiveHeroVideoIndex] = useState(0);
  const [isHeroVideoTransitioning, setIsHeroVideoTransitioning] = useState(false);

  const searchHref = useMemo(() => buildSearchHref(searchForm), [searchForm]);
  const visibleGuruCards = useMemo(() => guruCards, [guruCards]);
  const guruCarouselDurationSeconds = Math.max(
    visibleGuruCards.length * 6.5,
    60,
  );

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

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
        version: "homepage_conversion_cleanup_v1",
      },
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadHomepageGurus() {
      setIsLoadingGurus(true);

      const { data, error } = await supabase
        .from("gurus")
        .select("*")
        .eq("is_active", true)
        .eq("is_public", true)
        .order("updated_at", { ascending: false, nullsFirst: false })
        .limit(100);

      if (!isMounted) return;

      if (error) {
        console.warn("Could not load live Gurus:", error.message);
        setGuruCards([]);
        setIsLoadingGurus(false);

        trackEvent({
          eventName: "homepage_gurus_load_failed",
          eventType: "system",
          source: detectSourceFromUrl(),
          metadata: {
            error: error.message,
            version: "homepage_conversion_cleanup_v1",
          },
        });
        return;
      }

      const liveGuruRows = ((data || []) as Guru[]).filter(
        (guru) =>
          guru.is_active !== false &&
          guru.is_public !== false &&
          hasGuruProfilePhoto(guru),
      );
      const orderedGuruRows = orderHomepageGurus(liveGuruRows);
      const missingFeaturedGuruNames = featuredHomepageGuruTargets
        .filter(
          (target) =>
            !orderedGuruRows.some((guru) =>
              doesGuruMatchFeaturedTarget(guru, target),
            ),
        )
        .map((target) => target.label);

      if (missingFeaturedGuruNames.length > 0) {
        console.warn(
          "Some Founding Gurus were not found as active, public profiles:",
          missingFeaturedGuruNames.join(", "),
        );
      }

      const liveGuruUserIds = Array.from(
        new Set(
          orderedGuruRows
            .map((guru) => getGuruCertificationUserId(guru))
            .filter(Boolean),
        ),
      );
      const certifiedGuruUserIds =
        await loadCertifiedHomepageGuruUserIds(liveGuruUserIds);

      if (!isMounted) return;

      const liveGuruCards = mapGurusToCards(
        orderedGuruRows,
        certifiedGuruUserIds,
      );

      setGuruCards(liveGuruCards);
      setIsLoadingGurus(false);

      trackEvent({
        eventName: "homepage_gurus_loaded",
        eventType: "system",
        source: detectSourceFromUrl(),
        metadata: {
          live_guru_count: liveGuruCards.length,
          live_certified_guru_count: liveGuruCards.filter(
            (guru) => guru.isAcademyCertified,
          ).length,
          version: "homepage_conversion_cleanup_v1",
        },
      });
    }

    loadHomepageGurus();

    return () => {
      isMounted = false;
    };
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
      setZipLookupMessage("");
      return;
    }

    let isMounted = true;

    async function runLookup() {
      setZipLookupStatus("loading");
      setZipLookupMessage("Looking up your area...");

      try {
        const result = await lookupZipCode(normalizedZip);
        if (!isMounted) return;

        if (!result?.city || !result?.state) {
          setZipLookupStatus("not-found");
          setZipLookupMessage("ZIP not found. You can still search.");
          return;
        }

        setSearchForm((previous) => ({
          ...previous,
          zipCode: normalizedZip,
          city: result.city,
          state: result.stateAbbreviation || result.state,
        }));
        try {
          window.localStorage.setItem("sitguru_home_zip", normalizedZip);
          window.localStorage.setItem("sitguru_home_city", result.city);
          window.localStorage.setItem(
            "sitguru_home_state",
            result.stateAbbreviation || result.state,
          );
          window.localStorage.setItem("sitguru_home_location_source", "search");
        } catch {
          // ignore storage failures
        }
        setZipLookupStatus("found");
        setZipLookupMessage(
          `${result.city}, ${result.stateAbbreviation || result.state}`,
        );
      } catch (error) {
        if (!isMounted) return;

        console.error("ZIP lookup failed:", error);
        setZipLookupStatus("error");
        setZipLookupMessage("ZIP lookup is unavailable. You can still search.");
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
    setSearchForm((previous) => ({
      ...previous,
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
        version: "homepage_conversion_cleanup_v1",
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
        version: "homepage_conversion_cleanup_v1",
      },
    });

    if (
      !searchForm.service &&
      !searchForm.zipCode &&
      !searchForm.city &&
      !searchForm.state
    ) {
      event.preventDefault();
      window.location.assign("/search");
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="relative min-h-[920px] overflow-hidden bg-slate-950 sm:min-h-[860px] md:min-h-[790px] lg:min-h-[690px]">
        <HeroVisual
          onActiveVideoChange={setActiveHeroVideoIndex}
          onVideoTransitionChange={setIsHeroVideoTransitioning}
        />

        <div className="relative z-10 mx-auto flex min-h-[920px] max-w-7xl px-4 sm:min-h-[860px] sm:px-6 md:min-h-[790px] lg:min-h-[690px] lg:items-center lg:px-8 lg:py-12">
          <div className="flex w-full max-w-3xl flex-col self-stretch pb-8 pt-12 sm:pb-10 sm:pt-14 md:pb-12 md:pt-16 lg:block lg:self-auto lg:py-0">
            <div>
              <div
                aria-live="polite"
                className={`inline-flex min-h-7 items-center rounded-full border border-white/25 bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800 shadow-sm backdrop-blur transition-all duration-300 ease-out motion-reduce:transition-none ${
                  isHeroVideoTransitioning
                    ? "translate-y-1 opacity-0"
                    : "translate-y-0 opacity-100"
                }`}
              >
                <span key={activeHeroVideoIndex}>
                  {heroVideoLabels[activeHeroVideoIndex]}
                </span>
              </div>

              <h1
                className="mt-5 max-w-3xl text-[2.8rem] font-black leading-[0.98] tracking-[-0.055em] drop-shadow-[0_4px_24px_rgba(0,0,0,0.45)] sm:text-6xl lg:text-7xl"
                style={{
                  color: "#ffffff",
                  WebkitTextFillColor: "#ffffff",
                  textShadow:
                    "0 4px 24px rgba(0,0,0,0.58), 0 2px 5px rgba(0,0,0,0.9)",
                }}
              >
                Find trusted pet care near you.
              </h1>

              <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-white/90 drop-shadow sm:text-lg">
                Book walks, drop-ins, sitting, boarding, and day care with local
                Pet Gurus.
              </p>
            </div>

            <div className="mt-auto pt-24 sm:pt-28 md:pt-20 lg:mt-8 lg:pt-0">
              <div className="max-w-3xl">
                <SearchPanel
                  searchForm={searchForm}
                  zipLookupMessage={zipLookupMessage}
                  zipLookupStatus={zipLookupStatus}
                  onSubmit={handleSearchSubmit}
                  onChange={updateSearchField}
                />
              </div>

              <div className="mt-5 flex flex-col gap-4 text-sm font-bold text-white sm:flex-row sm:items-center sm:gap-6">
                <span>✓ Reviewed profiles</span>
                <span>✓ Secure booking</span>
                <span>✓ PawReport updates</span>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
                <Link
                  href={guruSignupHref}
                  onClick={() =>
                    trackHomepageClick("Become a Guru Hero Link", guruSignupHref)
                  }
                  className="inline-flex text-sm font-black text-emerald-300 hover:text-emerald-200 hover:underline"
                >
                  Love caring for pets? Become a Guru →
                </Link>
                <Link
                  href={sitGuruLoginHref}
                  onClick={() =>
                    trackHomepageClick("Hero Sign In", sitGuruLoginHref)
                  }
                  className="inline-flex text-sm font-black text-white/90 hover:text-white hover:underline"
                >
                  Already have an account? Sign in →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <HomepageAppsComingSoon onTrack={trackHomepageClick} />

      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                Local care
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">
                Meet Pet Gurus near you.
              </h2>
              <p className="mt-2 text-sm font-semibold text-slate-600 sm:text-base">
                Compare real profiles, services, availability, and reviews.
              </p>
            </div>

            <Link
              href="/search"
              onClick={() => trackHomepageClick("View all Gurus", "/search")}
              className="shrink-0 text-sm font-black text-emerald-700 hover:underline"
            >
              View all Gurus →
            </Link>
          </div>

          {isLoadingGurus ? (
            <div className="-mx-4 mt-8 overflow-hidden px-4 pb-4">
              <div className="flex w-max gap-4">
                {[0, 1, 2, 3, 4, 5].map((item) => (
                  <div
                    key={item}
                    className="h-[430px] w-[286px] shrink-0 animate-pulse rounded-[26px] bg-slate-100 sm:w-[300px] lg:w-[292px] xl:w-[300px]"
                  />
                ))}
              </div>
            </div>
          ) : visibleGuruCards.length > 0 ? (
            <>
              <div
                aria-label="All active SitGuru Pet Gurus"
                aria-roledescription="carousel"
                className="sitguru-guru-carousel-viewport -mx-4 mt-8 overflow-hidden px-4 py-8"
              >
                <div
                  className="sitguru-guru-carousel-track flex w-max will-change-transform"
                  style={{
                    animationDuration: `${guruCarouselDurationSeconds}s`,
                  }}
                >
                  {[0, 1].map((groupIndex) => (
                    <div
                      key={groupIndex}
                      className="flex shrink-0 gap-4 pr-4"
                      aria-hidden={groupIndex === 1 ? true : undefined}
                    >
                      {visibleGuruCards.map((guru) => (
                        <div
                          key={`${groupIndex}-${guru.id}`}
                          className="sitguru-guru-carousel-card relative w-[286px] shrink-0 sm:w-[300px] lg:w-[292px] xl:w-[300px]"
                        >
                          <GuruCardView
                            guru={guru}
                            onTrack={trackHomepageClick}
                            isClone={groupIndex === 1}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <style>{`
                @keyframes sitguru-guru-carousel-loop {
                  from {
                    transform: translateX(0);
                  }

                  to {
                    transform: translateX(-50%);
                  }
                }

                .sitguru-guru-carousel-track {
                  animation-name: sitguru-guru-carousel-loop;
                  animation-timing-function: linear;
                  animation-iteration-count: infinite;
                }

                .sitguru-guru-carousel-card {
                  transform-origin: center center;
                }

                @media (hover: hover) and (pointer: fine) {
                  .sitguru-guru-carousel-viewport:hover
                    .sitguru-guru-carousel-track,
                  .sitguru-guru-carousel-viewport:focus-within
                    .sitguru-guru-carousel-track {
                    animation-play-state: paused;
                  }

                  .sitguru-guru-carousel-card {
                    transition:
                      transform 280ms ease,
                      filter 280ms ease;
                  }

                  .sitguru-guru-carousel-card:hover,
                  .sitguru-guru-carousel-card:focus-within {
                    z-index: 30;
                    transform: scale(1.06);
                    filter: drop-shadow(0 24px 34px rgba(15, 23, 42, 0.2));
                  }
                }
              `}</style>
            </>
          ) : (
            <div className="mt-8 rounded-3xl border border-emerald-100 bg-emerald-50 p-7 text-center">
              <h3 className="text-xl font-black text-slate-950">
                We&apos;re growing near you.
              </h3>
              <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                Search your area to see current availability or expand your
                location.
              </p>
              <Link
                href="/search"
                onClick={() =>
                  trackHomepageClick("Search Current Availability", "/search")
                }
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-black text-white"
              >
                Search Current Availability
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50/70 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-black tracking-[-0.035em] text-slate-950">
              Popular services
            </h2>
            <Link
              href="/search"
              onClick={() =>
                trackHomepageClick("Browse all services", "/search")
              }
              className="text-sm font-black text-emerald-700 hover:underline"
            >
              Browse all →
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {popularServices.map((service) => (
              <Link
                key={service.title}
                href={service.href}
                onClick={() =>
                  trackHomepageClick(service.title, service.href)
                }
                className="group rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"
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

      <section id="how-sitguru-works" className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
              Simple from the start
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">
              Pet care in three steps.
            </h2>
          </div>

          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {[
              ["1", "Search", "Choose a service and location."],
              ["2", "Choose", "Compare local Gurus and find the right match."],
              ["3", "Book", "Confirm care and follow updates through SitGuru."],
            ].map(([number, title, description]) => (
              <div
                key={title}
                className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm"
              >
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-700 text-sm font-black text-white">
                  {number}
                </span>
                <h3 className="mt-4 text-xl font-black text-slate-950">
                  {title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="ai-companions"
        aria-label="AI Pet Companions"
        className="bg-gradient-to-b from-white via-[#f4faf7] to-white py-12 sm:py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0D5C3A]">
              Meet the pack
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">
              AI Pet Companions
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-600 sm:text-base">
              Tap a companion to chat — Rogue for Pet Parents, Taco for
              Ambassadors, Scout for Gurus, Delilah for Pet Events.
            </p>
          </div>

          <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 md:gap-8">
            {aiPetCompanions.map((companion) => (
              <div
                key={companion.name}
                className="flex flex-col items-center text-center"
              >
                <button
                  type="button"
                  onClick={() => {
                    trackHomepageClick(
                      `AI companion ${companion.name}`,
                      companionChatHref(companion.id),
                    );
                    if (companion.id === "rogue") {
                      openCompanionChat("rogue");
                      return;
                    }
                    window.location.assign(companionChatHref(companion.id));
                  }}
                  className="group relative h-28 w-28 overflow-hidden rounded-full bg-white shadow-[0_10px_28px_rgba(13,92,58,0.12)] ring-2 ring-[#0D5C3A]/15 transition hover:-translate-y-1 hover:ring-[#0D5C3A]/35 sm:h-32 sm:w-32"
                  aria-label={companion.ctaLabel}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={companion.avatarSrc}
                    alt={companion.name}
                    width={128}
                    height={128}
                    className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    style={{ objectPosition: companion.objectPosition }}
                  />
                </button>
                <h3 className="mt-5 text-xl font-black tracking-tight text-slate-950">
                  {companion.name}
                </h3>
                <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-[#0D5C3A]">
                  {companion.role}
                </p>
                <p className="mt-4 max-w-sm text-sm font-semibold leading-6 tracking-wide text-slate-600 sm:text-[15px] sm:leading-7">
                  &ldquo;{companion.statement}&rdquo;
                </p>
                <button
                  type="button"
                  onClick={() => {
                    trackHomepageClick(
                      `AI companion CTA ${companion.name}`,
                      companionChatHref(companion.id),
                    );
                    if (companion.id === "rogue") {
                      openCompanionChat("rogue");
                      return;
                    }
                    window.location.assign(companionChatHref(companion.id));
                  }}
                  className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#0D5C3A] px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-[#0a4a2e]"
                >
                  {companion.ctaLabel}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        aria-label="SitGuru premium payment integrations"
        className="relative overflow-hidden bg-gradient-to-b from-[#f8fcfd] via-emerald-50/40 to-white py-12 sm:py-16"
      >
        {/* Soft atmospheric wash behind the showcase card */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-sky-100/40 to-transparent"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <PaymentIntegrationsGrid
            heading="Premium payments"
            description="Book with confidence using SitGuru’s trusted payment stack — Stripe, PayPal, Apple Pay, Google Pay, Venmo, and Plaid — with Trust & Safety built into every booking."
            ariaLabel="Secure payment options for SitGuru bookings"
          />
        </div>
      </section>

      <PawReportSection onTrack={trackHomepageClick} />

      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-[32px] bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-700 p-7 text-white shadow-[0_24px_70px_rgba(6,78,59,0.24)] sm:p-10">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">
                Ready to find care?
              </p>
              <h2
                className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl"
                style={{
                  color: "#ffffff",
                  WebkitTextFillColor: "#ffffff",
                  textShadow: "0 2px 14px rgba(0,0,0,0.22)",
                }}
              >
                Find a local Pet Guru for your next booking.
              </h2>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-emerald-50 sm:text-base">
                Search local profiles and choose the right care for your pet.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/search"
                  onClick={() =>
                    trackHomepageClick("Final Find Care CTA", "/search")
                  }
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-400 px-6 py-3 text-sm font-black text-emerald-950 transition hover:bg-emerald-300"
                >
                  Find Care Near Me
                </Link>
                <Link
                  href={petParentSignupHref}
                  onClick={() =>
                    trackHomepageClick(
                      "Final Pet Parent Signup",
                      petParentSignupHref,
                    )
                  }
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/35 bg-white/10 px-6 py-3 text-sm font-black text-white transition hover:bg-white/15"
                >
                  Join SitGuru
                </Link>
                <Link
                  href={petParentLoginHref}
                  onClick={() =>
                    trackHomepageClick("Final Sign In", petParentLoginHref)
                  }
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 bg-transparent px-6 py-3 text-sm font-black text-white transition hover:bg-white/10"
                >
                  Sign in
                </Link>
              </div>
            </div>

            <div className="rounded-[32px] border border-emerald-100 bg-emerald-50 p-7 sm:p-8">
              <PawIcon size={36} contrast="light" solid />
              <h2 className="mt-3 text-2xl font-black text-slate-950">
                Want to earn caring for pets?
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                Set your services, local area, and availability as an
                independent Pet Guru.
              </p>
              <Link
                href={guruSignupHref}
                onClick={() =>
                  trackHomepageClick("Final Become a Guru", guruSignupHref)
                }
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-black text-white"
              >
                Become a Guru
              </Link>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-sm font-black text-slate-600">
            <Link
              href="/ambassadors"
              onClick={() =>
                trackHomepageClick("Explore Ambassador Program", "/ambassadors")
              }
              className="hover:text-emerald-700 hover:underline"
            >
              Ambassador Program
            </Link>
            <Link
              href="/petperks"
              onClick={() => trackHomepageClick("Explore PetPerks", "/petperks")}
              className="hover:text-emerald-700 hover:underline"
            >
              PetPerks
            </Link>
            <Link
              href="/partners"
              onClick={() =>
                trackHomepageClick("Partner with SitGuru", "/partners")
              }
              className="hover:text-emerald-700 hover:underline"
            >
              Partner with SitGuru
            </Link>
          </div>
        </div>
      </section>

      <CompactPartnerSection onTrack={trackHomepageClick} />
      <HomepageEventsSectionClient />
    </main>
  );
}