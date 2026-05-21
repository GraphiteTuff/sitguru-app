import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  Mail,
  MapPin,
  MessageSquare,
  PawPrint,
  UserRound,
} from "lucide-react";

import { supabaseAdmin } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type AnyRow = Record<string, unknown>;

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function getText(row: AnyRow | null | undefined, keys: string[], fallback = "") {
  if (!row) return fallback;

  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }

  return fallback;
}

function getAmount(row: AnyRow | null | undefined, keys: string[]) {
  if (!row) return 0;

  for (const key of keys) {
    const value = asNumber(row[key]);
    if (value > 0) return value;
  }

  return 0;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatDate(value: unknown) {
  const text = asString(value);
  if (!text) return "—";

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDisplayName(row: AnyRow | null | undefined) {
  if (!row) return "Customer";

  const firstName = getText(row, ["first_name", "firstName"]);
  const lastName = getText(row, ["last_name", "lastName"]);

  if (firstName || lastName) return `${firstName} ${lastName}`.trim();

  return getText(
    row,
    [
      "full_name",
      "display_name",
      "name",
      "customer_name",
      "pet_parent_name",
      "owner_name",
      "email",
    ],
    "Customer",
  );
}

function getEmail(row: AnyRow | null | undefined) {
  return getText(row, ["email", "customer_email", "pet_parent_email"], "No email found");
}

function getLocation(row: AnyRow | null | undefined) {
  const city = getText(row, ["city", "customer_city", "location_city"]);
  const state = getText(row, ["state", "state_code", "customer_state", "location_state"]);
  const zip = getText(row, ["zip", "zipcode", "zip_code", "postal_code"]);

  const cityState = [city, state].filter(Boolean).join(", ");
  const location = [cityState, zip].filter(Boolean).join(" ");

  return location || "Unknown";
}

function getInitials(name: string) {
  const parts = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return "C";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();

  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}

function getBookingDate(row: AnyRow) {
  return getText(row, ["booking_date", "start_time", "start_date", "created_at", "updated_at"]);
}

function getBookingStatus(row: AnyRow) {
  return getText(row, ["status", "booking_status", "payment_status"], "Unknown");
}

function getBookingAmount(row: AnyRow) {
  return getAmount(row, [
    "total_customer_paid",
    "customer_total_amount",
    "total_amount",
    "amount",
    "price",
    "subtotal",
    "service_total",
    "total_paid",
  ]);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function safeSelect(
  table: string,
  select: string,
  filter: (query: ReturnType<typeof supabaseAdmin.from> extends infer T ? any : never) => any,
) {
  try {
    const query = supabaseAdmin.from(table).select(select);
    const result = await filter(query);

    if (result.error) {
      return [];
    }

    return Array.isArray(result.data) ? (result.data as AnyRow[]) : [];
  } catch {
    return [];
  }
}

export default async function AdminCustomerDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const customerId = resolvedParams.id;

  if (!isUuid(customerId)) {
    return (
      <main className="min-h-screen bg-[#f7fbf7] px-4 py-6 text-[#062f2b] sm:px-6 lg:px-8">
        <section className="mx-auto max-w-6xl rounded-[2rem] border border-red-100 bg-white p-6 shadow-sm">
          <Link
            href="/admin/customers"
            className="inline-flex items-center gap-2 text-sm font-extrabold text-emerald-800 hover:text-emerald-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Customer Intelligence
          </Link>

          <div className="mt-6 rounded-3xl border border-red-100 bg-red-50 p-5">
            <h1 className="text-3xl font-black">Customer record not available</h1>
            <p className="mt-2 text-sm font-semibold text-red-800">
              This customer link is not using a valid Supabase profile ID.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const profileResult = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", customerId)
    .maybeSingle();

  const profile = (profileResult.data ?? null) as AnyRow | null;

  const [bookings, pets, sentMessages, receivedMessages] = await Promise.all([
    safeSelect("bookings", "*", (query) =>
      query
        .or(
          [
            `customer_id.eq.${customerId}`,
            `pet_owner_id.eq.${customerId}`,
            `user_id.eq.${customerId}`,
            `pet_parent_id.eq.${customerId}`,
          ].join(","),
        )
        .order("created_at", { ascending: false }),
    ),
    safeSelect("pets", "*", (query) =>
      query
        .or([`owner_profile_id.eq.${customerId}`, `owner_id.eq.${customerId}`].join(","))
        .order("created_at", { ascending: false }),
    ),
    safeSelect("messages", "*", (query) =>
      query.eq("sender_id", customerId).order("created_at", { ascending: false }),
    ),
    safeSelect("messages", "*", (query) =>
      query.eq("recipient_id", customerId).order("created_at", { ascending: false }),
    ),
  ]);

  const messages = [...sentMessages, ...receivedMessages];
  const name = getDisplayName(profile);
  const email = getEmail(profile);
  const location = getLocation(profile);
  const role = getText(profile, ["role", "user_role", "account_type"], "customer");
  const source = getText(
    profile,
    [
      "source",
      "signup_source",
      "referral_source",
      "lead_source",
      "acquisition_source",
      "utm_source",
    ],
    "sitguru",
  );

  const totalSpend = bookings.reduce((sum, booking) => sum + getBookingAmount(booking), 0);
  const paidBookings = bookings.filter((booking) => getBookingAmount(booking) > 0).length;
  const averageBookingValue = bookings.length > 0 ? totalSpend / bookings.length : 0;
  const lastBooking = bookings[0] ?? null;

  return (
    <main className="min-h-screen bg-[#f7fbf7] px-4 py-6 text-[#062f2b] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
          <Link
            href="/admin/customers"
            className="inline-flex items-center gap-2 text-sm font-extrabold text-emerald-800 hover:text-emerald-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Customer Intelligence
          </Link>

          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-emerald-100 text-xl font-black text-emerald-900">
                {getInitials(name)}
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">
                  Admin / Customer Detail
                </p>
                <h1 className="mt-1 text-4xl font-black tracking-tight sm:text-5xl">
                  {name}
                </h1>
                <p className="mt-2 max-w-3xl text-sm font-semibold text-slate-700">
                  Live Supabase Pet Parent profile, booking activity, pets, messages, and
                  acquisition details.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/bookings"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-800 shadow-sm hover:bg-emerald-50"
              >
                <CalendarDays className="h-4 w-4" />
                View Bookings
              </Link>

              <Link
                href="/admin/messages"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-emerald-800"
              >
                <MessageSquare className="h-4 w-4" />
                View Messages
              </Link>
            </div>
          </div>
        </div>

        {!profile ? (
          <div className="mt-5 rounded-[2rem] border border-amber-100 bg-amber-50 p-5 shadow-sm">
            <h2 className="text-2xl font-black">Customer profile not found</h2>
            <p className="mt-2 text-sm font-semibold text-amber-900">
              This route is working, so it will not 404 anymore. However, the profile ID does
              not currently exist in the live Supabase `profiles` table. It may have been one
              of the deleted test/customer reset records.
            </p>
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
              <CircleDollarSign className="h-5 w-5" />
            </div>
            <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Lifetime Spend
            </p>
            <p className="mt-1 text-3xl font-black">{formatMoney(totalSpend)}</p>
            <p className="mt-1 text-xs font-bold text-slate-600">
              {paidBookings} paid bookings
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
              <CalendarDays className="h-5 w-5" />
            </div>
            <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Bookings
            </p>
            <p className="mt-1 text-3xl font-black">{bookings.length}</p>
            <p className="mt-1 text-xs font-bold text-slate-600">
              Avg. {formatMoney(averageBookingValue)}
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
              <PawPrint className="h-5 w-5" />
            </div>
            <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Pets
            </p>
            <p className="mt-1 text-3xl font-black">{pets.length}</p>
            <p className="mt-1 text-xs font-bold text-slate-600">
              Live pet profile records
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
              <MessageSquare className="h-5 w-5" />
            </div>
            <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Messages
            </p>
            <p className="mt-1 text-3xl font-black">{messages.length}</p>
            <p className="mt-1 text-xs font-bold text-slate-600">
              Sent and received messages
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-black">Pet Parent Profile</h2>

            <div className="mt-5 space-y-3">
              <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <UserRound className="mt-0.5 h-5 w-5 text-emerald-700" />
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Name
                  </p>
                  <p className="text-sm font-black">{name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <Mail className="mt-0.5 h-5 w-5 text-emerald-700" />
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Email
                  </p>
                  <p className="text-sm font-black">{email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <MapPin className="mt-0.5 h-5 w-5 text-emerald-700" />
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Location
                  </p>
                  <p className="text-sm font-black">{location}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Role
                  </p>
                  <p className="mt-1 text-sm font-black">{role}</p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Source
                  </p>
                  <p className="mt-1 text-sm font-black">{source}</p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Created
                  </p>
                  <p className="mt-1 text-sm font-black">
                    {formatDate(profile?.created_at)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Last Booking
                  </p>
                  <p className="mt-1 text-sm font-black">
                    {formatDate(lastBooking ? getBookingDate(lastBooking) : null)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-black">Booking History</h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              Live records matched by customer_id, pet_owner_id, user_id, or pet_parent_id.
            </p>

            <div className="mt-5 overflow-hidden rounded-3xl border border-slate-100">
              {bookings.length === 0 ? (
                <div className="bg-slate-50 p-5 text-sm font-bold text-slate-600">
                  No bookings found for this Pet Parent.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Pet</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {bookings.slice(0, 12).map((booking) => (
                        <tr key={String(booking.id)}>
                          <td className="px-4 py-3 font-bold">
                            {formatDate(getBookingDate(booking))}
                          </td>
                          <td className="px-4 py-3 font-bold">{getBookingStatus(booking)}</td>
                          <td className="px-4 py-3 font-bold">
                            {getText(booking, ["pet_name", "animal_name"], "—")}
                          </td>
                          <td className="px-4 py-3 text-right font-black">
                            {formatMoney(getBookingAmount(booking))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-black">Pets</h2>

            <div className="mt-5 space-y-3">
              {pets.length === 0 ? (
                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5 text-sm font-bold text-slate-600">
                  No pet profiles found for this Pet Parent.
                </div>
              ) : (
                pets.map((pet) => (
                  <div
                    key={String(pet.id)}
                    className="rounded-3xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <p className="text-lg font-black">
                      {getText(pet, ["name", "pet_name"], "Pet")}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-600">
                      {[getText(pet, ["type", "species", "pet_type"]), getText(pet, ["breed"])]
                        .filter(Boolean)
                        .join(" • ") || "Pet details not completed"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-black">Message Activity</h2>

            <div className="mt-5 space-y-3">
              {messages.length === 0 ? (
                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5 text-sm font-bold text-slate-600">
                  No messages found for this Pet Parent.
                </div>
              ) : (
                messages.slice(0, 8).map((message) => (
                  <div
                    key={String(message.id)}
                    className="rounded-3xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black">
                        {getText(message, ["subject", "title"], "Message")}
                      </p>
                      <p className="text-xs font-bold text-slate-500">
                        {formatDate(message.created_at)}
                      </p>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-600">
                      {getText(
                        message,
                        ["body", "message", "content", "snippet"],
                        "No message preview available.",
                      )}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}