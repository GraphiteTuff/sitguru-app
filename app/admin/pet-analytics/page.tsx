import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Cat,
  CheckCircle2,
  Clock3,
  Dog,
  HeartPulse,
  MapPin,
  PawPrint,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type GenericRow = Record<string, unknown>;

type GuruRow = {
  id?: string;
  user_id?: string | null;
  display_name?: string | null;
  city?: string | null;
  state?: string | null;
  is_verified?: boolean | null;
  created_at?: string | null;
};

type TopItem = {
  label: string;
  count: number;
  percent: number;
};

type AnalyticsData = {
  bookings: GenericRow[];
  pets: GenericRow[];
  gurus: GuruRow[];
  bookingsError: string | null;
  petsError: string | null;
  gurusError: string | null;
};

function normalizeValue(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      if (word.length <= 2 && word === word.toUpperCase()) return word;
      return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;
    })
    .join(" ");
}

function getString(row: GenericRow, keys: string[]) {
  for (const key of keys) {
    const value = normalizeValue(row[key]);

    if (value) {
      return value;
    }
  }

  return "";
}

function getNumber(row: GenericRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return 0;
}

function getTopItems(values: string[], limit = 5): TopItem[] {
  const cleanValues = values
    .map((value) => titleCase(value.trim()))
    .filter(Boolean);

  const total = cleanValues.length;

  if (!total) return [];

  const counts = cleanValues.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([label, count]) => ({
      label,
      count,
      percent: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

function isRecurring(value: unknown) {
  const normalized = normalizeValue(value).toLowerCase();

  return (
    normalized.includes("recurring") ||
    normalized.includes("weekly") ||
    normalized.includes("monthly") ||
    normalized.includes("repeat") ||
    normalized.includes("ongoing")
  );
}

function uniqueCount(values: string[]) {
  return new Set(values.map((value) => normalizeValue(value)).filter(Boolean))
    .size;
}

function getPercent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function getPetTypeFromPet(row: GenericRow) {
  return getString(row, [
    "pet_type",
    "type",
    "species",
    "animal_type",
    "animal",
    "petType",
  ]);
}

function getBreedFromPet(row: GenericRow) {
  return getString(row, ["breed", "pet_breed", "primary_breed", "breed_name"]);
}

function getSexFromPet(row: GenericRow) {
  return getString(row, ["sex", "gender", "pet_sex", "pet_gender"]);
}

function getAgeFromPet(row: GenericRow) {
  const ageValue = getNumber(row, ["age", "pet_age", "age_years"]);

  if (ageValue) {
    if (ageValue < 1) return "Under 1 year";
    if (ageValue <= 2) return "1–2 years";
    if (ageValue <= 7) return "3–7 years";
    return "8+ years";
  }

  return getString(row, ["age_range", "life_stage"]);
}

function hasSpecialCare(row: GenericRow) {
  const specialCareText = getString(row, [
    "special_needs",
    "special_care",
    "care_notes",
    "medical_notes",
    "medications",
    "allergies",
    "behavior_notes",
    "notes",
  ]).toLowerCase();

  if (specialCareText.length > 8) return true;

  const specialCareFlags = [
    "has_special_needs",
    "requires_medication",
    "has_medications",
    "has_allergies",
    "senior_pet",
    "puppy",
  ];

  return specialCareFlags.some((key) => row[key] === true);
}

function getBookingPetType(row: GenericRow) {
  return getString(row, ["pet_type", "petType", "type", "animal_type"]);
}

function getBookingService(row: GenericRow) {
  return getString(row, [
    "service",
    "service_type",
    "serviceType",
    "care_type",
    "booking_type",
  ]);
}

function getBookingCityState(row: GenericRow) {
  const city = getString(row, ["city", "care_city", "service_city"]);
  const state = getString(row, ["state", "care_state", "service_state"]);

  return [city, state].filter(Boolean).join(", ");
}

function getBookingZip(row: GenericRow) {
  return getString(row, [
    "zip_code",
    "zip",
    "postal_code",
    "zipcode",
    "care_zip",
    "service_zip",
    "customer_zip",
  ]);
}

function getBookingStatus(row: GenericRow) {
  return getString(row, ["status", "booking_status"]);
}

function getBookingPaymentStatus(row: GenericRow) {
  return getString(row, ["payment_status", "pay_status", "stripe_status"]);
}

function getBookingRecurringType(row: GenericRow) {
  return getString(row, ["recurring_type", "recurring", "repeat_type"]);
}

function getBookingCustomerId(row: GenericRow) {
  return getString(row, ["customer_id", "customer_uuid", "pet_parent_id"]);
}

function hasAssignedGuru(row: GenericRow) {
  return Boolean(
    getString(row, [
      "guru_id",
      "provider_profile_id",
      "provider_id",
      "guru_profile_id",
      "caregiver_id",
    ]),
  );
}

async function getAnalyticsData(): Promise<AnalyticsData> {
  const [bookingsResult, petsResult, gurusResult] = await Promise.all([
    supabaseAdmin
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5000),

    supabaseAdmin.from("pets").select("*").limit(5000),

    supabaseAdmin
      .from("gurus")
      .select("id, user_id, display_name, city, state, is_verified, created_at")
      .limit(5000),
  ]);

  return {
    bookings: (bookingsResult.data || []) as GenericRow[],
    pets: (petsResult.data || []) as GenericRow[],
    gurus: (gurusResult.data || []) as GuruRow[],
    bookingsError: bookingsResult.error?.message || null,
    petsError: petsResult.error?.message || null,
    gurusError: gurusResult.error?.message || null,
  };
}

function KpiCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "light",
}: {
  label: string;
  value: string;
  helper: string;
  icon: typeof PawPrint;
  tone?: "light" | "dark" | "green";
}) {
  const toneClasses = {
    light: "border-[#DDE8DF] bg-white text-[#173C2A]",
    dark: "border-white/10 bg-[#102033] text-white",
    green: "border-emerald-200 bg-emerald-50 text-[#173C2A]",
  };

  const iconClasses = {
    light: "bg-emerald-50 text-[#007F3D] ring-emerald-100",
    dark: "bg-white/10 text-emerald-300 ring-white/10",
    green: "bg-white text-[#007F3D] ring-emerald-100",
  };

  return (
    <div
      className={[
        "rounded-3xl border p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)]",
        toneClasses[tone],
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className={[
              "text-xs font-black uppercase tracking-[0.18em]",
              tone === "dark" ? "text-emerald-300" : "text-[#007F3D]",
            ].join(" ")}
          >
            {label}
          </p>

          <p
            className={[
              "mt-3 text-3xl font-black tracking-[-0.05em]",
              tone === "dark" ? "text-white" : "text-[#102033]",
            ].join(" ")}
          >
            {value}
          </p>
        </div>

        <span
          className={[
            "grid h-12 w-12 place-items-center rounded-2xl ring-1",
            iconClasses[tone],
          ].join(" ")}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>

      <p
        className={[
          "mt-4 text-sm font-semibold leading-6",
          tone === "dark" ? "text-white/70" : "text-[#536471]",
        ].join(" ")}
      >
        {helper}
      </p>
    </div>
  );
}

function TopFiveCard({
  title,
  eyebrow,
  items,
  emptyText,
  icon: Icon,
}: {
  title: string;
  eyebrow: string;
  items: TopItem[];
  emptyText: string;
  icon: typeof PawPrint;
}) {
  const maxCount = Math.max(...items.map((item) => item.count), 1);

  return (
    <section className="rounded-[2rem] border border-[#DDE8DF] bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#007F3D]">
            {eyebrow}
          </p>

          <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#102033]">
            {title}
          </h2>
        </div>

        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-[#007F3D] ring-1 ring-emerald-100">
          <Icon className="h-5 w-5" />
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {items.length ? (
          items.map((item, index) => (
            <div key={item.label}>
              <div className="mb-2 flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-[#F4FBF7] text-xs font-black text-[#007F3D] ring-1 ring-[#DDE8DF]">
                    {index + 1}
                  </span>

                  <p className="truncate text-sm font-black text-[#102033]">
                    {item.label}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-black text-[#102033]">
                    {formatNumber(item.count)}
                  </p>
                  <p className="text-[11px] font-bold text-[#6D7C72]">
                    {item.percent}%
                  </p>
                </div>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-[#EEF5F1]">
                <div
                  className="h-full rounded-full bg-[#007F3D]"
                  style={{
                    width: `${Math.max(
                      8,
                      Math.round((item.count / maxCount) * 100),
                    )}%`,
                  }}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-[#CFE1D4] bg-[#F9FCFA] p-5 text-sm font-semibold leading-6 text-[#536471]">
            {emptyText}
          </div>
        )}
      </div>
    </section>
  );
}

function TopMiniList({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: TopItem[];
  emptyText: string;
}) {
  return (
    <div className="rounded-3xl border border-[#E4EEE6] bg-[#F9FCFA] p-5">
      <h3 className="text-lg font-black tracking-[-0.03em] text-[#102033]">
        {title}
      </h3>

      <div className="mt-4 space-y-3">
        {items.length ? (
          items.slice(0, 5).map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3 ring-1 ring-[#E4EEE6]"
            >
              <p className="text-sm font-bold text-[#173C2A]">{item.label}</p>
              <p className="text-sm font-black text-[#007F3D]">
                {item.count} · {item.percent}%
              </p>
            </div>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-[#CFE1D4] bg-white p-4 text-sm font-semibold leading-6 text-[#536471]">
            {emptyText}
          </p>
        )}
      </div>
    </div>
  );
}

function CoverageRow({
  label,
  value,
  percent,
}: {
  label: string;
  value: string;
  percent: number;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="text-sm font-black text-white">{label}</p>
        <p className="text-sm font-black text-emerald-300">{value}</p>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-emerald-300"
          style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }}
        />
      </div>
    </div>
  );
}

export default async function AdminPetAnalyticsPage() {
  const { bookings, pets, gurus, bookingsError, petsError, gurusError } =
    await getAnalyticsData();

  const totalBookings = bookings.length;
  const totalPets = pets.length;
  const totalGurus = gurus.length;

  const totalBookingRevenue = bookings.reduce(
    (sum, booking) =>
      sum +
      getNumber(booking, [
        "total_amount",
        "amount_total",
        "booking_total",
        "price",
        "total",
      ]),
    0,
  );

  const totalPlatformFees = bookings.reduce(
    (sum, booking) =>
      sum +
      getNumber(booking, [
        "platform_fee_amount",
        "platform_fee",
        "service_fee",
        "fee",
      ]),
    0,
  );

  const recurringBookings = bookings.filter((booking) =>
    isRecurring(getBookingRecurringType(booking)),
  ).length;

  const bookingsWithAssignedGuru = bookings.filter(hasAssignedGuru).length;

  const uniquePetParents = uniqueCount(bookings.map(getBookingCustomerId));

  const uniqueDemandLocations = uniqueCount(
    bookings.map((booking) => getBookingZip(booking) || getBookingCityState(booking)),
  );

  const verifiedGurus = gurus.filter((guru) => guru.is_verified).length;

  const petTypesFromPets = pets.map(getPetTypeFromPet).filter(Boolean);
  const petTypesFromBookings = bookings.map(getBookingPetType).filter(Boolean);

  const petTypeValues = petTypesFromPets.length
    ? petTypesFromPets
    : petTypesFromBookings;

  const dogCount = petTypeValues.filter((value) =>
    value.toLowerCase().includes("dog"),
  ).length;

  const catCount = petTypeValues.filter((value) =>
    value.toLowerCase().includes("cat"),
  ).length;

  const specialCarePets = pets.filter(hasSpecialCare).length;

  const topPetTypes = getTopItems(petTypeValues);
  const topBreeds = getTopItems(pets.map(getBreedFromPet).filter(Boolean));
  const topSex = getTopItems(pets.map(getSexFromPet).filter(Boolean));
  const topAgeGroups = getTopItems(pets.map(getAgeFromPet).filter(Boolean));

  const topServices = getTopItems(bookings.map(getBookingService).filter(Boolean));
  const topCities = getTopItems(bookings.map(getBookingCityState).filter(Boolean));
  const topZipCodes = getTopItems(bookings.map(getBookingZip).filter(Boolean));
  const topStatuses = getTopItems(bookings.map(getBookingStatus).filter(Boolean));
  const topPaymentStatuses = getTopItems(
    bookings.map(getBookingPaymentStatus).filter(Boolean),
  );
  const topRecurringTypes = getTopItems(
    bookings.map(getBookingRecurringType).filter(Boolean),
  );

  const topGuruMarkets = getTopItems(
    gurus
      .map((guru) =>
        [guru.city, guru.state].map(normalizeValue).filter(Boolean).join(", "),
      )
      .filter(Boolean),
  );

  const coveragePercent = getPercent(bookingsWithAssignedGuru, totalBookings);
  const recurringPercent = getPercent(recurringBookings, totalBookings);
  const specialCarePercent = getPercent(specialCarePets, totalPets);
  const verifiedGuruPercent = getPercent(verifiedGurus, totalGurus);

  const dataWarnings = [
    bookingsError ? `Bookings: ${bookingsError}` : "",
    petsError ? `Pets: ${petsError}` : "",
    gurusError ? `Gurus: ${gurusError}` : "",
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-[#F7F9F6] px-4 py-8 text-[#173C2A] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-[#DDE8DF] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="relative isolate px-6 py-8 sm:px-8 lg:px-10">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_34%),linear-gradient(135deg,_#ffffff,_#f0fff7)]" />

            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#007F3D]">
                  Admin / Pet & Demand Analytics
                </p>

                <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-[#102033] sm:text-5xl">
                  Pet Care Demand Analytics
                </h1>

                <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-[#536471] sm:text-base">
                  Real Supabase-driven intelligence for pet demographics,
                  service demand, breed trends, location patterns, recurring
                  care, booking status, and Guru coverage across the SitGuru
                  marketplace.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[520px]">
                <div className="rounded-3xl border border-emerald-100 bg-white/80 px-5 py-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#007F3D]">
                    Data source
                  </p>
                  <p className="mt-2 text-xl font-black text-[#102033]">
                    Supabase
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#536471]">
                    Dynamic admin page
                  </p>
                </div>

                <div className="rounded-3xl border border-emerald-100 bg-white/80 px-5 py-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#007F3D]">
                    Records read
                  </p>
                  <p className="mt-2 text-xl font-black text-[#102033]">
                    {formatNumber(totalBookings + totalPets + totalGurus)}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#536471]">
                    Bookings, pets, Gurus
                  </p>
                </div>

                <div className="rounded-3xl border border-emerald-100 bg-white/80 px-5 py-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#007F3D]">
                    Freshness
                  </p>
                  <p className="mt-2 text-xl font-black text-[#102033]">
                    Live on load
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#536471]">
                    Revalidates every view
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {dataWarnings.length ? (
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-none" />
              <div>
                <p className="text-sm font-black">
                  Some analytics data could not load.
                </p>
                <div className="mt-2 space-y-1 text-sm font-semibold leading-6">
                  {dataWarnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Total pet profiles"
            value={formatNumber(totalPets)}
            helper="Pet records currently stored in Supabase. If this is zero, bookings still drive demand analytics."
            icon={PawPrint}
            tone="green"
          />

          <KpiCard
            label="Booking demand"
            value={formatNumber(totalBookings)}
            helper="Total booking records analyzed for service, location, status, revenue, and care demand patterns."
            icon={BarChart3}
          />

          <KpiCard
            label="Unique Pet Parents"
            value={formatNumber(uniquePetParents)}
            helper="Distinct customers represented in booking demand."
            icon={Users}
          />

          <KpiCard
            label="Demand locations"
            value={formatNumber(uniqueDemandLocations)}
            helper="Distinct ZIP or city/state demand points from booking records."
            icon={MapPin}
          />

          <KpiCard
            label="Dog demand"
            value={`${formatNumber(dogCount)}${
              petTypeValues.length
                ? ` / ${getPercent(dogCount, petTypeValues.length)}%`
                : ""
            }`}
            helper="Dog-related demand from pet profiles when available, otherwise booking pet type."
            icon={Dog}
          />

          <KpiCard
            label="Cat demand"
            value={`${formatNumber(catCount)}${
              petTypeValues.length
                ? ` / ${getPercent(catCount, petTypeValues.length)}%`
                : ""
            }`}
            helper="Cat-related demand from pet profiles when available, otherwise booking pet type."
            icon={Cat}
          />

          <KpiCard
            label="Recurring care"
            value={`${formatNumber(recurringBookings)} / ${recurringPercent}%`}
            helper="Bookings marked weekly, monthly, recurring, repeat, or ongoing."
            icon={CalendarDays}
          />

          <KpiCard
            label="Special care needs"
            value={`${formatNumber(specialCarePets)} / ${specialCarePercent}%`}
            helper="Pets with medications, allergies, medical notes, care notes, or special handling flags."
            icon={HeartPulse}
          />

          <KpiCard
            label="Gross booking value"
            value={formatCurrency(totalBookingRevenue)}
            helper="Total booking amount from analyzed booking records."
            icon={TrendingUp}
            tone="dark"
          />

          <KpiCard
            label="Platform fees"
            value={formatCurrency(totalPlatformFees)}
            helper="Platform fee amount from bookings where available."
            icon={Sparkles}
            tone="dark"
          />

          <KpiCard
            label="Guru coverage"
            value={`${formatNumber(bookingsWithAssignedGuru)} / ${coveragePercent}%`}
            helper="Bookings with a Guru or provider profile assigned."
            icon={ShieldCheck}
            tone="dark"
          />

          <KpiCard
            label="Verified Gurus"
            value={`${formatNumber(verifiedGurus)} / ${verifiedGuruPercent}%`}
            helper="Verified Gurus compared to total Guru records loaded."
            icon={CheckCircle2}
            tone="dark"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <TopFiveCard
            title="Top 5 pet types"
            eyebrow="Pet demographics"
            items={topPetTypes}
            emptyText="No pet type data found yet. Add pet profiles or booking pet_type values to populate this chart."
            icon={PawPrint}
          />

          <TopFiveCard
            title="Top 5 breeds"
            eyebrow="Breed trends"
            items={topBreeds}
            emptyText="No breed data found yet. This will populate from the pets table when breed fields are available."
            icon={Dog}
          />

          <TopFiveCard
            title="Top 5 requested services"
            eyebrow="Service demand"
            items={topServices}
            emptyText="No booking service data found yet. This will populate from bookings service fields."
            icon={BarChart3}
          />

          <TopFiveCard
            title="Top 5 cities"
            eyebrow="Location demand"
            items={topCities}
            emptyText="No booking city/state demand found yet."
            icon={MapPin}
          />

          <TopFiveCard
            title="Top 5 ZIP codes"
            eyebrow="Local market signals"
            items={topZipCodes}
            emptyText="No ZIP demand found yet. Add a ZIP/postal field to bookings if you want ZIP-level analytics."
            icon={MapPin}
          />

          <TopFiveCard
            title="Top 5 recurring types"
            eyebrow="Repeat care"
            items={topRecurringTypes}
            emptyText="No recurring care labels found yet."
            icon={CalendarDays}
          />

          <TopFiveCard
            title="Top 5 booking statuses"
            eyebrow="Operational flow"
            items={topStatuses}
            emptyText="No booking status data found yet."
            icon={Clock3}
          />

          <TopFiveCard
            title="Top 5 payment statuses"
            eyebrow="Payment flow"
            items={topPaymentStatuses}
            emptyText="No payment status data found yet."
            icon={TrendingUp}
          />

          <TopFiveCard
            title="Top Guru markets"
            eyebrow="Marketplace coverage"
            items={topGuruMarkets}
            emptyText="No Guru city/state records found yet."
            icon={ShieldCheck}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-[#DDE8DF] bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#007F3D]">
                  Pet demographics
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#102033]">
                  Breed, sex, and age intelligence
                </h2>
                <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#536471]">
                  These cards use the pets table when fields are available. If
                  the pet table does not yet store breed, sex, or age, the page
                  safely shows empty states instead of fake numbers.
                </p>
              </div>

              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-[#007F3D] ring-1 ring-emerald-100">
                <HeartPulse className="h-5 w-5" />
              </span>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <TopMiniList
                title="Sex breakdown"
                items={topSex}
                emptyText="No sex/gender pet fields found."
              />
              <TopMiniList
                title="Age groups"
                items={topAgeGroups}
                emptyText="No age or life stage pet fields found."
              />
              <TopMiniList
                title="Care flags"
                items={[
                  {
                    label: "Special care pets",
                    count: specialCarePets,
                    percent: specialCarePercent,
                  },
                  {
                    label: "Standard care pets",
                    count: Math.max(totalPets - specialCarePets, 0),
                    percent: getPercent(
                      Math.max(totalPets - specialCarePets, 0),
                      totalPets,
                    ),
                  },
                ].filter(() => totalPets > 0)}
                emptyText="No pet profile records found."
              />
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#DDE8DF] bg-[#102033] p-6 text-white shadow-[0_18px_60px_rgba(15,23,42,0.12)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
                  Coverage strategy
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white">
                  Where SitGuru should grow
                </h2>
              </div>

              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-emerald-300 ring-1 ring-white/10">
                <MapPin className="h-5 w-5" />
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <CoverageRow
                label="Booking demand with assigned Guru"
                value={`${coveragePercent}%`}
                percent={coveragePercent}
              />
              <CoverageRow
                label="Recurring care opportunity"
                value={`${recurringPercent}%`}
                percent={recurringPercent}
              />
              <CoverageRow
                label="Verified Guru supply"
                value={`${verifiedGuruPercent}%`}
                percent={verifiedGuruPercent}
              />
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-black text-white">
                Admin growth signal
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-white/70">
                Use the Top 5 cities and ZIP codes against Guru coverage to
                decide where SitGuru should recruit more Gurus, Ambassadors,
                partners, and local pet-care professionals.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}