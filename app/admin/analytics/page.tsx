import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import {
  Activity,
  BriefcaseBusiness,
  CalendarCheck,
  ChevronRight,
  DollarSign,
  HandCoins,
  Handshake,
  Megaphone,
  MousePointerClick,
  PawPrint,
  Share2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;
type Tone = "emerald" | "sky" | "violet" | "amber" | "rose" | "slate";

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

type CountItem = {
  label: string;
  count: number;
};

type RevenueItem = {
  label: string;
  revenue: number;
  bookings: number;
};

type GrowthCampaignItem = {
  campaignName: string;
  channel: string;
  clicks: number;
  leads: number;
  signups: number;
  bookings: number;
  attributedRevenue: number;
  totalCost: number;
  roiPercent: number;
  costPerSignup: number;
  costPerBooking: number;
  signal: string;
  signalLabel: string;
  recommendation: string;
};

type ChannelMixItem = {
  label: string;
  clicks: number;
  leads: number;
  signups: number;
  bookings: number;
  revenue: number;
  cost: number;
  roi: number;
};

type RecentLeadItem = {
  name: string;
  email: string;
  source: string;
  program: string;
  status: string;
  stage: string;
  referralCode: string;
  joined: string;
};

type RecentEventItem = {
  eventName: string;
  eventType: string;
  source: string;
  role: string;
  pagePath: string;
  createdAt: string;
};

type RecentBookingItem = {
  service: string;
  market: string;
  status: string;
  amount: string;
  date: string;
};

const adminLinks = [
  { href: "/admin", label: "Admin Home" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/ambassadors", label: "Ambassadors" },
  { href: "/admin/referrals", label: "Referrals" },
  { href: "/admin/financials", label: "Financials", primary: true },
];

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalized(value: unknown) {
  return asTrimmedString(value).toLowerCase();
}

function toNumber(value: unknown) {
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

function moneyDetailed(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function percent(value: number) {
  return `${(Number.isFinite(value) ? value : 0).toFixed(1)}%`;
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

function formatDateMonth(value?: string | null) {
  if (!value) return "Unknown";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function getCreatedAt(row: AnyRow) {
  return (
    asTrimmedString(row.created_at) ||
    asTrimmedString(row.inserted_at) ||
    asTrimmedString(row.updated_at) ||
    ""
  );
}

function getGrossAmount(booking: AnyRow) {
  const subtotal = toNumber(booking.subtotal_amount);
  if (subtotal > 0) return subtotal;

  return (
    toNumber(booking.total_amount) ||
    toNumber(booking.amount_total) ||
    toNumber(booking.customer_total_amount) ||
    toNumber(booking.amount) ||
    toNumber(booking.price) ||
    toNumber(booking.hourly_rate)
  );
}

function getTaxAmount(booking: AnyRow) {
  return toNumber(booking.sales_tax_amount) || toNumber(booking.tax_amount);
}

function getFeeAmount(booking: AnyRow) {
  const storedFee =
    toNumber(booking.sitguru_fee_amount) ||
    toNumber(booking.platform_fee_amount) ||
    toNumber(booking.platform_fee) ||
    toNumber(booking.marketplace_fee_amount) ||
    toNumber(booking.marketplace_fee);

  if (storedFee > 0) return storedFee;

  return getGrossAmount(booking) * 0.08;
}

function getGuruNetAmount(booking: AnyRow) {
  const storedNet =
    toNumber(booking.guru_net_amount) ||
    toNumber(booking.guru_payout_amount) ||
    toNumber(booking.payout_amount);

  if (storedNet > 0) return storedNet;

  return Math.max(0, getGrossAmount(booking) - getFeeAmount(booking));
}

function getServiceName(booking: AnyRow) {
  return (
    asTrimmedString(booking.service) ||
    asTrimmedString(booking.service_name) ||
    asTrimmedString(booking.service_type) ||
    asTrimmedString(booking.booking_type) ||
    "Pet Care"
  );
}

function getBookingDate(booking: AnyRow) {
  return (
    asTrimmedString(booking.booking_date) ||
    asTrimmedString(booking.requested_date) ||
    asTrimmedString(booking.start_date) ||
    asTrimmedString(booking.start_time) ||
    asTrimmedString(booking.created_at) ||
    ""
  );
}

function getCityState(row: AnyRow) {
  return (
    [asTrimmedString(row.city), asTrimmedString(row.state)]
      .filter(Boolean)
      .join(", ") ||
    asTrimmedString(row.market) ||
    asTrimmedString(row.location) ||
    "Unknown"
  );
}

function getCustomerId(booking: AnyRow) {
  return (
    asTrimmedString(booking.customer_id) ||
    asTrimmedString(booking.pet_owner_id) ||
    asTrimmedString(booking.pet_parent_id) ||
    asTrimmedString(booking.user_id) ||
    "unknown"
  );
}

function getGuruId(booking: AnyRow) {
  return (
    asTrimmedString(booking.guru_id) ||
    asTrimmedString(booking.sitter_id) ||
    asTrimmedString(booking.provider_id) ||
    "unknown"
  );
}

function getStatus(row: AnyRow) {
  return (
    asTrimmedString(row.status) ||
    asTrimmedString(row.lead_stage) ||
    asTrimmedString(row.stage) ||
    asTrimmedString(row.payment_status) ||
    "pending"
  );
}

function isPaidBooking(booking: AnyRow) {
  return normalized(booking.payment_status) === "paid";
}

function isCompletedBooking(booking: AnyRow) {
  const status = normalized(booking.status);
  const paymentStatus = normalized(booking.payment_status);

  return (
    status.includes("complete") ||
    status.includes("completed") ||
    status.includes("paid") ||
    paymentStatus === "paid"
  );
}

function isCancelledBooking(booking: AnyRow) {
  return normalized(booking.status).includes("cancel");
}

function isUnreadMessage(message: AnyRow) {
  const readAt = asTrimmedString(message.read_at);
  const status = normalized(message.status);
  const isRead = Boolean(message.is_read);

  return !readAt && !isRead && status !== "read" && status !== "archived";
}

function isActiveAmbassador(row: AnyRow) {
  const status = normalized(row.status);
  return !status || ["active", "approved", "onboarding", "contacted"].some((value) => status.includes(value));
}

function getLaunchRole(signup: AnyRow) {
  const role = normalized(
    signup.role || signup.interest_type || signup.joining_as || signup.user_type || signup.segment,
  );

  if (role.includes("both")) return "Both";
  if (role.includes("guru")) return "Guru";
  if (role.includes("ambassador")) return "Ambassador";
  return "Pet Parent";
}

function getLaunchSource(signup: AnyRow) {
  return (
    normalized(signup.source) ||
    normalized(signup.utm_source) ||
    normalized(signup.referral_source) ||
    "direct"
  );
}

function getLeadSource(row: AnyRow) {
  return (
    asTrimmedString(row.source) ||
    asTrimmedString(row.utm_source) ||
    asTrimmedString(row.referral_source) ||
    asTrimmedString(row.campaign) ||
    "Unknown"
  );
}

function getLeadProgram(row: AnyRow) {
  return (
    asTrimmedString(row.program) ||
    asTrimmedString(row.program_name) ||
    asTrimmedString(row.candidate_path) ||
    asTrimmedString(row.ambassador_type) ||
    "Unassigned"
  );
}

function getLeadName(row: AnyRow) {
  return (
    asTrimmedString(row.full_name) ||
    asTrimmedString(row.display_name) ||
    asTrimmedString(row.name) ||
    asTrimmedString(row.first_name) ||
    asTrimmedString(row.email) ||
    "Unknown Lead"
  );
}

function getReferralCode(row: AnyRow) {
  return (
    asTrimmedString(row.referral_code) ||
    asTrimmedString(row.code) ||
    asTrimmedString(row.ref_code) ||
    "—"
  );
}

function getEventName(event: AnyRow) {
  return asTrimmedString(event.event_name) || "unknown_event";
}

function getEventType(event: AnyRow) {
  return asTrimmedString(event.event_type) || "event";
}

function getEventSource(event: AnyRow) {
  return asTrimmedString(event.source) || "direct";
}

function getEventPagePath(event: AnyRow) {
  return asTrimmedString(event.page_path) || "—";
}

function getEventRole(event: AnyRow) {
  return asTrimmedString(event.role) || "—";
}

function getEventCreatedAt(event: AnyRow) {
  return asTrimmedString(event.created_at);
}

function isEvent(event: AnyRow, eventName: string) {
  return getEventName(event) === eventName;
}

function getGrowthLabel(row: AnyRow) {
  return (
    asTrimmedString(row.campaign_name) ||
    asTrimmedString(row.campaign_slug) ||
    asTrimmedString(row.utm_campaign) ||
    asTrimmedString(row.name) ||
    "Unassigned Campaign"
  );
}

function getGrowthChannel(row: AnyRow) {
  return (
    asTrimmedString(row.channel) ||
    asTrimmedString(row.source) ||
    asTrimmedString(row.utm_source) ||
    "unknown"
  );
}

function getGrowthSignal(row: AnyRow) {
  return asTrimmedString(row.growth_signal) || "needs_more_data";
}

function getGrowthRecommendation(row: AnyRow) {
  return (
    asTrimmedString(row.admin_recommendation) ||
    "Keep tracking. More campaign events are needed before making a strong decision."
  );
}

function getGrowthStatusLabel(signal: string) {
  const normalizedSignal = signal.toLowerCase().replaceAll("_", " ");
  return normalizedSignal.charAt(0).toUpperCase() + normalizedSignal.slice(1);
}

function getGrowthSignalTone(signal: string): Tone {
  if (signal === "profitable" || signal === "high_value_low_cost") return "emerald";
  if (signal === "needs_booking_conversion") return "amber";
  if (signal === "needs_signup_conversion") return "sky";
  if (signal === "review_spend") return "rose";
  return "violet";
}

function getRewardAmount(row: AnyRow) {
  return (
    toNumber(row.amount) ||
    toNumber(row.reward_amount) ||
    toNumber(row.payout_amount) ||
    toNumber(row.total_amount) ||
    toNumber(row.liability_amount)
  );
}

function isPaidReward(row: AnyRow) {
  const status = normalized(row.status || row.payout_status || row.payment_status);
  return status.includes("paid") || status.includes("sent");
}

function isPendingReward(row: AnyRow) {
  const status = normalized(row.status || row.payout_status || row.payment_status);
  return !isPaidReward(row) && !status.includes("cancel") && !status.includes("void");
}

function groupCount<T>(rows: T[], getKey: (row: T) => string): CountItem[] {
  const map = new Map<string, number>();

  for (const row of rows) {
    const key = getKey(row) || "Unknown";
    map.set(key, (map.get(key) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function groupRevenue(bookings: AnyRow[], getKey: (booking: AnyRow) => string): RevenueItem[] {
  const map = new Map<string, { revenue: number; bookings: number }>();

  for (const booking of bookings) {
    const key = getKey(booking) || "Unknown";
    const existing = map.get(key) || { revenue: 0, bookings: 0 };
    existing.revenue += getGrossAmount(booking) + getTaxAmount(booking);
    existing.bookings += 1;
    map.set(key, existing);
  }

  return Array.from(map.entries())
    .map(([label, value]) => ({ label, ...value }))
    .sort((a, b) => b.revenue - a.revenue);
}

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string,
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
  const className = primary
    ? "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-700/10 transition hover:bg-emerald-800"
    : "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm font-black text-slate-950 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800";

  return (
    <Link href={href} className={className}>
      {label}
      <ChevronRight className="h-4 w-4" />
    </Link>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
  href,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
  detail: string;
  href?: string;
}) {
  const content = (
    <>
      {icon ? (
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          {icon}
        </div>
      ) : null}
      <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
        {detail}
      </p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
      {content}
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
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
            {eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-sm font-semibold leading-7 text-slate-600 sm:text-base">
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
    slate: "bg-slate-400",
  }[tone];

  return (
    <div className="rounded-xl border border-slate-100 bg-[#fbfefd] p-4">
      <div className="mb-2 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-950">{label}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p>
        </div>
        <p className="shrink-0 text-sm font-black text-slate-950">
          {value.toLocaleString()}
        </p>
      </div>

      <div className="h-2.5 rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${toneClass}`} style={{ width: `${width}%` }} />
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
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-950">{label}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {bookings.toLocaleString()} bookings
          </p>
        </div>
        <p className="shrink-0 text-sm font-black text-slate-950">{money(revenue)}</p>
      </div>

      <div className="h-2.5 rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${width}%` }} />
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
                <th key={header} className="px-4 py-3 text-xs font-black uppercase tracking-[0.16em]">
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.map((row, index) => (
              <tr key={index} className="text-slate-600 transition hover:bg-slate-50">
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

function EmptyCard({ label }: { label: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
      {label}
    </p>
  );
}

function toneForIndex(index: number): Tone {
  if (index === 0) return "emerald";
  if (index === 1) return "sky";
  if (index === 2) return "violet";
  if (index === 3) return "amber";
  return "rose";
}

function buildGrowthRows(rows: AnyRow[]): GrowthCampaignItem[] {
  return rows.map((row) => {
    const clicks = toNumber(row.clicks);
    const leads = toNumber(row.leads);
    const signups = toNumber(row.signups);
    const bookings = toNumber(row.bookings);
    const attributedRevenue = toNumber(row.attributed_revenue);
    const totalCost = toNumber(row.total_cost);
    const signal = getGrowthSignal(row);

    return {
      campaignName: getGrowthLabel(row),
      channel: getGrowthChannel(row),
      clicks,
      leads,
      signups,
      bookings,
      attributedRevenue,
      totalCost,
      roiPercent: toNumber(row.roi_percent),
      costPerSignup: toNumber(row.cost_per_signup),
      costPerBooking: toNumber(row.cost_per_booking),
      signal,
      signalLabel: getGrowthStatusLabel(signal),
      recommendation: getGrowthRecommendation(row),
    };
  });
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
    ambassadorLeads,
    ambassadors,
    ambassadorReferrals,
    ambassadorRewards,
    referralRewards,
    referralCodes,
    referralEvents,
    partnerPayouts,
    programApplications,
    partnerApplications,
  ] = await Promise.all([
    safeRows<AnyRow>(supabaseAdmin.from("bookings").select("*").limit(1500), "bookings"),
    safeRows<AnyRow>(supabaseAdmin.from("gurus").select("*").limit(1500), "gurus"),
    safeRows<AnyRow>(supabaseAdmin.from("profiles").select("*").limit(1500), "profiles"),
    safeRows<AnyRow>(
      supabaseAdmin.from("launch_signups").select("*").order("created_at", { ascending: false }).limit(1500),
      "launch_signups",
    ),
    safeRows<AnyRow>(
      supabaseAdmin.from("messages").select("*").order("created_at", { ascending: false }).limit(2500),
      "messages",
    ),
    safeRows<AnyRow>(
      supabaseAdmin.from("analytics_events").select("*").order("created_at", { ascending: false }).limit(5000),
      "analytics_events",
    ),
    safeRows<AnyRow>(supabaseAdmin.from("admin_growth_campaign_roi").select("*").limit(750), "admin_growth_campaign_roi"),
    safeRows<AnyRow>(
      supabaseAdmin.from("growth_campaign_events").select("*").order("created_at", { ascending: false }).limit(5000),
      "growth_campaign_events",
    ),
    safeRows<AnyRow>(supabaseAdmin.from("growth_campaigns").select("*").limit(750), "growth_campaigns"),
    safeRows<AnyRow>(
      supabaseAdmin.from("ambassador_leads").select("*").order("created_at", { ascending: false }).limit(2000),
      "ambassador_leads",
    ),
    safeRows<AnyRow>(
      supabaseAdmin.from("ambassadors").select("*").order("created_at", { ascending: false }).limit(2000),
      "ambassadors",
    ),
    safeRows<AnyRow>(
      supabaseAdmin.from("ambassador_referrals").select("*").order("created_at", { ascending: false }).limit(2000),
      "ambassador_referrals",
    ),
    safeRows<AnyRow>(
      supabaseAdmin.from("ambassador_rewards").select("*").order("created_at", { ascending: false }).limit(2000),
      "ambassador_rewards",
    ),
    safeRows<AnyRow>(
      supabaseAdmin.from("referral_rewards").select("*").order("created_at", { ascending: false }).limit(2000),
      "referral_rewards",
    ),
    safeRows<AnyRow>(
      supabaseAdmin.from("referral_codes").select("*").order("created_at", { ascending: false }).limit(2000),
      "referral_codes",
    ),
    safeRows<AnyRow>(
      supabaseAdmin.from("referral_events").select("*").order("created_at", { ascending: false }).limit(3000),
      "referral_events",
    ),
    safeRows<AnyRow>(
      supabaseAdmin.from("partner_payouts").select("*").order("created_at", { ascending: false }).limit(2000),
      "partner_payouts",
    ),
    safeRows<AnyRow>(
      supabaseAdmin.from("program_applications").select("*").order("created_at", { ascending: false }).limit(2000),
      "program_applications",
    ),
    safeRows<AnyRow>(
      supabaseAdmin.from("partner_applications").select("*").order("created_at", { ascending: false }).limit(2000),
      "partner_applications",
    ),
  ]);

  const totalRevenue = bookings.reduce((sum, booking) => sum + getGrossAmount(booking) + getTaxAmount(booking), 0);
  const platformRevenue = bookings.reduce((sum, booking) => sum + getFeeAmount(booking), 0);
  const guruPayouts = bookings.reduce((sum, booking) => sum + getGuruNetAmount(booking), 0);

  const customerIds = new Set(
    bookings.map((booking) => getCustomerId(booking)).filter((value) => value && value !== "unknown"),
  );
  const guruIds = new Set(
    bookings.map((booking) => getGuruId(booking)).filter((value) => value && value !== "unknown"),
  );

  const paidBookings = bookings.filter(isPaidBooking);
  const completedBookings = bookings.filter(isCompletedBooking);
  const cancelledBookings = bookings.filter(isCancelledBooking);
  const unreadMessages = messages.filter(isUnreadMessage);

  const homepageVisits = analyticsEvents.filter((event) => isEvent(event, "homepage_visit"));
  const launchPageVisits = analyticsEvents.filter((event) => isEvent(event, "launch_page_visit"));
  const searchesStarted = analyticsEvents.filter((event) => isEvent(event, "search_started"));
  const guruProfileViews = analyticsEvents.filter(
    (event) => isEvent(event, "guru_profile_view") || isEvent(event, "guru_profile_view_clicked"),
  );
  const bookingStarts = analyticsEvents.filter((event) => isEvent(event, "booking_started"));
  const bookingCompletedEvents = analyticsEvents.filter((event) => isEvent(event, "booking_completed"));
  const launchSignupStarts = analyticsEvents.filter((event) => isEvent(event, "launch_signup_started"));
  const launchSignupCompletedEvents = analyticsEvents.filter((event) => isEvent(event, "launch_signup_completed"));
  const launchFormOpened = analyticsEvents.filter((event) => isEvent(event, "launch_form_opened"));
  const ctaClicks = analyticsEvents.filter((event) => isEvent(event, "homepage_cta_clicked"));
  const referralShares = analyticsEvents.filter((event) => isEvent(event, "referral_shared"));
  const referralClicksTracked = analyticsEvents.filter((event) => isEvent(event, "referral_clicked"));
  const carouselClicks = analyticsEvents.filter(
    (event) =>
      isEvent(event, "homepage_carousel_next_clicked") ||
      isEvent(event, "homepage_carousel_previous_clicked") ||
      isEvent(event, "homepage_carousel_slide_selected"),
  );
  const checkoutStarts = analyticsEvents.filter((event) => isEvent(event, "checkout_started"));
  const bookingRequestsCreated = analyticsEvents.filter((event) => isEvent(event, "booking_request_created"));
  const bookingFailures = analyticsEvents.filter(
    (event) => isEvent(event, "booking_request_failed") || isEvent(event, "checkout_failed"),
  );

  const growthRows = buildGrowthRows(growthCampaignRoi);
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
    { clicks: 0, leads: 0, signups: 0, bookings: 0, attributedRevenue: 0, totalCost: 0 },
  );

  const growthNetReturn = growthTotals.attributedRevenue - growthTotals.totalCost;
  const growthRoiPercent = growthTotals.totalCost ? (growthNetReturn / growthTotals.totalCost) * 100 : 0;
  const growthCostPerSignup = growthTotals.signups ? growthTotals.totalCost / growthTotals.signups : 0;
  const growthCostPerBooking = growthTotals.bookings ? growthTotals.totalCost / growthTotals.bookings : 0;

  const topGrowthCampaigns = growthRows
    .slice()
    .sort((a, b) => b.bookings - a.bookings || b.attributedRevenue - a.attributedRevenue || b.signups - a.signups)
    .slice(0, 8);

  const channelMap = new Map<string, { clicks: number; leads: number; signups: number; bookings: number; revenue: number; cost: number }>();

  for (const row of growthRows) {
    const current = channelMap.get(row.channel) || { clicks: 0, leads: 0, signups: 0, bookings: 0, revenue: 0, cost: 0 };
    current.clicks += row.clicks;
    current.leads += row.leads;
    current.signups += row.signups;
    current.bookings += row.bookings;
    current.revenue += row.attributedRevenue;
    current.cost += row.totalCost;
    channelMap.set(row.channel, current);
  }

  const growthChannelMix: ChannelMixItem[] = Array.from(channelMap.entries())
    .map(([label, value]) => ({ label, ...value, roi: value.cost ? ((value.revenue - value.cost) / value.cost) * 100 : 0 }))
    .sort((a, b) => b.bookings - a.bookings || b.revenue - a.revenue)
    .slice(0, 8);

  const allRewardRows = [...ambassadorRewards, ...referralRewards, ...partnerPayouts];
  const pendingRewardRows = allRewardRows.filter(isPendingReward);
  const paidRewardRows = allRewardRows.filter(isPaidReward);
  const pendingRewardLiability = pendingRewardRows.reduce((sum, row) => sum + getRewardAmount(row), 0);
  const paidRewardAmount = paidRewardRows.reduce((sum, row) => sum + getRewardAmount(row), 0);

  const zipRecruiterLeads = ambassadorLeads.filter((lead) => normalized(getLeadSource(lead)).includes("zip"));
  const indeedLeads = ambassadorLeads.filter((lead) => normalized(getLeadSource(lead)).includes("indeed"));
  const careerLinkLeads = ambassadorLeads.filter((lead) => normalized(getLeadSource(lead)).includes("career"));
  const studentHireLeads = ambassadorLeads.filter((lead) => normalized(getLeadProgram(lead)).includes("student"));
  const communityHireLeads = ambassadorLeads.filter((lead) => normalized(getLeadProgram(lead)).includes("community"));
  const contactedLeads = ambassadorLeads.filter((lead) => normalized(getStatus(lead)).includes("contact"));
  const convertedAmbassadorLeads = ambassadorLeads.filter((lead) => {
    const status = normalized(getStatus(lead));
    return status.includes("record created") || status.includes("converted") || status.includes("approved") || status.includes("active");
  });

  const sourceMix = groupCount(launchSignups, getLaunchSource).slice(0, 6);
  const roleMix = groupCount(launchSignups, getLaunchRole).slice(0, 6);
  const eventSourceMix = groupCount(analyticsEvents, getEventSource).slice(0, 8);
  const eventNameMix = groupCount(analyticsEvents, getEventName).slice(0, 10);
  const eventTypeMix = groupCount(analyticsEvents, getEventType).slice(0, 8);
  const eventPageMix = groupCount(analyticsEvents, getEventPagePath).slice(0, 8);
  const leadSourceMix = groupCount(ambassadorLeads, getLeadSource).slice(0, 10);
  const leadProgramMix = groupCount(ambassadorLeads, getLeadProgram).slice(0, 10);
  const leadStatusMix = groupCount(ambassadorLeads, getStatus).slice(0, 10);
  const ambassadorSourceMix = groupCount(ambassadors, getLeadSource).slice(0, 8);
  const referralEventMix = groupCount(referralEvents, (row) => asTrimmedString(row.event_name) || asTrimmedString(row.event_type) || getStatus(row)).slice(0, 8);
  const referralCodeMix = groupCount(referralCodes, (row) => asTrimmedString(row.source) || asTrimmedString(row.program) || asTrimmedString(row.owner_role) || "Referral Code").slice(0, 8);
  const applicationSourceMix = groupCount([...programApplications, ...partnerApplications], getLeadSource).slice(0, 8);

  const serviceRevenue = groupRevenue(bookings, getServiceName).slice(0, 6);
  const marketRevenue = groupRevenue(bookings, getCityState).slice(0, 6);
  const bookingStatus = groupCount(bookings, getStatus).slice(0, 6);
  const monthlyBookings = groupCount(bookings, (booking) => formatDateMonth(getBookingDate(booking))).slice(0, 8);

  const recentBookings: RecentBookingItem[] = bookings
    .slice()
    .sort((a, b) => new Date(getBookingDate(b)).getTime() - new Date(getBookingDate(a)).getTime())
    .slice(0, 6)
    .map((booking) => ({
      service: getServiceName(booking),
      market: getCityState(booking),
      status: getStatus(booking),
      amount: money(getGrossAmount(booking) + getTaxAmount(booking)),
      date: formatDateShort(getBookingDate(booking)),
    }));

  const recentLeads: RecentLeadItem[] = ambassadorLeads.slice(0, 10).map((lead) => ({
    name: getLeadName(lead),
    email: asTrimmedString(lead.email) || "—",
    source: getLeadSource(lead),
    program: getLeadProgram(lead),
    status: getStatus(lead),
    stage: asTrimmedString(lead.lead_stage) || asTrimmedString(lead.stage) || "—",
    referralCode: getReferralCode(lead),
    joined: formatDateShort(getCreatedAt(lead)),
  }));

  const recentEvents: RecentEventItem[] = analyticsEvents.slice(0, 10).map((event) => ({
    eventName: getEventName(event),
    eventType: getEventType(event),
    source: getEventSource(event),
    role: getEventRole(event),
    pagePath: getEventPagePath(event),
    createdAt: formatDateShort(getEventCreatedAt(event)),
  }));

  const max = {
    source: Math.max(...sourceMix.map((item) => item.count), 1),
    role: Math.max(...roleMix.map((item) => item.count), 1),
    eventSource: Math.max(...eventSourceMix.map((item) => item.count), 1),
    eventName: Math.max(...eventNameMix.map((item) => item.count), 1),
    eventType: Math.max(...eventTypeMix.map((item) => item.count), 1),
    eventPage: Math.max(...eventPageMix.map((item) => item.count), 1),
    leadSource: Math.max(...leadSourceMix.map((item) => item.count), 1),
    leadProgram: Math.max(...leadProgramMix.map((item) => item.count), 1),
    leadStatus: Math.max(...leadStatusMix.map((item) => item.count), 1),
    ambassadorSource: Math.max(...ambassadorSourceMix.map((item) => item.count), 1),
    referralEvent: Math.max(...referralEventMix.map((item) => item.count), 1),
    referralCode: Math.max(...referralCodeMix.map((item) => item.count), 1),
    applicationSource: Math.max(...applicationSourceMix.map((item) => item.count), 1),
    status: Math.max(...bookingStatus.map((item) => item.count), 1),
    month: Math.max(...monthlyBookings.map((item) => item.count), 1),
    serviceRevenue: Math.max(...serviceRevenue.map((item) => item.revenue), 1),
    marketRevenue: Math.max(...marketRevenue.map((item) => item.revenue), 1),
    growthCampaignClicks: Math.max(...growthRows.map((row) => row.clicks), 1),
    growthChannelBookings: Math.max(...growthChannelMix.map((row) => row.bookings), 1),
  };

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
      referralClicks: referralClicksTracked.length + referralEvents.length,
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
      ambassadorLeads: ambassadorLeads.length,
      ambassadors: ambassadors.length,
      activeAmbassadors: ambassadors.filter(isActiveAmbassador).length,
      zipRecruiterLeads: zipRecruiterLeads.length,
      indeedLeads: indeedLeads.length,
      careerLinkLeads: careerLinkLeads.length,
      studentHireLeads: studentHireLeads.length,
      communityHireLeads: communityHireLeads.length,
      contactedLeads: contactedLeads.length,
      convertedAmbassadorLeads: convertedAmbassadorLeads.length,
      ambassadorReferrals: ambassadorReferrals.length,
      ambassadorRewards: ambassadorRewards.length,
      referralRewards: referralRewards.length,
      referralCodes: referralCodes.length,
      referralEvents: referralEvents.length,
      partnerPayouts: partnerPayouts.length,
      programApplications: programApplications.length,
      partnerApplications: partnerApplications.length,
      pendingRewardLiability,
      paidRewardAmount,
      bookingConversion: calcPercent(completedBookings.length, bookings.length),
      paidRate: calcPercent(paidBookings.length, bookings.length),
      cancellationRate: calcPercent(cancelledBookings.length, bookings.length),
      takeRate: calcPercent(platformRevenue, totalRevenue),
      profileViewRate: calcPercent(guruProfileViews.length, homepageVisits.length),
      searchEngagementRate: calcPercent(searchesStarted.length, homepageVisits.length),
      bookingStartRate: calcPercent(bookingStarts.length, searchesStarted.length),
      launchFormOpenRate: calcPercent(launchFormOpened.length, homepageVisits.length),
      launchSignupCompletionRate: calcPercent(launchSignupCompletedEvents.length, launchSignupStarts.length),
      ambassadorLeadConversionRate: calcPercent(convertedAmbassadorLeads.length, ambassadorLeads.length),
      leadContactRate: calcPercent(contactedLeads.length, ambassadorLeads.length),
    },
    sourceMix,
    roleMix,
    eventSourceMix,
    eventNameMix,
    eventTypeMix,
    eventPageMix,
    leadSourceMix,
    leadProgramMix,
    leadStatusMix,
    ambassadorSourceMix,
    referralEventMix,
    referralCodeMix,
    applicationSourceMix,
    serviceRevenue,
    marketRevenue,
    bookingStatus,
    monthlyBookings,
    recentBookings,
    recentLeads,
    recentEvents,
    topGrowthCampaigns,
    growthChannelMix,
    max,
  };
}

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/admin/login");
  }

  const analytics = await getAnalyticsData();

  return (
    <main className="min-h-screen bg-[#f7fbf8] px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
                Platform Analytics
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Measure SitGuru growth, conversion, booking health, traffic, and network strength.
              </h1>
              <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-slate-600 sm:text-base">
                This dashboard now combines booking, message, referral, ambassador, growth-campaign, launch, and tracked event data so you can see whether SitGuru is growing through Pet Parents, Gurus, Ambassadors, ZipRecruiter, Indeed, PA CareerLink, and referral programs.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {adminLinks.map((link) => (
                <ActionLink key={link.href} href={link.href} label={link.label} primary={link.primary} />
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<Activity className="h-5 w-5" />}
              label="Tracked Events"
              value={analytics.totals.analyticsEvents.toLocaleString()}
              detail={`${analytics.totals.homepageVisits.toLocaleString()} homepage visits and ${analytics.totals.searchesStarted.toLocaleString()} searches started.`}
              href="/admin/audit-trail"
            />
            <StatCard
              icon={<SearchIcon />}
              label="Search Engagement"
              value={percent(analytics.totals.searchEngagementRate)}
              detail={`${analytics.totals.searchesStarted.toLocaleString()} searches from tracked traffic.`}
              href="/admin/analytics"
            />
            <StatCard
              icon={<PawPrint className="h-5 w-5" />}
              label="Guru Profile Views"
              value={analytics.totals.guruProfileViews.toLocaleString()}
              detail={`${percent(analytics.totals.profileViewRate)} of homepage visits led toward Guru profiles.`}
              href="/admin/gurus"
            />
            <StatCard
              icon={<Sparkles className="h-5 w-5" />}
              label="Launch Conversion"
              value={percent(analytics.totals.launchSignupCompletionRate)}
              detail={`${analytics.totals.launchSignupCompletedEvents.toLocaleString()} tracked launch form completions.`}
              href="/admin/launch-signups"
            />
          </div>
        </section>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<DollarSign className="h-5 w-5" />}
            label="Total Revenue"
            value={money(analytics.totals.totalRevenue)}
            detail="Gross booking amount plus captured tax across marketplace bookings."
            href="/admin/financials"
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="Platform Revenue"
            value={money(analytics.totals.platformRevenue)}
            detail={`${percent(analytics.totals.takeRate)} current estimated SitGuru take rate.`}
            href="/admin/financials/profit-loss"
          />
          <StatCard
            icon={<CalendarCheck className="h-5 w-5" />}
            label="Completed Bookings"
            value={analytics.totals.completedBookings.toLocaleString()}
            detail={`${percent(analytics.totals.bookingConversion)} booking completion rate from booking records.`}
            href="/admin/bookings?filter=completed"
          />
          <StatCard
            icon={<HandCoins className="h-5 w-5" />}
            label="Guru Payout Exposure"
            value={money(analytics.totals.guruPayouts)}
            detail="Estimated Guru payout exposure from booking records."
            href="/admin/financials/payouts"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="Ambassador Leads"
            value={analytics.totals.ambassadorLeads.toLocaleString()}
            detail={`${analytics.totals.contactedLeads.toLocaleString()} contacted · ${percent(analytics.totals.leadContactRate)} contact rate.`}
            href="/admin/ambassador-leads"
          />
          <StatCard
            icon={<UserCheck className="h-5 w-5" />}
            label="Active Ambassadors"
            value={analytics.totals.activeAmbassadors.toLocaleString()}
            detail={`${analytics.totals.ambassadors.toLocaleString()} total Ambassador records in Supabase.`}
            href="/admin/ambassadors"
          />
          <StatCard
            icon={<Share2 className="h-5 w-5" />}
            label="Referral Codes"
            value={analytics.totals.referralCodes.toLocaleString()}
            detail={`${analytics.totals.referralEvents.toLocaleString()} referral events and tracked referral clicks.`}
            href="/admin/referrals"
          />
          <StatCard
            icon={<HandCoins className="h-5 w-5" />}
            label="Reward Liability"
            value={money(analytics.totals.pendingRewardLiability)}
            detail={`${money(analytics.totals.paidRewardAmount)} already marked paid across reward/payout rows.`}
            href="/admin/referrals/payouts"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<BriefcaseBusiness className="h-5 w-5" />}
            label="ZipRecruiter Leads"
            value={analytics.totals.zipRecruiterLeads.toLocaleString()}
            detail="Ambassador leads sourced from ZipRecruiter and ZipRecruiter database workflows."
            href="/admin/ambassador-leads?source=ZipRecruiter"
          />
          <StatCard
            icon={<Megaphone className="h-5 w-5" />}
            label="Indeed Leads"
            value={analytics.totals.indeedLeads.toLocaleString()}
            detail="Indeed Student Hire and Ambassador recruiting leads."
            href="/admin/ambassador-leads?source=Indeed"
          />
          <StatCard
            icon={<ShieldCheck className="h-5 w-5" />}
            label="Student Hire Leads"
            value={analytics.totals.studentHireLeads.toLocaleString()}
            detail={`${analytics.totals.communityHireLeads.toLocaleString()} Community Hire leads also tracked.`}
            href="/admin/hr"
          />
          <StatCard
            icon={<Handshake className="h-5 w-5" />}
            label="Partner / Program Apps"
            value={(analytics.totals.programApplications + analytics.totals.partnerApplications).toLocaleString()}
            detail="Program and partner applications included in growth analytics."
            href="/admin/referrals/applications"
          />
        </div>

        <div className="grid gap-8 xl:grid-cols-2">
          <SectionCard
            eyebrow="Tracked Funnel"
            title="Homepage to booking behavior"
            description="These numbers come from the analytics_events table and show how visitors are moving through the platform."
            actions={<ActionLink href="/admin/audit-trail" label="Audit Trail" />}
          >
            <div className="space-y-5">
              <BarRow label="Homepage visits" value={analytics.totals.homepageVisits} max={Math.max(analytics.totals.homepageVisits, 1)} detail="Users landing on the homepage" />
              <BarRow label="Searches started" value={analytics.totals.searchesStarted} max={Math.max(analytics.totals.homepageVisits, 1)} detail={`${percent(analytics.totals.searchEngagementRate)} of homepage visits`} tone="sky" />
              <BarRow label="Guru profile views" value={analytics.totals.guruProfileViews} max={Math.max(analytics.totals.homepageVisits, 1)} detail={`${percent(analytics.totals.profileViewRate)} profile-view signal`} tone="violet" />
              <BarRow label="Booking starts" value={analytics.totals.bookingStarts} max={Math.max(analytics.totals.homepageVisits, 1)} detail="Users beginning the booking process" tone="amber" />
              <BarRow label="Booking completed events" value={analytics.totals.bookingCompletedEvents} max={Math.max(analytics.totals.homepageVisits, 1)} detail="Tracked booking_completed analytics events" tone="rose" />
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Booking Flow"
            title="Booking request and checkout tracking"
            description="Track request creation, checkout starts, failures, successful booking records, and admin booking health."
            actions={<ActionLink href="/admin/bookings" label="Open Bookings" />}
          >
            <div className="space-y-5">
              <BarRow label="Booking requests created" value={analytics.totals.bookingRequestsCreated} max={Math.max(analytics.totals.bookingStarts, 1)} detail="Tracked booking_request_created events" />
              <BarRow label="Checkout started" value={analytics.totals.checkoutStarts} max={Math.max(analytics.totals.bookingRequestsCreated, 1)} detail="Users redirected toward Stripe checkout" tone="sky" />
              <BarRow label="Completed booking records" value={analytics.totals.completedBookings} max={Math.max(analytics.totals.bookings, 1)} detail={`${percent(analytics.totals.bookingConversion)} completion rate from booking rows`} tone="violet" />
              <BarRow label="Booking / checkout failures" value={analytics.totals.bookingFailures} max={Math.max(analytics.totals.bookingFailures + analytics.totals.bookingRequestsCreated, 1)} detail="Tracked booking_request_failed and checkout_failed events" tone="rose" />
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-8 xl:grid-cols-2">
          <SectionCard
            eyebrow="Ambassador Pipeline"
            title="ZipRecruiter, Indeed, Student Hire, and Community Hire funnel"
            description="This reads ambassador_leads and ambassadors so HR, referrals, and analytics share the same recruiting picture."
            actions={
              <>
                <ActionLink href="/admin/ambassador-leads" label="Lead Pipeline" />
                <ActionLink href="/admin/ambassadors" label="Ambassadors" primary />
              </>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Contact Rate</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{percent(analytics.totals.leadContactRate)}</p>
                <p className="mt-2 text-sm font-semibold text-slate-600">{analytics.totals.contactedLeads.toLocaleString()} of {analytics.totals.ambassadorLeads.toLocaleString()} leads contacted.</p>
              </div>
              <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">Conversion Signal</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{percent(analytics.totals.ambassadorLeadConversionRate)}</p>
                <p className="mt-2 text-sm font-semibold text-slate-600">{analytics.totals.convertedAmbassadorLeads.toLocaleString()} converted/created/approved signals.</p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {analytics.leadSourceMix.length ? (
                analytics.leadSourceMix.map((item, index) => (
                  <BarRow key={item.label} label={item.label} value={item.count} max={analytics.max.leadSource} detail="Ambassador leads by source" tone={toneForIndex(index)} />
                ))
              ) : (
                <EmptyCard label="No Ambassador lead source data yet." />
              )}
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Lead Programs"
            title="Program and stage mix"
            description="Track whether leads are flowing through Student Hire, Community Hire, Ambassador-only, Guru + Ambassador, and other paths."
            actions={<ActionLink href="/admin/hr" label="Open HR" />}
          >
            <div className="space-y-5">
              {analytics.leadProgramMix.length ? (
                analytics.leadProgramMix.map((item, index) => (
                  <BarRow key={item.label} label={item.label} value={item.count} max={analytics.max.leadProgram} detail="Leads grouped by program/candidate path" tone={toneForIndex(index)} />
                ))
              ) : (
                <EmptyCard label="No Ambassador program data yet." />
              )}
            </div>

            <div className="mt-6 space-y-5">
              {analytics.leadStatusMix.length ? (
                analytics.leadStatusMix.slice(0, 5).map((item, index) => (
                  <BarRow key={item.label} label={item.label} value={item.count} max={analytics.max.leadStatus} detail="Lead status / stage" tone={toneForIndex(index)} />
                ))
              ) : null}
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
              <StatMini label="Clicks" value={analytics.totals.growthClicks.toLocaleString()} tone="emerald" />
              <StatMini label="Leads" value={analytics.totals.growthLeads.toLocaleString()} tone="sky" />
              <StatMini label="Signups" value={analytics.totals.growthSignups.toLocaleString()} tone="violet" />
              <StatMini label="Bookings" value={analytics.totals.growthBookings.toLocaleString()} tone="amber" />
            </div>

            <div className="mt-6 space-y-5">
              {analytics.topGrowthCampaigns.length ? (
                analytics.topGrowthCampaigns.slice(0, 6).map((campaign, index) => (
                  <BarRow key={`${campaign.campaignName}-${campaign.channel}`} label={campaign.campaignName} value={campaign.clicks} max={analytics.max.growthCampaignClicks} detail={`${campaign.channel} · ${campaign.signups.toLocaleString()} signups · ${campaign.bookings.toLocaleString()} bookings · ${percent(campaign.roiPercent)} ROI`} tone={getGrowthSignalTone(campaign.signal) || toneForIndex(index)} />
                ))
              ) : (
                <EmptyCard label="No campaign ROI rows yet. Add campaign events and costs to populate this section." />
              )}
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Growth Strategy"
            title="Channel return by bookings and revenue"
            description="Use channel ROI to decide whether to scale, refine, pause, or improve conversion."
            actions={<ActionLink href="/admin/financials/pro-forma" label="Forecasting" />}
          >
            <div className="space-y-5">
              {analytics.growthChannelMix.length ? (
                analytics.growthChannelMix.map((channel, index) => (
                  <BarRow key={channel.label} label={channel.label} value={channel.bookings} max={analytics.max.growthChannelBookings} detail={`${channel.signups.toLocaleString()} signups · ${money(channel.revenue)} revenue · ${money(channel.cost)} cost · ${percent(channel.roi)} ROI`} tone={toneForIndex(index)} />
                ))
              ) : (
                <EmptyCard label="No channel mix available yet. Campaign events with source/channel values will populate this view." />
              )}
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-8 xl:grid-cols-2">
          <SectionCard
            eyebrow="Referral Network"
            title="Referral event and code activity"
            description="Track referral-code creation, click/conversion events, Ambassador referrals, Pet Parent referrals, Guru referrals, and partner/referral payout signals."
            actions={
              <>
                <ActionLink href="/admin/referrals" label="Referral Command Center" primary />
                <ActionLink href="/admin/referrals/payouts" label="Payouts" />
              </>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <StatMini label="Referral Events" value={analytics.totals.referralEvents.toLocaleString()} tone="emerald" />
              <StatMini label="Ambassador Referrals" value={analytics.totals.ambassadorReferrals.toLocaleString()} tone="sky" />
              <StatMini label="Referral Rewards" value={analytics.totals.referralRewards.toLocaleString()} tone="violet" />
              <StatMini label="Partner Payouts" value={analytics.totals.partnerPayouts.toLocaleString()} tone="amber" />
            </div>

            <div className="mt-6 space-y-5">
              {analytics.referralEventMix.length ? (
                analytics.referralEventMix.map((item, index) => (
                  <BarRow key={item.label} label={item.label} value={item.count} max={analytics.max.referralEvent} detail="Referral event mix" tone={toneForIndex(index)} />
                ))
              ) : (
                <EmptyCard label="No referral event data yet." />
              )}
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Referral Code Sources"
            title="Referral code ownership and source mix"
            description="Shows how referral codes are grouped by source, program, or owner role depending on available columns."
            actions={<ActionLink href="/admin/referrals/pet-parents" label="Pet Parent Referrals" />}
          >
            <div className="space-y-5">
              {analytics.referralCodeMix.length ? (
                analytics.referralCodeMix.map((item, index) => (
                  <BarRow key={item.label} label={item.label} value={item.count} max={analytics.max.referralCode} detail="Referral code records" tone={toneForIndex(index)} />
                ))
              ) : (
                <EmptyCard label="No referral code records found yet." />
              )}
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-8 xl:grid-cols-2">
          <SectionCard
            eyebrow="Services"
            title="Revenue by service"
            description="Identify which care categories are producing the strongest booking volume and customer spend."
            actions={<ActionLink href="/admin/bookings" label="View Bookings" />}
          >
            <div className="space-y-5">
              {analytics.serviceRevenue.length ? (
                analytics.serviceRevenue.map((item) => (
                  <RevenueBarRow key={item.label} label={item.label} revenue={item.revenue} bookings={item.bookings} max={analytics.max.serviceRevenue} />
                ))
              ) : (
                <EmptyCard label="No service revenue data yet." />
              )}
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Markets"
            title="Revenue by location"
            description="See which cities and states are showing the strongest marketplace traction."
            actions={<ActionLink href="/admin/exports" label="Export" />}
          >
            <div className="space-y-5">
              {analytics.marketRevenue.length ? (
                analytics.marketRevenue.map((item) => (
                  <RevenueBarRow key={item.label} label={item.label} revenue={item.revenue} bookings={item.bookings} max={analytics.max.marketRevenue} />
                ))
              ) : (
                <EmptyCard label="No market revenue data yet." />
              )}
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-8 xl:grid-cols-2">
          <SectionCard
            eyebrow="Event Sources"
            title="Where tracked behavior is coming from"
            description="This uses source values from analytics_events, including direct, social, referral, and campaign links."
            actions={<ActionLink href="/admin/exports" label="Export" />}
          >
            <div className="space-y-5">
              {analytics.eventSourceMix.length ? (
                analytics.eventSourceMix.map((item, index) => (
                  <BarRow key={item.label} label={item.label} value={item.count} max={analytics.max.eventSource} detail={`${percent(calcPercent(item.count, analytics.totals.analyticsEvents))} of tracked events`} tone={toneForIndex(index)} />
                ))
              ) : (
                <EmptyCard label="No analytics event source data yet." />
              )}
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Event Mix"
            title="Top tracked event names"
            description="See which tracked actions are happening most often across the platform."
            actions={<ActionLink href="/admin/audit-trail" label="Audit Trail" />}
          >
            <div className="space-y-5">
              {analytics.eventNameMix.length ? (
                analytics.eventNameMix.map((item, index) => (
                  <BarRow key={item.label} label={item.label} value={item.count} max={analytics.max.eventName} detail={`${percent(calcPercent(item.count, analytics.totals.analyticsEvents))} of all analytics events`} tone={toneForIndex(index)} />
                ))
              ) : (
                <EmptyCard label="No analytics events found yet." />
              )}
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-8 xl:grid-cols-2">
          <SectionCard
            eyebrow="Booking Status"
            title="Booking status health"
            description="Track completed, paid, pending, cancelled, or other booking statuses."
            actions={<ActionLink href="/admin/bookings" label="Open Bookings" />}
          >
            <div className="space-y-5">
              {analytics.bookingStatus.length ? (
                analytics.bookingStatus.map((item, index) => (
                  <BarRow key={item.label} label={item.label} value={item.count} max={analytics.max.status} detail={`${percent(calcPercent(item.count, analytics.totals.bookings))} of bookings`} tone={toneForIndex(index)} />
                ))
              ) : (
                <EmptyCard label="No booking status data yet." />
              )}
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Trend"
            title="Bookings by month"
            description="Simple month grouping based on booking, start, request, or created date."
            actions={<ActionLink href="/admin/exports" label="Export" />}
          >
            <div className="space-y-5">
              {analytics.monthlyBookings.length ? (
                analytics.monthlyBookings.map((item, index) => (
                  <BarRow key={item.label} label={item.label} value={item.count} max={analytics.max.month} detail="Tracked booking rows" tone={toneForIndex(index)} />
                ))
              ) : (
                <EmptyCard label="No monthly booking data yet." />
              )}
            </div>
          </SectionCard>
        </div>

        <SectionCard
          eyebrow="Campaign ROI Detail"
          title="Top growth campaigns"
          description="Detailed campaign table for admin decision-making: scale profitable channels, improve weak conversion points, and pause spend that is not producing signups or bookings."
          actions={<ActionLink href="/admin/referrals" label="Growth Command Center" primary />}
        >
          <TableCard
            headers={["Campaign", "Channel", "Clicks", "Signups", "Bookings", "Revenue", "Cost", "ROI", "Signal", "Recommendation"]}
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

        <SectionCard
          eyebrow="Ambassador Lead Activity"
          title="Newest Ambassador and recruiting leads"
          description="Latest ambassador_leads rows by name, source, program, status, lead stage, and referral code."
          actions={
            <>
              <ActionLink href="/admin/ambassador-leads" label="Open Lead Pipeline" primary />
              <ActionLink href="/admin/hr" label="HR" />
            </>
          }
        >
          <TableCard
            headers={["Name", "Email", "Source", "Program", "Status", "Stage", "Referral Code", "Date"]}
            rows={
              analytics.recentLeads.length
                ? analytics.recentLeads.map((lead) => [
                    lead.name,
                    lead.email,
                    lead.source,
                    lead.program,
                    lead.status,
                    lead.stage,
                    lead.referralCode,
                    lead.joined,
                  ])
                : [["No leads yet", "—", "—", "—", "—", "—", "—", "—"]]
            }
          />
        </SectionCard>

        <SectionCard
          eyebrow="Recent Analytics Events"
          title="Newest tracked user actions"
          description="A quick readout of the latest analytics_events rows."
          actions={<ActionLink href="/admin/audit-trail" label="Audit Trail" primary />}
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
          actions={<ActionLink href="/admin/bookings" label="View All Bookings" primary />}
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

        <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 text-sm font-semibold leading-7 text-slate-600 shadow-sm">
          <span className="font-black text-emerald-800">Supabase wiring:</span>{" "}
          this page safely reads bookings, gurus, profiles, launch_signups, messages, analytics_events, growth campaign tables/views, ambassador_leads, ambassadors, ambassador_referrals, ambassador_rewards, referral_rewards, referral_codes, referral_events, partner_payouts, program_applications, and partner_applications. Missing optional tables are skipped without breaking the admin page.
        </div>
      </div>
    </main>
  );
}

function StatMini({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: Tone;
}) {
  const classes = {
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    sky: "border-sky-100 bg-sky-50 text-sky-700",
    violet: "border-violet-100 bg-violet-50 text-violet-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    rose: "border-rose-100 bg-rose-50 text-rose-700",
    slate: "border-slate-100 bg-slate-50 text-slate-700",
  }[tone];

  return (
    <div className={`rounded-2xl border p-4 ${classes}`}>
      <p className="text-xs font-black uppercase tracking-[0.18em]">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function SearchIcon() {
  return <MousePointerClick className="h-5 w-5" />;
}
