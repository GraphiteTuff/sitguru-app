"use client";

import Link from "next/link";
import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  hourly_rate?: number | null;
  rate?: number | null;
  years_experience?: number | null;
  experience_years?: number | null;
  profile_photo_url?: string | null;
  image_url?: string | null;
  services?: string[] | string | null;
  is_public?: boolean | null;
  onboarding_completed?: boolean | null;
  profile_completed?: boolean | null;
};

const SERVICE_OPTIONS = [
  "Pet Sitting",
  "Dog Walking",
  "Boarding",
  "Drop-In Care",
  "House Sitting",
  "Training",
  "Pet Taxi",
  "Medication Help",
];

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

export default function GuruDashboardProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
  const [hourlyRate, setHourlyRate] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        setLoading(true);
        setErrorMessage("");
        setSuccessMessage("");

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (authError || !user) {
          router.replace("/guru/login");
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

        const { data, error } = await supabase
          .from("gurus")
          .select(
            "id, user_id, display_name, full_name, slug, bio, city, state, hourly_rate, rate, profile_photo_url, image_url, headline, years_experience, experience_years, services, is_public, onboarding_completed, profile_completed"
          )
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
          setHourlyRate("");
          setYearsExperience("");
          setProfilePhotoUrl("");
          setServices([]);
          setIsPublic(false);
          setErrorMessage(
            `We could not read an existing guru profile yet: ${stringifyError(error)}`
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
          setHourlyRate("");
          setYearsExperience("");
          setProfilePhotoUrl("");
          setServices([]);
          setIsPublic(false);
          setLoading(false);
          return;
        }

        setProfileExists(true);
        setExistingProfileId(profile.id ?? "");
        setDisplayName(profile.display_name || profile.full_name || fallbackDisplayName);
        setSlug(profile.slug || fallbackSlug);
        setHeadline(profile.headline || "");
        setBio(profile.bio || "");
        setCity(profile.city || "");
        setStateValue(profile.state || "");
        setHourlyRate(
          profile.hourly_rate !== null && profile.hourly_rate !== undefined
            ? String(profile.hourly_rate)
            : profile.rate !== null && profile.rate !== undefined
              ? String(profile.rate)
              : ""
        );
        setYearsExperience(
          profile.years_experience !== null && profile.years_experience !== undefined
            ? String(profile.years_experience)
            : profile.experience_years !== null &&
                profile.experience_years !== undefined
              ? String(profile.experience_years)
              : ""
        );
        setProfilePhotoUrl(profile.profile_photo_url || profile.image_url || "");
        setServices(normalizeServices(profile.services));
        setIsPublic(Boolean(profile.is_public));
        setLoading(false);
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(`Could not load your guru profile: ${stringifyError(error)}`);
        setLoading(false);
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [router]);

  function toggleService(service: string) {
    setServices((current) =>
      current.includes(service)
        ? current.filter((item) => item !== service)
        : [...current, service]
    );
  }

  async function handlePhotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    setUploadingPhoto(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${userId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("guru-profile-photos")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        setErrorMessage(uploadError.message || "Could not upload photo.");
        setUploadingPhoto(false);
        return;
      }

      const { data } = supabase.storage
        .from("guru-profile-photos")
        .getPublicUrl(filePath);

      setProfilePhotoUrl(data.publicUrl);
      setUploadingPhoto(false);
      setSuccessMessage("Photo uploaded. Save profile to publish changes.");
    } catch (error) {
      setErrorMessage(`Could not upload photo: ${stringifyError(error)}`);
      setUploadingPhoto(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !userId) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const cleanDisplayName = displayName.trim();
    const cleanSlug = slugify(slug || displayName);
    const cleanHeadline = headline.trim();
    const cleanBio = bio.trim();
    const cleanCity = city.trim();
    const cleanState = stateValue.trim().toUpperCase();
    const cleanPhotoUrl = profilePhotoUrl.trim();
    const cleanServices = normalizeServices(services);

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
      setErrorMessage("Years of experience must be a valid non-negative number.");
      setSaving(false);
      return;
    }

    const onboardingCompleted =
      Boolean(cleanDisplayName) &&
      Boolean(cleanSlug) &&
      Boolean(cleanBio) &&
      Boolean(cleanCity) &&
      Boolean(cleanState) &&
      Boolean(cleanPhotoUrl) &&
      cleanServices.length > 0;

    const payload = {
      user_id: userId,
      display_name: cleanDisplayName,
      full_name: cleanDisplayName,
      slug: cleanSlug,
      headline: cleanHeadline || null,
      bio: cleanBio || null,
      city: cleanCity || null,
      state: cleanState || null,
      hourly_rate: parsedRate,
      rate: parsedRate,
      years_experience: parsedExperience,
      experience_years: parsedExperience,
      profile_photo_url: cleanPhotoUrl || null,
      image_url: cleanPhotoUrl || null,
      services: cleanServices,
      is_public: isPublic,
      onboarding_completed: onboardingCompleted,
      profile_completed: onboardingCompleted,
    };

    try {
      if (profileExists) {
        const { error: updateError } = await supabase
          .from("gurus")
          .update(payload)
          .eq("user_id", userId);

        if (updateError) {
          setErrorMessage(updateError.message || "Could not save your guru profile.");
          setSaving(false);
          return;
        }
      } else {
        const { error: insertError } = await supabase.from("gurus").insert(payload);

        if (insertError) {
          setErrorMessage(
            insertError.message ||
              "Could not create your guru profile. This account may not yet have permission to insert its own guru row."
          );
          setSaving(false);
          return;
        }

        setProfileExists(true);
      }

      const { data: freshRows, error: refreshError } = await supabase
        .from("gurus")
        .select(
          "id, user_id, display_name, full_name, slug, bio, city, state, hourly_rate, rate, profile_photo_url, image_url, headline, years_experience, experience_years, services, is_public, onboarding_completed, profile_completed"
        )
        .eq("user_id", userId)
        .limit(1);

      if (refreshError) {
        setErrorMessage(
          `Profile saved, but reloading the latest row failed: ${refreshError.message}`
        );
        setSaving(false);
        router.refresh();
        return;
      }

      const refreshed = (freshRows?.[0] as GuruProfile | undefined) ?? null;

      if (refreshed) {
        setExistingProfileId(refreshed.id ?? existingProfileId);
        setProfileExists(true);
        setDisplayName(refreshed.display_name || refreshed.full_name || cleanDisplayName);
        setSlug(refreshed.slug || cleanSlug);
        setHeadline(refreshed.headline || "");
        setBio(refreshed.bio || "");
        setCity(refreshed.city || "");
        setStateValue(refreshed.state || "");
        setHourlyRate(
          refreshed.hourly_rate !== null && refreshed.hourly_rate !== undefined
            ? String(refreshed.hourly_rate)
            : refreshed.rate !== null && refreshed.rate !== undefined
              ? String(refreshed.rate)
              : ""
        );
        setYearsExperience(
          refreshed.years_experience !== null &&
            refreshed.years_experience !== undefined
            ? String(refreshed.years_experience)
            : refreshed.experience_years !== null &&
                refreshed.experience_years !== undefined
              ? String(refreshed.experience_years)
              : ""
        );
        setProfilePhotoUrl(refreshed.profile_photo_url || refreshed.image_url || "");
        setServices(normalizeServices(refreshed.services));
        setIsPublic(Boolean(refreshed.is_public));
      } else {
        setSlug(cleanSlug);
        setServices(cleanServices);
      }

      setSuccessMessage("Guru profile saved successfully.");
      setSaving(false);
      router.refresh();
    } catch (error) {
      setErrorMessage(`Could not save your guru profile: ${stringifyError(error)}`);
      setSaving(false);
    }
  }

  const completionPercent = useMemo(() => {
    const checks = [
      Boolean(displayName.trim()),
      Boolean(slugify(slug || displayName)),
      Boolean(headline.trim()),
      Boolean(bio.trim()),
      Boolean(city.trim()),
      Boolean(stateValue.trim()),
      Boolean(profilePhotoUrl.trim()),
      services.length > 0,
    ];

    const completeCount = checks.filter(Boolean).length;
    return Math.max(10, Math.round((completeCount / checks.length) * 100));
  }, [displayName, slug, headline, bio, city, stateValue, profilePhotoUrl, services]);

  const publicPreviewName = displayName.trim() || "Your Guru Name";
  const publicPreviewSlug = slugify(slug || displayName || "guru");
  const publicPreviewHeadline = headline.trim() || "Trusted Pet Care Guru";
  const publicPreviewLocation =
    city.trim() || stateValue.trim()
      ? [city.trim(), stateValue.trim()].filter(Boolean).join(", ")
      : "Location pending";
  const publicPreviewBio =
    bio.trim() ||
    "Your customer-facing bio will appear here once added. This is where pet parents begin deciding whether they trust you and whether you feel like the right fit.";
  const publicPreviewRate = hourlyRate.trim()
    ? `$${hourlyRate.trim()}/hr`
    : "Rate pending";

  const publicProfileHref = `/gurus/${publicPreviewSlug}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_28%),linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-4 py-10 text-white">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-white/15 bg-white/[0.07] p-8 backdrop-blur-sm">
          <div className="flex items-center gap-3 text-slate-200">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading guru profile...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_28%),linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[32px] border border-white/15 bg-gradient-to-br from-emerald-500/12 via-slate-950 to-sky-500/12 p-6 shadow-[0_12px_60px_rgba(0,0,0,0.28)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4">
                <Link
                  href="/guru/dashboard"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.10]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Guru Dashboard
                </Link>
              </div>

              <div className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300">
                Guru Profile Editor
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                Update the profile customers will see
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
                This page controls the public-facing Guru information that can be
                shown to customers and referenced by Admin. Keep your profile
                clear, modern, and trustworthy so your marketplace presence stays
                strong.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                  Customer-facing display
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                  Admin-visible updates
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                  Marketplace-ready profile
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:w-[360px] lg:grid-cols-1">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-300" />
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                    Signed in
                  </p>
                </div>
                <p className="mt-3 break-all text-lg font-bold text-white">
                  {signedInEmail || "Guru account"}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Your updates here should feed your Guru dashboard, customer
                  display, and admin visibility.
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-emerald-300" />
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                    Completion
                  </p>
                </div>
                <div className="mt-3 flex items-end justify-between gap-4">
                  <p className="text-3xl font-black text-white">{completionPercent}%</p>
                  <p className="text-sm font-medium text-slate-300">Profile strength</p>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {!!errorMessage && (
          <div className="rounded-[24px] border border-rose-400/20 bg-rose-500/10 px-5 py-4 text-rose-100">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
              <div>
                <p className="font-semibold text-white">Profile error</p>
                <p className="mt-1 text-sm leading-6 text-rose-100">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {!!successMessage && (
          <div className="rounded-[24px] border border-emerald-400/20 bg-emerald-500/10 px-5 py-4 text-emerald-100">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
              <div>
                <p className="font-semibold text-white">Success</p>
                <p className="mt-1 text-sm leading-6 text-emerald-100">
                  {successMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                Edit profile
              </p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                Keep your Guru profile current
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="display_name"
                    className="mb-2 block text-sm font-semibold text-slate-200"
                  >
                    Display name
                  </label>
                  <input
                    id="display_name"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Your public display name"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="slug"
                    className="mb-2 block text-sm font-semibold text-slate-200"
                  >
                    Public slug
                  </label>
                  <input
                    id="slug"
                    value={slug}
                    onChange={(event) => setSlug(slugify(event.target.value))}
                    placeholder="your-public-slug"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="headline"
                    className="mb-2 block text-sm font-semibold text-slate-200"
                  >
                    Headline
                  </label>
                  <input
                    id="headline"
                    value={headline}
                    onChange={(event) => setHeadline(event.target.value)}
                    placeholder="Ex: Trusted Pet Care Guru"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="hourly_rate"
                    className="mb-2 block text-sm font-semibold text-slate-200"
                  >
                    Hourly rate
                  </label>
                  <input
                    id="hourly_rate"
                    value={hourlyRate}
                    onChange={(event) => setHourlyRate(event.target.value)}
                    placeholder="45"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="city"
                    className="mb-2 block text-sm font-semibold text-slate-200"
                  >
                    City
                  </label>
                  <input
                    id="city"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    placeholder="Quakertown"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="state"
                    className="mb-2 block text-sm font-semibold text-slate-200"
                  >
                    State
                  </label>
                  <input
                    id="state"
                    value={stateValue}
                    onChange={(event) => setStateValue(event.target.value.toUpperCase())}
                    placeholder="PA"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="years_experience"
                    className="mb-2 block text-sm font-semibold text-slate-200"
                  >
                    Years of experience
                  </label>
                  <input
                    id="years_experience"
                    value={yearsExperience}
                    onChange={(event) => setYearsExperience(event.target.value)}
                    placeholder="3"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="profile_photo_url"
                    className="mb-2 block text-sm font-semibold text-slate-200"
                  >
                    Profile image URL
                  </label>
                  <input
                    id="profile_photo_url"
                    value={profilePhotoUrl}
                    onChange={(event) => setProfilePhotoUrl(event.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="bio"
                  className="mb-2 block text-sm font-semibold text-slate-200"
                >
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  rows={6}
                  placeholder="Tell pet parents who you are, how you care for pets, and why they can trust you."
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-slate-200">Profile photo</p>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10">
                    {uploadingPhoto ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                    Upload photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </label>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-slate-950/40 p-4">
                  {profilePhotoUrl ? (
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="relative h-28 w-28 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                        <Image
                          src={profilePhotoUrl}
                          alt="Guru profile preview"
                          fill
                          sizes="112px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          Profile photo ready
                        </p>
                        <p className="mt-1 break-all text-sm leading-6 text-slate-300">
                          {profilePhotoUrl}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-slate-300">
                      <ImageIcon className="h-5 w-5" />
                      No profile photo selected yet.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold text-slate-200">Services</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {SERVICE_OPTIONS.map((service) => {
                    const active = services.includes(service);

                    return (
                      <button
                        key={service}
                        type="button"
                        onClick={() => toggleService(service)}
                        className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                          active
                            ? "border-emerald-400/30 bg-emerald-500/10 text-white"
                            : "border-white/10 bg-slate-950/40 text-slate-200 hover:bg-white/5"
                        }`}
                      >
                        {service}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-4 text-sm font-medium text-slate-200">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(event) => setIsPublic(event.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-slate-900 text-emerald-500"
                />
                Make this Guru profile public and customer-facing
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Guru Profile
                </button>

                <Link
                  href="/guru/dashboard"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </section>

          <section className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3">
                <UserCircle2 className="h-5 w-5 text-emerald-300" />
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                  Customer preview
                </p>
              </div>

              <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                How your public profile can present
              </h2>

              <div className="mt-6 rounded-[24px] border border-white/10 bg-slate-950/40 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                  Public profile
                </p>

                <div className="mt-4 flex items-start gap-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    {profilePhotoUrl ? (
                      <Image
                        src={profilePhotoUrl}
                        alt="Profile preview"
                        fill
                        sizes="64px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <UserCircle2 className="h-8 w-8 text-slate-400" />
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-2xl font-black text-white">{publicPreviewName}</p>
                    <p className="mt-1 text-base font-semibold text-slate-200">
                      {publicPreviewHeadline}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">{publicPreviewLocation}</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                      Rate
                    </p>
                    <p className="mt-2 text-lg font-bold text-white">{publicPreviewRate}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                      Slug
                    </p>
                    <p className="mt-2 text-lg font-bold text-white">
                      /gurus/{publicPreviewSlug}
                    </p>
                  </div>
                </div>

                <p className="mt-5 text-sm leading-7 text-slate-300">
                  {publicPreviewBio}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {services.length > 0 ? (
                    services.map((service) => (
                      <span
                        key={service}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200"
                      >
                        {service}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-400">
                      No services selected yet
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={publicProfileHref}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Preview Customer Guru Page
                </Link>

                <Link
                  href="/guru/dashboard"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                Admin visibility
              </p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                What Admin should also be able to see
              </h2>

              <div className="mt-6 space-y-3">
                {[
                  "Updated display name and public title",
                  "Location, pricing, and years of experience",
                  "Service selections and profile visibility status",
                  "Photo, bio, and profile completion data",
                  "Customer-facing profile updates tied to your Guru record",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[18px] border border-white/10 bg-slate-950/40 px-4 py-4 text-sm font-medium text-slate-200"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-emerald-400/20 bg-[linear-gradient(135deg,rgba(5,150,105,0.14),rgba(15,23,42,0.78))] p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                Why this matters
              </p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                Better profile data strengthens the marketplace
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                The stronger your Guru profile is, the better it can perform for
                customer trust, search visibility, and admin operations. This page
                is one of the core pieces powering the Guru side of SitGuru.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}