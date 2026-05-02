import Link from "next/link";
import { supabaseAdmin } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    filter?: string;
  }>;
};

type BookingRow = {
  id: string;
  pet_id?: string | null;
  pet_name?: string | null;
  pet_photo_url?: string | null;
  status?: string | null;
  booking_date?: string | null;
  created_at?: string | null;
  service?: string | null;
  service_type?: string | null;
  booking_type?: string | null;
  payment_status?: string | null;
  price?: number | null;
  customer_id?: string | null;
  sitter_id?: string | null;
};

type ProfileRow = {
  id: string;
  full_name?: string | null;
};

type GuruRow = {
  id: string;
  display_name?: string | null;
};

type PetMediaRow = {
  pet_id?: string | null;
  file_url?: string | null;
  file_type?: string | null;
  visibility?: string | null;
  created_at?: string | null;
};

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

function normalizeStatus(status?: string | null) {
  if (!status) return "Pending";
  const clean = status.toLowerCase();

  if (clean.includes("confirm")) return "Confirmed";
  if (clean.includes("pending")) return "Pending";
  if (clean.includes("cancel")) return "Canceled";
  if (clean.includes("complete")) return "Completed";

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

  if (normalized === "Pending") {
    return "border border-amber-200 bg-amber-100 text-amber-900";
  }

  if (normalized === "Canceled") {
    return "border border-red-200 bg-red-100 text-red-900";
  }

  if (normalized === "Completed") {
    return "border border-sky-200 bg-sky-100 text-sky-900";
  }

  return "border border-slate-200 bg-slate-100 text-slate-900";
}

function paymentClasses(status?: string | null) {
  const normalized = normalizePayment(status);

  if (normalized === "paid") {
    return "border border-emerald-200 bg-emerald-100 text-emerald-900";
  }

  if (normalized.includes("checkout")) {
    return "border border-sky-200 bg-sky-100 text-sky-900";
  }

  return "border border-amber-200 bg-amber-100 text-amber-900";
}

function filterButtonClasses(active: boolean) {
  return active
    ? "rounded-2xl bg-slate-950 px-5 py-3 text-base font-black text-white"
    : "rounded-2xl border border-slate-300 bg-white px-5 py-3 text-base font-black text-slate-950";
}

function getCustomerLabel(
  booking: BookingRow,
  profilesMap: Map<string, ProfileRow>
) {
  if (!booking.customer_id) return "Customer";
  return profilesMap.get(booking.customer_id)?.full_name || "Customer";
}

function getGuruLabel(booking: BookingRow, gurusMap: Map<string, GuruRow>) {
  if (!booking.sitter_id) return "Unassigned";
  return gurusMap.get(booking.sitter_id)?.display_name || "Guru";
}

function getBookingTitle(booking: BookingRow, gurusMap: Map<string, GuruRow>) {
  const pet = booking.pet_name || "Pet";
  const guru = getGuruLabel(booking, gurusMap);

  return guru === "Unassigned" ? `${pet} booking` : `${pet} with ${guru}`;
}

function getServiceLabel(booking: BookingRow) {
  return booking.service || booking.service_type || booking.booking_type || "Not set";
}

function getPetInitial(name?: string | null) {
  const value = (name || "P").trim();
  return value.charAt(0).toUpperCase() || "P";
}

function PetThumb({
  imageUrl,
  petName,
}: {
  imageUrl?: string | null;
  petName?: string | null;
}) {
  if (imageUrl) {
    return (
      <div className="h-20 w-20 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm sm:h-22 sm:w-22">
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
    <div className="flex h-20 w-20 items-center justify-center rounded-[22px] border border-slate-200 bg-slate-100 text-2xl font-black text-slate-600 shadow-sm sm:h-22 sm:w-22">
      {getPetInitial(petName)}
    </div>
  );
}

async function getBookings(): Promise<BookingRow[]> {
  const { data } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (data ?? []) as BookingRow[];
}

async function getProfilesByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name")
    .in("id", ids);

  return (data ?? []) as ProfileRow[];
}

async function getGurusByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const { data } = await supabaseAdmin
    .from("gurus")
    .select("id, display_name")
    .in("id", ids);

  return (data ?? []) as GuruRow[];
}

async function getPetMediaByPetIds(ids: string[]) {
  if (ids.length === 0) return [];
  const { data } = await supabaseAdmin
    .from("pet_media")
    .select("pet_id, file_url, file_type, visibility, created_at")
    .in("pet_id", ids)
    .order("created_at", { ascending: false });

  return (data ?? []) as PetMediaRow[];
}

export default async function AdminBookingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const activeFilter = params?.filter || "all";

  const bookings = await getBookings();

  const customerIds = Array.from(
    new Set(bookings.map((b) => b.customer_id).filter(Boolean) as string[])
  );

  const guruIds = Array.from(
    new Set(bookings.map((b) => b.sitter_id).filter(Boolean) as string[])
  );

  const petIds = Array.from(
    new Set(bookings.map((b) => b.pet_id).filter(Boolean) as string[])
  );

  const [profiles, gurus, petMedia] = await Promise.all([
    getProfilesByIds(customerIds),
    getGurusByIds(guruIds),
    getPetMediaByPetIds(petIds),
  ]);

  const profilesMap = new Map(profiles.map((p) => [p.id, p]));
  const gurusMap = new Map(gurus.map((g) => [g.id, g]));

  const petImageMap = new Map<string, string>();

  for (const item of petMedia) {
    const petId = item.pet_id || "";
    if (!petId || petImageMap.has(petId)) continue;

    const fileType = String(item.file_type || "").toLowerCase();
    if (!fileType.includes("image")) continue;
    if (!item.file_url) continue;

    petImageMap.set(petId, item.file_url);
  }

  const filtered = bookings.filter((b) => {
    if (activeFilter === "confirmed") {
      return normalizeStatus(b.status) === "Confirmed";
    }

    if (activeFilter === "pending") {
      return normalizeStatus(b.status) === "Pending";
    }

    if (activeFilter === "paid") {
      return normalizePayment(b.payment_status) === "paid";
    }

    return true;
  });

  return (
    <main className="min-h-screen bg-[#020617] p-6">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-white shadow-xl">
        <div className="border-b border-slate-200 p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-[52px] font-black leading-none text-slate-950">
                Recent Bookings
              </div>

              <div className="mt-4 text-2xl font-black text-slate-950">
                Latest 100 bookings from your system
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/bookings"
                className={filterButtonClasses(activeFilter === "all")}
              >
                All
              </Link>
              <Link
                href="/admin/bookings?filter=confirmed"
                className={filterButtonClasses(activeFilter === "confirmed")}
              >
                Confirmed
              </Link>
              <Link
                href="/admin/bookings?filter=pending"
                className={filterButtonClasses(activeFilter === "pending")}
              >
                Pending
              </Link>
              <Link
                href="/admin/bookings?filter=paid"
                className={filterButtonClasses(activeFilter === "paid")}
              >
                Paid
              </Link>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1220px]">
            <thead className="bg-slate-100">
              <tr>
                {[
                  "Booking",
                  "Pet",
                  "Customer",
                  "Guru",
                  "Service",
                  "Date",
                  "Status",
                  "Payment",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-4 text-left text-sm font-black text-slate-950"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.map((b) => {
                const petImageUrl =
                  b.pet_photo_url ||
                  (b.pet_id ? petImageMap.get(b.pet_id) || null : null);

                return (
                  <tr
                    key={b.id}
                    className="min-h-[112px] border-t border-slate-200 align-middle"
                  >
                    <td className="px-6 py-5 font-black text-blue-700">
                      <Link
                        href={`/admin/bookings/${b.id}`}
                        className="transition hover:text-blue-800"
                      >
                        {getBookingTitle(b, gurusMap)}
                      </Link>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <PetThumb imageUrl={petImageUrl} petName={b.pet_name} />

                        <div className="min-w-0">
                          <div className="truncate text-base font-black text-slate-950">
                            {b.pet_name || "Not set"}
                          </div>
                          <div className="mt-1 text-xs font-semibold text-slate-500">
                            {b.pet_id ? `Pet ID: ${b.pet_id}` : "No pet id"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5 font-bold text-slate-950">
                      {getCustomerLabel(b, profilesMap)}
                    </td>

                    <td className="px-6 py-5 font-bold text-slate-950">
                      {getGuruLabel(b, gurusMap)}
                    </td>

                    <td className="px-6 py-5 font-bold text-slate-950">
                      {getServiceLabel(b)}
                    </td>

                    <td className="px-6 py-5 font-bold text-slate-950">
                      {formatDate(b.booking_date)}
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex rounded-full px-4 py-1 text-sm font-black ${statusClasses(
                          b.status
                        )}`}
                      >
                        {normalizeStatus(b.status)}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex rounded-full px-4 py-1 text-sm font-black ${paymentClasses(
                          b.payment_status
                        )}`}
                      >
                        {b.payment_status || "unpaid"}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-10 text-center text-base font-bold text-slate-500"
                  >
                    No bookings matched this filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
