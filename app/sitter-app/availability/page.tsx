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
  city?: string | null;
  state?: string | null;
};

type AvailabilityRow = {
  id?: string;
  profile_id: string;
  day_of_week: number;
  is_available: boolean;
  start_time?: string | null;
  end_time?: string | null;
  notes?: string | null;
};

type DayConfig = AvailabilityRow & {
  label: string;
};

const DAYS: { day_of_week: number; label: string }[] = [
  { day_of_week: 0, label: "Sunday" },
  { day_of_week: 1, label: "Monday" },
  { day_of_week: 2, label: "Tuesday" },
  { day_of_week: 3, label: "Wednesday" },
  { day_of_week: 4, label: "Thursday" },
  { day_of_week: 5, label: "Friday" },
  { day_of_week: 6, label: "Saturday" },
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

function formatLocation(city?: string | null, state?: string | null) {
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return "Location not listed";
}

function formatTimeLabel(value?: string | null) {
  if (!value) return "—";
  const [hours, minutes] = value.split(":");
  const hour = Number(hours);
  const suffix = hour >= 12 ? "PM" : "AM";
  const normalized = hour % 12 || 12;
  return `${normalized}:${minutes} ${suffix}`;
}

export default function GuruAvailabilityPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [sitter, setSitter] = useState<SitterRow | null>(null);
  const [availability, setAvailability] = useState<DayConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
        .select("id, profile_id, slug, full_name, city, state")
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

      setSitter(sitterData as SitterRow);

      const { data: availabilityRows, error: availabilityError } = await supabase
        .from("provider_availability")
        .select("id, profile_id, day_of_week, is_available, start_time, end_time, notes")
        .eq("profile_id", user.id)
        .order("day_of_week", { ascending: true });

      if (availabilityError) {
        setError(availabilityError.message);
        setLoading(false);
        return;
      }

      const rowMap = new Map<number, AvailabilityRow>();

      ((availabilityRows as AvailabilityRow[]) || []).forEach((row) => {
        rowMap.set(row.day_of_week, row);
      });

      const mergedDays: DayConfig[] = DAYS.map((day) => {
        const existing = rowMap.get(day.day_of_week);

        return {
          id: existing?.id,
          profile_id: user.id,
          day_of_week: day.day_of_week,
          label: day.label,
          is_available: existing?.is_available ?? false,
          start_time: existing?.start_time ?? "09:00",
          end_time: existing?.end_time ?? "17:00",
          notes: existing?.notes ?? "",
        };
      });

      setAvailability(mergedDays);
      setLoading(false);
    }

    loadPage();
  }, [router]);

  const publicProfileHref = useMemo(() => {
    if (sitter?.slug) return `/sitter/${sitter.slug}`;
    if (sitter?.id) return `/sitter/${sitter.id}`;
    return "/search";
  }, [sitter?.slug, sitter?.id]);

  const availableDaysCount = useMemo(
    () => availability.filter((day) => day.is_available).length,
    [availability]
  );

  function updateDay(dayOfWeek: number, updates: Partial<AvailabilityRow>) {
    setAvailability((prev) =>
      prev.map((day) =>
        day.day_of_week === dayOfWeek
          ? {
              ...day,
              ...updates,
            }
          : day
      )
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!profile?.id) return;

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = availability.map((day) => ({
      profile_id: profile.id,
      day_of_week: day.day_of_week,
      is_available: day.is_available,
      start_time: day.is_available ? day.start_time || "09:00" : null,
      end_time: day.is_available ? day.end_time || "17:00" : null,
      notes: day.notes?.trim() ? day.notes.trim() : null,
    }));

    const { error: upsertError } = await supabase
      .from("provider_availability")
      .upsert(payload, { onConflict: "profile_id,day_of_week" });

    setSaving(false);

    if (upsertError) {
      setError(upsertError.message);
      return;
    }

    setSuccess("Availability updated successfully.");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <Card className="p-8">
            <p className="text-lg font-semibold text-slate-900">Loading availability...</p>
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
            <p className="text-sm font-semibold text-emerald-600">Guru Availability</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Set your weekly schedule
            </h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              Show customers when you are available for bookings and keep your public profile accurate.
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
              <p className="text-sm font-semibold text-slate-500">Weekly schedule</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">Bookable hours</h2>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {availability.map((day) => (
                <div
                  key={day.day_of_week}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-[160px]">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={day.is_available}
                          onChange={(e) =>
                            updateDay(day.day_of_week, { is_available: e.target.checked })
                          }
                        />
                        <p className="text-lg font-black text-slate-900">{day.label}</p>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        {day.is_available ? "Available for bookings" : "Unavailable"}
                      </p>
                    </div>

                    <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Start Time
                        </label>
                        <input
                          type="time"
                          value={day.start_time || "09:00"}
                          disabled={!day.is_available}
                          onChange={(e) =>
                            updateDay(day.day_of_week, { start_time: e.target.value })
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          End Time
                        </label>
                        <input
                          type="time"
                          value={day.end_time || "17:00"}
                          disabled={!day.is_available}
                          onChange={(e) =>
                            updateDay(day.day_of_week, { end_time: e.target.value })
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Notes
                        </label>
                        <input
                          type="text"
                          value={day.notes || ""}
                          disabled={!day.is_available}
                          onChange={(e) =>
                            updateDay(day.day_of_week, { notes: e.target.value })
                          }
                          placeholder="Optional notes like mornings only, flexible after 2 PM, etc."
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Availability"}
                </button>

                <Link
                  href="/sitter-app/services"
                  className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Back to Services
                </Link>
              </div>
            </form>
          </Card>

          <div className="space-y-6">
            <Card className="p-6">
              <p className="text-sm font-semibold text-slate-500">Availability summary</p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">
                {sitter?.full_name || "Guru"}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {formatLocation(sitter?.city, sitter?.state)}
              </p>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">Active days</p>
                <p className="mt-2 text-3xl font-black text-slate-900">{availableDaysCount}</p>
              </div>

              <div className="mt-5 grid gap-3">
                {availability.map((day) => (
                  <div
                    key={day.day_of_week}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-slate-900">{day.label}</p>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          day.is_available
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border border-slate-200 bg-slate-100 text-slate-600"
                        }`}
                      >
                        {day.is_available ? "Available" : "Off"}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-600">
                      {day.is_available
                        ? `${formatTimeLabel(day.start_time)} – ${formatTimeLabel(day.end_time)}`
                        : "Unavailable"}
                    </p>

                    {day.is_available && day.notes ? (
                      <p className="mt-2 text-xs text-slate-500">{day.notes}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <p className="text-sm font-semibold text-slate-500">Customer conversion tip</p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">Why this matters</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>Accurate availability makes your public profile feel active and trustworthy.</p>
                <p>Customers book faster when your schedule looks clear and up to date.</p>
                <p>Short notes like “mornings only” or “flexible evenings” reduce confusion.</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}