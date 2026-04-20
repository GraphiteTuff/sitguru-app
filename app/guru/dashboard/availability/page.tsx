"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  BellRing,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  Eye,
  Globe2,
  Loader2,
  PawPrint,
  Save,
  ShieldCheck,
  Sparkles,
  UserCircle2,
} from "lucide-react";

type GuruRow = {
  id: number;
  user_id?: string | null;
  display_name?: string | null;
  rating_avg?: number | null;
  review_count?: number | null;
  stripe_account_id?: string | null;
  stripe_onboarding_complete?: boolean | null;
  charges_enabled?: boolean | null;
  payouts_enabled?: boolean | null;
  avatar_url?: string | null;
};

type DayAvailability = {
  key: string;
  label: string;
  enabled: boolean;
  start: string;
  end: string;
};

type ServiceAvailabilityKey =
  | "all_services"
  | "drop_in_visit"
  | "house_sitting"
  | "doggy_day_care"
  | "dog_walking";

type BlackoutEntry = {
  date: string;
  serviceKey: ServiceAvailabilityKey;
  note: string;
};

const defaultAvailability: DayAvailability[] = [
  { key: "monday", label: "Monday", enabled: true, start: "09:00", end: "17:00" },
  { key: "tuesday", label: "Tuesday", enabled: true, start: "09:00", end: "17:00" },
  { key: "wednesday", label: "Wednesday", enabled: true, start: "09:00", end: "17:00" },
  { key: "thursday", label: "Thursday", enabled: true, start: "09:00", end: "17:00" },
  { key: "friday", label: "Friday", enabled: true, start: "09:00", end: "17:00" },
  { key: "saturday", label: "Saturday", enabled: true, start: "10:00", end: "15:00" },
  { key: "sunday", label: "Sunday", enabled: false, start: "10:00", end: "15:00" },
];

const starterBlackouts: BlackoutEntry[] = [
  { date: "2026-04-20", serviceKey: "all_services", note: "Unavailable all day" },
  { date: "2026-04-27", serviceKey: "dog_walking", note: "Dog walking paused" },
];

const serviceAvailabilityOptions: {
  key: ServiceAvailabilityKey;
  label: string;
  publicUnit: string;
}[] = [
  { key: "all_services", label: "All Services", publicUnit: "all" },
  { key: "drop_in_visit", label: "Drop-In Visits", publicUnit: "visit" },
  { key: "house_sitting", label: "House Sitting", publicUnit: "night" },
  { key: "doggy_day_care", label: "In-Home Dog Day Care", publicUnit: "day" },
  { key: "dog_walking", label: "Dog Walking", publicUnit: "walk" },
];

function shellCardClasses(extra = "") {
  return `rounded-[28px] border border-white/10 bg-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm ${extra}`;
}

function formatTimeLabel(time: string) {
  const [hourRaw, minute] = time.split(":");
  const hour = Number(hourRaw);

  if (Number.isNaN(hour)) return time;

  const suffix = hour >= 12 ? "PM" : "AM";
  const normalized = hour % 12 || 12;
  return `${normalized}:${minute} ${suffix}`;
}

function enabledDayCount(days: DayAvailability[]) {
  return days.filter((day) => day.enabled).length;
}

function serviceLabelFromKey(key: ServiceAvailabilityKey) {
  return (
    serviceAvailabilityOptions.find((option) => option.key === key)?.label || "All Services"
  );
}

function isDuplicateBlackout(
  list: BlackoutEntry[],
  entry: Pick<BlackoutEntry, "date" | "serviceKey">
) {
  return list.some(
    (item) => item.date === entry.date && item.serviceKey === entry.serviceKey
  );
}

export default function GuruAvailabilityPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [guru, setGuru] = useState<GuruRow | null>(null);
  const [days, setDays] = useState<DayAvailability[]>(defaultAvailability);

  const [bufferMinutes, setBufferMinutes] = useState("30");
  const [sameDayBooking, setSameDayBooking] = useState(true);
  const [instantBooking, setInstantBooking] = useState(false);
  const [maxBookingsPerDay, setMaxBookingsPerDay] = useState("4");

  const [publishAvailability, setPublishAvailability] = useState(true);
  const [selectedServiceView, setSelectedServiceView] =
    useState<ServiceAvailabilityKey>("all_services");

  const [newBlackoutDate, setNewBlackoutDate] = useState("");
  const [newBlackoutService, setNewBlackoutService] =
    useState<ServiceAvailabilityKey>("all_services");
  const [newBlackoutNote, setNewBlackoutNote] = useState("");
  const [blackoutDates, setBlackoutDates] =
    useState<BlackoutEntry[]>(starterBlackouts);

  const [saveMessage, setSaveMessage] = useState("");
  const [pageNotice, setPageNotice] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/guru/login");
          return;
        }

        const { data: guruData, error: guruError } = await supabase
          .from("gurus")
          .select(
            "id, user_id, display_name, rating_avg, review_count, stripe_account_id, stripe_onboarding_complete, charges_enabled, payouts_enabled, avatar_url"
          )
          .eq("user_id", user.id)
          .single();

        if (guruError || !guruData) {
          if (mounted) {
            setGuru(null);
            setLoading(false);
          }
          return;
        }

        if (!mounted) return;

        setGuru(guruData as GuruRow);
        setPageNotice(
          "This availability workspace is ready now and can be connected to a database table later without changing the UI."
        );
        setLoading(false);
      } catch (error) {
        console.error("Guru availability load error:", error);
        if (mounted) {
          setGuru(null);
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [router]);

  function updateDay<K extends keyof DayAvailability>(
    key: string,
    field: K,
    value: DayAvailability[K]
  ) {
    setDays((current) =>
      current.map((day) => (day.key === key ? { ...day, [field]: value } : day))
    );
  }

  function applyPreset(preset: "business" | "extended" | "weekend") {
    setSaveMessage("");

    if (preset === "business") {
      setDays([
        { key: "monday", label: "Monday", enabled: true, start: "09:00", end: "17:00" },
        { key: "tuesday", label: "Tuesday", enabled: true, start: "09:00", end: "17:00" },
        { key: "wednesday", label: "Wednesday", enabled: true, start: "09:00", end: "17:00" },
        { key: "thursday", label: "Thursday", enabled: true, start: "09:00", end: "17:00" },
        { key: "friday", label: "Friday", enabled: true, start: "09:00", end: "17:00" },
        { key: "saturday", label: "Saturday", enabled: false, start: "10:00", end: "14:00" },
        { key: "sunday", label: "Sunday", enabled: false, start: "10:00", end: "14:00" },
      ]);
    }

    if (preset === "extended") {
      setDays([
        { key: "monday", label: "Monday", enabled: true, start: "08:00", end: "19:00" },
        { key: "tuesday", label: "Tuesday", enabled: true, start: "08:00", end: "19:00" },
        { key: "wednesday", label: "Wednesday", enabled: true, start: "08:00", end: "19:00" },
        { key: "thursday", label: "Thursday", enabled: true, start: "08:00", end: "19:00" },
        { key: "friday", label: "Friday", enabled: true, start: "08:00", end: "19:00" },
        { key: "saturday", label: "Saturday", enabled: true, start: "09:00", end: "17:00" },
        { key: "sunday", label: "Sunday", enabled: true, start: "10:00", end: "16:00" },
      ]);
    }

    if (preset === "weekend") {
      setDays([
        { key: "monday", label: "Monday", enabled: false, start: "09:00", end: "17:00" },
        { key: "tuesday", label: "Tuesday", enabled: false, start: "09:00", end: "17:00" },
        { key: "wednesday", label: "Wednesday", enabled: false, start: "09:00", end: "17:00" },
        { key: "thursday", label: "Thursday", enabled: false, start: "09:00", end: "17:00" },
        { key: "friday", label: "Friday", enabled: true, start: "15:00", end: "20:00" },
        { key: "saturday", label: "Saturday", enabled: true, start: "08:00", end: "18:00" },
        { key: "sunday", label: "Sunday", enabled: true, start: "08:00", end: "16:00" },
      ]);
    }

    setPageNotice("Preset applied. Save when you are ready.");
  }

  function copyMondayToWeekdays() {
    const monday = days.find((day) => day.key === "monday");
    if (!monday) return;

    setDays((current) =>
      current.map((day) =>
        ["monday", "tuesday", "wednesday", "thursday", "friday"].includes(day.key)
          ? {
              ...day,
              enabled: monday.enabled,
              start: monday.start,
              end: monday.end,
            }
          : day
      )
    );

    setPageNotice("Copied Monday hours across weekdays.");
  }

  function addBlackoutDate() {
    const cleanDate = newBlackoutDate.trim();
    const cleanNote = newBlackoutNote.trim();

    if (!cleanDate) return;

    const nextEntry: BlackoutEntry = {
      date: cleanDate,
      serviceKey: newBlackoutService,
      note: cleanNote || "Unavailable",
    };

    if (isDuplicateBlackout(blackoutDates, nextEntry)) {
      setPageNotice("That blackout date already exists for that service.");
      return;
    }

    setBlackoutDates((current) =>
      [...current, nextEntry].sort((a, b) =>
        `${a.date}-${a.serviceKey}`.localeCompare(`${b.date}-${b.serviceKey}`)
      )
    );
    setNewBlackoutDate("");
    setNewBlackoutService("all_services");
    setNewBlackoutNote("");
    setPageNotice("Blackout date added.");
  }

  function removeBlackoutDate(entry: BlackoutEntry) {
    setBlackoutDates((current) =>
      current.filter(
        (item) =>
          !(
            item.date === entry.date &&
            item.serviceKey === entry.serviceKey &&
            item.note === entry.note
          )
      )
    );
  }

  async function handleSave() {
    setSaving(true);
    setSaveMessage("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      setSaveMessage(
        "Availability saved in the UI flow. Next step is connecting this page to a Supabase availability table."
      );
      setSaving(false);
    } catch (error) {
      console.error("Availability save error:", error);
      setSaveMessage("Something went wrong while saving.");
      setSaving(false);
    }
  }

  const openDays = enabledDayCount(days);
  const totalBlackouts = blackoutDates.length;

  const weeklySummary = useMemo(() => {
    const activeDays = days.filter((day) => day.enabled);
    if (activeDays.length === 0) return "No days currently open for booking.";

    const first = activeDays[0];
    const last = activeDays[activeDays.length - 1];

    return `${activeDays.length} open day${
      activeDays.length === 1 ? "" : "s"
    } per week, from ${first.label} to ${last.label}.`;
  }, [days]);

  const filteredBlackouts = useMemo(() => {
    if (selectedServiceView === "all_services") {
      return blackoutDates;
    }

    return blackoutDates.filter(
      (entry) =>
        entry.serviceKey === "all_services" || entry.serviceKey === selectedServiceView
    );
  }, [blackoutDates, selectedServiceView]);

  const publicPreviewLabel = useMemo(() => {
    const selected = serviceAvailabilityOptions.find(
      (option) => option.key === selectedServiceView
    );

    if (!selected || selected.key === "all_services") {
      return "All service availability";
    }

    return `${selected.label} availability`;
  }, [selectedServiceView]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-6 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <div className={shellCardClasses("p-8 text-center")}>
            <p className="text-lg font-semibold text-white">Loading availability...</p>
            <p className="mt-2 text-sm text-slate-300">
              Pulling your guru profile and booking availability workspace.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!guru) {
    return (
      <div className="min-h-screen bg-[linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-6 py-12 text-white">
        <div className="mx-auto max-w-4xl">
          <div className={shellCardClasses("p-8")}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
              Guru Availability
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
              Guru profile not found
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              We could not find a guru profile connected to your account.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/guru/dashboard"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Back to Dashboard
              </Link>
              <Link
                href="/guru/login"
                className="rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                Back to Guru Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.10),_transparent_26%),radial-gradient(circle_at_right,_rgba(14,165,233,0.10),_transparent_24%),linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-emerald-500/15 via-slate-950 to-sky-500/10 p-6 shadow-[0_12px_60px_rgba(0,0,0,0.28)] lg:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <Link
                href="/guru/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-300 transition hover:bg-white/10"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Guru Dashboard
              </Link>

              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                <PawPrint className="h-3.5 w-3.5" />
                Guru Availability
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.08)] sm:text-5xl">
                Control when customers can book you
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">
                Set your weekly availability, protect blackout dates, and shape a
                cleaner booking flow for your guru business.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Open days
                </p>
                <p className="mt-2 text-2xl font-black text-white">{openDays}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Blackout dates
                </p>
                <p className="mt-2 text-2xl font-black text-white">{totalBlackouts}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Buffer
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {bufferMinutes}m
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Booking mode
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {instantBooking ? "Instant" : "Approve"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {pageNotice ? (
          <div className="rounded-3xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm text-sky-300">
            {pageNotice}
          </div>
        ) : null}

        {saveMessage ? (
          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
            {saveMessage}
          </div>
        ) : null}

        <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <section className={shellCardClasses("p-6")}>
            <div className="border-b border-white/10 pb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Weekly schedule
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.08)]">
                Set available days and hours
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Choose when customers can request or book services with you.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => applyPreset("business")}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Business Hours
              </button>
              <button
                type="button"
                onClick={() => applyPreset("extended")}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Extended Week
              </button>
              <button
                type="button"
                onClick={() => applyPreset("weekend")}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Weekend Focus
              </button>
              <button
                type="button"
                onClick={copyMondayToWeekdays}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <Copy className="h-4 w-4" />
                Copy Monday to Weekdays
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {days.map((day) => (
                <div
                  key={day.key}
                  className="rounded-3xl border border-white/10 bg-slate-950/60 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => updateDay(day.key, "enabled", !day.enabled)}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                            day.enabled ? "bg-emerald-500" : "bg-white/15"
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                              day.enabled ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>

                        <div>
                          <p className="text-lg font-bold text-white">{day.label}</p>
                          <p className="text-sm text-slate-300">
                            {day.enabled
                              ? `${formatTimeLabel(day.start)} to ${formatTimeLabel(day.end)}`
                              : "Closed for booking"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                          Start
                        </label>
                        <input
                          type="time"
                          value={day.start}
                          onChange={(e) => updateDay(day.key, "start", e.target.value)}
                          disabled={!day.enabled}
                          className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                          End
                        </label>
                        <input
                          type="time"
                          value={day.end}
                          onChange={(e) => updateDay(day.key, "end", e.target.value)}
                          disabled={!day.enabled}
                          className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Availability
                  </>
                )}
              </button>

              <Link
                href="/guru/dashboard"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Back to Dashboard
              </Link>
            </div>
          </section>

          <div className="space-y-8">
            <section className={shellCardClasses("p-6")}>
              <div className="border-b border-white/10 pb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Public publishing
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.08)]">
                  What customers will see
                </h2>
              </div>

              <div className="mt-6 space-y-5">
                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Publish availability to public profile
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        Customers can see your booking readiness on the guru profile page.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPublishAvailability((current) => !current)}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                        publishAvailability ? "bg-emerald-500" : "bg-white/15"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                          publishAvailability ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-white">
                    Preview service view
                  </label>
                  <select
                    value={selectedServiceView}
                    onChange={(e) =>
                      setSelectedServiceView(e.target.value as ServiceAvailabilityKey)
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                  >
                    {serviceAvailabilityOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <Globe2 className="h-5 w-5 text-emerald-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-300">Public preview</p>
                      <p className="mt-1 text-xl font-black text-white">
                        {publishAvailability ? publicPreviewLabel : "Availability hidden"}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {publishAvailability
                          ? "This service filter can be shown on your public page so customers can understand which dates are available before messaging or booking."
                          : "Customers will not see availability until you publish it again."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <Eye className="h-5 w-5 text-sky-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-300">Customer-facing guidance</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        Publish broad weekly hours and true blackout dates so customers see a trustworthy calendar on your public profile.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className={shellCardClasses("p-6")}>
              <div className="border-b border-white/10 pb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Booking preferences
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.08)]">
                  Rules and controls
                </h2>
              </div>

              <div className="mt-6 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white">
                    Buffer between bookings
                  </label>
                  <select
                    value={bufferMinutes}
                    onChange={(e) => setBufferMinutes(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="0">0 minutes</option>
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-white">
                    Maximum bookings per day
                  </label>
                  <select
                    value={maxBookingsPerDay}
                    onChange={(e) => setMaxBookingsPerDay(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="1">1 booking</option>
                    <option value="2">2 bookings</option>
                    <option value="3">3 bookings</option>
                    <option value="4">4 bookings</option>
                    <option value="5">5 bookings</option>
                    <option value="6">6 bookings</option>
                  </select>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Allow same-day booking requests
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        Customers can request care for the same calendar day.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSameDayBooking((current) => !current)}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                        sameDayBooking ? "bg-emerald-500" : "bg-white/15"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                          sameDayBooking ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Instant booking mode
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        Auto-accept bookings instead of manually approving them.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInstantBooking((current) => !current)}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                        instantBooking ? "bg-emerald-500" : "bg-white/15"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                          instantBooking ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className={shellCardClasses("p-6")}>
              <div className="border-b border-white/10 pb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Blackout dates
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.08)]">
                  Block specific dates
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Protect time off, travel, holidays, or days you do not want to be booked.
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <input
                  type="date"
                  value={newBlackoutDate}
                  onChange={(e) => setNewBlackoutDate(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                />

                <select
                  value={newBlackoutService}
                  onChange={(e) =>
                    setNewBlackoutService(e.target.value as ServiceAvailabilityKey)
                  }
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                >
                  {serviceAvailabilityOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={newBlackoutNote}
                  onChange={(e) => setNewBlackoutNote(e.target.value)}
                  placeholder="Optional note for this blocked date"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none"
                />

                <button
                  type="button"
                  onClick={addBlackoutDate}
                  className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                >
                  Add Date
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {filteredBlackouts.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/50 p-5 text-center">
                    <CalendarDays className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-3 text-base font-bold text-white">
                      No blackout dates
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                      Add dates when you want to stay unavailable.
                    </p>
                  </div>
                ) : (
                  filteredBlackouts.map((entry) => (
                    <div
                      key={`${entry.date}-${entry.serviceKey}-${entry.note}`}
                      className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-950/60 p-4"
                    >
                      <div className="pr-4">
                        <p className="text-sm font-bold text-white">{entry.date}</p>
                        <p className="mt-1 text-sm text-slate-300">
                          {serviceLabelFromKey(entry.serviceKey)}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">{entry.note}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeBlackoutDate(entry)}
                        className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className={shellCardClasses("p-6")}>
              <div className="border-b border-white/10 pb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Summary
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.08)]">
                  Availability health
                </h2>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <Clock3 className="h-5 w-5 text-emerald-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-300">Weekly setup</p>
                      <p className="mt-1 text-xl font-black text-white">{weeklySummary}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <ShieldCheck className="h-5 w-5 text-sky-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-300">Same-day bookings</p>
                      <p className="mt-1 text-xl font-black text-white">
                        {sameDayBooking ? "Allowed" : "Off"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <Sparkles className="h-5 w-5 text-violet-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-300">Booking approval</p>
                      <p className="mt-1 text-xl font-black text-white">
                        {instantBooking ? "Instant booking on" : "Manual approval"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <Globe2 className="h-5 w-5 text-emerald-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-300">Public visibility</p>
                      <p className="mt-1 text-xl font-black text-white">
                        {publishAvailability ? "Published" : "Hidden"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className={shellCardClasses("p-6")}>
              <div className="border-b border-white/10 pb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Quick actions
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.08)]">
                  Jump where needed
                </h2>
              </div>

              <div className="mt-6 space-y-3">
                <Link
                  href="/guru/dashboard/bookings"
                  className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-950/60 p-4 transition hover:border-white/20 hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <CalendarDays className="h-5 w-5 text-emerald-300" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Bookings</p>
                      <p className="text-sm text-slate-300">
                        Review requests and upcoming sessions
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </Link>

                <Link
                  href="/guru/dashboard/messages"
                  className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-950/60 p-4 transition hover:border-white/20 hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <BellRing className="h-5 w-5 text-sky-300" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Messages</p>
                      <p className="text-sm text-slate-300">
                        Communicate with customers faster
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </Link>

                <Link
                  href="/guru/dashboard/profile"
                  className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-950/60 p-4 transition hover:border-white/20 hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <UserCircle2 className="h-5 w-5 text-violet-300" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Profile</p>
                      <p className="text-sm text-slate-300">
                        Keep trust and public identity strong
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </Link>
              </div>
            </section>

            <section className={shellCardClasses("p-6")}>
              <div className="border-b border-white/10 pb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Best next moves
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.08)]">
                  Availability tips
                </h2>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex gap-3 rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                  <p className="text-sm leading-6 text-slate-300">
                    More reliable open hours usually reduce customer friction and improve conversion.
                  </p>
                </div>

                <div className="flex gap-3 rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" />
                  <p className="text-sm leading-6 text-slate-300">
                    Add blackout dates early so customers do not request times you already know are unavailable.
                  </p>
                </div>

                <div className="flex gap-3 rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" />
                  <p className="text-sm leading-6 text-slate-300">
                    Pair clean availability with fast replies and a strong profile photo for best booking results.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}