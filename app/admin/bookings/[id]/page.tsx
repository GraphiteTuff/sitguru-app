import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import VisitUpdateTimeline from "@/components/visit-updates/VisitUpdateTimeline";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import StatusUpdateForm from "./StatusUpdateForm";

export const dynamic = "force-dynamic";

type MaybePromise<T> = T | Promise<T>;

type PageProps = {
  params: MaybePromise<{
    id: string;
  }>;
};

type BookingRow = Record<string, unknown> & {
  id: string;
  customer_id?: string | null;
  sitter_id?: string | null;
  guru_id?: string | null;
  pet_id?: string | null;
  pet_name?: string | null;
  pet_type?: string | null;
  breed?: string | null;
  pet_photo_url?: string | null;
  guru_slug?: string | null;
  guru_name?: string | null;
  assigned_guru_name?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  service?: string | null;
  service_type?: string | null;
  service_key?: string | null;
  booking_type?: string | null;
  notes?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  care_city?: string | null;
  care_state?: string | null;
  care_zip_code?: string | null;
  care_locality_name?: string | null;
  booking_date?: string | null;
  requested_date?: string | null;
  requested_start_date?: string | null;
  requested_end_date?: string | null;
  date_range_label?: string | null;
  time_window?: string | null;
  visit_length?: string | null;
  status?: string | null;
  payment_status?: string | null;
  payout_status?: string | null;
  total_amount?: number | string | null;
  amount_total?: number | string | null;
  total?: number | string | null;
  customer_total_amount?: number | string | null;
  total_customer_paid?: number | string | null;
  subtotal_amount?: number | string | null;
  booking_subtotal_amount?: number | string | null;
  service_price?: number | string | null;
  price?: number | string | null;
  amount?: number | string | null;
  marketplace_fee_amount?: number | string | null;
  sitguru_fee_amount?: number | string | null;
  platform_fee?: number | string | null;
  marketplace_fee?: number | string | null;
  tip_amount?: number | string | null;
  guru_tip_amount?: number | string | null;
  guru_estimated_base_payout?: number | string | null;
  guru_estimated_total_payout?: number | string | null;
  guru_payout_amount?: number | string | null;
  calculated_distance_miles?: number | string | null;
  service_radius_eligible?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ProfileRow = Record<string, unknown> & {
  id: string;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  phone_number?: string | null;
  mobile?: string | null;
  city?: string | null;
  state?: string | null;
};

type GuruRow = Record<string, unknown> & {
  id: string;
  profile_id?: string | null;
  user_id?: string | null;
  display_name?: string | null;
  full_name?: string | null;
  public_name?: string | null;
  business_name?: string | null;
  slug?: string | null;
};

type PetRow = Record<string, unknown> & {
  id: string;
  name?: string | null;
  species?: string | null;
  pet_type?: string | null;
  breed?: string | null;
  age?: string | number | null;
  size?: string | null;
  weight?: string | number | null;
  temperament?: string | null;
  medical_notes?: string | null;
  medications?: string | null;
  notes?: string | null;
  care_instructions?: string | null;
  photo_url?: string | null;
  pet_photo_url?: string | null;
  avatar_url?: string | null;
  profile_photo_url?: string | null;
  image_url?: string | null;
};

type NoteGroup = {
  care: string[];
  pet: string[];
  finance: string[];
  media: string[];
  internal: string[];
};

async function getVisitData(bookingId: string) {
  const [{ data: session }, { data: updates }] = await Promise.all([
    supabaseAdmin
      .from("booking_visit_sessions")
      .select("*")
      .eq("booking_id", bookingId)
      .maybeSingle(),
    supabaseAdmin
      .from("booking_visit_updates")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true }),
  ]);

  return {
    session,
    updates: updates ?? [],
  };
}

function cleanString(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function firstNonEmpty(...values: unknown[]) {
  for (const value of values) {
    const cleaned = cleanString(value);
    if (cleaned) return cleaned;
  }

  return "";
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }

  return 0;
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    const parsed = asNumber(value);
    if (parsed > 0) return parsed;
  }

  return 0;
}

function formatDate(value?: string | null) {
  if (!value) return "Not set";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "Not set";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCurrency(value?: number | string | null) {
  const amount = asNumber(value);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatPlainStatus(status?: string | null) {
  const clean = String(status || "pending").trim().toLowerCase();

  if (clean === "in_progress" || clean === "active") return "In Progress";
  if (clean === "cancelled" || clean === "canceled") return "Cancelled";

  return clean
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizePayment(payment?: string | null) {
  if (!payment) return "unpaid";
  return payment.toLowerCase();
}

function statusClasses(status?: string | null) {
  const normalized = String(status || "pending").toLowerCase();

  if (normalized.includes("confirm")) {
    return "border border-emerald-200 bg-emerald-100 text-emerald-900";
  }

  if (normalized.includes("active") || normalized.includes("progress")) {
    return "border border-sky-200 bg-sky-100 text-sky-900";
  }

  if (normalized.includes("complete")) {
    return "border border-indigo-200 bg-indigo-100 text-indigo-900";
  }

  if (normalized.includes("cancel")) {
    return "border border-rose-200 bg-rose-100 text-rose-900";
  }

  return "border border-amber-200 bg-amber-100 text-amber-900";
}

function paymentClasses(payment?: string | null) {
  const normalized = normalizePayment(payment);

  if (normalized === "paid" || normalized === "succeeded") {
    return "border border-emerald-200 bg-emerald-100 text-emerald-900";
  }

  if (normalized.includes("checkout")) {
    return "border border-sky-200 bg-sky-100 text-sky-900";
  }

  return "border border-amber-200 bg-amber-100 text-amber-900";
}

function getCustomerName(booking: BookingRow, profile: ProfileRow | null) {
  return (
    firstNonEmpty(
      booking.customer_name,
      profile?.full_name,
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" "),
    ) || "Customer"
  );
}

function getCustomerPhone(booking: BookingRow, profile: ProfileRow | null) {
  return (
    firstNonEmpty(
      booking.customer_phone,
      profile?.phone,
      profile?.phone_number,
      profile?.mobile,
    ) || "Not provided"
  );
}

function getGuruName(booking: BookingRow, guru: GuruRow | null) {
  return (
    firstNonEmpty(
      booking.assigned_guru_name,
      booking.guru_name,
      guru?.display_name,
      guru?.full_name,
      guru?.public_name,
      guru?.business_name,
    ) || "Guru"
  );
}

function getPetName(booking: BookingRow, pet: PetRow | null) {
  return firstNonEmpty(pet?.name, booking.pet_name) || "Pet";
}

function getPetType(booking: BookingRow, pet: PetRow | null) {
  return firstNonEmpty(pet?.species, pet?.pet_type, booking.pet_type) || "Not set";
}

function getPetBreed(booking: BookingRow, pet: PetRow | null) {
  return firstNonEmpty(pet?.breed, booking.breed) || "Not set";
}

function getServiceLabel(booking: BookingRow) {
  return (
    firstNonEmpty(
      booking.service,
      booking.service_type,
      String(booking.service_key || "").replace(/_/g, " "),
      booking.booking_type,
    ) || "General care"
  );
}

function getLocationLabel(booking: BookingRow, profile: ProfileRow | null) {
  const careLocation = firstNonEmpty(
    booking.care_locality_name,
    [booking.care_city, booking.care_state].filter(Boolean).join(", "),
    [booking.city, booking.state].filter(Boolean).join(", "),
  );

  if (careLocation) return careLocation;

  const profileLocation = [profile?.city, profile?.state].filter(Boolean).join(", ");
  if (profileLocation) return profileLocation;

  return "Not provided";
}

function getRequestedDateLabel(booking: BookingRow) {
  const label = firstNonEmpty(booking.date_range_label);
  if (label) return label;

  const start = firstNonEmpty(
    booking.requested_start_date,
    booking.requested_date,
    booking.booking_date,
  );
  const end = firstNonEmpty(booking.requested_end_date);

  if (start && end && start !== end) return `${formatDate(start)} – ${formatDate(end)}`;
  return formatDate(start || null);
}

function getMoneySummary(booking: BookingRow) {
  const subtotal = firstNumber(
    booking.subtotal_amount,
    booking.service_price,
    booking.booking_subtotal_amount,
    booking.total_amount,
    booking.price,
    booking.amount,
  );

  const platformFee = firstNumber(
    booking.marketplace_fee_amount,
    booking.sitguru_fee_amount,
    booking.platform_fee,
    booking.marketplace_fee,
  );

  const tip = firstNumber(booking.tip_amount, booking.guru_tip_amount);

  const customerTotal = firstNumber(
    booking.customer_total_amount,
    booking.total_customer_paid,
    booking.amount_total,
    booking.total,
    subtotal + platformFee + tip,
  );

  const guruBasePayout = firstNumber(
    booking.guru_estimated_base_payout,
    subtotal - platformFee,
  );

  const guruTotalPayout = firstNumber(
    booking.guru_estimated_total_payout,
    booking.guru_payout_amount,
    guruBasePayout + tip,
  );

  return {
    subtotal,
    platformFee,
    tip,
    customerTotal,
    guruBasePayout,
    guruTotalPayout,
  };
}

function getFormStatusValue(status?: string | null) {
  const clean = String(status ?? "").trim().toLowerCase();

  if (clean.includes("confirm")) return "confirmed";
  if (clean.includes("active") || clean.includes("progress")) return "in_progress";
  if (clean.includes("complete")) return "completed";
  if (clean.includes("cancel")) return "cancelled";

  return "pending";
}

function isInvalidBookingId(value: string) {
  const trimmed = value.trim().toLowerCase();
  return !trimmed || trimmed === "undefined" || trimmed === "null";
}

function extractUrlFromNotes(notes: string | null | undefined, label: string) {
  const lines = String(notes || "").split(/\r?\n/);
  const match = lines.find((line) => line.toLowerCase().startsWith(label.toLowerCase()));

  if (!match) return "";

  const urlMatch = match.match(/https?:\/\/\S+/i);
  return urlMatch?.[0] || "";
}

function groupBookingNotes(notes?: string | null): NoteGroup {
  const grouped: NoteGroup = {
    care: [],
    pet: [],
    finance: [],
    media: [],
    internal: [],
  };

  const lines = String(notes || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const lower = line.toLowerCase();

    if (
      lower.includes("photo url") ||
      lower.includes("avatar url") ||
      lower.includes("media url") ||
      lower.includes("image url") ||
      lower.includes("https://")
    ) {
      grouped.media.push(line);
      continue;
    }

    if (
      lower.startsWith("service:") ||
      lower.startsWith("requested") ||
      lower.startsWith("time window:") ||
      lower.startsWith("visit length:") ||
      lower.startsWith("care location:") ||
      lower.startsWith("care locality:") ||
      lower.startsWith("care coordinates:") ||
      lower.startsWith("guru service") ||
      lower.startsWith("distance") ||
      lower.startsWith("calculated distance") ||
      lower.startsWith("service radius") ||
      lower.startsWith("eligibility")
    ) {
      grouped.care.push(line);
      continue;
    }

    if (
      lower.startsWith("species:") ||
      lower.startsWith("breed:") ||
      lower.startsWith("age:") ||
      lower.startsWith("weight:") ||
      lower.startsWith("temperament:") ||
      lower.startsWith("medications:") ||
      lower.startsWith("pet notes:") ||
      lower.startsWith("emergency") ||
      lower.includes("special instructions")
    ) {
      grouped.pet.push(line);
      continue;
    }

    if (
      lower.includes("marketplace") ||
      lower.includes("tip") ||
      lower.includes("payout") ||
      lower.includes("fee") ||
      lower.includes("total") ||
      lower.includes("paid")
    ) {
      grouped.finance.push(line);
      continue;
    }

    grouped.internal.push(line);
  }

  return grouped;
}

async function findGuruByBookingSitterId(sitterId?: string | null, guruId?: string | null) {
  const ids = [cleanString(sitterId), cleanString(guruId)].filter(Boolean);

  for (const id of ids) {
    const attempts = [
      await supabaseAdmin.from("gurus").select("*").eq("id", id).maybeSingle(),
      await supabaseAdmin.from("gurus").select("*").eq("profile_id", id).maybeSingle(),
      await supabaseAdmin.from("gurus").select("*").eq("user_id", id).maybeSingle(),
    ];

    for (const attempt of attempts) {
      if (!attempt.error && attempt.data) {
        return attempt.data as GuruRow;
      }
    }
  }

  return null;
}

async function findLatestPetPhotoUrl(petId?: string | null) {
  const cleanPetId = cleanString(petId);
  if (!cleanPetId) return null;

  const { data, error } = await supabaseAdmin
    .from("pet_media")
    .select("pet_id, file_url, file_type, visibility, created_at")
    .eq("pet_id", cleanPetId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error || !data?.length) return null;

  const imageRow = data.find((row) =>
    String(row.file_type ?? "").toLowerCase().includes("image"),
  );

  return imageRow?.file_url ? String(imageRow.file_url) : null;
}

function DetailCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-slate-950">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{subtitle}</p>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 break-words text-sm font-bold leading-6 text-slate-900">
        {value}
      </div>
    </div>
  );
}

function MoneyCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "green" | "blue";
}) {
  const className =
    tone === "green"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "blue"
        ? "border-sky-200 bg-sky-50 text-sky-900"
        : "border-slate-200 bg-slate-50 text-slate-950";

  return (
    <div className={`rounded-2xl border p-4 ${className}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.16em] opacity-80">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-tight">{value}</p>
    </div>
  );
}

function NoteList({ items }: { items: string[] }) {
  if (!items.length) {
    return <p className="text-sm font-semibold text-slate-500">Nothing recorded.</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const [rawLabel, ...rest] = item.split(":");
        const hasLabel = rest.length > 0;
        const value = rest.join(":").trim();
        const url = item.match(/https?:\/\/\S+/i)?.[0] || "";

        return (
          <div
            key={item}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6"
          >
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="font-black text-emerald-700 underline-offset-4 hover:underline"
              >
                Open linked file
              </a>
            ) : hasLabel ? (
              <>
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
                  {rawLabel.trim()}
                </p>
                <p className="mt-1 font-bold text-slate-900">{value || "Not provided"}</p>
              </>
            ) : (
              <p className="font-semibold text-slate-800">{item}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ErrorState({ title, message }: { title: string; message: string }) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-rose-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-rose-700">
            Admin Booking Detail
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
            {title}
          </h1>
          <p className="mt-4 text-base font-semibold leading-7 text-slate-600">
            {message}
          </p>
          <div className="mt-8">
            <Link
              href="/admin/bookings"
              className="inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
            >
              Back to admin bookings
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}

export default async function AdminBookingDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const bookingId = cleanString(resolvedParams?.id);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  if (isInvalidBookingId(bookingId)) {
    return (
      <ErrorState
        title="Invalid booking link"
        message="This page was opened without a valid booking id."
      />
    );
  }

  const { data: booking, error: bookingError } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingError) {
    return <ErrorState title="Could not load booking" message={bookingError.message} />;
  }

  if (!booking) {
    return (
      <ErrorState
        title="Booking not found"
        message="The selected booking does not exist or may have been removed."
      />
    );
  }

  const bookingRow = booking as BookingRow;

  const [
    { data: customerProfile },
    guru,
    { data: pet },
    petPhotoFromMedia,
    visitData,
  ] = await Promise.all([
    bookingRow.customer_id
      ? supabaseAdmin
          .from("profiles")
          .select("*")
          .eq("id", bookingRow.customer_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    findGuruByBookingSitterId(bookingRow.sitter_id, bookingRow.guru_id),
    bookingRow.pet_id
      ? supabaseAdmin
          .from("pets")
          .select("*")
          .eq("id", bookingRow.pet_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    findLatestPetPhotoUrl(bookingRow.pet_id),
    getVisitData(bookingId),
  ]);

  const customer = (customerProfile ?? null) as ProfileRow | null;
  const petRow = (pet ?? null) as PetRow | null;
  const guruRow = guru as GuruRow | null;
  const noteGroups = groupBookingNotes(bookingRow.notes);
  const money = getMoneySummary(bookingRow);

  const petPhotoUrl = firstNonEmpty(
    bookingRow.pet_photo_url,
    petRow?.pet_photo_url,
    petRow?.photo_url,
    petRow?.avatar_url,
    petRow?.profile_photo_url,
    petRow?.image_url,
    petPhotoFromMedia,
    extractUrlFromNotes(bookingRow.notes, "Pet photo URL"),
  );

  const customerName = getCustomerName(bookingRow, customer);
  const customerPhone = getCustomerPhone(bookingRow, customer);
  const guruName = getGuruName(bookingRow, guruRow);
  const petName = getPetName(bookingRow, petRow);
  const petType = getPetType(bookingRow, petRow);
  const petBreed = getPetBreed(bookingRow, petRow);
  const serviceLabel = getServiceLabel(bookingRow);
  const bookingLocation = getLocationLabel(bookingRow, customer);
  const requestedDateLabel = getRequestedDateLabel(bookingRow);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                Admin Booking Detail
              </div>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                {petName} with {guruName}
              </h1>
              <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-600">
                Review booking details, pet information, payment totals, customer and Guru information, and admin status updates.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex rounded-full px-4 py-2 text-sm font-black ${statusClasses(
                  bookingRow.status,
                )}`}
              >
                {formatPlainStatus(bookingRow.status)}
              </span>
              <span
                className={`inline-flex rounded-full px-4 py-2 text-sm font-black ${paymentClasses(
                  bookingRow.payment_status,
                )}`}
              >
                {formatPlainStatus(bookingRow.payment_status || "unpaid")}
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/admin/bookings"
              className="inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
            >
              Back to bookings
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MoneyCard label="Customer Total" value={formatCurrency(money.customerTotal)} tone="green" />
          <MoneyCard label="Care Subtotal" value={formatCurrency(money.subtotal)} />
          <MoneyCard label="Platform Fee" value={formatCurrency(money.platformFee)} />
          <MoneyCard label="Guru Tip" value={formatCurrency(money.tip)} />
          <MoneyCard label="Guru Payout" value={formatCurrency(money.guruTotalPayout)} tone="blue" />
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <DetailCard
              title="Booking overview"
              subtitle="Core date, service, location, and payment status."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <DetailItem label="Booking ID" value={bookingRow.id} />
                <DetailItem label="Service" value={serviceLabel} />
                <DetailItem label="Requested date" value={requestedDateLabel} />
                <DetailItem label="Time window" value={firstNonEmpty(bookingRow.time_window) || "Flexible"} />
                <DetailItem label="Duration" value={firstNonEmpty(bookingRow.visit_length) || "Not set"} />
                <DetailItem label="Care location" value={bookingLocation} />
                <DetailItem label="Care ZIP" value={firstNonEmpty(bookingRow.care_zip_code) || "Not provided"} />
                <DetailItem label="Address" value={firstNonEmpty(bookingRow.address) || "Not provided"} />
                <DetailItem label="Created" value={formatDateTime(bookingRow.created_at)} />
                <DetailItem label="Updated" value={formatDateTime(bookingRow.updated_at)} />
              </div>
            </DetailCard>

            <DetailCard
              title="Pet details"
              subtitle="Scout’s saved profile details and booking-specific care notes."
            >
              <div className="flex flex-col gap-6 md:flex-row">
                <div className="shrink-0">
                  {petPhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={petPhotoUrl}
                      alt={`${petName} photo`}
                      className="h-40 w-40 rounded-[1.5rem] border border-slate-200 object-cover shadow-sm"
                    />
                  ) : (
                    <div className="flex h-40 w-40 items-center justify-center rounded-[1.5rem] border border-slate-200 bg-slate-100 text-6xl font-black text-slate-400 shadow-sm">
                      {petName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <p className="mt-3 max-w-40 text-center text-xs font-bold leading-5 text-slate-500">
                    {petPhotoUrl ? "Pet photo found" : "No pet photo found"}
                  </p>
                </div>

                <div className="grid flex-1 gap-4 md:grid-cols-2">
                  <DetailItem label="Pet name" value={petName} />
                  <DetailItem label="Pet type" value={petType} />
                  <DetailItem label="Breed" value={petBreed} />
                  <DetailItem label="Age" value={firstNonEmpty(petRow?.age) || "Not set"} />
                  <DetailItem label="Size" value={firstNonEmpty(petRow?.size, petRow?.weight) || "Not set"} />
                  <DetailItem label="Temperament" value={firstNonEmpty(petRow?.temperament) || "Not set"} />
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <DetailItem
                  label="Medical notes"
                  value={firstNonEmpty(petRow?.medical_notes, petRow?.medications) || "None provided"}
                />
                <DetailItem
                  label="Saved care instructions"
                  value={firstNonEmpty(petRow?.care_instructions, petRow?.notes) || "None provided"}
                />
              </div>
            </DetailCard>

            <DetailCard
              title="Customer and Guru"
              subtitle="Contact and assignment details for this booking."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <DetailItem label="Customer" value={customerName} />
                <DetailItem label="Customer email" value={bookingRow.customer_email || "Not provided"} />
                <DetailItem label="Customer phone" value={customerPhone} />
                <DetailItem label="Assigned Guru" value={guruName} />
                <DetailItem label="Guru slug" value={bookingRow.guru_slug || guruRow?.slug || "Not set"} />
                <DetailItem
                  label="Customer location"
                  value={
                    [customer?.city, customer?.state].filter(Boolean).join(", ") ||
                    "Not provided"
                  }
                />
              </div>
            </DetailCard>
          </div>

          <div className="space-y-6">
            <StatusUpdateForm
              bookingId={bookingRow.id}
              currentStatus={getFormStatusValue(bookingRow.status)}
            />

            <DetailCard
              title="Booking notes"
              subtitle="Organized from the booking request instead of one long notes block."
            >
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">Care details</h3>
                  <div className="mt-3"><NoteList items={noteGroups.care} /></div>
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">Pet and special instructions</h3>
                  <div className="mt-3"><NoteList items={noteGroups.pet} /></div>
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">Money notes</h3>
                  <div className="mt-3"><NoteList items={noteGroups.finance} /></div>
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">Media links</h3>
                  <div className="mt-3"><NoteList items={noteGroups.media} /></div>
                </div>
                {noteGroups.internal.length ? (
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">Internal notes</h3>
                    <div className="mt-3"><NoteList items={noteGroups.internal} /></div>
                  </div>
                ) : null}
              </div>
            </DetailCard>

            <DetailCard title="Quick summary">
              <div className="space-y-3 text-sm font-semibold text-slate-700">
                <p><span className="font-black text-slate-950">Pet:</span> {petName}</p>
                <p><span className="font-black text-slate-950">Service:</span> {serviceLabel}</p>
                <p><span className="font-black text-slate-950">Status:</span> {formatPlainStatus(bookingRow.status)}</p>
                <p><span className="font-black text-slate-950">Payment:</span> {formatPlainStatus(bookingRow.payment_status || "unpaid")}</p>
                <p><span className="font-black text-slate-950">Customer total:</span> {formatCurrency(money.customerTotal)}</p>
                <p><span className="font-black text-slate-950">Guru payout:</span> {formatCurrency(money.guruTotalPayout)}</p>
              </div>
            </DetailCard>
          </div>
        </div>

        <DetailCard
          title="PawReport timeline"
          subtitle="Review visit start and completion details, care notes, photos, and Guru updates for this booking."
        >
          <VisitUpdateTimeline
            session={visitData.session}
            updates={visitData.updates}
            viewer="admin"
          />
        </DetailCard>
      </div>
    </main>
  );
}