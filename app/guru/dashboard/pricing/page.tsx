"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  DollarSign,
  Eye,
  Loader2,
  LockKeyhole,
  Save,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

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

type PricingTab = "rates" | "calendar" | "availability" | "preview";

type CalendarStatus = "available" | "blackout" | "closed";

type GuruProfile = {
  id?: string | null;
  user_id?: string | null;
  display_name?: string | null;
  full_name?: string | null;
  slug?: string | null;
  city?: string | null;
  state?: string | null;
  service_city?: string | null;
  service_state?: string | null;
  service_radius_miles?: number | string | null;
  services?: string[] | string | null;
  hourly_rate?: number | string | null;
  rate?: number | string | null;
};

type ServiceRateConfig = {
  service_key: string;
  service_label: string;
  short_label: string;
  description: string;
  default_unit: RateUnit;
  default_duration_minutes: number | null;
  recommended_units: RateUnit[];
  suggested_rate: number | null;
};

type GuruServiceRateRow = {
  id?: string | null;
  guru_id?: string | null;
  service_key?: string | null;
  service_label?: string | null;
  is_enabled?: boolean | null;
  rate_amount?: number | string | null;
  rate_unit?: RateUnit | string | null;
  duration_minutes?: number | string | null;
  notes?: string | null;
};

type ServiceRateState = {
  service_key: string;
  service_label: string;
  short_label: string;
  description: string;
  is_enabled: boolean;
  rate_amount: string;
  rate_unit: RateUnit;
  duration_minutes: string;
  notes: string;
};

type DayAvailability = {
  key: string;
  label: string;
  shortLabel: string;
  enabled: boolean;
  start: string;
  end: string;
};

type WeeklyAvailabilityRow = {
  day_key?: string | null;
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

type CalendarCell = {
  date: Date;
  iso: string;
  dayNumber: number;
  inMonth: boolean;
  status: CalendarStatus;
  note?: string;
};

const RATE_UNIT_OPTIONS: { value: RateUnit; label: string; compact: string }[] =
  [
    { value: "hour", label: "Per hour", compact: "hour" },
    { value: "visit", label: "Per visit", compact: "visit" },
    { value: "walk", label: "Per walk", compact: "walk" },
    { value: "session", label: "Per session", compact: "session" },
    { value: "day", label: "Per day", compact: "day" },
    { value: "night", label: "Per night", compact: "night" },
    { value: "stay", label: "Per stay", compact: "stay" },
    { value: "pet", label: "Per pet", compact: "pet" },
    { value: "add_on", label: "Add-on fee", compact: "add-on" },
    { value: "custom", label: "Custom quote", compact: "custom quote" },
  ];

const SERVICE_RATE_CONFIGS: ServiceRateConfig[] = [
  {
    service_key: "drop_in_visits",
    service_label: "Drop-In Visits",
    short_label: "Drop-In",
    description:
      "Quick visits for feeding, potty breaks, playtime, and check-ins.",
    default_unit: "visit",
    default_duration_minutes: 30,
    recommended_units: ["visit", "hour"],
    suggested_rate: 25,
  },
  {
    service_key: "dog_walking",
    service_label: "Dog Walking",
    short_label: "Walk",
    description:
      "Walks and outdoor exercise for dogs that need movement and attention.",
    default_unit: "walk",
    default_duration_minutes: 30,
    recommended_units: ["walk", "visit", "hour"],
    suggested_rate: 25,
  },
  {
    service_key: "doggy_day_care",
    service_label: "Doggy Day Care",
    short_label: "Day Care",
    description: "Daytime care, companionship, supervision, and enrichment.",
    default_unit: "day",
    default_duration_minutes: null,
    recommended_units: ["day", "visit"],
    suggested_rate: 45,
  },
  {
    service_key: "house_sitting",
    service_label: "House Sitting",
    short_label: "House Sitting",
    description: "Care in the pet parent's home while they are away.",
    default_unit: "night",
    default_duration_minutes: null,
    recommended_units: ["night", "stay", "day"],
    suggested_rate: 55,
  },
  {
    service_key: "pet_sitting",
    service_label: "Pet Sitting",
    short_label: "Pet Sitting",
    description: "General care for pets with a flexible visit or hourly setup.",
    default_unit: "visit",
    default_duration_minutes: 30,
    recommended_units: ["visit", "hour", "day"],
    suggested_rate: 30,
  },
  {
    service_key: "boarding",
    service_label: "Boarding",
    short_label: "Boarding",
    description: "Overnight care in the Guru's home when available.",
    default_unit: "night",
    default_duration_minutes: null,
    recommended_units: ["night", "stay", "day"],
    suggested_rate: 60,
  },
  {
    service_key: "training_support",
    service_label: "Training Support",
    short_label: "Training",
    description:
      "Structured support sessions for manners, routines, and reinforcement.",
    default_unit: "session",
    default_duration_minutes: 60,
    recommended_units: ["session", "hour"],
    suggested_rate: 45,
  },
  {
    service_key: "pet_taxi",
    service_label: "Pet Taxi",
    short_label: "Pet Taxi",
    description:
      "Transportation help for appointments, pickup, drop-off, or errands.",
    default_unit: "visit",
    default_duration_minutes: null,
    recommended_units: ["visit", "hour", "add_on"],
    suggested_rate: 25,
  },
  {
    service_key: "medication_help",
    service_label: "Medication Help",
    short_label: "Medication",
    description: "Medication reminders or add-on help during a visit.",
    default_unit: "add_on",
    default_duration_minutes: null,
    recommended_units: ["add_on", "visit"],
    suggested_rate: 10,
  },
  {
    service_key: "custom_care",
    service_label: "Custom Care",
    short_label: "Custom",
    description:
      "Special care situations that need a custom quote before final pricing.",
    default_unit: "custom",
    default_duration_minutes: null,
    recommended_units: ["custom", "hour", "visit", "session"],
    suggested_rate: null,
  },
];

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

const routes = {
  dashboard: "/guru/dashboard",
  profile: "/guru/dashboard/profile?step=3",
  bookings: "/guru/dashboard/bookings",
  messages: "/guru/dashboard/messages",
  login: "/guru/login",
};

function stringifyError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

function toNullableNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const clean = value.trim();
    if (!clean) return null;

    const parsed = Number(clean);
    if (Number.isFinite(parsed)) return parsed;
  }

  return null;
}

function cleanMoneyInput(value: string) {
  return value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
}

function cleanDurationInput(value: string) {
  return value.replace(/\D/g, "").slice(0, 4);
}

function isRateUnit(value: unknown): value is RateUnit {
  return RATE_UNIT_OPTIONS.some((option) => option.value === value);
}

function formatRateUnitLabel(unit: RateUnit | string | null | undefined) {
  const clean = String(unit || "visit") as RateUnit;
  return (
    RATE_UNIT_OPTIONS.find((option) => option.value === clean)?.label ||
    "Per visit"
  );
}

function formatRateUnitCompact(unit: RateUnit | string | null | undefined) {
  const clean = String(unit || "visit") as RateUnit;
  return (
    RATE_UNIT_OPTIONS.find((option) => option.value === clean)?.compact ||
    "visit"
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatMoneyNoCents(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
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

function buildDefaultServiceRates(enabledServices: string[] = []) {
  return SERVICE_RATE_CONFIGS.map((service) => ({
    service_key: service.service_key,
    service_label: service.service_label,
    short_label: service.short_label,
    description: service.description,
    is_enabled: enabledServices.includes(service.service_label),
    rate_amount: service.suggested_rate ? String(service.suggested_rate) : "",
    rate_unit: service.default_unit,
    duration_minutes:
      service.default_duration_minutes === null
        ? ""
        : String(service.default_duration_minutes),
    notes: "",
  })) satisfies ServiceRateState[];
}

function mergeServiceRates({
  enabledServices,
  savedRates,
}: {
  enabledServices: string[];
  savedRates: GuruServiceRateRow[];
}) {
  const savedByKey = new Map(
    savedRates.map((rate) => [String(rate.service_key), rate]),
  );

  return SERVICE_RATE_CONFIGS.map((service) => {
    const saved = savedByKey.get(service.service_key);
    const savedUnit = saved?.rate_unit;

    return {
      service_key: service.service_key,
      service_label: saved?.service_label || service.service_label,
      short_label: service.short_label,
      description: service.description,
      is_enabled:
        Boolean(saved?.is_enabled) ||
        enabledServices.includes(service.service_label),
      rate_amount:
        saved?.rate_amount !== null && saved?.rate_amount !== undefined
          ? String(saved.rate_amount)
          : service.suggested_rate
            ? String(service.suggested_rate)
            : "",
      rate_unit: isRateUnit(savedUnit) ? savedUnit : service.default_unit,
      duration_minutes:
        saved?.duration_minutes !== null &&
        saved?.duration_minutes !== undefined
          ? String(saved.duration_minutes)
          : service.default_duration_minutes === null
            ? ""
            : String(service.default_duration_minutes),
      notes: saved?.notes || "",
    } satisfies ServiceRateState;
  });
}

function getEnabledServiceLabels(serviceRates: ServiceRateState[]) {
  return serviceRates
    .filter((service) => service.is_enabled)
    .map((service) => service.service_label);
}

function normalizeTime(value?: string | null, fallback = "09:00") {
  if (!value) return fallback;
  return value.slice(0, 5);
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

function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string) {
  if (!value) return "Not selected";

  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
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

function buildCalendarCells({
  monthDate,
  days,
  blackouts,
  selectedServiceKey,
}: {
  monthDate: Date;
  days: DayAvailability[];
  blackouts: BlackoutDateRow[];
  selectedServiceKey: string;
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
    const matchingBlackout = blackouts.find((entry) => {
      const blackoutDate = entry.blackout_date || "";
      const serviceKey = entry.service_key || "all_services";

      return (
        blackoutDate === iso &&
        (serviceKey === "all_services" || serviceKey === selectedServiceKey)
      );
    });

    let status: CalendarStatus = scheduleDay?.enabled ? "available" : "closed";
    if (matchingBlackout) status = "blackout";

    return {
      date,
      iso,
      dayNumber: date.getDate(),
      inMonth: date.getMonth() === month,
      status,
      note: matchingBlackout?.note || undefined,
    };
  });
}

async function loadGuruServiceRates(guruId: string, enabledServices: string[]) {
  if (!guruId) return buildDefaultServiceRates(enabledServices);

  const { data, error } = await supabase
    .from("guru_service_rates")
    .select("*")
    .eq("guru_id", guruId)
    .order("service_label", { ascending: true });

  if (error) {
    console.warn("Could not load Guru service rates:", error.message);
    return buildDefaultServiceRates(enabledServices);
  }

  return mergeServiceRates({
    enabledServices,
    savedRates: (data || []) as GuruServiceRateRow[],
  });
}

async function saveGuruServiceRates(
  guruId: string,
  serviceRates: ServiceRateState[],
) {
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

  const { error } = await supabase.from("guru_service_rates").upsert(payload, {
    onConflict: "guru_id,service_key",
  });

  if (!error) return;

  console.warn(
    "Guru service rate upsert failed. Trying replace save:",
    error.message,
  );

  const { error: deleteError } = await supabase
    .from("guru_service_rates")
    .delete()
    .eq("guru_id", guruId);
  if (deleteError) throw deleteError;

  const { error: insertError } = await supabase
    .from("guru_service_rates")
    .insert(payload);
  if (insertError) throw insertError;
}

async function saveWeeklyAvailability(
  userId: string,
  weeklyAvailability: DayAvailability[],
) {
  const now = new Date().toISOString();
  const payload = weeklyAvailability.map((day) => ({
    user_id: userId,
    day_key: day.key,
    day_label: day.label,
    day_short_label: day.shortLabel,
    enabled: day.enabled,
    start_time: day.start,
    end_time: day.end,
    updated_at: now,
  }));

  const { error } = await supabase
    .from("guru_weekly_availability")
    .upsert(payload, {
      onConflict: "user_id,day_key",
    });

  if (!error) return;

  console.warn(
    "Guru weekly availability upsert failed. Trying replace save:",
    error.message,
  );

  const { error: deleteError } = await supabase
    .from("guru_weekly_availability")
    .delete()
    .eq("user_id", userId);
  if (deleteError) throw deleteError;

  const { error: insertError } = await supabase
    .from("guru_weekly_availability")
    .insert(payload);
  if (insertError) throw insertError;
}

function LoadingState() {
  return (
    <main
      className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_45%,#ecfdf5_100%)] px-4 py-10 text-slate-950"
      style={{
        fontFamily:
          '"Open Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontWeight: 600,
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-center">
        <div className="rounded-[2rem] border border-emerald-100 bg-white px-8 py-6 text-center shadow-sm">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-emerald-600" />
          <p className="mt-3 text-base font-bold text-slate-900">
            Loading Guru pricing workspace...
          </p>
        </div>
      </div>
    </main>
  );
}

export default function GuruDashboardPricingPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [userId, setUserId] = useState("");
  const [guruId, setGuruId] = useState("");
  const [guruName, setGuruName] = useState("Your Guru profile");
  const [guruSlug, setGuruSlug] = useState("");
  const [guruLocation, setGuruLocation] = useState("");

  const [activeTab, setActiveTab] = useState<PricingTab>("rates");
  const [serviceRates, setServiceRates] = useState<ServiceRateState[]>(() =>
    buildDefaultServiceRates(),
  );
  const [weeklyAvailability, setWeeklyAvailability] =
    useState<DayAvailability[]>(defaultAvailability);
  const [blackoutDates, setBlackoutDates] = useState<BlackoutDateRow[]>([]);
  const [selectedServiceKey, setSelectedServiceKey] =
    useState("drop_in_visits");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [blackoutDate, setBlackoutDate] = useState("");
  const [blackoutServiceKey, setBlackoutServiceKey] = useState("all_services");
  const [blackoutNote, setBlackoutNote] = useState("");

  const enabledServiceRates = useMemo(
    () => serviceRates.filter((service) => service.is_enabled),
    [serviceRates],
  );

  const selectedService = useMemo(
    () =>
      serviceRates.find(
        (service) => service.service_key === selectedServiceKey,
      ) || serviceRates[0],
    [serviceRates, selectedServiceKey],
  );

  const selectedServiceAmount = toNullableNumber(selectedService?.rate_amount);
  const selectedServiceIsCustom = selectedService?.rate_unit === "custom";
  const selectedServicePriceLabel = selectedServiceIsCustom
    ? "Custom quote"
    : selectedServiceAmount !== null
      ? `${formatMoneyNoCents(selectedServiceAmount)} / ${formatRateUnitCompact(selectedService.rate_unit)}`
      : "Rate needed";

  const calendarCells = useMemo(
    () =>
      buildCalendarCells({
        monthDate: calendarMonth,
        days: weeklyAvailability,
        blackouts: blackoutDates,
        selectedServiceKey,
      }),
    [calendarMonth, weeklyAvailability, blackoutDates, selectedServiceKey],
  );

  const pricingReadyCount = enabledServiceRates.filter(
    (service) => service.rate_unit === "custom" || service.rate_amount.trim(),
  ).length;

  const activeDaysCount = weeklyAvailability.filter(
    (day) => day.enabled,
  ).length;

  useEffect(() => {
    let mounted = true;

    async function loadPricingWorkspace() {
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
          router.replace(routes.login);
          return;
        }

        setUserId(user.id);

        const { data: guruRows, error: guruError } = await supabase
          .from("gurus")
          .select("*")
          .eq("user_id", user.id)
          .limit(1);

        if (!mounted) return;

        if (guruError) throw guruError;

        const guruProfile = (guruRows?.[0] as GuruProfile | undefined) || null;

        if (!guruProfile?.id) {
          setErrorMessage(
            "Create your Guru profile first. Pricing is connected to your Guru profile record.",
          );
          setGuruName("Guru profile needed");
          setGuruId("");
          setServiceRates(buildDefaultServiceRates());
          setLoading(false);
          return;
        }

        const normalizedServices = normalizeServices(guruProfile.services);
        const loadedServiceRates = await loadGuruServiceRates(
          guruProfile.id,
          normalizedServices,
        );
        const firstEnabledService =
          loadedServiceRates.find((service) => service.is_enabled) ||
          loadedServiceRates[0];

        setGuruId(guruProfile.id);
        setGuruName(
          guruProfile.display_name ||
            guruProfile.full_name ||
            "Your Guru profile",
        );
        setGuruSlug(guruProfile.slug || "");
        setGuruLocation(
          [
            guruProfile.service_city || guruProfile.city,
            guruProfile.service_state || guruProfile.state,
          ]
            .filter(Boolean)
            .join(", "),
        );
        setServiceRates(loadedServiceRates);
        setSelectedServiceKey(
          firstEnabledService?.service_key || "drop_in_visits",
        );

        const [{ data: weeklyData }, { data: blackoutData }] =
          await Promise.all([
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

        if (weeklyData && weeklyData.length > 0) {
          setWeeklyAvailability(
            mergeWeeklyRows(weeklyData as WeeklyAvailabilityRow[]),
          );
        } else {
          setWeeklyAvailability(defaultAvailability);
        }

        setBlackoutDates((blackoutData || []) as BlackoutDateRow[]);
        setLoading(false);
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(
          `Could not load pricing workspace: ${stringifyError(error)}`,
        );
        setLoading(false);
      }
    }

    loadPricingWorkspace();

    return () => {
      mounted = false;
    };
  }, [router]);

  function updateServiceRate(
    serviceKey: string,
    field: keyof Pick<
      ServiceRateState,
      "rate_amount" | "rate_unit" | "duration_minutes" | "notes"
    >,
    value: string,
  ) {
    setServiceRates((current) =>
      current.map((service) => {
        if (service.service_key !== serviceKey) return service;

        if (field === "rate_amount") {
          return { ...service, rate_amount: cleanMoneyInput(value) };
        }

        if (field === "duration_minutes") {
          return { ...service, duration_minutes: cleanDurationInput(value) };
        }

        if (field === "rate_unit") {
          const nextUnit = isRateUnit(value) ? value : service.rate_unit;
          return {
            ...service,
            rate_unit: nextUnit,
            rate_amount: nextUnit === "custom" ? "" : service.rate_amount,
          };
        }

        return { ...service, notes: value };
      }),
    );
  }

  function toggleService(serviceKey: string) {
    setServiceRates((current) =>
      current.map((service) =>
        service.service_key === serviceKey
          ? { ...service, is_enabled: !service.is_enabled }
          : service,
      ),
    );
  }

  function updateWeeklyAvailability(
    dayKey: string,
    field: keyof Pick<DayAvailability, "enabled" | "start" | "end">,
    value: string | boolean,
  ) {
    setWeeklyAvailability((current) =>
      current.map((day) =>
        day.key === dayKey ? { ...day, [field]: value } : day,
      ),
    );
  }

  async function handleSave() {
    if (!userId || !guruId || saving) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      for (const service of serviceRates.filter((item) => item.is_enabled)) {
        const rateAmount = service.rate_amount.trim()
          ? Number(service.rate_amount)
          : null;
        const duration = service.duration_minutes.trim()
          ? Number(service.duration_minutes)
          : null;

        if (
          service.rate_unit !== "custom" &&
          (rateAmount === null || Number.isNaN(rateAmount) || rateAmount < 0)
        ) {
          throw new Error(
            `${service.service_label} needs a valid rate amount or Custom quote.`,
          );
        }

        if (duration !== null && (Number.isNaN(duration) || duration < 0)) {
          throw new Error(
            `${service.service_label} duration must be a valid non-negative number.`,
          );
        }
      }

      await saveGuruServiceRates(guruId, serviceRates);
      await saveWeeklyAvailability(userId, weeklyAvailability);

      const enabledLabels = getEnabledServiceLabels(serviceRates);
      const primaryRate = serviceRates.find(
        (service) =>
          service.is_enabled &&
          service.rate_unit !== "custom" &&
          service.rate_amount.trim(),
      );
      const parsedPrimaryRate = primaryRate
        ? Number(primaryRate.rate_amount)
        : null;

      await supabase
        .from("gurus")
        .update({
          services: enabledLabels,
          hourly_rate: parsedPrimaryRate,
          rate: parsedPrimaryRate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", guruId);

      setSuccessMessage(
        "Pricing and availability saved. Website booking calendars now use these settings.",
      );
      router.refresh();
    } catch (error) {
      setErrorMessage(
        `Could not save pricing workspace: ${stringifyError(error)}`,
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAddBlackoutDate() {
    if (!userId || !blackoutDate) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const payload = {
        user_id: userId,
        blackout_date: blackoutDate,
        service_key: blackoutServiceKey,
        note: blackoutNote.trim() || null,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("guru_blackout_dates")
        .insert(payload);
      if (error) throw error;

      const { data } = await supabase
        .from("guru_blackout_dates")
        .select("*")
        .eq("user_id", userId)
        .order("blackout_date", { ascending: true });

      setBlackoutDates((data || []) as BlackoutDateRow[]);
      setBlackoutDate("");
      setBlackoutServiceKey("all_services");
      setBlackoutNote("");
      setSuccessMessage("Unavailable date added to your booking calendar.");
    } catch (error) {
      setErrorMessage(
        `Could not add unavailable date: ${stringifyError(error)}`,
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteBlackoutDate(entry: BlackoutDateRow) {
    if (!userId) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      let query = supabase
        .from("guru_blackout_dates")
        .delete()
        .eq("user_id", userId);

      if (entry.id) {
        query = query.eq("id", entry.id);
      } else {
        query = query
          .eq("blackout_date", entry.blackout_date || "")
          .eq("service_key", entry.service_key || "all_services");
      }

      const { error } = await query;
      if (error) throw error;

      setBlackoutDates((current) =>
        current.filter((item) => {
          if (entry.id && item.id) return item.id !== entry.id;
          return !(
            item.blackout_date === entry.blackout_date &&
            (item.service_key || "all_services") ===
              (entry.service_key || "all_services")
          );
        }),
      );
      setSuccessMessage("Unavailable date removed.");
    } catch (error) {
      setErrorMessage(
        `Could not remove unavailable date: ${stringifyError(error)}`,
      );
    } finally {
      setSaving(false);
    }
  }

  function moveCalendar(direction: "prev" | "next") {
    setCalendarMonth((current) => {
      const next = new Date(current);
      next.setMonth(current.getMonth() + (direction === "next" ? 1 : -1));
      return next;
    });
  }

  if (loading) return <LoadingState />;

  return (
    <main
      className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_42%,#ecfdf5_100%)] px-4 py-6 text-slate-950 md:px-6 lg:px-8"
      style={{
        fontFamily:
          '"Open Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontWeight: 600,
      }}
    >
      <div className="mx-auto max-w-[1480px]">
        <section className="overflow-hidden rounded-[2.25rem] border border-emerald-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="grid gap-8 bg-[radial-gradient(circle_at_78%_20%,rgba(255,255,255,0.95),transparent_18%),linear-gradient(120deg,#00d69f_0%,#66e3c7_48%,#b8e5ff_100%)] px-6 py-8 md:px-10 md:py-12 lg:grid-cols-[1.18fr_0.82fr] lg:items-center">
            <div>
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <Link
                  href={routes.dashboard}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white/85 px-4 py-2 text-sm font-extrabold text-slate-950 shadow-sm ring-1 ring-white/70 transition hover:bg-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Guru Dashboard
                </Link>

                <span className="inline-flex items-center gap-2 rounded-2xl bg-white/80 px-4 py-2 text-sm font-extrabold text-emerald-800 shadow-sm ring-1 ring-white/70">
                  <DollarSign className="h-4 w-4" />
                  Pricing Workspace
                </span>
              </div>

              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-800 shadow-sm ring-1 ring-white/70">
                <Sparkles className="h-4 w-4" />
                Mobile-style calendar pricing for website bookings
              </div>

              <h1 className="max-w-4xl text-4xl font-black tracking-[-0.045em] text-slate-950 md:text-6xl lg:text-7xl">
                Manage pricing in 3 simple steps.
              </h1>

              <p className="mt-5 max-w-3xl text-base font-bold leading-8 text-slate-800 md:text-xl">
                Use this page to control the prices Pet Parents see on the
                website booking calendar. Start with service rates, confirm open
                days, then preview the customer view before saving.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !guruId}
                  className="inline-flex min-w-[150px] items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-extrabold text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving ? "Saving..." : "Save pricing"}
                </button>

                <Link
                  href={routes.profile}
                  className="inline-flex min-w-[150px] items-center justify-center rounded-2xl bg-white/90 px-6 py-4 text-sm font-extrabold text-slate-950 shadow-sm ring-1 ring-white/80 transition hover:-translate-y-0.5 hover:bg-white"
                >
                  Profile Step 3
                </Link>

                {guruSlug ? (
                  <Link
                    href={`/book/${guruSlug}`}
                    className="inline-flex min-w-[150px] items-center justify-center rounded-2xl bg-white/90 px-6 py-4 text-sm font-extrabold text-slate-950 shadow-sm ring-1 ring-white/80 transition hover:-translate-y-0.5 hover:bg-white"
                  >
                    Preview Booking
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-xl shadow-emerald-900/10">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                Quick status
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                {guruName}
              </h2>
              {guruLocation ? (
                <p className="mt-2 text-sm font-bold text-slate-800">
                  {guruLocation}
                </p>
              ) : null}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
                    Services
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {enabledServiceRates.length}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-800">
                    Priced
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {pricingReadyCount}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-800">
                    Active days
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {activeDaysCount}
                  </p>
                </div>
                <div className="rounded-2xl bg-rose-50 p-4 ring-1 ring-rose-100">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-rose-700">
                    Blocked
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {blackoutDates.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {errorMessage ? (
          <div className="mt-6 rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-rose-800 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
              <div>
                <p className="font-extrabold text-rose-900">Pricing error</p>
                <p className="mt-1 text-sm font-bold leading-6">
                  {errorMessage}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {successMessage ? (
          <div className="mt-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800 shadow-sm">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div>
                <p className="font-extrabold text-emerald-900">Saved</p>
                <p className="mt-1 text-sm font-bold leading-6">
                  {successMessage}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {!guruId ? (
          <section className="mt-6 rounded-[2rem] border border-amber-200 bg-amber-50 p-6">
            <p className="text-lg font-black text-amber-950">
              Create your Guru profile first
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-amber-900">
              Pricing needs a Guru profile row before it can save service rates
              and booking calendar settings.
            </p>
            <Link
              href="/guru/dashboard/profile"
              className="mt-4 inline-flex rounded-2xl bg-amber-600 px-5 py-3 text-sm font-black text-white"
            >
              Open Profile Builder
            </Link>
          </section>
        ) : null}

        {guruId ? (
          <section className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="space-y-6">
              <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <p className="px-1 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  Pricing setup flow
                </p>
                <div className="mt-3 grid gap-3 lg:grid-cols-4">
                  {[
                    {
                      key: "rates" as PricingTab,
                      label: "1. Services & rates",
                      helper: "Turn services on and set prices.",
                      icon: DollarSign,
                    },
                    {
                      key: "availability" as PricingTab,
                      label: "2. Open days",
                      helper: "Choose when customers can book.",
                      icon: Clock3,
                    },
                    {
                      key: "calendar" as PricingTab,
                      label: "3. Calendar preview",
                      helper: "See the price shown by date.",
                      icon: CalendarDays,
                    },
                    {
                      key: "preview" as PricingTab,
                      label: "4. Customer view",
                      helper: "Review what Pet Parents see.",
                      icon: Eye,
                    },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.key;

                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className={[
                          "flex min-h-[92px] items-start gap-3 rounded-2xl border px-4 py-4 text-left transition",
                          active
                            ? "border-emerald-500 bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                            : "border-slate-200 bg-slate-50 text-slate-800 hover:border-emerald-200 hover:bg-emerald-50",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                            active
                              ? "bg-white/20 text-white"
                              : "bg-white text-emerald-700",
                          ].join(" ")}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <span>
                          <span className="block text-sm font-black leading-5">
                            {tab.label}
                          </span>
                          <span
                            className={[
                              "mt-1 block text-xs font-bold leading-5",
                              active ? "text-white/95" : "text-slate-800",
                            ].join(" ")}
                          >
                            {tab.helper}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {activeTab === "rates" ? (
                <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                        Service rates
                      </p>
                      <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                        Set what customers see.
                      </h2>
                      <p className="mt-2 text-sm font-bold leading-6 text-slate-800">
                        Turn on only the services you actually offer. Each
                        active service must have a price or Custom quote before
                        it appears clearly on the booking calendar.
                      </p>
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                          <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-700">
                            Step 1
                          </p>
                          <p className="mt-1 text-sm font-black text-slate-950">
                            Enable the service
                          </p>
                        </div>
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                          <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-700">
                            Step 2
                          </p>
                          <p className="mt-1 text-sm font-black text-slate-950">
                            Enter the rate
                          </p>
                        </div>
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                          <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-700">
                            Step 3
                          </p>
                          <p className="mt-1 text-sm font-black text-slate-950">
                            Save and preview
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save
                    </button>
                  </div>

                  <div className="mt-6 space-y-4">
                    {serviceRates.map((service) => {
                      const active = service.is_enabled;
                      const config = SERVICE_RATE_CONFIGS.find(
                        (item) => item.service_key === service.service_key,
                      );
                      const recommendedUnits = config?.recommended_units || [
                        service.rate_unit,
                      ];

                      return (
                        <div
                          key={service.service_key}
                          className={[
                            "rounded-[1.75rem] border p-5 transition",
                            active
                              ? "border-emerald-200 bg-emerald-50/70 shadow-sm"
                              : "border-slate-200 bg-slate-50",
                          ].join(" ")}
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="text-xl font-black text-slate-950">
                                {service.service_label}
                              </p>
                              <p className="mt-1 text-sm font-bold leading-6 text-slate-800">
                                {service.description}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleService(service.service_key)}
                              className={[
                                "inline-flex min-h-[56px] items-center justify-center rounded-2xl border px-5 py-3 text-sm font-black transition lg:min-w-[240px]",
                                active
                                  ? "border-emerald-500 bg-emerald-600 text-white shadow-sm"
                                  : "border-slate-300 bg-white text-slate-950 shadow-sm hover:border-emerald-200 hover:bg-emerald-50",
                              ].join(" ")}
                            >
                              {active ? "ON - offered" : "OFF - not offered"}
                            </button>

                            <div className="flex flex-wrap gap-2 text-xs font-black text-slate-800">
                              {recommendedUnits.slice(0, 3).map((unit) => (
                                <span
                                  key={unit}
                                  className="rounded-full border border-white bg-white px-3 py-1 text-emerald-800 shadow-sm"
                                >
                                  {formatRateUnitLabel(unit)}
                                </span>
                              ))}
                            </div>
                          </div>

                          {active ? (
                            <div className="mt-5 grid gap-4 rounded-[1.35rem] border border-white bg-white/80 p-4 md:grid-cols-[0.75fr_1fr_0.75fr]">
                              <div>
                                <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-900">
                                  Customer price
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
                                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 placeholder:text-slate-900 outline-none transition disabled:bg-slate-50 disabled:text-slate-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                                />
                              </div>

                              <div>
                                <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-900">
                                  Charged by
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
                                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none transition [color:#07132f] [-webkit-text-fill-color:#07132f] focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
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
                                <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-900">
                                  Typical duration
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
                                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 placeholder:text-slate-900 outline-none transition [color:#07132f] [-webkit-text-fill-color:#07132f] focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                                />
                              </div>

                              <div className="md:col-span-3">
                                <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-900">
                                  Customer-facing notes
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
                                  placeholder="Example: Includes feeding, water refresh, and photo update."
                                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 placeholder:text-slate-900 outline-none transition [color:#07132f] [-webkit-text-fill-color:#07132f] focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                                />
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              {activeTab === "calendar" ? (
                <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                        Hotel-style calendar
                      </p>
                      <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                        Preview prices by date.
                      </h2>
                      <p className="mt-2 text-sm font-bold leading-6 text-slate-800">
                        This mirrors the customer website booking calendar.
                        Available dates show the selected service price.
                      </p>
                    </div>
                    <select
                      value={selectedServiceKey}
                      onChange={(event) =>
                        setSelectedServiceKey(event.target.value)
                      }
                      className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    >
                      {serviceRates.map((service) => (
                        <option
                          key={service.service_key}
                          value={service.service_key}
                        >
                          {service.service_label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-5 rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-sm font-black text-emerald-900">
                      Selected service: {selectedService?.service_label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      Calendar display: {selectedServicePriceLabel}
                    </p>
                  </div>

                  <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <button
                        type="button"
                        onClick={() => moveCalendar("prev")}
                        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-800 transition hover:bg-slate-50"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>

                      <h3 className="text-xl font-black text-slate-950">
                        {monthLabel(calendarMonth)}
                      </h3>

                      <button
                        type="button"
                        onClick={() => moveCalendar("next")}
                        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-800 transition hover:bg-slate-50"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="p-3 md:p-4">
                      <div className="grid grid-cols-7 gap-2 text-center text-xs font-black uppercase tracking-[0.08em] text-slate-800">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                          (day) => (
                            <div key={day} className="py-2">
                              {day}
                            </div>
                          ),
                        )}
                      </div>

                      <div className="grid grid-cols-7 gap-2">
                        {calendarCells.map((cell) => {
                          const available =
                            cell.inMonth &&
                            cell.status === "available" &&
                            selectedService?.is_enabled;
                          const blackout =
                            cell.inMonth && cell.status === "blackout";
                          const closed =
                            cell.inMonth && cell.status === "closed";

                          return (
                            <div
                              key={cell.iso}
                              className={[
                                "relative flex min-h-[64px] flex-col items-center justify-center rounded-xl border px-1 py-2 text-center text-sm font-black transition md:min-h-[76px]",
                                !cell.inMonth
                                  ? "border-slate-100 bg-slate-50 text-slate-300"
                                  : blackout
                                    ? "border-rose-100 bg-rose-50 text-rose-600"
                                    : closed
                                      ? "border-slate-100 bg-slate-50 text-slate-900"
                                      : available
                                        ? "border-emerald-100 bg-emerald-50 text-emerald-800"
                                        : "border-amber-100 bg-amber-50 text-amber-700",
                              ].join(" ")}
                            >
                              <span>{cell.dayNumber}</span>
                              {available ? (
                                <span className="mt-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-black text-emerald-800 shadow-sm">
                                  {selectedServiceIsCustom
                                    ? "Quote"
                                    : selectedServiceAmount !== null
                                      ? formatMoneyNoCents(
                                          selectedServiceAmount,
                                        )
                                      : "Rate"}
                                </span>
                              ) : null}
                              {blackout ? <X className="mt-1 h-4 w-4" /> : null}
                              {closed ? (
                                <span className="mt-1 text-[10px] uppercase tracking-wide">
                                  Closed
                                </span>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </section>
              ) : null}

              {activeTab === "availability" ? (
                <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                        Availability rules
                      </p>
                      <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                        Set open days and blocked dates.
                      </h2>
                      <p className="mt-2 text-sm font-bold leading-6 text-slate-800">
                        Weekly availability and blackout dates feed the website
                        booking calendar.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save availability
                    </button>
                  </div>

                  <div className="mt-6 space-y-3">
                    {weeklyAvailability.map((day) => (
                      <div
                        key={day.key}
                        className="grid gap-3 rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_0.9fr_0.9fr] md:items-center"
                      >
                        <label className="flex items-center gap-3 text-sm font-black text-slate-950">
                          <input
                            type="checkbox"
                            checked={day.enabled}
                            onChange={(event) =>
                              updateWeeklyAvailability(
                                day.key,
                                "enabled",
                                event.target.checked,
                              )
                            }
                            className="h-5 w-5 rounded border-slate-300 accent-emerald-600"
                          />
                          {day.label}
                        </label>
                        <input
                          type="time"
                          value={day.start}
                          onChange={(event) =>
                            updateWeeklyAvailability(
                              day.key,
                              "start",
                              event.target.value,
                            )
                          }
                          disabled={!day.enabled}
                          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 disabled:bg-slate-50 disabled:text-slate-900"
                        />
                        <input
                          type="time"
                          value={day.end}
                          onChange={(event) =>
                            updateWeeklyAvailability(
                              day.key,
                              "end",
                              event.target.value,
                            )
                          }
                          disabled={!day.enabled}
                          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 disabled:bg-slate-50 disabled:text-slate-900"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-7 rounded-[1.5rem] border border-rose-100 bg-rose-50 p-5">
                    <p className="text-sm font-black text-rose-950">
                      Add unavailable date
                    </p>
                    <div className="mt-4 grid gap-3 md:grid-cols-[0.8fr_1fr_1.3fr_auto] md:items-end">
                      <div>
                        <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-rose-900">
                          Date
                        </label>
                        <input
                          type="date"
                          value={blackoutDate}
                          onChange={(event) =>
                            setBlackoutDate(event.target.value)
                          }
                          className="w-full rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-rose-900">
                          Service
                        </label>
                        <select
                          value={blackoutServiceKey}
                          onChange={(event) =>
                            setBlackoutServiceKey(event.target.value)
                          }
                          className="w-full rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none"
                        >
                          <option value="all_services">All services</option>
                          {serviceRates.map((service) => (
                            <option
                              key={service.service_key}
                              value={service.service_key}
                            >
                              {service.service_label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-rose-900">
                          Note
                        </label>
                        <input
                          value={blackoutNote}
                          onChange={(event) =>
                            setBlackoutNote(event.target.value)
                          }
                          placeholder="Example: Family event"
                          className="w-full rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddBlackoutDate}
                        disabled={!blackoutDate || saving}
                        className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black text-white transition hover:bg-rose-700 disabled:opacity-60"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </section>
              ) : null}

              {activeTab === "preview" ? (
                <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                    Customer preview
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                    What Pet Parents will understand.
                  </h2>
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {enabledServiceRates.length > 0 ? (
                      enabledServiceRates.map((service) => {
                        const amount = toNullableNumber(service.rate_amount);

                        return (
                          <div
                            key={service.service_key}
                            className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
                          >
                            <p className="text-lg font-black text-slate-950">
                              {service.service_label}
                            </p>
                            <p className="mt-2 text-3xl font-black text-emerald-700">
                              {service.rate_unit === "custom"
                                ? "Custom quote"
                                : amount !== null
                                  ? `${formatMoneyNoCents(amount)} / ${formatRateUnitCompact(service.rate_unit)}`
                                  : "Rate needed"}
                            </p>
                            {service.duration_minutes ? (
                              <p className="mt-2 text-sm font-bold text-slate-800">
                                Typical duration: {service.duration_minutes}{" "}
                                minutes
                              </p>
                            ) : null}
                            {service.notes ? (
                              <p className="mt-3 text-sm font-bold leading-6 text-slate-900">
                                {service.notes}
                              </p>
                            ) : null}
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 md:col-span-2">
                        <p className="text-sm font-black text-amber-950">
                          No services enabled yet.
                        </p>
                        <p className="mt-2 text-sm font-bold leading-6 text-amber-900">
                          Go to Rates and enable at least one service.
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              ) : null}
            </div>

            <aside className="space-y-6 2xl:sticky 2xl:top-28 2xl:self-start">
              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                    Booking engine status
                  </p>
                </div>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                  What this controls
                </h2>
                <p className="mt-3 text-sm font-semibold leading-7 text-slate-900">
                  These saved settings feed the public booking page. Pet Parents
                  see service prices on available calendar days, and Custom
                  quote stays inside SitGuru instead of sending anyone
                  off-platform.
                </p>

                <div className="mt-5 space-y-3">
                  {[
                    ["Enabled services", String(enabledServiceRates.length)],
                    [
                      "Priced or quoted",
                      `${pricingReadyCount}/${enabledServiceRates.length || 0}`,
                    ],
                    ["Available weekdays", String(activeDaysCount)],
                    ["Unavailable dates", String(blackoutDates.length)],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                    >
                      <span className="font-bold text-slate-800">{label}</span>
                      <span className="font-black text-slate-950">{value}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-800">
                      Blocked calendar dates
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                      Unavailable
                    </h2>
                  </div>
                  <LockKeyhole className="h-7 w-7 text-slate-900" />
                </div>

                <div className="mt-5 space-y-3">
                  {blackoutDates.length > 0 ? (
                    blackoutDates.slice(0, 8).map((entry) => {
                      const serviceLabel =
                        entry.service_key === "all_services" ||
                        !entry.service_key
                          ? "All services"
                          : serviceRates.find(
                              (service) =>
                                service.service_key === entry.service_key,
                            )?.service_label || entry.service_key;

                      return (
                        <div
                          key={`${entry.id || entry.blackout_date}-${entry.service_key || "all"}`}
                          className="rounded-2xl border border-rose-100 bg-rose-50 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-black text-rose-950">
                                {formatDisplayDate(entry.blackout_date || "")}
                              </p>
                              <p className="mt-1 text-xs font-bold text-rose-800">
                                {serviceLabel}
                              </p>
                              {entry.note ? (
                                <p className="mt-2 text-xs font-semibold leading-5 text-slate-900">
                                  {entry.note}
                                </p>
                              ) : null}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteBlackoutDate(entry)}
                              disabled={saving}
                              className="rounded-xl bg-white px-3 py-2 text-xs font-black text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-100 disabled:opacity-60"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-800">
                      No blocked dates yet.
                    </div>
                  )}
                </div>
              </section>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex min-h-[60px] w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-6 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
                {saving ? "Saving..." : "Save all pricing settings"}
              </button>
            </aside>
          </section>
        ) : null}
      </div>
    </main>
  );
}
