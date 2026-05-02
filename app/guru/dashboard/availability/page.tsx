"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  BellRing,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  DollarSign,
  Eye,
  Globe2,
  Loader2,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCircle2,
  XCircle,
} from "lucide-react";

type GuruRow = {
  id: number;
  user_id?: string | null;
  display_name?: string | null;
  full_name?: string | null;
  name?: string | null;
  rating_avg?: number | null;
  review_count?: number | null;
  profile_photo_url?: string | null;
  photo_url?: string | null;
  avatar_url?: string | null;
  image_url?: string | null;
  hourly_rate?: number | null;
  rate?: number | null;
};

type DayAvailability = {
  key: string;
  label: string;
  shortLabel: string;
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
  id?: string | null;
  date: string;
  serviceKey: ServiceAvailabilityKey;
  note: string;
};

type CalendarCell = {
  date: Date;
  iso: string;
  dayNumber: number;
  inMonth: boolean;
  status: "available" | "blackout" | "pending" | "closed";
};

type AvailabilitySettingsRow = {
  publish_availability?: boolean | null;
  same_day_booking?: boolean | null;
  instant_booking?: boolean | null;
  buffer_minutes?: number | null;
  max_bookings_per_day?: number | null;
  selected_service_view?: string | null;
};

type WeeklyAvailabilityRow = {
  day_key: string;
  day_label?: string | null;
  day_short_label?: string | null;
  enabled?: boolean | null;
  start_time?: string | null;
  end_time?: string | null;
};

type BlackoutDateRow = {
  id?: string | null;
  blackout_date?: string | null;
  service_key?: string | null;
  note?: string | null;
};

const forcedDark = {
  color: "#071127",
  WebkitTextFillColor: "#071127",
};

const forcedMuted = {
  color: "#334155",
  WebkitTextFillColor: "#334155",
};

const forcedFaint = {
  color: "#94a3b8",
  WebkitTextFillColor: "#94a3b8",
};

const forcedGreen = {
  color: "#047857",
  WebkitTextFillColor: "#047857",
};

const forcedWhite = {
  color: "#ffffff",
  WebkitTextFillColor: "#ffffff",
};

const forcedRed = {
  color: "#be123c",
  WebkitTextFillColor: "#be123c",
};

const forcedAmber = {
  color: "#92400e",
  WebkitTextFillColor: "#92400e",
};

const defaultAvailability: DayAvailability[] = [
  {
    key: "monday",
    label: "Monday",
    shortLabel: "Mon",
    enabled: true,
    start: "09:00",
    end: "17:00",
  },
  {
    key: "tuesday",
    label: "Tuesday",
    shortLabel: "Tue",
    enabled: true,
    start: "09:00",
    end: "17:00",
  },
  {
    key: "wednesday",
    label: "Wednesday",
    shortLabel: "Wed",
    enabled: true,
    start: "09:00",
    end: "17:00",
  },
  {
    key: "thursday",
    label: "Thursday",
    shortLabel: "Thu",
    enabled: true,
    start: "09:00",
    end: "17:00",
  },
  {
    key: "friday",
    label: "Friday",
    shortLabel: "Fri",
    enabled: true,
    start: "09:00",
    end: "17:00",
  },
  {
    key: "saturday",
    label: "Saturday",
    shortLabel: "Sat",
    enabled: true,
    start: "10:00",
    end: "14:00",
  },
  {
    key: "sunday",
    label: "Sunday",
    shortLabel: "Sun",
    enabled: false,
    start: "10:00",
    end: "14:00",
  },
];

const serviceAvailabilityOptions: {
  key: ServiceAvailabilityKey;
  label: string;
}[] = [
  { key: "all_services", label: "All Services" },
  { key: "drop_in_visit", label: "Drop-In Visits" },
  { key: "house_sitting", label: "House Sitting" },
  { key: "doggy_day_care", label: "In-Home Dog Day Care" },
  { key: "dog_walking", label: "Dog Walking" },
];

const pendingDates = new Set(["2026-04-14", "2026-04-26"]);

function normalizeTime(value?: string | null, fallback = "09:00") {
  if (!value) return fallback;
  return value.slice(0, 5);
}

function normalizeServiceKey(value?: string | null): ServiceAvailabilityKey {
  const keys = serviceAvailabilityOptions.map((option) => option.key);
  return keys.includes(value as ServiceAvailabilityKey)
    ? (value as ServiceAvailabilityKey)
    : "all_services";
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
    serviceAvailabilityOptions.find((option) => option.key === key)?.label ||
    "All Services"
  );
}

function isDuplicateBlackout(
  list: BlackoutEntry[],
  entry: Pick<BlackoutEntry, "date" | "serviceKey">,
) {
  return list.some(
    (item) => item.date === entry.date && item.serviceKey === entry.serviceKey,
  );
}

function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function dayKeyFromDate(date: Date) {
  const keys = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  return keys[date.getDay()];
}

function mergeWeeklyRows(rows: WeeklyAvailabilityRow[]) {
  return defaultAvailability.map((defaultDay) => {
    const row = rows.find((item) => item.day_key === defaultDay.key);

    if (!row) return defaultDay;

    return {
      key: defaultDay.key,
      label: row.day_label || defaultDay.label,
      shortLabel: row.day_short_label || defaultDay.shortLabel,
      enabled: Boolean(row.enabled),
      start: normalizeTime(row.start_time, defaultDay.start),
      end: normalizeTime(row.end_time, defaultDay.end),
    };
  });
}

function buildCalendarCells({
  monthDate,
  days,
  blackouts,
  selectedServiceView,
}: {
  monthDate: Date;
  days: DayAvailability[];
  blackouts: BlackoutEntry[];
  selectedServiceView: ServiceAvailabilityKey;
}): CalendarCell[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(year, month, 1 - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    const iso = toISODate(date);
    const scheduleDay = days.find((day) => day.key === dayKeyFromDate(date));
    const isBlackout = blackouts.some(
      (entry) =>
        entry.date === iso &&
        (entry.serviceKey === "all_services" ||
          selectedServiceView === "all_services" ||
          entry.serviceKey === selectedServiceView),
    );

    let status: CalendarCell["status"] = scheduleDay?.enabled
      ? "available"
      : "closed";

    if (pendingDates.has(iso)) status = "pending";
    if (isBlackout) status = "blackout";

    return {
      date,
      iso,
      dayNumber: date.getDate(),
      inMonth: date.getMonth() === month,
      status,
    };
  });
}

function calendarCellClasses(cell: CalendarCell) {
  const base =
    "relative flex min-h-[58px] flex-col items-center justify-center overflow-hidden rounded-2xl border text-sm font-black transition";

  if (!cell.inMonth) {
    return `${base} border-slate-200 bg-slate-50 opacity-45`;
  }

  if (cell.status === "blackout") {
    return `${base} border-rose-200 bg-rose-50`;
  }

  if (cell.status === "pending") {
    return `${base} border-amber-200 bg-amber-50`;
  }

  if (cell.status === "available") {
    return `${base} border-emerald-200 bg-emerald-50`;
  }

  return `${base} border-slate-200 bg-slate-50`;
}

function calendarCellTextStyle(cell: CalendarCell) {
  if (!cell.inMonth) return forcedFaint;
  if (cell.status === "blackout") return forcedRed;
  if (cell.status === "pending") return forcedAmber;
  if (cell.status === "available") return forcedGreen;
  return forcedMuted;
}

function Toggle({
  enabled,
  onClick,
  label,
}: {
  enabled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={[
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition",
        enabled ? "bg-emerald-500" : "bg-slate-300",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition",
          enabled ? "translate-x-6" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  );
}

function CrossoutMark({ small = false }: { small?: boolean }) {
  return (
    <>
      <span
        className={[
          "pointer-events-none absolute rounded-full bg-rose-500/85",
          small
            ? "left-1/2 top-1/2 h-[1.5px] w-6 -translate-x-1/2 -translate-y-1/2 rotate-45"
            : "left-1/2 top-1/2 h-[2px] w-9 -translate-x-1/2 -translate-y-1/2 rotate-45",
        ].join(" ")}
      />
      <span
        className={[
          "pointer-events-none absolute rounded-full bg-rose-500/85",
          small
            ? "left-1/2 top-1/2 h-[1.5px] w-6 -translate-x-1/2 -translate-y-1/2 -rotate-45"
            : "left-1/2 top-1/2 h-[2px] w-9 -translate-x-1/2 -translate-y-1/2 -rotate-45",
        ].join(" ")}
      />
    </>
  );
}

export default function GuruAvailabilityPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [userId, setUserId] = useState("");
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
  const [blackoutDates, setBlackoutDates] = useState<BlackoutEntry[]>([]);

  const [saveMessage, setSaveMessage] = useState("");
  const [pageNotice, setPageNotice] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setPageNotice("");
        setSaveMessage("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace("/guru/login");
          return;
        }

        if (!mounted) return;

        setUserId(user.id);

        const { data: guruData, error: guruError } = await supabase
          .from("gurus")
          .select("*")
          .eq("user_id", user.id)
          .limit(1);

        if (!mounted) return;

        if (guruError || !guruData?.[0]) {
          setGuru(null);
          setLoading(false);
          return;
        }

        setGuru(guruData[0] as GuruRow);

        const [settingsResponse, weeklyResponse, blackoutResponse] =
          await Promise.all([
            supabase
              .from("guru_availability_settings")
              .select("*")
              .eq("user_id", user.id)
              .maybeSingle(),
            supabase
              .from("guru_weekly_availability")
              .select("*")
              .eq("user_id", user.id),
            supabase
              .from("guru_blackout_dates")
              .select("*")
              .eq("user_id", user.id)
              .order("blackout_date", { ascending: true }),
          ]);

        if (!mounted) return;

        if (settingsResponse.error) {
          setPageNotice(
            `Availability settings table is not ready yet: ${settingsResponse.error.message}`,
          );
        } else if (settingsResponse.data) {
          const settings = settingsResponse.data as AvailabilitySettingsRow;

          setPublishAvailability(settings.publish_availability !== false);
          setSameDayBooking(settings.same_day_booking !== false);
          setInstantBooking(Boolean(settings.instant_booking));
          setBufferMinutes(String(settings.buffer_minutes ?? 30));
          setMaxBookingsPerDay(String(settings.max_bookings_per_day ?? 4));
          setSelectedServiceView(
            normalizeServiceKey(settings.selected_service_view),
          );
        }

        if (weeklyResponse.error) {
          setPageNotice(
            `Weekly availability table is not ready yet: ${weeklyResponse.error.message}`,
          );
        } else if (weeklyResponse.data && weeklyResponse.data.length > 0) {
          setDays(mergeWeeklyRows(weeklyResponse.data as WeeklyAvailabilityRow[]));
        } else {
          setDays(defaultAvailability);
        }

        if (blackoutResponse.error) {
          setPageNotice(
            `Blackout dates table is not ready yet: ${blackoutResponse.error.message}`,
          );
        } else {
          const mappedBlackouts = ((blackoutResponse.data ||
            []) as BlackoutDateRow[]).map((entry) => ({
            id: entry.id || null,
            date: entry.blackout_date || "",
            serviceKey: normalizeServiceKey(entry.service_key),
            note: entry.note || "Unavailable",
          }));

          setBlackoutDates(mappedBlackouts.filter((entry) => entry.date));
        }

        if (
          !settingsResponse.error &&
          !weeklyResponse.error &&
          !blackoutResponse.error
        ) {
          setPageNotice(
            "Availability loaded from Supabase. Changes will now persist after saving.",
          );
        }

        setLoading(false);
      } catch (error) {
        console.error("Guru availability load error:", error);
        if (mounted) {
          setGuru(null);
          setPageNotice("Could not load availability. Please refresh and try again.");
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
    value: DayAvailability[K],
  ) {
    setDays((current) =>
      current.map((day) => (day.key === key ? { ...day, [field]: value } : day)),
    );
    setSaveMessage("");
  }

  function applyPreset(preset: "business" | "extended" | "weekend") {
    setSaveMessage("");

    if (preset === "business") {
      setDays(
        defaultAvailability.map((day) => ({
          ...day,
          enabled: !["saturday", "sunday"].includes(day.key),
          start: "09:00",
          end: "17:00",
        })),
      );
    }

    if (preset === "extended") {
      setDays(
        defaultAvailability.map((day) => ({
          ...day,
          enabled: true,
          start: day.key === "sunday" ? "10:00" : "08:00",
          end: day.key === "sunday" ? "16:00" : "19:00",
        })),
      );
    }

    if (preset === "weekend") {
      setDays(
        defaultAvailability.map((day) => ({
          ...day,
          enabled: ["friday", "saturday", "sunday"].includes(day.key),
          start: day.key === "friday" ? "15:00" : "08:00",
          end: day.key === "friday" ? "20:00" : "18:00",
        })),
      );
    }

    setPageNotice("Preset applied. Save when you are ready.");
  }

  function copyMondayToWeekdays() {
    const monday = days.find((day) => day.key === "monday");
    if (!monday) return;

    setDays((current) =>
      current.map((day) =>
        ["monday", "tuesday", "wednesday", "thursday", "friday"].includes(
          day.key,
        )
          ? {
              ...day,
              enabled: monday.enabled,
              start: monday.start,
              end: monday.end,
            }
          : day,
      ),
    );

    setSaveMessage("");
    setPageNotice("Copied Monday hours across weekdays. Save when you are ready.");
  }

  function addBlackoutDate() {
    const cleanDate = newBlackoutDate.trim();
    const cleanNote = newBlackoutNote.trim();

    if (!cleanDate) {
      setPageNotice("Choose a blackout date first.");
      return;
    }

    const nextEntry: BlackoutEntry = {
      id: null,
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
        `${a.date}-${a.serviceKey}`.localeCompare(`${b.date}-${b.serviceKey}`),
      ),
    );
    setNewBlackoutDate("");
    setNewBlackoutService("all_services");
    setNewBlackoutNote("");
    setSaveMessage("");
    setPageNotice("Blackout date added. Save when you are ready.");
  }

  function removeBlackoutDate(entry: BlackoutEntry) {
    setBlackoutDates((current) =>
      current.filter(
        (item) =>
          !(
            item.date === entry.date &&
            item.serviceKey === entry.serviceKey &&
            item.note === entry.note
          ),
      ),
    );

    setSaveMessage("");
    setPageNotice("Blackout date removed. Save when you are ready.");
  }

  function moveCalendar(direction: "prev" | "next") {
    setCalendarMonth((current) => {
      const next = new Date(current);
      next.setMonth(current.getMonth() + (direction === "next" ? 1 : -1));
      return next;
    });
  }

  async function handleSave() {
    if (!userId) {
      setSaveMessage("Could not save because no Guru user is loaded.");
      return;
    }

    setSaving(true);
    setSaveMessage("");
    setPageNotice("");

    try {
      const settingsPayload = {
        user_id: userId,
        publish_availability: publishAvailability,
        same_day_booking: sameDayBooking,
        instant_booking: instantBooking,
        buffer_minutes: Number(bufferMinutes) || 0,
        max_bookings_per_day: Number(maxBookingsPerDay) || 1,
        selected_service_view: selectedServiceView,
      };

      const { error: settingsError } = await supabase
        .from("guru_availability_settings")
        .upsert(settingsPayload, { onConflict: "user_id" });

      if (settingsError) throw settingsError;

      const weeklyPayload = days.map((day) => ({
        user_id: userId,
        day_key: day.key,
        day_label: day.label,
        day_short_label: day.shortLabel,
        enabled: day.enabled,
        start_time: day.start,
        end_time: day.end,
      }));

      const { error: weeklyError } = await supabase
        .from("guru_weekly_availability")
        .upsert(weeklyPayload, { onConflict: "user_id,day_key" });

      if (weeklyError) throw weeklyError;

      const { error: deleteBlackoutsError } = await supabase
        .from("guru_blackout_dates")
        .delete()
        .eq("user_id", userId);

      if (deleteBlackoutsError) throw deleteBlackoutsError;

      const blackoutPayload = blackoutDates.map((entry) => ({
        user_id: userId,
        blackout_date: entry.date,
        service_key: entry.serviceKey,
        note: entry.note || "Unavailable",
      }));

      if (blackoutPayload.length > 0) {
        const { error: insertBlackoutsError } = await supabase
          .from("guru_blackout_dates")
          .insert(blackoutPayload);

        if (insertBlackoutsError) throw insertBlackoutsError;
      }

      const { data: refreshedBlackouts, error: refreshError } = await supabase
        .from("guru_blackout_dates")
        .select("*")
        .eq("user_id", userId)
        .order("blackout_date", { ascending: true });

      if (!refreshError) {
        const mappedBlackouts = ((refreshedBlackouts ||
          []) as BlackoutDateRow[]).map((entry) => ({
          id: entry.id || null,
          date: entry.blackout_date || "",
          serviceKey: normalizeServiceKey(entry.service_key),
          note: entry.note || "Unavailable",
        }));

        setBlackoutDates(mappedBlackouts.filter((entry) => entry.date));
      }

      setSaveMessage("Saved. Availability, booking rules, and blackout dates are now stored in Supabase.");
      setPageNotice("");
    } catch (error) {
      console.error("Availability save error:", error);
      setSaveMessage(
        error instanceof Error
          ? `Could not save availability: ${error.message}`
          : "Could not save availability. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  const openDays = enabledDayCount(days);
  const totalBlackouts = blackoutDates.length;

  const filteredBlackouts = useMemo(() => {
    if (selectedServiceView === "all_services") {
      return blackoutDates;
    }

    return blackoutDates.filter(
      (entry) =>
        entry.serviceKey === "all_services" ||
        entry.serviceKey === selectedServiceView,
    );
  }, [blackoutDates, selectedServiceView]);

  const weeklySummary = useMemo(() => {
    const activeDays = days.filter((day) => day.enabled);
    if (activeDays.length === 0) return "No days currently open for booking.";

    const first = activeDays[0];
    const last = activeDays[activeDays.length - 1];

    return `${activeDays.length} open day${
      activeDays.length === 1 ? "" : "s"
    } per week, from ${first.label} to ${last.label}.`;
  }, [days]);

  const publicPreviewLabel = useMemo(() => {
    const selected = serviceAvailabilityOptions.find(
      (option) => option.key === selectedServiceView,
    );

    if (!selected || selected.key === "all_services") {
      return "All service availability";
    }

    return `${selected.label} availability`;
  }, [selectedServiceView]);

  const calendarCells = useMemo(
    () =>
      buildCalendarCells({
        monthDate: calendarMonth,
        days,
        blackouts: blackoutDates,
        selectedServiceView,
      }),
    [calendarMonth, days, blackoutDates, selectedServiceView],
  );

  const previewCells = useMemo(
    () => calendarCells.filter((_, index) => index < 35),
    [calendarCells],
  );

  const guruName =
    guru?.display_name || guru?.full_name || guru?.name || "Your Guru Profile";

  const rating = guru?.rating_avg ? guru.rating_avg.toFixed(1) : "5.0";
  const reviews = guru?.review_count ?? 0;

  const guruPhoto =
    guru?.profile_photo_url ||
    guru?.photo_url ||
    guru?.avatar_url ||
    guru?.image_url ||
    "";

  const guruRate = guru?.hourly_rate || guru?.rate;
  const rateLabel = guruRate ? `$${guruRate}/hr` : "$15/hr";

  if (loading) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f7fffc_42%,#ecfdf5_100%)] px-4 py-10 md:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-center">
          <div className="rounded-[2rem] border border-emerald-100 bg-white px-8 py-6 text-center shadow-sm">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-emerald-600" />
            <p className="mt-3 text-lg font-extrabold" style={forcedDark}>
              Loading availability...
            </p>
            <p className="mt-1 text-sm font-semibold" style={forcedMuted}>
              Pulling your Guru profile and calendar workspace.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!guru) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f7fffc_42%,#ecfdf5_100%)] px-4 py-10 md:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <p
              className="text-sm font-extrabold uppercase tracking-[0.18em]"
              style={forcedAmber}
            >
              Guru Availability
            </p>
            <h1
              className="mt-3 text-4xl font-black tracking-tight"
              style={forcedDark}
            >
              Guru profile not found
            </h1>
            <p
              className="mt-3 text-base font-semibold leading-7"
              style={forcedMuted}
            >
              We could not find a Guru profile connected to your account.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/guru/dashboard"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold transition hover:bg-slate-50"
                style={forcedDark}
              >
                Back to Dashboard
              </Link>
              <Link
                href="/guru/login"
                className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-extrabold transition hover:bg-emerald-700"
                style={forcedWhite}
              >
                Back to Guru Login
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f7fffc_42%,#ecfdf5_100%)]"
      style={{
        fontFamily:
          '"Open Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div className="mx-auto max-w-[1500px] px-4 py-6 md:px-6 lg:px-8">
        <section className="rounded-[2.25rem] border border-emerald-100 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <Link
                href="/guru/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.16em] transition hover:bg-emerald-100"
                style={forcedGreen}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Guru Dashboard
              </Link>

              <h1
                className="mt-5 text-4xl font-black tracking-[-0.04em] md:text-6xl"
                style={forcedDark}
              >
                Availability & Calendar
              </h1>
              <p
                className="mt-3 max-w-3xl text-lg font-semibold leading-8"
                style={forcedMuted}
              >
                Keep your schedule current, protect blackout dates, and show
                pet parents when you are available before they request care.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/guru/dashboard/earnings"
                className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black shadow-sm transition hover:bg-emerald-50"
                style={forcedGreen}
              >
                View Earnings
              </Link>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                style={forcedWhite}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span style={forcedWhite}>
                  {saving ? "Saving..." : "Save Availability"}
                </span>
              </button>
            </div>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[
              {
                label: "Open Days",
                value: openDays,
                helper: "Per week",
                icon: CalendarDays,
                tone: "emerald",
              },
              {
                label: "Blackout Dates",
                value: totalBlackouts,
                helper: "Blocked days",
                icon: XCircle,
                tone: "rose",
              },
              {
                label: "Booking Mode",
                value: instantBooking ? "Instant" : "Approval",
                helper: instantBooking ? "Auto-booking" : "Manual approval",
                icon: Clock3,
                tone: "emerald",
              },
              {
                label: "Rate",
                value: rateLabel,
                helper: "Base rate",
                icon: DollarSign,
                tone: "emerald",
              },
              {
                label: "Public View",
                value: publishAvailability ? "On" : "Off",
                helper: "Customer visibility",
                icon: Eye,
                tone: "sky",
              },
            ].map((item) => {
              const Icon = item.icon;
              const iconClass =
                item.tone === "rose"
                  ? "bg-rose-50 text-rose-600"
                  : item.tone === "sky"
                    ? "bg-sky-50 text-sky-600"
                    : "bg-emerald-50 text-emerald-600";

              return (
                <div
                  key={item.label}
                  className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl ${iconClass}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p
                        className="text-xs font-black uppercase tracking-[0.12em]"
                        style={forcedMuted}
                      >
                        {item.label}
                      </p>
                      <p
                        className="mt-1 text-2xl font-black"
                        style={forcedDark}
                      >
                        {item.value}
                      </p>
                      <p
                        className="mt-1 text-sm font-semibold"
                        style={forcedMuted}
                      >
                        {item.helper}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {pageNotice ? (
          <div className="mt-5 rounded-3xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm font-semibold text-sky-900">
            {pageNotice}
          </div>
        ) : null}

        {saveMessage ? (
          <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-900">
            {saveMessage}
          </div>
        ) : null}

        <section className="mt-7 grid gap-7 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-7">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="border-b border-slate-100 pb-5">
                <p
                  className="text-sm font-black uppercase tracking-[0.16em]"
                  style={forcedGreen}
                >
                  Weekly Schedule
                </p>
                <h2
                  className="mt-2 text-3xl font-black tracking-tight md:text-[2.2rem]"
                  style={forcedDark}
                >
                  Set available days and hours
                </h2>
                <p
                  className="mt-2 text-base font-semibold leading-7"
                  style={forcedMuted}
                >
                  Choose when customers can request or book services with you.
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => applyPreset("business")}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black shadow-sm transition hover:bg-emerald-50"
                  style={forcedDark}
                >
                  Business Hours
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("extended")}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black shadow-sm transition hover:bg-emerald-50"
                  style={forcedDark}
                >
                  Extended Week
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("weekend")}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black shadow-sm transition hover:bg-emerald-50"
                  style={forcedDark}
                >
                  Weekend Focus
                </button>
                <button
                  type="button"
                  onClick={copyMondayToWeekdays}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black shadow-sm transition hover:bg-slate-50"
                  style={forcedDark}
                >
                  <Copy className="h-4 w-4" />
                  Copy Monday to Weekdays
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {days.map((day) => (
                  <div
                    key={day.key}
                    className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="grid gap-4 lg:grid-cols-[1fr_300px] lg:items-center">
                      <div className="flex items-center gap-3">
                        <Toggle
                          enabled={day.enabled}
                          onClick={() =>
                            updateDay(day.key, "enabled", !day.enabled)
                          }
                          label={`Toggle ${day.label}`}
                        />

                        <div>
                          <p
                            className="text-base font-black"
                            style={forcedDark}
                          >
                            {day.label}
                          </p>
                          <p
                            className="text-sm font-semibold"
                            style={forcedMuted}
                          >
                            {day.enabled
                              ? `${formatTimeLabel(
                                  day.start,
                                )} to ${formatTimeLabel(day.end)}`
                              : "Unavailable for booking"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label
                            className="mb-2 block text-xs font-black uppercase tracking-[0.12em]"
                            style={forcedMuted}
                          >
                            Start
                          </label>
                          <input
                            type="time"
                            value={day.start}
                            onChange={(event) =>
                              updateDay(day.key, "start", event.target.value)
                            }
                            disabled={!day.enabled}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-100"
                            style={forcedDark}
                          />
                        </div>
                        <div>
                          <label
                            className="mb-2 block text-xs font-black uppercase tracking-[0.12em]"
                            style={forcedMuted}
                          >
                            End
                          </label>
                          <input
                            type="time"
                            value={day.end}
                            onChange={(event) =>
                              updateDay(day.key, "end", event.target.value)
                            }
                            disabled={!day.enabled}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-100"
                            style={forcedDark}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p
                    className="text-sm font-black uppercase tracking-[0.16em]"
                    style={forcedGreen}
                  >
                    Blackout Dates
                  </p>
                  <h2
                    className="mt-2 text-3xl font-black tracking-tight md:text-[2.2rem]"
                    style={forcedDark}
                  >
                    Block specific dates
                  </h2>
                  <p
                    className="mt-2 text-base font-semibold leading-7"
                    style={forcedMuted}
                  >
                    Protect time off, travel, holidays, or days you do not want
                    to be booked.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr_1.4fr_auto]">
                <input
                  type="date"
                  value={newBlackoutDate}
                  onChange={(event) => setNewBlackoutDate(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  style={forcedDark}
                />

                <select
                  value={newBlackoutService}
                  onChange={(event) =>
                    setNewBlackoutService(
                      event.target.value as ServiceAvailabilityKey,
                    )
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  style={{
                    color: "#071127",
                    WebkitTextFillColor: "#071127",
                    backgroundColor: "#ffffff",
                  }}
                >
                  {serviceAvailabilityOptions.map((option) => (
                    <option
                      key={option.key}
                      value={option.key}
                      className="bg-white text-slate-950"
                      style={{
                        color: "#071127",
                        WebkitTextFillColor: "#071127",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={newBlackoutNote}
                  onChange={(event) => setNewBlackoutNote(event.target.value)}
                  placeholder="Optional note for this blocked date"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold placeholder:text-slate-500 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  style={forcedDark}
                />

                <button
                  type="button"
                  onClick={addBlackoutDate}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black transition hover:bg-slate-800"
                  style={forcedWhite}
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {filteredBlackouts.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                    <CalendarDays className="mx-auto h-8 w-8 text-slate-500" />
                    <p
                      className="mt-3 text-base font-black"
                      style={forcedDark}
                    >
                      No blackout dates
                    </p>
                    <p
                      className="mt-2 text-sm font-semibold"
                      style={forcedMuted}
                    >
                      Add dates when you want to stay unavailable.
                    </p>
                  </div>
                ) : (
                  filteredBlackouts.map((entry) => (
                    <div
                      key={`${entry.date}-${entry.serviceKey}-${entry.note}`}
                      className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-black" style={forcedDark}>
                          {formatDisplayDate(entry.date)}
                        </p>
                        <p
                          className="mt-1 text-sm font-black"
                          style={forcedGreen}
                        >
                          {serviceLabelFromKey(entry.serviceKey)}
                        </p>
                        <p
                          className="mt-1 text-sm font-semibold"
                          style={forcedMuted}
                        >
                          {entry.note}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeBlackoutDate(entry)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white px-3 py-2 text-sm font-black transition hover:bg-rose-50"
                        style={forcedRed}
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="space-y-7">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p
                    className="text-sm font-black uppercase tracking-[0.16em]"
                    style={forcedGreen}
                  >
                    MY CALENDAR
                  </p>
                  <h2
                    className="mt-2 text-3xl font-black tracking-tight md:text-[2.2rem]"
                    style={forcedDark}
                  >
                    {monthLabel(calendarMonth)}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => moveCalendar("prev")}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white transition hover:bg-slate-50"
                    style={forcedDark}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarMonth(
                        new Date(
                          new Date().getFullYear(),
                          new Date().getMonth(),
                          1,
                        ),
                      )
                    }
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black transition hover:bg-slate-50"
                    style={forcedDark}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCalendar("next")}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white transition hover:bg-slate-50"
                    style={forcedDark}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div
                className="mt-5 grid grid-cols-7 gap-2 text-center text-sm font-black uppercase tracking-[0.08em]"
                style={forcedMuted}
              >
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div key={day}>{day}</div>
                  ),
                )}
              </div>

              <div className="mt-2 grid grid-cols-7 gap-2">
                {calendarCells.map((cell) => (
                  <div key={cell.iso} className={calendarCellClasses(cell)}>
                    {cell.inMonth && cell.status === "blackout" ? (
                      <CrossoutMark />
                    ) : null}

                    <span style={calendarCellTextStyle(cell)}>
                      {cell.dayNumber}
                    </span>

                    {cell.inMonth && cell.status === "available" ? (
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    ) : null}

                    {cell.inMonth && cell.status === "pending" ? (
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                    ) : null}
                  </div>
                ))}
              </div>

              <div
                className="mt-5 flex flex-wrap gap-3 text-sm font-semibold"
                style={forcedMuted}
              >
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-emerald-100 ring-1 ring-emerald-200" />
                  Available
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-rose-100 ring-1 ring-rose-200" />
                  Blackout / Unavailable
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-amber-100 ring-1 ring-amber-200" />
                  Pending / Request
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-slate-100 ring-1 ring-slate-200" />
                  Not in this month
                </span>
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm md:p-6">
              <div className="flex items-start gap-3">
                <Globe2 className="mt-1 h-5 w-5 text-emerald-700" />
                <div>
                  <p
                    className="text-sm font-black uppercase tracking-[0.16em]"
                    style={forcedGreen}
                  >
                    What Pet Parents See
                  </p>
                  <h2
                    className="mt-2 text-2xl font-black tracking-tight md:text-[2rem]"
                    style={forcedDark}
                  >
                    Customer availability preview
                  </h2>
                  <p
                    className="mt-2 text-base font-semibold leading-7"
                    style={forcedMuted}
                  >
                    This preview shows how your availability can appear on your
                    public Guru profile.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-50 ring-4 ring-emerald-100">
                    {guruPhoto ? (
                      <img
                        src={guruPhoto}
                        alt={`${guruName} profile preview`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserCircle2 className="h-full w-full p-2 text-emerald-700" />
                    )}
                  </div>

                  <div>
                    <p className="text-xl font-black" style={forcedDark}>
                      {guruName}
                    </p>
                    <p className="text-sm font-semibold" style={forcedMuted}>
                      Pet Care Guru
                    </p>
                    <p className="mt-1 text-sm font-black" style={forcedGreen}>
                      ★ {rating} ({reviews} reviews)
                    </p>
                    <div
                      className="mt-3 inline-flex rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black"
                      style={forcedGreen}
                    >
                      Generally available{" "}
                      {days
                        .filter((day) => day.enabled)
                        .slice(0, 2)
                        .map((day) => day.shortLabel)
                        .join(" – ")}
                      {days.filter((day) => day.enabled).length > 2 ? "+" : ""}
                    </div>
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black" style={forcedDark}>
                        Availability
                      </p>
                      <p className="text-sm font-semibold" style={forcedMuted}>
                        {monthLabel(calendarMonth)}
                      </p>
                    </div>
                    <div
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black"
                      style={forcedDark}
                    >
                      {publicPreviewLabel}
                    </div>
                  </div>

                  <div
                    className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-black uppercase tracking-[0.06em]"
                    style={forcedMuted}
                  >
                    {["S", "M", "T", "W", "T", "F", "S"].map(
                      (day, index) => (
                        <div key={`${day}-${index}`}>{day}</div>
                      ),
                    )}
                  </div>

                  <div className="mt-1 grid grid-cols-7 gap-1">
                    {previewCells.map((cell) => (
                      <div
                        key={`preview-${cell.iso}`}
                        className={[
                          "relative flex h-9 items-center justify-center overflow-hidden rounded-lg text-xs font-black",
                          !cell.inMonth
                            ? "bg-slate-50 opacity-45"
                            : cell.status === "blackout"
                              ? "bg-rose-50"
                              : cell.status === "pending"
                                ? "bg-amber-50"
                                : cell.status === "available"
                                  ? "bg-emerald-50"
                                  : "bg-slate-50",
                        ].join(" ")}
                      >
                        {cell.inMonth && cell.status === "blackout" ? (
                          <CrossoutMark small />
                        ) : null}

                        <span style={calendarCellTextStyle(cell)}>
                          {cell.dayNumber}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div
                    className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6"
                    style={forcedAmber}
                  >
                    Dates shown as unavailable cannot be booked.
                  </div>

                  <div className="mt-5">
                    <p className="text-sm font-black" style={forcedDark}>
                      Upcoming unavailable dates
                    </p>
                    <div className="mt-3 space-y-2">
                      {filteredBlackouts.slice(0, 3).map((entry) => (
                        <div
                          key={`customer-${entry.date}-${entry.serviceKey}`}
                          className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3"
                        >
                          <p className="text-sm font-black" style={forcedDark}>
                            {formatDisplayDate(entry.date)}
                          </p>
                          <p
                            className="text-sm font-semibold"
                            style={forcedMuted}
                          >
                            {entry.note}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="border-b border-slate-100 pb-5">
                <p
                  className="text-sm font-black uppercase tracking-[0.16em]"
                  style={forcedGreen}
                >
                  Rules and Controls
                </p>
                <h2
                  className="mt-2 text-3xl font-black tracking-tight md:text-[2rem]"
                  style={forcedDark}
                >
                  Booking preferences
                </h2>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label
                    className="mb-2 block text-sm font-black uppercase tracking-[0.08em]"
                    style={forcedMuted}
                  >
                    Buffer between bookings
                  </label>
                  <select
                    value={bufferMinutes}
                    onChange={(event) => {
                      setBufferMinutes(event.target.value);
                      setSaveMessage("");
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    style={forcedDark}
                  >
                    <option
                      value="0"
                      className="bg-white text-slate-950"
                      style={forcedDark}
                    >
                      No buffer
                    </option>
                    <option
                      value="15"
                      className="bg-white text-slate-950"
                      style={forcedDark}
                    >
                      15 minutes
                    </option>
                    <option
                      value="30"
                      className="bg-white text-slate-950"
                      style={forcedDark}
                    >
                      30 minutes
                    </option>
                    <option
                      value="60"
                      className="bg-white text-slate-950"
                      style={forcedDark}
                    >
                      1 hour
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-black uppercase tracking-[0.08em]"
                    style={forcedMuted}
                  >
                    Maximum bookings per day
                  </label>
                  <select
                    value={maxBookingsPerDay}
                    onChange={(event) => {
                      setMaxBookingsPerDay(event.target.value);
                      setSaveMessage("");
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    style={forcedDark}
                  >
                    <option
                      value="1"
                      className="bg-white text-slate-950"
                      style={forcedDark}
                    >
                      1 booking
                    </option>
                    <option
                      value="2"
                      className="bg-white text-slate-950"
                      style={forcedDark}
                    >
                      2 bookings
                    </option>
                    <option
                      value="3"
                      className="bg-white text-slate-950"
                      style={forcedDark}
                    >
                      3 bookings
                    </option>
                    <option
                      value="4"
                      className="bg-white text-slate-950"
                      style={forcedDark}
                    >
                      4 bookings
                    </option>
                    <option
                      value="6"
                      className="bg-white text-slate-950"
                      style={forcedDark}
                    >
                      6 bookings
                    </option>
                  </select>
                </div>

                {[
                  {
                    title: "Publish availability to public profile",
                    description:
                      "Customers can see your available days before messaging or booking.",
                    value: publishAvailability,
                    onClick: () => {
                      setPublishAvailability((current) => !current);
                      setSaveMessage("");
                    },
                  },
                  {
                    title: "Allow same-day booking requests",
                    description:
                      "Customers can request care for the same calendar day.",
                    value: sameDayBooking,
                    onClick: () => {
                      setSameDayBooking((current) => !current);
                      setSaveMessage("");
                    },
                  },
                  {
                    title: "Instant booking mode",
                    description:
                      "Auto-accept bookings instead of manually approving them.",
                    value: instantBooking,
                    onClick: () => {
                      setInstantBooking((current) => !current);
                      setSaveMessage("");
                    },
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div>
                      <p className="text-sm font-black" style={forcedDark}>
                        {item.title}
                      </p>
                      <p
                        className="mt-1 text-sm font-semibold leading-6"
                        style={forcedMuted}
                      >
                        {item.description}
                      </p>
                    </div>
                    <Toggle
                      enabled={item.value}
                      onClick={item.onClick}
                      label={item.title}
                    />
                  </div>
                ))}

                <div>
                  <label
                    className="mb-2 block text-sm font-black uppercase tracking-[0.08em]"
                    style={forcedMuted}
                  >
                    Preview service view
                  </label>
                  <select
                    value={selectedServiceView}
                    onChange={(event) => {
                      setSelectedServiceView(
                        event.target.value as ServiceAvailabilityKey,
                      );
                      setSaveMessage("");
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    style={{
                      color: "#071127",
                      WebkitTextFillColor: "#071127",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    {serviceAvailabilityOptions.map((option) => (
                      <option
                        key={option.key}
                        value={option.key}
                        className="bg-white text-slate-950"
                        style={{
                          color: "#071127",
                          WebkitTextFillColor: "#071127",
                          backgroundColor: "#ffffff",
                        }}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="border-b border-slate-100 pb-5">
                <p
                  className="text-sm font-black uppercase tracking-[0.16em]"
                  style={forcedGreen}
                >
                  Summary
                </p>
                <h2
                  className="mt-2 text-3xl font-black tracking-tight md:text-[2rem]"
                  style={forcedDark}
                >
                  Availability health
                </h2>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {[
                  {
                    label: "Weekly setup",
                    value: weeklySummary,
                    icon: Clock3,
                    color: "text-emerald-600",
                  },
                  {
                    label: "Same-day bookings",
                    value: sameDayBooking ? "Allowed" : "Off",
                    icon: ShieldCheck,
                    color: "text-sky-600",
                  },
                  {
                    label: "Booking approval",
                    value: instantBooking
                      ? "Instant booking on"
                      : "Manual approval",
                    icon: Sparkles,
                    color: "text-violet-600",
                  },
                  {
                    label: "Public visibility",
                    value: publishAvailability ? "Published" : "Hidden",
                    icon: Globe2,
                    color: "text-emerald-600",
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                          <Icon className={`h-5 w-5 ${item.color}`} />
                        </div>
                        <div>
                          <p
                            className="text-sm font-black uppercase tracking-[0.08em]"
                            style={forcedMuted}
                          >
                            {item.label}
                          </p>
                          <p
                            className="mt-1 text-base font-black leading-6"
                            style={forcedDark}
                          >
                            {item.value}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="border-b border-slate-100 pb-5">
                <p
                  className="text-sm font-black uppercase tracking-[0.16em]"
                  style={forcedGreen}
                >
                  Quick Actions
                </p>
                <h2
                  className="mt-2 text-3xl font-black tracking-tight md:text-[2rem]"
                  style={forcedDark}
                >
                  Jump where needed
                </h2>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  {
                    href: "/guru/dashboard/bookings",
                    title: "Bookings",
                    description: "Review requests and upcoming sessions",
                    icon: CalendarDays,
                  },
                  {
                    href: "/guru/dashboard/messages",
                    title: "Messages",
                    description: "Communicate with customers faster",
                    icon: BellRing,
                  },
                  {
                    href: "/guru/dashboard/profile",
                    title: "Profile",
                    description: "Keep trust and public identity strong",
                    icon: UserCircle2,
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-emerald-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                          <Icon className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-black" style={forcedDark}>
                            {item.title}
                          </p>
                          <p
                            className="text-sm font-semibold"
                            style={forcedMuted}
                          >
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-500" />
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
