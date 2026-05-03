import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Download,
  MapPin,
  PawPrint,
  Plus,
  ReceiptText,
  Search,
  TrendingUp,
  UserRound,
  UsersRound,
  XCircle,
} from "lucide-react";
import { supabaseAdmin } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    filter?: string;
    q?: string;
    service?: string;
    payment?: string;
    sort?: string;
    order?: string;
  }>;
};

type AnyRow = Record<string, unknown>;

type BookingRow = {
  id: string;
  pet_id?: string | null;
  pet_name?: string | null;
  pet_photo_url?: string | null;
  status?: string | null;
  booking_status?: string | null;
  booking_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  service?: string | null;
  service_type?: string | null;
  booking_type?: string | null;
  payment_status?: string | null;
  price?: number | string | null;
  amount?: number | string | null;
  total_amount?: number | string | null;
  booking_total?: number | string | null;
  total_customer_paid?: number | string | null;
  platform_fee?: number | string | null;
  commission_amount?: number | string | null;
  sitguru_fee?: number | string | null;
  guru_payout?: number | string | null;
  payout_amount?: number | string | null;
  customer_id?: string | null;
  pet_owner_id?: string | null;
  client_id?: string | null;
  user_id?: string | null;
  sitter_id?: string | null;
  guru_id?: string | null;
  provider_id?: string | null;
  customer_name?: string | null;
  pet_parent_name?: string | null;
  owner_name?: string | null;
  customer_email?: string | null;
  guru_name?: string | null;
  sitter_name?: string | null;
  provider_name?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  service_city?: string | null;
  service_state?: string | null;
  service_country?: string | null;
};

type ProfileRow = {
  id: string;
  full_name?: string | null;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
};

type GuruRow = {
  id: string;
  user_id?: string | null;
  profile_id?: string | null;
  display_name?: string | null;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  profile_photo_url?: string | null;
  avatar_url?: string | null;
};

type PetMediaRow = {
  pet_id?: string | null;
  file_url?: string | null;
  file_type?: string | null;
  visibility?: string | null;
  created_at?: string | null;
};

type SafeAdminQueryResponse = {
  data: unknown;
  error: unknown;
};

type ChartItem = {
  label: string;
  value: number;
  helper?: string;
  href?: string;
};

const adminRoutes = {
  dashboard: "/admin",
  bookings: "/admin/bookings",
  bookingsExport: "/admin/bookings/export",
  newBooking: "/admin/bookings/new",
  customers: "/admin/customers",
  gurus: "/admin/gurus",
  messages: "/admin/messages",
  financials: "/admin/financials",
  guruPerformance: "/admin/guru-performance",
};

const filters = [
  {
    key: "all",
    label: "All",
    href: "/admin/bookings",
  },
  {
    key: "confirmed",
    label: "Confirmed",
    href: "/admin/bookings?filter=confirmed",
  },
  {
    key: "pending",
    label: "Pending",
    href: "/admin/bookings?filter=pending",
  },
  {
    key: "paid",
    label: "Paid",
    href: "/admin/bookings?filter=paid",
  },
  {
    key: "completed",
    label: "Completed",
    href: "/admin/bookings?filter=completed",
  },
  {
    key: "canceled",
    label: "Canceled",
    href: "/admin/bookings?filter=canceled",
  },
];

const chartColors = [
  "#166534",
  "#16a34a",
  "#22c55e",
  "#84cc16",
  "#0f766e",
  "#0ea5e9",
  "#8b5cf6",
  "#f59e0b",
];

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

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value) ? value : 0,
  );
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

function getText(row: AnyRow, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }

  return fallback;
}

function getAmount(row: AnyRow, keys: string[]) {
  for (const key of keys) {
    const value = asNumber(row[key]);
    if (value > 0) return value;
  }

  return 0;
}

function getDisplayName(row: AnyRow, fallback: string) {
  const firstName = getText(row, ["first_name", "firstName"]);
  const lastName = getText(row, ["last_name", "lastName"]);

  if (firstName || lastName) return `${firstName} ${lastName}`.trim();

  return getText(
    row,
    ["full_name", "display_name", "name", "email"],
    fallback,
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getBookingDate(booking: BookingRow) {
  return (
    booking.booking_date ||
    booking.start_time ||
    booking.created_at ||
    booking.updated_at ||
    null
  );
}

function getBookingAmount(booking: BookingRow) {
  return getAmount(booking as AnyRow, [
    "total_customer_paid",
    "total_amount",
    "booking_total",
    "amount",
    "price",
  ]);
}

function getBookingPlatformRevenue(booking: BookingRow) {
  const explicitFee = getAmount(booking as AnyRow, [
    "platform_fee",
    "commission_amount",
    "sitguru_fee",
    "service_fee",
    "admin_fee",
  ]);

  if (explicitFee > 0) return explicitFee;

  const total = getBookingAmount(booking);
  const payout = getAmount(booking as AnyRow, [
    "guru_payout",
    "payout_amount",
    "sitter_payout",
    "provider_payout",
  ]);

  if (total > 0 && payout > 0 && total >= payout) {
    return total - payout;
  }

  return total > 0 ? total * 0.08 : 0;
}

function getCustomerId(booking: BookingRow) {
  return (
    booking.customer_id ||
    booking.pet_owner_id ||
    booking.client_id ||
    booking.user_id ||
    null
  );
}

function getGuruId(booking: BookingRow) {
  return booking.guru_id || booking.sitter_id || booking.provider_id || null;
}

function normalizeStatus(status?: string | null) {
  if (!status) return "Pending";

  const clean = status.toLowerCase();

  if (clean.includes("confirm")) return "Confirmed";
  if (clean.includes("pending")) return "Pending";
  if (clean.includes("cancel")) return "Canceled";
  if (clean.includes("complete")) return "Completed";
  if (clean.includes("paid")) return "Completed";
  if (clean.includes("active")) return "Confirmed";

  return status;
}

function normalizePayment(payment?: string | null) {
  if (!payment) return "unpaid";
  return payment.toLowerCase();
}

function isPaidBooking(booking: BookingRow) {
  const payment = normalizePayment(booking.payment_status);
  const status = normalizeStatus(booking.status || booking.booking_status).toLowerCase();

  return (
    payment === "paid" ||
    payment === "succeeded" ||
    status === "completed" ||
    status.includes("paid")
  );
}

function isCompletedBooking(booking: BookingRow) {
  return normalizeStatus(booking.status || booking.booking_status) === "Completed";
}

function isCanceledBooking(booking: BookingRow) {
  return normalizeStatus(booking.status || booking.booking_status) === "Canceled";
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

  if (normalized === "paid" || normalized === "succeeded") {
    return "border border-emerald-200 bg-emerald-100 text-emerald-900";
  }

  if (normalized.includes("checkout") || normalized.includes("process")) {
    return "border border-sky-200 bg-sky-100 text-sky-900";
  }

  if (normalized.includes("fail") || normalized.includes("cancel")) {
    return "border border-red-200 bg-red-100 text-red-900";
  }

  return "border border-amber-200 bg-amber-100 text-amber-900";
}

function filterButtonClasses(active: boolean) {
  return active
    ? "rounded-2xl bg-green-800 px-4 py-2.5 text-sm font-black text-white shadow-sm"
    : "rounded-2xl border border-green-200 bg-white px-4 py-2.5 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50";
}

function getCustomerLabel(
  booking: BookingRow,
  profilesMap: Map<string, ProfileRow>,
) {
  const customerId = getCustomerId(booking);

  if (customerId) {
    const profile = profilesMap.get(customerId);
    if (profile) return getDisplayName(profile as AnyRow, "Customer");
  }

  return (
    booking.customer_name ||
    booking.pet_parent_name ||
    booking.owner_name ||
    booking.customer_email ||
    "Customer"
  );
}

function getGuruLabel(
  booking: BookingRow,
  gurusMap: Map<string, GuruRow>,
  profilesMap: Map<string, ProfileRow>,
) {
  const guruId = getGuruId(booking);

  if (guruId) {
    const guru = gurusMap.get(guruId);
    if (guru) return getDisplayName(guru as AnyRow, "Guru");

    const profile = profilesMap.get(guruId);
    if (profile) return getDisplayName(profile as AnyRow, "Guru");
  }

  return (
    booking.guru_name ||
    booking.sitter_name ||
    booking.provider_name ||
    "Unassigned"
  );
}

function getBookingTitle(
  booking: BookingRow,
  gurusMap: Map<string, GuruRow>,
  profilesMap: Map<string, ProfileRow>,
) {
  const pet = booking.pet_name || "Pet";
  const guru = getGuruLabel(booking, gurusMap, profilesMap);

  return guru === "Unassigned" ? `${pet} booking` : `${pet} with ${guru}`;
}

function getServiceLabel(booking: BookingRow) {
  return (
    booking.service ||
    booking.service_type ||
    booking.booking_type ||
    "Not set"
  );
}

function getBookingCity(booking: BookingRow) {
  return booking.service_city || booking.city || "";
}

function getBookingState(booking: BookingRow) {
  return booking.service_state || booking.state || "";
}

function getBookingCountry(booking: BookingRow) {
  return booking.service_country || booking.country || "";
}

function getBookingLocation(booking: BookingRow) {
  return (
    [getBookingCity(booking), getBookingState(booking), getBookingCountry(booking)]
      .filter(Boolean)
      .join(", ") || "Unknown"
  );
}

function getPetInitial(name?: string | null) {
  const value = (name || "P").trim();
  return value.charAt(0).toUpperCase() || "P";
}

function normalizeQuery(value?: string) {
  return String(value || "").trim().toLowerCase();
}

function filteredBookings(
  bookings: BookingRow[],
  activeFilter: string,
  searchParams: Awaited<PageProps["searchParams"]>,
  profilesMap: Map<string, ProfileRow>,
  gurusMap: Map<string, GuruRow>,
) {
  const query = normalizeQuery(searchParams?.q);
  const service = normalizeQuery(searchParams?.service);
  const paymentFilter = normalizeQuery(searchParams?.payment);

  return bookings.filter((booking) => {
    const status = normalizeStatus(
      booking.status || booking.booking_status,
    ).toLowerCase();
    const payment = normalizePayment(booking.payment_status);
    const serviceLabel = getServiceLabel(booking).toLowerCase();
    const customerLabel = getCustomerLabel(booking, profilesMap);
    const guruLabel = getGuruLabel(booking, gurusMap, profilesMap);
    const location = getBookingLocation(booking);

    const searchText = [
      booking.id,
      booking.pet_name,
      customerLabel,
      guruLabel,
      serviceLabel,
      location,
      status,
      payment,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (activeFilter === "confirmed" && status !== "confirmed") return false;
    if (activeFilter === "pending" && status !== "pending") return false;
    if (activeFilter === "paid" && payment !== "paid" && payment !== "succeeded") {
      return false;
    }
    if (activeFilter === "completed" && status !== "completed") return false;
    if (activeFilter === "canceled" && status !== "canceled") return false;

    if (query && !searchText.includes(query)) return false;
    if (service && serviceLabel !== service) return false;
    if (paymentFilter && payment !== paymentFilter) return false;

    return true;
  });
}

function sortBookings(
  bookings: BookingRow[],
  searchParams: Awaited<PageProps["searchParams"]>,
  profilesMap: Map<string, ProfileRow>,
  gurusMap: Map<string, GuruRow>,
) {
  const sort = searchParams?.sort || "date";
  const order = searchParams?.order === "asc" ? "asc" : "desc";
  const direction = order === "asc" ? 1 : -1;

  return [...bookings].sort((a, b) => {
    if (sort === "booking") {
      return (
        getBookingTitle(a, gurusMap, profilesMap).localeCompare(
          getBookingTitle(b, gurusMap, profilesMap),
        ) * direction
      );
    }

    if (sort === "customer") {
      return (
        getCustomerLabel(a, profilesMap).localeCompare(
          getCustomerLabel(b, profilesMap),
        ) * direction
      );
    }

    if (sort === "guru") {
      return (
        getGuruLabel(a, gurusMap, profilesMap).localeCompare(
          getGuruLabel(b, gurusMap, profilesMap),
        ) * direction
      );
    }

    if (sort === "service") {
      return getServiceLabel(a).localeCompare(getServiceLabel(b)) * direction;
    }

    if (sort === "amount") {
      return (getBookingAmount(a) - getBookingAmount(b)) * direction;
    }

    if (sort === "status") {
      return (
        normalizeStatus(a.status || a.booking_status).localeCompare(
          normalizeStatus(b.status || b.booking_status),
        ) * direction
      );
    }

    if (sort === "payment") {
      return (
        normalizePayment(a.payment_status).localeCompare(
          normalizePayment(b.payment_status),
        ) * direction
      );
    }

    const aDate = getBookingDate(a) ? new Date(getBookingDate(a) as string).getTime() : 0;
    const bDate = getBookingDate(b) ? new Date(getBookingDate(b) as string).getTime() : 0;

    return (aDate - bDate) * direction;
  });
}

function sortHref(
  searchParams: Awaited<PageProps["searchParams"]>,
  sort: string,
) {
  const params = new URLSearchParams();

  if (searchParams?.filter && searchParams.filter !== "all") {
    params.set("filter", searchParams.filter);
  }

  if (searchParams?.q) params.set("q", searchParams.q);
  if (searchParams?.service) params.set("service", searchParams.service);
  if (searchParams?.payment) params.set("payment", searchParams.payment);

  const nextOrder =
    searchParams?.sort === sort && searchParams?.order !== "asc" ? "asc" : "desc";

  params.set("sort", sort);
  params.set("order", nextOrder);

  return `/admin/bookings?${params.toString()}`;
}

function buildChartRows(
  bookings: BookingRow[],
  getLabel: (booking: BookingRow) => string,
  getHref?: (label: string) => string,
) {
  const map = new Map<
    string,
    {
      label: string;
      value: number;
      bookings: number;
      href?: string;
    }
  >();

  for (const booking of bookings) {
    const label = getLabel(booking) || "Unknown";
    const existing =
      map.get(label) ||
      {
        label,
        value: 0,
        bookings: 0,
        href: getHref?.(label),
      };

    existing.value += getBookingAmount(booking);
    existing.bookings += 1;

    map.set(label, existing);
  }

  return Array.from(map.values())
    .map((item) => ({
      label: item.label,
      value: item.value,
      helper: `${number(item.bookings)} bookings`,
      href: item.href,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

function buildStatusChart(bookings: BookingRow[]) {
  const statuses = ["Confirmed", "Pending", "Completed", "Canceled"];

  return statuses.map((status) => {
    const matching = bookings.filter(
      (booking) =>
        normalizeStatus(booking.status || booking.booking_status) === status,
    );

    return {
      label: status,
      value: matching.length,
      helper: `${money(
        matching.reduce((sum, booking) => sum + getBookingAmount(booking), 0),
      )} value`,
      href:
        status === "Confirmed"
          ? "/admin/bookings?filter=confirmed"
          : status === "Pending"
            ? "/admin/bookings?filter=pending"
            : status === "Completed"
              ? "/admin/bookings?filter=completed"
              : "/admin/bookings?filter=canceled",
    };
  });
}

function buildPaymentChart(bookings: BookingRow[]) {
  const map = new Map<string, BookingRow[]>();

  for (const booking of bookings) {
    const label = normalizePayment(booking.payment_status);
    const existing = map.get(label) || [];
    existing.push(booking);
    map.set(label, existing);
  }

  return Array.from(map.entries())
    .map(([label, rows]) => ({
      label,
      value: rows.reduce((sum, booking) => sum + getBookingAmount(booking), 0),
      helper: `${number(rows.length)} bookings`,
      href: `/admin/bookings?payment=${encodeURIComponent(label)}`,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
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
      <div className="h-16 w-16 overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm md:h-20 md:w-20">
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
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-green-100 bg-green-50 text-2xl font-black text-green-800 shadow-sm md:h-20 md:w-20">
      {getPetInitial(petName)}
    </div>
  );
}

function Avatar({
  name,
  src,
  icon,
}: {
  name: string;
  src?: string | null;
  icon?: ReactNode;
}) {
  if (src) {
    return (
      <img
        alt={name}
        className="h-10 w-10 shrink-0 rounded-full object-cover"
        src={src}
      />
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-xs font-black text-green-800">
      {icon || getInitials(name) || "SG"}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
  href,
}: {
  icon: ReactNode;
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

function HorizontalBarChart({
  title,
  valueLabel,
  items,
  valueFormatter = money,
  emptyLabel = "No chart data found yet.",
}: {
  title: string;
  valueLabel: string;
  items: ChartItem[];
  valueFormatter?: (value: number) => string;
  emptyLabel?: string;
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 0);

  return (
    <div className="rounded-[24px] border border-[#edf3ee] bg-[#fbfcf9] p-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-base font-black text-slate-950">{title}</h3>
        <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
          {valueLabel}
        </span>
      </div>

      <div className="space-y-4">
        {items.length ? (
          items.map((item, index) => {
            const width = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
            const chart = (
              <>
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">
                      {item.label}
                    </p>
                    {item.helper ? (
                      <p className="truncate text-xs font-bold text-slate-500">
                        {item.helper}
                      </p>
                    ) : null}
                  </div>

                  <p className="shrink-0 text-sm font-black text-green-800">
                    {valueFormatter(item.value)}
                  </p>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-green-800"
                    style={{
                      width: `${Math.max(3, width)}%`,
                      backgroundColor: chartColors[index % chartColors.length],
                    }}
                  />
                </div>
              </>
            );

            if (item.href) {
              return (
                <Link
                  key={`${item.label}-${index}`}
                  href={item.href}
                  className="block rounded-2xl border border-transparent p-2 transition hover:border-green-100 hover:bg-white hover:shadow-sm"
                >
                  {chart}
                </Link>
              );
            }

            return <div key={`${item.label}-${index}`}>{chart}</div>;
          })
        ) : (
          <div className="rounded-2xl border border-white bg-white p-4 text-sm font-bold text-slate-500">
            {emptyLabel}
          </div>
        )}
      </div>
    </div>
  );
}

function DonutChart({
  title,
  total,
  items,
}: {
  title: string;
  total: number;
  items: ChartItem[];
}) {
  const safeTotal = items.reduce((sum, item) => sum + item.value, 0);
  let start = 0;

  const gradient =
    safeTotal > 0
      ? items
          .map((item, index) => {
            const size = (item.value / safeTotal) * 360;
            const end = start + size;
            const segment = `${chartColors[index % chartColors.length]} ${start}deg ${end}deg`;
            start = end;
            return segment;
          })
          .join(", ")
      : "#e5e7eb 0deg 360deg";

  return (
    <div className="grid items-center gap-5 sm:grid-cols-[180px_1fr] xl:grid-cols-1 2xl:grid-cols-[180px_1fr]">
      <div className="relative mx-auto h-[180px] w-[180px]">
        <div
          className="h-full w-full rounded-full"
          style={{ background: `conic-gradient(${gradient})` }}
        />
        <div className="absolute inset-[34px] flex flex-col items-center justify-center rounded-full bg-white shadow-inner">
          <span className="text-3xl font-black text-slate-950">
            {number(total)}
          </span>
          <span className="text-xs font-bold text-slate-500">{title}</span>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <Link
            href={item.href || adminRoutes.bookings}
            key={item.label}
            className="flex items-center justify-between gap-3 rounded-2xl p-2 text-sm font-bold transition hover:bg-green-50"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{
                  backgroundColor: chartColors[index % chartColors.length],
                }}
              />
              <div className="min-w-0">
                <p className="truncate text-slate-700">{item.label}</p>
                <p className="truncate text-xs text-slate-400">{item.helper}</p>
              </div>
            </div>
            <span className="shrink-0 text-slate-950">
              {number(item.value)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function BookingMobileCard({
  booking,
  petImageUrl,
  profilesMap,
  gurusMap,
}: {
  booking: BookingRow;
  petImageUrl?: string | null;
  profilesMap: Map<string, ProfileRow>;
  gurusMap: Map<string, GuruRow>;
}) {
  const status = normalizeStatus(booking.status || booking.booking_status);
  const payment = booking.payment_status || "unpaid";

  return (
    <Link
      href={`/admin/bookings/${booking.id}`}
      className="block rounded-[26px] border border-[#e3ece5] bg-white p-4 shadow-sm transition hover:border-green-200 hover:shadow-md lg:hidden"
    >
      <div className="flex gap-4">
        <PetThumb imageUrl={petImageUrl} petName={booking.pet_name} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-black text-slate-950">
            {getBookingTitle(booking, gurusMap, profilesMap)}
          </p>
          <p className="mt-1 text-sm font-bold text-slate-500">
            {getServiceLabel(booking)}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${statusClasses(
                status,
              )}`}
            >
              {status}
            </span>

            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${paymentClasses(
                payment,
              )}`}
            >
              {payment}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl bg-[#f8fbf6] p-4 text-sm font-bold text-slate-600">
        <div className="flex items-center justify-between gap-3">
          <span>Customer</span>
          <span className="text-right text-slate-950">
            {getCustomerLabel(booking, profilesMap)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span>Guru</span>
          <span className="text-right text-slate-950">
            {getGuruLabel(booking, gurusMap, profilesMap)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span>Date</span>
          <span className="text-right text-slate-950">
            {formatDate(getBookingDate(booking))}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span>Amount</span>
          <span className="text-right text-slate-950">
            {money(getBookingAmount(booking))}
          </span>
        </div>
      </div>
    </Link>
  );
}

function SortLink({
  label,
  sort,
  searchParams,
}: {
  label: string;
  sort: string;
  searchParams: Awaited<PageProps["searchParams"]>;
}) {
  const active = searchParams?.sort === sort;

  return (
    <Link
      href={sortHref(searchParams, sort)}
      className={`inline-flex items-center gap-1 text-xs font-black uppercase tracking-[0.12em] transition ${
        active ? "text-green-800" : "text-slate-500 hover:text-green-800"
      }`}
    >
      {label}
      {active ? (searchParams?.order === "asc" ? "↑" : "↓") : null}
    </Link>
  );
}

async function safeAdminQuery(
  query: PromiseLike<SafeAdminQueryResponse>,
  label: string,
): Promise<SafeAdminQueryResponse> {
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

async function getBookings(): Promise<BookingRow[]> {
  const { data } = await safeAdminQuery(
    supabaseAdmin
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000),
    "bookings",
  );

  return (data ?? []) as BookingRow[];
}

async function getProfilesByIds(ids: string[]) {
  if (ids.length === 0) return [];

  const { data } = await safeAdminQuery(
    supabaseAdmin
      .from("profiles")
      .select("id, full_name, display_name, first_name, last_name, email, avatar_url")
      .in("id", ids),
    "profiles",
  );

  return (data ?? []) as ProfileRow[];
}

async function getGurusByIds(ids: string[]) {
  if (ids.length === 0) return [];

  const { data } = await safeAdminQuery(
    supabaseAdmin
      .from("gurus")
      .select(
        "id, user_id, profile_id, display_name, full_name, first_name, last_name, email, profile_photo_url, avatar_url",
      )
      .or(
        `id.in.(${ids.join(",")}),user_id.in.(${ids.join(
          ",",
        )}),profile_id.in.(${ids.join(",")})`,
      ),
    "gurus",
  );

  return (data ?? []) as GuruRow[];
}

async function getPetMediaByPetIds(ids: string[]) {
  if (ids.length === 0) return [];

  const { data } = await safeAdminQuery(
    supabaseAdmin
      .from("pet_media")
      .select("pet_id, file_url, file_type, visibility, created_at")
      .in("pet_id", ids)
      .order("created_at", { ascending: false }),
    "pet_media",
  );

  return (data ?? []) as PetMediaRow[];
}

export default async function AdminBookingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const activeFilter = params?.filter || "all";

  const bookings = await getBookings();

  const customerIds = Array.from(
    new Set(
      bookings
        .map((booking) => getCustomerId(booking))
        .filter(Boolean) as string[],
    ),
  );

  const guruIds = Array.from(
    new Set(
      bookings.map((booking) => getGuruId(booking)).filter(Boolean) as string[],
    ),
  );

  const profileLookupIds = Array.from(new Set([...customerIds, ...guruIds]));

  const petIds = Array.from(
    new Set(bookings.map((booking) => booking.pet_id).filter(Boolean) as string[]),
  );

  const [profiles, gurus, petMedia] = await Promise.all([
    getProfilesByIds(profileLookupIds),
    getGurusByIds(guruIds),
    getPetMediaByPetIds(petIds),
  ]);

  const profilesMap = new Map(profiles.map((profile) => [profile.id, profile]));

  const gurusMap = new Map<string, GuruRow>();
  for (const guru of gurus) {
    if (guru.id) gurusMap.set(guru.id, guru);
    if (guru.user_id) gurusMap.set(guru.user_id, guru);
    if (guru.profile_id) gurusMap.set(guru.profile_id, guru);
  }

  const petImageMap = new Map<string, string>();

  for (const item of petMedia) {
    const petId = item.pet_id || "";
    if (!petId || petImageMap.has(petId)) continue;

    const fileType = String(item.file_type || "").toLowerCase();
    if (!fileType.includes("image")) continue;
    if (!item.file_url) continue;

    petImageMap.set(petId, item.file_url);
  }

  const filtered = filteredBookings(
    bookings,
    activeFilter,
    params,
    profilesMap,
    gurusMap,
  );

  const sortedFiltered = sortBookings(filtered, params, profilesMap, gurusMap);

  const confirmedCount = bookings.filter(
    (booking) =>
      normalizeStatus(booking.status || booking.booking_status) === "Confirmed",
  ).length;

  const pendingCount = bookings.filter(
    (booking) =>
      normalizeStatus(booking.status || booking.booking_status) === "Pending",
  ).length;

  const completedCount = bookings.filter(isCompletedBooking).length;
  const canceledCount = bookings.filter(isCanceledBooking).length;
  const paidCount = bookings.filter(isPaidBooking).length;

  const totalRevenue = bookings.reduce(
    (sum, booking) => sum + getBookingAmount(booking),
    0,
  );

  const completedRevenue = bookings
    .filter((booking) => isPaidBooking(booking) || isCompletedBooking(booking))
    .reduce((sum, booking) => sum + getBookingAmount(booking), 0);

  const platformRevenue = bookings
    .filter((booking) => isPaidBooking(booking) || isCompletedBooking(booking))
    .reduce((sum, booking) => sum + getBookingPlatformRevenue(booking), 0);

  const filteredRevenue = sortedFiltered.reduce(
    (sum, booking) => sum + getBookingAmount(booking),
    0,
  );

  const averageBookingValue =
    bookings.length > 0 ? totalRevenue / bookings.length : 0;

  const services = Array.from(
    new Set(bookings.map((booking) => getServiceLabel(booking)).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));

  const payments = Array.from(
    new Set(
      bookings.map((booking) => normalizePayment(booking.payment_status)).filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const statusChart = buildStatusChart(bookings);
  const serviceChart = buildChartRows(
    bookings,
    getServiceLabel,
    (label) => `/admin/bookings?service=${encodeURIComponent(label)}`,
  );
  const cityChart = buildChartRows(
    bookings,
    (booking) => getBookingCity(booking) || "Unknown",
  );
  const guruChart = buildChartRows(bookings, (booking) =>
    getGuruLabel(booking, gurusMap, profilesMap),
  );
  const paymentChart = buildPaymentChart(bookings);

  return (
    <main className="min-h-screen bg-[#f9faf5] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <div className="flex flex-col justify-between gap-4 rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm lg:flex-row lg:items-end">
          <div>
            <Link
              href={adminRoutes.dashboard}
              className="mb-4 inline-flex items-center gap-2 text-sm font-black text-green-800 transition hover:text-green-950"
            >
              <ArrowLeft size={17} />
              Back to Admin Dashboard
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-800 text-white">
                <CalendarDays size={26} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">
                  Admin / Booking Operations
                </p>
                <h1 className="text-3xl font-black tracking-tight text-green-950 sm:text-4xl">
                  Booking Manager
                </h1>
                <p className="mt-1 text-base font-semibold text-slate-600">
                  Real Supabase bookings with customer, Guru, pet, payment,
                  status, revenue, charts, filters, sorting, and export support.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={adminRoutes.bookingsExport}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
            >
              <Download size={17} />
              Export CSV
            </Link>

            <Link
              href={adminRoutes.financials}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
            >
              <ReceiptText size={17} />
              Financials
            </Link>

            <Link
              href={adminRoutes.newBooking}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
            >
              <Plus size={18} />
              New Booking
            </Link>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            icon={<CalendarDays size={22} />}
            label="Total Bookings"
            value={number(bookings.length)}
            detail="Loaded from Supabase bookings"
            href={adminRoutes.bookings}
          />

          <StatCard
            icon={<CheckCircle2 size={22} />}
            label="Confirmed"
            value={number(confirmedCount)}
            detail="Confirmed booking status"
            href="/admin/bookings?filter=confirmed"
          />

          <StatCard
            icon={<Clock3 size={22} />}
            label="Pending"
            value={number(pendingCount)}
            detail="Waiting for confirmation"
            href="/admin/bookings?filter=pending"
          />

          <StatCard
            icon={<CreditCard size={22} />}
            label="Paid"
            value={number(paidCount)}
            detail={`${money(completedRevenue)} paid or completed value`}
            href="/admin/bookings?filter=paid"
          />

          <StatCard
            icon={<CircleDollarSign size={22} />}
            label="Filtered Value"
            value={money(filteredRevenue)}
            detail={`${number(sortedFiltered.length)} visible bookings`}
          />
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<CalendarCheck size={22} />}
            label="Completed"
            value={number(completedCount)}
            detail="Completed booking rows"
            href="/admin/bookings?filter=completed"
          />

          <StatCard
            icon={<XCircle size={22} />}
            label="Canceled"
            value={number(canceledCount)}
            detail="Canceled booking rows"
            href="/admin/bookings?filter=canceled"
          />

          <StatCard
            icon={<TrendingUp size={22} />}
            label="Avg. Booking Value"
            value={money(averageBookingValue)}
            detail={`${money(totalRevenue)} total booking value`}
          />

          <StatCard
            icon={<BarChart3 size={22} />}
            label="Platform Revenue"
            value={money(platformRevenue)}
            detail="Fees/commission found or estimated"
            href={adminRoutes.financials}
          />
        </section>

        <section className="grid items-start gap-5 xl:grid-cols-12">
          <div className="xl:col-span-4">
            <div className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
              <div className="mb-5">
                <h2 className="text-xl font-black text-slate-950">
                  Booking Status Chart
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Drill into current booking status groups.
                </p>
              </div>

              <DonutChart
                title="Bookings"
                total={bookings.length}
                items={statusChart}
              />
            </div>
          </div>

          <div className="xl:col-span-8">
            <div className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <h2 className="text-xl font-black text-slate-950">
                    Booking Revenue Charts
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Revenue by service, city, Guru, and payment status.
                  </p>
                </div>

                <Link
                  href={adminRoutes.bookingsExport}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-3 text-sm font-black text-white transition hover:bg-green-900"
                >
                  <Download size={16} />
                  Export
                </Link>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <HorizontalBarChart
                  title="Revenue by Service"
                  valueLabel="Revenue"
                  items={serviceChart}
                />

                <HorizontalBarChart
                  title="Revenue by Payment Status"
                  valueLabel="Revenue"
                  items={paymentChart}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="grid items-start gap-5 xl:grid-cols-2">
          <div className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <MapPin className="text-green-800" size={22} />
              <div>
                <h2 className="text-xl font-black text-slate-950">
                  Booking Cities
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Local market demand by booking value.
                </p>
              </div>
            </div>

            <HorizontalBarChart
              title="Top Cities by Revenue"
              valueLabel="Revenue"
              items={cityChart}
            />
          </div>

          <div className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <UsersRound className="text-green-800" size={22} />
              <div>
                <h2 className="text-xl font-black text-slate-950">
                  Guru Booking Revenue
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Gurus ranked by booking value.
                </p>
              </div>
            </div>

            <HorizontalBarChart
              title="Top Gurus by Booking Value"
              valueLabel="Revenue"
              items={guruChart}
            />
          </div>
        </section>

        <section className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <h2 className="text-xl font-black text-slate-950">
                Booking Records
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Search, filter, sort, and review booking operations data.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <Link
                  key={filter.key}
                  href={filter.href}
                  className={filterButtonClasses(activeFilter === filter.key)}
                >
                  {filter.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-[#edf3ee] bg-[#fbfcf9] p-4">
            <form
              action={adminRoutes.bookings}
              className="grid gap-3 xl:grid-cols-[1.5fr_1fr_1fr_auto]"
            >
              <input type="hidden" name="filter" value={activeFilter} />

              <label className="relative">
                <span className="sr-only">Search bookings</span>
                <Search
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  name="q"
                  defaultValue={params?.q || ""}
                  placeholder="Search booking, pet, customer, Guru, city..."
                  className="h-12 w-full rounded-2xl border border-green-100 bg-white pl-11 pr-4 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-green-300 focus:ring-4 focus:ring-green-100"
                />
              </label>

              <select
                name="service"
                defaultValue={params?.service || ""}
                className="h-12 w-full rounded-2xl border border-green-100 bg-white px-4 text-sm font-black text-slate-800 outline-none transition focus:border-green-300 focus:ring-4 focus:ring-green-100"
              >
                <option value="">Service: All</option>
                {services.map((service) => (
                  <option key={service} value={service}>
                    Service: {service}
                  </option>
                ))}
              </select>

              <select
                name="payment"
                defaultValue={params?.payment || ""}
                className="h-12 w-full rounded-2xl border border-green-100 bg-white px-4 text-sm font-black text-slate-800 outline-none transition focus:border-green-300 focus:ring-4 focus:ring-green-100"
              >
                <option value="">Payment: All</option>
                {payments.map((payment) => (
                  <option key={payment} value={payment}>
                    Payment: {payment}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-green-800 px-5 text-sm font-black text-white transition hover:bg-green-900"
                >
                  Filter
                </button>

                <Link
                  href={adminRoutes.bookings}
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-green-200 bg-white px-4 text-sm font-black text-green-900 transition hover:bg-green-50"
                >
                  Reset
                </Link>
              </div>
            </form>
          </div>
        </section>

        <section className="space-y-3 lg:hidden">
          {sortedFiltered.map((booking) => {
            const petImageUrl =
              booking.pet_photo_url ||
              (booking.pet_id ? petImageMap.get(booking.pet_id) || null : null);

            return (
              <BookingMobileCard
                key={booking.id}
                booking={booking}
                petImageUrl={petImageUrl}
                profilesMap={profilesMap}
                gurusMap={gurusMap}
              />
            );
          })}

          {sortedFiltered.length === 0 ? (
            <div className="rounded-[26px] border border-[#e3ece5] bg-white p-8 text-center shadow-sm">
              <Search className="mx-auto mb-3 text-slate-400" size={34} />
              <p className="text-base font-black text-slate-950">
                No bookings matched these filters.
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Try another status filter or create a new booking.
              </p>
            </div>
          ) : null}
        </section>

        <section className="hidden overflow-hidden rounded-[30px] border border-[#e3ece5] bg-white shadow-sm lg:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1420px]">
              <thead className="bg-[#f7faf4]">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <SortLink label="Booking" sort="booking" searchParams={params} />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    Pet
                  </th>
                  <th className="px-6 py-4 text-left">
                    <SortLink label="Customer" sort="customer" searchParams={params} />
                  </th>
                  <th className="px-6 py-4 text-left">
                    <SortLink label="Guru" sort="guru" searchParams={params} />
                  </th>
                  <th className="px-6 py-4 text-left">
                    <SortLink label="Service" sort="service" searchParams={params} />
                  </th>
                  <th className="px-6 py-4 text-left">
                    <SortLink label="Date" sort="date" searchParams={params} />
                  </th>
                  <th className="px-6 py-4 text-left">
                    <SortLink label="Amount" sort="amount" searchParams={params} />
                  </th>
                  <th className="px-6 py-4 text-left">
                    <SortLink label="Status" sort="status" searchParams={params} />
                  </th>
                  <th className="px-6 py-4 text-left">
                    <SortLink label="Payment" sort="payment" searchParams={params} />
                  </th>
                </tr>
              </thead>

              <tbody>
                {sortedFiltered.map((booking) => {
                  const petImageUrl =
                    booking.pet_photo_url ||
                    (booking.pet_id
                      ? petImageMap.get(booking.pet_id) || null
                      : null);

                  const customerName = getCustomerLabel(booking, profilesMap);
                  const guruName = getGuruLabel(booking, gurusMap, profilesMap);
                  const status = normalizeStatus(
                    booking.status || booking.booking_status,
                  );
                  const payment = booking.payment_status || "unpaid";

                  return (
                    <tr
                      key={booking.id}
                      className="border-t border-[#edf3ee] align-middle transition hover:bg-[#fbfcf9]"
                    >
                      <td className="px-6 py-5">
                        <Link
                          href={`/admin/bookings/${booking.id}`}
                          className="group"
                        >
                          <p className="max-w-[230px] truncate text-base font-black text-green-900 transition group-hover:text-green-700">
                            {getBookingTitle(booking, gurusMap, profilesMap)}
                          </p>
                          <p className="mt-1 text-xs font-bold text-slate-500">
                            Created {formatDateTime(booking.created_at)}
                          </p>
                        </Link>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <PetThumb
                            imageUrl={petImageUrl}
                            petName={booking.pet_name}
                          />

                          <div className="min-w-0">
                            <div className="truncate text-base font-black text-slate-950">
                              {booking.pet_name || "Not set"}
                            </div>
                            <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-500">
                              <PawPrint size={13} />
                              {booking.pet_id
                                ? `Pet ID: ${booking.pet_id}`
                                : "No pet id"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <Link
                          href={
                            getCustomerId(booking)
                              ? `/admin/customers/${getCustomerId(booking)}`
                              : adminRoutes.customers
                          }
                          className="flex items-center gap-3 transition hover:text-green-800"
                        >
                          <Avatar
                            name={customerName}
                            src={
                              getCustomerId(booking)
                                ? profilesMap.get(getCustomerId(booking) || "")
                                    ?.avatar_url
                                : null
                            }
                            icon={<UserRound size={18} />}
                          />
                          <span className="max-w-[170px] truncate font-black text-slate-950">
                            {customerName}
                          </span>
                        </Link>
                      </td>

                      <td className="px-6 py-5">
                        <Link
                          href={
                            getGuruId(booking)
                              ? `/admin/gurus/${getGuruId(booking)}`
                              : adminRoutes.gurus
                          }
                          className="flex items-center gap-3 transition hover:text-green-800"
                        >
                          <Avatar
                            name={guruName}
                            src={
                              getGuruId(booking)
                                ? gurusMap.get(getGuruId(booking) || "")
                                    ?.profile_photo_url ||
                                  gurusMap.get(getGuruId(booking) || "")
                                    ?.avatar_url ||
                                  profilesMap.get(getGuruId(booking) || "")
                                    ?.avatar_url
                                : null
                            }
                            icon={<UsersRound size={18} />}
                          />
                          <span className="max-w-[170px] truncate font-black text-slate-950">
                            {guruName}
                          </span>
                        </Link>
                      </td>

                      <td className="px-6 py-5 font-bold text-slate-700">
                        {getServiceLabel(booking)}
                        <span className="mt-1 flex items-center gap-1 text-xs font-bold text-slate-400">
                          <MapPin size={12} />
                          {getBookingLocation(booking)}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <p className="font-black text-slate-950">
                          {formatDate(getBookingDate(booking))}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          {booking.start_time
                            ? formatDateTime(booking.start_time)
                            : "Time not set"}
                        </p>
                      </td>

                      <td className="px-6 py-5 font-black text-slate-950">
                        {money(getBookingAmount(booking))}
                        <span className="block text-xs font-bold text-green-700">
                          {money(getBookingPlatformRevenue(booking))} platform
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-black ${statusClasses(
                            status,
                          )}`}
                        >
                          {status === "Canceled" ? (
                            <XCircle size={14} />
                          ) : status === "Confirmed" ||
                            status === "Completed" ? (
                            <CheckCircle2 size={14} />
                          ) : (
                            <Clock3 size={14} />
                          )}
                          {status}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-4 py-1.5 text-xs font-black ${paymentClasses(
                            payment,
                          )}`}
                        >
                          {payment}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {sortedFiltered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-14 text-center text-base font-bold text-slate-500"
                    >
                      <Search className="mx-auto mb-3 text-slate-400" size={34} />
                      <p className="text-base font-black text-slate-950">
                        No bookings matched these filters.
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        Try another status filter or create a new booking.
                      </p>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <div className="rounded-[26px] border border-green-100 bg-white p-4 text-sm font-semibold text-slate-500 shadow-sm">
          <span className="font-black text-green-900">Supabase coordination:</span>{" "}
          this page reads bookings, profiles, gurus, and pet_media directly from
          Supabase. Customer, Guru, pet photo, status, payment, booking value,
          platform revenue, charts, filters, sorting, and export links are all
          calculated from real rows.
        </div>
      </div>
    </main>
  );
}