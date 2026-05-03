import Link from "next/link";
import { revalidatePath } from "next/cache";
import {
  ArrowLeft,
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  Download,
  Edit,
  ExternalLink,
  Globe,
  MessageCircle,
  PauseCircle,
  PlayCircle,
  RefreshCcw,
  ShieldCheck,
  ShieldX,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import BackToPartnersButton from "../_components/back-to-partners-button";
import SupabaseCoordinationBanner from "../_components/supabase-coordination-banner";

type Affiliate = {
  id: string;
  user_id: string | null;
  application_id: string | null;
  display_name: string;
  email: string;
  phone: string | null;
  affiliate_type: string;
  platform: string | null;
  website: string | null;
  social_url: string | null;
  audience_size: number;
  niche: string | null;
  referral_code: string | null;
  customer_referral_url: string | null;
  guru_referral_url: string | null;
  partner_referral_url: string | null;
  commission_type: "fixed" | "percent" | "manual";
  commission_value: number;
  clicks: number;
  signups: number;
  bookings: number;
  payout_balance: number;
  lifetime_earnings: number;
  status: "active" | "paused" | "suspended" | "archived";
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

type PartnerTrackingEvent = {
  id: string;
  partner_id: string | null;
  ambassador_id: string | null;
  affiliate_id: string | null;
  campaign_id: string | null;
  referral_code: string | null;
  event_type: string;
  event_source: string | null;
  event_medium: string | null;
  event_campaign: string | null;
  landing_page: string | null;
  current_url: string | null;
  referrer_url: string | null;
  user_id: string | null;
  customer_id: string | null;
  guru_id: string | null;
  booking_id: string | null;
  revenue_amount: number | null;
  reward_amount: number | null;
  currency: string | null;
  created_at: string;
};

type AffiliateTrackingSummary = {
  clicks: number;
  views: number;
  signups: number;
  bookings: number;
  revenue: number;
  rewards: number;
  lastActivity: string | null;
  sources: string[];
};

function formatLabel(value: string | null | undefined) {
  if (!value) return "Not Available";

  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined) return "$0";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return "0";

  return new Intl.NumberFormat("en-US").format(value);
}

function percentage(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function statusClasses(status: Affiliate["status"]) {
  switch (status) {
    case "active":
      return "border-green-200 bg-green-50 text-green-800";
    case "paused":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "suspended":
      return "border-red-200 bg-red-50 text-red-800";
    case "archived":
      return "border-slate-200 bg-slate-50 text-slate-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function commissionClasses(type: Affiliate["commission_type"]) {
  switch (type) {
    case "percent":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "manual":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "fixed":
      return "border-green-200 bg-green-50 text-green-800";
    default:
      return "border-green-200 bg-green-50 text-green-800";
  }
}

function affiliateIcon(type: string | null, platform: string | null) {
  const safeValue = `${type || ""} ${platform || ""}`.toLowerCase();

  if (safeValue.includes("instagram")) return "📸";
  if (safeValue.includes("tiktok")) return "🎵";
  if (safeValue.includes("youtube")) return "▶️";
  if (safeValue.includes("blog")) return "📝";
  if (safeValue.includes("creator")) return "✨";
  if (safeValue.includes("guru")) return "🐾";
  if (safeValue.includes("influencer")) return "📣";

  return "📈";
}

function createReferralCode(name: string | null) {
  const base = (name || "AFFILIATE")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);

  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();

  return `${base || "AFF"}-${suffix}`;
}

function buildReferralBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3001"
  );
}

function buildCustomerReferralUrl(referralCode: string | null) {
  if (!referralCode) return "Not generated";
  return `${buildReferralBaseUrl()}/?ref=${referralCode}`;
}

function buildGuruReferralUrl(referralCode: string | null) {
  if (!referralCode) return "Not generated";
  return `${buildReferralBaseUrl()}/gurus/apply?ref=${referralCode}`;
}

function buildPartnerReferralUrl(referralCode: string | null) {
  if (!referralCode) return "Not generated";
  return `${buildReferralBaseUrl()}/partners?ref=${referralCode}`;
}

function getPlatformKey(affiliate: Affiliate) {
  return affiliate.platform?.trim() || "Not provided";
}

function getNicheKey(affiliate: Affiliate) {
  return affiliate.niche?.trim() || "Not provided";
}

function countByValue<T>(items: T[], getKey: (item: T) => string, limit: number) {
  const counts = new Map<string, number>();

  items.forEach((item) => {
    const key = getKey(item);
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

function isSignupEvent(eventType: string) {
  return ["signup", "customer_signup", "guru_signup", "partner_signup"].includes(
    eventType
  );
}

function isBookingEvent(eventType: string) {
  return ["booking", "completed_booking"].includes(eventType);
}

function buildTrackingSummaries(events: PartnerTrackingEvent[]) {
  const summaries = new Map<string, AffiliateTrackingSummary>();

  events.forEach((event) => {
    if (!event.affiliate_id) return;

    const current = summaries.get(event.affiliate_id) || {
      clicks: 0,
      views: 0,
      signups: 0,
      bookings: 0,
      revenue: 0,
      rewards: 0,
      lastActivity: null,
      sources: [],
    };

    if (event.event_type === "click") current.clicks += 1;
    if (event.event_type === "view") current.views += 1;
    if (isSignupEvent(event.event_type)) current.signups += 1;
    if (isBookingEvent(event.event_type)) current.bookings += 1;

    current.revenue += Number(event.revenue_amount || 0);
    current.rewards += Number(event.reward_amount || 0);

    if (
      !current.lastActivity ||
      new Date(event.created_at).getTime() >
        new Date(current.lastActivity).getTime()
    ) {
      current.lastActivity = event.created_at;
    }

    const source = event.event_source || event.event_campaign;
    if (source && !current.sources.includes(source)) {
      current.sources.push(source);
    }

    summaries.set(event.affiliate_id, current);
  });

  return summaries;
}

function getAffiliateTrackingSummary(
  summaries: Map<string, AffiliateTrackingSummary>,
  affiliateId: string
) {
  return (
    summaries.get(affiliateId) || {
      clicks: 0,
      views: 0,
      signups: 0,
      bookings: 0,
      revenue: 0,
      rewards: 0,
      lastActivity: null,
      sources: [],
    }
  );
}

async function updateAffiliateStatusAction(formData: FormData) {
  "use server";

  const affiliateId = String(formData.get("affiliateId") || "");
  const status = String(formData.get("status") || "") as Affiliate["status"];

  if (!affiliateId || !status) return;

  const supabase = await createClient();

  await supabase
    .from("affiliates")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", affiliateId);

  revalidatePath("/admin/partners/affiliates");
  revalidatePath("/admin/partners");
}

async function regenerateAffiliateReferralCodeAction(formData: FormData) {
  "use server";

  const affiliateId = String(formData.get("affiliateId") || "");
  const displayName = String(formData.get("displayName") || "Affiliate");

  if (!affiliateId) return;

  const referralCode = createReferralCode(displayName);
  const supabase = await createClient();

  await supabase
    .from("affiliates")
    .update({
      referral_code: referralCode,
      customer_referral_url: buildCustomerReferralUrl(referralCode),
      guru_referral_url: buildGuruReferralUrl(referralCode),
      partner_referral_url: buildPartnerReferralUrl(referralCode),
      updated_at: new Date().toISOString(),
    })
    .eq("id", affiliateId);

  revalidatePath("/admin/partners/affiliates");
  revalidatePath("/admin/partners");
}

async function updateAffiliatePayoutAction(formData: FormData) {
  "use server";

  const affiliateId = String(formData.get("affiliateId") || "");
  const payoutBalance = Number(formData.get("payoutBalance") || 0);
  const lifetimeEarnings = Number(formData.get("lifetimeEarnings") || 0);

  if (!affiliateId) return;

  const supabase = await createClient();

  await supabase
    .from("affiliates")
    .update({
      payout_balance: payoutBalance,
      lifetime_earnings: lifetimeEarnings,
      updated_at: new Date().toISOString(),
    })
    .eq("id", affiliateId);

  revalidatePath("/admin/partners/affiliates");
  revalidatePath("/admin/partners");
}

export default async function AdminAffiliatesPage() {
  const supabase = await createClient();

  const [{ data, error }, trackingResponse] = await Promise.all([
    supabase.from("affiliates").select("*").order("created_at", {
      ascending: false,
    }),
    supabase
      .from("partner_tracking_events")
      .select(
        "id, partner_id, ambassador_id, affiliate_id, campaign_id, referral_code, event_type, event_source, event_medium, event_campaign, landing_page, current_url, referrer_url, user_id, customer_id, guru_id, booking_id, revenue_amount, reward_amount, currency, created_at"
      )
      .not("affiliate_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(5000),
  ]);

  const affiliates = (data ?? []) as Affiliate[];
  const trackingEvents = (trackingResponse.data ?? []) as PartnerTrackingEvent[];
  const trackingError = trackingResponse.error;
  const trackingSummaries = buildTrackingSummaries(trackingEvents);

  const activeCount = affiliates.filter(
    (affiliate) => affiliate.status === "active"
  ).length;

  const pausedCount = affiliates.filter(
    (affiliate) => affiliate.status === "paused"
  ).length;

  const suspendedCount = affiliates.filter(
    (affiliate) => affiliate.status === "suspended"
  ).length;

  const archivedCount = affiliates.filter(
    (affiliate) => affiliate.status === "archived"
  ).length;

  const affiliatesWithReferralCodes = affiliates.filter(
    (affiliate) => affiliate.referral_code
  ).length;

  const totalAudience = affiliates.reduce(
    (sum, affiliate) => sum + Number(affiliate.audience_size || 0),
    0
  );

  const totalPayoutBalance = affiliates.reduce(
    (sum, affiliate) => sum + Number(affiliate.payout_balance || 0),
    0
  );

  const totalLifetimeEarnings = affiliates.reduce(
    (sum, affiliate) => sum + Number(affiliate.lifetime_earnings || 0),
    0
  );

  const totalTrackedClicks = trackingEvents.filter(
    (event) => event.event_type === "click" && event.affiliate_id
  ).length;

  const totalTrackedSignups = trackingEvents.filter(
    (event) => event.affiliate_id && isSignupEvent(event.event_type)
  ).length;

  const totalTrackedBookings = trackingEvents.filter(
    (event) => event.affiliate_id && isBookingEvent(event.event_type)
  ).length;

  const totalTrackedRevenue = trackingEvents.reduce(
    (sum, event) => sum + Number(event.revenue_amount || 0),
    0
  );

  const activeRate = percentage(activeCount, affiliates.length);
  const signupConversionRate = percentage(totalTrackedSignups, totalTrackedClicks);
  const bookingConversionRate = percentage(totalTrackedBookings, totalTrackedClicks);
  const referralCodeRate = percentage(
    affiliatesWithReferralCodes,
    affiliates.length
  );

  const topPlatforms = countByValue(affiliates, getPlatformKey, 5);
  const topNiches = countByValue(affiliates, getNicheKey, 5);

  return (
    <main className="min-h-screen bg-[#F7FAF3] text-[#17382B]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <BackToPartnersButton />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/admin/partners/ambassadors"
                  className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous: Ambassadors
                </Link>

                <Link
                  href="/admin/partners/campaigns"
                  className="inline-flex items-center justify-center rounded-2xl bg-[#007A3D] px-5 py-3 text-sm font-black !text-white shadow-sm transition hover:bg-[#006B35]"
                >
                  Next: Campaigns
                  <ArrowRight className="ml-2 h-4 w-4 !text-white" />
                </Link>

                <Link
                  href="/api/admin/partners/affiliates/export"
                  className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Link>
              </div>
            </div>

            <div className="max-w-4xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-800">
                <BarChart3 className="h-7 w-7" />
              </div>

              <p className="mt-6 text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
                Creator, Guru, and Referral Growth
              </p>

              <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight text-[#17382B] sm:text-5xl lg:text-6xl">
                Affiliates
              </h1>

              <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-700 sm:text-lg">
                Manage approved SitGuru affiliates, creators, bloggers,
                influencers, Gurus, referral promoters, tracking links, clicks,
                signups, bookings, commissions, payout balances, and affiliate
                growth attribution.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-green-100 bg-green-50 p-5 shadow-sm">
            <p className="text-sm font-black text-green-900">Active</p>
            <p className="mt-3 text-4xl font-black leading-none text-green-950">
              {activeCount}
            </p>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
              Affiliates currently active in SitGuru campaigns.
            </p>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
            <p className="text-sm font-black text-blue-900">Tracked Clicks</p>
            <p className="mt-3 text-4xl font-black leading-none text-blue-950">
              {formatNumber(totalTrackedClicks)}
            </p>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
              Affiliate click events from tracking records.
            </p>
          </div>

          <div className="rounded-3xl border border-purple-100 bg-purple-50 p-5 shadow-sm">
            <p className="text-sm font-black text-purple-900">
              Tracked Bookings
            </p>
            <p className="mt-3 text-4xl font-black leading-none text-purple-950">
              {formatNumber(totalTrackedBookings)}
            </p>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
              Booking events attributed to affiliate links.
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
            <p className="text-sm font-black text-emerald-900">
              Payout Balance
            </p>
            <p className="mt-3 text-4xl font-black leading-none text-emerald-950">
              {formatMoney(totalPayoutBalance)}
            </p>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
              Estimated pending affiliate payout balance.
            </p>
          </div>
        </section>

        {error ? (
          <section className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-red-900 shadow-sm">
            <h2 className="text-xl font-black">Could not load affiliates</h2>

            <p className="mt-2 text-sm font-semibold leading-6">
              Supabase returned an error while loading affiliates.
            </p>

            <pre className="mt-4 overflow-auto rounded-2xl bg-white p-4 text-xs font-bold text-red-900">
              {error.message}
            </pre>
          </section>
        ) : null}

        {trackingError ? (
          <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
            <h2 className="text-xl font-black">
              Affiliate tracking events are not fully connected yet
            </h2>

            <p className="mt-2 text-sm font-semibold leading-6">
              The Affiliates page loaded, but Supabase could not read
              partner_tracking_events. Confirm the Step 17 tracking table still
              exists.
            </p>

            <pre className="mt-4 overflow-auto rounded-2xl bg-white p-4 text-xs font-bold text-amber-900">
              {trackingError.message}
            </pre>
          </section>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-6">
            <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <div className="mb-6">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
                  Growth Tracking
                </p>

                <h2 className="mt-2 text-3xl font-black leading-tight text-[#17382B] sm:text-4xl">
                  Affiliate Event Attribution
                </h2>

                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  Real affiliate click, signup, booking, and revenue data from
                  partner_tracking_events when affiliate_id is present.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
                  <p className="text-sm font-black text-blue-900">Clicks</p>
                  <p className="mt-2 text-4xl font-black text-blue-950">
                    {formatNumber(totalTrackedClicks)}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    Affiliate click events.
                  </p>
                </div>

                <div className="rounded-3xl border border-purple-100 bg-purple-50 p-5">
                  <p className="text-sm font-black text-purple-900">Signups</p>
                  <p className="mt-2 text-4xl font-black text-purple-950">
                    {formatNumber(totalTrackedSignups)}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    Signup attribution events.
                  </p>
                </div>

                <div className="rounded-3xl border border-green-100 bg-green-50 p-5">
                  <p className="text-sm font-black text-green-900">Bookings</p>
                  <p className="mt-2 text-4xl font-black text-green-950">
                    {formatNumber(totalTrackedBookings)}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    Booking attribution events.
                  </p>
                </div>

                <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
                  <p className="text-sm font-black text-emerald-900">Revenue</p>
                  <p className="mt-2 text-4xl font-black text-emerald-950">
                    {formatMoney(totalTrackedRevenue)}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    Revenue from tracked events.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <div className="mb-6">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
                  Affiliate Records
                </p>

                <h2 className="mt-2 text-3xl font-black leading-tight text-[#17382B] sm:text-4xl">
                  {affiliates.length} Affiliate Records
                </h2>

                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  Approved affiliate records with live tracking summaries when
                  partner_tracking_events are available.
                </p>
              </div>

              {affiliates.length === 0 ? (
                <div className="rounded-3xl border border-emerald-100 bg-[#FBFCF8] p-8 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-3xl">
                    📈
                  </div>

                  <h3 className="mt-5 text-2xl font-black text-[#17382B]">
                    No approved affiliates yet
                  </h3>

                  <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-700">
                    Once Admin approves Affiliate applications, approved
                    affiliate records will appear here with referral links,
                    tracking summaries, commissions, payout balances, and
                    leaderboard data.
                  </p>

                  <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Link
                      href="/admin/partners/applications?type=affiliate"
                      className="inline-flex rounded-2xl bg-[#007A3D] px-5 py-3 text-sm font-black !text-white transition hover:bg-[#006B35]"
                    >
                      Review Affiliate Applications
                    </Link>

                    <BackToPartnersButton />
                  </div>
                </div>
              ) : (
                <div className="grid gap-5">
                  {affiliates.map((affiliate) => {
                    const summary = getAffiliateTrackingSummary(
                      trackingSummaries,
                      affiliate.id
                    );

                    const signupRate = percentage(summary.signups, summary.clicks);
                    const bookingRate = percentage(summary.bookings, summary.clicks);

                    return (
                      <article
                        key={affiliate.id}
                        className="overflow-hidden rounded-[1.5rem] border border-emerald-100 bg-white shadow-sm"
                      >
                        <div className="border-b border-emerald-100 bg-[#FBFCF8] p-5">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex gap-4">
                              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-3xl">
                                {affiliateIcon(
                                  affiliate.affiliate_type,
                                  affiliate.platform
                                )}
                              </div>

                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-black text-purple-800">
                                    {formatLabel(affiliate.affiliate_type)}
                                  </span>

                                  {affiliate.platform ? (
                                    <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black text-blue-800">
                                      {affiliate.platform}
                                    </span>
                                  ) : null}

                                  <span
                                    className={`rounded-full border px-3 py-1 text-xs font-black ${statusClasses(
                                      affiliate.status
                                    )}`}
                                  >
                                    {formatLabel(affiliate.status)}
                                  </span>

                                  <span
                                    className={`rounded-full border px-3 py-1 text-xs font-black ${commissionClasses(
                                      affiliate.commission_type
                                    )}`}
                                  >
                                    {formatLabel(affiliate.commission_type)}
                                  </span>
                                </div>

                                <h3 className="mt-3 text-2xl font-black text-[#17382B]">
                                  {affiliate.display_name}
                                </h3>

                                <p className="mt-1 text-sm font-semibold text-slate-600">
                                  Approved {formatDate(affiliate.approved_at)} ·
                                  Updated {formatDate(affiliate.updated_at)}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row">
                              <Link
                                href={`/admin/partners/affiliates/${affiliate.id}/edit`}
                                className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-900 transition hover:border-emerald-300 hover:bg-emerald-50"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>

                              <Link
                                href={`/admin/messages?affiliateId=${affiliate.id}`}
                                className="inline-flex items-center justify-center rounded-xl bg-[#007A3D] px-4 py-2 text-sm font-black !text-white transition hover:bg-[#006B35]"
                              >
                                <MessageCircle className="mr-2 h-4 w-4 !text-white" />
                                Message
                              </Link>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-5 p-5 lg:grid-cols-3">
                          <div className="rounded-2xl border border-emerald-100 bg-[#FBFCF8] p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                              Contact
                            </p>

                            <p className="mt-3 text-sm font-black text-[#17382B]">
                              {affiliate.display_name}
                            </p>

                            <p className="mt-2 break-words text-sm font-semibold text-slate-700">
                              {affiliate.email}
                            </p>

                            {affiliate.phone ? (
                              <p className="mt-2 text-sm font-semibold text-slate-700">
                                {affiliate.phone}
                              </p>
                            ) : null}
                          </div>

                          <div className="rounded-2xl border border-emerald-100 bg-[#FBFCF8] p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                              Audience
                            </p>

                            <p className="mt-3 text-sm font-black text-[#17382B]">
                              {formatNumber(affiliate.audience_size)} estimated
                              audience
                            </p>

                            <p className="mt-2 text-sm font-semibold text-slate-700">
                              Niche: {affiliate.niche || "Not provided"}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-emerald-100 bg-[#FBFCF8] p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                              Last Activity
                            </p>

                            <p className="mt-3 text-sm font-black text-[#17382B]">
                              {formatDate(summary.lastActivity)}
                            </p>

                            <p className="mt-2 text-sm font-semibold text-slate-700">
                              Sources:{" "}
                              {summary.sources.length > 0
                                ? summary.sources.slice(0, 3).join(", ")
                                : "No source data yet"}
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-5 border-t border-emerald-100 p-5 lg:grid-cols-4">
                          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-blue-900">
                              Referral Clicks
                            </p>
                            <p className="mt-3 text-3xl font-black text-blue-950">
                              {formatNumber(summary.clicks)}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-purple-900">
                              Signups
                            </p>
                            <p className="mt-3 text-3xl font-black text-purple-950">
                              {formatNumber(summary.signups)}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-green-900">
                              Bookings
                            </p>
                            <p className="mt-3 text-3xl font-black text-green-950">
                              {formatNumber(summary.bookings)}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-amber-900">
                              Revenue
                            </p>
                            <p className="mt-3 text-3xl font-black text-amber-950">
                              {formatMoney(summary.revenue)}
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-5 border-t border-emerald-100 p-5 lg:grid-cols-3">
                          <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                              Referral Code
                            </p>

                            <p className="mt-3 text-sm font-black text-[#17382B]">
                              {affiliate.referral_code || "Not generated"}
                            </p>

                            <form
                              action={regenerateAffiliateReferralCodeAction}
                              className="mt-4"
                            >
                              <input
                                type="hidden"
                                name="affiliateId"
                                value={affiliate.id}
                              />
                              <input
                                type="hidden"
                                name="displayName"
                                value={affiliate.display_name}
                              />

                              <button
                                type="submit"
                                className="inline-flex rounded-xl border border-purple-200 bg-purple-50 px-4 py-2 text-xs font-black text-purple-900 transition hover:bg-purple-100"
                              >
                                <RefreshCcw className="mr-2 h-3.5 w-3.5" />
                                Regenerate Code
                              </button>
                            </form>
                          </div>

                          <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                              Conversion Rates
                            </p>

                            <div className="mt-3 grid gap-2 text-sm font-semibold text-slate-700">
                              <p>
                                Signup Rate:{" "}
                                <span className="font-black text-[#17382B]">
                                  {signupRate}%
                                </span>
                              </p>

                              <p>
                                Booking Rate:{" "}
                                <span className="font-black text-[#17382B]">
                                  {bookingRate}%
                                </span>
                              </p>

                              <p>
                                Reward Amount:{" "}
                                <span className="font-black text-[#17382B]">
                                  {formatMoney(summary.rewards)}
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                              Payout Controls
                            </p>

                            <form
                              action={updateAffiliatePayoutAction}
                              className="mt-4 grid gap-2"
                            >
                              <input
                                type="hidden"
                                name="affiliateId"
                                value={affiliate.id}
                              />

                              <label className="text-xs font-black uppercase tracking-wide text-slate-500">
                                Payout Balance
                              </label>
                              <input
                                name="payoutBalance"
                                type="number"
                                step="0.01"
                                defaultValue={affiliate.payout_balance}
                                className="rounded-xl border border-emerald-100 bg-[#FBFCF8] px-4 py-2 text-sm font-bold text-[#17382B] outline-none focus:border-emerald-300"
                              />

                              <label className="text-xs font-black uppercase tracking-wide text-slate-500">
                                Lifetime Earnings
                              </label>
                              <input
                                name="lifetimeEarnings"
                                type="number"
                                step="0.01"
                                defaultValue={affiliate.lifetime_earnings}
                                className="rounded-xl border border-emerald-100 bg-[#FBFCF8] px-4 py-2 text-sm font-bold text-[#17382B] outline-none focus:border-emerald-300"
                              />

                              <button
                                type="submit"
                                className="inline-flex justify-center rounded-xl bg-[#007A3D] px-4 py-2 text-xs font-black !text-white transition hover:bg-[#006B35]"
                              >
                                Update Payouts
                              </button>
                            </form>
                          </div>
                        </div>

                        <div className="grid gap-5 border-t border-emerald-100 p-5 lg:grid-cols-3">
                          <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                              Status Controls
                            </p>

                            <div className="mt-4 flex flex-wrap gap-2">
                              {affiliate.status !== "active" ? (
                                <form action={updateAffiliateStatusAction}>
                                  <input
                                    type="hidden"
                                    name="affiliateId"
                                    value={affiliate.id}
                                  />
                                  <input
                                    type="hidden"
                                    name="status"
                                    value="active"
                                  />
                                  <button className="inline-flex rounded-xl bg-[#007A3D] px-4 py-2 text-xs font-black !text-white transition hover:bg-[#006B35]">
                                    <PlayCircle className="mr-2 h-3.5 w-3.5 !text-white" />
                                    Reactivate
                                  </button>
                                </form>
                              ) : null}

                              {affiliate.status !== "paused" ? (
                                <form action={updateAffiliateStatusAction}>
                                  <input
                                    type="hidden"
                                    name="affiliateId"
                                    value={affiliate.id}
                                  />
                                  <input
                                    type="hidden"
                                    name="status"
                                    value="paused"
                                  />
                                  <button className="inline-flex rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-black text-amber-900 transition hover:bg-amber-100">
                                    <PauseCircle className="mr-2 h-3.5 w-3.5" />
                                    Pause
                                  </button>
                                </form>
                              ) : null}

                              {affiliate.status !== "suspended" ? (
                                <form action={updateAffiliateStatusAction}>
                                  <input
                                    type="hidden"
                                    name="affiliateId"
                                    value={affiliate.id}
                                  />
                                  <input
                                    type="hidden"
                                    name="status"
                                    value="suspended"
                                  />
                                  <button className="inline-flex rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-black text-red-900 transition hover:bg-red-100">
                                    <ShieldX className="mr-2 h-3.5 w-3.5" />
                                    Suspend
                                  </button>
                                </form>
                              ) : null}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                              Payout Summary
                            </p>

                            <div className="mt-3 grid gap-2 text-sm font-semibold text-slate-700">
                              <p>
                                Payout Balance:{" "}
                                <span className="font-black text-[#17382B]">
                                  {formatMoney(affiliate.payout_balance)}
                                </span>
                              </p>

                              <p>
                                Lifetime Earnings:{" "}
                                <span className="font-black text-[#17382B]">
                                  {formatMoney(affiliate.lifetime_earnings)}
                                </span>
                              </p>

                              <p>
                                Commission:{" "}
                                <span className="font-black text-[#17382B]">
                                  {formatLabel(affiliate.commission_type)}{" "}
                                  {affiliate.commission_value}
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                              Online Links
                            </p>

                            <div className="mt-4 flex flex-col gap-2">
                              {affiliate.website ? (
                                <a
                                  href={affiliate.website}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-900 transition hover:bg-emerald-50"
                                >
                                  <Globe className="mr-2 h-4 w-4" />
                                  Website
                                  <ExternalLink className="ml-2 h-3.5 w-3.5" />
                                </a>
                              ) : null}

                              {affiliate.social_url ? (
                                <a
                                  href={affiliate.social_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center rounded-xl border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-black text-purple-900 transition hover:bg-purple-100"
                                >
                                  Social Profile
                                  <ExternalLink className="ml-2 h-3.5 w-3.5" />
                                </a>
                              ) : null}

                              <Link
                                href={`/admin/partners/payouts?affiliate_id=${affiliate.id}`}
                                className="rounded-xl bg-[#007A3D] px-4 py-2 text-center text-sm font-black !text-white transition hover:bg-[#006B35]"
                              >
                                Payout Reporting
                              </Link>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <aside className="flex flex-col gap-6">
            <section className="rounded-[2rem] bg-[#003D1F] p-6 !text-white shadow-sm">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 !text-white">
                <Users className="h-6 w-6 !text-white" />
              </div>

              <h2 className="text-3xl font-black leading-tight !text-white">
                Affiliate Health
              </h2>

              <div className="mt-6 space-y-4 !text-white">
                <div className="rounded-2xl bg-white/12 p-4 !text-white">
                  <p className="text-sm font-black !text-white">Active Rate</p>
                  <p className="mt-2 text-3xl font-black !text-white">
                    {activeRate}%
                  </p>
                </div>

                <div className="rounded-2xl bg-white/12 p-4 !text-white">
                  <p className="text-sm font-black !text-white">
                    Signup Conversion
                  </p>
                  <p className="mt-2 text-3xl font-black !text-white">
                    {signupConversionRate}%
                  </p>
                </div>

                <div className="rounded-2xl bg-white/12 p-4 !text-white">
                  <p className="text-sm font-black !text-white">
                    Booking Conversion
                  </p>
                  <p className="mt-2 text-3xl font-black !text-white">
                    {bookingConversionRate}%
                  </p>
                </div>

                <div className="rounded-2xl bg-white/12 p-4 !text-white">
                  <p className="text-sm font-black !text-white">
                    Referral Code Rate
                  </p>
                  <p className="mt-2 text-3xl font-black !text-white">
                    {referralCodeRate}%
                  </p>
                </div>

                <div className="rounded-2xl bg-white/12 p-4 !text-white">
                  <p className="text-sm font-black !text-white">
                    Next Priority
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 !text-white">
                    Wire public affiliate links, creator campaign URLs, QR
                    codes, signup flows, and booking attribution into
                    partner_tracking_events using affiliate_id.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 text-purple-800">
                  <BarChart3 className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                    Platform Data
                  </p>
                  <h2 className="text-2xl font-black text-[#17382B]">
                    Top Platforms
                  </h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {topPlatforms.length === 0 ? (
                  <div className="rounded-2xl border border-emerald-100 bg-[#FBFCF8] p-4 text-sm font-black leading-6 text-[#17382B]">
                    No platform data yet.
                  </div>
                ) : (
                  topPlatforms.map((platform) => (
                    <div
                      key={platform.label}
                      className="rounded-2xl border border-emerald-100 bg-[#FBFCF8] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-black text-[#17382B]">
                          {platform.label}
                        </p>

                        <p className="text-xl font-black text-purple-900">
                          {platform.value}
                        </p>
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-purple-100">
                        <div
                          className="h-full rounded-full bg-purple-700"
                          style={{
                            width: `${percentage(
                              platform.value,
                              affiliates.length
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-800">
                  <Sparkles className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                    Niche Data
                  </p>
                  <h2 className="text-2xl font-black text-[#17382B]">
                    Top Niches
                  </h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {topNiches.length === 0 ? (
                  <div className="rounded-2xl border border-emerald-100 bg-[#FBFCF8] p-4 text-sm font-black leading-6 text-[#17382B]">
                    No niche data yet.
                  </div>
                ) : (
                  topNiches.map((niche) => (
                    <div
                      key={niche.label}
                      className="rounded-2xl border border-emerald-100 bg-[#FBFCF8] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-black text-[#17382B]">
                          {niche.label}
                        </p>

                        <p className="text-xl font-black text-blue-900">
                          {niche.value}
                        </p>
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100">
                        <div
                          className="h-full rounded-full bg-blue-700"
                          style={{
                            width: `${percentage(niche.value, affiliates.length)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                  <BadgeDollarSign className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                    Affiliate Totals
                  </p>
                  <h2 className="text-2xl font-black text-[#17382B]">
                    Performance
                  </h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-sm font-black text-blue-900">
                    Total Audience
                  </p>
                  <p className="mt-2 text-3xl font-black text-blue-950">
                    {formatNumber(totalAudience)}
                  </p>
                </div>

                <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                  <p className="text-sm font-black text-green-900">
                    Payout Balance
                  </p>
                  <p className="mt-2 text-3xl font-black text-green-950">
                    {formatMoney(totalPayoutBalance)}
                  </p>
                </div>

                <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4">
                  <p className="text-sm font-black text-purple-900">
                    Lifetime Earnings
                  </p>
                  <p className="mt-2 text-3xl font-black text-purple-950">
                    {formatMoney(totalLifetimeEarnings)}
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <p className="text-sm font-black text-amber-900">
                    Suspended Affiliates
                  </p>
                  <p className="mt-2 text-3xl font-black text-amber-950">
                    {formatNumber(suspendedCount)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-black text-slate-800">
                    Archived Affiliates
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {formatNumber(archivedCount)}
                  </p>
                </div>

                <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                  <p className="text-sm font-black text-orange-900">
                    Paused Affiliates
                  </p>
                  <p className="mt-2 text-3xl font-black text-orange-950">
                    {formatNumber(pausedCount)}
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </section>

        <SupabaseCoordinationBanner
          pagePath="app/admin/partners/affiliates/page.tsx"
          folderPath="app/admin/partners/affiliates"
          primaryTable="affiliates"
          operation="Read affiliates, read partner_tracking_events by affiliate_id, visualize affiliate growth activity, export, update status, regenerate referral codes, update referral URLs, and update payout fields"
          selectQuery='supabase.from("affiliates").select("*").order("created_at", { ascending: false }); supabase.from("partner_tracking_events").select("id, partner_id, ambassador_id, affiliate_id, campaign_id, referral_code, event_type, event_source, event_medium, event_campaign, landing_page, current_url, referrer_url, user_id, customer_id, guru_id, booking_id, revenue_amount, reward_amount, currency, created_at").not("affiliate_id", "is", null).order("created_at", { ascending: false }).limit(5000)'
          readFields={[
            "affiliates.id",
            "affiliates.user_id",
            "affiliates.application_id",
            "affiliates.display_name",
            "affiliates.email",
            "affiliates.phone",
            "affiliates.affiliate_type",
            "affiliates.platform",
            "affiliates.website",
            "affiliates.social_url",
            "affiliates.audience_size",
            "affiliates.niche",
            "affiliates.referral_code",
            "affiliates.customer_referral_url",
            "affiliates.guru_referral_url",
            "affiliates.partner_referral_url",
            "affiliates.commission_type",
            "affiliates.commission_value",
            "affiliates.payout_balance",
            "affiliates.lifetime_earnings",
            "affiliates.status",
            "affiliates.approved_at",
            "affiliates.created_at",
            "affiliates.updated_at",
            "partner_tracking_events.affiliate_id",
            "partner_tracking_events.event_type",
            "partner_tracking_events.event_source",
            "partner_tracking_events.revenue_amount",
            "partner_tracking_events.reward_amount",
            "partner_tracking_events.created_at",
          ]}
          filters={[
            "tracking summaries are grouped by partner_tracking_events.affiliate_id",
            "signup events include signup, customer_signup, guru_signup, partner_signup",
            "booking events include booking and completed_booking",
            "platform visuals are calculated from affiliates.platform",
            "niche visuals are calculated from affiliates.niche",
          ]}
          searchFields={[
            "No search input on this page yet",
            "affiliate display_name",
            "affiliate email",
            "tracking referral_code",
            "tracking event_source",
            "tracking event_campaign",
          ]}
          writeActions={[
            "updateAffiliateStatusAction updates affiliates.status",
            "regenerateAffiliateReferralCodeAction updates affiliates.referral_code",
            "regenerateAffiliateReferralCodeAction updates customer_referral_url, guru_referral_url, and partner_referral_url",
            "updateAffiliatePayoutAction updates affiliates.payout_balance and affiliates.lifetime_earnings",
            "tracking API can insert partner_tracking_events rows with affiliate_id",
          ]}
          exportRoutes={[
            "/api/admin/partners/affiliates/export",
            "/api/admin/partners/tracking",
          ]}
          relatedPages={[
            "/admin/partners",
            "/admin/partners/applications",
            "/admin/partners/active",
            "/admin/partners/ambassadors",
            "/admin/partners/campaigns",
            "/admin/partners/rewards",
            "/admin/partners/payouts",
          ]}
          relatedTables={[
            "partner_applications",
            "partner_tracking_events",
            "partner_campaigns",
            "partner_rewards",
            "partner_payouts",
            "partners",
            "ambassadors",
          ]}
          notes={[
            "Affiliate cards now read real tracking summaries when partner_tracking_events contains affiliate_id rows.",
            "Referral clicks, signups, bookings, revenue, rewards, conversion rates, source labels, and last activity are calculated from partner_tracking_events.",
            "Payout balance and lifetime earnings are read from affiliates and can be updated from this page.",
            "The next build should wire public affiliate referral URLs, creator campaign links, and QR codes into /api/admin/partners/tracking.",
          ]}
        />
      </div>
    </main>
  );
}