"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  ImageIcon,
  Loader2,
  Save,
  ShieldCheck,
  Sparkles,
  UserCircle2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type GuruProfile = {
  id?: string | null;
  user_id?: string | null;
  display_name?: string | null;
  full_name?: string | null;
  slug?: string | null;
  headline?: string | null;
  bio?: string | null;
  city?: string | null;
  state?: string | null;
  street_address?: string | null;
  service_address?: string | null;
  address?: string | null;
  zip_code?: string | null;
  postal_code?: string | null;
  service_radius_miles?: number | null;
  service_radius?: number | null;
  radius_miles?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  lat?: number | null;
  lng?: number | null;
  hourly_rate?: number | null;
  rate?: number | null;
  years_experience?: number | null;
  experience_years?: number | null;
  profile_photo_url?: string | null;
  image_url?: string | null;
  avatar_url?: string | null;
  photo_url?: string | null;
  services?: string[] | string | null;
  is_public?: boolean | null;
  onboarding_completed?: boolean | null;
  profile_completed?: boolean | null;
};

type UploadResult = {
  bucket: string;
  path: string;
  publicUrl: string;
};

type RateUnit =
  | "hour"
  | "visit"
  | "walk"
  | "session"
  | "day"
  | "night"
  | "stay"
  | "pet"
  | "add_on"
  | "custom";

type ServiceRateConfig = {
  service_key: string;
  service_label: string;
  default_unit: RateUnit;
  default_duration_minutes: number | null;
  recommended_units: RateUnit[];
};

type GuruServiceRateRow = {
  id?: string | null;
  guru_id?: string | null;
  service_key: string;
  service_label: string;
  is_enabled: boolean;
  rate_amount: number | string | null;
  rate_unit: RateUnit | string | null;
  duration_minutes?: number | string | null;
  notes?: string | null;
};

type ServiceRateState = {
  service_key: string;
  service_label: string;
  is_enabled: boolean;
  rate_amount: string;
  rate_unit: RateUnit;
  duration_minutes: string;
  notes: string;
};

const CERTIFIED_GURU_BADGE_PATH =
  "/images/badges/sitguru-certified-guru-badge.png";

const RATE_UNIT_OPTIONS: { value: RateUnit; label: string }[] = [
  { value: "hour", label: "Per hour" },
  { value: "visit", label: "Per visit" },
  { value: "walk", label: "Per walk" },
  { value: "session", label: "Per session" },
  { value: "day", label: "Per day" },
  { value: "night", label: "Per night" },
  { value: "stay", label: "Per stay" },
  { value: "pet", label: "Per pet" },
  { value: "add_on", label: "Add-on fee" },
  { value: "custom", label: "Custom quote" },
];

const SERVICE_RATE_CONFIGS: ServiceRateConfig[] = [
  {
    service_key: "pet_sitting",
    service_label: "Pet Sitting",
    default_unit: "visit",
    default_duration_minutes: 30,
    recommended_units: ["visit", "hour", "day"],
  },
  {
    service_key: "dog_walking",
    service_label: "Dog Walking",
    default_unit: "walk",
    default_duration_minutes: 30,
    recommended_units: ["walk", "visit", "hour"],
  },
  {
    service_key: "boarding",
    service_label: "Boarding",
    default_unit: "night",
    default_duration_minutes: null,
    recommended_units: ["night", "stay", "day"],
  },
  {
    service_key: "drop_in_visits",
    service_label: "Drop-In Visits",
    default_unit: "visit",
    default_duration_minutes: 30,
    recommended_units: ["visit", "hour"],
  },
  {
    service_key: "house_sitting",
    service_label: "House Sitting",
    default_unit: "night",
    default_duration_minutes: null,
    recommended_units: ["night", "stay", "day"],
  },
  {
    service_key: "doggy_day_care",
    service_label: "Doggy Day Care",
    default_unit: "day",
    default_duration_minutes: null,
    recommended_units: ["day", "visit"],
  },
  {
    service_key: "training_support",
    service_label: "Training Support",
    default_unit: "session",
    default_duration_minutes: 60,
    recommended_units: ["session", "hour"],
  },
  {
    service_key: "pet_taxi",
    service_label: "Pet Taxi",
    default_unit: "visit",
    default_duration_minutes: null,
    recommended_units: ["visit", "hour", "add_on"],
  },
  {
    service_key: "medication_help",
    service_label: "Medication Help",
    default_unit: "add_on",
    default_duration_minutes: null,
    recommended_units: ["add_on", "visit"],
  },
  {
    service_key: "custom_care",
    service_label: "Custom Care",
    default_unit: "custom",
    default_duration_minutes: null,
    recommended_units: ["custom", "hour", "visit", "session"],
  },
];

const PHOTO_BUCKETS = [
  "guru-photos",
  "profile-photos",
  "avatars",
  "guru-profile-photos",
];

const routes = {
  dashboard: "/guru/dashboard",
  messages: "/guru/dashboard/messages",
  bookings: "/guru/dashboard/bookings",
  settings: "/guru/dashboard/settings",
  login: "/guru/login",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function stringifyError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

function isOAuthProviderAvatarUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();

    return (
      hostname.includes("googleusercontent.com") ||
      hostname.includes("ggpht.com") ||
      hostname.includes("google.com")
    );
  } catch {
    return false;
  }
}

function normalizeSitGuruPhotoUrl(value: string | null | undefined) {
  if (!value) return "";

  const cleanValue = value.trim();

  if (!cleanValue) return "";

  /**
   * Do not use Google/Gmail OAuth photos as SitGuru Guru avatars.
   * Gurus should show an uploaded SitGuru profile photo or the branded initials fallback.
   */
  if (isOAuthProviderAvatarUrl(cleanValue)) return "";

  if (cleanValue.startsWith("http://")) return cleanValue;
  if (cleanValue.startsWith("https://")) return cleanValue;
  if (cleanValue.startsWith("/")) return cleanValue;
  if (cleanValue.startsWith("data:image")) return cleanValue;

  return `/${cleanValue}`;
}

function firstSitGuruPhotoUrl(values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalized = normalizeSitGuruPhotoUrl(value);

    if (normalized) return normalized;
  }

  return "";
}

function normalizeServices(value: GuruProfile["services"]): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function isRateUnit(value: unknown): value is RateUnit {
  return RATE_UNIT_OPTIONS.some((option) => option.value === value);
}

function formatRateUnitLabel(unit: RateUnit) {
  return RATE_UNIT_OPTIONS.find((option) => option.value === unit)?.label || unit;
}

function buildDefaultServiceRates(enabledServices: string[] = []): ServiceRateState[] {
  return SERVICE_RATE_CONFIGS.map((service) => ({
    service_key: service.service_key,
    service_label: service.service_label,
    is_enabled: enabledServices.includes(service.service_label),
    rate_amount: "",
    rate_unit: service.default_unit,
    duration_minutes:
      service.default_duration_minutes === null
        ? ""
        : String(service.default_duration_minutes),
    notes: "",
  }));
}

function mergeServiceRates({
  enabledServices,
  savedRates,
}: {
  enabledServices: string[];
  savedRates: GuruServiceRateRow[];
}): ServiceRateState[] {
  const savedByKey = new Map(
    savedRates.map((rate) => [String(rate.service_key), rate]),
  );

  return SERVICE_RATE_CONFIGS.map((service) => {
    const saved = savedByKey.get(service.service_key);
    const savedUnit = saved?.rate_unit;

    return {
      service_key: service.service_key,
      service_label: saved?.service_label || service.service_label,
      is_enabled:
        Boolean(saved?.is_enabled) || enabledServices.includes(service.service_label),
      rate_amount:
        saved?.rate_amount !== null && saved?.rate_amount !== undefined
          ? String(saved.rate_amount)
          : "",
      rate_unit: isRateUnit(savedUnit) ? savedUnit : service.default_unit,
      duration_minutes:
        saved?.duration_minutes !== null && saved?.duration_minutes !== undefined
          ? String(saved.duration_minutes)
          : service.default_duration_minutes === null
            ? ""
            : String(service.default_duration_minutes),
      notes: saved?.notes || "",
    };
  });
}

function getEnabledServiceLabels(serviceRates: ServiceRateState[]) {
  return serviceRates
    .filter((service) => service.is_enabled)
    .map((service) => service.service_label);
}

function getPublicReadinessItems({
  displayName,
  slug,
  bio,
  city,
  stateValue,
  zipCode,
  profilePhotoUrl,
  serviceRates,
}: {
  displayName: string;
  slug: string;
  bio: string;
  city: string;
  stateValue: string;
  zipCode: string;
  profilePhotoUrl: string;
  serviceRates: ServiceRateState[];
}) {
  const enabledServiceRates = serviceRates.filter((service) => service.is_enabled);
  const hasPricedService = enabledServiceRates.some(
    (service) => service.rate_unit === "custom" || service.rate_amount.trim(),
  );

  const checks = [
    {
      label: "Step 1: Display name",
      complete: Boolean(displayName.trim()),
    },
    {
      label: "Step 1: Public slug",
      complete: Boolean(slugify(slug || displayName)),
    },
    {
      label: "Step 1: Bio",
      complete: Boolean(bio.trim()),
    },
    {
      label: "Step 1: Profile photo",
      complete: Boolean(profilePhotoUrl.trim()),
    },
    {
      label: "Step 2: City",
      complete: Boolean(city.trim()),
    },
    {
      label: "Step 2: State",
      complete: Boolean(stateValue.trim()),
    },
    {
      label: "Step 2: ZIP code",
      complete: Boolean(zipCode.trim()),
    },
    {
      label: "Step 3: Services",
      complete: enabledServiceRates.length > 0,
    },
    {
      label: "Step 3: Pricing",
      complete: hasPricedService,
    },
  ];

  return {
    checks,
    missingItems: checks.filter((item) => !item.complete).map((item) => item.label),
    ready: checks.every((item) => item.complete),
  };
}

async function loadGuruServiceRates(guruId: string, enabledServices: string[]) {
  if (!guruId) return buildDefaultServiceRates(enabledServices);

  const { data, error } = await supabase
    .from("guru_service_rates")
    .select("*")
    .eq("guru_id", guruId)
    .order("service_label", { ascending: true });

  if (error) {
    console.warn("Could not load guru service rates:", error.message);
    return buildDefaultServiceRates(enabledServices);
  }

  return mergeServiceRates({
    enabledServices,
    savedRates: ((data || []) as unknown) as GuruServiceRateRow[],
  });
}

async function loadGuruAcademyGraduate(userId: string) {
  if (!userId) return false;

  try {
    const { data, error } = await supabase
      .from("academy_certifications")
      .select("badge_status, certificate_status, issued_at")
      .eq("academy_type", "guru")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.warn("Could not load Guru Academy certification:", error.message);
      return false;
    }

    const badgeStatus = String(data?.badge_status || "").toLowerCase();
    const certificateStatus = String(data?.certificate_status || "").toLowerCase();

    return Boolean(
      data?.issued_at ||
        badgeStatus === "issued" ||
        badgeStatus === "completed" ||
        badgeStatus === "complete" ||
        certificateStatus === "issued" ||
        certificateStatus === "completed" ||
        certificateStatus === "complete",
    );
  } catch (error) {
    console.warn("Could not load Guru Academy certification:", error);
    return false;
  }
}

async function saveGuruServiceRates(guruId: string, serviceRates: ServiceRateState[]) {
  if (!guruId) return;

  const now = new Date().toISOString();
  const payload = serviceRates.map((service) => ({
    guru_id: guruId,
    service_key: service.service_key,
    service_label: service.service_label,
    is_enabled: service.is_enabled,
    rate_amount:
      service.rate_unit === "custom" || !service.rate_amount.trim()
        ? null
        : Number(service.rate_amount),
    rate_unit: service.rate_unit,
    duration_minutes: service.duration_minutes.trim()
      ? Number(service.duration_minutes)
      : null,
    notes: service.notes.trim() || null,
    updated_at: now,
  }));

  const { error } = await supabase
    .from("guru_service_rates")
    .upsert(payload, { onConflict: "guru_id,service_key" });

  if (error) throw error;
}

function getFileExtension(file: File) {
  const nameExtension = file.name.split(".").pop()?.toLowerCase();

  if (nameExtension) return nameExtension === "jpeg" ? "jpg" : nameExtension;
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";

  return "jpg";
}

function isValidPhoto(file: File) {
  return ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
    file.type,
  );
}

async function uploadToFirstAvailableBucket(file: File, userId: string) {
  const extension = getFileExtension(file);
  const path = `${userId}/guru-profile-${Date.now()}.${extension}`;
  let lastError = "Could not upload photo.";

  for (const bucket of PHOTO_BUCKETS) {
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

    if (!error) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return { bucket, path, publicUrl: data.publicUrl } satisfies UploadResult;
    }

    lastError = error.message || lastError;
  }

  throw new Error(lastError);
}

async function updateProfileAvatar(userId: string, uploaded: UploadResult) {
  const timestamp = new Date().toISOString();
  const attempts = [
    {
      avatar_url: uploaded.publicUrl,
      avatar_path: `${uploaded.bucket}/${uploaded.path}`,
      avatar_updated_at: timestamp,
    },
    { profile_photo_url: uploaded.publicUrl },
    { image_url: uploaded.publicUrl },
    { avatar_url: uploaded.publicUrl },
  ];

  for (const payload of attempts) {
    const { error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", userId);
    if (!error) return;
  }
}

async function saveGuruPayload({
  userId,
  profileExists,
  payload,
}: {
  userId: string;
  profileExists: boolean;
  payload: Record<string, unknown>;
}) {
  const mapPayload = {
    user_id: payload.user_id,
    display_name: payload.display_name,
    full_name: payload.full_name,
    slug: payload.slug,
    bio: payload.bio,
    city: payload.city,
    state: payload.state,
    zip_code: payload.zip_code,
    service_radius_miles: payload.service_radius_miles,
    latitude: payload.latitude,
    longitude: payload.longitude,
    hourly_rate: payload.hourly_rate,
    rate: payload.rate,
    profile_photo_url: payload.profile_photo_url,
    image_url: payload.image_url,
    services: payload.services,
    is_public: payload.is_public,
  };

  const latLngPayload = {
    user_id: payload.user_id,
    display_name: payload.display_name,
    full_name: payload.full_name,
    slug: payload.slug,
    bio: payload.bio,
    city: payload.city,
    state: payload.state,
    lat: payload.lat,
    lng: payload.lng,
    hourly_rate: payload.hourly_rate,
    rate: payload.rate,
    profile_photo_url: payload.profile_photo_url,
    image_url: payload.image_url,
    services: payload.services,
    is_public: payload.is_public,
  };

  const leanPayload = {
    user_id: payload.user_id,
    display_name: payload.display_name,
    full_name: payload.full_name,
    slug: payload.slug,
    bio: payload.bio,
    city: payload.city,
    state: payload.state,
    hourly_rate: payload.hourly_rate,
    rate: payload.rate,
    profile_photo_url: payload.profile_photo_url,
    image_url: payload.image_url,
    services: payload.services,
    is_public: payload.is_public,
  };

  const basicPayload = {
    user_id: payload.user_id,
    display_name: payload.display_name,
    full_name: payload.full_name,
    slug: payload.slug,
    bio: payload.bio,
    city: payload.city,
    state: payload.state,
    hourly_rate: payload.hourly_rate,
    profile_photo_url: payload.profile_photo_url,
    image_url: payload.image_url,
    is_public: payload.is_public,
  };

  const attempts = [payload, mapPayload, latLngPayload, leanPayload, basicPayload];
  let lastError = "Could not save your guru profile.";

  for (const attempt of attempts) {
    const response = profileExists
      ? await supabase.from("gurus").update(attempt).eq("user_id", userId)
      : await supabase.from("gurus").insert(attempt);

    if (!response.error) return;
    lastError = response.error.message || lastError;
  }

  throw new Error(lastError);
}

function GuruProfileLoadingFallback() {
  return (
    <main
      className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_45%,#ecfdf5_100%)] px-4 py-10 font-light !text-slate-950 md:px-6 lg:px-8"
      style={{
        fontFamily:
          '"Open Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontWeight: 300,
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-center">
        <div className="rounded-[2rem] border border-emerald-100 bg-white px-8 py-6 text-center shadow-sm">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-emerald-600" />
          <p className="mt-3 text-base font-semibold !text-slate-700">
            Loading guru profile...
          </p>
        </div>
      </div>
    </main>
  );
}

function GuruDashboardProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeStep =
    searchParams.get("step") === "2"
      ? "2"
      : searchParams.get("step") === "3"
        ? "3"
        : "1";
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [userId, setUserId] = useState("");
  const [signedInEmail, setSignedInEmail] = useState("");

  const [profileExists, setProfileExists] = useState(false);
  const [existingProfileId, setExistingProfileId] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [serviceRadius, setServiceRadius] = useState("25");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [serviceRates, setServiceRates] = useState<ServiceRateState[]>(() =>
    buildDefaultServiceRates(),
  );
  const [isPublic, setIsPublic] = useState(false);
  const [isGuruAcademyGraduate, setIsGuruAcademyGraduate] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [zipLookupLoading, setZipLookupLoading] = useState(false);
  const [zipLookupMessage, setZipLookupMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        setLoading(true);
        setErrorMessage("");
        setSuccessMessage("");
        setJustSaved(false);

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (authError || !user) {
          router.replace(routes.login);
          return;
        }

        const fallbackDisplayName =
          (user.user_metadata?.display_name as string | undefined)?.trim() ||
          (user.user_metadata?.full_name as string | undefined)?.trim() ||
          user.email?.split("@")[0] ||
          "Guru";

        const fallbackSlug = slugify(fallbackDisplayName);

        setUserId(user.id);
        setSignedInEmail(user.email ?? "");
        setIsGuruAcademyGraduate(await loadGuruAcademyGraduate(user.id));

        const { data, error } = await supabase
          .from("gurus")
          .select("*")
          .eq("user_id", user.id)
          .limit(1);

        if (!mounted) return;

        if (error) {
          setProfileExists(false);
          setExistingProfileId("");
          setDisplayName(fallbackDisplayName);
          setSlug(fallbackSlug);
          setHeadline("");
          setBio("");
          setCity("");
          setStateValue("");
          setStreetAddress("");
          setZipCode("");
          setServiceRadius("25");
          setLatitude("");
          setLongitude("");
          setHourlyRate("");
          setYearsExperience("");
          setProfilePhotoUrl("");
          setServices([]);
          setServiceRates(buildDefaultServiceRates());
          setIsPublic(false);
          setErrorMessage(
            `We could not read an existing guru profile yet: ${stringifyError(error)}`,
          );
          setLoading(false);
          return;
        }

        const profile = (data?.[0] as GuruProfile | undefined) ?? null;

        if (!profile) {
          setProfileExists(false);
          setExistingProfileId("");
          setDisplayName(fallbackDisplayName);
          setSlug(fallbackSlug);
          setHeadline("");
          setBio("");
          setCity("");
          setStateValue("");
          setStreetAddress("");
          setZipCode("");
          setServiceRadius("25");
          setLatitude("");
          setLongitude("");
          setHourlyRate("");
          setYearsExperience("");
          setProfilePhotoUrl("");
          setServices([]);
          setServiceRates(buildDefaultServiceRates());
          setIsPublic(false);
          setLoading(false);
          return;
        }

        setProfileExists(true);
        setExistingProfileId(profile.id ?? "");
        setDisplayName(
          profile.display_name || profile.full_name || fallbackDisplayName,
        );
        setSlug(profile.slug || fallbackSlug);
        setHeadline(profile.headline || "");
        setBio(profile.bio || "");
        setCity(profile.city || "");
        setStateValue(profile.state || "");
        setStreetAddress(
          profile.street_address ||
            profile.service_address ||
            profile.address ||
            "",
        );
        setZipCode(profile.zip_code || profile.postal_code || "");
        setServiceRadius(
          profile.service_radius_miles !== null &&
            profile.service_radius_miles !== undefined
            ? String(profile.service_radius_miles)
            : profile.service_radius !== null &&
                profile.service_radius !== undefined
              ? String(profile.service_radius)
              : profile.radius_miles !== null &&
                  profile.radius_miles !== undefined
                ? String(profile.radius_miles)
                : "25",
        );
        setLatitude(
          profile.latitude !== null && profile.latitude !== undefined
            ? String(profile.latitude)
            : profile.lat !== null && profile.lat !== undefined
              ? String(profile.lat)
              : "",
        );
        setLongitude(
          profile.longitude !== null && profile.longitude !== undefined
            ? String(profile.longitude)
            : profile.lng !== null && profile.lng !== undefined
              ? String(profile.lng)
              : "",
        );
        setHourlyRate(
          profile.hourly_rate !== null && profile.hourly_rate !== undefined
            ? String(profile.hourly_rate)
            : profile.rate !== null && profile.rate !== undefined
              ? String(profile.rate)
              : "",
        );
        setYearsExperience(
          profile.years_experience !== null &&
            profile.years_experience !== undefined
            ? String(profile.years_experience)
            : profile.experience_years !== null &&
                profile.experience_years !== undefined
              ? String(profile.experience_years)
              : "",
        );
        setProfilePhotoUrl(
          firstSitGuruPhotoUrl([
            profile.profile_photo_url,
            profile.image_url,
            profile.photo_url,
            profile.avatar_url,
          ]),
        );
        const normalizedProfileServices = normalizeServices(profile.services);
        setServices(normalizedProfileServices);
        setServiceRates(
          await loadGuruServiceRates(profile.id || "", normalizedProfileServices),
        );
        setIsPublic(Boolean(profile.is_public));
        setLoading(false);
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(
          `Could not load your guru profile: ${stringifyError(error)}`,
        );
        setLoading(false);
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [router]);

  useEffect(() => {
    const cleanZip = zipCode.replace(/\D/g, "").slice(0, 5);

    if (loading || cleanZip.length !== 5) {
      if (cleanZip.length < 5) setZipLookupMessage("");
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setZipLookupLoading(true);
      setZipLookupMessage("Looking up ZIP code...");

      try {
        const response = await fetch(`/api/location/zip?zip=${cleanZip}`);
        const result = (await response.json()) as {
          ok?: boolean;
          city?: string;
          state?: string;
          latitude?: number;
          longitude?: number;
          error?: string;
        };

        if (cancelled) return;

        if (!response.ok || !result.ok) {
          setZipLookupMessage(
            result.error ||
              "Could not auto-fill this ZIP code. Please check the ZIP and try again.",
          );
          return;
        }

        setCity(result.city || "");
        setStateValue(result.state || "");
        setLatitude(
          typeof result.latitude === "number" ? String(result.latitude) : "",
        );
        setLongitude(
          typeof result.longitude === "number" ? String(result.longitude) : "",
        );
        setZipLookupMessage(
          `ZIP found: ${result.city || "City"}, ${
            result.state || "State"
          }. Map coordinates saved automatically.`,
        );
      } catch {
        if (!cancelled) {
          setZipLookupMessage(
            "Could not auto-fill this ZIP code right now. Please try again.",
          );
        }
      } finally {
        if (!cancelled) setZipLookupLoading(false);
      }
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [loading, zipCode]);

  function handleZipCodeChange(value: string) {
    const cleanZip = value.replace(/\D/g, "").slice(0, 5);
    setZipCode(cleanZip);

    if (cleanZip.length < 5) {
      setZipLookupMessage("Enter a 5-digit ZIP code to auto-fill city and state.");
      setLatitude("");
      setLongitude("");
    }
  }

  function toggleService(service: string) {
    setServiceRates((current) => {
      const updated = current.map((item) =>
        item.service_label === service
          ? { ...item, is_enabled: !item.is_enabled }
          : item,
      );

      setServices(getEnabledServiceLabels(updated));
      return updated;
    });
  }

  function updateServiceRate(
    serviceKey: string,
    field: keyof Pick<
      ServiceRateState,
      "rate_amount" | "rate_unit" | "duration_minutes" | "notes"
    >,
    value: string,
  ) {
    setServiceRates((current) => {
      const updated = current.map((item) => {
        if (item.service_key !== serviceKey) return item;

        if (field === "rate_unit") {
          return {
            ...item,
            rate_unit: isRateUnit(value) ? value : item.rate_unit,
            rate_amount: value === "custom" ? "" : item.rate_amount,
          };
        }

        return {
          ...item,
          [field]: value,
        };
      });

      setServices(getEnabledServiceLabels(updated));
      return updated;
    });
  }

  async function handlePhotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    setUploadingPhoto(true);
    setJustSaved(false);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (!isValidPhoto(file)) {
        setErrorMessage("Please upload a JPG, PNG, or WEBP profile photo.");
        setUploadingPhoto(false);
        return;
      }

      if (file.size > 8 * 1024 * 1024) {
        setErrorMessage("Profile photos must be 8MB or smaller.");
        setUploadingPhoto(false);
        return;
      }

      const uploaded = await uploadToFirstAvailableBucket(file, userId);
      setProfilePhotoUrl(uploaded.publicUrl);
      await updateProfileAvatar(userId, uploaded);
      setSuccessMessage(
        "Photo uploaded. Save profile to publish changes everywhere.",
      );
    } catch (error) {
      setErrorMessage(`Could not upload photo: ${stringifyError(error)}`);
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !userId) return;

    setSaving(true);
    setJustSaved(false);
    setErrorMessage("");
    setSuccessMessage("");

    const cleanDisplayName = displayName.trim();
    const cleanSlug = slugify(slug || displayName);
    const cleanHeadline = headline.trim();
    const cleanBio = bio.trim();
    const cleanCity = city.trim();
    const cleanState = stateValue.trim().toUpperCase();
    const cleanStreetAddress = streetAddress.trim();
    const cleanZipCode = zipCode.trim();
    const parsedServiceRadius = serviceRadius ? Number(serviceRadius) : null;
    const parsedLatitude = latitude ? Number(latitude) : null;
    const parsedLongitude = longitude ? Number(longitude) : null;
    const cleanPhotoUrl = profilePhotoUrl.trim();
    const enabledServiceRates = serviceRates.filter((service) => service.is_enabled);
    const cleanServices = getEnabledServiceLabels(serviceRates);

    const parsedRate = hourlyRate ? Number(hourlyRate) : null;
    const parsedExperience = yearsExperience ? Number(yearsExperience) : null;

    if (!cleanDisplayName) {
      setErrorMessage("Display name is required.");
      setSaving(false);
      return;
    }

    if (!cleanSlug) {
      setErrorMessage("Public profile slug is required.");
      setSaving(false);
      return;
    }

    if (parsedRate !== null && (Number.isNaN(parsedRate) || parsedRate < 0)) {
      setErrorMessage("Hourly rate must be a valid non-negative number.");
      setSaving(false);
      return;
    }

    if (
      parsedExperience !== null &&
      (Number.isNaN(parsedExperience) || parsedExperience < 0)
    ) {
      setErrorMessage(
        "Years of experience must be a valid non-negative number.",
      );
      setSaving(false);
      return;
    }

    if (
      parsedServiceRadius !== null &&
      (Number.isNaN(parsedServiceRadius) || parsedServiceRadius < 0)
    ) {
      setErrorMessage("Service radius must be a valid non-negative number.");
      setSaving(false);
      return;
    }

    for (const service of enabledServiceRates) {
      const parsedServiceRate = service.rate_amount.trim()
        ? Number(service.rate_amount)
        : null;
      const parsedDuration = service.duration_minutes.trim()
        ? Number(service.duration_minutes)
        : null;

      if (
        service.rate_unit !== "custom" &&
        (parsedServiceRate === null ||
          Number.isNaN(parsedServiceRate) ||
          parsedServiceRate < 0)
      ) {
        setErrorMessage(
          `${service.service_label} needs a valid non-negative rate amount, or choose Custom quote.`,
        );
        setSaving(false);
        return;
      }

      if (
        parsedDuration !== null &&
        (Number.isNaN(parsedDuration) || parsedDuration < 0)
      ) {
        setErrorMessage(
          `${service.service_label} duration must be a valid non-negative number.`,
        );
        setSaving(false);
        return;
      }
    }

    if (
      parsedLatitude !== null &&
      (Number.isNaN(parsedLatitude) ||
        parsedLatitude < -90 ||
        parsedLatitude > 90)
    ) {
      setErrorMessage("Latitude must be between -90 and 90.");
      setSaving(false);
      return;
    }

    if (
      parsedLongitude !== null &&
      (Number.isNaN(parsedLongitude) ||
        parsedLongitude < -180 ||
        parsedLongitude > 180)
    ) {
      setErrorMessage("Longitude must be between -180 and 180.");
      setSaving(false);
      return;
    }

    const publicReadiness = getPublicReadinessItems({
      displayName: cleanDisplayName,
      slug: cleanSlug,
      bio: cleanBio,
      city: cleanCity,
      stateValue: cleanState,
      zipCode: cleanZipCode,
      profilePhotoUrl: cleanPhotoUrl,
      serviceRates,
    });

    const onboardingCompleted =
      Boolean(cleanDisplayName) &&
      Boolean(cleanSlug) &&
      Boolean(cleanBio) &&
      Boolean(cleanCity) &&
      Boolean(cleanState) &&
      Boolean(cleanZipCode) &&
      Boolean(cleanPhotoUrl) &&
      cleanServices.length > 0;

    const safeIsPublic = isPublic && publicReadiness.ready;

    const payload = {
      user_id: userId,
      display_name: cleanDisplayName,
      full_name: cleanDisplayName,
      slug: cleanSlug,
      headline: cleanHeadline || null,
      bio: cleanBio || null,
      city: cleanCity || null,
      state: cleanState || null,
      street_address: cleanStreetAddress || null,
      service_address: cleanStreetAddress || null,
      address: cleanStreetAddress || null,
      zip_code: cleanZipCode || null,
      postal_code: cleanZipCode || null,
      service_radius_miles: parsedServiceRadius,
      service_radius: parsedServiceRadius,
      radius_miles: parsedServiceRadius,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      lat: parsedLatitude,
      lng: parsedLongitude,
      location_updated_at: new Date().toISOString(),
      hourly_rate: parsedRate,
      rate: parsedRate,
      years_experience: parsedExperience,
      experience_years: parsedExperience,
      profile_photo_url: cleanPhotoUrl || null,
      image_url: cleanPhotoUrl || null,
      avatar_url: cleanPhotoUrl || null,
      photo_url: cleanPhotoUrl || null,
      services: cleanServices,
      is_public: safeIsPublic,
      onboarding_completed: onboardingCompleted,
      profile_completed: onboardingCompleted,
    };

    try {
      await saveGuruPayload({ userId, profileExists, payload });

      const { data: freshRows } = await supabase
        .from("gurus")
        .select("*")
        .eq("user_id", userId)
        .limit(1);

      const refreshed = (freshRows?.[0] as GuruProfile | undefined) ?? null;
      const savedGuruId = refreshed?.id || existingProfileId;

      if (savedGuruId) {
        await saveGuruServiceRates(savedGuruId, serviceRates);
      }

      if (refreshed) {
        setExistingProfileId(refreshed.id ?? existingProfileId);
        setProfileExists(true);
        setDisplayName(
          refreshed.display_name || refreshed.full_name || cleanDisplayName,
        );
        setSlug(refreshed.slug || cleanSlug);
        setHeadline(refreshed.headline || cleanHeadline);
        setBio(refreshed.bio || "");
        setCity(refreshed.city || "");
        setStateValue(refreshed.state || "");
        setStreetAddress(
          refreshed.street_address ||
            refreshed.service_address ||
            refreshed.address ||
            cleanStreetAddress,
        );
        setZipCode(refreshed.zip_code || refreshed.postal_code || cleanZipCode);
        setServiceRadius(
          refreshed.service_radius_miles !== null &&
            refreshed.service_radius_miles !== undefined
            ? String(refreshed.service_radius_miles)
            : refreshed.service_radius !== null &&
                refreshed.service_radius !== undefined
              ? String(refreshed.service_radius)
              : refreshed.radius_miles !== null &&
                  refreshed.radius_miles !== undefined
                ? String(refreshed.radius_miles)
                : serviceRadius,
        );
        setLatitude(
          refreshed.latitude !== null && refreshed.latitude !== undefined
            ? String(refreshed.latitude)
            : refreshed.lat !== null && refreshed.lat !== undefined
              ? String(refreshed.lat)
              : latitude,
        );
        setLongitude(
          refreshed.longitude !== null && refreshed.longitude !== undefined
            ? String(refreshed.longitude)
            : refreshed.lng !== null && refreshed.lng !== undefined
              ? String(refreshed.lng)
              : longitude,
        );
        setHourlyRate(
          refreshed.hourly_rate !== null && refreshed.hourly_rate !== undefined
            ? String(refreshed.hourly_rate)
            : refreshed.rate !== null && refreshed.rate !== undefined
              ? String(refreshed.rate)
              : "",
        );
        setYearsExperience(
          refreshed.years_experience !== null &&
            refreshed.years_experience !== undefined
            ? String(refreshed.years_experience)
            : refreshed.experience_years !== null &&
                refreshed.experience_years !== undefined
              ? String(refreshed.experience_years)
              : "",
        );
        setProfilePhotoUrl(
          firstSitGuruPhotoUrl([
            refreshed.profile_photo_url,
            refreshed.image_url,
            refreshed.photo_url,
            refreshed.avatar_url,
          ]),
        );
        const refreshedServices = normalizeServices(refreshed.services);
        setServices(refreshedServices);
        setServiceRates((current) =>
          current.map((service) => ({
            ...service,
            is_enabled: refreshedServices.includes(service.service_label),
          })),
        );
        setIsPublic(Boolean(refreshed.is_public));
      } else {
        setSlug(cleanSlug);
        setServices(cleanServices);
        setServiceRates((current) =>
          current.map((service) => ({
            ...service,
            is_enabled: cleanServices.includes(service.service_label),
          })),
        );
        setIsPublic(safeIsPublic);
        setProfileExists(true);
      }

      setSuccessMessage(
        safeIsPublic
          ? "Saved. Returning to your dashboard so you can see Steps 1, 2, and 3 marked complete."
          : isPublic
            ? "Saved. Returning to your dashboard so you can see what still needs to be completed before going public."
            : "Saved. Returning to your dashboard so you can see your setup progress.",
      );
      setJustSaved(true);

      window.setTimeout(() => {
        router.refresh();
        router.push(routes.dashboard);
      }, 700);
    } catch (error) {
      setErrorMessage(
        `Could not save your guru profile: ${stringifyError(error)}`,
      );
    } finally {
      setSaving(false);
    }
  }

  const completionPercent = useMemo(() => {
    const publicReadiness = getPublicReadinessItems({
      displayName,
      slug,
      bio,
      city,
      stateValue,
      zipCode,
      profilePhotoUrl,
      serviceRates,
    });

    return Math.max(
      10,
      Math.round(
        (publicReadiness.checks.filter((item) => item.complete).length /
          publicReadiness.checks.length) *
          100,
      ),
    );
  }, [
    displayName,
    slug,
    bio,
    city,
    stateValue,
    zipCode,
    profilePhotoUrl,
    serviceRates,
  ]);

  const publicReadiness = useMemo(
    () =>
      getPublicReadinessItems({
        displayName,
        slug,
        bio,
        city,
        stateValue,
        zipCode,
        profilePhotoUrl,
        serviceRates,
      }),
    [
      displayName,
      slug,
      bio,
      city,
      stateValue,
      zipCode,
      profilePhotoUrl,
      serviceRates,
    ],
  );

  const missingItems = publicReadiness.missingItems;
  const publicProfileReady = publicReadiness.ready;
  const effectivePublicStatus = isPublic && publicProfileReady;

  const publicPreviewName = displayName.trim() || "Your Guru Name";
  const publicPreviewSlug = slugify(slug || displayName || "guru");
  const publicPreviewHeadline = headline.trim() || "Trusted Pet Care Guru";
  const publicPreviewLocation =
    city.trim() || stateValue.trim() || zipCode.trim()
      ? [city.trim(), stateValue.trim(), zipCode.trim()]
          .filter(Boolean)
          .join(", ")
      : "Location pending";
  const mapReady = Boolean(
    city.trim() && stateValue.trim() && latitude.trim() && longitude.trim(),
  );
  const mapStatusLabel = mapReady ? "Map ready" : "Map location pending";
  const publicPreviewBio =
    bio.trim() ||
    "Your customer-facing bio will appear here once added. Share how you care for pets, what makes you trustworthy, and the kind of families you are best suited to help.";
  const enabledServiceRates = serviceRates.filter((service) => service.is_enabled);
  const firstPricedService = enabledServiceRates.find(
    (service) => service.rate_unit === "custom" || service.rate_amount.trim(),
  );
  const publicPreviewRate = firstPricedService
    ? firstPricedService.rate_unit === "custom"
      ? "Custom quote"
      : `$${firstPricedService.rate_amount}/${formatRateUnitLabel(
          firstPricedService.rate_unit,
        ).replace("Per ", "")}`
    : hourlyRate.trim()
      ? `$${hourlyRate.trim()}/hr`
      : "Rate pending";

  const publicProfileHref = `/guru/${publicPreviewSlug}`;

  if (loading) {
    return <GuruProfileLoadingFallback />;
  }

  return (
    <main
      className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_40%,#ecfdf5_100%)] font-light !text-slate-950"
      style={{
        fontFamily:
          '"Open Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontWeight: 300,
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2.25rem] border border-emerald-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="grid gap-8 bg-[radial-gradient(circle_at_78%_20%,rgba(255,255,255,0.95),transparent_18%),linear-gradient(120deg,#00d69f_0%,#66e3c7_48%,#b8e5ff_100%)] px-6 py-8 md:px-10 md:py-12 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
            <div>
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <Link
                  href={routes.dashboard}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white/85 px-4 py-2 text-sm font-extrabold !text-slate-950 shadow-sm ring-1 ring-white/70 transition hover:bg-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Guru Dashboard
                </Link>

                <span className="inline-flex items-center gap-2 rounded-2xl bg-white/80 px-4 py-2 text-sm font-extrabold text-emerald-800 shadow-sm ring-1 ring-white/70">
                  <ShieldCheck className="h-4 w-4" />
                  {activeStep === "1"
                    ? "Step 1 Profile Builder"
                    : activeStep === "2"
                      ? "Step 2 Service Area"
                      : "Step 3 Services & Public Request"}
                </span>

                {isGuruAcademyGraduate ? (
                  <span className="inline-flex items-center gap-2 rounded-2xl bg-white/90 px-4 py-2 text-sm font-extrabold text-emerald-800 shadow-sm ring-1 ring-white/70">
                    🎓 Guru Academy Graduate
                  </span>
                ) : null}
              </div>

              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-800 shadow-sm ring-1 ring-white/70">
                <ShieldCheck className="h-4 w-4" />
                Guided Profile Builder
              </div>

              <h1
                className="max-w-4xl text-4xl font-extrabold tracking-[-0.045em] !text-slate-950 md:text-6xl lg:text-7xl"
                style={{ color: "#07112f" }}
              >
                {activeStep === "1"
                  ? "Step 1: Complete your Guru profile"
                  : activeStep === "2"
                    ? "Step 2: Set your service area"
                    : "Step 3: Add services, pricing, and public request"}
              </h1>

              <p
                className="mt-5 max-w-3xl text-base font-semibold leading-8 !text-slate-800 md:text-xl"
                style={{ color: "#1f2937" }}
              >
                Only this step is shown so you can focus. Save when finished, and
                SitGuru will return you to the dashboard so you can see this step
                turn green and know exactly what to do next.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="inline-flex min-w-[150px] items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-extrabold text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-60"
                >
                  {uploadingPhoto ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                  Upload photo
                </button>

                <Link
                  href={publicProfileHref}
                  className="inline-flex min-w-[150px] items-center justify-center rounded-2xl bg-white/90 px-6 py-4 text-sm font-extrabold !text-slate-950 shadow-sm ring-1 ring-white/80 transition hover:-translate-y-0.5 hover:bg-white"
                >
                  Preview profile
                </Link>

                <Link
                  href={routes.messages}
                  className="inline-flex min-w-[150px] items-center justify-center rounded-2xl bg-white/90 px-6 py-4 text-sm font-extrabold !text-slate-950 shadow-sm ring-1 ring-white/80 transition hover:-translate-y-0.5 hover:bg-white"
                >
                  Messages
                </Link>
              </div>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-white/30 blur-xl" />
                <div className="relative flex h-44 w-44 items-center justify-center overflow-hidden rounded-full border-[8px] border-white bg-gradient-to-br from-emerald-50 to-white text-5xl font-extrabold text-emerald-700 shadow-2xl md:h-56 md:w-56">
                  {profilePhotoUrl ? (
                    <Image
                      src={profilePhotoUrl}
                      alt={`${publicPreviewName} profile photo`}
                      fill
                      sizes="224px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    publicPreviewName.charAt(0).toUpperCase()
                  )}
                </div>

                {isGuruAcademyGraduate ? (
                  <div className="absolute -left-3 top-2 z-20 flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-white bg-white shadow-[0_10px_24px_rgba(15,23,42,0.16)]">
                    <Image
                      src={CERTIFIED_GURU_BADGE_PATH}
                      alt="Certified Guru badge"
                      width={48}
                      height={48}
                      className="h-12 w-12 object-contain"
                      unoptimized
                    />
                  </div>
                ) : null}

                <div className="absolute -bottom-2 -right-2 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-emerald-500 text-2xl shadow-lg">
                  🐾
                </div>
              </div>

              {isGuruAcademyGraduate ? (
                <div className="mt-4 rounded-2xl border border-white/80 bg-white/90 px-4 py-2 text-center shadow-sm">
                  <p className="text-sm font-black text-emerald-800">
                    Guru Academy Graduate
                  </p>
                  <p className="text-xs font-bold text-slate-600">
                    Completed through SitGuru University
                  </p>
                </div>
              ) : null}

              <h2
                className="mt-6 text-3xl font-extrabold tracking-tight !text-slate-950 md:text-4xl"
                style={{ color: "#07112f" }}
              >
                {publicPreviewName}
              </h2>
              <p
                className="mt-2 text-lg font-semibold !text-slate-700"
                style={{ color: "#334155" }}
              >
                {publicPreviewHeadline}
              </p>
              <p
                className="mt-1 max-w-xs text-sm font-semibold leading-6 !text-slate-600"
                style={{ color: "#475569" }}
              >
                {publicPreviewLocation}
              </p>
            </div>
          </div>

          <div className="grid gap-4 bg-white px-6 py-6 md:grid-cols-5 md:px-8">
            {[
              { label: "Complete", value: `${completionPercent}%`, icon: "⭐" },
              { label: "Services", value: services.length, icon: "🐾" },
              {
                label: "Public",
                value: effectivePublicStatus ? "Yes" : "No",
                icon: "👀",
              },
              { label: "Rate", value: publicPreviewRate, icon: "💚" },
              {
                label: "Map",
                value: mapReady ? "Ready" : "Pending",
                icon: "🗺️",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold !text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-2 text-3xl font-extrabold !text-slate-950">
                      {item.value}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-xl ring-1 ring-emerald-100">
                    {item.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <input
          ref={photoInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={handlePhotoUpload}
        />

        {!!errorMessage && (
          <div className="mt-6 rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-rose-800 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
              <div>
                <p className="font-extrabold text-rose-900">Profile error</p>
                <p className="mt-1 text-sm font-semibold leading-6">
                  {errorMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {!!successMessage && (
          <div className="mt-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800 shadow-sm">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div>
                <p className="font-extrabold text-emerald-900">Success</p>
                <p className="mt-1 text-sm font-semibold leading-6">
                  {successMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
                    Step {activeStep} of 3
                  </p>
                  <h2 className="mt-2 text-3xl font-extrabold tracking-tight !text-slate-950">
                    {activeStep === "1"
                      ? "Complete your Guru profile"
                      : activeStep === "2"
                        ? "Set your service area"
                        : "Add services, pricing, and public request"}
                  </h2>
                  <p className="mt-2 text-sm font-semibold leading-6 !text-slate-600">
                    Complete the fields on this single step, save, then return to
                    the dashboard to see your progress and continue to the next
                    action.
                  </p>
                </div>

                <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-extrabold text-emerald-800 ring-1 ring-emerald-100">
                  {signedInEmail || "Guru account"}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {activeStep === "1" ? (
                  <section
                    id="profile"
                    className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5"
                  >
                    <div className="mb-5 rounded-[1.3rem] bg-[#07132f] px-5 py-4">
                      <p className="text-xs font-black uppercase tracking-[0.24em] !text-white/75">
                        Step 1
                      </p>
                      <h3 className="mt-1 text-2xl font-extrabold !text-white">
                        Complete your Guru profile
                      </h3>
                      <p className="mt-2 text-sm font-bold leading-6 !text-white/85">
                        Add your public name, headline, bio, experience, and
                        photo so pet parents understand who you are.
                      </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label
                          htmlFor="display_name"
                          className="mb-2 block text-sm font-extrabold !text-slate-950"
                        >
                          Display name
                        </label>
                        <input
                          id="display_name"
                          value={displayName}
                          onChange={(event) => setDisplayName(event.target.value)}
                          placeholder="Your public display name"
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-semibold !text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="slug"
                          className="mb-2 block text-sm font-extrabold !text-slate-950"
                        >
                          Public slug
                        </label>
                        <input
                          id="slug"
                          value={slug}
                          onChange={(event) =>
                            setSlug(slugify(event.target.value))
                          }
                          placeholder="your-public-slug"
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-semibold !text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="headline"
                          className="mb-2 block text-sm font-extrabold !text-slate-950"
                        >
                          Headline
                        </label>
                        <input
                          id="headline"
                          value={headline}
                          onChange={(event) => setHeadline(event.target.value)}
                          placeholder="Ex: Trusted Pet Care Guru"
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-semibold !text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="years_experience"
                          className="mb-2 block text-sm font-extrabold !text-slate-950"
                        >
                          Years of experience
                        </label>
                        <input
                          id="years_experience"
                          value={yearsExperience}
                          onChange={(event) =>
                            setYearsExperience(event.target.value)
                          }
                          placeholder="3"
                          inputMode="numeric"
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-semibold !text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label
                          htmlFor="bio"
                          className="mb-2 block text-sm font-extrabold !text-slate-950"
                        >
                          Bio
                        </label>
                        <textarea
                          id="bio"
                          value={bio}
                          onChange={(event) => setBio(event.target.value)}
                          rows={6}
                          placeholder="Tell pet parents who you are, how you care for pets, and why they can trust you."
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-semibold !text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-extrabold !text-slate-950">
                              Profile photo
                            </p>
                            <p className="mt-1 text-sm font-semibold !text-slate-600">
                              Upload a JPG, PNG, or WEBP photo. This becomes your
                              mini avatar across SitGuru.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => photoInputRef.current?.click()}
                            disabled={uploadingPhoto}
                            className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-slate-800 disabled:opacity-60"
                          >
                            {uploadingPhoto ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Camera className="h-4 w-4" />
                            )}
                            {uploadingPhoto ? "Uploading..." : "Upload photo"}
                          </button>
                        </div>

                        <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/60 p-4">
                          {profilePhotoUrl ? (
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                              <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-white shadow-sm ring-1 ring-emerald-100">
                                <Image
                                  src={profilePhotoUrl}
                                  alt="Guru profile preview"
                                  fill
                                  sizes="112px"
                                  className="object-cover"
                                  unoptimized
                                />
                                {isGuruAcademyGraduate ? (
                                  <div className="absolute left-1 top-1 z-10 flex h-9 w-9 items-center justify-center rounded-xl border-2 border-white bg-white shadow-sm">
                                    <Image
                                      src={CERTIFIED_GURU_BADGE_PATH}
                                      alt="Certified Guru badge"
                                      width={28}
                                      height={28}
                                      className="h-7 w-7 object-contain"
                                      unoptimized
                                    />
                                  </div>
                                ) : null}
                              </div>
                              <div>
                                <p className="text-sm font-extrabold !text-slate-950">
                                  Profile photo ready
                                </p>
                                {isGuruAcademyGraduate ? (
                                  <p className="mt-1 text-sm font-extrabold !text-emerald-800">
                                    Guru Academy Graduate badge will display on
                                    profile photos.
                                  </p>
                                ) : null}
                                <p className="mt-1 break-all text-sm font-semibold leading-6 !text-slate-700">
                                  {profilePhotoUrl}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 !text-slate-700">
                              <ImageIcon className="h-5 w-5 text-emerald-600" />
                              <span className="text-sm font-semibold">
                                No profile photo selected yet.
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label
                          htmlFor="profile_photo_url"
                          className="mb-2 block text-sm font-extrabold !text-slate-950"
                        >
                          Profile image URL
                        </label>
                        <input
                          id="profile_photo_url"
                          value={profilePhotoUrl}
                          onChange={(event) =>
                            setProfilePhotoUrl(event.target.value)
                          }
                          placeholder="https://..."
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-semibold !text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        />
                      </div>
                    </div>
                  </section>
                ) : null}

                {activeStep === "2" ? (
                  <section
                    id="location"
                    className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5"
                  >
                    <div className="mb-5 rounded-[1.3rem] bg-[linear-gradient(135deg,#0f766e_0%,#10b981_100%)] px-5 py-4">
                      <p className="text-xs font-black uppercase tracking-[0.24em] !text-white/75">
                        Step 2
                      </p>
                      <h3 className="mt-1 text-2xl font-extrabold !text-white">
                        Set your service area
                      </h3>
                      <p className="mt-2 text-sm font-bold leading-6 !text-white/85">
                        Add your ZIP code, city, state, service area, and travel
                        radius so SitGuru can match you with nearby pet parents.
                      </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label
                          htmlFor="city"
                          className="mb-2 block text-sm font-extrabold !text-slate-950"
                        >
                          City
                        </label>
                        <input
                          id="city"
                          value={city}
                          onChange={(event) => setCity(event.target.value)}
                          placeholder="Quakertown"
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-semibold !text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="state"
                          className="mb-2 block text-sm font-extrabold !text-slate-950"
                        >
                          State
                        </label>
                        <input
                          id="state"
                          value={stateValue}
                          onChange={(event) =>
                            setStateValue(event.target.value.toUpperCase())
                          }
                          placeholder="PA"
                          maxLength={2}
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-semibold !text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="zip_code"
                          className="mb-2 block text-sm font-extrabold !text-slate-950"
                        >
                          ZIP code
                        </label>
                        <input
                          id="zip_code"
                          value={zipCode}
                          onChange={(event) =>
                            handleZipCodeChange(event.target.value)
                          }
                          placeholder="18951"
                          inputMode="numeric"
                          maxLength={5}
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-semibold !text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        />
                        <p
                          className="mt-2 text-xs font-extrabold leading-6 !text-slate-700"
                          style={{
                            color: "#334155",
                            WebkitTextFillColor: "#334155",
                          }}
                        >
                          Enter a 5-digit ZIP code to auto-fill city, state, and
                          map coordinates.
                        </p>
                      </div>

                      <div>
                        <label
                          htmlFor="service_radius"
                          className="mb-2 block text-sm font-extrabold !text-slate-950"
                        >
                          How far are you willing to travel?
                        </label>
                        <input
                          id="service_radius"
                          value={serviceRadius}
                          onChange={(event) =>
                            setServiceRadius(event.target.value)
                          }
                          placeholder="25"
                          inputMode="decimal"
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-semibold !text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        />
                        <p
                          className="mt-2 text-xs font-extrabold leading-6 !text-slate-700"
                          style={{
                            color: "#334155",
                            WebkitTextFillColor: "#334155",
                          }}
                        >
                          Enter the number of miles you are comfortable traveling
                          from your service ZIP code. Customers outside this
                          radius will not be able to book you.
                        </p>
                      </div>

                      <div className="md:col-span-2">
                        <label
                          htmlFor="street_address"
                          className="mb-2 block text-sm font-extrabold !text-slate-950"
                        >
                          Service address or general area
                        </label>
                        <input
                          id="street_address"
                          value={streetAddress}
                          onChange={(event) =>
                            setStreetAddress(event.target.value)
                          }
                          placeholder="Optional. Used by Admin/map setup, not shown as your exact public address."
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-semibold !text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        />
                      </div>

                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-bold text-emerald-900 md:col-span-2">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <span>{mapStatusLabel}</span>
                          {zipLookupLoading ? (
                            <span className="inline-flex items-center gap-2 text-emerald-800">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Checking ZIP
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm font-semibold leading-6 text-emerald-800">
                          Gurus only enter ZIP, city, state, and service radius.
                          SitGuru saves map latitude and longitude privately
                          after ZIP lookup.
                        </p>
                        {zipLookupMessage ? (
                          <p className="mt-2 text-sm font-extrabold text-emerald-950">
                            {zipLookupMessage}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </section>
                ) : null}

                {activeStep === "3" ? (
                  <section
                    id="services"
                    className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5"
                  >
                    <div className="mb-5 rounded-[1.3rem] bg-[linear-gradient(135deg,#1d4ed8_0%,#0ea5e9_100%)] px-5 py-4">
                      <p className="text-xs font-black uppercase tracking-[0.24em] !text-white/75">
                        Step 3
                      </p>
                      <h3 className="mt-1 text-2xl font-extrabold !text-white">
                        Add services, pricing, and public request
                      </h3>
                      <p className="mt-2 text-sm font-bold leading-6 !text-white/85">
                        Enable the services you offer, set pricing, then request
                        public visibility once Steps 1, 2, and 3 are complete.
                      </p>
                    </div>

                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-sm font-extrabold !text-slate-950">
                          Services & rates
                        </p>
                        <p className="mt-1 text-sm font-semibold leading-6 !text-slate-600">
                          Enable each service you offer, then choose the pricing
                          parameter customers should see and bookings should use.
                        </p>
                      </div>
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-800">
                        {enabledServiceRates.length} enabled
                      </span>
                    </div>

                    <div className="space-y-4">
                      {serviceRates.map((service) => {
                        const active = service.is_enabled;
                        const config = SERVICE_RATE_CONFIGS.find(
                          (item) => item.service_key === service.service_key,
                        );
                        const recommendedUnits =
                          config?.recommended_units || [service.rate_unit];

                        return (
                          <div
                            key={service.service_key}
                            className={`rounded-[1.4rem] border p-4 transition ${
                              active
                                ? "border-emerald-200 bg-emerald-50/70 shadow-sm"
                                : "border-slate-200 bg-slate-50"
                            }`}
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <button
                                type="button"
                                onClick={() => toggleService(service.service_label)}
                                className={`inline-flex items-center justify-center rounded-2xl border px-4 py-3 text-sm font-extrabold transition sm:min-w-[210px] ${
                                  active
                                    ? "border-emerald-500 bg-emerald-600 shadow-sm"
                                    : "border-slate-300 bg-white shadow-sm hover:border-emerald-200 hover:bg-emerald-50"
                                }`}
                                style={{
                                  color: active ? "#ffffff" : "#0f172a",
                                  WebkitTextFillColor: active
                                    ? "#ffffff"
                                    : "#0f172a",
                                }}
                              >
                                <span
                                  className="font-extrabold"
                                  style={{
                                    color: active ? "#ffffff" : "#0f172a",
                                    WebkitTextFillColor: active
                                      ? "#ffffff"
                                      : "#0f172a",
                                  }}
                                >
                                  {active ? "Enabled" : "Enable"} ·{" "}
                                  {service.service_label}
                                </span>
                              </button>

                              <div className="flex flex-wrap gap-2 text-xs font-extrabold text-slate-600">
                                {recommendedUnits.slice(0, 3).map((unit) => (
                                  <span
                                    key={unit}
                                    className="rounded-full border border-white bg-white px-3 py-1 font-extrabold shadow-sm"
                                    style={{
                                      color: "#065f46",
                                      WebkitTextFillColor: "#065f46",
                                    }}
                                  >
                                    {formatRateUnitLabel(unit)}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {active ? (
                              <div className="mt-4 grid gap-3 md:grid-cols-[0.75fr_1fr_0.75fr]">
                                <div>
                                  <label className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] !text-slate-700">
                                    Rate amount
                                  </label>
                                  <input
                                    value={service.rate_amount}
                                    onChange={(event) =>
                                      updateServiceRate(
                                        service.service_key,
                                        "rate_amount",
                                        event.target.value,
                                      )
                                    }
                                    placeholder={
                                      service.rate_unit === "custom"
                                        ? "Custom"
                                        : "25"
                                    }
                                    inputMode="decimal"
                                    disabled={service.rate_unit === "custom"}
                                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold !text-slate-950 placeholder:text-slate-400 outline-none transition disabled:bg-slate-100 disabled:text-slate-500 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                                  />
                                </div>

                                <div>
                                  <label className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] !text-slate-700">
                                    Rate parameter
                                  </label>
                                  <select
                                    value={service.rate_unit}
                                    onChange={(event) =>
                                      updateServiceRate(
                                        service.service_key,
                                        "rate_unit",
                                        event.target.value,
                                      )
                                    }
                                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold !text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                                  >
                                    {RATE_UNIT_OPTIONS.map((option) => (
                                      <option
                                        key={option.value}
                                        value={option.value}
                                      >
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] !text-slate-700">
                                    Duration minutes
                                  </label>
                                  <input
                                    value={service.duration_minutes}
                                    onChange={(event) =>
                                      updateServiceRate(
                                        service.service_key,
                                        "duration_minutes",
                                        event.target.value,
                                      )
                                    }
                                    placeholder="Optional"
                                    inputMode="numeric"
                                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold !text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                                  />
                                </div>

                                <div className="md:col-span-3">
                                  <label className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] !text-slate-700">
                                    Optional service notes
                                  </label>
                                  <input
                                    value={service.notes}
                                    onChange={(event) =>
                                      updateServiceRate(
                                        service.service_key,
                                        "notes",
                                        event.target.value,
                                      )
                                    }
                                    placeholder="Example: Includes feeding, water refresh, and quick photo update."
                                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold !text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                                  />
                                </div>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-5">
                      <label
                        htmlFor="hourly_rate"
                        className="mb-2 block text-sm font-extrabold !text-slate-950"
                      >
                        Base hourly rate
                      </label>
                      <input
                        id="hourly_rate"
                        value={hourlyRate}
                        onChange={(event) => setHourlyRate(event.target.value)}
                        placeholder="Optional standard hourly rate"
                        inputMode="decimal"
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-semibold !text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                      />
                      <p
                        className="mt-2 text-xs font-extrabold leading-6 !text-slate-700"
                        style={{
                          color: "#334155",
                          WebkitTextFillColor: "#334155",
                        }}
                      >
                        This is optional. Service-specific pricing above is what
                        customers should primarily see.
                      </p>
                    </div>

                    <section className="mt-5 rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5">
                      <p className="text-xs font-black uppercase tracking-[0.18em] !text-amber-800">
                        Step 3 final action
                      </p>

                      <label className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-white px-4 py-4 text-sm font-extrabold shadow-sm">
                        <input
                          type="checkbox"
                          checked={isPublic}
                          onChange={(event) => setIsPublic(event.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-emerald-300 text-emerald-600"
                        />
                        <span
                          className="font-extrabold leading-6"
                          style={{
                            color: "#0f172a",
                            WebkitTextFillColor: "#0f172a",
                          }}
                        >
                          Request to make this Guru profile public after Steps 1,
                          2, and 3 are complete
                        </span>
                      </label>

                      <div
                        className={`mt-4 rounded-2xl border px-4 py-4 text-sm font-bold leading-6 ${
                          publicProfileReady
                            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                            : "border-rose-200 bg-rose-50 text-rose-900"
                        }`}
                      >
                        {publicProfileReady ? (
                          <p>
                            Steps 1, 2, and 3 are complete. If you request
                            public visibility and save, this profile can be
                            marked public. Booking eligibility may still depend
                            on Step 4 Trust & Safety Screening, Step 5 Stripe
                            payouts, and Admin approval.
                          </p>
                        ) : (
                          <>
                            <p className="font-extrabold">
                              This profile will stay private until the missing
                              setup items are completed.
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {missingItems.map((item) => (
                                <span
                                  key={item}
                                  className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-rose-800 ring-1 ring-rose-200"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </section>
                  </section>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    disabled={saving}
                    className={[
                      "inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-extrabold shadow-lg transition disabled:cursor-not-allowed disabled:opacity-70",
                      justSaved
                        ? "bg-emerald-700 shadow-emerald-700/20"
                        : "bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-700",
                    ].join(" ")}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    ) : justSaved ? (
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    ) : (
                      <Save className="h-4 w-4 text-white" />
                    )}

                    <span
                      className="font-extrabold"
                      style={{
                        color: "#ffffff",
                        WebkitTextFillColor: "#ffffff",
                      }}
                    >
                      {saving
                        ? "Saving..."
                        : justSaved
                          ? "Saved"
                          : `Save Step ${activeStep} & Return to Dashboard`}
                    </span>
                  </button>

                  <Link
                    href={routes.dashboard}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-4 text-sm font-extrabold shadow-sm transition hover:bg-slate-50"
                  >
                    <span
                      className="font-extrabold"
                      style={{
                        color: "#0f172a",
                        WebkitTextFillColor: "#0f172a",
                      }}
                    >
                      Return to Dashboard
                    </span>
                  </Link>

                  {activeStep !== "3" ? (
                    <Link
                      href={`/guru/dashboard/profile?step=${Number(activeStep) + 1}`}
                      className="inline-flex items-center justify-center rounded-2xl border border-emerald-300 bg-emerald-50 px-6 py-4 text-sm font-extrabold shadow-sm transition hover:bg-emerald-100"
                    >
                      <span
                        className="font-extrabold"
                        style={{
                          color: "#065f46",
                          WebkitTextFillColor: "#065f46",
                        }}
                      >
                        Preview Step {Number(activeStep) + 1} →
                      </span>
                    </Link>
                  ) : null}
                </div>
              </form>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-[2rem] border border-emerald-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-emerald-600" />
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">
                  Profile strength
                </p>
              </div>

              <div className="mt-4 flex items-end justify-between gap-4">
                <p className="text-5xl font-extrabold tracking-tight !text-slate-950">
                  {completionPercent}%
                </p>
                <p className="text-sm font-extrabold !text-slate-600">
                  {missingItems.length === 0 ? "Complete" : "Needs updates"}
                </p>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-emerald-50 ring-1 ring-emerald-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>

              {missingItems.length > 0 ? (
                <div className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-sm font-extrabold !text-slate-950">
                    Finish these next
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {missingItems.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-white px-3 py-1 text-xs font-extrabold !text-slate-700 ring-1 ring-slate-200"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-extrabold text-emerald-800 ring-1 ring-emerald-100">
                  Steps 1, 2, and 3 are complete. Your profile is ready for
                  customer confidence and Guru recognition.
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <UserCircle2 className="h-5 w-5 text-emerald-600" />
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">
                  Customer preview
                </p>
              </div>

              <h2 className="mt-3 text-2xl font-extrabold tracking-tight !text-slate-950">
                How your public profile can present
              </h2>

              <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start gap-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-white bg-emerald-50 shadow-sm ring-1 ring-emerald-100">
                    {profilePhotoUrl ? (
                      <Image
                        src={profilePhotoUrl}
                        alt="Profile preview"
                        fill
                        sizes="80px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <UserCircle2 className="h-9 w-9 text-emerald-600" />
                      </div>
                    )}

                    {isGuruAcademyGraduate ? (
                      <div className="absolute left-0.5 top-0.5 z-10 flex h-7 w-7 items-center justify-center rounded-lg border-2 border-white bg-white shadow-sm">
                        <Image
                          src={CERTIFIED_GURU_BADGE_PATH}
                          alt="Certified Guru badge"
                          width={22}
                          height={22}
                          className="h-[22px] w-[22px] object-contain"
                          unoptimized
                        />
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <p className="text-2xl font-extrabold !text-slate-950">
                      {publicPreviewName}
                    </p>
                    <p className="mt-1 text-base font-extrabold !text-slate-700">
                      {publicPreviewHeadline}
                    </p>
                    <p className="mt-1 text-sm font-semibold !text-slate-500">
                      {publicPreviewLocation}
                    </p>
                    {isGuruAcademyGraduate ? (
                      <p className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800 ring-1 ring-emerald-100">
                        🎓 Guru Academy Graduate
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">
                      Rate
                    </p>
                    <p className="mt-2 text-lg font-extrabold !text-slate-950">
                      {publicPreviewRate}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">
                      Slug
                    </p>
                    <p className="mt-2 break-all text-lg font-extrabold !text-slate-950">
                      /guru/{publicPreviewSlug}
                    </p>
                  </div>
                </div>

                <p className="mt-5 text-sm font-semibold leading-7 !text-slate-700">
                  {publicPreviewBio}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {enabledServiceRates.length > 0 ? (
                    enabledServiceRates.map((service) => (
                      <span
                        key={service.service_key}
                        className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-800"
                      >
                        {service.service_label}:{" "}
                        {service.rate_unit === "custom"
                          ? "Custom quote"
                          : service.rate_amount.trim()
                            ? `$${service.rate_amount} ${formatRateUnitLabel(
                                service.rate_unit,
                              ).toLowerCase()}`
                            : formatRateUnitLabel(service.rate_unit)}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-extrabold !text-slate-500">
                      No services selected yet
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={publicProfileHref}
                  className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-emerald-700"
                >
                  Preview Customer Guru Page
                </Link>

                <Link
                  href={routes.dashboard}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-extrabold shadow-sm transition hover:bg-slate-50"
                  style={{ color: "#0f172a", WebkitTextFillColor: "#0f172a" }}
                >
                  <span
                    className="font-extrabold"
                    style={{ color: "#0f172a", WebkitTextFillColor: "#0f172a" }}
                  >
                    Return to Dashboard
                  </span>
                </Link>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">
                Admin visibility
              </p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight !text-slate-950">
                What Admin should also be able to see
              </h2>

              <div className="mt-6 space-y-3">
                {[
                  "Updated Step 1 profile details and public title",
                  "Updated Step 2 location, service ZIP, and travel radius",
                  "Updated Step 3 service selections and service-specific rates",
                  "Photo, bio, and profile completion data",
                  "Customer-facing visibility only when setup requirements are met",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-extrabold !text-slate-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">
                Why this matters
              </p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight !text-slate-950">
                Better profile data strengthens the marketplace
              </h2>
              <p className="mt-3 text-sm font-semibold leading-7 !text-slate-700">
                The stronger your Guru profile is, the better it can perform for
                customer trust, search visibility, and Admin operations. This
                page is one of the core pieces powering the Guru side of
                SitGuru.
              </p>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function GuruDashboardProfilePage() {
  return (
    <Suspense fallback={<GuruProfileLoadingFallback />}>
      <GuruDashboardProfilePageContent />
    </Suspense>
  );
}