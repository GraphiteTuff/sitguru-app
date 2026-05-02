import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

type GuruRow = {
  id?: string | number | null;
  user_id?: string | null;
  slug?: string | null;
  display_name?: string | null;
  full_name?: string | null;
  email?: string | null;
};

type BookingRow = {
  id: string;
  pet_id?: string | null;
  pet_photo_url?: string | null;
  pet_name?: string | null;
  service?: string | null;
  service_type?: string | null;
  booking_type?: string | null;
  status?: string | null;
  payment_status?: string | null;
  booking_date?: string | null;
  start_time?: string | null;
  created_at?: string | null;
  customer_id?: string | null;
  pet_owner_id?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  notes?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pet_type?: string | null;
  breed?: string | null;
  price?: number | null;
  total_amount?: number | null;
  sitter_id?: string | number | null;
  guru_id?: string | number | null;
};

type PetRow = {
  id: string;
  name?: string | null;
  breed?: string | null;
  species?: string | null;
  size?: string | null;
  owner_id?: string | null;
  owner_profile_id?: string | null;
};

type PetMediaRow = {
  pet_id?: string | null;
  file_url?: string | null;
  file_type?: string | null;
  visibility?: string | null;
  created_at?: string | null;
};

type EnrichedBooking = BookingRow & {
  pet_avatar_url?: string | null;
  resolved_pet_type?: string | null;
  resolved_breed?: string | null;
  resolved_size?: string | null;
};

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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
  if (value == null || Number.isNaN(value)) return "$0.00";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function normalizeStatus(status?: string | null) {
  if (!status) return "Pending";

  const clean = status.toLowerCase();

  if (clean.includes("confirm")) return "Confirmed";
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
    return "border border-emerald-400/20 bg-emerald-400/15 text-emerald-200";
  }

  if (normalized === "Completed") {
    return "border border-sky-400/20 bg-sky-400/15 text-sky-200";
  }

  if (normalized === "Pending") {
    return "border border-amber-400/20 bg-amber-400/15 text-amber-200";
  }

  if (normalized === "Canceled") {
    return "border border-red-400/20 bg-red-400/15 text-red-200";
  }

  return "border border-slate-600 bg-slate-800/80 text-slate-200";
}

function paymentClasses(payment?: string | null) {
  const normalized = normalizePayment(payment);

  if (normalized === "paid") {
    return "border border-emerald-400/20 bg-emerald-400/15 text-emerald-200";
  }

  if (normalized.includes("checkout")) {
    return "border border-sky-400/20 bg-sky-400/15 text-sky-200";
  }

  if (normalized === "expired") {
    return "border border-red-400/20 bg-red-400/15 text-red-200";
  }

  return "border border-amber-400/20 bg-amber-400/15 text-amber-200";
}

function sectionKicker(text: string) {
  return (
    <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
      {text}
    </div>
  );
}

function normalizeName(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

function getBookingServiceDate(booking: BookingRow) {
  return booking.booking_date || booking.start_time || booking.created_at || null;
}

function getGuruLookupIds(guru: GuruRow) {
  return Array.from(
    new Set(
      [
        guru.id != null ? String(guru.id) : "",
        guru.user_id || "",
        guru.slug || "",
      ].filter(Boolean)
    )
  );
}

async function getGuruProfile(userId: string, email?: string | null) {
  const byUserId = await supabaseAdmin
    .from("gurus")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!byUserId.error && byUserId.data) {
    return byUserId.data as GuruRow;
  }

  if (email) {
    const byEmail = await supabaseAdmin
      .from("gurus")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (!byEmail.error && byEmail.data) {
      return byEmail.data as GuruRow;
    }
  }

  return null;
}

async function getGuruBookings(guru: GuruRow) {
  const guruIds = getGuruLookupIds(guru);

  if (guruIds.length === 0) {
    return [];
  }

  const bySitterId = await supabaseAdmin
    .from("bookings")
    .select("*")
    .in("sitter_id", guruIds)
    .order("created_at", { ascending: false });

  if (!bySitterId.error && bySitterId.data) {
    return bySitterId.data as BookingRow[];
  }

  const byGuruId = await supabaseAdmin
    .from("bookings")
    .select("*")
    .in("guru_id", guruIds)
    .order("created_at", { ascending: false });

  if (!byGuruId.error && byGuruId.data) {
    return byGuruId.data as BookingRow[];
  }

  const byBookingDateSitter = await supabaseAdmin
    .from("bookings")
    .select("*")
    .in("sitter_id", guruIds)
    .order("booking_date", { ascending: false });

  if (!byBookingDateSitter.error && byBookingDateSitter.data) {
    return byBookingDateSitter.data as BookingRow[];
  }

  const byBookingDateGuru = await supabaseAdmin
    .from("bookings")
    .select("*")
    .in("guru_id", guruIds)
    .order("booking_date", { ascending: false });

  if (!byBookingDateGuru.error && byBookingDateGuru.data) {
    return byBookingDateGuru.data as BookingRow[];
  }

  console.error(
    "Guru bookings fetch error:",
    bySitterId.error?.message ||
      byGuruId.error?.message ||
      byBookingDateSitter.error?.message ||
      byBookingDateGuru.error?.message ||
      "Unknown error"
  );

  return [];
}

async function enrichBookingsWithPetMedia(
  bookings: BookingRow[]
): Promise<EnrichedBooking[]> {
  if (bookings.length === 0) {
    return [];
  }

  const directPetIds = Array.from(
    new Set(
      bookings
        .map((booking) => String(booking.pet_id || "").trim())
        .filter(Boolean)
    )
  );

  const customerIds = Array.from(
    new Set(
      bookings
        .flatMap((booking) => [
          String(booking.customer_id || "").trim(),
          String(booking.pet_owner_id || "").trim(),
        ])
        .filter(Boolean)
    )
  );

  const petsById = new Map<string, PetRow>();
  const ownerPets: PetRow[] = [];

  if (directPetIds.length > 0) {
    const directPets = await supabaseAdmin
      .from("pets")
      .select("*")
      .in("id", directPetIds);

    if (!directPets.error && directPets.data) {
      for (const pet of directPets.data as PetRow[]) {
        petsById.set(String(pet.id), pet);
      }
    }
  }

  if (customerIds.length > 0) {
    const [ownerIdPets, ownerProfilePets] = await Promise.all([
      supabaseAdmin.from("pets").select("*").in("owner_id", customerIds),
      supabaseAdmin.from("pets").select("*").in("owner_profile_id", customerIds),
    ]);

    for (const result of [ownerIdPets, ownerProfilePets]) {
      if (!result.error && result.data) {
        for (const pet of result.data as PetRow[]) {
          if (!petsById.has(String(pet.id))) {
            petsById.set(String(pet.id), pet);
          }

          ownerPets.push(pet);
        }
      }
    }
  }

  const allPetIds = Array.from(petsById.keys());
  const petMediaByPetId = new Map<string, PetMediaRow>();

  if (allPetIds.length > 0) {
    const mediaResult = await supabaseAdmin
      .from("pet_media")
      .select("*")
      .in("pet_id", allPetIds)
      .order("created_at", { ascending: false });

    if (!mediaResult.error && mediaResult.data) {
      for (const row of mediaResult.data as PetMediaRow[]) {
        const petId = String(row.pet_id || "").trim();
        const isImage = String(row.file_type || "")
          .toLowerCase()
          .includes("image");

        if (!petId || !isImage || petMediaByPetId.has(petId)) {
          continue;
        }

        petMediaByPetId.set(petId, row);
      }
    }
  }

  return bookings.map((booking) => {
    let pet: PetRow | null = null;

    const bookingPetId = String(booking.pet_id || "").trim();

    if (bookingPetId && petsById.has(bookingPetId)) {
      pet = petsById.get(bookingPetId) || null;
    }

    if (!pet && (booking.customer_id || booking.pet_owner_id) && booking.pet_name) {
      const customerIdsToCheck = [
        String(booking.customer_id || "").trim(),
        String(booking.pet_owner_id || "").trim(),
      ].filter(Boolean);

      const petName = normalizeName(booking.pet_name);

      pet =
        ownerPets.find(
          (row) =>
            customerIdsToCheck.some(
              (customerId) =>
                String(row.owner_id || "") === customerId ||
                String(row.owner_profile_id || "") === customerId
            ) && normalizeName(row.name) === petName
        ) || null;
    }

    const petImageUrl =
      booking.pet_photo_url ||
      (pet?.id ? petMediaByPetId.get(String(pet.id))?.file_url : null) ||
      null;

    return {
      ...booking,
      pet_avatar_url: petImageUrl,
      resolved_pet_type: pet?.species || booking.pet_type || null,
      resolved_breed: pet?.breed || booking.breed || null,
      resolved_size: pet?.size || null,
    };
  });
}

function PetAvatar({
  imageUrl,
  petName,
}: {
  imageUrl?: string | null;
  petName?: string | null;
}) {
  const initial = (petName?.trim()?.charAt(0) || "P").toUpperCase();

  if (imageUrl) {
    return (
      <div className="h-16 w-16 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={petName ? `${petName} photo` : "Pet photo"}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xl font-black text-white shadow-sm">
      {initial}
    </div>
  );
}

export default async function GuruBookingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/guru/login");
  }

  const guru = await getGuruProfile(user.id, user.email);

  if (!guru?.id) {
    redirect("/guru/login");
  }

  const bookings = await getGuruBookings(guru);
  const enrichedBookings = await enrichBookingsWithPetMedia(bookings);

  const pendingBookings = enrichedBookings.filter(
    (booking) => normalizeStatus(booking.status) === "Pending"
  );

  const confirmedBookings = enrichedBookings.filter(
    (booking) => normalizeStatus(booking.status) === "Confirmed"
  );

  const completedBookings = enrichedBookings.filter(
    (booking) => normalizeStatus(booking.status) === "Completed"
  );

  const guruName =
    guru.display_name || guru.full_name || "Your Guru Account";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.10),_transparent_26%),linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-sm lg:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              {sectionKicker("Guru Dashboard")}
              <h1 className="mt-3 text-5xl font-black tracking-tight text-white sm:text-6xl">
                Incoming bookings
              </h1>
              <p className="mt-4 max-w-3xl text-base font-medium leading-8 text-white/80">
                Review pending requests, confirmed care, completed services, and
                payment activity for your own bookings only.
              </p>
              <p className="mt-3 text-sm font-bold text-emerald-200/90">
                Viewing bookings for {guruName}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/guru/dashboard"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-base font-black text-white transition hover:bg-white/10"
              >
                Back to Guru dashboard
              </Link>

              <Link
                href="/guru/bookings"
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-6 py-3 text-base font-black text-slate-950 transition hover:bg-emerald-400"
              >
                Refresh bookings
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-6 shadow-sm">
            <div className="text-sm font-black uppercase tracking-wide text-amber-200">
              Pending
            </div>
            <div className="mt-2 text-4xl font-black text-white">
              {pendingBookings.length}
            </div>
            <div className="mt-2 text-sm font-bold text-amber-100/90">
              New requests waiting on review
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-6 shadow-sm">
            <div className="text-sm font-black uppercase tracking-wide text-emerald-200">
              Confirmed
            </div>
            <div className="mt-2 text-4xl font-black text-white">
              {confirmedBookings.length}
            </div>
            <div className="mt-2 text-sm font-bold text-emerald-100/90">
              Upcoming confirmed care
            </div>
          </div>

          <div className="rounded-3xl border border-sky-400/20 bg-sky-400/10 p-6 shadow-sm">
            <div className="text-sm font-black uppercase tracking-wide text-sky-200">
              Completed
            </div>
            <div className="mt-2 text-4xl font-black text-white">
              {completedBookings.length}
            </div>
            <div className="mt-2 text-sm font-bold text-sky-100/90">
              Finished service activity
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/5 shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur-sm">
          <div className="border-b border-white/10 px-6 py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                {sectionKicker("Bookings")}
                <h2 className="mt-3 text-4xl font-black tracking-tight text-white">
                  Your booking activity
                </h2>
                <p className="mt-2 text-base font-semibold text-white/75">
                  Only bookings assigned to your guru account appear here.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-3 text-sm font-black text-white">
                {enrichedBookings.length} total booking
                {enrichedBookings.length === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          {enrichedBookings.length === 0 ? (
            <div className="p-6">
              <div className="rounded-[28px] border border-white/10 bg-slate-950/40 p-10 text-center">
                <div className="text-3xl font-black text-white">
                  No bookings yet
                </div>
                <p className="mt-3 text-base font-medium text-white/70">
                  New customer requests assigned to you will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 p-6">
              {enrichedBookings.map((booking) => (
                <article
                  key={booking.id}
                  className="rounded-[28px] border border-white/10 bg-slate-950/35 p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <PetAvatar
                          imageUrl={booking.pet_avatar_url}
                          petName={booking.pet_name}
                        />

                        <div>
                          <div className="text-2xl font-black text-white">
                            {booking.pet_name?.trim() || "Pet booking"}
                          </div>
                          <div className="mt-1 text-base font-bold text-white/75">
                            {booking.service?.trim() ||
                              booking.service_type?.trim() ||
                              booking.booking_type?.trim() ||
                              "Service not set"}
                          </div>
                          <div className="mt-2 text-sm font-semibold text-slate-300">
                            {booking.resolved_pet_type || "Pet profile"}
                            {booking.resolved_breed
                              ? ` • ${booking.resolved_breed}`
                              : ""}
                            {booking.resolved_size
                              ? ` • ${booking.resolved_size}`
                              : ""}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <div>
                          <div className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
                            Customer
                          </div>
                          <div className="mt-1 text-sm font-bold text-white">
                            {booking.customer_name || "Customer"}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
                            Service date
                          </div>
                          <div className="mt-1 text-sm font-bold text-white">
                            {formatDate(getBookingServiceDate(booking))}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
                            Value
                          </div>
                          <div className="mt-1 text-sm font-bold text-white">
                            {formatCurrency(booking.total_amount ?? booking.price)}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
                            Created
                          </div>
                          <div className="mt-1 text-sm font-bold text-white">
                            {formatDateTime(booking.created_at)}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
                            Email
                          </div>
                          <div className="mt-1 text-sm font-bold text-white">
                            {booking.customer_email || "Not set"}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
                            Phone
                          </div>
                          <div className="mt-1 text-sm font-bold text-white">
                            {booking.customer_phone || "Not set"}
                          </div>
                        </div>
                      </div>

                      {(booking.address?.trim() ||
                        booking.city?.trim() ||
                        booking.state?.trim()) && (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
                            Location
                          </div>
                          <div className="mt-2 text-sm font-medium leading-7 text-white/85">
                            {[
                              booking.address?.trim(),
                              [booking.city?.trim(), booking.state?.trim()]
                                .filter(Boolean)
                                .join(", "),
                            ]
                              .filter(Boolean)
                              .join(" • ")}
                          </div>
                        </div>
                      )}

                      {booking.notes?.trim() ? (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
                            Notes
                          </div>
                          <div className="mt-2 text-sm font-medium leading-7 text-white/85">
                            {booking.notes}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-3 lg:justify-end">
                      <span
                        className={`inline-flex rounded-full px-4 py-1.5 text-sm font-black ${statusClasses(
                          booking.status
                        )}`}
                      >
                        {normalizeStatus(booking.status)}
                      </span>

                      <span
                        className={`inline-flex rounded-full px-4 py-1.5 text-sm font-black ${paymentClasses(
                          booking.payment_status
                        )}`}
                      >
                        {booking.payment_status || "unpaid"}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
