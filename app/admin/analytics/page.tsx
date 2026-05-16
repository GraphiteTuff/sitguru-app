import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type BookingRow = Record<string, unknown>;
type GuruRow = Record<string, unknown>;
type ProfileRow = Record<string, unknown>;
type LaunchSignupRow = Record<string, unknown>;
type MessageRow = Record<string, unknown>;
type AnalyticsEventRow = Record<string, unknown>;
type GrowthCampaignRoiRow = Record<string, unknown>;
type GrowthCampaignEventRow = Record<string, unknown>;
type GrowthCampaignRow = Record<string, unknown>;

type Tone = "emerald" | "sky" | "violet" | "amber" | "rose";

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function percent(value: number) {
  return `${value.toFixed(1)}%`;
}

function calcPercent(value: number, total: number) {
  if (!total || total <= 0) return 0;
  return Math.max(0, Math.min(100, (value / total) * 100));
}

function formatDateShort(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getGrossAmount(booking: BookingRow) {
  const subtotal = toNumber(booking.subtotal_amount);

  if (subtotal > 0) return subtotal;

  return (
    toNumber(booking.total_amount) ||
    toNumber(booking.amount) ||
    toNumber(booking.price) ||
    toNumber(booking.hourly_rate)
  );
}

function getTaxAmount(booking: BookingRow) {
  return toNumber(booking.sales_tax_amount);
}

function getFeeAmount(booking: BookingRow) {
  const storedFee = toNumber(booking.sitguru_fee_amount);

  if (storedFee > 0) return storedFee;

  return getGrossAmount(booking) * 0.08;
}

function getGuruNetAmount(booking: BookingRow) {
  const storedNet = toNumber(booking.guru_net_amount);

  if (storedNet > 0) return storedNet;

  return getGrossAmount(booking) - getFeeAmount(booking);
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

function getBookingDate(booking: BookingRow) {
  return (
    asTrimmedString(booking.booking_date) ||
    asTrimmedString(booking.start_date) ||
    asTrimmedString(booking.start_time) ||
    asTrimmedString(booking.created_at) ||
    ""
  );
}

function getCityState(row: Record<string, unknown>) {
  return (
    [asTrimmedString(row.city), asTrimmedString(row.state)]
      .filter(Boolean)
      .join(", ") || "Unknown"
  );
}

function getCustomerId(booking: BookingRow) {
  return (
    asTrimmedString(booking.customer_id) ||
    asTrimmedString(booking.pet_owner_id) ||
    asTrimmedString(booking.user_id) ||
    "unknown"
  );
}

function getGuruId(booking: BookingRow) {
  return (
    asTrimmedString(booking.guru_id) ||
    asTrimmedString(booking.sitter_id) ||
    asTrimmedString(booking.provider_id) ||
    "unknown"
  );
}

function getLaunchRole(signup: LaunchSignupRow) {
  const role = asTrimmedString(
    signup.role || signup.interest_type || signup.joining_as || signup.user_type || signup.segment
  ).toLowerCase();

  if (role.includes("both")) return "Both";
  if (role.includes("guru")) return "Guru";
  return "Pet Parent";
}

function getLaunchSource(signup: LaunchSignupRow) {
  return (
    asTrimmedString(signup.source) ||
    asTrimmedString(signup.utm_source) ||
    "direct"
  ).toLowerCase();
}

function isPaidBooking(booking: BookingRow) {
  return asTrimmedString(booking.payment_status).toLowerCase() === "paid";
}

function isCompletedBooking(booking: BookingRow) {
  const status = asTrimmedString(booking.status).toLowerCase();
  const paymentStatus = asTrimmedString(booking.payment_status).toLowerCase();

  return (
    status.includes("complete") ||
    status.includes("paid") ||
    paymentStatus === "paid"
  );
}

function isCancelledBooking(booking: BookingRow) {
  const status = asTrimmedString(booking.status).toLowerCase();
  return status.includes("cancel");
}

function isUnreadMessage(message: MessageRow) {
  const readAt = asTrimmedString(message.read_at);
  const status = asTrimmedString(message.status).toLowerCase();
  const isRead = Boolean(message.is_read);

  return !readAt && !isRead && status !== "read" && status !== "archived";
}

function getEventName(event: AnalyticsEventRow) {
  return asTrimmedString(event.event_name) || "unknown_event";
}

function getEventType(event: AnalyticsEventRow) {
  return asTrimmedString(event.event_type) || "event";
}

function getEventSource(event: AnalyticsEventRow) {
  return asTrimmedString(event.source) || "direct";
}

function getEventPagePath(event: AnalyticsEventRow) {
  return asTrimmedString(event.page_path) || "—";
}

function getEventRole(event: AnalyticsEventRow) {
  return asTrimmedString(event.role) || "—";
}

function getEventCreatedAt(event: AnalyticsEventRow) {
  return asTrimmedString(event.created_at);
}


function getGrowthLabel(row: GrowthCampaignRoiRow) {
  return (
    asTrimmedString(row.campaign_name) ||
    asTrimmedString(row.campaign_slug) ||
    asTrimmedString(row.utm_campaign) ||
    "Unassigned Campaign"
  );
}

function getGrowthChannel(row: GrowthCampaignRoiRow) {
  return (
    asTrimmedString(row.channel) ||
    asTrimmedString(row.source) ||
    asTrimmedString(row.utm_source) ||
    "unknown"
  );
}

function getGrowthSignal(row: GrowthCampaignRoiRow) {
  return asTrimmedString(row.growth_signal) || "needs_more_data";
}

function getGrowthRecommendation(row: GrowthCampaignRoiRow) {
  return (
    asTrimmedString(row.admin_recommendation) ||
    "Keep tracking. More campaign events are needed before making a strong decision."
  );
}

function getGrowthNumber(row: GrowthCampaignRoiRow, key: string) {
  return toNumber(row[key]);
}

function getGrowthStatusLabel(signal: string) {
  const normalized = signal.toLowerCase().replaceAll("_", " ");
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getGrowthSignalTone(signal: string): Tone {
  if (signal === "profitable" || signal === "high_value_low_cost") return "emerald";
  if (signal === "needs_booking_conversion") return "amber";
  if (signal === "needs_signup_conversion") return "sky";
  if (signal === "review_spend") return "rose";
  return "violet";
}

function isEvent(event: AnalyticsEventRow, eventName: string) {
  return getEventName(event) === eventName;
}

function groupCount<T>(
  rows: T[],
  getKey: (row: T) => string
): { label: string; count: number }[] {
  const map = new Map<string, number>();

  for (const row of rows) {
    const key = getKey(row) || "Unknown";
    map.set(key, (map.get(key) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function groupRevenue(
  bookings: BookingRow[],
  getKey: (booking: BookingRow) => string
): { label: string; revenue: number; bookings: number }[] {
  const map = new Map<string, { revenue: number; bookings: number }>();

  for (const booking of bookings) {
    const key = getKey(booking) || "Unknown";
    const existing = map.get(key) || { revenue: 0, bookings: 0 };

    existing.revenue += getGrossAmount(booking) + getTaxAmount(booking);
    existing.bookings += 1;

    map.set(key, existing);
  }

  return Array.from(map.entries())
    .map(([label, value]) => ({
      label,
      revenue: value.revenue,
      bookings: value.bookings,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string
): Promise<T[]> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Analytics query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Analytics query skipped for ${label}:`, error);
    return [];
  }
}

function ActionLink({
  href,
  label,
  primary = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
}) {
  if (primary) {
    return (
      <Link
        href={href}
        className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-700/10 transition hover:bg-emerald-800"
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm font-bold text-slate-950 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
    >
      {label}
    </Link>
  );
}


function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  );
}


function SectionCard({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
            {eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
            {description}
          </p>
        </div>

        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}


function BarRow({
  label,
  value,
  max,
  detail,
  tone = "emerald",
}: {
  label: string;
  value: number;
  max: number;
  detail: string;
  tone?: Tone;
}) {
  const width = max > 0 ? Math.max(4, calcPercent(value, max)) : 4;

  const toneClass = {
    emerald: "bg-emerald-500",
    sky: "bg-sky-400",
    violet: "bg-violet-400",
    amber: "bg-amber-400",
    rose: "bg-rose-400",
  }[tone];

  return (
    <div className="rounded-xl border border-slate-100 bg-[#fbfefd] p-4">
      <div className="mb-2 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black text-slate-950">{label}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p>
        </div>
        <p className="text-sm font-black text-slate-950">{value.toLocaleString()}</p>
      </div>

      <div className="h-2.5 rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${toneClass}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}


function RevenueBarRow({
  label,
  revenue,
  bookings,
  max,
}: {
  label: string;
  revenue: number;
  bookings: number;
  max: number;
}) {
  const width = max > 0 ? Math.max(4, calcPercent(revenue, max)) : 4;

  return (
    <div className="rounded-xl border border-slate-100 bg-[#fbfefd] p-4">
      <div className="mb-2 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black text-slate-950">{label}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {bookings.toLocaleString()} bookings
          </p>
        </div>
        <p className="text-sm font-black text-slate-950">{money(revenue)}</p>
      </div>

      <div className="h-2.5 rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}


function TableCard({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="px-4 py-3 text-xs font-black uppercase tracking-[0.16em]"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.map((row, index) => (
              <tr
                key={index}
                className="text-slate-600 transition hover:bg-slate-50"
              >
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3 font-semibold">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function toneForIndex(index: number): Tone {
  if (index === 0) return "emerald";
  if (index === 1) return "sky";
  if (index === 2) return "violet";
  if (index === 3) return "amber";
  return "rose";
}

async function getAnalyticsData() {
  const [
    bookings,
    gurus,
    profiles,
    launchSignups,
    messages,
    analyticsEvents,
    growthCampaignRoi,
    growthCampaignEvents,
    growthCampaigns,
  ] = await Promise.all([
    safeRows<BookingRow>(
      supabaseAdmin.from("bookings").select("*").limit(1000),
      "bookings"
    ),
    safeRows<GuruRow>(
      supabaseAdmin.from("gurus").select("*").limit(1000),
      "gurus"
    ),
    safeRows<ProfileRow>(
      supabaseAdmin.from("profiles").select("*").limit(1000),
      "profiles"
    ),
    safeRows<LaunchSignupRow>(
      supabaseAdmin
        .from("launch_signups")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "launch_signups"
    ),
    safeRows<MessageRow>(
      supabaseAdmin
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "messages"
    ),
    safeRows<AnalyticsEventRow>(
      supabaseAdmin
        .from("analytics_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2500),
      "analytics_events"
    ),
    safeRows<GrowthCampaignRoiRow>(
      supabaseAdmin
        .from("admin_growth_campaign_roi")
        .select("*")
        .limit(500),
      "admin_growth_campaign_roi"
    ),
    safeRows<GrowthCampaignEventRow>(
      supabaseAdmin
        .from("growth_campaign_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2500),
      "growth_campaign_events"
    ),
    safeRows<GrowthCampaignRow>(
      supabaseAdmin
        .from("growth_campaigns")
        .select("*")
        .limit(500),
      "growth_campaigns"
    ),
  ]);

  const totalRevenue = bookings.reduce(
    (sum, booking) => sum + getGrossAmount(booking) + getTaxAmount(booking),
    0
  );

  const platformRevenue = bookings.reduce(
    (sum, booking) => sum + getFeeAmount(booking),
    0
  );

  const guruPayouts = bookings.reduce(
    (sum, booking) => sum + getGuruNetAmount(booking),
    0
  );

  const customerIds = new Set(
    bookings
      .map((booking) => getCustomerId(booking))
      .filter((value) => value && value !== "unknown")
  );

  const guruIds = new Set(
    bookings
      .map((booking) => getGuruId(booking))
      .filter((value) => value && value !== "unknown")
  );

  const paidBookings = bookings.filter(isPaidBooking);
  const completedBookings = bookings.filter(isCompletedBooking);
  const cancelledBookings = bookings.filter(isCancelledBooking);
  const unreadMessages = messages.filter(isUnreadMessage);

  const homepageVisits = analyticsEvents.filter((event) =>
    isEvent(event, "homepage_visit")
  );

  const launchPageVisits = analyticsEvents.filter((event) =>
    isEvent(event, "launch_page_visit")
  );

  const searchesStarted = analyticsEvents.filter((event) =>
    isEvent(event, "search_started")
  );

  const guruProfileViews = analyticsEvents.filter(
    (event) =>
      isEvent(event, "guru_profile_view") ||
      isEvent(event, "guru_profile_view_clicked")
  );

  const bookingStarts = analyticsEvents.filter((event) =>
    isEvent(event, "booking_started")
  );

  const bookingCompletedEvents = analyticsEvents.filter((event) =>
    isEvent(event, "booking_completed")
  );

  const launchSignupStarts = analyticsEvents.filter((event) =>
    isEvent(event, "launch_signup_started")
  );

  const launchSignupCompletedEvents = analyticsEvents.filter((event) =>
    isEvent(event, "launch_signup_completed")
  );

  const launchFormOpened = analyticsEvents.filter((event) =>
    isEvent(event, "launch_form_opened")
  );

  const ctaClicks = analyticsEvents.filter((event) =>
    isEvent(event, "homepage_cta_clicked")
  );

  const referralShares = analyticsEvents.filter((event) =>
    isEvent(event, "referral_shared")
  );

  const referralClicks = analyticsEvents.filter((event) =>
    isEvent(event, "referral_clicked")
  );

  const carouselClicks = analyticsEvents.filter(
    (event) =>
      isEvent(event, "homepage_carousel_next_clicked") ||
      isEvent(event, "homepage_carousel_previous_clicked") ||
      isEvent(event, "homepage_carousel_slide_selected")
  );

  const checkoutStarts = analyticsEvents.filter((event) =>
    isEvent(event, "checkout_started")
  );

  const bookingRequestsCreated = analyticsEvents.filter((event) =>
    isEvent(event, "booking_request_created")
  );

  const bookingFailures = analyticsEvents.filter(
    (event) =>
      isEvent(event, "booking_request_failed") ||
      isEvent(event, "checkout_failed")
  );

  const profileViewRate = calcPercent(
    guruProfileViews.length,
    homepageVisits.length
  );

  const searchEngagementRate = calcPercent(
    searchesStarted.length,
    homepageVisits.length
  );

  const bookingStartRate = calcPercent(
    bookingStarts.length,
    searchesStarted.length
  );

  const launchFormOpenRate = calcPercent(
    launchFormOpened.length,
    homepageVisits.length
  );

  const launchSignupCompletionRate = calcPercent(
    launchSignupCompletedEvents.length,
    launchSignupStarts.length
  );

  const sourceMix = groupCount(launchSignups, getLaunchSource).slice(0, 6);
  const roleMix = groupCount(launchSignups, getLaunchRole).slice(0, 6);
  const eventSourceMix = groupCount(analyticsEvents, getEventSource).slice(0, 8);
  const eventNameMix = groupCount(analyticsEvents, getEventName).slice(0, 10);
  const eventTypeMix = groupCount(analyticsEvents, getEventType).slice(0, 8);
  const eventPageMix = groupCount(analyticsEvents, getEventPagePath).slice(0, 8);

  const serviceRevenue = groupRevenue(bookings, getServiceName).slice(0, 6);
  const marketRevenue = groupRevenue(bookings, getCityState).slice(0, 6);

  const bookingStatus = groupCount(bookings, (booking) => {
    return (
      asTrimmedString(booking.status) ||
      asTrimmedString(booking.payment_status) ||
      "pending"
    );
  }).slice(0, 6);

  const monthlyBookings = groupCount(bookings, (booking) => {
    const date = getBookingDate(booking);
    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "Unknown";

    return parsed.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }).slice(0, 6);


  const growthRows = growthCampaignRoi.map((row) => {
    const clicks = getGrowthNumber(row, "clicks");
    const leads = getGrowthNumber(row, "leads");
    const signups = getGrowthNumber(row, "signups");
    const bookingsCount = getGrowthNumber(row, "bookings");
    const attributedRevenue = getGrowthNumber(row, "attributed_revenue");
    const totalCost = getGrowthNumber(row, "total_cost");
    const roiPercent = getGrowthNumber(row, "roi_percent");
    const costPerSignup = getGrowthNumber(row, "cost_per_signup");
    const costPerBooking = getGrowthNumber(row, "cost_per_booking");
    const signal = getGrowthSignal(row);

    return {
      campaignName: getGrowthLabel(row),
      channel: getGrowthChannel(row),
      clicks,
      leads,
      signups,
      bookings: bookingsCount,
      attributedRevenue,
      totalCost,
      roiPercent,
      costPerSignup,
      costPerBooking,
      signal,
      signalLabel: getGrowthStatusLabel(signal),
      recommendation: getGrowthRecommendation(row),
    };
  });

  const growthTotals = growthRows.reduce(
    (totals, row) => {
      totals.clicks += row.clicks;
      totals.leads += row.leads;
      totals.signups += row.signups;
      totals.bookings += row.bookings;
      totals.attributedRevenue += row.attributedRevenue;
      totals.totalCost += row.totalCost;
      return totals;
    },
    {
      clicks: 0,
      leads: 0,
      signups: 0,
      bookings: 0,
      attributedRevenue: 0,
      totalCost: 0,
    }
  );

  const growthNetReturn = growthTotals.attributedRevenue - growthTotals.totalCost;
  const growthRoiPercent = growthTotals.totalCost
    ? (growthNetReturn / growthTotals.totalCost) * 100
    : 0;
  const growthCostPerSignup = growthTotals.signups
    ? growthTotals.totalCost / growthTotals.signups
    : 0;
  const growthCostPerBooking = growthTotals.bookings
    ? growthTotals.totalCost / growthTotals.bookings
    : 0;

  const topGrowthCampaigns = growthRows
    .slice()
    .sort((a, b) => {
      if (b.bookings !== a.bookings) return b.bookings - a.bookings;
      if (b.attributedRevenue !== a.attributedRevenue) {
        return b.attributedRevenue - a.attributedRevenue;
      }
      return b.signups - a.signups;
    })
    .slice(0, 8);

  const channelMap = new Map<
    string,
    { clicks: number; leads: number; signups: number; bookings: number; revenue: number; cost: number }
  >();

  for (const row of growthRows) {
    const current = channelMap.get(row.channel) || {
      clicks: 0,
      leads: 0,
      signups: 0,
      bookings: 0,
      revenue: 0,
      cost: 0,
    };

    current.clicks += row.clicks;
    current.leads += row.leads;
    current.signups += row.signups;
    current.bookings += row.bookings;
    current.revenue += row.attributedRevenue;
    current.cost += row.totalCost;
    channelMap.set(row.channel, current);
  }

  const growthChannelMix = Array.from(channelMap.entries())
    .map(([label, value]) => ({
      label,
      ...value,
      roi: value.cost ? ((value.revenue - value.cost) / value.cost) * 100 : 0,
    }))
    .sort((a, b) => b.bookings - a.bookings || b.revenue - a.revenue)
    .slice(0, 8);

  const maxGrowthCampaignClicks = Math.max(...growthRows.map((row) => row.clicks), 1);
  const maxGrowthChannelBookings = Math.max(
    ...growthChannelMix.map((row) => row.bookings),
    1
  );

  const recentBookings = bookings
    .slice()
    .sort((a, b) => {
      const aDate = new Date(getBookingDate(a)).getTime();
      const bDate = new Date(getBookingDate(b)).getTime();

      return (
        (Number.isFinite(bDate) ? bDate : 0) -
        (Number.isFinite(aDate) ? aDate : 0)
      );
    })
    .slice(0, 6)
    .map((booking) => ({
      service: getServiceName(booking),
      market: getCityState(booking),
      status:
        asTrimmedString(booking.status) ||
        asTrimmedString(booking.payment_status) ||
        "pending",
      amount: money(getGrossAmount(booking) + getTaxAmount(booking)),
      date: formatDateShort(getBookingDate(booking)),
    }));

  const launchRecent = launchSignups.slice(0, 6).map((signup) => ({
    name:
      asTrimmedString(signup.name) ||
      asTrimmedString(signup.full_name) ||
      asTrimmedString(signup.fullName) ||
      "New signup",
    email: asTrimmedString(signup.email) || "—",
    role: getLaunchRole(signup),
    source: getLaunchSource(signup),
    joined: formatDateShort(asTrimmedString(signup.created_at)),
  }));

  const recentEvents = analyticsEvents.slice(0, 10).map((event) => ({
    eventName: getEventName(event),
    eventType: getEventType(event),
    source: getEventSource(event),
    role: getEventRole(event),
    pagePath: getEventPagePath(event),
    createdAt: formatDateShort(getEventCreatedAt(event)),
  }));

  const maxSourceCount = Math.max(...sourceMix.map((item) => item.count), 1);
  const maxRoleCount = Math.max(...roleMix.map((item) => item.count), 1);
  const maxEventSourceCount = Math.max(
    ...eventSourceMix.map((item) => item.count),
    1
  );
  const maxEventNameCount = Math.max(
    ...eventNameMix.map((item) => item.count),
    1
  );
  const maxEventTypeCount = Math.max(
    ...eventTypeMix.map((item) => item.count),
    1
  );
  const maxEventPageCount = Math.max(
    ...eventPageMix.map((item) => item.count),
    1
  );
  const maxStatusCount = Math.max(...bookingStatus.map((item) => item.count), 1);
  const maxMonthlyCount = Math.max(
    ...monthlyBookings.map((item) => item.count),
    1
  );
  const maxServiceRevenue = Math.max(
    ...serviceRevenue.map((item) => item.revenue),
    1
  );
  const maxMarketRevenue = Math.max(
    ...marketRevenue.map((item) => item.revenue),
    1
  );

  return {
    totals: {
      bookings: bookings.length,
      gurus: gurus.length || guruIds.size,
      profiles: profiles.length,
      launchSignups: launchSignups.length,
      customers: customerIds.size,
      totalRevenue,
      platformRevenue,
      guruPayouts,
      paidBookings: paidBookings.length,
      completedBookings: completedBookings.length,
      cancelledBookings: cancelledBookings.length,
      messages: messages.length,
      unreadMessages: unreadMessages.length,
      bookingConversion: calcPercent(completedBookings.length, bookings.length),
      paidRate: calcPercent(paidBookings.length, bookings.length),
      cancellationRate: calcPercent(cancelledBookings.length, bookings.length),
      takeRate: calcPercent(platformRevenue, totalRevenue),
      analyticsEvents: analyticsEvents.length,
      homepageVisits: homepageVisits.length,
      launchPageVisits: launchPageVisits.length,
      searchesStarted: searchesStarted.length,
      guruProfileViews: guruProfileViews.length,
      bookingStarts: bookingStarts.length,
      bookingCompletedEvents: bookingCompletedEvents.length,
      launchSignupStarts: launchSignupStarts.length,
      launchSignupCompletedEvents: launchSignupCompletedEvents.length,
      launchFormOpened: launchFormOpened.length,
      ctaClicks: ctaClicks.length,
      referralShares: referralShares.length,
      referralClicks: referralClicks.length,
      carouselClicks: carouselClicks.length,
      checkoutStarts: checkoutStarts.length,
      bookingRequestsCreated: bookingRequestsCreated.length,
      bookingFailures: bookingFailures.length,
      growthCampaigns: growthCampaigns.length || growthRows.length,
      growthCampaignRows: growthRows.length,
      growthCampaignEvents: growthCampaignEvents.length,
      growthClicks: growthTotals.clicks,
      growthLeads: growthTotals.leads,
      growthSignups: growthTotals.signups,
      growthBookings: growthTotals.bookings,
      growthAttributedRevenue: growthTotals.attributedRevenue,
      growthCost: growthTotals.totalCost,
      growthNetReturn,
      growthRoiPercent,
      growthCostPerSignup,
      growthCostPerBooking,
      profileViewRate,
      searchEngagementRate,
      bookingStartRate,
      launchFormOpenRate,
      launchSignupCompletionRate,
    },
    sourceMix,
    roleMix,
    eventSourceMix,
    eventNameMix,
    eventTypeMix,
    eventPageMix,
    serviceRevenue,
    marketRevenue,
    bookingStatus,
    monthlyBookings,
    recentBookings,
    launchRecent,
    recentEvents,
    topGrowthCampaigns,
    growthChannelMix,
    maxSourceCount,
    maxRoleCount,
    maxEventSourceCount,
    maxEventNameCount,
    maxEventTypeCount,
    maxEventPageCount,
    maxStatusCount,
    maxMonthlyCount,
    maxServiceRevenue,
    maxMarketRevenue,
    maxGrowthCampaignClicks,
    maxGrowthChannelBookings,
  };
}

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const analytics = await getAnalyticsData();

  return (
    <div className="min-h-screen bg-[#f7fbf8] px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                Platform Analytics
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Measure SitGuru growth, conversion, booking health, traffic,
                and network strength.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                This dashboard combines marketplace tables with tracked analytics
                events, including homepage visits, searches, profile views, CTA
                clicks, launch signups, booking actions, referral activity,
                messages, services, and revenue signals.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <ActionLink href="/admin" label="Admin Home" />
              <ActionLink href="/admin/users" label="Users" />
              <ActionLink href="/admin/bookings" label="Bookings" />
              <ActionLink href="/admin/reports" label="Reports & Exports" />
              <ActionLink href="/admin/audit-trail" label="Audit Trail" />
              <ActionLink href="/admin/financials" label="Financials" primary />
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Homepage Visits"
              value={analytics.totals.homepageVisits.toLocaleString()}
              detail={`${analytics.totals.analyticsEvents.toLocaleString()} total analytics events captured.`}
            />
            <StatCard
              label="Search Engagement"
              value={percent(analytics.totals.searchEngagementRate)}
              detail={`${analytics.totals.searchesStarted.toLocaleString()} searches started from tracked traffic.`}
            />
            <StatCard
              label="Guru Profile Views"
              value={analytics.totals.guruProfileViews.toLocaleString()}
              detail={`${percent(
                analytics.totals.profileViewRate
              )} of homepage visits led toward Guru profiles.`}
            />
            <StatCard
              label="Launch Conversion"
              value={percent(analytics.totals.launchSignupCompletionRate)}
              detail={`${analytics.totals.launchSignupCompletedEvents.toLocaleString()} tracked launch form completions.`}
            />
          </div>
        </section>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Revenue"
            value={money(analytics.totals.totalRevenue)}
            detail="Gross booking amount plus captured tax across marketplace bookings."
          />
          <StatCard
            label="Platform Revenue"
            value={money(analytics.totals.platformRevenue)}
            detail={`${percent(
              analytics.totals.takeRate
            )} current estimated SitGuru take rate.`}
          />
          <StatCard
            label="Booking Starts"
            value={analytics.totals.bookingStarts.toLocaleString()}
            detail={`${percent(
              analytics.totals.bookingStartRate
            )} of tracked searches became booking-start events.`}
          />
          <StatCard
            label="Completed Bookings"
            value={analytics.totals.completedBookings.toLocaleString()}
            detail={`${percent(
              analytics.totals.bookingConversion
            )} booking completion rate from booking records.`}
          />
        </div>


        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Growth Campaigns"
            value={analytics.totals.growthCampaigns.toLocaleString()}
            detail={`${analytics.totals.growthCampaignEvents.toLocaleString()} campaign events captured from Growth & Referral tracking.`}
          />
          <StatCard
            label="Growth ROI"
            value={percent(analytics.totals.growthRoiPercent)}
            detail={`${money(analytics.totals.growthAttributedRevenue)} attributed revenue against ${money(analytics.totals.growthCost)} tracked spend.`}
          />
          <StatCard
            label="Cost per Signup"
            value={money(analytics.totals.growthCostPerSignup)}
            detail={`${analytics.totals.growthSignups.toLocaleString()} tracked signups from growth campaigns.`}
          />
          <StatCard
            label="Cost per Booking"
            value={money(analytics.totals.growthCostPerBooking)}
            detail={`${analytics.totals.growthBookings.toLocaleString()} attributed bookings from campaign activity.`}
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Users"
            value={analytics.totals.profiles.toLocaleString()}
            detail="Profiles currently stored in Supabase."
          />
          <StatCard
            label="Gurus"
            value={analytics.totals.gurus.toLocaleString()}
            detail="Guru records or active Guru IDs detected through bookings."
          />
          <StatCard
            label="Customers"
            value={analytics.totals.customers.toLocaleString()}
            detail="Unique customer IDs detected through bookings."
          />
          <StatCard
            label="Messages"
            value={analytics.totals.messages.toLocaleString()}
            detail={`${analytics.totals.unreadMessages.toLocaleString()} unread or unreviewed messages.`}
          />
        </div>

        <div className="grid gap-8 xl:grid-cols-[1fr_1fr]">
          <SectionCard
            eyebrow="Tracked Funnel"
            title="Homepage to booking behavior"
            description="These numbers come from the analytics_events table and show how visitors are moving through the platform."
            actions={
              <>
                <ActionLink href="/admin/audit-trail" label="Audit Trail" />
                <ActionLink href="/admin/exports" label="Export" />
              </>
            }
          >
            <div className="space-y-5">
              <BarRow
                label="Homepage visits"
                value={analytics.totals.homepageVisits}
                max={Math.max(analytics.totals.homepageVisits, 1)}
                detail="Users landing on the homepage"
                tone="emerald"
              />
              <BarRow
                label="Searches started"
                value={analytics.totals.searchesStarted}
                max={Math.max(analytics.totals.homepageVisits, 1)}
                detail={`${percent(
                  analytics.totals.searchEngagementRate
                )} of homepage visits`}
                tone="sky"
              />
              <BarRow
                label="Guru profile views"
                value={analytics.totals.guruProfileViews}
                max={Math.max(analytics.totals.homepageVisits, 1)}
                detail={`${percent(
                  analytics.totals.profileViewRate
                )} profile-view signal`}
                tone="violet"
              />
              <BarRow
                label="Booking starts"
                value={analytics.totals.bookingStarts}
                max={Math.max(analytics.totals.homepageVisits, 1)}
                detail="Users beginning the booking process"
                tone="amber"
              />
              <BarRow
                label="Booking completed events"
                value={analytics.totals.bookingCompletedEvents}
                max={Math.max(analytics.totals.homepageVisits, 1)}
                detail="Tracked booking_completed analytics events"
                tone="rose"
              />
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Booking Flow"
            title="Booking request and checkout tracking"
            description="Track request creation, checkout starts, failures, and successful booking records."
            actions={
              <>
                <ActionLink href="/admin/bookings" label="Open Bookings" />
                <ActionLink href="/admin/financials" label="Financials" />
              </>
            }
          >
            <div className="space-y-5">
              <BarRow
                label="Booking requests created"
                value={analytics.totals.bookingRequestsCreated}
                max={Math.max(analytics.totals.bookingStarts, 1)}
                detail="Tracked booking_request_created events"
                tone="emerald"
              />
              <BarRow
                label="Checkout started"
                value={analytics.totals.checkoutStarts}
                max={Math.max(analytics.totals.bookingRequestsCreated, 1)}
                detail="Users redirected toward Stripe checkout"
                tone="sky"
              />
              <BarRow
                label="Completed booking records"
                value={analytics.totals.completedBookings}
                max={Math.max(analytics.totals.bookings, 1)}
                detail={`${percent(
                  analytics.totals.bookingConversion
                )} completion rate from booking rows`}
                tone="violet"
              />
              <BarRow
                label="Booking / checkout failures"
                value={analytics.totals.bookingFailures}
                max={Math.max(
                  analytics.totals.bookingFailures +
                    analytics.totals.bookingRequestsCreated,
                  1
                )}
                detail="Tracked booking_request_failed and checkout_failed events"
                tone="rose"
              />
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1fr_1fr]">
          <SectionCard
            eyebrow="Launch Funnel"
            title="Launch form and early-access tracking"
            description="Track launch form opens, starts, completions, launch page visits, and CTA engagement."
            actions={
              <>
                <ActionLink href="/admin/launch-signups" label="Launch Signups" />
                <ActionLink href="/admin" label="Admin Home" />
              </>
            }
          >
            <div className="space-y-5">
              <BarRow
                label="Launch page visits"
                value={analytics.totals.launchPageVisits}
                max={Math.max(analytics.totals.launchPageVisits, 1)}
                detail="Direct visits to the launch page"
                tone="emerald"
              />
              <BarRow
                label="Launch form opened"
                value={analytics.totals.launchFormOpened}
                max={Math.max(analytics.totals.homepageVisits, 1)}
                detail={`${percent(
                  analytics.totals.launchFormOpenRate
                )} of homepage visits opened the form`}
                tone="sky"
              />
              <BarRow
                label="Launch signup started"
                value={analytics.totals.launchSignupStarts}
                max={Math.max(analytics.totals.launchFormOpened, 1)}
                detail="Users who began submitting the launch form"
                tone="violet"
              />
              <BarRow
                label="Launch signup completed"
                value={analytics.totals.launchSignupCompletedEvents}
                max={Math.max(analytics.totals.launchSignupStarts, 1)}
                detail={`${percent(
                  analytics.totals.launchSignupCompletionRate
                )} tracked completion rate`}
                tone="amber"
              />
              <BarRow
                label="Homepage CTA clicks"
                value={analytics.totals.ctaClicks}
                max={Math.max(analytics.totals.homepageVisits, 1)}
                detail="Tracked homepage button and link clicks"
                tone="rose"
              />
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Referral Signals"
            title="Sharing and referral activity"
            description="Track referral shares, referral clicks, and carousel interaction signals."
            actions={
              <>
                <ActionLink href="/admin/analytics" label="Refresh Analytics" />
                <ActionLink href="/admin/exports" label="Export" />
              </>
            }
          >
            <div className="space-y-5">
              <BarRow
                label="Referral shares"
                value={analytics.totals.referralShares}
                max={Math.max(analytics.totals.analyticsEvents, 1)}
                detail="Tracked referral_shared events"
                tone="emerald"
              />
              <BarRow
                label="Referral clicks"
                value={analytics.totals.referralClicks}
                max={Math.max(analytics.totals.analyticsEvents, 1)}
                detail="Tracked referral_clicked events"
                tone="sky"
              />
              <BarRow
                label="Carousel engagement"
                value={analytics.totals.carouselClicks}
                max={Math.max(analytics.totals.analyticsEvents, 1)}
                detail="Carousel next, previous, and slide selection events"
                tone="violet"
              />
            </div>
          </SectionCard>
        </div>


        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <SectionCard
            eyebrow="Growth ROI"
            title="Campaign performance and marketing return"
            description="This reads from the Growth Campaign ROI view and shows which campaigns are producing clicks, leads, signups, bookings, attributed revenue, and ROI."
            actions={
              <>
                <ActionLink href="/admin/referrals" label="Growth & Referrals" />
                <ActionLink href="/admin/financials" label="Financials" primary />
              </>
            }
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  Clicks
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {analytics.totals.growthClicks.toLocaleString()}
                </p>
              </div>
              <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">
                  Leads
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {analytics.totals.growthLeads.toLocaleString()}
                </p>
              </div>
              <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">
                  Signups
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {analytics.totals.growthSignups.toLocaleString()}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
                  Bookings
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {analytics.totals.growthBookings.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {analytics.topGrowthCampaigns.length ? (
                analytics.topGrowthCampaigns.slice(0, 6).map((campaign, index) => (
                  <BarRow
                    key={`${campaign.campaignName}-${campaign.channel}`}
                    label={campaign.campaignName}
                    value={campaign.clicks}
                    max={analytics.maxGrowthCampaignClicks}
                    detail={`${campaign.channel} · ${campaign.signups.toLocaleString()} signups · ${campaign.bookings.toLocaleString()} bookings · ${percent(campaign.roiPercent)} ROI`}
                    tone={getGrowthSignalTone(campaign.signal) || toneForIndex(index)}
                  />
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                  No campaign ROI rows yet. As tracked campaign events and costs are added, this section will show what is working and what needs refinement.
                </p>
              )}
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Growth Strategy"
            title="What is working and what needs attention"
            description="Use the signal and recommendation columns to decide whether to scale, refine, pause, or improve conversion for each campaign."
            actions={
              <>
                <ActionLink href="/admin/financials/payouts" label="Payout Analytics" />
                <ActionLink href="/admin/financials/pro-forma" label="Forecasting" />
              </>
            }
          >
            <div className="space-y-5">
              {analytics.growthChannelMix.length ? (
                analytics.growthChannelMix.map((channel, index) => (
                  <BarRow
                    key={channel.label}
                    label={channel.label}
                    value={channel.bookings}
                    max={analytics.maxGrowthChannelBookings}
                    detail={`${channel.signups.toLocaleString()} signups · ${money(channel.revenue)} revenue · ${money(channel.cost)} cost · ${percent(channel.roi)} ROI`}
                    tone={toneForIndex(index)}
                  />
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                  No channel mix available yet. Campaign events with source/channel values will populate this view.
                </p>
              )}
            </div>
          </SectionCard>
        </div>

        <SectionCard
          eyebrow="Campaign ROI Detail"
          title="Top growth campaigns"
          description="Detailed campaign table for admin decision-making: scale profitable channels, improve weak conversion points, and pause spend that is not producing signups or bookings."
          actions={
            <>
              <ActionLink href="/admin/referrals" label="Growth Command Center" primary />
              <ActionLink href="/admin/exports" label="Export" />
            </>
          }
        >
          <TableCard
            headers={[
              "Campaign",
              "Channel",
              "Clicks",
              "Signups",
              "Bookings",
              "Revenue",
              "Cost",
              "ROI",
              "Signal",
              "Recommendation",
            ]}
            rows={
              analytics.topGrowthCampaigns.length
                ? analytics.topGrowthCampaigns.map((campaign) => [
                    campaign.campaignName,
                    campaign.channel,
                    campaign.clicks.toLocaleString(),
                    campaign.signups.toLocaleString(),
                    campaign.bookings.toLocaleString(),
                    money(campaign.attributedRevenue),
                    money(campaign.totalCost),
                    percent(campaign.roiPercent),
                    campaign.signalLabel,
                    campaign.recommendation,
                  ])
                : [["No campaigns yet", "—", "—", "—", "—", "—", "—", "—", "—", "—"]]
            }
          />
        </SectionCard>

        <div className="grid gap-8 xl:grid-cols-[1fr_1fr]">
          <SectionCard
            eyebrow="Event Sources"
            title="Where tracked behavior is coming from"
            description="This uses source values from analytics_events, including direct, Instagram, Facebook, TikTok, referral, and campaign links."
            actions={
              <>
                <ActionLink href="/admin/launch-signups" label="Lead Sources" />
                <ActionLink href="/admin/exports" label="Export" />
              </>
            }
          >
            <div className="space-y-5">
              {analytics.eventSourceMix.length ? (
                analytics.eventSourceMix.map((item, index) => (
                  <BarRow
                    key={item.label}
                    label={item.label}
                    value={item.count}
                    max={analytics.maxEventSourceCount}
                    detail={`${percent(
                      calcPercent(item.count, analytics.totals.analyticsEvents)
                    )} of tracked events`}
                    tone={toneForIndex(index)}
                  />
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                  No analytics event source data yet.
                </p>
              )}
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Event Mix"
            title="Top tracked event names"
            description="See which tracked actions are happening most often across the platform."
            actions={
              <>
                <ActionLink href="/admin/audit-trail" label="Audit Trail" />
                <ActionLink href="/admin/exports" label="Export" />
              </>
            }
          >
            <div className="space-y-5">
              {analytics.eventNameMix.length ? (
                analytics.eventNameMix.map((item, index) => (
                  <BarRow
                    key={item.label}
                    label={item.label}
                    value={item.count}
                    max={analytics.maxEventNameCount}
                    detail={`${percent(
                      calcPercent(item.count, analytics.totals.analyticsEvents)
                    )} of all analytics events`}
                    tone={toneForIndex(index)}
                  />
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                  No analytics events found yet.
                </p>
              )}
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1fr_1fr]">
          <SectionCard
            eyebrow="Acquisition"
            title="Launch signup source mix"
            description="See where early SitGuru interest is coming from across social, direct, referrals, and campaigns."
            actions={
              <>
                <ActionLink href="/admin/launch-signups" label="Launch Signups" />
                <ActionLink href="/admin/exports" label="Export" />
              </>
            }
          >
            <div className="space-y-5">
              {analytics.sourceMix.length ? (
                analytics.sourceMix.map((item, index) => (
                  <BarRow
                    key={item.label}
                    label={item.label}
                    value={item.count}
                    max={analytics.maxSourceCount}
                    detail={`${percent(
                      calcPercent(item.count, analytics.totals.launchSignups)
                    )} of launch signups`}
                    tone={toneForIndex(index)}
                  />
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                  No launch source data yet.
                </p>
              )}
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Audience"
            title="Role performance"
            description="Compare early interest between pet parents, future Gurus, and people who selected both."
            actions={
              <>
                <ActionLink href="/admin/users" label="Users" />
                <ActionLink href="/admin/guru-approvals" label="Guru Approvals" />
              </>
            }
          >
            <div className="space-y-5">
              {analytics.roleMix.length ? (
                analytics.roleMix.map((item, index) => (
                  <BarRow
                    key={item.label}
                    label={item.label}
                    value={item.count}
                    max={analytics.maxRoleCount}
                    detail={`${percent(
                      calcPercent(item.count, analytics.totals.launchSignups)
                    )} of launch signups`}
                    tone={toneForIndex(index)}
                  />
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                  No launch role data yet.
                </p>
              )}
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1fr_1fr]">
          <SectionCard
            eyebrow="Services"
            title="Revenue by service"
            description="Identify which care categories are producing the strongest booking volume and customer spend."
            actions={
              <>
                <ActionLink href="/admin/bookings" label="View Bookings" />
                <ActionLink href="/admin/financials" label="Financials" />
              </>
            }
          >
            <div className="space-y-5">
              {analytics.serviceRevenue.length ? (
                analytics.serviceRevenue.map((item) => (
                  <RevenueBarRow
                    key={item.label}
                    label={item.label}
                    revenue={item.revenue}
                    bookings={item.bookings}
                    max={analytics.maxServiceRevenue}
                  />
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                  No service revenue data yet.
                </p>
              )}
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Markets"
            title="Revenue by location"
            description="See which cities and states are showing the strongest marketplace traction."
            actions={
              <>
                <ActionLink href="/admin/bookings" label="Bookings" />
                <ActionLink href="/admin/exports" label="Export" />
              </>
            }
          >
            <div className="space-y-5">
              {analytics.marketRevenue.length ? (
                analytics.marketRevenue.map((item) => (
                  <RevenueBarRow
                    key={item.label}
                    label={item.label}
                    revenue={item.revenue}
                    bookings={item.bookings}
                    max={analytics.maxMarketRevenue}
                  />
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                  No market revenue data yet.
                </p>
              )}
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1fr_1fr]">
          <SectionCard
            eyebrow="Booking Funnel"
            title="Booking status health"
            description="Track completed, paid, pending, cancelled, or other booking statuses."
            actions={
              <>
                <ActionLink href="/admin/bookings" label="Open Bookings" />
                <ActionLink href="/admin/messages/review" label="Review Issues" />
              </>
            }
          >
            <div className="space-y-5">
              {analytics.bookingStatus.length ? (
                analytics.bookingStatus.map((item, index) => (
                  <BarRow
                    key={item.label}
                    label={item.label}
                    value={item.count}
                    max={analytics.maxStatusCount}
                    detail={`${percent(
                      calcPercent(item.count, analytics.totals.bookings)
                    )} of bookings`}
                    tone={toneForIndex(index)}
                  />
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                  No booking status data yet.
                </p>
              )}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Paid Rate
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {percent(analytics.totals.paidRate)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Cancellation
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {percent(analytics.totals.cancellationRate)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Guru Payouts
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {money(analytics.totals.guruPayouts)}
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Trend"
            title="Bookings by month"
            description="Simple month grouping based on booking, start, or created date."
            actions={
              <>
                <ActionLink href="/admin/audit-trail" label="Audit Trail" />
                <ActionLink href="/admin/exports" label="Export" />
              </>
            }
          >
            <div className="space-y-5">
              {analytics.monthlyBookings.length ? (
                analytics.monthlyBookings.map((item, index) => (
                  <BarRow
                    key={item.label}
                    label={item.label}
                    value={item.count}
                    max={analytics.maxMonthlyCount}
                    detail="Tracked booking rows"
                    tone={toneForIndex(index)}
                  />
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                  No monthly booking data yet.
                </p>
              )}
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1fr_1fr]">
          <SectionCard
            eyebrow="Event Types"
            title="Tracked event categories"
            description="See broad categories like traffic, lead, navigation, search, profile, booking, and referral events."
            actions={
              <>
                <ActionLink href="/admin/audit-trail" label="Audit Trail" />
                <ActionLink href="/admin/exports" label="Export" />
              </>
            }
          >
            <div className="space-y-5">
              {analytics.eventTypeMix.length ? (
                analytics.eventTypeMix.map((item, index) => (
                  <BarRow
                    key={item.label}
                    label={item.label}
                    value={item.count}
                    max={analytics.maxEventTypeCount}
                    detail={`${percent(
                      calcPercent(item.count, analytics.totals.analyticsEvents)
                    )} of tracked events`}
                    tone={toneForIndex(index)}
                  />
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                  No event type data yet.
                </p>
              )}
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Page Paths"
            title="Tracked page activity"
            description="See which pages are generating analytics events."
            actions={
              <>
                <ActionLink href="/admin/audit-trail" label="Audit Trail" />
                <ActionLink href="/admin/exports" label="Export" />
              </>
            }
          >
            <div className="space-y-5">
              {analytics.eventPageMix.length ? (
                analytics.eventPageMix.map((item, index) => (
                  <BarRow
                    key={item.label}
                    label={item.label}
                    value={item.count}
                    max={analytics.maxEventPageCount}
                    detail={`${percent(
                      calcPercent(item.count, analytics.totals.analyticsEvents)
                    )} of tracked events`}
                    tone={toneForIndex(index)}
                  />
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                  No page path data yet.
                </p>
              )}
            </div>
          </SectionCard>
        </div>

        <SectionCard
          eyebrow="Recent Analytics Events"
          title="Newest tracked user actions"
          description="A quick readout of the latest analytics_events rows."
          actions={
            <>
              <ActionLink href="/admin/audit-trail" label="Audit Trail" primary />
              <ActionLink href="/admin/exports" label="Export Events" />
            </>
          }
        >
          <TableCard
            headers={["Event", "Type", "Source", "Role", "Page", "Date"]}
            rows={
              analytics.recentEvents.length
                ? analytics.recentEvents.map((event) => [
                    event.eventName,
                    event.eventType,
                    event.source,
                    event.role,
                    event.pagePath,
                    event.createdAt,
                  ])
                : [["No analytics events yet", "—", "—", "—", "—", "—"]]
            }
          />
        </SectionCard>

        <SectionCard
          eyebrow="Recent Activity"
          title="Recent booking analytics"
          description="Latest booking rows by service, market, status, amount, and date."
          actions={
            <>
              <ActionLink href="/admin/bookings" label="View All Bookings" primary />
              <ActionLink href="/admin/exports" label="Export" />
            </>
          }
        >
          <TableCard
            headers={["Service", "Market", "Status", "Amount", "Date"]}
            rows={
              analytics.recentBookings.length
                ? analytics.recentBookings.map((booking) => [
                    booking.service,
                    booking.market,
                    booking.status,
                    booking.amount,
                    booking.date,
                  ])
                : [["No bookings yet", "—", "—", "—", "—"]]
            }
          />
        </SectionCard>

        <SectionCard
          eyebrow="Launch Leads"
          title="Recent launch signup analytics"
          description="Newest pre-launch signups by role and source."
          actions={
            <>
              <ActionLink
                href="/admin/launch-signups"
                label="Open Launch Signups"
                primary
              />
              <ActionLink href="/admin/exports" label="Export Leads" />
            </>
          }
        >
          <TableCard
            headers={["Name", "Email", "Role", "Source", "Joined"]}
            rows={
              analytics.launchRecent.length
                ? analytics.launchRecent.map((signup) => [
                    signup.name,
                    signup.email,
                    signup.role,
                    signup.source,
                    signup.joined,
                  ])
                : [["No launch signups yet", "—", "—", "—", "—"]]
            }
          />
        </SectionCard>
      </div>
    </div>
  );
}
