"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  CreditCard,
  Home,
  Loader2,
  LockKeyhole,
  MapPin,
  PawPrint,
  ShieldCheck,
  Star,
  UserCircle2,
  X,
  Zap,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type BookingStep = 1 | 2 | 3;

type ServiceKey =
  | "drop_in_visit"
  | "house_sitting"
  | "doggy_day_care"
  | "dog_walking";

type CalendarStatus = "available" | "blackout" | "pending" | "closed";

type PetProfile = {
  id: string;
  name: string;
  species: string | null;
  breed: string | null;
  age: string | null;
  weight: string | null;
  temperament: string | null;
  medications: string | null;
  notes: string | null;
  photo_url: string | null;
  video_url: string | null;
};

type BookGuruClientProps = {
  guruId?: string | number;
  guruSlug: string;
  guruName: string;
  calendarUsername?: string | null;
  calendarEventTypeSlug?: string | null;
  calUsername?: string | null;
  calEventTypeSlug?: string | null;
  initialGuruPhotoUrl?: string | null;
  initialGuruBio?: string | null;
  initialGuruCity?: string | null;
  initialGuruState?: string | null;
  initialGuruRatingAvg?: number | null;
  initialGuruReviewCount?: number | null;
  initialGuruHourlyRate?: number | null;
  initialGuruYearsExperience?: number | null;
  initialGuruCompletedBookings?: number | null;
  initialGuruResponseRate?: number | null;
};

type CustomerProfile = {
  full_name: string | null;
  avatar_url?: string | null;
  profile_photo_url?: string | null;
  photo_url?: string | null;
};

type GuruProfileRow = {
  id?: string | number | null;
  user_id?: string | null;
  display_name?: string | null;
  full_name?: string | null;
  slug?: string | null;
  bio?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  profile_photo_url?: string | null;
  photo_url?: string | null;
  avatar_url?: string | null;
  image_url?: string | null;
  rating_avg?: number | null;
  review_count?: number | null;
  hourly_rate?: number | null;
  rate?: number | null;
  years_experience?: number | null;
  completed_bookings?: number | null;
  response_rate?: number | null;
};

type GuruProfileFallbackRow = {
  id?: string | null;
  full_name?: string | null;
  bio?: string | null;
  city?: string | null;
  state?: string | null;
  avatar_url?: string | null;
  profile_photo_url?: string | null;
  photo_url?: string | null;
  image_url?: string | null;
};

type ZipLookupResult = {
  zip: string;
  city: string;
  state: string;
  stateName?: string;
  latitude: number | null;
  longitude: number | null;
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

type CalendarCell = {
  date: Date;
  iso: string;
  dayNumber: number;
  inMonth: boolean;
  status: CalendarStatus;
  note?: string;
};

const serviceOptions: {
  key: ServiceKey;
  label: string;
  shortLabel: string;
  description: string;
  basePrice: number;
}[] = [
  {
    key: "drop_in_visit",
    label: "Drop-In Visits",
    shortLabel: "Drop-In",
    description:
      "Quick visits for feeding, potty breaks, playtime, and check-ins.",
    basePrice: 25,
  },
  {
    key: "house_sitting",
    label: "House Sitting",
    shortLabel: "House Sitting",
    description: "Care in your home while you are away.",
    basePrice: 55,
  },
  {
    key: "doggy_day_care",
    label: "In-Home Dog Day Care",
    shortLabel: "Day Care",
    description: "Daytime care, companionship, and supervision.",
    basePrice: 45,
  },
  {
    key: "dog_walking",
    label: "Dog Walking",
    shortLabel: "Dog Walking",
    description: "Walks and outdoor exercise for your dog.",
    basePrice: 25,
  },
];

const bookingTypeOptions = [
  "Request Booking",
  "Instant Booking",
  "Meet & Greet First",
];

const timeWindowOptions = [
  "Flexible",
  "Morning",
  "Midday",
  "Afternoon",
  "Evening",
  "Overnight",
  "Specific time needed",
];

const visitLengthOptions = ["30 minutes", "60 minutes", "90 minutes"];

const usStateOptions = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
];

const stateNameToAbbr = usStateOptions.reduce<Record<string, string>>(
  (accumulator, state) => {
    accumulator[state.label.toLowerCase()] = state.value;
    return accumulator;
  },
  {},
);

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

const pendingDates = new Set<string>();

const forcedSelectStyle = {
  color: "#071127",
  WebkitTextFillColor: "#071127",
  backgroundColor: "#ffffff",
};

function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function cleanZip(value?: string | null) {
  return String(value || "").replace(/\D/g, "").slice(0, 5);
}

function normalizeStateForSelect(value?: string | null) {
  const clean = String(value || "").trim();

  if (!clean) return "";

  const uppercase = clean.toUpperCase();

  if (usStateOptions.some((state) => state.value === uppercase)) {
    return uppercase;
  }

  return stateNameToAbbr[clean.toLowerCase()] || "";
}

function normalizeTime(value?: string | null, fallback = "09:00") {
  if (!value) return fallback;
  return value.slice(0, 5);
}

function normalizeServiceKey(value: string): ServiceKey {
  const clean = value.toLowerCase().trim();

  if (clean === "general care") return "drop_in_visit";
  if (clean === "drop-in visit" || clean === "drop-in visits") {
    return "drop_in_visit";
  }

  if (clean === "house sitting") return "house_sitting";

  if (
    clean === "doggy day care" ||
    clean === "dog day care" ||
    clean === "in-home dog day care"
  ) {
    return "doggy_day_care";
  }

  if (clean === "dog walking") return "dog_walking";

  if (serviceOptions.some((option) => option.key === clean)) {
    return clean as ServiceKey;
  }

  return "drop_in_visit";
}

function serviceLabelFromKey(key: ServiceKey) {
  return (
    serviceOptions.find((option) => option.key === key)?.label || "General Care"
  );
}

function serviceShortLabelFromKey(key: ServiceKey) {
  return (
    serviceOptions.find((option) => option.key === key)?.shortLabel ||
    "General Care"
  );
}

function getServicePrice(key: ServiceKey, visitLength: string) {
  const basePrice =
    serviceOptions.find((option) => option.key === key)?.basePrice || 25;

  if (visitLength === "60 minutes") return basePrice + 15;
  if (visitLength === "90 minutes") return basePrice + 30;

  return basePrice;
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

function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateForInput(value: string) {
  if (!value) return "";
  return value;
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

function mergeGuruProfileWithFallbacks({
  guruData,
  profileData,
  initialPhotoUrl,
  initialBio,
  initialCity,
  initialState,
  initialRatingAvg,
  initialReviewCount,
  initialHourlyRate,
  initialYearsExperience,
  initialCompletedBookings,
  initialResponseRate,
}: {
  guruData: GuruProfileRow | null;
  profileData: GuruProfileFallbackRow | null;
  initialPhotoUrl?: string | null;
  initialBio?: string | null;
  initialCity?: string | null;
  initialState?: string | null;
  initialRatingAvg?: number | null;
  initialReviewCount?: number | null;
  initialHourlyRate?: number | null;
  initialYearsExperience?: number | null;
  initialCompletedBookings?: number | null;
  initialResponseRate?: number | null;
}): GuruProfileRow | null {
  if (!guruData && !profileData) {
    return {
      profile_photo_url: initialPhotoUrl || null,
      bio: initialBio || null,
      city: initialCity || null,
      state: initialState || null,
      rating_avg: initialRatingAvg ?? null,
      review_count: initialReviewCount ?? null,
      hourly_rate: initialHourlyRate ?? null,
      years_experience: initialYearsExperience ?? null,
      completed_bookings: initialCompletedBookings ?? null,
      response_rate: initialResponseRate ?? null,
    };
  }

  return {
    ...(guruData || {}),
    display_name: guruData?.display_name || null,
    full_name: guruData?.full_name || profileData?.full_name || null,
    bio: guruData?.bio || profileData?.bio || initialBio || null,
    city: guruData?.city || profileData?.city || initialCity || null,
    state: guruData?.state || profileData?.state || initialState || null,
    profile_photo_url:
      guruData?.profile_photo_url ||
      profileData?.profile_photo_url ||
      initialPhotoUrl ||
      null,
    photo_url: guruData?.photo_url || profileData?.photo_url || null,
    avatar_url: guruData?.avatar_url || profileData?.avatar_url || null,
    image_url:
      guruData?.image_url ||
      profileData?.image_url ||
      initialPhotoUrl ||
      null,
    rating_avg: guruData?.rating_avg ?? initialRatingAvg ?? null,
    review_count: guruData?.review_count ?? initialReviewCount ?? null,
    hourly_rate: guruData?.hourly_rate ?? initialHourlyRate ?? null,
    years_experience:
      guruData?.years_experience ?? initialYearsExperience ?? null,
    completed_bookings:
      guruData?.completed_bookings ?? initialCompletedBookings ?? null,
    response_rate: guruData?.response_rate ?? initialResponseRate ?? null,
  };
}

function buildCalendarCells({
  monthDate,
  days,
  blackouts,
  selectedService,
}: {
  monthDate: Date;
  days: DayAvailability[];
  blackouts: BlackoutDateRow[];
  selectedService: ServiceKey;
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
        (serviceKey === "all_services" || serviceKey === selectedService)
      );
    });

    let status: CalendarStatus = scheduleDay?.enabled ? "available" : "closed";

    if (pendingDates.has(iso)) status = "pending";
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

function CrossoutMark({ small = false }: { small?: boolean }) {
  return (
    <>
      <span
        className={[
          "pointer-events-none absolute rounded-full bg-rose-500/95",
          small
            ? "left-1/2 top-1/2 h-[1.5px] w-5 -translate-x-1/2 -translate-y-1/2 rotate-45"
            : "left-1/2 top-1/2 h-[2px] w-8 -translate-x-1/2 -translate-y-1/2 rotate-45",
        ].join(" ")}
      />
      <span
        className={[
          "pointer-events-none absolute rounded-full bg-rose-500/95",
          small
            ? "left-1/2 top-1/2 h-[1.5px] w-5 -translate-x-1/2 -translate-y-1/2 -rotate-45"
            : "left-1/2 top-1/2 h-[2px] w-8 -translate-x-1/2 -translate-y-1/2 -rotate-45",
        ].join(" ")}
      />
    </>
  );
}

function fieldClass() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";
}

function labelClass() {
  return "mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.08em] text-slate-800";
}

function SelectShell({
  children,
  id,
  label,
  help = true,
}: {
  children: React.ReactNode;
  id: string;
  label: string;
  help?: boolean;
}) {
  return (
    <div>
      <label className={labelClass()} htmlFor={id}>
        {label}
        {help ? <CircleHelp className="h-3.5 w-3.5 text-slate-400" /> : null}
      </label>
      <div className="relative">
        {children}
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      </div>
    </div>
  );
}

function StepBadge({ step }: { step: BookingStep }) {
  return (
    <div className="inline-flex rounded-full bg-emerald-600 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white shadow-lg shadow-emerald-600/20">
      Step {step} of 3
    </div>
  );
}

function BookingStatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
        {icon}
      </div>
      <div>
        <p className="text-lg font-black leading-none text-slate-950">
          {value}
        </p>
        <p className="mt-1 text-xs font-bold leading-tight text-slate-500">
          {label}
        </p>
      </div>
    </div>
  );
}

function MiniCalendarLegend() {
  return (
    <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold text-slate-600">
      <span className="inline-flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        Available
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        Pending / Request
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
        Unavailable
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        Outside Month
      </span>
    </div>
  );
}

export default function BookGuruClient({
  guruId,
  guruSlug,
  guruName,
  calendarUsername,
  calendarEventTypeSlug,
  calUsername,
  calEventTypeSlug,
  initialGuruPhotoUrl = "",
  initialGuruBio = "",
  initialGuruCity = "",
  initialGuruState = "",
  initialGuruRatingAvg = null,
  initialGuruReviewCount = null,
  initialGuruHourlyRate = null,
  initialGuruYearsExperience = null,
  initialGuruCompletedBookings = null,
  initialGuruResponseRate = null,
}: BookGuruClientProps) {
  const router = useRouter();

  const resolvedCalendarUsername = calendarUsername || calUsername || "";
  const resolvedCalendarEventTypeSlug =
    calendarEventTypeSlug || calEventTypeSlug || "";

  const [step, setStep] = useState<BookingStep>(1);

  const [pets, setPets] = useState<PetProfile[]>([]);
  const [petsLoading, setPetsLoading] = useState(true);

  const [guruProfile, setGuruProfile] = useState<GuruProfileRow | null>(() =>
    mergeGuruProfileWithFallbacks({
      guruData: null,
      profileData: null,
      initialPhotoUrl: initialGuruPhotoUrl,
      initialBio: initialGuruBio,
      initialCity: initialGuruCity,
      initialState: initialGuruState,
      initialRatingAvg: initialGuruRatingAvg,
      initialReviewCount: initialGuruReviewCount,
      initialHourlyRate: initialGuruHourlyRate,
      initialYearsExperience: initialGuruYearsExperience,
      initialCompletedBookings: initialGuruCompletedBookings,
      initialResponseRate: initialGuruResponseRate,
    }),
  );

  const [weeklyAvailability, setWeeklyAvailability] =
    useState<DayAvailability[]>(defaultAvailability);
  const [blackoutDates, setBlackoutDates] = useState<BlackoutDateRow[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [selectedPetId, setSelectedPetId] = useState("");
  const [petName, setPetName] = useState("");
  const [bookingType, setBookingType] = useState("Request Booking");
  const [selectedService, setSelectedService] =
    useState<ServiceKey>("drop_in_visit");
  const [bookingDate, setBookingDate] = useState("");
  const [timeWindow, setTimeWindow] = useState("Flexible");
  const [customPreferredTime, setCustomPreferredTime] = useState("");
  const [visitLength, setVisitLength] = useState("60 minutes");
  const [careZipCode, setCareZipCode] = useState("");
  const [careCity, setCareCity] = useState("");
  const [careState, setCareState] = useState("");
  const [notes, setNotes] = useState("");
  const [emergencyNotes, setEmergencyNotes] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const [zipLookupStatus, setZipLookupStatus] = useState<
    "idle" | "loading" | "found" | "not_found"
  >("idle");

  const [detailsAccepted, setDetailsAccepted] = useState(false);
  const [paymentAccepted, setPaymentAccepted] = useState(false);
  const [payoutAccepted, setPayoutAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const selectedPet = useMemo(
    () => pets.find((pet) => pet.id === selectedPetId) ?? null,
    [pets, selectedPetId],
  );

  const servicePrice = useMemo(
    () => getServicePrice(selectedService, visitLength),
    [selectedService, visitLength],
  );

  const platformFee = Number((servicePrice * 0.1).toFixed(2));
  const total = Number((servicePrice + platformFee).toFixed(2));

  const displayPreferredTime =
    timeWindow === "Specific time needed"
      ? customPreferredTime.trim() || "Specific time needed"
      : timeWindow;

  const guruDisplayName =
    guruProfile?.display_name || guruProfile?.full_name || guruName;

  const guruInitials = initialsFromName(guruDisplayName || "SG");

  const guruPhoto =
    initialGuruPhotoUrl ||
    guruProfile?.profile_photo_url ||
    guruProfile?.photo_url ||
    guruProfile?.avatar_url ||
    guruProfile?.image_url ||
    "";

  const guruRating = guruProfile?.rating_avg
    ? guruProfile.rating_avg.toFixed(1)
    : "4.9";

  const reviewCount = guruProfile?.review_count ?? 128;

  const guruRate =
    guruProfile?.hourly_rate || guruProfile?.rate || servicePrice || 25;

  const guruLocation = [guruProfile?.city, guruProfile?.state]
    .filter(Boolean)
    .join(", ");

  const yearsExperience = guruProfile?.years_experience ?? 5;
  const completedBookings = guruProfile?.completed_bookings ?? 312;
  const responseRate = guruProfile?.response_rate ?? 98;

  const calendarCells = useMemo(
    () =>
      buildCalendarCells({
        monthDate: calendarMonth,
        days: weeklyAvailability,
        blackouts: blackoutDates,
        selectedService,
      }),
    [calendarMonth, weeklyAvailability, blackoutDates, selectedService],
  );

  const selectedDateCell = useMemo(
    () => calendarCells.find((cell) => cell.iso === bookingDate),
    [calendarCells, bookingDate],
  );

  const isSelectedDateUnavailable =
    selectedDateCell?.status === "blackout" ||
    selectedDateCell?.status === "closed" ||
    selectedDateCell?.status === "pending";

  const canContinueStep1 =
    petName.trim().length > 0 &&
    bookingDate.length > 0 &&
    !isSelectedDateUnavailable;

  const allAcknowledgementsAccepted =
    detailsAccepted && paymentAccepted && payoutAccepted && termsAccepted;

  useEffect(() => {
    async function loadPetsAndCustomer() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setPetsLoading(false);
        return;
      }

      setCustomerEmail(user.email ?? "");

      const [{ data: petData }, { data: profileData }] = await Promise.all([
        supabase
          .from("pets")
          .select(
            "id, name, species, breed, age, weight, temperament, medications, notes, photo_url, video_url",
          )
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("full_name,avatar_url,profile_photo_url,photo_url")
          .eq("id", user.id)
          .maybeSingle<CustomerProfile>(),
      ]);

      setPets(petData || []);
      setPetsLoading(false);

      if (profileData?.full_name) setCustomerName(profileData.full_name);
    }

    loadPetsAndCustomer();
  }, []);

  useEffect(() => {
    async function loadGuruAvailability() {
      setAvailabilityLoading(true);

      try {
        const { data: guruData } = await supabase
          .from("gurus")
          .select(
            "id,user_id,display_name,full_name,slug,bio,city,state,zip_code,profile_photo_url,photo_url,avatar_url,image_url,rating_avg,review_count,hourly_rate,rate,years_experience,completed_bookings,response_rate",
          )
          .eq("id", guruId)
          .maybeSingle<GuruProfileRow>();

        let profileData: GuruProfileFallbackRow | null = null;

        if (guruData?.user_id) {
          const { data: fallbackProfile } = await supabase
            .from("profiles")
            .select(
              "id,full_name,bio,city,state,avatar_url,profile_photo_url,photo_url,image_url",
            )
            .eq("id", guruData.user_id)
            .maybeSingle<GuruProfileFallbackRow>();

          profileData = fallbackProfile || null;
        }

        const mergedGuruProfile = mergeGuruProfileWithFallbacks({
          guruData: guruData || null,
          profileData,
          initialPhotoUrl: initialGuruPhotoUrl,
          initialBio: initialGuruBio,
          initialCity: initialGuruCity,
          initialState: initialGuruState,
          initialRatingAvg: initialGuruRatingAvg,
          initialReviewCount: initialGuruReviewCount,
          initialHourlyRate: initialGuruHourlyRate,
          initialYearsExperience: initialGuruYearsExperience,
          initialCompletedBookings: initialGuruCompletedBookings,
          initialResponseRate: initialGuruResponseRate,
        });

        setGuruProfile(mergedGuruProfile);

        const guruUserId = guruData?.user_id;

        if (!guruUserId) {
          setAvailabilityLoading(false);
          return;
        }

        const [{ data: weeklyData }, { data: blackoutData }] =
          await Promise.all([
            supabase
              .from("guru_weekly_availability")
              .select("*")
              .eq("user_id", guruUserId),
            supabase
              .from("guru_blackout_dates")
              .select("*")
              .eq("user_id", guruUserId)
              .order("blackout_date", { ascending: true }),
          ]);

        if (weeklyData && weeklyData.length > 0) {
          setWeeklyAvailability(
            mergeWeeklyRows(weeklyData as WeeklyAvailabilityRow[]),
          );
        }

        setBlackoutDates((blackoutData || []) as BlackoutDateRow[]);
      } catch (error) {
        console.error("Could not load Guru availability:", error);
      } finally {
        setAvailabilityLoading(false);
      }
    }

    loadGuruAvailability();
  }, [
    guruId,
    initialGuruPhotoUrl,
    initialGuruBio,
    initialGuruCity,
    initialGuruState,
    initialGuruRatingAvg,
    initialGuruReviewCount,
    initialGuruHourlyRate,
    initialGuruYearsExperience,
    initialGuruCompletedBookings,
    initialGuruResponseRate,
  ]);

  useEffect(() => {
    const cleanedZip = cleanZip(careZipCode);

    if (!cleanedZip) {
      setZipLookupStatus("idle");
      setCareCity("");
      setCareState("");
      return;
    }

    if (cleanedZip.length !== 5) {
      setZipLookupStatus("idle");
      setCareCity("");
      setCareState("");
      return;
    }

    let cancelled = false;

    async function lookupZip() {
      try {
        setZipLookupStatus("loading");

        const response = await fetch(`/api/geo/zip?zip=${cleanedZip}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          if (!cancelled) {
            setZipLookupStatus("not_found");
            setCareCity("");
            setCareState("");
          }

          return;
        }

        const data = (await response.json()) as ZipLookupResult;

        if (cancelled) return;

        const normalizedState = normalizeStateForSelect(
          data.state || data.stateName || "",
        );

        setZipLookupStatus("found");
        setCareCity(data.city || "");
        setCareState(normalizedState);
      } catch (error) {
        console.error("Booking ZIP lookup failed:", error);

        if (!cancelled) {
          setZipLookupStatus("not_found");
          setCareCity("");
          setCareState("");
        }
      }
    }

    const timer = window.setTimeout(() => {
      lookupZip();
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [careZipCode]);

  useEffect(() => {
    if (!selectedPet) return;

    setPetName(selectedPet.name || "");

    const autoNotes = [
      selectedPet.species ? `Species: ${selectedPet.species}` : "",
      selectedPet.breed ? `Breed: ${selectedPet.breed}` : "",
      selectedPet.age ? `Age: ${selectedPet.age}` : "",
      selectedPet.weight ? `Weight: ${selectedPet.weight}` : "",
      selectedPet.temperament ? `Temperament: ${selectedPet.temperament}` : "",
      selectedPet.medications ? `Medications: ${selectedPet.medications}` : "",
      selectedPet.notes ? `Pet notes: ${selectedPet.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    setNotes((current) => {
      if (current.trim().length > 0) return current;
      return autoNotes;
    });
  }, [selectedPet]);

  useEffect(() => {
    if (!bookingDate) return;

    const currentCell = calendarCells.find((cell) => cell.iso === bookingDate);

    if (
      currentCell?.status === "blackout" ||
      currentCell?.status === "closed" ||
      currentCell?.status === "pending"
    ) {
      setBookingDate("");
    }
  }, [selectedService, calendarCells, bookingDate]);

  function moveCalendar(direction: "prev" | "next") {
    setCalendarMonth((current) => {
      const next = new Date(current);
      next.setMonth(current.getMonth() + (direction === "next" ? 1 : -1));
      return next;
    });
  }

  function handleZipChange(value: string) {
    const cleanedZip = cleanZip(value);

    setCareZipCode(cleanedZip);

    if (!cleanedZip) {
      setZipLookupStatus("idle");
      setCareCity("");
      setCareState("");
    }
  }

  function handleDateSelect(cell: CalendarCell) {
    setSubmitError("");

    if (!cell.inMonth) return;

    if (
      cell.status === "blackout" ||
      cell.status === "closed" ||
      cell.status === "pending"
    ) {
      setSubmitError(
        `${formatDisplayDate(cell.iso)} is unavailable for ${serviceLabelFromKey(
          selectedService,
        )}. Please choose another date.`,
      );
      return;
    }

    setBookingDate(cell.iso);
  }

  function extractApiError(data: unknown, fallback: string) {
    if (!data || typeof data !== "object") return fallback;

    const responseData = data as {
      error?: unknown;
      message?: unknown;
      details?: unknown;
    };

    if (typeof responseData.error === "string" && responseData.error.trim()) {
      return responseData.error.trim();
    }

    if (typeof responseData.message === "string" && responseData.message.trim()) {
      return responseData.message.trim();
    }

    if (typeof responseData.details === "string" && responseData.details.trim()) {
      return responseData.details.trim();
    }

    return fallback;
  }

  async function readBookingResponse(response: Response) {
    const responseText = await response.text();
    const contentType = response.headers.get("content-type") || "";

    if (!responseText) return null;

    if (!contentType.includes("application/json")) {
      console.error("Booking API returned non-JSON response:", {
        status: response.status,
        contentType,
        responseText: responseText.slice(0, 1200),
      });

      throw new Error(
        "The booking service returned a webpage instead of booking data. Confirm app/api/stripe/bookings/route.ts exists, has no TypeScript errors, and restart npm run dev.",
      );
    }

    return JSON.parse(responseText) as {
      success?: boolean;
      error?: string;
      message?: string;
      details?: unknown;
      booking?: {
        id?: string | number;
        uid?: string;
      };
      checkoutUrl?: string;
      url?: string;
      stripeSessionId?: string;
    };
  }

  function handleNext() {
    setSubmitError("");

    if (step === 1) {
      if (!canContinueStep1) {
        setSubmitError(
          "Please choose a pet and an available date before reviewing the booking.",
        );
        return;
      }

      setStep(2);
      return;
    }

    if (step === 2) setStep(3);
  }

  function handleBack() {
    setSubmitError("");

    if (step === 3) setStep(2);
    if (step === 2) setStep(1);
  }

  async function handleConfirm() {
    try {
      setSubmitError("");

      if (!resolvedCalendarUsername || !resolvedCalendarEventTypeSlug) {
        setSubmitError(
          "This Guru is not fully connected to scheduling yet. Please try another Guru or contact support.",
        );
        return;
      }

      if (!petName.trim() || !bookingDate) {
        setSubmitError("Please complete the booking details before confirming.");
        return;
      }

      if (isSelectedDateUnavailable) {
        setSubmitError(
          "The selected date is no longer available. Please choose another date.",
        );
        return;
      }

      if (!allAcknowledgementsAccepted) {
        setSubmitError(
          "Please check all acknowledgements before continuing to secure checkout.",
        );
        return;
      }

      const finalName = customerName?.trim() || "SitGuru Customer";
      const finalEmail = customerEmail?.trim() || "customer@sitguru.com";
      const serviceLabel = serviceLabelFromKey(selectedService);

      setSubmitting(true);

      const bookingPayload = {
        guruId,
        guru_id: guruId,
        slug: guruSlug,
        guruSlug,
        calendarUsername: resolvedCalendarUsername,
        calendarEventTypeSlug: resolvedCalendarEventTypeSlug,
        bookingType,
        booking_type: bookingType,
        start: new Date().toISOString(),
        customerName: finalName,
        customer_name: finalName,
        customerEmail: finalEmail,
        customer_email: finalEmail,
        petId: selectedPetId || null,
        pet_id: selectedPetId || null,
        petName: petName.trim(),
        pet_name: petName.trim(),
        serviceType: serviceLabel,
        service_type: serviceLabel,
        service_key: selectedService,
        requestedDate: bookingDate,
        requested_date: bookingDate,
        booking_date: bookingDate,
        date: bookingDate,
        timeWindow: displayPreferredTime,
        time_window: displayPreferredTime,
        visitLength,
        visit_length: visitLength,
        careZipCode,
        care_zip_code: careZipCode,
        careCity,
        care_city: careCity,
        careState,
        care_state: careState,
        servicePrice,
        service_price: servicePrice,
        platformFee,
        platform_fee: platformFee,
        total,
        total_amount: total,
        amount_total: total,
        complianceAccepted: true,
        compliance_accepted: true,
        termsAccepted: true,
        terms_accepted: true,
        notes: [
          `Service: ${serviceLabel}`,
          `Requested date: ${bookingDate}`,
          `Time window: ${displayPreferredTime}`,
          `Visit length: ${visitLength}`,
          careZipCode || careCity || careState
            ? `Care location: ${[careCity, careState, careZipCode]
                .filter(Boolean)
                .join(" ")}`
            : "",
          "",
          notes.trim(),
          emergencyNotes.trim()
            ? `Emergency / special instructions: ${emergencyNotes.trim()}`
            : "",
        ]
          .filter(Boolean)
          .join("\n"),
      };

      const response = await fetch("/api/stripe/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingPayload),
      });

      const data = await readBookingResponse(response);

      if (!response.ok) {
        console.error("Booking API failed:", {
          status: response.status,
          data,
          bookingPayload,
        });

        throw new Error(
          extractApiError(
            data,
            "Unable to create the booking request. Check the VS Code terminal for the API error.",
          ),
        );
      }

      const checkoutUrl = data?.checkoutUrl || data?.url;

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }

      const params = new URLSearchParams({
        booking: "confirmed",
        guru: guruSlug,
      });

      if (selectedPetId) params.set("pet_id", selectedPetId);
      if (data?.booking?.uid) params.set("booking_uid", data.booking.uid);
      if (data?.booking?.id) params.set("booking_id", String(data.booking.id));

      router.push(`/customer/dashboard?${params.toString()}`);
    } catch (error) {
      console.error("Booking submit failed:", error);

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Something went wrong while creating the booking.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_42%,#ecfdf5_100%)] text-slate-950">
      <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(110deg,#d7fae8_0%,#d8f7ef_48%,#9de0ff_100%)] px-7 py-10 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:px-12 lg:px-14">
          <div className="relative z-10 max-w-3xl">
            <StepBadge step={step} />

            <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[0.96] tracking-[-0.05em] text-slate-950 md:text-6xl">
              Request trusted
              <br />
              pet care with confidence.
            </h1>

            <p className="mt-4 max-w-2xl text-lg font-semibold leading-8 text-slate-700">
              Tell us about your pet and care needs. Your Guru will review and
              confirm before checkout.
            </p>
          </div>

          <div className="absolute bottom-0 right-0 hidden h-full w-[48%] lg:block">
            <img
              src="/images/booking-hero-pets.png"
              alt="Happy dog and cat"
              className="absolute bottom-0 right-10 z-20 h-[94%] w-auto object-contain drop-shadow-2xl"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />

            <div className="absolute bottom-0 right-28 z-10 text-[230px] leading-none drop-shadow-xl">
              🐕
            </div>

            <div className="absolute bottom-4 right-2 z-10 text-[158px] leading-none drop-shadow-xl">
              🐈
            </div>

            <div className="absolute right-[22rem] top-20 text-5xl text-white/90">
              ✧
            </div>

            <div className="absolute right-12 top-32 text-4xl text-white/90">
              ✧
            </div>

            <div className="absolute right-72 top-28 z-30 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-xl">
              <PawPrint className="h-7 w-7 text-emerald-600" />
            </div>
          </div>
        </section>

        <div className="mt-7 grid gap-7 xl:grid-cols-[1.18fr_0.82fr]">
          <section className="space-y-7">
            {step === 1 ? (
              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.07)] md:p-7">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">
                    Booking Details
                  </h2>
                  <p className="mt-2 text-sm font-semibold text-slate-600">
                    Availability changes based on the service you select.
                  </p>
                </div>

                <div className="mt-7 grid gap-5 md:grid-cols-3">
                  <SelectShell id="booking-type" label="Booking Type">
                    <select
                      id="booking-type"
                      value={bookingType}
                      onChange={(event) => setBookingType(event.target.value)}
                      className={`${fieldClass()} appearance-none pr-10`}
                      style={forcedSelectStyle}
                    >
                      {bookingTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </SelectShell>

                  <SelectShell id="service" label="Service">
                    <select
                      id="service"
                      value={selectedService}
                      onChange={(event) => {
                        setSelectedService(
                          normalizeServiceKey(event.target.value),
                        );
                        setSubmitError("");
                      }}
                      className={`${fieldClass()} appearance-none pr-10`}
                      style={forcedSelectStyle}
                    >
                      {serviceOptions.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </SelectShell>

                  <SelectShell id="pet-profile" label="Pet">
                    <select
                      id="pet-profile"
                      value={selectedPetId}
                      onChange={(event) => {
                        setSelectedPetId(event.target.value);
                        if (!event.target.value) setPetName("");
                      }}
                      className={`${fieldClass()} appearance-none pr-10`}
                      style={forcedSelectStyle}
                    >
                      <option value="">
                        {petsLoading ? "Loading pets..." : "Choose pet"}
                      </option>
                      {pets.map((pet) => (
                        <option key={pet.id} value={pet.id}>
                          {pet.name}
                          {pet.breed ? ` (${pet.breed})` : ""}
                        </option>
                      ))}
                    </select>
                  </SelectShell>

                  <div>
                    <label className={labelClass()} htmlFor="requested-date">
                      Requested Date
                    </label>
                    <input
                      id="requested-date"
                      type="date"
                      value={formatDateForInput(bookingDate)}
                      onChange={(event) => setBookingDate(event.target.value)}
                      className={fieldClass()}
                    />
                  </div>

                  <SelectShell
                    id="time-window"
                    label="Preferred Time"
                    help={false}
                  >
                    <select
                      id="time-window"
                      value={timeWindow}
                      onChange={(event) => setTimeWindow(event.target.value)}
                      className={`${fieldClass()} appearance-none pr-10`}
                      style={forcedSelectStyle}
                    >
                      {timeWindowOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </SelectShell>

                  <SelectShell
                    id="visit-length"
                    label="Duration"
                    help={false}
                  >
                    <select
                      id="visit-length"
                      value={visitLength}
                      onChange={(event) => setVisitLength(event.target.value)}
                      className={`${fieldClass()} appearance-none pr-10`}
                      style={forcedSelectStyle}
                    >
                      {visitLengthOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </SelectShell>

                  <div>
                    <label className={labelClass()} htmlFor="zip">
                      Care ZIP Code
                    </label>
                    <input
                      id="zip"
                      value={careZipCode}
                      onChange={(event) => handleZipChange(event.target.value)}
                      className={fieldClass()}
                      inputMode="numeric"
                      maxLength={5}
                      placeholder="18951"
                    />
                  </div>

                  <div>
                    <label className={labelClass()} htmlFor="city">
                      City
                    </label>
                    <input
                      id="city"
                      value={careCity}
                      onChange={(event) => setCareCity(event.target.value)}
                      className={fieldClass()}
                      placeholder="Quakertown"
                    />
                  </div>

                  <SelectShell id="state" label="State" help={false}>
                    <select
                      id="state"
                      value={careState}
                      onChange={(event) => setCareState(event.target.value)}
                      className={`${fieldClass()} appearance-none pr-10`}
                      style={forcedSelectStyle}
                    >
                      <option value="">Select State</option>
                      {usStateOptions.map((state) => (
                        <option key={state.value} value={state.value}>
                          {state.label}
                        </option>
                      ))}
                    </select>
                  </SelectShell>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                  {zipLookupStatus === "loading" ? (
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sky-700">
                      Looking up ZIP...
                    </span>
                  ) : null}

                  {zipLookupStatus === "found" ? (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
                      ZIP matched: {careCity}, {careState}
                    </span>
                  ) : null}

                  {zipLookupStatus === "not_found" ? (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
                      ZIP not found. Enter city/state manually.
                    </span>
                  ) : null}
                </div>

                {!selectedPetId ? (
                  <div className="mt-5">
                    <label className={labelClass()} htmlFor="pet-name">
                      Pet name
                    </label>
                    <input
                      id="pet-name"
                      value={petName}
                      onChange={(event) => setPetName(event.target.value)}
                      className={fieldClass()}
                      placeholder="Example: Bella"
                    />
                  </div>
                ) : null}

                {timeWindow === "Specific time needed" ? (
                  <div className="mt-5">
                    <label className={labelClass()} htmlFor="custom-time">
                      Specific time
                    </label>
                    <input
                      id="custom-time"
                      value={customPreferredTime}
                      onChange={(event) =>
                        setCustomPreferredTime(event.target.value)
                      }
                      className={fieldClass()}
                      placeholder="Example: 3:30 PM"
                    />
                  </div>
                ) : null}

                <div className="mt-7">
                  <div>
                    <p className="text-lg font-black text-slate-950">
                      Check Availability
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-600">
                      Green dates are available. Red dates are unavailable.
                      Yellow dates are pending/request.
                    </p>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white">
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

                    {availabilityLoading ? (
                      <div className="p-10 text-center">
                        <Loader2 className="mx-auto h-7 w-7 animate-spin text-emerald-600" />
                        <p className="mt-3 text-sm font-black text-slate-700">
                          Loading availability...
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 md:p-4">
                        <div className="grid grid-cols-7 gap-2 text-center text-xs font-black uppercase tracking-[0.08em] text-slate-500">
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
                            const selected = bookingDate === cell.iso;
                            const unavailable =
                              cell.status === "blackout" ||
                              cell.status === "closed" ||
                              cell.status === "pending";

                            return (
                              <button
                                key={cell.iso}
                                type="button"
                                onClick={() => handleDateSelect(cell)}
                                disabled={!cell.inMonth || unavailable}
                                className={[
                                  "relative flex min-h-[52px] items-center justify-center overflow-hidden rounded-xl border text-sm font-black transition md:min-h-[58px]",
                                  !cell.inMonth
                                    ? "border-slate-100 bg-slate-50 text-slate-300"
                                    : cell.status === "blackout"
                                      ? "border-rose-100 bg-rose-50 text-rose-600"
                                      : cell.status === "pending"
                                        ? "border-amber-100 bg-amber-50 text-amber-700"
                                        : cell.status === "available"
                                          ? "border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                          : "border-slate-100 bg-slate-50 text-slate-400",
                                  selected
                                    ? "bg-emerald-600 text-white ring-4 ring-emerald-500/20 hover:bg-emerald-600"
                                    : "",
                                ].join(" ")}
                              >
                                {cell.inMonth && cell.status === "blackout" ? (
                                  <CrossoutMark small />
                                ) : null}

                                {cell.inMonth && cell.status === "closed" ? (
                                  <X className="absolute h-4 w-4 opacity-40" />
                                ) : null}

                                <span>{cell.dayNumber}</span>

                                {cell.inMonth && cell.status === "pending" ? (
                                  <Clock3 className="absolute bottom-2 right-2 h-3.5 w-3.5" />
                                ) : null}
                              </button>
                            );
                          })}
                        </div>

                        <MiniCalendarLegend />
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 grid gap-5">
                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <label className={labelClass()} htmlFor="care-notes">
                        Care Notes
                      </label>
                      <span className="text-xs font-bold text-slate-500">
                        {notes.length}/500
                      </span>
                    </div>
                    <textarea
                      id="care-notes"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      rows={4}
                      maxLength={500}
                      className={fieldClass()}
                      placeholder="Anything your Guru should know before the booking."
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <label className={labelClass()} htmlFor="emergency-notes">
                        Emergency / Special Instructions
                      </label>
                      <span className="text-xs font-bold text-slate-500">
                        {emergencyNotes.length}/500
                      </span>
                    </div>
                    <textarea
                      id="emergency-notes"
                      value={emergencyNotes}
                      onChange={(event) => setEmergencyNotes(event.target.value)}
                      rows={4}
                      maxLength={500}
                      className={fieldClass()}
                      placeholder="Medication, allergies, emergency contact, behavior notes, access instructions, etc."
                    />
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-emerald-600 p-2 text-white">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-emerald-900">
                        Payment protection included
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        Pay securely at checkout. Payouts are released 48 hours
                        after care is completed.
                      </p>
                    </div>
                  </div>
                </div>

                {submitError ? (
                  <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                    <p className="flex items-start gap-2 text-sm font-bold text-rose-800">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      {submitError}
                    </p>
                  </div>
                ) : null}
              </section>
            ) : null}

            {step === 2 ? (
              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.07)] md:p-7">
                <StepBadge step={2} />
                <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                  Review your booking
                </h2>
                <p className="mt-2 text-base font-semibold leading-7 text-slate-700">
                  Confirm everything looks right before continuing to checkout.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {[
                    ["Guru", guruDisplayName],
                    ["Service", serviceLabelFromKey(selectedService)],
                    ["Booking type", bookingType],
                    ["Pet", petName || "Not selected"],
                    ["Date", formatDisplayDate(bookingDate)],
                    ["Preferred time", displayPreferredTime],
                    ["Duration", visitLength],
                    [
                      "Care location",
                      [careCity, careState, careZipCode]
                        .filter(Boolean)
                        .join(", ") || "Not provided",
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-600">
                        {label}
                      </p>
                      <p className="mt-1 text-base font-black text-slate-950">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-600">
                    Care notes
                  </p>
                  <p className="mt-3 whitespace-pre-line text-base font-semibold leading-8 text-slate-800">
                    {notes || "No additional notes provided."}
                  </p>
                </div>

                {emergencyNotes ? (
                  <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-amber-800">
                      Emergency / special instructions
                    </p>
                    <p className="mt-3 whitespace-pre-line text-base font-semibold leading-8 text-amber-900">
                      {emergencyNotes}
                    </p>
                  </div>
                ) : null}

                <div className="mt-7 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex min-h-[54px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-4 text-base font-black text-slate-900 transition hover:bg-slate-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex min-h-[54px] items-center justify-center rounded-2xl bg-emerald-600 px-6 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                  >
                    Continue to Secure Checkout
                  </button>
                </div>
              </section>
            ) : null}

            {step === 3 ? (
              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.07)] md:p-7">
                <StepBadge step={3} />
                <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                  Secure checkout
                </h2>
                <p className="mt-2 text-base font-semibold leading-7 text-slate-700">
                  Review and accept the booking acknowledgements before
                  continuing.
                </p>

                <div className="mt-6 rounded-[1.6rem] border border-emerald-200 bg-emerald-50 p-5">
                  <p className="flex items-center gap-2 text-lg font-black text-emerald-900">
                    <CreditCard className="h-5 w-5" />
                    Protected payment flow
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-7 text-slate-700">
                    SitGuru securely processes payment at checkout. Booking
                    records and payment status are saved for customer protection,
                    Guru payouts, and admin review.
                  </p>
                </div>

                <div className="mt-6 space-y-4">
                  {[
                    {
                      checked: detailsAccepted,
                      setChecked: setDetailsAccepted,
                      text: "I confirm the pet care details, requested date, duration, notes, and pricing are accurate.",
                    },
                    {
                      checked: paymentAccepted,
                      setChecked: setPaymentAccepted,
                      text: "I understand SitGuru securely processes payment at checkout and that refunds or disputes follow SitGuru platform policies.",
                    },
                    {
                      checked: payoutAccepted,
                      setChecked: setPayoutAccepted,
                      text: "I understand Guru payouts are released after completed care unless a support case, refund request, chargeback, or safety review is open.",
                    },
                    {
                      checked: termsAccepted,
                      setChecked: setTermsAccepted,
                      text: "I agree to SitGuru's Terms, Privacy Policy, cancellation/refund policies, and booking agreement acknowledgements.",
                    },
                  ].map((item) => (
                    <label
                      key={item.text}
                      className="flex cursor-pointer gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-emerald-50"
                    >
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={(event) => item.setChecked(event.target.checked)}
                        className="mt-1 h-5 w-5 rounded border-slate-300 accent-emerald-600"
                      />
                      <span className="text-sm font-semibold leading-7 text-slate-800">
                        {item.text}
                      </span>
                    </label>
                  ))}
                </div>

                {submitError ? (
                  <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                    <p className="flex items-start gap-2 text-sm font-bold text-rose-800">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      {submitError}
                    </p>
                  </div>
                ) : null}

                <div className="mt-7 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={submitting}
                    className="inline-flex min-h-[54px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-4 text-base font-black text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={submitting || !allAcknowledgementsAccepted}
                    className={[
                      "inline-flex min-h-[54px] items-center justify-center rounded-2xl px-6 py-4 text-base font-black transition disabled:cursor-not-allowed",
                      submitting || !allAcknowledgementsAccepted
                        ? "bg-slate-200 text-slate-500"
                        : "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700",
                    ].join(" ")}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating secure checkout...
                      </>
                    ) : (
                      "Continue to Secure Checkout"
                    )}
                  </button>
                </div>
              </section>
            ) : null}

            <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-600">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <span>SitGuru is here to help every step of the way.</span>
              <Link href="/help" className="font-black text-emerald-700">
                Contact our support team.
              </Link>
            </div>
          </section>

          <aside className="space-y-5 xl:sticky xl:top-28 xl:self-start">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.07)]">
              <p className="text-2xl font-black text-slate-950">
                Selected Guru
              </p>

              <div className="mt-5 flex gap-5">
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full bg-emerald-50 ring-4 ring-emerald-100">
                  {guruPhoto ? (
                    <img
                      src={guruPhoto}
                      alt={`${guruDisplayName} profile`}
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-black text-emerald-700">
                      {guruInitials || <UserCircle2 className="h-12 w-12" />}
                    </div>
                  )}

                  <div className="absolute bottom-0 right-0 rounded-full bg-emerald-600 p-2 text-white ring-4 ring-white">
                    <PawPrint className="h-5 w-5" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-xl font-black text-slate-950">
                    {guruDisplayName}
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </p>

                  <p className="mt-1 flex items-center gap-1 text-sm font-black text-slate-800">
                    {guruRating}
                    <span className="flex text-amber-400">
                      <Star className="h-4 w-4 fill-amber-400" />
                      <Star className="h-4 w-4 fill-amber-400" />
                      <Star className="h-4 w-4 fill-amber-400" />
                      <Star className="h-4 w-4 fill-amber-400" />
                      <Star className="h-4 w-4 fill-amber-400" />
                    </span>
                    <span className="text-slate-500">({reviewCount})</span>
                  </p>

                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">
                    <Zap className="h-4 w-4" />
                    Highly Responsive
                  </div>

                  {guruLocation ? (
                    <p className="mt-3 flex items-center gap-1 text-sm font-semibold text-slate-600">
                      <MapPin className="h-4 w-4 text-emerald-700" />
                      {guruLocation}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3 rounded-2xl border border-slate-200 p-3">
                <BookingStatCard
                  icon={<Home className="h-5 w-5" />}
                  value={String(yearsExperience)}
                  label="Years Exp."
                />
                <BookingStatCard
                  icon={<CalendarDays className="h-5 w-5" />}
                  value={String(completedBookings)}
                  label="Bookings"
                />
                <BookingStatCard
                  icon={<Clock3 className="h-5 w-5" />}
                  value={`${responseRate}%`}
                  label="Response Rate"
                />
              </div>

              <div className="mt-5">
                <p className="text-sm font-black text-slate-950">
                  About {guruDisplayName.split(" ")[0] || "this Guru"}
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  {guruProfile?.bio ||
                    "Pawsitive, reliable, and passionate about pets. I treat every pet like family and provide trusted care you can count on."}
                </p>
                <Link
                  href={`/guru/${guruSlug}`}
                  className="mt-3 inline-flex text-sm font-black text-emerald-700"
                >
                  View full profile →
                </Link>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5">
                <div>
                  <p className="text-xs font-bold text-slate-500">
                    Starting at
                  </p>
                  <p className="text-3xl font-black text-slate-950">
                    {formatMoneyNoCents(Number(guruRate))}
                    <span className="text-sm font-bold text-slate-500">
                      {" "}
                      / visit
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3">
                  <ShieldCheck className="h-8 w-8 text-emerald-600" />
                  <div>
                    <p className="text-sm font-black text-emerald-800">
                      SitGuru
                    </p>
                    <p className="text-xs font-bold text-slate-600">
                      Background Checked
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.07)]">
              <p className="text-2xl font-black text-slate-950">
                Booking Summary
              </p>

              <div className="mt-5 space-y-3 text-sm">
                {[
                  ["Service", serviceShortLabelFromKey(selectedService)],
                  ["Pet", petName || "Not selected"],
                  ["Date", formatDisplayDate(bookingDate)],
                  ["Time", displayPreferredTime],
                  ["Duration", visitLength],
                  [
                    "Care Location",
                    [careZipCode, careCity, careState]
                      .filter(Boolean)
                      .join(", ") || "Not provided",
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <span className="font-semibold text-slate-600">
                      {label}
                    </span>
                    <span className="text-right font-black text-slate-950">
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 border-t border-slate-100 pt-5">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="font-semibold text-slate-600">
                    Estimated Subtotal
                  </span>
                  <span className="font-black text-slate-950">
                    {formatMoney(servicePrice)}
                  </span>
                </div>

                <div className="mt-3 flex justify-between gap-4 text-sm">
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-600">
                    SitGuru Service Fee
                    <CircleHelp className="h-3.5 w-3.5" />
                  </span>
                  <span className="font-black text-slate-950">
                    {formatMoney(platformFee)}
                  </span>
                </div>

                <div className="mt-5 flex justify-between gap-4 border-t border-slate-100 pt-5">
                  <span className="text-sm font-black text-slate-950">
                    Estimated Total
                  </span>
                  <span className="text-xl font-black text-emerald-600">
                    {formatMoney(total)}
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="flex items-start gap-2 text-xs font-bold leading-5 text-slate-700">
                  <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                  Final price may vary based on actual time and services
                  provided.
                </p>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.07)]">
              <p className="text-2xl font-black text-slate-950">
                How booking works
              </p>

              <div className="mt-5 space-y-3">
                {[
                  "You submit a booking request.",
                  "Your Guru reviews and confirms.",
                  "You'll review and pay securely.",
                  "Care is provided and you're covered.",
                  "48-hour review window after care.",
                ].map((item, index) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white">
                      {index + 1}
                    </span>
                    <p className="text-sm font-semibold leading-6 text-slate-700">
                      {item}
                    </p>
                  </div>
                ))}
              </div>

              <Link
                href="/help"
                className="mt-5 inline-flex text-sm font-black text-emerald-700"
              >
                Learn more →
              </Link>
            </section>

            <button
              type="button"
              onClick={step === 3 ? handleConfirm : handleNext}
              disabled={
                submitting ||
                (step === 1 && !canContinueStep1) ||
                (step === 3 && !allAcknowledgementsAccepted)
              }
              className={[
                "inline-flex min-h-[64px] w-full items-center justify-center gap-3 rounded-2xl px-6 py-5 text-lg font-black transition disabled:cursor-not-allowed",
                submitting ||
                (step === 1 && !canContinueStep1) ||
                (step === 3 && !allAcknowledgementsAccepted)
                  ? "bg-slate-200 text-slate-500"
                  : "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700",
              ].join(" ")}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : step === 1 ? (
                <>
                  Review Booking Before Checkout
                  <LockKeyhole className="h-5 w-5" />
                </>
              ) : step === 2 ? (
                <>
                  Continue to Checkout
                  <LockKeyhole className="h-5 w-5" />
                </>
              ) : (
                <>
                  Secure Checkout
                  <LockKeyhole className="h-5 w-5" />
                </>
              )}
            </button>

            <div className="flex items-start gap-2 px-2 text-sm font-semibold text-slate-600">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <span>You won’t be charged yet. Review first.</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}