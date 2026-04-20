import Link from "next/link";
import { supabaseAdmin } from "@/utils/supabase/admin";
import StatusUpdateForm from "./StatusUpdateForm";

export const dynamic = "force-dynamic";

type MaybePromise<T> = T | Promise<T>;

type PageProps = {
  params: MaybePromise<{
    id: string;
  }>;
};

type BookingRow = {
  id: string;
  customer_id?: string | null;
  sitter_id?: string | null;
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
  booking_type?: string | null;
  notes?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  booking_date?: string | null;
  status?: string | null;
  payment_status?: string | null;
  total_amount?: number | null;
  price?: number | null;
  amount?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ProfileRow = {
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

type GuruRow = {
  id: string;
  profile_id?: string | null;
  user_id?: string | null;
  display_name?: string | null;
  full_name?: string | null;
  public_name?: string | null;
  business_name?: string | null;
  slug?: string | null;
};

type PetRow = {
  id: string;
  name?: string | null;
  species?: string | null;
  pet_type?: string | null;
  breed?: string | null;
  age?: string | number | null;
  size?: string | null;
  temperament?: string | null;
  medical_notes?: string | null;
  care_instructions?: string | null;
};

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function firstNonEmpty(...values: unknown[]) {
  for (const value of values) {
    const cleaned = cleanString(value);
    if (cleaned) return cleaned;
  }
  return "";
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

function formatCurrency(value?: number | null) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number.isFinite(amount) ? amount : 0);
}

function normalizeStatus(status?: string | null) {
  if (!status) return "Pending";

  const clean = status.toLowerCase();

  if (clean.includes("confirm")) return "Confirmed";
  if (clean.includes("active") || clean.includes("progress")) return "Active";
  if (clean.includes("complete")) return "Completed";
  if (clean.includes("cancel")) return "Canceled";
  if (clean.includes("pending")) return "Pending";

  return status;
}

function normalizePayment(payment?: string | null) {
  if (!payment) return "unpaid";
  return payment.toLowerCase();
}

function statusClasses(status?: string | null) {
  const normalized = normalizeStatus(status);

  if (normalized === "Confirmed") {
    return "border border-emerald-200 bg-emerald-100 text-emerald-900";
  }

  if (normalized === "Active") {
    return "border border-sky-200 bg-sky-100 text-sky-900";
  }

  if (normalized === "Completed") {
    return "border border-indigo-200 bg-indigo-100 text-indigo-900";
  }

  if (normalized === "Canceled") {
    return "border border-rose-200 bg-rose-100 text-rose-900";
  }

  return "border border-amber-200 bg-amber-100 text-amber-900";
}

function paymentClasses(payment?: string | null) {
  const normalized = normalizePayment(payment);

  if (normalized === "paid") {
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
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ")
    ) || "Customer"
  );
}

function getCustomerPhone(booking: BookingRow, profile: ProfileRow | null) {
  return (
    firstNonEmpty(
      booking.customer_phone,
      profile?.phone,
      profile?.phone_number,
      profile?.mobile
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
      guru?.business_name
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
    firstNonEmpty(booking.service, booking.service_type, booking.booking_type) ||
    "General care"
  );
}

function getLocationLabel(booking: BookingRow, profile: ProfileRow | null) {
  const direct = [booking.city, booking.state].filter(Boolean).join(", ");
  if (direct) return direct;

  const profileLocation = [profile?.city, profile?.state].filter(Boolean).join(", ");
  if (profileLocation) return profileLocation;

  return "Not provided";
}

function getBookingAmount(booking: BookingRow) {
  const amount = booking.total_amount ?? booking.price ?? booking.amount ?? 0;
  return formatCurrency(amount);
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

async function findGuruByBookingSitterId(sitterId?: string | null) {
  const cleanId = cleanString(sitterId);
  if (!cleanId) return null;

  const attempts = [
    await supabaseAdmin.from("gurus").select("*").eq("id", cleanId).maybeSingle(),
    await supabaseAdmin.from("gurus").select("*").eq("profile_id", cleanId).maybeSingle(),
    await supabaseAdmin.from("gurus").select("*").eq("user_id", cleanId).maybeSingle(),
  ];

  for (const attempt of attempts) {
    if (!attempt.error && attempt.data) {
      return attempt.data as GuruRow;
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
    String(row.file_type ?? "").toLowerCase().includes("image")
  );

  return imageRow?.file_url ? String(imageRow.file_url) : null;
}

function DetailCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black tracking-tight text-slate-950">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-sm font-bold text-slate-900">{value}</div>
    </div>
  );
}

export default async function AdminBookingDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const bookingId = cleanString(resolvedParams?.id);

  if (isInvalidBookingId(bookingId)) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl border border-rose-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-rose-700">
              Admin Booking Detail
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
              Invalid booking link
            </h1>
            <p className="mt-4 text-base font-semibold leading-7 text-slate-600">
              This page was opened without a valid booking id.
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

  const { data: booking, error: bookingError } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingError) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl border border-rose-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-rose-700">
              Admin Booking Detail
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
              Could not load booking
            </h1>
            <p className="mt-4 text-base font-semibold leading-7 text-slate-600">
              {bookingError.message}
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

  if (!booking) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-700">
              Admin Booking Detail
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
              Booking not found
            </h1>
            <p className="mt-4 text-base font-semibold leading-7 text-slate-600">
              The selected booking does not exist or may have been removed.
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

  const bookingRow = booking as BookingRow;

  const [{ data: customerProfile }, guru, { data: pet }, petPhotoFromMedia] =
    await Promise.all([
      bookingRow.customer_id
        ? supabaseAdmin
            .from("profiles")
            .select("*")
            .eq("id", bookingRow.customer_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      findGuruByBookingSitterId(bookingRow.sitter_id),
      bookingRow.pet_id
        ? supabaseAdmin.from("pets").select("*").eq("id", bookingRow.pet_id).maybeSingle()
        : Promise.resolve({ data: null }),
      findLatestPetPhotoUrl(bookingRow.pet_id),
    ]);

  const customer = (customerProfile ?? null) as ProfileRow | null;
  const petRow = (pet ?? null) as PetRow | null;
  const guruRow = guru as GuruRow | null;

  const petPhotoUrl = firstNonEmpty(bookingRow.pet_photo_url, petPhotoFromMedia);
  const customerName = getCustomerName(bookingRow, customer);
  const customerPhone = getCustomerPhone(bookingRow, customer);
  const guruName = getGuruName(bookingRow, guruRow);
  const petName = getPetName(bookingRow, petRow);
  const petType = getPetType(bookingRow, petRow);
  const petBreed = getPetBreed(bookingRow, petRow);
  const serviceLabel = getServiceLabel(bookingRow);
  const bookingLocation = getLocationLabel(bookingRow, customer);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">
                Admin Booking Detail
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
                {petName} with {guruName}
              </h1>
              <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-600">
                Review the full booking record, pet information, customer details,
                payment state, and update the booking status from one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex rounded-full px-4 py-2 text-sm font-black ${statusClasses(
                  bookingRow.status
                )}`}
              >
                {normalizeStatus(bookingRow.status)}
              </span>
              <span
                className={`inline-flex rounded-full px-4 py-2 text-sm font-black ${paymentClasses(
                  bookingRow.payment_status
                )}`}
              >
                {bookingRow.payment_status || "unpaid"}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/admin/bookings"
              className="inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
            >
              Back to bookings
            </Link>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <DetailCard title="Booking overview">
              <div className="grid gap-4 md:grid-cols-2">
                <DetailItem label="Booking ID" value={bookingRow.id} />
                <DetailItem label="Service" value={serviceLabel} />
                <DetailItem label="Requested date" value={formatDate(bookingRow.booking_date)} />
                <DetailItem label="Booking total" value={getBookingAmount(bookingRow)} />
                <DetailItem label="Created" value={formatDateTime(bookingRow.created_at)} />
                <DetailItem label="Updated" value={formatDateTime(bookingRow.updated_at)} />
                <DetailItem label="Location" value={bookingLocation} />
                <DetailItem label="Address" value={bookingRow.address || "Not provided"} />
              </div>
            </DetailCard>

            <DetailCard title="Pet details">
              <div className="flex flex-col gap-6 md:flex-row">
                <div className="shrink-0">
                  {petPhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={petPhotoUrl}
                      alt={`${petName} photo`}
                      className="h-36 w-36 rounded-3xl border border-slate-200 object-cover shadow-sm"
                    />
                  ) : (
                    <div className="flex h-36 w-36 items-center justify-center rounded-3xl border border-slate-200 bg-slate-100 text-5xl font-black text-slate-400 shadow-sm">
                      {petName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="grid flex-1 gap-4 md:grid-cols-2">
                  <DetailItem label="Pet name" value={petName} />
                  <DetailItem label="Pet type" value={petType} />
                  <DetailItem label="Breed" value={petBreed} />
                  <DetailItem
                    label="Age"
                    value={firstNonEmpty(petRow?.age) || "Not set"}
                  />
                  <DetailItem
                    label="Size"
                    value={firstNonEmpty(petRow?.size) || "Not set"}
                  />
                  <DetailItem
                    label="Temperament"
                    value={firstNonEmpty(petRow?.temperament) || "Not set"}
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <DetailItem
                  label="Medical notes"
                  value={firstNonEmpty(petRow?.medical_notes) || "None provided"}
                />
                <DetailItem
                  label="Care instructions"
                  value={
                    firstNonEmpty(petRow?.care_instructions, bookingRow.notes) || "None provided"
                  }
                />
              </div>
            </DetailCard>

            <DetailCard title="Customer and guru">
              <div className="grid gap-4 md:grid-cols-2">
                <DetailItem label="Customer" value={customerName} />
                <DetailItem
                  label="Customer email"
                  value={bookingRow.customer_email || "Not provided"}
                />
                <DetailItem label="Customer phone" value={customerPhone} />
                <DetailItem label="Assigned guru" value={guruName} />
                <DetailItem
                  label="Guru slug"
                  value={bookingRow.guru_slug || guruRow?.slug || "Not set"}
                />
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

            <DetailCard title="Booking notes">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-7 text-slate-700">
                {bookingRow.notes?.trim() || "No notes provided for this booking."}
              </div>
            </DetailCard>

            <DetailCard title="Quick summary">
              <div className="space-y-3 text-sm font-semibold text-slate-700">
                <p>
                  <span className="font-black text-slate-950">Pet:</span> {petName}
                </p>
                <p>
                  <span className="font-black text-slate-950">Service:</span> {serviceLabel}
                </p>
                <p>
                  <span className="font-black text-slate-950">Status:</span> {normalizeStatus(bookingRow.status)}
                </p>
                <p>
                  <span className="font-black text-slate-950">Payment:</span> {bookingRow.payment_status || "unpaid"}
                </p>
                <p>
                  <span className="font-black text-slate-950">Amount:</span> {getBookingAmount(bookingRow)}
                </p>
              </div>
            </DetailCard>
          </div>
        </div>
      </div>
    </main>
  );
}