import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Clock3,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  MessageCircle,
  PawPrint,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SearchParams = {
  status?: string;
  q?: string;
};

type PageProps = {
  searchParams?: Promise<SearchParams>;
};

type BookingRow = Record<string, unknown> & {
  id?: string | number | null;
  uid?: string | null;
  booking_uid?: string | null;
  customer_id?: string | null;
  pet_parent_id?: string | null;
  pet_owner_id?: string | null;
  user_id?: string | null;
  guru_id?: string | number | null;
  guru_user_id?: string | null;
  provider_id?: string | number | null;
  service_type?: string | null;
  service?: string | null;
  service_key?: string | null;
  pet_name?: string | null;
  requested_date?: string | null;
  booking_date?: string | null;
  date?: string | null;
  requested_start_date?: string | null;
  requested_end_date?: string | null;
  time_window?: string | null;
  preferred_time?: string | null;
  status?: string | null;
  booking_status?: string | null;
  payment_status?: string | null;
  stripe_payment_status?: string | null;
  payout_status?: string | null;
  total_amount?: number | string | null;
  amount_total?: number | string | null;
  customer_total_amount?: number | string | null;
  subtotal_amount?: number | string | null;
  platform_fee?: number | string | null;
  marketplace_fee?: number | string | null;
  guru_estimated_total_payout?: number | string | null;
  guru_payout_amount?: number | string | null;
  tip_amount?: number | string | null;
  created_at?: string | null;
  updated_at?: string | null;
  notes?: string | null;
  care_city?: string | null;
  care_state?: string | null;
  care_zip_code?: string | null;
  care_locality_name?: string | null;
};

type ProfileRow = {
  id: string;
  full_name?: string | null;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  profile_photo_url?: string | null;
  role?: string | null;
};

type GuruRow = Record<string, unknown> & {
  id?: string | number | null;
  user_id?: string | null;
  display_name?: string | null;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  rating_avg?: number | string | null;
  review_count?: number | string | null;
  stripe_account_id?: string | null;
  stripe_onboarding_complete?: boolean | null;
};

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

type BookingCard = {
  id: string;
  displayId: string;
  status: string;
  paymentStatus: string;
  payoutStatus: string;
  service: string;
  petName: string;
  requestedDate: string;
  requestedEndDate: string;
  timeWindow: string;
  location: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  guruId: string;
  guruUserId: string;
  guruName: string;
  guruEmail: string;
  totalAmount: number;
  platformFee: number;
  guruPayout: number;
  tipAmount: number;
  createdAt: string | null;
  updatedAt: string | null;
  notes: string;
};

const adminRoutes = {
  dashboard: "/admin",
  bookings: "/admin/bookings",
  customers: "/admin/customers",
  gurus: "/admin/gurus",
  messages: "/admin/messages",
  financials: "/admin/financials",
};

const statusFilters = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "requested", label: "Requested" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "payment", label: "Payment Review" },
  { key: "payout", label: "Payout Review" },
];

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asId(value: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
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

function titleCase(value: string) {
  const clean = value.replace(/_/g, " ").replace(/-/g, " ").trim();
  if (!clean) return "Unknown";

  return clean
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function normalizeStatus(value?: string | null) {
  const clean = String(value || "").trim().toLowerCase();
  if (!clean) return "pending";
  if (["request", "requested", "booking_requested"].includes(clean)) return "requested";
  if (["paid", "succeeded", "payment_succeeded"].includes(clean)) return "confirmed";
  if (["complete"].includes(clean)) return "completed";
  if (["canceled"].includes(clean)) return "cancelled";
  return clean;
}

function getStatusLabel(value: string) {
  const status = normalizeStatus(value);
  if (status === "requested") return "Requested";
  if (status === "pending") return "Pending";
  if (status === "confirmed") return "Confirmed";
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  if (status === "failed") return "Failed";
  if (status === "refunded") return "Refunded";
  return titleCase(status);
}

function getStatusClasses(value: string) {
  const status = normalizeStatus(value);

  if (["confirmed", "active", "accepted"].includes(status)) {
    return "border-emerald-200 bg-emerald-100 text-emerald-900";
  }

  if (["completed", "complete"].includes(status)) {
    return "border-green-200 bg-green-100 text-green-900";
  }

  if (["requested", "pending", "review", "open"].includes(status)) {
    return "border-amber-200 bg-amber-100 text-amber-900";
  }

  if (["cancelled", "canceled", "failed", "declined", "refunded"].includes(status)) {
    return "border-rose-200 bg-rose-100 text-rose-900";
  }

  return "border-slate-200 bg-slate-100 text-slate-800";
}

function getPaymentClasses(value: string) {
  const clean = value.toLowerCase();
  if (["paid", "succeeded", "complete", "completed"].some((item) => clean.includes(item))) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (["failed", "declined", "refunded", "dispute", "chargeback"].some((item) => clean.includes(item))) {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }
  return "border-amber-200 bg-amber-50 text-amber-800";
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatDate(value?: string | null) {
  if (!value) return "Not scheduled";
  const parsed = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return formatDate(value);

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getProfileName(profile?: ProfileRow | null) {
  if (!profile) return "Unknown Pet Parent";

  return (
    profile.full_name ||
    profile.display_name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    profile.email ||
    "Unknown Pet Parent"
  );
}

function getGuruName(guru?: GuruRow | null, profile?: ProfileRow | null) {
  if (guru?.display_name || guru?.full_name) {
    return String(guru.display_name || guru.full_name);
  }

  if (profile) return getProfileName(profile).replace("Unknown Pet Parent", "Unknown Guru");
  return "Unknown Guru";
}

function getBookingCustomerId(booking: BookingRow) {
  return (
    asId(booking.customer_id) ||
    asId(booking.pet_parent_id) ||
    asId(booking.pet_owner_id) ||
    asId(booking.user_id)
  );
}

function getBookingGuruId(booking: BookingRow) {
  return asId(booking.guru_id) || asId(booking.provider_id);
}

function getBookingDate(booking: BookingRow) {
  return (
    asString(booking.requested_date) ||
    asString(booking.booking_date) ||
    asString(booking.date) ||
    asString(booking.requested_start_date)
  );
}

function getBookingEndDate(booking: BookingRow) {
  return asString(booking.requested_end_date);
}

function getBookingService(booking: BookingRow) {
  return (
    asString(booking.service_type) ||
    asString(booking.service) ||
    titleCase(asString(booking.service_key)) ||
    "Pet Care"
  );
}

function getBookingTotal(booking: BookingRow) {
  return (
    asNumber(booking.total_amount) ||
    asNumber(booking.amount_total) ||
    asNumber(booking.customer_total_amount) ||
    asNumber(booking.subtotal_amount)
  );
}

function getBookingPlatformFee(booking: BookingRow) {
  return asNumber(booking.platform_fee) || asNumber(booking.marketplace_fee);
}

function getBookingGuruPayout(booking: BookingRow) {
  return asNumber(booking.guru_estimated_total_payout) || asNumber(booking.guru_payout_amount);
}

function getBookingStatus(booking: BookingRow) {
  return normalizeStatus(
    asString(booking.status) || asString(booking.booking_status) || "pending",
  );
}

function getPaymentStatus(booking: BookingRow) {
  return (
    asString(booking.payment_status) ||
    asString(booking.stripe_payment_status) ||
    "not_started"
  );
}

function getPayoutStatus(booking: BookingRow) {
  return asString(booking.payout_status) || "not_ready";
}

function buildMessageHref(booking: BookingCard) {
  const query = new URLSearchParams({
    threadType: "direct_customer",
    messageCategory: "booking",
    source: "admin_bookings",
    recipientRole: "customer",
    recipientName: booking.customerName,
  });

  if (booking.customerId) query.set("recipientId", booking.customerId);
  if (booking.customerEmail) query.set("recipientEmail", booking.customerEmail);

  return `${adminRoutes.messages}?${query.toString()}`;
}

function filterHref(status: string) {
  if (status === "all") return adminRoutes.bookings;
  return `${adminRoutes.bookings}?status=${encodeURIComponent(status)}`;
}

async function safeAdminQuery(
  query: PromiseLike<SafeQueryResponse>,
  label: string,
): Promise<SafeQueryResponse> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Admin bookings query skipped for ${label}:`, result.error);
      return { data: [], error: null };
    }

    return result;
  } catch (error) {
    console.warn(`Admin bookings query skipped for ${label}:`, error);
    return { data: [], error: null };
  }
}

function StatCard({
  icon,
  label,
  value,
  detail,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  href?: string;
}) {
  const content = (
    <>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-800 transition group-hover:bg-green-800 group-hover:text-white">
        {icon}
      </div>
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-500">{detail}</p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group rounded-[26px] border border-[#e3ece5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="group rounded-[26px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      {content}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[28px] border border-dashed border-[#d7e4da] bg-white p-10 text-center shadow-sm">
      <CalendarClock className="mx-auto mb-3 text-slate-400" size={44} />
      <h2 className="text-xl font-black text-slate-950">No bookings found</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
        No booking records match the current filter or search. This page is now
        the Admin bookings operations dashboard, not the Pet Parent booking form.
      </p>
    </div>
  );
}

function BookingRowCard({ booking }: { booking: BookingCard }) {
  const hasDateRange =
    booking.requestedEndDate && booking.requestedEndDate !== booking.requestedDate;

  return (
    <article className="rounded-[28px] border border-[#e3ece5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${getStatusClasses(booking.status)}`}>
              {getStatusLabel(booking.status)}
            </span>
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${getPaymentClasses(booking.paymentStatus)}`}>
              Payment: {titleCase(booking.paymentStatus)}
            </span>
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">
              Payout: {titleCase(booking.payoutStatus)}
            </span>
            <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
              Created {formatDateTime(booking.createdAt)}
            </span>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-black tracking-tight text-slate-950">
                {booking.service}
              </h2>
              <p className="mt-2 text-sm font-bold text-slate-500">
                Booking ID: {booking.displayId}
              </p>
            </div>

            <div className="grid gap-2 text-right sm:grid-cols-2 lg:min-w-[280px]">
              <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-green-700">
                  Customer Total
                </p>
                <p className="mt-1 text-xl font-black text-green-950">
                  {formatMoney(booking.totalAmount)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                  Guru Payout
                </p>
                <p className="mt-1 text-xl font-black text-slate-950">
                  {formatMoney(booking.guruPayout)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <InfoTile label="Pet Parent" value={booking.customerName} helper={booking.customerEmail || booking.customerPhone || "No contact shown"} icon={<UserRound size={17} />} />
            <InfoTile label="Guru" value={booking.guruName} helper={booking.guruEmail || "Guru profile lookup"} icon={<UsersRound size={17} />} />
            <InfoTile label={hasDateRange ? "Dates" : "Date"} value={hasDateRange ? `${formatDate(booking.requestedDate)} – ${formatDate(booking.requestedEndDate)}` : formatDate(booking.requestedDate)} helper={booking.timeWindow || "Time not selected"} icon={<CalendarCheck size={17} />} />
            <InfoTile label="Location" value={booking.location || "Not provided"} helper={booking.petName ? `Pet: ${booking.petName}` : "Pet not selected"} icon={<PawPrint size={17} />} />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                Platform Fee
              </p>
              <p className="mt-1 text-lg font-black text-slate-950">
                {formatMoney(booking.platformFee)}
              </p>
            </div>
            <div className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                Tip
              </p>
              <p className="mt-1 text-lg font-black text-slate-950">
                {formatMoney(booking.tipAmount)}
              </p>
            </div>
            <div className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                Last Updated
              </p>
              <p className="mt-1 text-lg font-black text-slate-950">
                {formatDateTime(booking.updatedAt)}
              </p>
            </div>
          </div>

          {booking.notes ? (
            <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-amber-800">
                Notes / Care Details
              </p>
              <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm font-semibold leading-6 text-amber-950">
                {booking.notes}
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col gap-2 xl:min-w-[210px]">
          <Link
            href={`${adminRoutes.bookings}/${encodeURIComponent(booking.id)}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-green-900"
          >
            <Eye size={16} />
            View Booking
          </Link>

          {booking.customerId ? (
            <Link
              href={`${adminRoutes.customers}/${encodeURIComponent(booking.customerId)}`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
            >
              <UserRound size={16} />
              Pet Parent
            </Link>
          ) : null}

          {booking.guruId ? (
            <Link
              href={`${adminRoutes.gurus}/${encodeURIComponent(booking.guruId)}`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
            >
              <UsersRound size={16} />
              Guru
            </Link>
          ) : null}

          <Link
            href={buildMessageHref(booking)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-900 shadow-sm transition hover:bg-blue-100"
          >
            <MessageCircle size={16} />
            Message
          </Link>
        </div>
      </div>
    </article>
  );
}

function InfoTile({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4">
      <div className="mb-2 flex items-center gap-2 text-green-800">
        {icon}
        <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
          {label}
        </p>
      </div>
      <p className="truncate text-base font-black text-slate-950">{value}</p>
      <p className="mt-1 truncate text-xs font-bold text-slate-500">{helper}</p>
    </div>
  );
}

export default async function AdminBookingsPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const activeStatus = String(params.status || "all").trim().toLowerCase();
  const query = String(params.q || "").trim().toLowerCase();

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/admin/login");
  }

  const bookingsResult = await safeAdminQuery(
    supabaseAdmin
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500),
    "bookings",
  );

  const bookings = ((bookingsResult.data || []) as BookingRow[]).filter(Boolean);

  const customerIds = Array.from(new Set(bookings.map(getBookingCustomerId).filter(Boolean)));
  const guruIds = Array.from(new Set(bookings.map(getBookingGuruId).filter(Boolean)));
  const guruUserIdsFromBookings = Array.from(new Set(bookings.map((booking) => asId(booking.guru_user_id)).filter(Boolean)));

  const [customersResult, gurusResult] = await Promise.all([
    customerIds.length
      ? safeAdminQuery(
          supabaseAdmin.from("profiles").select("*").in("id", customerIds),
          "customer profiles",
        )
      : Promise.resolve({ data: [], error: null }),
    guruIds.length
      ? safeAdminQuery(
          supabaseAdmin.from("gurus").select("*").in("id", guruIds),
          "gurus",
        )
      : Promise.resolve({ data: [], error: null }),
  ]);

  const customerMap = new Map<string, ProfileRow>();
  ((customersResult.data || []) as ProfileRow[]).forEach((profile) => {
    if (profile.id) customerMap.set(profile.id, profile);
  });

  const guruMap = new Map<string, GuruRow>();
  const guruUserIds = new Set<string>(guruUserIdsFromBookings);

  ((gurusResult.data || []) as GuruRow[]).forEach((guru) => {
    const id = asId(guru.id);
    if (id) guruMap.set(id, guru);
    const userId = asId(guru.user_id);
    if (userId) guruUserIds.add(userId);
  });

  const guruProfilesResult = guruUserIds.size
    ? await safeAdminQuery(
        supabaseAdmin.from("profiles").select("*").in("id", Array.from(guruUserIds)),
        "guru profiles",
      )
    : { data: [], error: null };

  const guruProfileMap = new Map<string, ProfileRow>();
  ((guruProfilesResult.data || []) as ProfileRow[]).forEach((profile) => {
    if (profile.id) guruProfileMap.set(profile.id, profile);
  });

  const bookingCards: BookingCard[] = bookings.map((booking) => {
    const id = asId(booking.id) || asId(booking.uid) || asId(booking.booking_uid);
    const customerId = getBookingCustomerId(booking);
    const guruId = getBookingGuruId(booking);
    const customer = customerId ? customerMap.get(customerId) || null : null;
    const guru = guruId ? guruMap.get(guruId) || null : null;
    const guruUserId = asId(booking.guru_user_id) || asId(guru?.user_id);
    const guruProfile = guruUserId ? guruProfileMap.get(guruUserId) || null : null;
    const requestedDate = getBookingDate(booking);
    const requestedEndDate = getBookingEndDate(booking);
    const city = asString(booking.care_city);
    const state = asString(booking.care_state);
    const zip = asString(booking.care_zip_code);
    const location =
      asString(booking.care_locality_name) ||
      [city, state, zip].filter(Boolean).join(" ");

    return {
      id,
      displayId: asString(booking.uid) || asString(booking.booking_uid) || id.slice(0, 8),
      status: getBookingStatus(booking),
      paymentStatus: getPaymentStatus(booking),
      payoutStatus: getPayoutStatus(booking),
      service: getBookingService(booking),
      petName: asString(booking.pet_name),
      requestedDate,
      requestedEndDate,
      timeWindow: asString(booking.time_window) || asString(booking.preferred_time),
      location,
      customerId,
      customerName: customer ? getProfileName(customer) : "Unknown Pet Parent",
      customerEmail: asString(customer?.email),
      customerPhone: asString(customer?.phone),
      guruId,
      guruUserId,
      guruName: getGuruName(guru, guruProfile),
      guruEmail: asString(guru?.email) || asString(guruProfile?.email),
      totalAmount: getBookingTotal(booking),
      platformFee: getBookingPlatformFee(booking),
      guruPayout: getBookingGuruPayout(booking),
      tipAmount: asNumber(booking.tip_amount),
      createdAt: asString(booking.created_at) || null,
      updatedAt: asString(booking.updated_at) || null,
      notes: asString(booking.notes),
    };
  });

  const filteredBookings = bookingCards
    .filter((booking) => {
      if (activeStatus === "all") return true;
      if (activeStatus === "payment") {
        const payment = booking.paymentStatus.toLowerCase();
        return !["paid", "succeeded", "complete", "completed"].some((item) => payment.includes(item));
      }
      if (activeStatus === "payout") {
        const payout = booking.payoutStatus.toLowerCase();
        return !["paid", "complete", "completed"].some((item) => payout.includes(item));
      }
      return normalizeStatus(booking.status) === activeStatus;
    })
    .filter((booking) => {
      if (!query) return true;

      return [
        booking.displayId,
        booking.service,
        booking.petName,
        booking.customerName,
        booking.customerEmail,
        booking.guruName,
        booking.location,
        booking.status,
        booking.paymentStatus,
        booking.payoutStatus,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

  const totalBookings = bookingCards.length;
  const pendingBookings = bookingCards.filter((booking) => ["pending", "requested"].includes(normalizeStatus(booking.status))).length;
  const confirmedBookings = bookingCards.filter((booking) => normalizeStatus(booking.status) === "confirmed").length;
  const completedBookings = bookingCards.filter((booking) => normalizeStatus(booking.status) === "completed").length;
  const cancelledBookings = bookingCards.filter((booking) => normalizeStatus(booking.status) === "cancelled").length;
  const grossBookings = bookingCards.reduce((sum, booking) => sum + booking.totalAmount, 0);
  const platformRevenue = bookingCards.reduce((sum, booking) => sum + booking.platformFee, 0);
  const guruPayouts = bookingCards.reduce((sum, booking) => sum + booking.guruPayout, 0);

  return (
    <main className="min-h-screen bg-[#f9faf5] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <section className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <Link
                href={adminRoutes.dashboard}
                className="mb-4 inline-flex items-center gap-2 text-sm font-black text-green-800 transition hover:text-green-950"
              >
                ← Back to Admin Dashboard
              </Link>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-800 text-white">
                  <CalendarCheck size={26} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">
                    Admin / Booking Operations
                  </p>
                  <h1 className="text-3xl font-black tracking-tight text-green-950 sm:text-5xl">
                    SitGuru Booking Command Center
                  </h1>
                  <p className="mt-1 max-w-5xl text-base font-semibold leading-7 text-slate-600">
                    Review all live booking requests, Pet Parent details, Guru assignments,
                    payment status, payout readiness, revenue, tips, and support actions from
                    one Admin operations page.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/book"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
              >
                <PawPrint size={17} />
                Public Booking Flow
              </Link>

              <Link
                href="/admin/bookings/export"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
              >
                <Download size={17} />
                Export
              </Link>

              <Link
                href={adminRoutes.financials}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
              >
                <DollarSign size={17} />
                Financials
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <StatCard icon={<CalendarCheck size={22} />} label="Bookings" value={String(totalBookings)} detail={`${filteredBookings.length} visible with filters`} href={adminRoutes.bookings} />
          <StatCard icon={<Clock3 size={22} />} label="Pending" value={String(pendingBookings)} detail="Requested or awaiting review" href={filterHref("pending")} />
          <StatCard icon={<CheckCircle2 size={22} />} label="Confirmed" value={String(confirmedBookings)} detail="Accepted / ready for care" href={filterHref("confirmed")} />
          <StatCard icon={<ShieldCheck size={22} />} label="Completed" value={String(completedBookings)} detail="Completed care records" href={filterHref("completed")} />
          <StatCard icon={<XCircle size={22} />} label="Cancelled" value={String(cancelledBookings)} detail="Cancelled or declined" href={filterHref("cancelled")} />
          <StatCard icon={<CreditCard size={22} />} label="Gross" value={formatMoney(grossBookings)} detail="Customer booking total" />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[26px] border border-[#e3ece5] bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              Platform Revenue
            </p>
            <p className="mt-2 text-3xl font-black text-green-950">
              {formatMoney(platformRevenue)}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Booking/platform fee values currently stored in booking rows.
            </p>
          </div>

          <div className="rounded-[26px] border border-[#e3ece5] bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              Guru Payout Exposure
            </p>
            <p className="mt-2 text-3xl font-black text-green-950">
              {formatMoney(guruPayouts)}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Estimated payout obligations from visible booking rows.
            </p>
          </div>

          <div className="rounded-[26px] border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="flex gap-3">
              <AlertTriangle className="mt-1 h-6 w-6 shrink-0 text-amber-700" />
              <div>
                <p className="text-lg font-black text-amber-950">
                  Admin route restored
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-amber-900">
                  This page replaces the customer booking request form that was previously
                  rendering at /admin/bookings. The Pet Parent booking flow should stay on
                  public/customer booking routes only.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                Booking Queue
              </h2>
              <p className="mt-1 max-w-4xl text-sm font-semibold leading-6 text-slate-500">
                Filter by operational status, payment review, payout review, or search by
                Pet Parent, Guru, service, location, pet, or booking ID.
              </p>
            </div>

            <form className="flex w-full max-w-xl items-center gap-2 rounded-2xl border border-[#e3ece5] bg-white px-4 py-3 shadow-sm">
              <Search size={17} className="text-slate-400" />
              <input
                name="q"
                defaultValue={params.q || ""}
                placeholder="Search bookings, Pet Parents, Gurus..."
                className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
              />
              {activeStatus !== "all" ? <input type="hidden" name="status" value={activeStatus} /> : null}
            </form>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            {statusFilters.map((filter) => {
              const active = activeStatus === filter.key;
              return (
                <Link
                  key={filter.key}
                  href={filterHref(filter.key)}
                  className={
                    active
                      ? "rounded-2xl bg-green-800 px-4 py-2.5 text-sm font-black text-white shadow-sm"
                      : "rounded-2xl border border-green-200 bg-white px-4 py-2.5 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
                  }
                >
                  {filter.label}
                </Link>
              );
            })}
          </div>

          <div className="grid gap-4">
            {filteredBookings.length ? (
              filteredBookings.map((booking) => (
                <BookingRowCard key={booking.id || booking.displayId} booking={booking} />
              ))
            ) : (
              <EmptyState />
            )}
          </div>
        </section>

        <div className="rounded-[26px] border border-green-100 bg-white p-4 text-sm font-semibold text-slate-500 shadow-sm">
          <span className="font-black text-green-900">Supabase coordination:</span>{" "}
          this Admin page reads the live <code>bookings</code>, <code>profiles</code>,
          and <code>gurus</code> tables. It is for operations review only and should not
          replace the public Pet Parent booking request form.
        </div>
      </div>
    </main>
  );
}
