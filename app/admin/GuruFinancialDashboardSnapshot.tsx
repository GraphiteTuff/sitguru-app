import type { ReactNode } from "react";
import Link from "next/link";
import {
  Banknote,
  BarChart3,
  CalendarCheck,
  CircleDollarSign,
  MapPin,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/admin";

type AnyRow = Record<string, unknown>;

type SafeAdminQueryResponse = {
  data: unknown;
  error: unknown;
};

type GuruFinancialSnapshot = {
  completedRevenue: number;
  guruPayouts: number;
  platformRevenue: number;
  completedBookings: number;
  activeRevenueGurus: number;
  averageRevenuePerGuru: number;
  averageBookingValue: number;
  topGuruName: string;
  topGuruRevenue: number;
  topCity: string;
  topCityRevenue: number;
};

const adminRoutes = {
  guruPerformance: "/admin/guru-performance",
  guruPerformanceExport: "/admin/guru-performance/export",
  gurus: "/admin/gurus",
  bookings: "/admin/bookings",
  financials: "/admin/financials",
  commissions: "/admin/commissions",
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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

function getBookingGuruId(booking: AnyRow) {
  return (
    getText(booking, ["guru_id"]) ||
    getText(booking, ["sitter_id"]) ||
    getText(booking, ["provider_id"]) ||
    getText(booking, ["caregiver_id"]) ||
    getText(booking, ["assigned_guru_id"]) ||
    getText(booking, ["user_id"]) ||
    "unknown"
  );
}

function getGuruNameFromBooking(booking: AnyRow) {
  return getText(
    booking,
    ["guru_name", "sitter_name", "provider_name", "caregiver_name"],
    "Guru",
  );
}

function getBookingCity(booking: AnyRow) {
  return getText(
    booking,
    ["city", "service_city", "customer_city", "booking_city"],
    "Unknown",
  );
}

function getBookingAmount(booking: AnyRow) {
  return getAmount(booking, [
    "total_customer_paid",
    "total_amount",
    "booking_total",
    "amount_paid",
    "amount",
    "price",
    "subtotal",
  ]);
}

function getBookingPayout(booking: AnyRow) {
  return getAmount(booking, [
    "guru_payout",
    "payout_amount",
    "sitter_payout",
    "provider_payout",
    "caregiver_payout",
    "earnings_amount",
  ]);
}

function getPlatformRevenue(booking: AnyRow) {
  const explicitPlatformRevenue = getAmount(booking, [
    "platform_fee",
    "commission_amount",
    "sitguru_fee",
    "sitguru_fee_amount",
    "service_fee",
    "admin_fee",
    "commission",
  ]);

  if (explicitPlatformRevenue > 0) return explicitPlatformRevenue;

  const bookingAmount = getBookingAmount(booking);
  const guruPayout = getBookingPayout(booking);

  if (bookingAmount > 0 && guruPayout > 0 && bookingAmount >= guruPayout) {
    return bookingAmount - guruPayout;
  }

  return bookingAmount > 0 ? bookingAmount * 0.08 : 0;
}

function getBookingStatus(booking: AnyRow) {
  return getText(
    booking,
    ["status", "booking_status", "payment_status"],
    "",
  ).toLowerCase();
}

function isCompletedOrPaidBooking(booking: AnyRow) {
  const status = getBookingStatus(booking);

  return (
    status.includes("complete") ||
    status.includes("paid") ||
    status.includes("confirmed") ||
    status.includes("succeeded")
  );
}

async function safeAdminQuery(
  query: PromiseLike<SafeAdminQueryResponse>,
  label: string,
): Promise<SafeAdminQueryResponse> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Guru financial dashboard query skipped for ${label}:`, result.error);
      return { data: [], error: null };
    }

    return result;
  } catch (error) {
    console.warn(`Guru financial dashboard query skipped for ${label}:`, error);
    return { data: [], error: null };
  }
}

async function getGuruFinancialSnapshot(): Promise<GuruFinancialSnapshot> {
  const bookingsResult = await safeAdminQuery(
    supabaseAdmin
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5000),
    "bookings",
  );

  const bookings = ((bookingsResult.data || []) as AnyRow[]).filter(Boolean);

  const completedBookings = bookings.filter(isCompletedOrPaidBooking);

  const guruMap = new Map<
    string,
    {
      name: string;
      revenue: number;
      payouts: number;
      platformRevenue: number;
      bookings: number;
    }
  >();

  const cityMap = new Map<
    string,
    {
      revenue: number;
      bookings: number;
    }
  >();

  for (const booking of completedBookings) {
    const guruId = getBookingGuruId(booking);
    const guruName = getGuruNameFromBooking(booking);
    const city = getBookingCity(booking);
    const revenue = getBookingAmount(booking);
    const payout = getBookingPayout(booking);
    const platformRevenue = getPlatformRevenue(booking);

    const guruExisting =
      guruMap.get(guruId) ||
      {
        name: guruName,
        revenue: 0,
        payouts: 0,
        platformRevenue: 0,
        bookings: 0,
      };

    guruExisting.name =
      guruExisting.name && guruExisting.name !== "Guru"
        ? guruExisting.name
        : guruName;
    guruExisting.revenue += revenue;
    guruExisting.payouts += payout;
    guruExisting.platformRevenue += platformRevenue;
    guruExisting.bookings += 1;

    guruMap.set(guruId, guruExisting);

    const cityExisting =
      cityMap.get(city) ||
      {
        revenue: 0,
        bookings: 0,
      };

    cityExisting.revenue += revenue;
    cityExisting.bookings += 1;

    cityMap.set(city, cityExisting);
  }

  const gurus = Array.from(guruMap.values());
  const cities = Array.from(cityMap.entries());

  const completedRevenue = gurus.reduce((sum, guru) => sum + guru.revenue, 0);
  const guruPayouts = gurus.reduce((sum, guru) => sum + guru.payouts, 0);
  const platformRevenue = gurus.reduce(
    (sum, guru) => sum + guru.platformRevenue,
    0,
  );

  const activeRevenueGurus = gurus.filter((guru) => guru.revenue > 0).length;

  const averageRevenuePerGuru =
    activeRevenueGurus > 0 ? completedRevenue / activeRevenueGurus : 0;

  const averageBookingValue =
    completedBookings.length > 0 ? completedRevenue / completedBookings.length : 0;

  const topGuru = [...gurus].sort((a, b) => b.revenue - a.revenue)[0];

  const topCity = [...cities].sort((a, b) => b[1].revenue - a[1].revenue)[0];

  return {
    completedRevenue,
    guruPayouts,
    platformRevenue,
    completedBookings: completedBookings.length,
    activeRevenueGurus,
    averageRevenuePerGuru,
    averageBookingValue,
    topGuruName: topGuru?.name || "None yet",
    topGuruRevenue: topGuru?.revenue || 0,
    topCity: topCity?.[0] || "None yet",
    topCityRevenue: topCity?.[1]?.revenue || 0,
  };
}

function DashboardCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[28px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      {children}
    </div>
  );
}

function SnapshotTile({
  href,
  icon,
  title,
  value,
  detail,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4 transition hover:-translate-y-0.5 hover:border-green-200 hover:bg-green-50"
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-green-50 text-green-800 transition group-hover:bg-green-800 group-hover:text-white">
        {icon}
      </div>

      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>

      <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{detail}</p>
    </Link>
  );
}

function CompactMetricRow({
  href,
  title,
  value,
  detail,
  icon,
}: {
  href: string;
  title: string;
  value: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 rounded-2xl border border-[#f0f4f1] bg-white p-4 transition hover:border-green-200 hover:bg-green-50"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-800 transition group-hover:bg-green-800 group-hover:text-white">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-950">{title}</p>
          <p className="truncate text-xs font-bold text-slate-500">{detail}</p>
        </div>
      </div>

      <p className="shrink-0 text-sm font-black text-green-800">{value}</p>
    </Link>
  );
}

export default async function GuruFinancialDashboardSnapshot() {
  const snapshot = await getGuruFinancialSnapshot();

  return (
    <DashboardCard>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-950">
            Guru Financial Performance
          </h2>
          <p className="text-sm font-semibold text-slate-500">
            Revenue, payouts, platform revenue, top Guru, and top local market.
          </p>
        </div>

        <Link
          href={adminRoutes.guruPerformance}
          className="shrink-0 text-sm font-black text-green-800"
        >
          View all
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SnapshotTile
          href={adminRoutes.guruPerformance}
          icon={<CircleDollarSign size={18} />}
          title="Guru Revenue"
          value={money(snapshot.completedRevenue)}
          detail={`${number(snapshot.completedBookings)} completed bookings`}
        />

        <SnapshotTile
          href={adminRoutes.commissions}
          icon={<WalletCards size={18} />}
          title="Guru Payouts"
          value={money(snapshot.guruPayouts)}
          detail="Tracked payout obligation"
        />

        <SnapshotTile
          href={adminRoutes.financials}
          icon={<Banknote size={18} />}
          title="SitGuru Revenue"
          value={money(snapshot.platformRevenue)}
          detail="Platform fees and commission"
        />

        <SnapshotTile
          href={adminRoutes.gurus}
          icon={<Users size={18} />}
          title="Revenue Gurus"
          value={number(snapshot.activeRevenueGurus)}
          detail={`${money(snapshot.averageRevenuePerGuru)} avg per active Guru`}
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <CompactMetricRow
          href={adminRoutes.guruPerformance}
          icon={<TrendingUp size={18} />}
          title="Top Revenue Guru"
          value={snapshot.topGuruName}
          detail={`${money(snapshot.topGuruRevenue)} completed revenue`}
        />

        <CompactMetricRow
          href={adminRoutes.guruPerformance}
          icon={<MapPin size={18} />}
          title="Top Revenue City"
          value={snapshot.topCity}
          detail={`${money(snapshot.topCityRevenue)} completed revenue`}
        />

        <CompactMetricRow
          href={adminRoutes.bookings}
          icon={<CalendarCheck size={18} />}
          title="Avg. Booking Value"
          value={money(snapshot.averageBookingValue)}
          detail="Completed Guru bookings"
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Link
          href={adminRoutes.guruPerformance}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-3 text-sm font-black text-white transition hover:bg-green-900"
        >
          <BarChart3 size={17} />
          Open Guru Financials
        </Link>

        <Link
          href={adminRoutes.guruPerformanceExport}
          className="inline-flex items-center justify-center rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-green-900 transition hover:bg-green-50"
        >
          Export Guru Financials
        </Link>
      </div>
    </DashboardCard>
  );
}