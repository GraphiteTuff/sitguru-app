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
      console.error(`Analytics query failed for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.error(`Analytics query threw for ${label}:`, error);
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
        className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
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
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black tracking-tight text-white">
        {value}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-400">{detail}</p>
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
    <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)] lg:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
            {eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
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
    emerald: "bg-emerald-400",
    sky: "bg-sky-400",
    violet: "bg-violet-400",
    amber: "bg-amber-400",
    rose: "bg-rose-400",
  }[tone];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="text-xs text-slate-500">{detail}</p>
        </div>
        <p className="text-sm font-bold text-white">{value.toLocaleString()}</p>
      </div>

      <div className="h-2 rounded-full bg-white/10">
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
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="text-xs text-slate-500">
            {bookings.toLocaleString()} bookings
          </p>
        </div>
        <p className="text-sm font-bold text-white">{money(revenue)}</p>
      </div>

      <div className="h-2 rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-emerald-400"
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
    <div className="overflow-hidden rounded-3xl border border-white/10">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => (
              <tr
                key={index}
                className="border-t border-white/10 text-slate-300 transition hover:bg-white/5"
              >
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3">
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.10),_transparent_30%),radial-gradient(circle_at_right,_rgba(14,165,233,0.10),_transparent_28%),linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-emerald-500/15 via-slate-950 to-sky-500/10 p-6 shadow-[0_12px_60px_rgba(0,0,0,0.28)] lg:p-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
                Platform Analytics
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Measure SitGuru growth, conversion, booking health, traffic,
                and network strength.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
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
                <ActionLink href="/admin/activity" label="Activity" />
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
                <p className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm text-slate-400">
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
                <ActionLink href="/admin/activity" label="View Activity" />
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
                <p className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm text-slate-400">
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
                <p className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm text-slate-400">
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
                <p className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm text-slate-400">
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
                <p className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm text-slate-400">
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
                <p className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm text-slate-400">
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
                <p className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm text-slate-400">
                  No booking status data yet.
                </p>
              )}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Paid Rate
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {percent(analytics.totals.paidRate)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Cancellation
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {percent(analytics.totals.cancellationRate)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Guru Payouts
                </p>
                <p className="mt-2 text-2xl font-black text-white">
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
                <ActionLink href="/admin/activity" label="Activity" />
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
                <p className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm text-slate-400">
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
                <ActionLink href="/admin/activity" label="Activity" />
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
                <p className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm text-slate-400">
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
                <ActionLink href="/admin/activity" label="Activity" />
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
                <p className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm text-slate-400">
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
              <ActionLink href="/admin/activity" label="Activity" primary />
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