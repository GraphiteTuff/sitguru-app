import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  HeartHandshake,
  MessageCircle,
  PawPrint,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";

type PageProps = {
  params: Promise<{
    bookingId: string;
  }>;
};

type DbRow = Record<string, unknown>;

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function firstString(row: DbRow | null | undefined, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = readString(row?.[key]);
    if (value) return value;
  }

  return fallback;
}

function firstNumber(row: DbRow | null | undefined, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = row?.[key];
    const parsed = readNumber(value, Number.NaN);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function parseMoneyFromText(source: string | null | undefined, patterns: RegExp[]) {
  if (!source) return 0;

  for (const pattern of patterns) {
    const match = source.match(pattern);
    const rawValue = match?.[1]?.replace(/,/g, "");

    if (rawValue) {
      const parsed = Number(rawValue);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return 0;
}

function getBestBookingAmount(booking: DbRow | null, notes: string) {
  const directTotal = firstNumber(
    booking,
    [
      "total_customer_paid",
      "customer_total_paid",
      "customer_paid_amount",
      "customer_total_amount",
      "total_amount",
      "amount_total",
      "checkout_amount",
      "stripe_amount_total",
      "payment_amount",
      "service_price",
      "subtotal_amount",
    ],
    0,
  );

  if (directTotal > 0) return directTotal;

  const servicePrice = parseMoneyFromText(notes, [
    /service(?:\s+price|\s+amount)?[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
    /subtotal[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
  ]);

  const marketplaceFee = parseMoneyFromText(notes, [
    /marketplace\s+fee\s+amount[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
    /sitguru\s+marketplace\s+fee\s+amount[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
  ]);

  const tip = parseMoneyFromText(notes, [
    /guru\s+tip\s+selected[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
    /tip\s+selected[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
    /tip\s+amount[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
  ]);

  if (servicePrice > 0 || marketplaceFee > 0 || tip > 0) {
    return servicePrice + marketplaceFee + tip;
  }

  const guruPayout = parseMoneyFromText(notes, [
    /estimated\s+guru\s+payout[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
  ]);

  if (guruPayout > 0 || marketplaceFee > 0 || tip > 0) {
    return guruPayout + marketplaceFee;
  }

  return 0;
}

function getBestTipAmount(booking: DbRow | null, notes: string) {
  const directTip = firstNumber(booking, ["tip_amount", "guru_tip_amount"], 0);
  if (directTip > 0) return directTip;

  return parseMoneyFromText(notes, [
    /guru\s+tip\s+selected[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
    /tip\s+selected[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
    /tip\s+amount[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
  ]);
}

function getBestMarketplaceFee(booking: DbRow | null, notes: string) {
  const directFee = firstNumber(booking, ["marketplace_fee_amount", "sitguru_fee_amount"], 0);
  if (directFee > 0) return directFee;

  return parseMoneyFromText(notes, [
    /marketplace\s+fee\s+amount[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
    /sitguru\s+marketplace\s+fee\s+amount[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
  ]);
}

function getBestGuruPayout(booking: DbRow | null, notes: string, total: number, fee: number) {
  const directPayout = firstNumber(booking, ["guru_payout_amount", "guru_estimated_total_payout"], 0);
  if (directPayout > 0) return directPayout;

  const notesPayout = parseMoneyFromText(notes, [
    /estimated\s+guru\s+payout[:\s]+\$?([0-9]+(?:\.[0-9]{1,2})?)/i,
  ]);

  if (notesPayout > 0) return notesPayout;
  if (total > 0 || fee > 0) return Math.max(0, total - fee);

  return 0;
}

function formatMoney(value: number, cents = true) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents ? 2 : 0,
  }).format(value || 0);
}

function formatMoneyOrPending(value: number, fallback = "Pending") {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return formatMoney(value);
}

function hasUsableAmount(value: number) {
  return Number.isFinite(value) && value > 0;
}

function formatStatus(value: string | null | undefined) {
  return (value || "pending").replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Date pending";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date pending";

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value: string | null | undefined) {
  if (!value) return "Flexible";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Flexible";

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Date pending";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date pending";

  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusClasses(status: string | null | undefined) {
  const normalized = (status || "pending").toLowerCase();

  if (["pending", "requested", "checkout_started", "unpaid"].includes(normalized)) {
    return "bg-amber-50 text-amber-800 ring-1 ring-amber-200";
  }

  if (["confirmed", "paid", "completed", "succeeded"].includes(normalized)) {
    return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200";
  }

  if (["in_progress", "processing"].includes(normalized)) {
    return "bg-sky-50 text-sky-800 ring-1 ring-sky-200";
  }

  if (["cancelled", "canceled", "failed", "refunded"].includes(normalized)) {
    return "bg-rose-50 text-rose-800 ring-1 ring-rose-200";
  }

  return "bg-slate-50 text-slate-700 ring-1 ring-slate-200";
}

function getAvatarInitials(name: string | null | undefined) {
  const source = (name || "SitGuru").trim();
  const parts = source.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "SG";
}

function isGenericPetName(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();

  return (
    !normalized ||
    normalized === "pet" ||
    normalized === "your pet" ||
    normalized === "pet care" ||
    normalized === "booking"
  );
}

function getBookingStart(row: DbRow | null) {
  return (
    firstString(row, ["start_time", "booking_date", "requested_date", "created_at"], "") || null
  );
}

function getLocation(row: DbRow | null, guru: DbRow | null) {
  const line1 = firstString(row, ["care_address", "service_address", "address", "location"], "");
  const city = firstString(row, ["care_city", "city"], "");
  const state = firstString(row, ["care_state", "state"], "");
  const zip = firstString(row, ["care_zip_code", "zip_code", "postal_code"], "");
  const assembled = [line1, city, state, zip].filter(Boolean).join(", ");
  if (assembled) return assembled;

  return firstString(guru, ["service_area", "city", "state"], "Location details shared after confirmation") || "Location details shared after confirmation";
}

function buildCareHighlights(booking: DbRow | null) {
  const highlights: string[] = [];
  const serviceType = firstString(booking, ["service_type"], "");
  const visitLength = firstString(booking, ["visit_length"], "");
  const timeWindow = firstString(booking, ["time_window"], "");
  const notes = firstString(booking, ["notes"], "");

  if (serviceType) highlights.push(serviceType);
  if (visitLength) highlights.push(`${visitLength} visit`);
  if (timeWindow) highlights.push(timeWindow);
  if (!highlights.length && notes) highlights.push("Special care notes on file");
  if (!highlights.length) highlights.push("Personalized care plan ready");

  return highlights.slice(0, 4);
}

async function fetchFallbackPetForCustomer(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  petName: string,
) {
  const selectColumns = "id,name,species,breed,age,weight,temperament,medications,notes,photo_url,video_url";
  const attempts = [
    { column: "owner_id", value: userId },
    { column: "user_id", value: userId },
    { column: "customer_id", value: userId },
    { column: "pet_owner_id", value: userId },
  ];

  for (const attempt of attempts) {
    const { data, error } = await supabase
      .from("pets")
      .select(selectColumns)
      .eq(attempt.column, attempt.value);

    if (error) continue;

    const rows = (data as DbRow[] | null) || [];
    const normalizedPetName = petName.trim().toLowerCase();

    const matchedByName = rows.find((row) =>
      normalizedPetName ? firstString(row, ["name"], "").toLowerCase() === normalizedPetName : false,
    );

    if (matchedByName) return matchedByName;

    /*
      Only use the customer's single pet as a fallback when the booking has a
      generic pet label like "Pet" or "Your pet". Do not use Kitty Girl's
      profile photo for a real booking labeled Rex.
    */
    if (rows.length === 1 && isGenericPetName(petName)) {
      return rows[0];
    }
  }

  return null;
}

async function fetchGuruForBooking(
  supabase: Awaited<ReturnType<typeof createClient>>,
  guruId: string | null,
  guruName: string | null,
) {
  const attempts: Array<{
    table: string;
    column: string;
    value: string;
    operator?: "eq" | "ilike";
  }> = [];

  if (guruId) {
    attempts.push(
      { table: "guru_profiles", column: "id", value: guruId },
      { table: "guru_profiles", column: "user_id", value: guruId },
      { table: "guru_profiles", column: "profile_id", value: guruId },
      { table: "profiles", column: "id", value: guruId },
      { table: "profiles", column: "user_id", value: guruId },
      { table: "gurus", column: "id", value: guruId },
      { table: "gurus", column: "user_id", value: guruId },
      { table: "gurus", column: "profile_id", value: guruId },
    );
  }

  if (guruName && guruName.toLowerCase() !== "sitguru") {
    attempts.push(
      { table: "guru_profiles", column: "full_name", value: guruName, operator: "ilike" },
      { table: "guru_profiles", column: "name", value: guruName, operator: "ilike" },
      { table: "profiles", column: "full_name", value: guruName, operator: "ilike" },
      { table: "profiles", column: "name", value: guruName, operator: "ilike" },
      { table: "gurus", column: "full_name", value: guruName, operator: "ilike" },
      { table: "gurus", column: "name", value: guruName, operator: "ilike" },
    );
  }

  for (const attempt of attempts) {
    const baseQuery = supabase.from(attempt.table).select("*");

    const query =
      attempt.operator === "ilike"
        ? baseQuery.ilike(attempt.column, `%${attempt.value}%`)
        : baseQuery.eq(attempt.column, attempt.value);

    const { data, error } = await query.limit(1).maybeSingle();

    if (!error && data) return data as DbRow;
  }

  return null;
}

function DetailMetric({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-black tracking-tight text-slate-950">{value}</p>
      {helper ? <p className="mt-1 text-sm text-slate-500">{helper}</p> : null}
    </div>
  );
}

function TimelineItem({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        {icon}
      </div>
      <div className="flex-1 rounded-[1.5rem] border border-slate-200 bg-white p-4">
        <p className="text-sm font-black text-slate-950">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </div>
  );
}

function ActionLink({
  href,
  label,
  variant = "primary",
}: {
  href: string;
  label: string;
  variant?: "primary" | "secondary" | "soft";
}) {
  const className =
    variant === "primary"
      ? "bg-emerald-600 text-white hover:bg-emerald-700"
      : variant === "soft"
        ? "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
        : "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50";

  return (
    <Link
      href={href}
      className={`inline-flex min-h-[46px] items-center justify-center rounded-2xl px-4 py-3 text-sm font-black transition ${className}`}
    >
      {label}
    </Link>
  );
}

export default async function CustomerBookingDetailsPage({ params }: PageProps) {
  const { bookingId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: bookingData } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle();

  const booking = (bookingData as DbRow | null) ?? null;

  if (!booking) {
    notFound();
  }

  const ownerIds = [
    readString(booking.customer_id),
    readString(booking.pet_owner_id),
    readString(booking.user_id),
  ].filter(Boolean);

  const ownerEmail = readString(booking.customer_email)?.toLowerCase() || null;
  const viewerEmail = user.email?.toLowerCase() || null;
  const userOwnsBooking = ownerIds.includes(user.id) || (ownerEmail && viewerEmail && ownerEmail === viewerEmail);

  if (!userOwnsBooking) {
    notFound();
  }

  const petId = readString(booking.pet_id);
  const guruId = readString(booking.guru_id);

  const initialGuruName = firstString(booking, ["guru_name", "sitter_name", "provider_name"], "");
  const [{ data: petData }, resolvedGuru] = await Promise.all([
    petId ? supabase.from("pets").select("*").eq("id", petId).maybeSingle() : Promise.resolve({ data: null }),
    fetchGuruForBooking(supabase, guruId, initialGuruName),
  ]);

  const serviceType = firstString(booking, ["service_type"], "Pet Care");
  let pet = (petData as DbRow | null) ?? null;
  const guru = resolvedGuru;

  const initialPetName = firstString(booking, ["pet_name"], firstString(pet, ["name"], ""));
  if (!pet) {
    pet = await fetchFallbackPetForCustomer(supabase, user.id, initialPetName);
  }

  const petName = firstString(booking, ["pet_name"], firstString(pet, ["name"], "Your Pet"));
  const guruName = firstString(
    booking,
    ["guru_name", "sitter_name", "provider_name"],
    firstString(guru, ["full_name", "display_name", "name", "first_name"], "SitGuru"),
  );
  const guruAvatar = firstString(
    booking,
    [
      "guru_avatar_url",
      "guru_photo_url",
      "sitter_avatar_url",
      "sitter_photo_url",
      "provider_avatar_url",
      "provider_photo_url",
    ],
    firstString(
      guru,
      [
        "avatar_url",
        "profile_photo_url",
        "photo_url",
        "image_url",
        "headshot_url",
        "profile_image_url",
      ],
      "",
    ),
  );
  const petPhoto = firstString(pet, ["photo_url", "image_url"], "");
  const bookingStatus = firstString(booking, ["status"], "pending");
  const paymentStatus = firstString(booking, ["payment_status"], "unpaid");
  const startTime = getBookingStart(booking);
  const createdAt = firstString(booking, ["created_at"], "");
  const bookingCode = bookingId.slice(0, 8).toUpperCase();
  const notes = firstString(booking, ["notes"], "No additional care notes have been added yet.");
  const total = getBestBookingAmount(booking, notes);
  const tip = getBestTipAmount(booking, notes);
  const fee = getBestMarketplaceFee(booking, notes);
  const payout = getBestGuruPayout(booking, notes, total, fee);
  const visitLength = firstString(booking, ["visit_length"], "");
  const timeWindow = firstString(booking, ["time_window"], "");
  const location = getLocation(booking, guru);
  const careHighlights = buildCareHighlights(booking);

  return (
    <main
      className="min-h-screen bg-[#eef7f2] pb-16 font-light text-slate-950"
      style={{
        fontFamily:
          '"Open Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontWeight: 300,
      }}
    >
      <Header />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/customer/dashboard"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-900 shadow-sm transition hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-black ${getStatusClasses(bookingStatus)}`}>
              {formatStatus(bookingStatus)}
            </span>
            <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-black ${getStatusClasses(paymentStatus)}`}>
              {formatStatus(paymentStatus)}
            </span>
          </div>
        </div>

        <section className="mt-5 overflow-hidden rounded-[2rem] border border-emerald-200 bg-white shadow-sm">
          <div className="relative overflow-hidden bg-gradient-to-r from-[#22c7a8] via-[#78d8d0] to-[#c6ecff] px-6 py-8 sm:px-8 lg:px-10">
            <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-white/25 blur-3xl" />
            <div className="absolute -bottom-8 left-16 h-28 w-28 rounded-full bg-emerald-200/40 blur-2xl" />

            <div className="relative grid gap-6 lg:grid-cols-[1.2fr_360px] lg:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-900/70">
                  Trust & care booking overview
                </p>
                <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                  {serviceType} for {petName}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-800/80">
                  Everything a pet parent needs is in one clear place: timing, pet care notes, payment details, support actions, and a reassuring view of what happens next.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {careHighlights.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center rounded-full border border-white/60 bg-white/70 px-3 py-1.5 text-xs font-black text-slate-900 shadow-sm"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-white/60 bg-white/80 p-5 shadow-lg backdrop-blur">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Care snapshot</p>

                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[1.3rem] border border-slate-200 bg-white/90 p-3">
                  <div className="flex -space-x-2">
                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-slate-100 shadow-sm">
                      {petPhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={petPhoto} alt={petName} className="h-full w-full object-cover" />
                      ) : (
                        <PawPrint className="h-5 w-5 text-emerald-600" />
                      )}
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-slate-100 text-xs font-black text-slate-900 shadow-sm">
                      {guruAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={guruAvatar} alt={guruName} className="h-full w-full object-cover" />
                      ) : (
                        getAvatarInitials(guruName)
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-950">{petName} + {guruName}</p>
                    <p className="text-sm text-slate-600">A warm care match with details kept easy to follow.</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <DetailMetric label="Date" value={formatDate(startTime)} helper={formatTime(startTime)} />
                  <DetailMetric
                    label="Total"
                    value={formatMoneyOrPending(total, "Pending")}
                    helper={
                      hasUsableAmount(total)
                        ? tip > 0
                          ? `${formatMoney(tip)} tip included`
                          : "Transparent customer total"
                        : "Final amount is waiting on checkout/booking payment data"
                    }
                  />
                  <DetailMetric label="Reference" value={bookingCode} helper="Share with support if needed" />
                  <DetailMetric label="Created" value={formatDate(createdAt)} helper="Booking request date" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-emerald-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-600">
                Why you can feel confident
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Built to help Pet Parents feel calm after checkout
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                SitGuru keeps your booking, care notes, support options, and next steps visible so you do not have to wonder what happens next.
              </p>
            </div>
            <ShieldCheck className="h-10 w-10 text-emerald-600" />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">Care details are organized</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Date, timing, service, notes, location, and payment details stay together in one friendly view.
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">Support is one click away</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                If plans change, customers are guided to message the Guru or support before canceling.
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">Your pet stays centered</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Pet photos, care notes, and booking details make the experience feel personal and trustworthy.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-600">Your trusted care team</p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Warm, clear details for peace of mind</h2>
                </div>
                <ShieldCheck className="h-10 w-10 text-emerald-600" />
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Your SitGuru</p>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[1.3rem] bg-white text-lg font-black text-slate-900 shadow-sm ring-1 ring-slate-200">
                      {guruAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={guruAvatar} alt={guruName} className="h-full w-full object-cover" />
                      ) : (
                        getAvatarInitials(guruName)
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-2xl font-black tracking-tight text-slate-950">{guruName}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-600">Premium SitGuru care provider</p>
                      <p className="mt-1 text-sm font-black text-emerald-700">{location}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Pet care plan</p>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[1.3rem] bg-white text-2xl shadow-sm ring-1 ring-slate-200">
                      {petPhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={petPhoto} alt={petName} className="h-full w-full object-cover" />
                      ) : (
                        <PawPrint className="h-8 w-8 text-emerald-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-2xl font-black tracking-tight text-slate-950">{petName}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-600">{serviceType}</p>
                      <p className="mt-1 text-sm font-black text-emerald-700">{visitLength || "Personalized visit"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_310px] xl:items-center">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white text-sm font-black text-slate-900 shadow-sm">
                      {guruAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={guruAvatar} alt={guruName} className="h-full w-full object-cover" />
                      ) : (
                        getAvatarInitials(guruName)
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-base font-black text-slate-950">{guruName} preview</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        A friendly place to show rating, repeat-care history, and response speed as soon as those Guru metrics are wired.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-2xl bg-white px-3 py-2 text-center ring-1 ring-emerald-200">
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">Rating</p>
                      <p className="mt-1 text-sm font-black text-slate-950">New</p>
                    </div>
                    <div className="rounded-2xl bg-white px-3 py-2 text-center ring-1 ring-emerald-200">
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">Repeat</p>
                      <p className="mt-1 text-sm font-black text-slate-950">Ready</p>
                    </div>
                    <div className="rounded-2xl bg-white px-3 py-2 text-center ring-1 ring-emerald-200">
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">Reply</p>
                      <p className="mt-1 text-sm font-black text-slate-950">Message</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <DetailMetric label="Start" value={formatDate(startTime)} helper={formatTime(startTime)} />
                <DetailMetric label="Time window" value={timeWindow || "Flexible"} helper="Scheduled care window" />
                <DetailMetric label="Service" value={serviceType} helper={visitLength || "Customized care"} />
                <DetailMetric label="Location" value={location} helper="Where care will take place" />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <ActionLink href="/customer/dashboard/messages" label="Message Guru" />
                <ActionLink href="/search" label="Book Similar Care" variant="soft" />
                <ActionLink href="/customer/dashboard/messages?support=admin" label="Get Support" variant="secondary" />
                <ActionLink href="/customer/dashboard" label="Return to Dashboard" variant="secondary" />
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-600">Booking journey</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">A reassuring timeline from request to care</h2>

              <div className="mt-6 space-y-4">
                <TimelineItem
                  icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                  title="Booking request created"
                  description={`Created on ${formatDate(createdAt)}. Your request is safely recorded in SitGuru.`}
                />
                <TimelineItem
                  icon={<HeartHandshake className="h-5 w-5 text-amber-600" />}
                  title={`Status: ${formatStatus(bookingStatus)}`}
                  description="We keep every status easy to understand so customers always know what is happening next."
                />
                <TimelineItem
                  icon={<CalendarDays className="h-5 w-5 text-sky-600" />}
                  title="Care appointment"
                  description={`Your visit is planned for ${formatDateTime(startTime)}${timeWindow ? ` during the ${timeWindow}` : ""}.`}
                />
              </div>

              <div className="mt-6 rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  <p className="text-lg font-black text-slate-950">Care notes</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">{notes}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-600">Payment summary</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Clear pricing builds trust</h2>

              <div className="mt-5 rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
                    <span className="text-sm font-semibold text-slate-500">Customer total</span>
                    <span className="text-2xl font-black tracking-tight text-slate-950">
                      {formatMoneyOrPending(total, "Pending")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
                    <span className="text-sm font-semibold text-slate-500">Tip</span>
                    <span className="text-sm font-black text-emerald-700">
                      {formatMoneyOrPending(tip, "No tip yet")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
                    <span className="text-sm font-semibold text-slate-500">Marketplace fee</span>
                    <span className="text-sm font-black text-slate-950">
                      {formatMoneyOrPending(fee, "Pending")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold text-slate-500">Estimated Guru payout</span>
                    <span className="text-sm font-black text-slate-950">
                      {formatMoneyOrPending(payout, "Pending")}
                    </span>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Payment status</p>
                  <p className="mt-2 text-lg font-black text-slate-950">{formatStatus(paymentStatus)}</p>
                </div>

                {!hasUsableAmount(total) ? (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-black text-amber-900">Payment amount not attached yet</p>
                    <p className="mt-1 text-sm leading-6 text-amber-800">
                      This booking needs the checkout flow or Stripe webhook to save the customer total,
                      marketplace fee, tip, and Guru payout back to the booking row.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-600">Trust & support</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Customers should always know where to turn</h2>

              <div className="mt-5 space-y-3">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <MessageCircle className="mt-0.5 h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-black text-slate-950">Fast messaging</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">Reach your Guru or support quickly without leaving the customer experience.</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-black text-slate-950">Clear records</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">Booking details, totals, and care notes stay organized to support confidence and accountability.</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <HeartHandshake className="mt-0.5 h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-black text-slate-950">Pet-parent friendly</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">Every section is designed to feel warm, clear, and trustworthy instead of cold or overly technical.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-[1.4rem] border border-slate-200 bg-white p-4">
                <p className="text-sm font-black text-slate-950">Need changes? Try this first</p>
                <div className="mt-3 grid gap-2">
                  <div className="rounded-2xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                    1. Message your Guru with the timing or care-note change.
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                    2. Contact support if you need help coordinating.
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                    3. Rebook or adjust before canceling whenever possible.
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-[1.4rem] border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-black text-slate-950">Need a change before care?</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Instead of canceling, message your Guru or support first. We can often help with timing, notes, or care-plan adjustments.
                </p>
              </div>

              <div className="mt-5 grid gap-3">
                <ActionLink href="/customer/dashboard/messages" label="Open Messages" />
                <ActionLink href="/customer/dashboard/messages?support=admin" label="Contact Support" variant="secondary" />
                <ActionLink href="/search" label="Browse More Gurus" variant="soft" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
