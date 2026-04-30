import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeDollarSign,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DollarSign,
  HelpCircle,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import GuruDashboardHeader from "@/app/guru/dashboard/GuruDashboardHeader";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const SITGURU_FEE_PERCENT = 0.08;

type GuruProfile = {
  id?: string | number | null;
  user_id?: string | null;
  email?: string | null;
  display_name?: string | null;
  full_name?: string | null;
  name?: string | null;
  photo_url?: string | null;
  profile_photo_url?: string | null;
  avatar_url?: string | null;
  image_url?: string | null;
};

type BookingRow = Record<string, unknown>;

type EarningsRow = {
  id: string;
  rawDate: string;
  date: string;
  time: string;
  service: string;
  petParent: string;
  petName: string;
  customerPhotoUrl: string;
  gross: number;
  fee: number;
  net: number;
  status: string;
};

function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function asTrimmedString(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value?: string | null) {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function startOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function statusClasses(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("paid")) {
    return "border-emerald-200 bg-emerald-50 !text-emerald-700";
  }

  if (normalized.includes("processing")) {
    return "border-sky-200 bg-sky-50 !text-sky-700";
  }

  if (normalized.includes("adjust") || normalized.includes("refund")) {
    return "border-rose-200 bg-rose-50 !text-rose-700";
  }

  return "border-amber-200 bg-amber-50 !text-amber-700";
}

function initialsFromName(name: string) {
  const parts = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return "C";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

function getBookingStatus(booking: BookingRow) {
  return (
    asTrimmedString(booking.payout_status) ||
    asTrimmedString(booking.payment_status) ||
    asTrimmedString(booking.status) ||
    asTrimmedString(booking.booking_status) ||
    asTrimmedString(booking.state) ||
    "pending"
  );
}

function getServiceName(booking: BookingRow) {
  return (
    asTrimmedString(booking.service) ||
    asTrimmedString(booking.service_name) ||
    asTrimmedString(booking.service_type) ||
    asTrimmedString(booking.booking_type) ||
    "Pet Care"
  );
}

function getPetParentName(booking: BookingRow) {
  return (
    asTrimmedString(booking.customer_name) ||
    asTrimmedString(booking.pet_parent_name) ||
    asTrimmedString(booking.owner_name) ||
    asTrimmedString(booking.parent_name) ||
    asTrimmedString(booking.user_name) ||
    asTrimmedString(booking.customer_email) ||
    "Customer"
  );
}

function getCustomerPhotoUrl(booking: BookingRow) {
  return (
    asTrimmedString(booking.customer_photo_url) ||
    asTrimmedString(booking.customer_avatar_url) ||
    asTrimmedString(booking.pet_parent_photo_url) ||
    asTrimmedString(booking.owner_photo_url) ||
    asTrimmedString(booking.avatar_url) ||
    asTrimmedString(booking.profile_photo_url) ||
    asTrimmedString(booking.customer_profile_photo_url) ||
    ""
  );
}

function getPetName(booking: BookingRow) {
  return (
    asTrimmedString(booking.pet_name) ||
    asTrimmedString(booking.petName) ||
    asTrimmedString(booking.pet) ||
    asTrimmedString(booking.animal_name) ||
    "Pet care"
  );
}

function getBookingDateValue(booking: BookingRow) {
  return (
    asTrimmedString(booking.booking_date) ||
    asTrimmedString(booking.requested_date) ||
    asTrimmedString(booking.start_date) ||
    asTrimmedString(booking.start_time) ||
    asTrimmedString(booking.created_at) ||
    ""
  );
}

function getGrossAmount(booking: BookingRow) {
  const subtotal = toNumber(booking.subtotal_amount);
  if (subtotal > 0) return roundMoney(subtotal);

  const fallback =
    toNumber(booking.total_amount) ||
    toNumber(booking.amount) ||
    toNumber(booking.price) ||
    toNumber(booking.hourly_rate);

  return roundMoney(fallback);
}

function getFeeAmount(booking: BookingRow, gross: number) {
  const storedFee = toNumber(booking.sitguru_fee_amount);
  if (storedFee > 0) return roundMoney(storedFee);

  return roundMoney(gross * SITGURU_FEE_PERCENT);
}

function getNetAmount(booking: BookingRow, gross: number, fee: number) {
  const storedNet = toNumber(booking.guru_net_amount);
  if (storedNet > 0) return roundMoney(storedNet);

  return roundMoney(gross - fee);
}

function isCompletedForEarnings(booking: BookingRow) {
  const status = getBookingStatus(booking).toLowerCase();

  return (
    status.includes("complete") ||
    status.includes("paid") ||
    status.includes("processing") ||
    status.includes("pending")
  );
}

async function getGuruProfile(userId: string, email?: string | null) {
  const byUserId = await supabaseAdmin
    .from("gurus")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!byUserId.error && byUserId.data) {
    return byUserId.data as GuruProfile;
  }

  if (email) {
    const byEmail = await supabaseAdmin
      .from("gurus")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (!byEmail.error && byEmail.data) {
      return byEmail.data as GuruProfile;
    }
  }

  return null;
}

async function getGuruBookings(guruId: string | number) {
  const byCreatedAt = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("sitter_id", guruId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (!byCreatedAt.error && byCreatedAt.data) {
    return byCreatedAt.data as BookingRow[];
  }

  const byBookingDate = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("sitter_id", guruId)
    .order("booking_date", { ascending: false })
    .limit(100);

  if (!byBookingDate.error && byBookingDate.data) {
    return byBookingDate.data as BookingRow[];
  }

  return [];
}

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black !text-slate-800">{title}</p>
          <p className="mt-3 text-2xl font-black tracking-tight !text-slate-950">
            {value}
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 !text-slate-700">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 !text-emerald-700 ring-1 ring-emerald-100">
          {icon}
        </div>
      </div>
    </div>
  );
}

function CustomerAvatar({
  name,
  photoUrl,
}: {
  name: string;
  photoUrl: string;
}) {
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-50 text-sm font-black !text-emerald-700 ring-2 ring-emerald-100">
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        initialsFromName(name)
      )}
    </div>
  );
}

export default async function GuruDashboardEarningsPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/guru/login");
  }

  const guruProfile = await getGuruProfile(user.id, user.email);

  if (!guruProfile?.id) {
    redirect("/guru/login");
  }

  const bookings = await getGuruBookings(guruProfile.id);
  const earningsBookings = bookings.filter(isCompletedForEarnings);

  const normalizedRows: EarningsRow[] = earningsBookings.map(
    (booking, index) => {
      const gross = getGrossAmount(booking);
      const fee = getFeeAmount(booking, gross);
      const net = getNetAmount(booking, gross, fee);
      const rawDate = getBookingDateValue(booking);

      return {
        id:
          asTrimmedString(booking.id) ||
          `BK-${String(index + 1).padStart(4, "0")}`,
        rawDate,
        date: formatDate(rawDate),
        time: formatTime(rawDate),
        service: getServiceName(booking),
        petParent: getPetParentName(booking),
        petName: getPetName(booking),
        customerPhotoUrl: getCustomerPhotoUrl(booking),
        gross,
        fee,
        net,
        status: getBookingStatus(booking),
      };
    },
  );

  const totalEarnings = roundMoney(
    normalizedRows.reduce((sum, row) => sum + row.net, 0),
  );

  const pendingPayouts = roundMoney(
    normalizedRows
      .filter((row) => {
        const status = row.status.toLowerCase();
        return !status.includes("paid") && !status.includes("adjust");
      })
      .reduce((sum, row) => sum + row.net, 0),
  );

  const paidOut = roundMoney(
    normalizedRows
      .filter((row) => row.status.toLowerCase().includes("paid"))
      .reduce((sum, row) => sum + row.net, 0),
  );

  const sitguruFees = roundMoney(
    normalizedRows.reduce((sum, row) => sum + row.fee, 0),
  );

  const completedBookings = normalizedRows.length;

  const monthStart = startOfCurrentMonth();
  const thisMonth = roundMoney(
    normalizedRows
      .filter((row) => {
        const parsed = new Date(row.rawDate);
        return !Number.isNaN(parsed.getTime()) && parsed >= monthStart;
      })
      .reduce((sum, row) => sum + row.net, 0),
  );

  const recentEarnings =
    normalizedRows.length > 0
      ? normalizedRows.slice(0, 10)
      : [
          {
            id: "BK-0000",
            rawDate: "",
            date: "—",
            time: "",
            service: "No completed bookings yet",
            petParent: "Customer",
            petName: "Pet care",
            customerPhotoUrl: "",
            gross: 0,
            fee: 0,
            net: 0,
            status: "Pending",
          },
        ];

  return (
    <>
      <GuruDashboardHeader guruProfile={guruProfile} activeTab="earnings" />

      <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_42%,#ecfdf5_100%)] px-4 py-6 !text-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1720px] space-y-6">
          <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <div className="grid gap-8 bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.95),transparent_18%),linear-gradient(120deg,#b9f8df_0%,#d9f8ef_48%,#bde9ff_100%)] px-8 py-10 lg:grid-cols-[1.35fr_0.75fr] lg:items-center xl:px-10">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.26em] !text-emerald-800">
                  Guru Earnings
                </p>

                <h1 className="mt-4 max-w-5xl text-5xl font-black tracking-[-0.055em] !text-slate-950 md:text-6xl xl:text-7xl">
                  Your earnings, simplified 💰
                </h1>

                <p className="mt-5 max-w-4xl text-base font-semibold leading-8 !text-slate-800 md:text-lg">
                  SitGuru is built to support Gurus with fair pay and
                  transparent payouts. Earnings shown here reflect completed
                  bookings, payout status, and what you take home after
                  applicable deductions.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <div className="inline-flex items-center gap-2 rounded-2xl bg-white/95 px-5 py-3 text-sm font-black !text-slate-900 shadow-sm ring-1 ring-white/80">
                    <ShieldCheck className="h-4 w-4 !text-emerald-600" />
                    Trusted Guru
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-2xl bg-white/95 px-5 py-3 text-sm font-black !text-slate-900 shadow-sm ring-1 ring-white/80">
                    <Sparkles className="h-4 w-4 !text-amber-500" />
                    Transparent payouts
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/70 bg-white/95 p-7 shadow-xl backdrop-blur">
                <div className="flex items-start gap-5">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-emerald-100 !text-emerald-700 ring-1 ring-emerald-200">
                    <CalendarClock className="h-8 w-8" />
                  </div>

                  <div>
                    <h2 className="text-2xl font-black tracking-tight !text-slate-950 md:text-3xl">
                      Payouts become eligible 48 hours after completed care.
                    </h2>

                    <p className="mt-4 text-sm font-semibold leading-7 !text-slate-800">
                      SitGuru releases Guru payouts after completed care, as
                      long as there are no open support cases, refund requests,
                      chargebacks, or trust and safety reviews. If a case is
                      opened, the related payout may be placed on hold while
                      SitGuru reviews it fairly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <StatCard
              title="Total Earnings"
              value={currency(totalEarnings)}
              description="All time from completed bookings"
              icon={<Wallet className="h-6 w-6" />}
            />

            <StatCard
              title="Pending Payouts"
              value={currency(pendingPayouts)}
              description="Eligible after the 48-hour window"
              icon={<Clock3 className="h-6 w-6" />}
            />

            <StatCard
              title="Paid Out"
              value={currency(paidOut)}
              description="Successfully paid to you"
              icon={<PiggyBank className="h-6 w-6" />}
            />

            <StatCard
              title="This Month"
              value={currency(thisMonth)}
              description="Net earnings this month"
              icon={<CalendarDays className="h-6 w-6" />}
            />

            <StatCard
              title="Completed Bookings"
              value={String(completedBookings)}
              description="Qualified completed services"
              icon={<CheckCircle2 className="h-6 w-6" />}
            />

            <StatCard
              title="SitGuru Fees"
              value={currency(sitguruFees)}
              description="Total platform fees deducted"
              icon={<BadgeDollarSign className="h-6 w-6" />}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.45fr_0.75fr]">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] !text-slate-800">
                    Booking-by-booking breakdown
                  </p>
                  <p className="mt-1 text-sm font-semibold !text-slate-700">
                    Gross amount — SitGuru fee = your net earnings
                  </p>
                </div>

                <p className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black !text-emerald-700 ring-1 ring-emerald-100">
                  8% platform fee
                </p>
              </div>

              <div className="hidden overflow-hidden rounded-[1.5rem] border border-slate-200 lg:block">
                <table className="min-w-full text-left">
                  <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] !text-slate-600">
                    <tr>
                      <th className="px-5 py-4 font-black">Customer</th>
                      <th className="px-5 py-4 font-black">Service</th>
                      <th className="px-5 py-4 font-black">Date</th>
                      <th className="px-5 py-4 font-black">Gross</th>
                      <th className="px-5 py-4 font-black">Fee</th>
                      <th className="px-5 py-4 font-black">Net</th>
                      <th className="px-5 py-4 font-black">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 bg-white">
                    {recentEarnings.map((item) => (
                      <tr key={item.id} className="text-sm">
                        <td className="px-5 py-4 align-middle">
                          <div className="flex items-center gap-3">
                            <CustomerAvatar
                              name={item.petParent}
                              photoUrl={item.customerPhotoUrl}
                            />

                            <div>
                              <p className="font-black !text-slate-950">
                                {item.petParent}
                              </p>
                              <p className="mt-1 text-sm font-semibold !text-slate-700">
                                {item.petName}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 align-middle">
                          <p className="font-bold !text-slate-900">
                            {item.service}
                          </p>
                        </td>

                        <td className="px-5 py-4 align-middle">
                          <p className="font-bold !text-slate-900">
                            {item.date}
                          </p>
                          <p className="mt-1 text-xs font-semibold !text-slate-600">
                            {item.time || item.id}
                          </p>
                        </td>

                        <td className="px-5 py-4 align-middle font-bold !text-slate-900">
                          {currency(item.gross)}
                        </td>

                        <td className="px-5 py-4 align-middle font-bold !text-rose-500">
                          -{currency(item.fee)}
                        </td>

                        <td className="px-5 py-4 align-middle font-black !text-emerald-700">
                          {currency(item.net)}
                        </td>

                        <td className="px-5 py-4 align-middle">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusClasses(
                              item.status,
                            )}`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 lg:hidden">
                {recentEarnings.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <CustomerAvatar
                        name={item.petParent}
                        photoUrl={item.customerPhotoUrl}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-black !text-slate-950">
                              {item.petParent}
                            </p>
                            <p className="mt-1 text-sm font-semibold !text-slate-700">
                              {item.petName} • {item.service}
                            </p>
                          </div>

                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusClasses(
                              item.status,
                            )}`}
                          >
                            {item.status}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                          <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                            <p className="font-black !text-slate-600">Gross</p>
                            <p className="mt-1 font-black !text-slate-950">
                              {currency(item.gross)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                            <p className="font-black !text-slate-600">Fee</p>
                            <p className="mt-1 font-black !text-rose-500">
                              -{currency(item.fee)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                            <p className="font-black !text-slate-600">Net</p>
                            <p className="mt-1 font-black !text-emerald-700">
                              {currency(item.net)}
                            </p>
                          </div>
                        </div>

                        <p className="mt-3 text-xs font-semibold !text-slate-600">
                          {item.date} {item.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-center">
                <Link
                  href="/guru/dashboard/bookings"
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-8 py-3 text-sm font-black !text-slate-900 shadow-sm transition hover:bg-slate-50"
                >
                  View all earnings activity
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="space-y-6">
              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-black uppercase tracking-[0.18em] !text-slate-800">
                  How earnings work
                </p>

                <h2 className="mt-2 text-3xl font-black tracking-tight !text-slate-950">
                  Simple and transparent
                </h2>

                <div className="mt-6 grid gap-4">
                  <div className="flex items-start gap-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 !text-emerald-700">
                      <DollarSign className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-black !text-slate-950">
                        Gross booking total
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-6 !text-slate-700">
                        The full service subtotal tied to the completed booking.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 !text-rose-600">
                      <BadgeDollarSign className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-black !text-slate-950">
                        SitGuru fee (8%)
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-6 !text-slate-700">
                        An introductory platform fee designed to stay
                        Guru-friendly.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 !text-emerald-700">
                      <Wallet className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-black !text-slate-950">
                        Net earnings
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-6 !text-slate-700">
                        What you take home after the SitGuru fee is deducted.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-black uppercase tracking-[0.18em] !text-slate-800">
                  Referrals & Growth
                </p>

                <h2 className="mt-2 text-3xl font-black tracking-tight !text-slate-950">
                  More ways to grow
                </h2>

                <div className="mt-6 grid gap-3">
                  <Link
                    href="/guru/dashboard/referrals"
                    className="group flex items-center justify-between gap-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-200 hover:bg-emerald-50"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 !text-emerald-700">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-black !text-slate-950">
                          Refer a Guru
                        </p>
                        <p className="mt-1 text-sm font-semibold leading-6 !text-slate-700">
                          Invite another great Guru to SitGuru.
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 !text-slate-500 transition group-hover:!text-emerald-700" />
                  </Link>

                  <div className="flex items-start gap-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 !text-emerald-700">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-black !text-slate-950">
                        Referral Tracking
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-6 !text-slate-700">
                        Track referrals, rewards, and growth opportunities.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[1.25rem] border border-dashed border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-sm font-black !text-emerald-800">
                      Coming Soon
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-6 !text-slate-700">
                      SitGuru plans to support referral and affiliate
                      opportunities as the platform grows.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-emerald-100 !text-emerald-700 ring-1 ring-emerald-200">
                  <HelpCircle className="h-8 w-8" />
                </div>

                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] !text-emerald-700">
                    Introductory 8% platform fee
                  </p>
                  <p className="mt-2 max-w-4xl text-sm font-semibold leading-7 !text-slate-700">
                    SitGuru’s current model is designed to help Gurus keep more
                    from each completed booking. Platform fees, payout timing,
                    referral rewards, and affiliate options may evolve as
                    SitGuru grows.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/guru/dashboard"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-slate-300 bg-white px-8 py-3 text-sm font-black !text-slate-900 shadow-sm transition hover:bg-slate-50"
                >
                  Back to Dashboard
                </Link>

                <Link
                  href="/help"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-emerald-600 px-8 py-3 text-sm font-black !text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                >
                  View Help Center
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}