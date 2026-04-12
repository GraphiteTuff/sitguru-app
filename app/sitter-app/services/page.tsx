"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ProfileRow = {
  id: string;
  role?: string | null;
  account_type?: string | null;
};

type SitterRow = {
  id: string;
  profile_id?: string | null;
  slug?: string | null;
  full_name?: string | null;
  title?: string | null;
  city?: string | null;
  state?: string | null;
  rate?: number | null;
  experience_years?: number | null;
  is_verified?: boolean | null;
  is_active?: boolean | null;
  services?: string[] | null;
  rating?: number | null;
  review_count?: number | null;
  response_time?: string | null;
};

type ServiceOption = {
  name: string;
  description: string;
};

const SERVICE_OPTIONS: ServiceOption[] = [
  {
    name: "Dog Walking",
    description: "Daily walks, exercise, potty breaks, and energy release.",
  },
  {
    name: "Drop-In Visits",
    description: "Quick check-ins for food, water, playtime, and care routines.",
  },
  {
    name: "Pet Sitting",
    description: "In-home sitting and companionship while owners are away.",
  },
  {
    name: "Boarding",
    description: "Care in the guru’s home for overnight and extended stays.",
  },
  {
    name: "Overnight Care",
    description: "Sleepover-style care and monitoring through the night.",
  },
  {
    name: "Puppy Care",
    description: "Extra attention for young pets, potty routines, and training support.",
  },
  {
    name: "Cat Care",
    description: "Calm, cat-friendly visits with feeding, litter, and companionship.",
  },
  {
    name: "Medication Support",
    description: "Help with routine meds and extra care instructions when needed.",
  },
];

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

function formatLocation(city?: string | null, state?: string | null) {
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return "Location not listed";
}

export default function GuruServicesPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [sitter, setSitter] = useState<SitterRow | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [title, setTitle] = useState("");
  const [rate, setRate] = useState("");
  const [responseTime, setResponseTime] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

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
        .select("id, role, account_type")
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
          city,
          state,
          rate,
          experience_years,
          is_verified,
          is_active,
          services,
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

      setTitle(typedSitter.title || "");
      setRate(
        typeof typedSitter.rate === "number" && !Number.isNaN(typedSitter.rate)
          ? String(typedSitter.rate)
          : ""
      );
      setResponseTime(typedSitter.response_time || "");
      setExperienceYears(
        typeof typedSitter.experience_years === "number" &&
          !Number.isNaN(typedSitter.experience_years)
          ? String(typedSitter.experience_years)
          : ""
      );
      setSelectedServices(Array.isArray(typedSitter.services) ? typedSitter.services : []);
      setIsActive(typedSitter.is_active !== false);

      setLoading(false);
    }

    loadPage();
  }, [router]);

  const publicProfileHref = useMemo(() => {
    if (sitter?.slug) return `/sitter/${sitter.slug}`;
    if (sitter?.id) return `/sitter/${sitter.id}`;
    return "/search";
  }, [sitter?.slug, sitter?.id]);

  function toggleService(service: string) {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((item) => item !== service) : [...prev, service]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!sitter?.id || !profile?.id) return;

    if (selectedServices.length === 0) {
      setError("Please select at least one service.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      title: title.trim() || null,
      rate: rate.trim() ? Number(rate) : null,
      response_time: responseTime.trim() || null,
      experience_years: experienceYears.trim() ? Number(experienceYears) : null,
      services: selectedServices,
      is_active: isActive,
    };

    const { error: updateError } = await supabase.from("sitters").update(payload).eq("id", sitter.id);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSitter((prev) => (prev ? { ...prev, ...payload } : prev));
    setSuccess("Services and pricing updated successfully.");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <Card className="p-8">
            <p className="text-lg font-semibold text-slate-900">Loading services editor...</p>
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
            <p className="text-sm font-semibold text-emerald-600">Guru Services</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Manage services and pricing
            </h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              Control the services customers see on your public page and set a strong starting rate.
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

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="p-6 sm:p-7">
            <div>
              <p className="text-sm font-semibold text-slate-500">Edit customer-facing services</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">Public listing details</h2>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              <Input
                label="Headline / Title"
                value={title}
                onChange={setTitle}
                placeholder="Trusted local pet guru"
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Input
                  label="Starting Rate"
                  value={rate}
                  onChange={setRate}
                  placeholder="35"
                  type="number"
                />
                <Input
                  label="Response Time"
                  value={responseTime}
                  onChange={setResponseTime}
                  placeholder="Usually replies within an hour"
                />
                <Input
                  label="Experience Years"
                  value={experienceYears}
                  onChange={setExperienceYears}
                  placeholder="5"
                  type="number"
                />
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold text-slate-700">Services Offered</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {SERVICE_OPTIONS.map((service) => {
                    const active = selectedServices.includes(service.name);

                    return (
                      <button
                        key={service.name}
                        type="button"
                        onClick={() => toggleService(service.name)}
                        className={`rounded-2xl border px-4 py-4 text-left transition ${
                          active
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-slate-300 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <p
                          className={`text-sm font-bold ${
                            active ? "text-emerald-700" : "text-slate-900"
                          }`}
                        >
                          {service.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">{service.description}</p>
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
                  Public profile is active and bookable
                </span>
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Services"}
                </button>

                <Link
                  href="/sitter-app/availability"
                  className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Set Availability
                </Link>
              </div>
            </form>
          </Card>

          <div className="space-y-6">
            <Card className="p-6">
              <p className="text-sm font-semibold text-slate-500">Public listing preview</p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">
                {sitter?.full_name || "Guru"}
              </h3>
              <p className="mt-1 text-sm font-semibold text-emerald-700">
                {title || "Add a strong guru headline"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {formatLocation(sitter?.city, sitter?.state)}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-500">Starting rate</p>
                  <p className="mt-2 text-xl font-black text-slate-900">
                    {rate.trim() ? `$${rate}/service` : "Set rate"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-500">Response time</p>
                  <p className="mt-2 text-sm font-bold text-slate-900">
                    {responseTime || "Add response time"}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <p className="text-sm font-semibold text-slate-700">Selected services</p>
                <div className="mt-3 flex flex-wrap gap-2">
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
                      Select services
                    </span>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <p className="text-sm font-semibold text-slate-500">Listing strength</p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">Conversion checklist</h3>
              <div className="mt-5 grid gap-3 text-sm text-slate-600">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  {title.trim() ? "✓" : "•"} Headline added
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  {rate.trim() ? "✓" : "•"} Starting rate set
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  {selectedServices.length > 0 ? "✓" : "•"} Services selected
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  {responseTime.trim() ? "✓" : "•"} Response time shown
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  {isActive ? "✓" : "•"} Public listing active
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}