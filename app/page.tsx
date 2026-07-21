"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import AcademyGraduateBadge from "@/components/university/AcademyGraduateBadge";
import { trackEvent } from "@/lib/analytics/track";
import { supabase } from "@/lib/supabase";

const heroVideoPaths = [
  "/videos/sitguru-homepage-hero.mp4",
  "/videos/sitguru-homepage-hero-2.mp4",
] as const;
const heroVideoPosterPath = "/images/sitguru-homepage-hero-poster.jpg";
const heroVideoPlaybackRate = 0.8;
const heroVideoTransitionMs = 420;
const defaultGuruAvatarPath = "/images/sitguru-message-avatar.jpg";
const sitGuruVideoEmbedUrl =
  "https://www.youtube.com/embed/Jk5vWCWvvKs?si=12529oKyk7IFLtAj";

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

type HomepageAssistTopic =
  "pet-parent" | "guru" | "ambassador" | "partner" | "support" | "general";

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

function getMessengerInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return "V";

  const first = parts[0]?.[0] || "";
  const second = parts.length > 1 ? parts[1]?.[0] || "" : "";

  return `${first}${second}`.toUpperCase() || "V";
}

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
  userId?: string;
  name: string;
  role: string;
  location: string;
  rating: string;
  reviewCount: number;
  priceLabel: string;
  image: string;
  imagePosition?: string;
  badge: string;
  href: string;
  isAcademyCertified?: boolean;
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

type PartnerCard = {
  id: string;
  name: string;
  type: string;
  location: string;
  description: string;
  href: string;
  logo: string;
  logoAlt: string;
};

type PublicAcademyCertificationResponse = {
  academyType?: string;
  certifiedUserIds?: string[];
  error?: string;
};

const demoGuruCards: GuruCard[] = [
  {
    id: "demo-avery-johnson",
    name: "Avery Johnson",
    role: "Dog Walking Guru",
    location: "Philadelphia, PA",
    rating: "5.0",
    reviewCount: 42,
    priceLabel: "View care options",
    image: "/images/demo/avery-johnson.png",
    imagePosition: "center 38%",
    badge: "Trusted",
    href: "/search?service=Dog%20Walking&city=Philadelphia&state=PA",
    isAcademyCertified: false,
  },
  {
    id: "demo-brad-norway",
    name: "Brad Norway",
    role: "Boarding Guru",
    location: "Bethlehem, PA",
    rating: "4.9",
    reviewCount: 36,
    priceLabel: "View care options",
    image: "/images/demo/brad-norway.png",
    imagePosition: "center 40%",
    badge: "Trusted",
    href: "/search?service=Boarding&city=Bethlehem&state=PA",
    isAcademyCertified: false,
  },
  {
    id: "demo-caleb-brooks",
    name: "Caleb Brooks",
    role: "Drop-In Visit Guru",
    location: "Allentown, PA",
    rating: "4.8",
    reviewCount: 29,
    priceLabel: "View care options",
    image: "/images/demo/caleb-brooks.png",
    imagePosition: "center 42%",
    badge: "Trusted",
    href: "/search?service=Drop-In%20Visits&city=Allentown&state=PA",
    isAcademyCertified: false,
  },
  {
    id: "demo-darius-miller",
    name: "Darius Miller",
    role: "Doggy Day Care Guru",
    location: "Camden, NJ",
    rating: "5.0",
    reviewCount: 31,
    priceLabel: "View care options",
    image: "/images/demo/darius-miller.png",
    imagePosition: "center 38%",
    badge: "Trusted",
    href: "/search?service=Doggy%20Day%20Care&city=Camden&state=NJ",
    isAcademyCertified: false,
  },
  {
    id: "demo-emma-walsh",
    name: "Emma Walsh",
    role: "Pet Sitting Guru",
    location: "Quakertown, PA",
    rating: "4.9",
    reviewCount: 27,
    priceLabel: "View care options",
    image: "/images/demo/emma-walsh.png",
    imagePosition: "center 42%",
    badge: "Trusted",
    href: "/search?service=Pet%20Sitting&city=Quakertown&state=PA",
    isAcademyCertified: false,
  },
  {
    id: "demo-maya-reynolds",
    name: "Maya Reynolds",
    role: "Dog Walking Guru",
    location: "Philadelphia, PA",
    rating: "4.9",
    reviewCount: 38,
    priceLabel: "View care options",
    image: "/images/demo/maya-reynolds.png",
    imagePosition: "center 40%",
    badge: "Trusted",
    href: "/search?service=Dog%20Walking&city=Philadelphia&state=PA",
    isAcademyCertified: false,
  },
  {
    id: "demo-nina-patel",
    name: "Nina Patel",
    role: "Training Support Guru",
    location: "Allentown, PA",
    rating: "5.0",
    reviewCount: 33,
    priceLabel: "View care options",
    image: "/images/demo/nina-patel.png",
    imagePosition: "center 42%",
    badge: "Trusted",
    href: "/search?service=Training%20Support&city=Allentown&state=PA",
    isAcademyCertified: false,
  },
  {
    id: "demo-olivia-chen",
    name: "Olivia Chen",
    role: "Pet Sitting Guru",
    location: "Bethlehem, PA",
    rating: "4.8",
    reviewCount: 25,
    priceLabel: "View care options",
    image: "/images/demo/olivia-chen.png",
    imagePosition: "center 40%",
    badge: "Trusted",
    href: "/search?service=Pet%20Sitting&city=Bethlehem&state=PA",
    isAcademyCertified: false,
  },
  {
    id: "demo-sofia-martinez",
    name: "Sofia Martinez",
    role: "Boarding Guru",
    location: "Quakertown, PA",
    rating: "4.9",
    reviewCount: 34,
    priceLabel: "View care options",
    image: "/images/demo/sofia-martinez.png",
    imagePosition: "center 42%",
    badge: "Trusted",
    href: "/search?service=Boarding&city=Quakertown&state=PA",
    isAcademyCertified: false,
  },
  {
    id: "demo-suzy-q",
    name: "Suzy Q",
    role: "Drop-In Visit Guru",
    location: "Camden, NJ",
    rating: "New",
    reviewCount: 0,
    priceLabel: "View care options",
    image: "/images/demo/suzy-q.png",
    imagePosition: "center 40%",
    badge: "Trusted",
    href: "/search?service=Drop-In%20Visits&city=Camden&state=NJ",
    isAcademyCertified: false,
  },
];

const trustItems = [
  "Free local signup",
  "Trusted local Gurus",
  "Easy booking flow",
  "Community-first care",
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
    href: "/become-a-guru",
    icon: "🦮",
  },
  {
    title: "SitGuru Programs",
    description: "Additional ways to refer, support, and grow the community",
    href: "/ambassadors",
    icon: "🤝",
  },
];

const homepagePrograms: ProgramCard[] = [
  {
    title: "Student Hire Program",
    eyebrow: "Featured student pathway",
    description:
      "For students, recent grads, summer workers, and pet lovers who want a flexible way to build experience, help local pet families, and grow SitGuru after class, on weekends, during school breaks, or all summer.",
    href: "/ambassadors",
    applyHref: "/ambassadors",
    icon: "🎓",
    image: "/images/ambassadors/student-hire2.jpg",
    imageAlt: "Student pet caregiver taking a selfie with a dog",
    primaryCta: "Start Student Hire",
    secondaryCta: "Student Details",
    featured: true,
  },
  {
    title: "Community Hire Program",
    eyebrow: "Local neighborhood pathway",
    description:
      "For local pet lovers, parents, retirees, remote workers, and community members who want a flexible way to offer trusted care, refer neighbors, and help SitGuru grow locally.",
    href: "/ambassadors",
    applyHref: "/ambassadors",
    icon: "🤝",
    image: "/images/ambassadors/ambassador-program2.jpg",
    imageAlt: "Community pet-care supporters smiling while caring for a pet",
    primaryCta: "Start Community Hire",
    secondaryCta: "Community Details",
    featured: false,
  },
  {
    title: "Military Hire Program",
    eyebrow: "Military-connected pathway",
    description:
      "For veterans, eligible service members, National Guard, reservists, military spouses, qualified dependents over 18, and approved SkillBridge applicants who want flexible local opportunities.",
    href: "/ambassadors",
    applyHref: "/ambassadors",
    icon: "🎖️",
    image: "/images/ambassadors/veteran-ambassador2.jpg",
    imageAlt: "Veteran or military-connected pet caregiver relaxing with a dog",
    primaryCta: "Start Military Hire",
    secondaryCta: "Military Details",
    featured: false,
  },
];

const homepagePartners: PartnerCard[] = [
  {
    id: "doylestown-animal-medical-clinic",
    name: "Doylestown Animal Medical Clinic",
    type: "Animal Medical Clinic",
    location: "Doylestown, PA",
    description:
      "A local veterinary care connection helping SitGuru build stronger community relationships around safer, easier support for Pet Parents.",
    href: "https://doylestownanimalmedicalclinic.com/",
    logo: "/images/partners/doylestown-animal-medical-clinic.png",
    logoAlt: "Doylestown Animal Medical Clinic logo",
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

const petParentSignupHref = "/signup?role=pet_parent&next=/customer/dashboard";
const phoneLoginHref = "/login?mode=phone";
const emailLoginHref = "/login?mode=email";
const guruSignupHref = "/become-a-guru";
const bothSignupHref = "/signup?role=both&next=/customer/dashboard";

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

function shouldAutoOpenHomepageMessenger() {
  if (typeof window === "undefined") return false;

  return window.matchMedia("(min-width: 768px)").matches;
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
  if (normalized.includes("indeed")) return "indeed";
  if (normalized.includes("careerlink") || normalized.includes("pa-careerlink"))
    return "careerlink";
  if (normalized.includes("handshake")) return "handshake";
  if (normalized.includes("ambassador")) return "ambassador";
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
    guru.profile_photo_url ||
    guru.photo_url ||
    guru.avatar_url ||
    guru.image_url ||
    "";

  const photoUrl = String(possiblePhoto || "").trim();

  if (!photoUrl) return defaultGuruAvatarPath;

  const lowerPhotoUrl = photoUrl.toLowerCase();

  if (
    lowerPhotoUrl.includes("sitguru-logo") ||
    lowerPhotoUrl.includes("sitguru-admin-avatar")
  ) {
    return defaultGuruAvatarPath;
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

async function loadCertifiedHomepageGuruUserIds(guruUserIds: string[]) {
  const safeUserIds = Array.from(
    new Set(
      guruUserIds.map((userId) => String(userId || "").trim()).filter(Boolean),
    ),
  );

  if (!safeUserIds.length) return new Set<string>();

  try {
    const response = await fetch(
      `/api/public/academy-certifications?academyType=guru&userIds=${encodeURIComponent(
        safeUserIds.join(","),
      )}`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.warn(
        "Could not load Guru Academy certifications for homepage carousel.",
      );
      return new Set<string>();
    }

    const payload =
      (await response.json()) as PublicAcademyCertificationResponse;

    return new Set(
      (payload.certifiedUserIds || [])
        .map((userId) => String(userId || "").trim())
        .filter(Boolean),
    );
  } catch (error) {
    console.warn(
      "Could not load Guru Academy certifications for homepage carousel:",
      error,
    );
    return new Set<string>();
  }
}

function mapGurusToCards(
  gurus: Guru[],
  certifiedGuruUserIds: Set<string>,
): GuruCard[] {
  return gurus.map((guru) => {
    const photoUrl = getGuruPhotoUrl(guru);
    const rating = getGuruRating(guru);
    const reviews = Number(guru.review_count || 0);
    const userId = getGuruCertificationUserId(guru);
    const isAcademyCertified = userId
      ? certifiedGuruUserIds.has(userId)
      : false;

    return {
      id: `live-${String(guru.id)}`,
      userId,
      name: getGuruName(guru),
      role: getGuruRole(guru),
      location: formatLocation(guru.city, guru.state),
      rating: rating > 0 ? rating.toFixed(1) : "New",
      reviewCount: reviews,
      priceLabel: "View care options",
      image: photoUrl,
      imagePosition: "center 34%",
      badge: guru.is_verified ? "Verified" : "Trusted",
      href: getGuruHref(guru),
      isAcademyCertified,
    };
  });
}

function mergeLiveAndDemoGuruCards(
  liveCards: GuruCard[],
  demoCards: GuruCard[],
) {
  const seenKeys = new Set<string>();

  return [...liveCards, ...demoCards].filter((card) => {
    const normalizedName = card.name.trim().toLowerCase();
    const normalizedLocation = card.location.trim().toLowerCase();
    const key = `${normalizedName}|${normalizedLocation}`;

    if (seenKeys.has(key)) return false;

    seenKeys.add(key);
    return true;
  });
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

function HomepageAssistPopup({
  source,
  onTrack,
}: {
  source: string;
  onTrack: (label: string, destination: string) => void;
}) {
  const [isVisible] = useState(true);
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
  const messengerDismissedStorageKey = "sitguru-homepage-assist-dismissed";

  function clearStoredMessengerSession() {
    window.sessionStorage.removeItem(messengerSessionStorageKey);
    window.localStorage.removeItem(messengerSessionStorageKey);
  }

  function saveCurrentMessengerSession(nextSession: HomepageMessengerSession) {
    // Keep visitor chat continuity scoped to this browser tab/session. Avoid
    // localStorage so a different visitor on the same device never inherits
    // someone else's previous homepage conversation.
    window.sessionStorage.setItem(
      messengerSessionStorageKey,
      JSON.stringify(nextSession),
    );
    window.localStorage.removeItem(messengerSessionStorageKey);
  }

  useEffect(() => {
    // Migrate away from older localStorage-backed messenger sessions. The
    // visitor token still protects the API, but sessionStorage better matches
    // the expected per-visitor/session chat behavior.
    window.localStorage.removeItem(messengerSessionStorageKey);

    const savedSession = window.sessionStorage.getItem(
      messengerSessionStorageKey,
    );

    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession) as HomepageMessengerSession;

        if (parsed?.conversationId && parsed?.token) {
          setSession(parsed);

          if (parsed.visitorName) {
            setForm((previous) => ({
              ...previous,
              fullName: parsed.visitorName || previous.fullName,
            }));
          }

          if (shouldAutoOpenHomepageMessenger()) {
            setIsOpen(true);
          }

          return;
        }
      } catch {
        clearStoredMessengerSession();
      }
    }

    const dismissed = window.sessionStorage.getItem(
      messengerDismissedStorageKey,
    );

    if (dismissed === "true") return;

    if (!shouldAutoOpenHomepageMessenger()) return;

    const timer = window.setTimeout(() => {
      setIsOpen(true);
    }, 2200);

    return () => window.clearTimeout(timer);
  }, []);

  function applyMessengerMessages(
    nextMessages: HomepageMessengerMessage[],
    options: { openOnAdminReply?: boolean } = {},
  ) {
    const latestAdminMessage = [...nextMessages]
      .reverse()
      .find((message) => message.senderRole === "admin");
    const latestAdminMessageId = latestAdminMessage?.id || "";

    if (
      options.openOnAdminReply &&
      latestAdminMessageId &&
      latestAdminMessageId !== latestAdminMessageIdRef.current
    ) {
      setHasNewAdminReply(true);

      if (shouldAutoOpenHomepageMessenger()) {
        setIsOpen(true);
        setFormSuccess(
          "SitGuru Admin replied. You can continue the conversation here.",
        );
      }
    }

    if (latestAdminMessageId) {
      latestAdminMessageIdRef.current = latestAdminMessageId;
    }

    setMessages(nextMessages);
  }

  async function loadMessengerMessages(
    options: { openOnAdminReply?: boolean } = {},
  ) {
    if (!session?.conversationId || !session.token) return;

    try {
      const params = new URLSearchParams({
        conversationId: session.conversationId,
        token: session.token,
      });

      const response = await fetch(
        `/api/homepage-messenger?${params.toString()}`,
        {
          cache: "no-store",
        },
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
        setFormSuccess("This SitGuru chat has been closed.");
        setIsOpen(false);
        return;
      }

      applyMessengerMessages(payload?.messages || [], options);
    } catch (error) {
      console.warn("Unable to refresh homepage messenger messages:", error);
    }
  }

  useEffect(() => {
    if (!session?.conversationId || !session.token) return;

    let isMounted = true;

    async function loadMessages() {
      if (!isMounted) return;
      await loadMessengerMessages({ openOnAdminReply: true });
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
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));

    if (formError) setFormError("");
    if (formSuccess) setFormSuccess("");
  }

  function closePopup() {
    window.sessionStorage.setItem(messengerDismissedStorageKey, "true");
    setIsOpen(false);
  }

  async function closeConversation() {
    const activeSession = session;

    try {
      if (activeSession?.conversationId && activeSession.token) {
        await fetch("/api/homepage-messenger", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "close",
            conversationId: activeSession.conversationId,
            token: activeSession.token,
          }),
        });
      }
    } catch (error) {
      console.warn("Unable to close homepage messenger conversation:", error);
    } finally {
      clearStoredMessengerSession();
      window.sessionStorage.setItem(messengerDismissedStorageKey, "true");
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
      await loadMessengerMessages({ openOnAdminReply: false });
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
      setFormError(
        "Please enter your name so SitGuru Admin knows who we are helping.",
      );
      return;
    }

    if (!cleanMessage) {
      setFormError("Please type a quick message so SitGuru can help.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");
    setFormSuccess("");

    try {
      const response = await fetch("/api/homepage-messenger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
        throw new Error(
          payload?.error || "Unable to send your message right now.",
        );
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
        window.sessionStorage.removeItem(messengerDismissedStorageKey);
      }

      applyMessengerMessages(payload?.messages || [], {
        openOnAdminReply: false,
      });

      trackEvent({
        eventName: "homepage_assist_popup_submitted",
        eventType: "lead",
        source,
        role: form.topic,
        metadata: {
          topic: form.topic,
          has_email: Boolean(form.email.trim()),
          has_phone: Boolean(form.phone.trim()),
          messenger: "sitguru_homepage_messenger",
          version: "homepage_assist_popup_sitguru_messenger",
        },
      });

      setFormSuccess(
        "Thanks — SitGuru Admin was notified. Replies will stay here until this chat is closed.",
      );
      setForm((previous) => ({
        ...initialHomepageAssistForm,
        fullName: previous.fullName,
        email: previous.email,
        phone: previous.phone,
        topic: previous.topic,
      }));
      setIsOpen(true);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to send your message right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleQuickLink(label: string, destination: string) {
    onTrack(label, destination);
    closePopup();
  }

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-[calc(16px+env(safe-area-inset-bottom))] left-4 right-auto z-[80] w-auto max-w-[calc(100vw-32px)] sm:bottom-5 sm:left-auto sm:right-5 sm:w-[420px]">
      {isOpen ? (
        <section className="fixed bottom-[calc(12px+env(safe-area-inset-bottom))] left-3 right-3 flex max-h-[70dvh] flex-col overflow-hidden rounded-[18px] border border-emerald-200 bg-white shadow-[0_22px_65px_rgba(15,23,42,0.22)] sm:static sm:max-h-[calc(100dvh-2rem)] sm:rounded-[28px]">
          <div className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500 px-4 py-[18px] text-white sm:px-5 sm:py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-50">
                  <span aria-hidden="true" className="text-sm">
                    🐾
                  </span>
                  SitGuru Help
                </div>
                <h2 className="mt-1.5 text-2xl font-extrabold leading-tight tracking-[-0.02em] text-white sm:text-3xl">
                  Hi, we’re here to help 🐾
                </h2>
                <p className="mt-2 text-sm font-medium leading-5 text-white/90 sm:text-base sm:leading-6">
                  Have a question about booking care, becoming a Guru, or
                  referrals? Send us a quick message.
                </p>
              </div>

              <button
                type="button"
                onClick={closePopup}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-base font-black text-white transition hover:bg-white/25 sm:h-9 sm:w-9 sm:text-lg"
                aria-label="Close SitGuru chat window"
              >
                <span aria-hidden="true">×</span>
                <span className="sr-only">Close</span>
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3 sm:max-h-[72vh] sm:p-4">
            <div className="grid gap-2 sm:grid-cols-3">
              <Link
                href={petParentSignupHref}
                onClick={() =>
                  handleQuickLink(
                    "Homepage Assist Pet Parent Signup",
                    petParentSignupHref,
                  )
                }
                className="rounded-2xl border border-emerald-100 bg-emerald-50 px-2 py-2.5 text-center text-[11px] font-black text-emerald-800 transition hover:bg-emerald-100 sm:px-3 sm:py-3 sm:text-xs"
              >
                Pet Parent
              </Link>
              <Link
                href={guruSignupHref}
                onClick={() =>
                  handleQuickLink("Homepage Assist Guru Signup", guruSignupHref)
                }
                className="rounded-2xl border border-slate-200 bg-white px-2 py-2.5 text-center text-[11px] font-black text-slate-800 transition hover:border-emerald-200 hover:bg-emerald-50 sm:px-3 sm:py-3 sm:text-xs"
              >
                Guru
              </Link>
              <Link
                href="/ambassadors"
                onClick={() =>
                  handleQuickLink(
                    "Homepage Assist Ambassador Signup",
                    "/ambassadors",
                  )
                }
                className="rounded-2xl border border-slate-200 bg-white px-2 py-2.5 text-center text-[11px] font-black text-slate-800 transition hover:border-emerald-200 hover:bg-emerald-50 sm:px-3 sm:py-3 sm:text-xs"
              >
                Ambassador
              </Link>
            </div>

            {messages.length > 0 ? (
              <div className="mt-3 max-h-[30svh] space-y-2 overflow-y-auto rounded-2xl border border-emerald-100 bg-emerald-50/50 p-2.5 sm:mt-4 sm:max-h-56 sm:p-3">
                {messages.map((message) => {
                  const fromAdmin = message.senderRole === "admin";
                  const visitorName =
                    message.senderName?.trim() ||
                    form.fullName.trim() ||
                    "Website Visitor";
                  const displayName = fromAdmin
                    ? message.senderName?.trim() || "SitGuru Admin"
                    : visitorName;

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
                          className="h-8 w-8 shrink-0 rounded-full border border-emerald-100 bg-white object-cover shadow-sm"
                          loading="lazy"
                        />
                      ) : null}

                      <div
                        className={`max-w-[82%] rounded-2xl px-3 py-2 text-xs font-semibold leading-5 shadow-sm ${
                          fromAdmin
                            ? "border border-emerald-100 bg-white text-slate-800"
                            : "bg-emerald-700 text-white"
                        }`}
                      >
                        <p className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] opacity-75">
                          {displayName}
                        </p>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>

                      {!fromAdmin ? (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-[11px] font-black text-emerald-800 shadow-sm">
                          {getMessengerInitials(displayName)}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}

            {session ? (
              <div className="mt-3 rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700 sm:text-[11px]">
                Realtime SitGuru Help connected
              </div>
            ) : null}

            <form
              onSubmit={handleSubmit}
              className="mt-3 grid gap-2.5 sm:mt-4 sm:gap-3"
            >
              <label className="grid gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  What can we help with?
                </span>
                <select
                  value={form.topic}
                  onChange={(event) =>
                    updateAssistField(
                      "topic",
                      event.target.value as HomepageAssistTopic,
                    )
                  }
                  className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 sm:h-11"
                >
                  {Object.entries(homepageAssistTopicLabels).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <textarea
                value={form.message}
                onChange={(event) =>
                  updateAssistField("message", event.target.value)
                }
                rows={2}
                placeholder="How can we help?"
                className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold leading-5 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 sm:py-3"
              />

              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={form.fullName}
                  onChange={(event) =>
                    updateAssistField("fullName", event.target.value)
                  }
                  placeholder="Your name"
                  required
                  className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 sm:h-11"
                />
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    updateAssistField("email", event.target.value)
                  }
                  placeholder="Email so we can reply"
                  className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 sm:h-11"
                />
              </div>

              <input
                type="tel"
                value={form.phone}
                onChange={(event) =>
                  updateAssistField("phone", event.target.value)
                }
                placeholder="Phone optional"
                className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 sm:h-11"
              />

              {formError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                  {formError}
                </div>
              ) : null}

              {formSuccess ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
                  <p>{formSuccess}</p>
                  <button
                    type="button"
                    onClick={refreshMessages}
                    disabled={isRefreshingMessages}
                    className="mt-2 inline-flex min-h-9 w-full items-center justify-center rounded-xl bg-emerald-700 px-3 py-2 text-xs font-black text-white transition hover:bg-emerald-800 disabled:opacity-60"
                  >
                    {isRefreshingMessages ? "Refreshing..." : "Refresh replies"}
                  </button>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-emerald-700 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-11 sm:py-3"
              >
                {isSubmitting ? "Sending..." : "Send message"}
              </button>

              <div className="grid gap-2">
                <p className="text-[11px] font-semibold leading-4 text-slate-500">
                  We’ll reply as soon as possible. You can close this chat
                  anytime.
                </p>

                {session?.conversationId ? (
                  <button
                    type="button"
                    onClick={closeConversation}
                    className="inline-flex min-h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                  >
                    Close conversation
                  </button>
                ) : null}
              </div>
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
          className={`flex min-h-11 w-auto max-w-[230px] items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-black text-white shadow-[0_12px_30px_rgba(15,23,42,0.22)] transition sm:min-h-10 sm:max-w-none sm:px-4 sm:py-2.5 sm:text-xs sm:shadow-[0_12px_30px_rgba(15,23,42,0.20)] ${
            hasNewAdminReply
              ? "bg-amber-500 hover:bg-amber-600"
              : "bg-emerald-700 hover:bg-emerald-800"
          }`}
        >
          <span className="sm:hidden">
            {hasNewAdminReply ? "🐾 Reply" : "🐾 Chat"}
          </span>
          <span className="hidden sm:inline">
            {hasNewAdminReply ? "🐾 SitGuru Admin replied" : "🐾 Need help?"}
          </span>
        </button>
      )}
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
    <aside className="w-full max-w-[360px] rounded-[28px] border border-slate-200 bg-white/96 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.14)] backdrop-blur sm:p-6 xl:max-w-[370px]">
      <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-800">
        SitGuru One Access
      </div>

      <h2 className="mt-3 text-[2.05rem] font-black leading-[0.96] tracking-[-0.05em] text-slate-950 xl:text-[2.45rem]">
        Log in or join.
      </h2>

      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        One account. All your dashboards.
      </p>

      <div className="mt-5 grid gap-3">
        <Link
          href={phoneLoginHref}
          onClick={() => onTrack("Continue with phone", phoneLoginHref)}
          className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-200"
        >
          <span aria-hidden="true">☎</span>
          Continue with phone
        </Link>

        <button
          type="button"
          onClick={onGoogleSignup}
          className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/50 focus:outline-none focus:ring-4 focus:ring-emerald-100"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <Link
          href={emailLoginHref}
          onClick={() => onTrack("Use email instead", emailLoginHref)}
          className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/50 focus:outline-none focus:ring-4 focus:ring-emerald-100"
        >
          <span aria-hidden="true">✉</span>
          Use email instead
        </Link>
      </div>

      <div className="my-5 flex items-center gap-4">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-bold text-slate-400">one access</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4">
        <p className="text-sm font-black text-emerald-950">
          Multiple roles? No problem.
        </p>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
          Switch between dashboards from one account.
        </p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Link
          href={petParentSignupHref}
          onClick={() =>
            onTrack("Become a Pet Parent Hero Card", petParentSignupHref)
          }
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-xs font-black text-emerald-800 shadow-sm transition hover:bg-emerald-100 focus:outline-none focus:ring-4 focus:ring-emerald-100"
        >
          Become a Pet Parent
        </Link>

        <Link
          href={guruSignupHref}
          onClick={() => onTrack("Become a Guru Hero Card", guruSignupHref)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-xs font-black text-slate-800 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/60 focus:outline-none focus:ring-4 focus:ring-emerald-100"
        >
          Become a Guru
        </Link>

        <Link
          href="/ambassadors"
          onClick={() =>
            onTrack("Become an Ambassador Hero Card", "/ambassadors")
          }
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-xs font-black text-slate-800 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/60 focus:outline-none focus:ring-4 focus:ring-emerald-100"
        >
          Become an Ambassador
        </Link>
      </div>
    </aside>
  );
}

function HeroVisual() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const transitionTimeoutRef = useRef<number | null>(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const [isVideoTransitioning, setIsVideoTransitioning] = useState(false);

  const activeVideoPath = heroVideoPaths[activeVideoIndex];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = heroVideoPlaybackRate;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      video.pause();
      video.currentTime = 0;
      setIsVideoPaused(true);
      return;
    }

    void video.play().catch(() => {
      setIsVideoPaused(true);
    });
  }, [activeVideoIndex]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean };
      }
    ).connection;

    if (
      connection?.saveData ||
      !window.matchMedia("(min-width: 768px)").matches
    ) {
      return;
    }

    const nextVideoIndex = (activeVideoIndex + 1) % heroVideoPaths.length;
    const nextVideo = document.createElement("video");
    nextVideo.preload = "auto";
    nextVideo.muted = true;
    nextVideo.src = heroVideoPaths[nextVideoIndex];
    nextVideo.load();

    return () => {
      nextVideo.removeAttribute("src");
      nextVideo.load();
    };
  }, [activeVideoIndex]);

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

    video.playbackRate = heroVideoPlaybackRate;

    void video
      .play()
      .then(() => {
        setIsVideoPaused(false);
        setIsVideoTransitioning(false);
      })
      .catch(() => {
        setIsVideoPaused(true);
        setIsVideoTransitioning(false);
      });
  }

  function rotateToNextVideo() {
    if (transitionTimeoutRef.current !== null) {
      window.clearTimeout(transitionTimeoutRef.current);
    }

    setIsVideoTransitioning(true);

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
    <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[650px] overflow-hidden bg-slate-950 sm:h-[690px] lg:inset-0 lg:h-auto">
      <video
        key={activeVideoPath}
        ref={videoRef}
        className={`absolute inset-0 h-full w-full object-cover object-[60%_center] transition-opacity duration-500 sm:object-[58%_center] lg:object-center ${
          isVideoTransitioning ? "opacity-0" : "opacity-100"
        }`}
        poster={heroVideoPosterPath}
        autoPlay
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
        onCanPlay={(event) => {
          event.currentTarget.playbackRate = heroVideoPlaybackRate;
          playActiveVideo();
        }}
        onEnded={rotateToNextVideo}
        onPlay={() => setIsVideoPaused(false)}
        onPause={() => setIsVideoPaused(true)}
      >
        <source src={activeVideoPath} type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-black/5 lg:bg-black/10" />
      <div className="absolute inset-y-0 left-0 w-[92%] bg-gradient-to-r from-black/68 via-black/30 to-transparent sm:w-[80%] sm:from-black/70 sm:via-black/36 lg:w-[61%] lg:from-black/82 lg:via-black/58" />
      <div className="absolute inset-y-0 right-0 w-[24%] bg-gradient-to-l from-black/8 via-black/0 to-transparent lg:w-[34%] lg:from-black/16" />
      <div className="absolute inset-x-0 top-0 h-[14%] bg-gradient-to-b from-black/14 to-transparent lg:h-[16%] lg:from-black/22" />
      <div className="absolute inset-x-0 bottom-0 h-[28%] bg-gradient-to-t from-black/28 via-black/6 to-transparent lg:h-[38%] lg:from-black/44 lg:via-black/10" />

      <button
        type="button"
        onClick={toggleHeroVideo}
        className="pointer-events-auto absolute bottom-4 right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/45 text-sm font-black text-white shadow-lg backdrop-blur transition hover:bg-black/70 focus:outline-none focus:ring-4 focus:ring-white/25 sm:bottom-5 sm:right-5 lg:left-5 lg:right-auto"
        aria-label={isVideoPaused ? "Play homepage videos" : "Pause homepage videos"}
        title={isVideoPaused ? "Play homepage videos" : "Pause homepage videos"}
      >
        <span aria-hidden="true">{isVideoPaused ? "▶" : "Ⅱ"}</span>
      </button>
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
      className="group min-w-[270px] max-w-[270px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_14px_35px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(15,23,42,0.12)] sm:min-w-[310px] sm:max-w-[310px] lg:min-w-[330px] lg:max-w-[330px]"
    >
      <div className="relative h-52 overflow-hidden bg-slate-100 sm:h-64 lg:h-72">
        <img
          src={guru.image}
          alt={`${guru.name}, ${guru.role}`}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          style={{ objectPosition: guru.imagePosition || "center 40%" }}
          loading="lazy"
        />

        {guru.isAcademyCertified ? (
          <div className="pointer-events-none absolute left-3 top-3 z-30 sm:left-4 sm:top-4">
            <AcademyGraduateBadge
              academyType="guru"
              variant="photo-overlay"
              className="h-[66px] w-[66px] sm:h-[78px] sm:w-[78px] lg:h-[84px] lg:w-[84px]"
            />
          </div>
        ) : null}

        <span className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-emerald-700 shadow-sm">
          ♡
        </span>
      </div>

      <div className="p-3 sm:p-4">
        <div className="flex items-start gap-2">
          <h3 className="min-w-0 flex-1 text-sm font-black text-slate-950 sm:text-base">
            {guru.name}
          </h3>

          {guru.isAcademyCertified ? (
            <AcademyGraduateBadge academyType="guru" variant="mini" />
          ) : null}
        </div>

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

function PartnerNetworkSection({
  onTrack,
}: {
  onTrack: (label: string, destination: string) => void;
}) {
  const featuredPartner = homepagePartners[0];

  if (!featuredPartner) return null;

  return (
    <section className="bg-gradient-to-br from-white via-emerald-50/30 to-white py-5 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[30px] border border-emerald-100 bg-white/95 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.07)] sm:p-6 lg:p-7">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700 sm:text-xs">
                SitGuru Partner Network
              </p>

              <h2 className="mt-2 text-2xl font-black leading-tight tracking-[-0.04em] text-slate-950 sm:text-3xl">
                Growing with local pet care partners
              </h2>

              <p className="mt-3 text-sm font-semibold leading-6 text-slate-700 sm:text-base sm:leading-7">
                SitGuru is building a trusted local pet care network with animal
                clinics, pet businesses, community organizations, and
                pet-friendly partners who care about safer, easier support for
                Pet Parents.
              </p>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
                <Link
                  href="/contact"
                  onClick={() => onTrack("Become a Partner", "/contact")}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800"
                >
                  Become a Partner
                </Link>
              </div>
            </div>

            <a
              href={featuredPartner.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                onTrack(
                  `Partner Logo ${featuredPartner.name}`,
                  featuredPartner.href,
                )
              }
              className="group relative block overflow-hidden rounded-[28px] border border-amber-200 bg-gradient-to-br from-white via-amber-50/40 to-emerald-50/60 p-5 shadow-[0_16px_42px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-[0_20px_50px_rgba(15,23,42,0.12)] sm:p-6"
            >
              <div className="absolute right-4 top-4 z-10 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-100 px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-amber-900 shadow-sm">
                <span aria-hidden="true">★</span>
                Featured SitGuru Partner
              </div>

              <div className="flex min-h-[160px] items-center justify-center rounded-3xl border border-amber-100 bg-white p-5 pt-14 sm:min-h-[190px] sm:pt-12">
                <img
                  src={featuredPartner.logo}
                  alt={featuredPartner.logoAlt}
                  className="max-h-28 w-full object-contain sm:max-h-32"
                  loading="lazy"
                />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <h3 className="text-xl font-black tracking-[-0.03em] text-slate-950 group-hover:text-emerald-800">
                    {featuredPartner.name}
                  </h3>
                  <p className="mt-1 text-sm font-black text-emerald-700">
                    {featuredPartner.type}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {featuredPartner.location}
                  </p>
                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                    {featuredPartner.description}
                  </p>
                </div>

                <span className="inline-flex rounded-full bg-emerald-700 px-4 py-2 text-xs font-black text-white shadow-sm transition group-hover:bg-emerald-800">
                  Visit Partner Website →
                </span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeVideoSection({
  onTrack,
}: {
  onTrack: (label: string, destination: string) => void;
}) {
  return (
    <section className="bg-white py-6 sm:py-10 lg:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid min-w-0 gap-5 overflow-hidden rounded-[26px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-4 shadow-[0_16px_42px_rgba(15,23,42,0.08)] sm:gap-7 sm:rounded-[32px] sm:p-7 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center lg:p-8">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700 sm:text-xs">
              Quick overview
            </p>
            <h2 className="mt-2 text-[1.65rem] font-black leading-[1.05] tracking-[-0.045em] text-slate-950 sm:mt-3 sm:text-3xl lg:text-4xl">
              See how SitGuru works.
            </h2>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-700 sm:text-base sm:leading-7">
              Watch a short overview of how SitGuru helps Pet Parents find
              trusted local care and helps Pet Gurus grow their bookings in one
              simple pet care marketplace.
            </p>

            <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap">
              <Link
                href="/search"
                onClick={() => onTrack("Find Care Video Section", "/search")}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-emerald-700 px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-200 sm:w-auto"
              >
                Find Pet Care
              </Link>

              <Link
                href={guruSignupHref}
                onClick={() =>
                  onTrack("Become a Guru Video Section", guruSignupHref)
                }
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-emerald-200 bg-white px-6 py-3 text-sm font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50 focus:outline-none focus:ring-4 focus:ring-emerald-100 sm:w-auto"
              >
                Become a Guru
              </Link>
            </div>
          </div>

          <div className="relative min-w-0 overflow-hidden rounded-[22px] border border-slate-200 bg-slate-950 shadow-[0_16px_38px_rgba(15,23,42,0.14)] sm:rounded-[26px] lg:shadow-[0_18px_45px_rgba(15,23,42,0.14)]">
            <div className="relative aspect-video w-full">
              <iframe
                src={sitGuruVideoEmbedUrl}
                title="SitGuru Trusted Local Pet Care"
                className="absolute left-0 top-0 h-full w-full border-0"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SitGuruPawReportSection({
  onTrack,
}: {
  onTrack: (label: string, destination: string) => void;
}) {
  return (
    <section className="bg-gradient-to-br from-sky-50 via-white to-emerald-50 py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[34px] border border-emerald-100 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.08)]">
          <div className="grid gap-0 lg:grid-cols-[1.02fr_0.98fr] lg:items-stretch">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-800 sm:text-xs">
                Exclusive SitGuru Feature
              </div>

              <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-0.045em] text-slate-950 sm:text-4xl lg:text-5xl">
                Follow care in real time with PawReport Live.
              </h2>

              <p className="mt-3 text-lg font-black leading-7 text-emerald-700 sm:text-xl">
                Live walks, visit updates, photos, and final care summaries in
                one trusted report.
              </p>

              <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-slate-700 sm:text-base sm:leading-7">
                SitGuru PawReport™ gives Pet Parents a clearer view of what
                happened during care. Gurus can start a PawReport, track walks,
                add potty, food, water, photo, medication, play, and care notes,
                then complete the visit with a final summary saved to the
                booking.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  {
                    icon: "🚶",
                    title: "Live Walk Tracking",
                    body: "When location is allowed, Gurus can track walk time, distance, and route points while the walk is active.",
                  },
                  {
                    icon: "📍",
                    title: "Real-Time Care Status",
                    body: "Pet Parents can see when the PawReport starts, when a walk is in progress, and when care is completed.",
                  },
                  {
                    icon: "📸",
                    title: "Photos & Visit Notes",
                    body: "Gurus can add photos, captions, care notes, medication notes, mood, walk, and play updates.",
                  },
                  {
                    icon: "🐾",
                    title: "Potty, Food & Water",
                    body: "Pee, poop, food, and water updates are organized into one easy-to-read PawReport timeline.",
                  },
                ].map((feature) => (
                  <div
                    key={feature.title}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
                  >
                    <div className="text-2xl">{feature.icon}</div>
                    <h3 className="mt-2 font-black text-slate-950">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-sm font-semibold leading-5 text-slate-600">
                      {feature.body}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-7 rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
                  Built for trust
                </p>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-800">
                  Pet Parents get peace of mind. Gurus get a simple workflow.
                  SitGuru keeps the booking record organized with real care
                  actions, live walk recap, and a completed PawReport history.
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/search"
                  onClick={() =>
                    onTrack("Find Guru PawReport Live Section", "/search")
                  }
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-700 px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800"
                >
                  Find a Guru
                </Link>

                <Link
                  href={petParentSignupHref}
                  onClick={() =>
                    onTrack(
                      "Create Pet Parent PawReport Live Section",
                      petParentSignupHref,
                    )
                  }
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-emerald-200 bg-white px-6 py-3 text-sm font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50"
                >
                  Create Pet Parent Account
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-950 via-emerald-950 to-emerald-800 p-6 sm:p-8 lg:p-10">
              <div className="mx-auto max-w-md overflow-hidden rounded-[30px] border border-white/15 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
                <div className="border-b border-slate-100 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-sky-700">
                    SitGuru PawReport Live™
                  </p>
                  <h3 className="mt-2 text-2xl font-black tracking-[-0.035em] text-slate-950">
                    Scout&apos;s Live Care
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    Walk tracking and care updates from your Guru
                  </p>
                </div>

                <div className="space-y-3 p-5">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-800">
                          Walk in progress
                        </p>
                        <p className="mt-1 text-xl font-black text-slate-950">
                          0.8 mi • 18 min
                        </p>
                      </div>
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                        🚶
                      </span>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-2xl border border-emerald-100 bg-white p-3">
                      <div className="relative h-28 rounded-xl bg-[radial-gradient(circle_at_18%_72%,#10b981_0_3px,transparent_4px),radial-gradient(circle_at_42%_48%,#38bdf8_0_3px,transparent_4px),radial-gradient(circle_at_70%_30%,#10b981_0_3px,transparent_4px),linear-gradient(135deg,#ecfdf5,#f8fafc)]">
                        <div className="absolute left-[19%] top-[68%] h-[2px] w-[29%] -rotate-[25deg] rounded-full bg-emerald-400" />
                        <div className="absolute left-[43%] top-[49%] h-[2px] w-[32%] -rotate-[18deg] rounded-full bg-sky-400" />
                        <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black text-slate-700 shadow-sm">
                          Route preview
                        </div>
                      </div>
                    </div>
                  </div>

                  {[
                    ["▶️", "PawReport Started", "Care began at 12:02 PM"],
                    ["💧", "Potty Update", "Pee completed during the walk."],
                    [
                      "🥣",
                      "Water Refreshed",
                      "Fresh water provided after walk.",
                    ],
                    [
                      "📸",
                      "Photo Added",
                      "Scout enjoyed his neighborhood walk.",
                    ],
                    ["📝", "Final Summary", "Happy, playful, and relaxed."],
                  ].map(([icon, title, body]) => (
                    <div
                      key={title}
                      className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                        {icon}
                      </span>
                      <div>
                        <p className="font-black text-slate-950">{title}</p>
                        <p className="text-xs font-semibold text-slate-500">
                          {body}
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                    <p className="text-2xl">✅</p>
                    <p className="mt-1 font-black text-emerald-950">
                      PawReport Complete
                    </p>
                    <p className="mt-1 text-xs font-semibold text-emerald-800">
                      Live walk and care summary saved to booking history.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [searchForm, setSearchForm] = useState<SearchFormState>(
    initialSearchFormState,
  );
  const [zipLookupStatus, setZipLookupStatus] =
    useState<ZipLookupStatus>("idle");
  const [zipLookupMessage, setZipLookupMessage] = useState("");
  const [guruCards, setGuruCards] = useState<GuruCard[]>(demoGuruCards);
  const [source, setSource] = useState("direct");

  const searchHref = useMemo(() => buildSearchHref(searchForm), [searchForm]);
  const visibleGuruCards = useMemo(() => guruCards.slice(0, 10), [guruCards]);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    const detectedSource = detectSourceFromUrl();
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
        version: "easy_signup_trusted_local_launch",
      },
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadHomepageGurus() {
      const { data, error } = await supabase
        .from("gurus")
        .select("*")
        .eq("is_active", true)
        .eq("is_public", true)
        .order("updated_at", { ascending: false, nullsFirst: false })
        .limit(24);

      if (!isMounted) return;

      if (error) {
        console.warn(
          "Could not load live Gurus for homepage carousel:",
          error.message,
        );

        setGuruCards(demoGuruCards);

        trackEvent({
          eventName: "homepage_gurus_load_failed",
          eventType: "system",
          source: detectSourceFromUrl(),
          metadata: {
            error: error.message,
            fallback_demo_guru_count: demoGuruCards.length,
            version: "easy_signup_trusted_local_live_gurus",
          },
        });

        return;
      }

      const liveGuruRows = ((data || []) as Guru[]).filter(
        (guru) => guru.is_active !== false && guru.is_public !== false,
      );

      const liveGuruUserIds = Array.from(
        new Set(
          liveGuruRows
            .map((guru) => getGuruCertificationUserId(guru))
            .filter(Boolean),
        ),
      );

      const certifiedGuruUserIds =
        await loadCertifiedHomepageGuruUserIds(liveGuruUserIds);

      if (!isMounted) return;

      const liveGuruCards = mapGurusToCards(liveGuruRows, certifiedGuruUserIds);
      const mergedGuruCards = mergeLiveAndDemoGuruCards(
        liveGuruCards,
        demoGuruCards,
      );

      setGuruCards(mergedGuruCards);

      trackEvent({
        eventName: "homepage_gurus_loaded",
        eventType: "system",
        source: detectSourceFromUrl(),
        metadata: {
          live_guru_count: liveGuruCards.length,
          live_certified_guru_count: liveGuruCards.filter(
            (guru) => guru.isAcademyCertified,
          ).length,
          demo_guru_count: demoGuruCards.length,
          total_carousel_guru_count: mergedGuruCards.length,
          using_live_gurus: liveGuruCards.length > 0,
          version: "easy_signup_trusted_local_live_gurus",
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setZipLookupStatus("idle");
      setZipLookupMessage("");
      return;
    }

    if (normalizedZip.length < 5) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
        version: "easy_signup_trusted_local_launch",
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
        version: "easy_signup_trusted_local_launch",
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
      callbackUrl.searchParams.set("next", "/login/route");
      callbackUrl.searchParams.set("source", "homepage_login");
    }

    trackEvent({
      eventName: "homepage_social_login_clicked",
      eventType: "auth",
      source,
      role: "sitguru_one",
      metadata: {
        provider: "google",
        location: "homepage_login_card",
        selected_next_path: "/login/route",
        version: "easy_signup_trusted_local_launch",
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
    <main className="min-h-screen bg-white text-slate-950">
      <section className="relative overflow-hidden border-b border-slate-200 bg-white lg:border-slate-800 lg:bg-slate-950">
        <HeroVisual />

        <div className="relative z-10 mx-auto grid max-w-7xl gap-6 px-4 pb-8 pt-7 sm:px-6 sm:pb-10 sm:pt-9 lg:min-h-[690px] lg:py-12 lg:grid-cols-[minmax(0,690px)_minmax(240px,1fr)_350px] lg:items-center lg:gap-7 lg:px-8 lg:py-12 xl:grid-cols-[minmax(0,720px)_minmax(270px,1fr)_370px] xl:gap-8">
          <div className="lg:py-8">
            <div className="grid gap-4 lg:block">
              <div className="min-h-[500px] sm:min-h-[535px] lg:min-h-0">
                <div className="inline-flex items-center rounded-full border border-white/30 bg-white/95 px-3 py-1 text-[10px] font-black text-emerald-800 shadow-sm backdrop-blur sm:text-xs">
                  Local Trusted Marketplace
                </div>

                <div className="mt-4 max-w-[92%] sm:max-w-[590px] lg:max-w-[640px] xl:max-w-[680px]">
                  <h1
                    className="text-[2.1rem] font-black leading-[0.98] tracking-[-0.055em] sm:text-[4rem] lg:text-[4.25rem] xl:text-[4.75rem]"
                    style={{
                      color: "#ffffff",
                      WebkitTextFillColor: "#ffffff",
                      textShadow:
                        "0 3px 22px rgba(0,0,0,0.72), 0 1px 3px rgba(0,0,0,0.9)",
                    }}
                  >
                    Trusted pet care.
                    <br />
                    Made{" "}
                    <span
                      style={{
                        color: "#10b981",
                        WebkitTextFillColor: "#10b981",
                        textShadow:
                          "0 3px 22px rgba(0,0,0,0.62), 0 1px 3px rgba(0,0,0,0.85)",
                      }}
                    >
                      simple.
                    </span>
                  </h1>

                  <div className="mt-3 max-w-xl lg:max-w-[610px]">
                    <p className="text-sm font-bold uppercase tracking-[0.14em] text-emerald-300 drop-shadow-sm sm:text-[0.8rem]">
                      Trusted local pet care marketplace
                    </p>

                    <p className="mt-2 text-sm font-semibold leading-6 text-white/95 drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)] sm:text-lg sm:leading-8 lg:text-[1.05rem] xl:text-lg">
                      SitGuru connects Pet Parents with trusted independent
                      local Gurus for walks, sitting, boarding, training, and
                      more.
                    </p>

                    <p className="mt-3 text-sm font-semibold leading-6 text-white/95 drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)] sm:text-lg sm:leading-8 lg:text-[1.05rem] xl:text-lg">
                      Create an account in minutes, explore trusted profiles,
                      keep booking details organized, and book local care with
                      confidence.
                    </p>
                  </div>
                </div>
              </div>

              <form
                action="/search"
                onSubmit={handleSearchSubmit}
                className="relative z-20 mt-4 rounded-3xl border border-slate-200 bg-white/98 p-4 sm:mt-5 lg:mt-7 shadow-[0_18px_45px_rgba(15,23,42,0.13)] backdrop-blur sm:mt-8 lg:mt-7 lg:w-[690px] xl:w-[720px]"
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

              <div className="relative z-20 mt-4 rounded-3xl bg-white lg:mt-6 lg:w-[640px] lg:bg-transparent xl:w-[670px]">
                <TrustRow />

                <div className="mt-3 grid gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/90 p-3 shadow-sm sm:grid-cols-3">
                  {[
                    ["Free", "Local signup"],
                    ["Local", "Trusted care"],
                    ["Flexible", "Independent Gurus"],
                  ].map(([value, label]) => (
                    <div
                      key={label}
                      className="rounded-xl bg-white px-3 py-2 text-center"
                    >
                      <p className="text-lg font-black text-emerald-700">
                        {value}
                      </p>
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-600">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative z-20 mt-5 flex justify-center lg:hidden">
                <HeroSignupCard
                  onGoogleSignup={handleOAuthSignup}
                  onTrack={trackHomepageClick}
                />
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

      <HomeVideoSection onTrack={trackHomepageClick} />

      <SitGuruPawReportSection onTrack={trackHomepageClick} />

      <section className="bg-white py-5 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
            <div className="rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-5 shadow-[0_16px_42px_rgba(15,23,42,0.07)] sm:p-7">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700 sm:text-xs">
                Easy local signup
              </p>
              <h2 className="mt-2 text-2xl font-black leading-tight tracking-[-0.04em] text-slate-950 sm:text-3xl">
                Built for Pet Parents, Pet Gurus, and local communities.
              </h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-700 sm:text-base sm:leading-7">
                Pet Parents can find local care, Pet Gurus can apply to offer
                services independently, and Ambassadors can help spread the
                word. SitGuru keeps the experience simple, welcoming, and easy
                to start.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  ["Free", "Local signup"],
                  ["Local", "Neighborhood care"],
                  ["Simple", "Easy next steps"],
                ].map(([value, label]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white bg-white/90 p-4 text-center shadow-sm"
                  >
                    <p className="text-xl font-black text-emerald-700">
                      {value}
                    </p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-slate-600">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: "For Pet Parents",
                  body: "Create an account, search local Gurus, keep care details organized, and rebook trusted care with less back-and-forth.",
                  cta: "Create Pet Parent Account",
                  href: petParentSignupHref,
                },
                {
                  title: "For Pet Gurus",
                  body: "Apply as an independent Pet Guru, choose your services and local area, and accept requests that fit your availability.",
                  cta: "Start Guru Signup",
                  href: guruSignupHref,
                },
              ].map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  onClick={() =>
                    trackHomepageClick(`${card.title} Signup Card`, card.href)
                  }
                  className="group rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.07)] transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_18px_44px_rgba(15,23,42,0.11)] sm:p-6"
                >
                  <h3 className="text-lg font-black tracking-[-0.03em] text-slate-950 group-hover:text-emerald-800">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                    {card.body}
                  </p>
                  <span className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-black text-white transition group-hover:bg-emerald-800">
                    {card.cta}
                  </span>
                </Link>
              ))}
            </div>
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
                Real people. Real care. On-platform reviews and booking records.
              </p>
            </div>

            <Link
              href="/search"
              prefetch={false}
              onClick={(event) => {
                event.preventDefault();
                trackHomepageClick("View all Gurus", "/search");
                window.location.assign("/search");
              }}
              className="text-xs font-black text-emerald-700 hover:text-emerald-800 hover:underline sm:text-sm"
            >
              View all Gurus
            </Link>
          </div>

          {visibleGuruCards.length > 0 ? (
            <div
              className="sitguru-guru-carousel relative mt-5 overflow-hidden pb-5"
              aria-label="Featured local Gurus carousel"
            >
              <style>{`
                .sitguru-guru-carousel {
                  -webkit-mask-image: linear-gradient(to right, transparent 0%, #000 4%, #000 96%, transparent 100%);
                  mask-image: linear-gradient(to right, transparent 0%, #000 4%, #000 96%, transparent 100%);
                  -webkit-transform: translateZ(0);
                  transform: translateZ(0);
                }

                .sitguru-guru-carousel-track {
                  display: flex;
                  width: max-content;
                  animation: sitguruGuruMarquee 52s linear infinite;
                  -webkit-animation: sitguruGuruMarquee 52s linear infinite;
                  transform: translate3d(0, 0, 0);
                  -webkit-transform: translate3d(0, 0, 0);
                  will-change: transform;
                }

                .sitguru-guru-carousel:hover .sitguru-guru-carousel-track,
                .sitguru-guru-carousel:focus-within .sitguru-guru-carousel-track {
                  animation-play-state: paused;
                  -webkit-animation-play-state: paused;
                }

                @keyframes sitguruGuruMarquee {
                  0% {
                    transform: translate3d(0, 0, 0);
                  }
                  100% {
                    transform: translate3d(-50%, 0, 0);
                  }
                }

                @-webkit-keyframes sitguruGuruMarquee {
                  0% {
                    -webkit-transform: translate3d(0, 0, 0);
                  }
                  100% {
                    -webkit-transform: translate3d(-50%, 0, 0);
                  }
                }

                @media (max-width: 640px) {
                  .sitguru-guru-carousel-track {
                    animation-duration: 46s;
                    -webkit-animation-duration: 46s;
                  }
                }

                @media (prefers-reduced-motion: reduce) {
                  .sitguru-guru-carousel-track {
                    animation: none;
                    -webkit-animation: none;
                  }
                }
              `}</style>

              <div className="sitguru-guru-carousel-track">
                {[0, 1].map((loopIndex) => (
                  <div
                    key={`guru-carousel-loop-${loopIndex}`}
                    aria-hidden={loopIndex === 1}
                    className="flex shrink-0 gap-4 pr-4 sm:gap-5 sm:pr-5"
                  >
                    {visibleGuruCards.map((guru) => (
                      <GuruCardView
                        key={`${guru.id}-${loopIndex}`}
                        guru={guru}
                        onTrack={trackHomepageClick}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-3xl border border-emerald-100 bg-emerald-50/50 p-5 text-sm font-semibold text-slate-700">
              Featured Guru profiles are loading. Visit Find Care to view all
              available Gurus while the homepage carousel syncs.
            </div>
          )}
        </div>
      </section>

      <PartnerNetworkSection onTrack={trackHomepageClick} />

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
                  Pet Parents can find trusted local care. Gurus can apply as
                  independent service providers and choose the requests that fit
                  their availability. SitGuru keeps the experience simple with
                  profiles, booking details, helpful support, and a
                  community-first way to connect.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href="/search"
                    onClick={() =>
                      trackHomepageClick(
                        "Find Care Programs Section",
                        "/search",
                      )
                    }
                    className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-sky-400 px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:brightness-105 sm:w-auto"
                  >
                    Find Care
                  </Link>

                  <Link
                    href={guruSignupHref}
                    onClick={() =>
                      trackHomepageClick(
                        "Become a Guru Programs Section",
                        guruSignupHref,
                      )
                    }
                    className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 sm:w-auto"
                  >
                    Become a Guru
                  </Link>

                  <Link
                    href="/ambassadors"
                    onClick={() =>
                      trackHomepageClick("Explore Programs", "/ambassadors")
                    }
                    className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 sm:w-auto"
                  >
                    Explore Programs
                  </Link>
                </div>

                <div className="mt-7 flex flex-wrap gap-3">
                  {[
                    "Student Hire",
                    "Community Hire",
                    "Military Hire",
                    "SkillBridge applicants",
                    "Ambassador referrals",
                    "Easy signup",
                    "Trusted profiles",
                    "Organized booking records",
                    "Community-first care",
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

      <section id="how-sitguru-works" className="bg-white pb-7 sm:pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid overflow-hidden rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 shadow-[0_18px_45px_rgba(15,23,42,0.08)] lg:grid-cols-3">
            <div className="border-b border-emerald-100 p-5 lg:border-b-0 lg:border-r lg:p-6">
              <h2 className="text-lg font-black tracking-[-0.03em] text-slate-950 lg:text-xl">
                Share SitGuru. Grow PetPerks.
              </h2>

              <div className="mt-5 grid gap-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-xl">
                    🐾
                  </span>
                  <div>
                    <p className="font-black text-slate-950">
                      Invite Pet Parents
                    </p>
                    <p className="text-sm font-semibold text-slate-600">
                      share trusted local care
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-xl">
                    🤝
                  </span>
                  <div>
                    <p className="font-black text-slate-950">
                      Invite future Gurus
                    </p>
                    <p className="text-sm font-semibold text-slate-600">
                      help grow the SitGuru community
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="/petperks"
                onClick={() =>
                  trackHomepageClick("PetPerks Learn More", "/petperks")
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
                Pet Parents can find trusted local care. Gurus can apply as
                independent service providers, choose their services and local
                service areas, and accept requests that fit their availability.
                SitGuru Programs create additional ways to refer, support, and
                help grow the SitGuru Pet Community.
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
                  href={guruSignupHref}
                  onClick={() =>
                    trackHomepageClick("Become a Guru", guruSignupHref)
                  }
                  className="inline-flex rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-black text-emerald-800 transition hover:bg-emerald-50"
                >
                  Become a Guru
                </Link>

                <Link
                  href="/ambassadors"
                  onClick={() =>
                    trackHomepageClick("Explore Programs", "/ambassadors")
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
                    "Book on-platform",
                    "Keep service details, payment records, reviews, and support history documented",
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
                href="/search"
                onClick={() =>
                  trackHomepageClick("See how it works", "/search")
                }
                className="mt-6 inline-flex items-center gap-2 text-sm font-black text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                See how it works →
              </Link>
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
            <h2
              className="text-2xl font-black tracking-[-0.04em] sm:text-3xl"
              style={{
                color: "#ffffff",
                WebkitTextFillColor: "#ffffff",
                opacity: 1,
                textShadow: "0 2px 18px rgba(0, 0, 0, 0.2)",
              }}
            >
              Ready to get started?
            </h2>
            <p
              className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-6 sm:text-base"
              style={{
                color: "#ecfdf5",
                WebkitTextFillColor: "#ecfdf5",
                opacity: 1,
              }}
            >
              Find trusted pet care or join SitGuru as part of a local,
              community-first pet care marketplace built around easy signup,
              trusted profiles, and independent Pet Gurus.
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
                href={guruSignupHref}
                onClick={() =>
                  trackHomepageClick("Become a Guru Final CTA", guruSignupHref)
                }
                className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-black text-white transition hover:bg-white/15"
              >
                Become a Guru
              </Link>

              <Link
                href="/ambassadors"
                onClick={() =>
                  trackHomepageClick(
                    "Explore Programs Final CTA",
                    "/ambassadors",
                  )
                }
                className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-black text-white transition hover:bg-white/15"
              >
                Explore Programs
              </Link>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
            {[
              "Easy signup",
              "Reviewed profiles",
              "Simple signup",
              "On-platform booking records",
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

      <HomepageAssistPopup source={source} onTrack={trackHomepageClick} />
    </main>
  );
}