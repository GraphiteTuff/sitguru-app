"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { geocodeAddress } from "@/lib/geocodeAddress";

type ProfileRow = {
  id: string;
  role?: string | null;
  account_type?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

type SitterRow = {
  id: string;
  profile_id?: string | null;
  slug?: string | null;
  full_name?: string | null;
  title?: string | null;
  bio?: string | null;
  city?: string | null;
  state?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rate?: number | null;
  experience_years?: number | null;
  is_verified?: boolean | null;
  is_active?: boolean | null;
  services?: string[] | null;
  image_url?: string | null;
  rating?: number | null;
  review_count?: number | null;
  response_time?: string | null;
};

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 5,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
      />
    </div>
  );
}

function formatLocation(city?: string | null, state?: string | null) {
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return "Location not listed";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const SERVICE_OPTIONS = [
  "Dog Walking",
  "Drop-In Visits",
  "Pet Sitting",
  "Boarding",
  "Overnight Care",
  "Puppy Care",
  "Cat Care",
  "Medication Support",
];

export default function GuruProfileEditPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [sitter, setSitter] = useState<SitterRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [fullName, setFullName] = useState("");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [rate, setRate] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [responseTime, setResponseTime] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  useEffect(() => {
    async function loadPage() {
      setLoading(true);
      setError("");
      setSuccess("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push("/login");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, role, account_type, first_name, last_name")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError || !profileData) {
        setError(profileError?.message || "Unable to load your account.");
        setLoading(false);
        return;
      }

      const typedProfile = profileData as ProfileRow;
      setProfile(typedProfile);

      const typedRole = String(typedProfile.role || "").toLowerCase();
      const typedAccountType = String(typedProfile.account_type || "").toLowerCase();
      const isProvider =
        ["sitter", "walker", "caretaker"].includes(typedRole) ||
        typedAccountType.includes("provider") ||
        typedAccountType.includes("sitter") ||
        typedAccountType.includes("walker") ||
        typedAccountType.includes("caretaker");

      if (!isProvider) {
        router.push("/dashboard");
        return;
      }

      const { data: sitterData, error: sitterError } = await supabase
        .from("sitters")
        .select(`
          id,
          profile_id,
          slug,
          full_name,
          title,
          bio,
          city,
          state,
          latitude,
          longitude,
          rate,
          experience_years,
          is_verified,
          is_active,
          services,
          image_url,
          rating,
          review_count,
          response_time
        `)
        .eq("profile_id", user.id)
        .maybeSingle();

      if (sitterError) {
        setError(sitterError.message);
        setLoading(false);
        return;
      }

      if (!sitterData) {
        setError("No guru profile found for this account.");
        setLoading(false);
        return;
      }

      const typedSitter = sitterData as SitterRow;
      setSitter(typedSitter);

      setFullName(
        typedSitter.full_name ||
          [typedProfile.first_name, typedProfile.last_name].filter(Boolean).join(" ") ||
          ""
      );
      setSlug(typedSitter.slug || "");
      setTitle(typedSitter.title || "");
      setBio(typedSitter.bio || "");
      setCity(typedSitter.city || "");
      setStateName(typedSitter.state || "");
      setRate(
        typeof typedSitter.rate === "number" && !Number.isNaN(typedSitter.rate)
          ? String(typedSitter.rate)
          : ""
      );
      setExperienceYears(
        typeof typedSitter.experience_years === "number" &&
          !Number.isNaN(typedSitter.experience_years)
          ? String(typedSitter.experience_years)
          : ""
      );
      setResponseTime(typedSitter.response_time || "");
      setImageUrl(typedSitter.image_url || "");
      setIsActive(typedSitter.is_active !== false);
      setSelectedServices(Array.isArray(typedSitter.services) ? typedSitter.services : []);

      setLoading(false);
    }

    loadPage();
  }, [router]);

  const publicProfileHref = useMemo(() => {
    if (slug.trim()) return `/sitter/${slug.trim()}`;
    if (sitter?.id) return `/sitter/${sitter.id}`;
    return "/search";
  }, [slug, sitter?.id]);

  function toggleService(service: string) {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((item) => item !== service) : [...prev, service]
    );
  }

  function handleAutoSlug() {
    if (!slug.trim() && fullName.trim()) {
      setSlug(slugify(fullName));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!sitter?.id || !profile?.id) return;

    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    const finalSlug = slugify(slug.trim() || fullName.trim());

    if (!finalSlug) {
      setError("Please enter a valid name or slug.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const cityValue = city.trim() || null;
    const stateValue = stateName.trim() || null;

    let latitude: number | null = null;
    let longitude: number | null = null;

    try {
      const fullAddress = [city.trim(), stateName.trim()].filter(Boolean).join(", ");

      if (fullAddress) {
        const geo = await geocodeAddress(fullAddress);

        if (geo) {
          latitude = geo.lat;
          longitude = geo.lng;
        }
      }
    } catch (geoError) {
      console.error("Geocoding failed:", geoError);
    }

    const payload = {
      full_name: fullName.trim(),
      slug: finalSlug,
      title: title.trim() || null,
      bio: bio.trim() || null,
      city: cityValue,
      state: stateValue,
      latitude,
      longitude,
      rate: rate.trim() ? Number(rate) : null,
      experience_years: experienceYears.trim() ? Number(experienceYears) : null,
      response_time: responseTime.trim() || null,
      image_url: imageUrl.trim() || null,
      is_active: isActive,
      services: selectedServices,
    };

    const { error: updateError } = await supabase
      .from("sitters")
      .update(payload)
      .eq("id", sitter.id);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSitter((prev) => (prev ? { ...prev, ...payload } : prev));
    setSlug(finalSlug);
    setSuccess("Public profile updated successfully.");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <Card className="p-8">
            <p className="text-lg font-semibold text-slate-900">Loading public profile editor...</p>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-600">Guru Public Profile</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Edit your customer-facing page
            </h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              This page controls what current and potential customers see on your public SitGuru profile.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={publicProfileHref}
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              View Public Profile
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <Card className="p-6 sm:p-7">
            <div>
              <p className="text-sm font-semibold text-slate-500">Edit profile details</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">Public page content</h2>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label="Full Name"
                  value={fullName}
                  onChange={setFullName}
                  placeholder="Mike Guru"
                />
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Public Slug</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="mike-guru"
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleAutoSlug}
                      className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Auto
                    </button>
                  </div>
                </div>
              </div>

              <Input
                label="Headline / Title"
                value={title}
                onChange={setTitle}
                placeholder="Trusted local pet guru"
              />

              <TextArea
                label="Bio"
                value={bio}
                onChange={setBio}
                rows={6}
                placeholder="Describe your care style, experience, communication style, and what makes you a trusted guru."
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input label="City" value={city} onChange={setCity} placeholder="Allentown" />
                <Input
                  label="State"
                  value={stateName}
                  onChange={setStateName}
                  placeholder="Pennsylvania"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Input
                  label="Starting Rate"
                  value={rate}
                  onChange={setRate}
                  placeholder="35"
                  type="number"
                />
                <Input
                  label="Experience Years"
                  value={experienceYears}
                  onChange={setExperienceYears}
                  placeholder="5"
                  type="number"
                />
                <Input
                  label="Response Time"
                  value={responseTime}
                  onChange={setResponseTime}
                  placeholder="Usually replies within an hour"
                />
              </div>

              <Input
                label="Profile Image URL"
                value={imageUrl}
                onChange={setImageUrl}
                placeholder="https://..."
              />

              <div>
                <p className="mb-3 text-sm font-semibold text-slate-700">Services</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {SERVICE_OPTIONS.map((service) => {
                    const active = selectedServices.includes(service);

                    return (
                      <button
                        key={service}
                        type="button"
                        onClick={() => toggleService(service)}
                        className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                          active
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {service}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span className="text-sm font-semibold text-slate-700">
                  Public profile is active
                </span>
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Public Profile"}
                </button>

                <Link
                  href="/sitter-app/posts"
                  className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Manage Posts
                </Link>
              </div>
            </form>
          </Card>

          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="h-28 bg-gradient-to-r from-emerald-500 via-emerald-400 to-cyan-400" />
              <div className="px-6 pb-6">
                <div className="-mt-12 flex items-end gap-4">
                  <div className="h-24 w-24 overflow-hidden rounded-3xl border-4 border-white bg-white shadow-sm">
                    {imageUrl.trim() ? (
                      <img
                        src={imageUrl}
                        alt={fullName || "Guru"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-3xl font-black text-slate-400">
                        {(fullName || "G").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="mt-4 text-2xl font-black text-slate-900">
                  {fullName || "Guru Name"}
                </h3>
                <p className="mt-1 text-sm font-semibold text-emerald-700">
                  {title || "Trusted local pet guru"}
                </p>
                <p className="mt-1 text-sm text-slate-500">{formatLocation(city, stateName)}</p>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {bio || "Your public bio preview appears here."}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedServices.length > 0 ? (
                    selectedServices.map((service) => (
                      <span
                        key={service}
                        className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                      >
                        {service}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      Add services
                    </span>
                  )}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-500">Starting rate</p>
                    <p className="mt-2 text-xl font-black text-slate-900">
                      {rate.trim() ? `$${rate}/service` : "Set rate"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-500">Experience</p>
                    <p className="mt-2 text-xl font-black text-slate-900">
                      {experienceYears.trim() ? `${experienceYears}+ yrs` : "Add years"}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <p className="text-sm font-semibold text-slate-500">Public profile checklist</p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">Best conversion basics</h3>
              <div className="mt-5 grid gap-3 text-sm text-slate-600">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  {fullName.trim() ? "✓" : "•"} Clear guru name
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  {title.trim() ? "✓" : "•"} Strong headline
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  {bio.trim() ? "✓" : "•"} Personal, trustworthy bio
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  {selectedServices.length > 0 ? "✓" : "•"} Services selected
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  {imageUrl.trim() ? "✓" : "•"} Profile image added
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}