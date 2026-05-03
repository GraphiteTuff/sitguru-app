import Link from "next/link";
import { revalidatePath } from "next/cache";
import {
  ArrowLeft,
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  CalendarDays,
  Download,
  Edit,
  ExternalLink,
  Link2,
  PauseCircle,
  PlayCircle,
  PlusCircle,
  QrCode,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import BackToPartnersButton from "../_components/back-to-partners-button";
import SupabaseCoordinationBanner from "../_components/supabase-coordination-banner";

type PartnerCampaign = {
  id: string;
  partner_id: string | null;
  ambassador_id: string | null;
  affiliate_id: string | null;
  campaign_name: string;
  campaign_type:
    | "general"
    | "partner_referral"
    | "ambassador_referral"
    | "affiliate_referral"
    | "local_event"
    | "campus"
    | "social"
    | "qr_code"
    | "rescue_donation"
    | "seasonal"
    | "other";
  campaign_code: string | null;
  description: string | null;
  landing_page: string | null;
  destination_url: string | null;
  qr_code_url: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  reward_type: "fixed" | "percent" | "points" | "donation" | "manual";
  reward_value: number;
  budget: number;
  spend: number;
  starts_at: string | null;
  ends_at: string | null;
  status: "draft" | "active" | "paused" | "completed" | "archived";
  created_by: string | null;
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

type CampaignTrackingSummary = {
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

function statusClasses(status: PartnerCampaign["status"]) {
  switch (status) {
    case "active":
      return "border-green-200 bg-green-50 text-green-800";
    case "paused":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "completed":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "archived":
      return "border-slate-200 bg-slate-50 text-slate-700";
    case "draft":
      return "border-purple-200 bg-purple-50 text-purple-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function campaignTypeClasses(type: PartnerCampaign["campaign_type"]) {
  switch (type) {
    case "affiliate_referral":
      return "border-purple-200 bg-purple-50 text-purple-800";
    case "ambassador_referral":
      return "border-orange-200 bg-orange-50 text-orange-800";
    case "partner_referral":
      return "border-green-200 bg-green-50 text-green-800";
    case "campus":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "qr_code":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function campaignIcon(type: PartnerCampaign["campaign_type"]) {
  switch (type) {
    case "affiliate_referral":
      return "📈";
    case "ambassador_referral":
      return "⭐";
    case "partner_referral":
      return "🤝";
    case "local_event":
      return "📍";
    case "campus":
      return "🎓";
    case "social":
      return "📣";
    case "qr_code":
      return "▦";
    case "rescue_donation":
      return "💚";
    case "seasonal":
      return "🎁";
    default:
      return "🎯";
  }
}

function buildQrCodeUrl(campaign: PartnerCampaign) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3001";

  const destination =
    campaign.destination_url ||
    `${baseUrl}${campaign.landing_page || "/partners"}`;

  return `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(
    destination
  )}`;
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
  const summaries = new Map<string, CampaignTrackingSummary>();

  events.forEach((event) => {
    if (!event.campaign_id) return;

    const current = summaries.get(event.campaign_id) || {
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

    summaries.set(event.campaign_id, current);
  });

  return summaries;
}

function getCampaignTrackingSummary(
  summaries: Map<string, CampaignTrackingSummary>,
  campaignId: string
) {
  return (
    summaries.get(campaignId) || {
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

function getCampaignTypeKey(campaign: PartnerCampaign) {
  return formatLabel(campaign.campaign_type);
}

function getStatusKey(campaign: PartnerCampaign) {
  return formatLabel(campaign.status);
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

async function updateCampaignStatusAction(formData: FormData) {
  "use server";

  const campaignId = String(formData.get("campaignId") || "");
  const status = String(formData.get("status") || "") as PartnerCampaign["status"];

  if (!campaignId || !status) return;

  const supabase = await createClient();

  await supabase
    .from("partner_campaigns")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaignId);

  revalidatePath("/admin/partners/campaigns");
  revalidatePath("/admin/partners");
}

async function updateCampaignBudgetAction(formData: FormData) {
  "use server";

  const campaignId = String(formData.get("campaignId") || "");
  const budget = Number(formData.get("budget") || 0);
  const spend = Number(formData.get("spend") || 0);

  if (!campaignId) return;

  const supabase = await createClient();

  await supabase
    .from("partner_campaigns")
    .update({
      budget,
      spend,
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaignId);

  revalidatePath("/admin/partners/campaigns");
  revalidatePath("/admin/partners");
}

export default async function AdminPartnerCampaignsPage() {
  const supabase = await createClient();

  const [{ data, error }, trackingResponse] = await Promise.all([
    supabase
      .from("partner_campaigns")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("partner_tracking_events")
      .select(
        "id, partner_id, ambassador_id, affiliate_id, campaign_id, referral_code, event_type, event_source, event_medium, event_campaign, landing_page, current_url, referrer_url, user_id, customer_id, guru_id, booking_id, revenue_amount, reward_amount, currency, created_at"
      )
      .not("campaign_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(5000),
  ]);

  const campaigns = (data ?? []) as PartnerCampaign[];
  const trackingEvents = (trackingResponse.data ?? []) as PartnerTrackingEvent[];
  const trackingError = trackingResponse.error;
  const trackingSummaries = buildTrackingSummaries(trackingEvents);

  const activeCount = campaigns.filter(
    (campaign) => campaign.status === "active"
  ).length;

  const pausedCount = campaigns.filter(
    (campaign) => campaign.status === "paused"
  ).length;

  const completedCount = campaigns.filter(
    (campaign) => campaign.status === "completed"
  ).length;

  const draftCount = campaigns.filter(
    (campaign) => campaign.status === "draft"
  ).length;

  const archivedCount = campaigns.filter(
    (campaign) => campaign.status === "archived"
  ).length;

  const totalBudget = campaigns.reduce(
    (sum, campaign) => sum + Number(campaign.budget || 0),
    0
  );

  const totalSpend = campaigns.reduce(
    (sum, campaign) => sum + Number(campaign.spend || 0),
    0
  );

  const totalRewardValue = campaigns.reduce(
    (sum, campaign) => sum + Number(campaign.reward_value || 0),
    0
  );

  const totalTrackedClicks = trackingEvents.filter(
    (event) => event.event_type === "click" && event.campaign_id
  ).length;

  const totalTrackedSignups = trackingEvents.filter(
    (event) => event.campaign_id && isSignupEvent(event.event_type)
  ).length;

  const totalTrackedBookings = trackingEvents.filter(
    (event) => event.campaign_id && isBookingEvent(event.event_type)
  ).length;

  const totalTrackedRevenue = trackingEvents.reduce(
    (sum, event) => sum + Number(event.revenue_amount || 0),
    0
  );

  const activeRate = percentage(activeCount, campaigns.length);
  const spendRate = percentage(totalSpend, totalBudget);
  const signupConversionRate = percentage(totalTrackedSignups, totalTrackedClicks);
  const bookingConversionRate = percentage(totalTrackedBookings, totalTrackedClicks);

  const topCampaignTypes = countByValue(campaigns, getCampaignTypeKey, 5);
  const topStatuses = countByValue(campaigns, getStatusKey, 5);

  return (
    <main className="min-h-screen bg-[#F7FAF3] text-[#17382B]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <BackToPartnersButton />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/admin/partners/affiliates"
                  className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous: Affiliates
                </Link>

                <Link
                  href="/admin/partners/rewards"
                  className="inline-flex items-center justify-center rounded-2xl bg-[#007A3D] px-5 py-3 text-sm font-black !text-white shadow-sm transition hover:bg-[#006B35]"
                >
                  Next: Rewards
                  <ArrowRight className="ml-2 h-4 w-4 !text-white" />
                </Link>

                <Link
                  href="/api/admin/partners/campaigns/export"
                  className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Link>
              </div>
            </div>

            <div className="max-w-4xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                <Target className="h-7 w-7" />
              </div>

              <p className="mt-6 text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
                Campaign Attribution and Growth
              </p>

              <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight text-[#17382B] sm:text-5xl lg:text-6xl">
                Campaigns
              </h1>

              <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-700 sm:text-lg">
                Manage Partner Network campaigns, campaign codes, QR-ready
                landing pages, UTM attribution, budgets, spend, clicks, signups,
                bookings, rewards, and campaign performance tracking.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-green-100 bg-green-50 p-5 shadow-sm">
            <p className="text-sm font-black text-green-900">Active Campaigns</p>
            <p className="mt-3 text-4xl font-black leading-none text-green-950">
              {activeCount}
            </p>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
              Campaigns currently active in the Partner Network.
            </p>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
            <p className="text-sm font-black text-blue-900">Tracked Clicks</p>
            <p className="mt-3 text-4xl font-black leading-none text-blue-950">
              {formatNumber(totalTrackedClicks)}
            </p>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
              Campaign click events from tracking records.
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
              Booking events attributed to campaign links.
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
            <p className="text-sm font-black text-emerald-900">Campaign Spend</p>
            <p className="mt-3 text-4xl font-black leading-none text-emerald-950">
              {formatMoney(totalSpend)}
            </p>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
              Spend recorded across campaign rows.
            </p>
          </div>
        </section>

        {error ? (
          <section className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-red-900 shadow-sm">
            <h2 className="text-xl font-black">Could not load campaigns</h2>
            <p className="mt-2 text-sm font-semibold leading-6">
              Supabase returned an error while loading partner campaigns.
            </p>
            <pre className="mt-4 overflow-auto rounded-2xl bg-white p-4 text-xs font-bold text-red-900">
              {error.message}
            </pre>
          </section>
        ) : null}

        {trackingError ? (
          <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
            <h2 className="text-xl font-black">
              Campaign tracking events are not fully connected yet
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6">
              The Campaigns page loaded, but Supabase could not read
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
                  Campaign Event Attribution
                </h2>

                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  Real campaign click, signup, booking, and revenue data from
                  partner_tracking_events when campaign_id is present.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
                  <p className="text-sm font-black text-blue-900">Clicks</p>
                  <p className="mt-2 text-4xl font-black text-blue-950">
                    {formatNumber(totalTrackedClicks)}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    Campaign click events.
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
                  Campaign Records
                </p>

                <h2 className="mt-2 text-3xl font-black leading-tight text-[#17382B] sm:text-4xl">
                  {campaigns.length} Campaign Records
                </h2>

                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  Partner Network campaign rows with live attribution summaries
                  from campaign tracking events.
                </p>
              </div>

              {campaigns.length === 0 ? (
                <div className="rounded-3xl border border-emerald-100 bg-[#FBFCF8] p-8 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-3xl">
                    🎯
                  </div>

                  <h3 className="mt-5 text-2xl font-black text-[#17382B]">
                    No campaigns yet
                  </h3>

                  <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-700">
                    Create a Partner Network campaign to begin tracking clicks,
                    signups, bookings, spend, rewards, and attribution.
                  </p>

                  <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Link
                      href="/admin/partners/affiliates"
                      className="inline-flex rounded-2xl bg-[#007A3D] px-5 py-3 text-sm font-black !text-white transition hover:bg-[#006B35]"
                    >
                      Review Affiliates
                    </Link>

                    <BackToPartnersButton />
                  </div>
                </div>
              ) : (
                <div className="grid gap-5">
                  {campaigns.map((campaign) => {
                    const summary = getCampaignTrackingSummary(
                      trackingSummaries,
                      campaign.id
                    );

                    const signupRate = percentage(summary.signups, summary.clicks);
                    const bookingRate = percentage(summary.bookings, summary.clicks);
                    const campaignSpendRate = percentage(
                      Number(campaign.spend || 0),
                      Number(campaign.budget || 0)
                    );
                    const qrCodeUrl = campaign.qr_code_url || buildQrCodeUrl(campaign);

                    return (
                      <article
                        key={campaign.id}
                        className="overflow-hidden rounded-[1.5rem] border border-emerald-100 bg-white shadow-sm"
                      >
                        <div className="border-b border-emerald-100 bg-[#FBFCF8] p-5">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex gap-4">
                              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-3xl">
                                {campaignIcon(campaign.campaign_type)}
                              </div>

                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`rounded-full border px-3 py-1 text-xs font-black ${campaignTypeClasses(
                                      campaign.campaign_type
                                    )}`}
                                  >
                                    {formatLabel(campaign.campaign_type)}
                                  </span>

                                  <span
                                    className={`rounded-full border px-3 py-1 text-xs font-black ${statusClasses(
                                      campaign.status
                                    )}`}
                                  >
                                    {formatLabel(campaign.status)}
                                  </span>

                                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">
                                    {formatLabel(campaign.reward_type)}
                                  </span>
                                </div>

                                <h3 className="mt-3 text-2xl font-black text-[#17382B]">
                                  {campaign.campaign_name}
                                </h3>

                                <p className="mt-1 text-sm font-semibold text-slate-600">
                                  Code: {campaign.campaign_code || "Not generated"} ·
                                  Created {formatDate(campaign.created_at)}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row">
                              <Link
                                href={`/admin/partners/campaigns/${campaign.id}/edit`}
                                className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-900 transition hover:border-emerald-300 hover:bg-emerald-50"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>

                              <a
                                href={qrCodeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center rounded-xl bg-[#007A3D] px-4 py-2 text-sm font-black !text-white transition hover:bg-[#006B35]"
                              >
                                <QrCode className="mr-2 h-4 w-4 !text-white" />
                                QR Code
                              </a>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-5 p-5 lg:grid-cols-3">
                          <div className="rounded-2xl border border-emerald-100 bg-[#FBFCF8] p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                              Campaign Details
                            </p>

                            <p className="mt-3 text-sm font-black text-[#17382B]">
                              {campaign.description || "No description yet."}
                            </p>

                            <p className="mt-2 text-sm font-semibold text-slate-700">
                              Reward: {formatLabel(campaign.reward_type)}{" "}
                              {campaign.reward_value}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-emerald-100 bg-[#FBFCF8] p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                              Schedule
                            </p>

                            <p className="mt-3 flex items-center gap-2 text-sm font-black text-[#17382B]">
                              <CalendarDays className="h-4 w-4 text-emerald-800" />
                              Starts {formatDate(campaign.starts_at)}
                            </p>

                            <p className="mt-2 text-sm font-semibold text-slate-700">
                              Ends {formatDate(campaign.ends_at)}
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
                              Clicks
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
                              Attribution Links
                            </p>

                            <p className="mt-3 break-words text-sm font-semibold text-slate-700">
                              Landing: {campaign.landing_page || "Not set"}
                            </p>

                            <p className="mt-2 break-words text-sm font-semibold text-slate-700">
                              Destination: {campaign.destination_url || "Not set"}
                            </p>

                            {campaign.destination_url ? (
                              <a
                                href={campaign.destination_url}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-4 inline-flex rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-900 transition hover:bg-emerald-100"
                              >
                                <ExternalLink className="mr-2 h-3.5 w-3.5" />
                                Open Destination
                              </a>
                            ) : null}
                          </div>

                          <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                              UTM Tracking
                            </p>

                            <div className="mt-3 grid gap-2 text-sm font-semibold text-slate-700">
                              <p>Source: {campaign.utm_source || "Not set"}</p>
                              <p>Medium: {campaign.utm_medium || "Not set"}</p>
                              <p>
                                Campaign: {campaign.utm_campaign || "Not set"}
                              </p>
                            </div>
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
                        </div>

                        <div className="grid gap-5 border-t border-emerald-100 p-5 lg:grid-cols-3">
                          <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                              Budget Controls
                            </p>

                            <form
                              action={updateCampaignBudgetAction}
                              className="mt-4 grid gap-2"
                            >
                              <input
                                type="hidden"
                                name="campaignId"
                                value={campaign.id}
                              />

                              <label className="text-xs font-black uppercase tracking-wide text-slate-500">
                                Budget
                              </label>
                              <input
                                name="budget"
                                type="number"
                                step="0.01"
                                defaultValue={campaign.budget}
                                className="rounded-xl border border-emerald-100 bg-[#FBFCF8] px-4 py-2 text-sm font-bold text-[#17382B] outline-none focus:border-emerald-300"
                              />

                              <label className="text-xs font-black uppercase tracking-wide text-slate-500">
                                Spend
                              </label>
                              <input
                                name="spend"
                                type="number"
                                step="0.01"
                                defaultValue={campaign.spend}
                                className="rounded-xl border border-emerald-100 bg-[#FBFCF8] px-4 py-2 text-sm font-bold text-[#17382B] outline-none focus:border-emerald-300"
                              />

                              <button
                                type="submit"
                                className="inline-flex justify-center rounded-xl bg-[#007A3D] px-4 py-2 text-xs font-black !text-white transition hover:bg-[#006B35]"
                              >
                                Update Budget
                              </button>
                            </form>
                          </div>

                          <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                              Budget Summary
                            </p>

                            <div className="mt-3 grid gap-2 text-sm font-semibold text-slate-700">
                              <p>
                                Budget:{" "}
                                <span className="font-black text-[#17382B]">
                                  {formatMoney(campaign.budget)}
                                </span>
                              </p>

                              <p>
                                Spend:{" "}
                                <span className="font-black text-[#17382B]">
                                  {formatMoney(campaign.spend)}
                                </span>
                              </p>

                              <p>
                                Spend Rate:{" "}
                                <span className="font-black text-[#17382B]">
                                  {campaignSpendRate}%
                                </span>
                              </p>
                            </div>

                            <div className="mt-4 h-3 overflow-hidden rounded-full bg-emerald-100">
                              <div
                                className="h-full rounded-full bg-emerald-700"
                                style={{ width: `${campaignSpendRate}%` }}
                              />
                            </div>
                          </div>

                          <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                              Status Controls
                            </p>

                            <div className="mt-4 flex flex-wrap gap-2">
                              {campaign.status !== "active" ? (
                                <form action={updateCampaignStatusAction}>
                                  <input
                                    type="hidden"
                                    name="campaignId"
                                    value={campaign.id}
                                  />
                                  <input
                                    type="hidden"
                                    name="status"
                                    value="active"
                                  />
                                  <button className="inline-flex rounded-xl bg-[#007A3D] px-4 py-2 text-xs font-black !text-white transition hover:bg-[#006B35]">
                                    <PlayCircle className="mr-2 h-3.5 w-3.5 !text-white" />
                                    Activate
                                  </button>
                                </form>
                              ) : null}

                              {campaign.status !== "paused" ? (
                                <form action={updateCampaignStatusAction}>
                                  <input
                                    type="hidden"
                                    name="campaignId"
                                    value={campaign.id}
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

                              {campaign.status !== "completed" ? (
                                <form action={updateCampaignStatusAction}>
                                  <input
                                    type="hidden"
                                    name="campaignId"
                                    value={campaign.id}
                                  />
                                  <input
                                    type="hidden"
                                    name="status"
                                    value="completed"
                                  />
                                  <button className="inline-flex rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-black text-blue-900 transition hover:bg-blue-100">
                                    <ShieldCheck className="mr-2 h-3.5 w-3.5" />
                                    Complete
                                  </button>
                                </form>
                              ) : null}
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
                <TrendingUp className="h-6 w-6 !text-white" />
              </div>

              <h2 className="text-3xl font-black leading-tight !text-white">
                Campaign Health
              </h2>

              <div className="mt-6 space-y-4 !text-white">
                <div className="rounded-2xl bg-white/12 p-4 !text-white">
                  <p className="text-sm font-black !text-white">Active Rate</p>
                  <p className="mt-2 text-3xl font-black !text-white">
                    {activeRate}%
                  </p>
                </div>

                <div className="rounded-2xl bg-white/12 p-4 !text-white">
                  <p className="text-sm font-black !text-white">Spend Rate</p>
                  <p className="mt-2 text-3xl font-black !text-white">
                    {spendRate}%
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
                    Next Priority
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 !text-white">
                    Wire campaign URLs, QR codes, partner links, ambassador
                    links, affiliate links, signup flows, booking completion,
                    and rewards into partner_tracking_events using campaign_id.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                  <BarChart3 className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                    Type Data
                  </p>
                  <h2 className="text-2xl font-black text-[#17382B]">
                    Top Campaign Types
                  </h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {topCampaignTypes.length === 0 ? (
                  <div className="rounded-2xl border border-emerald-100 bg-[#FBFCF8] p-4 text-sm font-black leading-6 text-[#17382B]">
                    No campaign type data yet.
                  </div>
                ) : (
                  topCampaignTypes.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-emerald-100 bg-[#FBFCF8] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-black text-[#17382B]">
                          {item.label}
                        </p>

                        <p className="text-xl font-black text-emerald-900">
                          {item.value}
                        </p>
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-100">
                        <div
                          className="h-full rounded-full bg-emerald-700"
                          style={{
                            width: `${percentage(item.value, campaigns.length)}%`,
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
                  <Target className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                    Status Data
                  </p>
                  <h2 className="text-2xl font-black text-[#17382B]">
                    Campaign Status
                  </h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {topStatuses.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-emerald-100 bg-[#FBFCF8] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-[#17382B]">
                        {item.label}
                      </p>

                      <p className="text-xl font-black text-blue-900">
                        {item.value}
                      </p>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100">
                      <div
                        className="h-full rounded-full bg-blue-700"
                        style={{
                          width: `${percentage(item.value, campaigns.length)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 text-purple-800">
                  <BadgeDollarSign className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                    Campaign Totals
                  </p>
                  <h2 className="text-2xl font-black text-[#17382B]">
                    Performance
                  </h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-sm font-black text-blue-900">
                    Total Budget
                  </p>
                  <p className="mt-2 text-3xl font-black text-blue-950">
                    {formatMoney(totalBudget)}
                  </p>
                </div>

                <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                  <p className="text-sm font-black text-green-900">
                    Total Spend
                  </p>
                  <p className="mt-2 text-3xl font-black text-green-950">
                    {formatMoney(totalSpend)}
                  </p>
                </div>

                <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4">
                  <p className="text-sm font-black text-purple-900">
                    Reward Value
                  </p>
                  <p className="mt-2 text-3xl font-black text-purple-950">
                    {formatMoney(totalRewardValue)}
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <p className="text-sm font-black text-amber-900">Paused</p>
                  <p className="mt-2 text-3xl font-black text-amber-950">
                    {formatNumber(pausedCount)}
                  </p>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-sm font-black text-blue-900">Completed</p>
                  <p className="mt-2 text-3xl font-black text-blue-950">
                    {formatNumber(completedCount)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-black text-slate-800">
                    Draft / Archived
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {formatNumber(draftCount + archivedCount)}
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </section>

        <SupabaseCoordinationBanner
          pagePath="app/admin/partners/campaigns/page.tsx"
          folderPath="app/admin/partners/campaigns"
          primaryTable="partner_campaigns"
          operation="Read partner_campaigns, read partner_tracking_events by campaign_id, visualize campaign attribution, export, update status, update budget, and coordinate QR-ready campaign links"
          selectQuery='supabase.from("partner_campaigns").select("*").order("created_at", { ascending: false }); supabase.from("partner_tracking_events").select("id, partner_id, ambassador_id, affiliate_id, campaign_id, referral_code, event_type, event_source, event_medium, event_campaign, landing_page, current_url, referrer_url, user_id, customer_id, guru_id, booking_id, revenue_amount, reward_amount, currency, created_at").not("campaign_id", "is", null).order("created_at", { ascending: false }).limit(5000)'
          readFields={[
            "partner_campaigns.id",
            "partner_campaigns.partner_id",
            "partner_campaigns.ambassador_id",
            "partner_campaigns.affiliate_id",
            "partner_campaigns.campaign_name",
            "partner_campaigns.campaign_type",
            "partner_campaigns.campaign_code",
            "partner_campaigns.description",
            "partner_campaigns.landing_page",
            "partner_campaigns.destination_url",
            "partner_campaigns.qr_code_url",
            "partner_campaigns.utm_source",
            "partner_campaigns.utm_medium",
            "partner_campaigns.utm_campaign",
            "partner_campaigns.reward_type",
            "partner_campaigns.reward_value",
            "partner_campaigns.budget",
            "partner_campaigns.spend",
            "partner_campaigns.starts_at",
            "partner_campaigns.ends_at",
            "partner_campaigns.status",
            "partner_campaigns.created_at",
            "partner_campaigns.updated_at",
            "partner_tracking_events.campaign_id",
            "partner_tracking_events.event_type",
            "partner_tracking_events.event_source",
            "partner_tracking_events.revenue_amount",
            "partner_tracking_events.reward_amount",
            "partner_tracking_events.created_at",
          ]}
          filters={[
            "tracking summaries are grouped by partner_tracking_events.campaign_id",
            "signup events include signup, customer_signup, guru_signup, partner_signup",
            "booking events include booking and completed_booking",
            "campaign type visuals are calculated from partner_campaigns.campaign_type",
            "status visuals are calculated from partner_campaigns.status",
          ]}
          searchFields={[
            "No search input on this page yet",
            "campaign_name",
            "campaign_code",
            "tracking referral_code",
            "tracking event_source",
            "tracking event_campaign",
          ]}
          writeActions={[
            "updateCampaignStatusAction updates partner_campaigns.status",
            "updateCampaignBudgetAction updates partner_campaigns.budget and partner_campaigns.spend",
            "tracking API can insert partner_tracking_events rows with campaign_id",
            "QR code URLs are generated from destination_url or landing_page",
          ]}
          exportRoutes={[
            "/api/admin/partners/campaigns/export",
            "/api/admin/partners/tracking",
          ]}
          relatedPages={[
            "/admin/partners",
            "/admin/partners/applications",
            "/admin/partners/active",
            "/admin/partners/ambassadors",
            "/admin/partners/affiliates",
            "/admin/partners/rewards",
            "/admin/partners/payouts",
          ]}
          relatedTables={[
            "partner_applications",
            "partner_tracking_events",
            "partner_rewards",
            "partner_payouts",
            "partners",
            "ambassadors",
            "affiliates",
          ]}
          notes={[
            "Campaign cards read real tracking summaries when partner_tracking_events contains campaign_id rows.",
            "Clicks, signups, bookings, revenue, rewards, conversion rates, source labels, and last activity are calculated from partner_tracking_events.",
            "Campaign budget and spend are read from partner_campaigns and can be updated from this page.",
            "The next build should wire public campaign URLs and QR code scans into /api/admin/partners/tracking.",
          ]}
        />
      </div>
    </main>
  );
}