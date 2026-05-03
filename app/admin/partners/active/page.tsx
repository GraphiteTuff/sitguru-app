import Link from "next/link";
import { revalidatePath } from "next/cache";
import {
  ArrowLeft,
  ArrowRight,
  BadgeDollarSign,
  Download,
  Edit,
  ExternalLink,
  Globe,
  Handshake,
  Mail,
  MapPin,
  MessageCircle,
  PauseCircle,
  PlayCircle,
  QrCode,
  RefreshCcw,
  ShieldCheck,
  ShieldX,
  TrendingUp,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import BackToPartnersButton from "../_components/back-to-partners-button";
import SupabaseCoordinationBanner from "../_components/supabase-coordination-banner";

type Partner = {
  id: string;
  application_id: string | null;
  owner_user_id: string | null;
  partner_type: string;
  business_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  social_url: string | null;
  business_type: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  slug: string | null;
  referral_code: string | null;
  commission_type: "fixed" | "percent" | "donation" | "manual";
  customer_booking_reward: number | null;
  guru_referral_reward: number | null;
  partner_activation_reward: number | null;
  donation_reward: number | null;
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

type PartnerTrackingSummary = {
  clicks: number;
  views: number;
  signups: number;
  bookings: number;
  revenue: number;
  rewards: number;
  lastActivity: string | null;
  sources: string[];
};

function formatPartnerType(type: string | null) {
  if (!type) return "Partner";

  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatCommissionType(type: Partner["commission_type"]) {
  switch (type) {
    case "fixed":
      return "Fixed";
    case "percent":
      return "Percent";
    case "donation":
      return "Donation";
    case "manual":
      return "Manual";
    default:
      return "Manual";
  }
}

function formatDate(value: string | null) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatReward(value: number | null) {
  if (value === null || value === undefined) return "$0";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number | null) {
  if (value === null || value === undefined) return "0";

  return new Intl.NumberFormat("en-US").format(value);
}

function percentage(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function statusClasses(status: Partner["status"]) {
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

function commissionClasses(type: Partner["commission_type"]) {
  switch (type) {
    case "donation":
      return "border-purple-200 bg-purple-50 text-purple-800";
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

function partnerCategoryIcon(type: string | null) {
  const safeType = type?.toLowerCase() || "";

  if (safeType.includes("insurance")) return "🛡️";
  if (safeType.includes("groomer")) return "✂️";
  if (safeType.includes("trainer")) return "🦮";
  if (safeType.includes("rescue")) return "💚";
  if (safeType.includes("vet")) return "🩺";
  if (safeType.includes("apartment")) return "🏢";
  if (safeType.includes("tech")) return "📱";
  if (safeType.includes("food")) return "🥣";
  if (safeType.includes("wellness")) return "🌿";
  if (safeType.includes("national")) return "🌐";
  if (safeType.includes("local")) return "📍";

  return "🤝";
}

function createReferralCode(name: string | null) {
  const base = (name || "SITGURU")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);

  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();

  return `${base || "PARTNER"}-${suffix}`;
}

function createSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildReferralPath(partner: Partner) {
  if (partner.slug) return `/p/${partner.slug}`;
  if (partner.referral_code) return `/partners?ref=${partner.referral_code}`;
  return "/partners";
}

function buildFullReferralUrl(partner: Partner) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3001";

  return `${siteUrl}${buildReferralPath(partner)}`;
}

function buildQrCodeUrl(partner: Partner) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(
    buildFullReferralUrl(partner)
  )}`;
}

function getLocationKey(partner: Partner) {
  const city = partner.city?.trim();
  const state = partner.state?.trim();

  if (city && state) return `${city}, ${state}`;
  if (state) return state;
  if (city) return city;

  return "Not provided";
}

function getBusinessTypeKey(partner: Partner) {
  return partner.business_type?.trim() || "Not provided";
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
  const summaries = new Map<string, PartnerTrackingSummary>();

  events.forEach((event) => {
    if (!event.partner_id) return;

    const current = summaries.get(event.partner_id) || {
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

    summaries.set(event.partner_id, current);
  });

  return summaries;
}

function getPartnerTrackingSummary(
  summaries: Map<string, PartnerTrackingSummary>,
  partnerId: string
) {
  return (
    summaries.get(partnerId) || {
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

async function updatePartnerStatusAction(formData: FormData) {
  "use server";

  const partnerId = String(formData.get("partnerId") || "");
  const status = String(formData.get("status") || "") as Partner["status"];

  if (!partnerId || !status) return;

  const supabase = await createClient();

  await supabase
    .from("partners")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", partnerId);

  revalidatePath("/admin/partners/active");
  revalidatePath("/admin/partners");
}

async function regenerateReferralCodeAction(formData: FormData) {
  "use server";

  const partnerId = String(formData.get("partnerId") || "");
  const businessName = String(formData.get("businessName") || "SitGuru Partner");

  if (!partnerId) return;

  const referralCode = createReferralCode(businessName);
  const slug = createSlug(referralCode);

  const supabase = await createClient();

  await supabase
    .from("partners")
    .update({
      referral_code: referralCode,
      slug,
      updated_at: new Date().toISOString(),
    })
    .eq("id", partnerId);

  revalidatePath("/admin/partners/active");
  revalidatePath("/admin/partners");
}

export default async function AdminActivePartnersPage() {
  const supabase = await createClient();

  const [{ data, error }, trackingResponse] = await Promise.all([
    supabase.from("partners").select("*").order("created_at", { ascending: false }),
    supabase
      .from("partner_tracking_events")
      .select(
        "id, partner_id, ambassador_id, affiliate_id, campaign_id, referral_code, event_type, event_source, event_medium, event_campaign, landing_page, current_url, referrer_url, user_id, customer_id, guru_id, booking_id, revenue_amount, reward_amount, currency, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(5000),
  ]);

  const partners = (data ?? []) as Partner[];
  const trackingEvents = (trackingResponse.data ?? []) as PartnerTrackingEvent[];
  const trackingError = trackingResponse.error;
  const trackingSummaries = buildTrackingSummaries(trackingEvents);

  const activeCount = partners.filter(
    (partner) => partner.status === "active"
  ).length;

  const pausedCount = partners.filter(
    (partner) => partner.status === "paused"
  ).length;

  const suspendedCount = partners.filter(
    (partner) => partner.status === "suspended"
  ).length;

  const archivedCount = partners.filter(
    (partner) => partner.status === "archived"
  ).length;

  const donationCount = partners.filter(
    (partner) => partner.commission_type === "donation"
  ).length;

  const percentCommissionCount = partners.filter(
    (partner) => partner.commission_type === "percent"
  ).length;

  const fixedCommissionCount = partners.filter(
    (partner) => partner.commission_type === "fixed"
  ).length;

  const manualCommissionCount = partners.filter(
    (partner) => partner.commission_type === "manual"
  ).length;

  const affiliateCount = partners.filter((partner) =>
    partner.partner_type?.toLowerCase().includes("affiliate")
  ).length;

  const partnersWithReferralCodes = partners.filter(
    (partner) => partner.referral_code
  ).length;

  const partnersWithWebsites = partners.filter((partner) => partner.website)
    .length;

  const totalCustomerBookingRewards = partners.reduce(
    (sum, partner) => sum + (partner.customer_booking_reward || 0),
    0
  );

  const totalGuruReferralRewards = partners.reduce(
    (sum, partner) => sum + (partner.guru_referral_reward || 0),
    0
  );

  const totalPartnerActivationRewards = partners.reduce(
    (sum, partner) => sum + (partner.partner_activation_reward || 0),
    0
  );

  const totalTrackedClicks = trackingEvents.filter(
    (event) => event.event_type === "click" && event.partner_id
  ).length;

  const totalTrackedSignups = trackingEvents.filter(
    (event) => event.partner_id && isSignupEvent(event.event_type)
  ).length;

  const totalTrackedBookings = trackingEvents.filter(
    (event) => event.partner_id && isBookingEvent(event.event_type)
  ).length;

  const totalTrackedRevenue = trackingEvents.reduce(
    (sum, event) => sum + Number(event.revenue_amount || 0),
    0
  );

  const activeRate = percentage(activeCount, partners.length);
  const referralCodeRate = percentage(partnersWithReferralCodes, partners.length);
  const websiteRate = percentage(partnersWithWebsites, partners.length);
  const suspendedRate = percentage(suspendedCount, partners.length);
  const signupConversionRate = percentage(totalTrackedSignups, totalTrackedClicks);
  const bookingConversionRate = percentage(totalTrackedBookings, totalTrackedClicks);

  const topLocations = countByValue(partners, getLocationKey, 5);
  const topBusinessTypes = countByValue(partners, getBusinessTypeKey, 5);

  const statusBreakdown = [
    {
      label: "Active",
      value: activeCount,
      rate: activeRate,
      href: "/admin/partners/active",
      icon: ShieldCheck,
      bar: "bg-green-700",
      card: "border-green-100 bg-green-50",
      text: "text-green-900",
    },
    {
      label: "Paused",
      value: pausedCount,
      rate: percentage(pausedCount, partners.length),
      href: "/admin/partners/active",
      icon: PauseCircle,
      bar: "bg-amber-500",
      card: "border-amber-100 bg-amber-50",
      text: "text-amber-900",
    },
    {
      label: "Suspended",
      value: suspendedCount,
      rate: suspendedRate,
      href: "/admin/partners/active",
      icon: ShieldX,
      bar: "bg-red-600",
      card: "border-red-100 bg-red-50",
      text: "text-red-900",
    },
    {
      label: "Archived",
      value: archivedCount,
      rate: percentage(archivedCount, partners.length),
      href: "/admin/partners/active",
      icon: Users,
      bar: "bg-slate-600",
      card: "border-slate-200 bg-slate-50",
      text: "text-slate-800",
    },
  ];

  const commissionBreakdown = [
    {
      label: "Fixed",
      value: fixedCommissionCount,
      rate: percentage(fixedCommissionCount, partners.length),
      icon: BadgeDollarSign,
      card: "border-green-100 bg-green-50",
      text: "text-green-900",
      bar: "bg-green-700",
    },
    {
      label: "Percent",
      value: percentCommissionCount,
      rate: percentage(percentCommissionCount, partners.length),
      icon: TrendingUp,
      card: "border-blue-100 bg-blue-50",
      text: "text-blue-900",
      bar: "bg-blue-700",
    },
    {
      label: "Donation",
      value: donationCount,
      rate: percentage(donationCount, partners.length),
      icon: Handshake,
      card: "border-purple-100 bg-purple-50",
      text: "text-purple-900",
      bar: "bg-purple-700",
    },
    {
      label: "Manual",
      value: manualCommissionCount,
      rate: percentage(manualCommissionCount, partners.length),
      icon: Edit,
      card: "border-amber-100 bg-amber-50",
      text: "text-amber-900",
      bar: "bg-amber-500",
    },
  ];

  return (
    <main className="min-h-screen bg-[#F7FAF3] text-[#17382B]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <BackToPartnersButton />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/admin/partners/applications"
                  className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous: Applications
                </Link>

                <Link
                  href="/admin/partners/ambassadors"
                  className="inline-flex items-center justify-center rounded-2xl bg-[#007A3D] px-5 py-3 text-sm font-black !text-white shadow-sm transition hover:bg-[#006B35]"
                >
                  Next: Ambassadors
                  <ArrowRight className="ml-2 h-4 w-4 !text-white" />
                </Link>

                <Link
                  href="/api/admin/partners/active/export"
                  className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Link>
              </div>
            </div>

            <div className="max-w-4xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                <Handshake className="h-7 w-7" />
              </div>

              <p className="mt-6 text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
                Approved Partner Management
              </p>

              <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight text-[#17382B] sm:text-5xl lg:text-6xl">
                Active Partners
              </h1>

              <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-700 sm:text-lg">
                Manage approved SitGuru partners, referral codes, QR codes,
                status controls, reward rules, payout links, partner messaging,
                and active partner growth tracking powered by partner tracking
                events.
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
              Partners currently active in SitGuru.
            </p>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
            <p className="text-sm font-black text-blue-900">Tracked Clicks</p>
            <p className="mt-3 text-4xl font-black leading-none text-blue-950">
              {formatNumber(totalTrackedClicks)}
            </p>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
              Click events from partner tracking records.
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
              Booking events attributed to partners.
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
            <p className="text-sm font-black text-emerald-900">
              Tracked Revenue
            </p>
            <p className="mt-3 text-4xl font-black leading-none text-emerald-950">
              {formatReward(totalTrackedRevenue)}
            </p>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
              Revenue recorded through partner events.
            </p>
          </div>
        </section>

        {error ? (
          <section className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-red-900 shadow-sm">
            <h2 className="text-xl font-black">Could not load partners</h2>
            <p className="mt-2 text-sm font-semibold leading-6">
              Supabase returned an error while loading active partners.
            </p>
            <pre className="mt-4 overflow-auto rounded-2xl bg-white p-4 text-xs font-bold text-red-900">
              {error.message}
            </pre>
          </section>
        ) : null}

        {trackingError ? (
          <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
            <h2 className="text-xl font-black">
              Tracking events are not fully connected yet
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6">
              The Active Partners page loaded, but Supabase could not read
              partner_tracking_events. Run the Step 17 SQL migration to create
              the tracking table.
            </p>
            <pre className="mt-4 overflow-auto rounded-2xl bg-white p-4 text-xs font-bold text-amber-900">
              {trackingError.message}
            </pre>
          </section>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-6">
            <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
                    Status KPIs
                  </p>

                  <h2 className="mt-2 text-3xl font-black leading-tight text-[#17382B] sm:text-4xl">
                    Partner Status Pipeline
                  </h2>

                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                    Visual status breakdown from the currently loaded partners
                    table.
                  </p>
                </div>

                <Link
                  href="/api/admin/partners/active/export"
                  className="inline-flex w-fit items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-800 transition hover:bg-emerald-50"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Partners
                </Link>
              </div>

              <div className="grid gap-4 lg:grid-cols-4">
                {statusBreakdown.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`rounded-3xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${item.card}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={`text-sm font-black ${item.text}`}>
                            {item.label}
                          </p>

                          <p className="mt-2 text-3xl font-black text-[#17382B]">
                            {item.value}
                          </p>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white">
                          <Icon className={`h-5 w-5 ${item.text}`} />
                        </div>
                      </div>

                      <div className="mt-5">
                        <div className="mb-2 flex items-center justify-between text-xs font-black text-slate-600">
                          <span>{item.rate}% of total</span>
                          <span>Open →</span>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-white">
                          <div
                            className={`h-full rounded-full ${item.bar}`}
                            style={{ width: `${item.rate}%` }}
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <div className="mb-6">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
                  Growth Tracking
                </p>

                <h2 className="mt-2 text-3xl font-black leading-tight text-[#17382B] sm:text-4xl">
                  Partner Event Attribution
                </h2>

                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  Real partner click, signup, booking, and revenue data from
                  partner_tracking_events.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
                  <p className="text-sm font-black text-blue-900">Clicks</p>
                  <p className="mt-2 text-4xl font-black text-blue-950">
                    {formatNumber(totalTrackedClicks)}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    Partner click events.
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
                    {formatReward(totalTrackedRevenue)}
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
                  Reward Configuration
                </p>

                <h2 className="mt-2 text-3xl font-black leading-tight text-[#17382B] sm:text-4xl">
                  Commission Type Split
                </h2>

                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  Visual breakdown by fixed, percent, donation, and manual
                  commission setup.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {commissionBreakdown.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className={`rounded-3xl border p-5 shadow-sm ${item.card}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white">
                          <Icon className={`h-6 w-6 ${item.text}`} />
                        </div>

                        <span className="rounded-full border border-white/80 bg-white px-3 py-1 text-xs font-black text-[#17382B]">
                          {item.rate}%
                        </span>
                      </div>

                      <h3 className={`mt-4 text-2xl font-black ${item.text}`}>
                        {item.label}
                      </h3>

                      <p className="mt-2 text-4xl font-black leading-none text-[#17382B]">
                        {item.value}
                      </p>

                      <div className="mt-5 h-3 overflow-hidden rounded-full bg-white">
                        <div
                          className={`h-full rounded-full ${item.bar}`}
                          style={{ width: `${item.rate}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
                    Partner Records
                  </p>

                  <h2 className="mt-2 text-3xl font-black leading-tight text-[#17382B] sm:text-4xl">
                    {partners.length} Partner Records
                  </h2>

                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                    Approved partner records with live tracking summaries when
                    partner_tracking_events are available.
                  </p>
                </div>

                <Link
                  href="/api/admin/partners/active/export"
                  className="inline-flex w-fit items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-100"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Link>
              </div>

              {partners.length === 0 ? (
                <div className="rounded-3xl border border-emerald-100 bg-[#FBFCF8] p-8 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-3xl">
                    🤝
                  </div>

                  <h3 className="mt-5 text-2xl font-black text-[#17382B]">
                    No approved partners yet
                  </h3>

                  <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-700">
                    Once Admin approves Local Partner, National Partner, or
                    Growth Affiliate applications, approved partner records will
                    appear here.
                  </p>

                  <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Link
                      href="/admin/partners/applications"
                      className="inline-flex rounded-2xl bg-[#007A3D] px-5 py-3 text-sm font-black !text-white transition hover:bg-[#006B35]"
                    >
                      Review Applications
                    </Link>

                    <BackToPartnersButton />
                  </div>
                </div>
              ) : (
                <div className="grid gap-5">
                  {partners.map((partner) => {
                    const referralUrl = buildFullReferralUrl(partner);
                    const qrCodeUrl = buildQrCodeUrl(partner);
                    const summary = getPartnerTrackingSummary(
                      trackingSummaries,
                      partner.id
                    );
                    const partnerSignupRate = percentage(
                      summary.signups,
                      summary.clicks
                    );
                    const partnerBookingRate = percentage(
                      summary.bookings,
                      summary.clicks
                    );

                    return (
                      <article
                        key={partner.id}
                        className="overflow-hidden rounded-[1.5rem] border border-emerald-100 bg-white shadow-sm"
                      >
                        <div className="border-b border-emerald-100 bg-[#FBFCF8] p-5">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex gap-4">
                              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-3xl">
                                {partnerCategoryIcon(partner.partner_type)}
                              </div>

                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-2xl font-black text-[#17382B]">
                                    {partner.business_name || "Unnamed Partner"}
                                  </h3>

                                  <span
                                    className={`rounded-full border px-3 py-1 text-xs font-black ${statusClasses(
                                      partner.status
                                    )}`}
                                  >
                                    {formatPartnerType(partner.status)}
                                  </span>

                                  <span
                                    className={`rounded-full border px-3 py-1 text-xs font-black ${commissionClasses(
                                      partner.commission_type
                                    )}`}
                                  >
                                    {formatCommissionType(
                                      partner.commission_type
                                    )}
                                  </span>
                                </div>

                                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                                  {formatPartnerType(partner.partner_type)}
                                  {partner.business_type
                                    ? ` · ${partner.business_type}`
                                    : ""}
                                </p>

                                <p className="mt-1 text-xs font-semibold text-slate-500">
                                  Approved {formatDate(partner.approved_at)} ·
                                  Updated {formatDate(partner.updated_at)}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row">
                              <Link
                                href={`/admin/partners/active/${partner.id}/edit`}
                                className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-900 transition hover:border-emerald-300 hover:bg-emerald-50"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>

                              <Link
                                href={`/admin/messages?partnerId=${partner.id}`}
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
                              {partner.contact_name || "Not provided"}
                            </p>

                            {partner.email ? (
                              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <Mail className="h-4 w-4 text-emerald-800" />
                                {partner.email}
                              </p>
                            ) : null}
                          </div>

                          <div className="rounded-2xl border border-emerald-100 bg-[#FBFCF8] p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                              Location
                            </p>

                            <p className="mt-3 flex items-center gap-2 text-sm font-black text-[#17382B]">
                              <MapPin className="h-4 w-4 text-emerald-800" />
                              {[partner.city, partner.state]
                                .filter(Boolean)
                                .join(", ") || "Not provided"}
                            </p>

                            {partner.zip_code ? (
                              <p className="mt-2 text-sm font-semibold text-slate-700">
                                ZIP {partner.zip_code}
                              </p>
                            ) : null}
                          </div>

                          <div className="rounded-2xl border border-emerald-100 bg-[#FBFCF8] p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                              Online
                            </p>

                            {partner.website ? (
                              <a
                                href={partner.website}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 flex items-center gap-2 truncate text-sm font-black text-emerald-800 hover:text-emerald-950"
                              >
                                <Globe className="h-4 w-4 shrink-0" />
                                <span className="truncate">
                                  {partner.website}
                                </span>
                                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                              </a>
                            ) : (
                              <p className="mt-3 text-sm font-semibold text-slate-700">
                                Website not provided
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="grid gap-5 border-t border-emerald-100 p-5 lg:grid-cols-3">
                          <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                              Referral Code
                            </p>

                            <p className="mt-3 text-lg font-black text-[#17382B]">
                              {partner.referral_code || "Not generated"}
                            </p>

                            <p className="mt-2 break-words text-sm font-semibold text-slate-700">
                              {referralUrl}
                            </p>

                            <form
                              action={regenerateReferralCodeAction}
                              className="mt-4"
                            >
                              <input
                                type="hidden"
                                name="partnerId"
                                value={partner.id}
                              />
                              <input
                                type="hidden"
                                name="businessName"
                                value={
                                  partner.business_name || "SitGuru Partner"
                                }
                              />

                              <button
                                type="submit"
                                className="inline-flex rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-900 transition hover:bg-emerald-100"
                              >
                                <RefreshCcw className="mr-2 h-3.5 w-3.5" />
                                Regenerate Code
                              </button>
                            </form>
                          </div>

                          <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                              QR Code
                            </p>

                            <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                              Open or save the QR code for partner flyers,
                              events, local businesses, and campaign cards.
                            </p>

                            <a
                              href={qrCodeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-4 inline-flex rounded-xl bg-[#007A3D] px-4 py-2 text-xs font-black !text-white transition hover:bg-[#006B35]"
                            >
                              <QrCode className="mr-2 h-3.5 w-3.5 !text-white" />
                              Open QR Code
                            </a>
                          </div>

                          <div className="rounded-2xl border border-emerald-100 bg-white p-4">
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
                              {formatReward(summary.revenue)}
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-5 border-t border-emerald-100 p-5 lg:grid-cols-3">
                          <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                              Conversion Rates
                            </p>

                            <div className="mt-3 grid gap-2 text-sm font-semibold text-slate-700">
                              <p>
                                Signup Rate:{" "}
                                <span className="font-black text-[#17382B]">
                                  {partnerSignupRate}%
                                </span>
                              </p>

                              <p>
                                Booking Rate:{" "}
                                <span className="font-black text-[#17382B]">
                                  {partnerBookingRate}%
                                </span>
                              </p>

                              <p>
                                Reward Amount:{" "}
                                <span className="font-black text-[#17382B]">
                                  {formatReward(summary.rewards)}
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                              Status Controls
                            </p>

                            <div className="mt-4 flex flex-wrap gap-2">
                              {partner.status !== "active" ? (
                                <form action={updatePartnerStatusAction}>
                                  <input
                                    type="hidden"
                                    name="partnerId"
                                    value={partner.id}
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

                              {partner.status !== "paused" ? (
                                <form action={updatePartnerStatusAction}>
                                  <input
                                    type="hidden"
                                    name="partnerId"
                                    value={partner.id}
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

                              {partner.status !== "suspended" ? (
                                <form action={updatePartnerStatusAction}>
                                  <input
                                    type="hidden"
                                    name="partnerId"
                                    value={partner.id}
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
                              Payout History
                            </p>

                            <div className="mt-4 flex flex-col gap-2">
                              <Link
                                href={`/admin/partners/rewards?partner_id=${partner.id}`}
                                className="inline-flex rounded-xl border border-emerald-200 bg-white px-4 py-2 text-xs font-black text-emerald-900 transition hover:bg-emerald-50"
                              >
                                View Rewards
                              </Link>

                              <Link
                                href={`/admin/partners/payouts?partner_id=${partner.id}`}
                                className="inline-flex rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-900 transition hover:bg-emerald-100"
                              >
                                View Payouts
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
                Partner Health
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
                    Wire public partner landing pages, customer signup, Guru
                    signup, booking completion, and payout approval flows to
                    post into partner_tracking_events.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                  <MapPin className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                    Location Data
                  </p>
                  <h2 className="text-2xl font-black text-[#17382B]">
                    Top Locations
                  </h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {topLocations.length === 0 ? (
                  <div className="rounded-2xl border border-emerald-100 bg-[#FBFCF8] p-4 text-sm font-black leading-6 text-[#17382B]">
                    No location data yet.
                  </div>
                ) : (
                  topLocations.map((location) => (
                    <div
                      key={location.label}
                      className="rounded-2xl border border-emerald-100 bg-[#FBFCF8] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-black text-[#17382B]">
                          {location.label}
                        </p>

                        <p className="text-xl font-black text-emerald-900">
                          {location.value}
                        </p>
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-100">
                        <div
                          className="h-full rounded-full bg-emerald-700"
                          style={{
                            width: `${percentage(
                              location.value,
                              partners.length
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
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 text-purple-800">
                  <BadgeDollarSign className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                    Reward Totals
                  </p>
                  <h2 className="text-2xl font-black text-[#17382B]">
                    Configured Rewards
                  </h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                  <p className="text-sm font-black text-green-900">
                    Customer Booking Rewards
                  </p>
                  <p className="mt-2 text-3xl font-black text-green-950">
                    {formatReward(totalCustomerBookingRewards)}
                  </p>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-sm font-black text-blue-900">
                    Guru Referral Rewards
                  </p>
                  <p className="mt-2 text-3xl font-black text-blue-950">
                    {formatReward(totalGuruReferralRewards)}
                  </p>
                </div>

                <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4">
                  <p className="text-sm font-black text-purple-900">
                    Activation Rewards
                  </p>
                  <p className="mt-2 text-3xl font-black text-purple-950">
                    {formatReward(totalPartnerActivationRewards)}
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <p className="text-sm font-black text-amber-900">
                    Affiliate-Labeled Partners
                  </p>
                  <p className="mt-2 text-3xl font-black text-amber-950">
                    {formatNumber(affiliateCount)}
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </section>

        <SupabaseCoordinationBanner
          pagePath="app/admin/partners/active/page.tsx"
          folderPath="app/admin/partners/active"
          primaryTable="partners"
          operation="Read partners, read partner_tracking_events, visualize partner growth activity, export, update status, regenerate referral codes, and update slugs"
          selectQuery='supabase.from("partners").select("*").order("created_at", { ascending: false }); supabase.from("partner_tracking_events").select("id, partner_id, ambassador_id, affiliate_id, campaign_id, referral_code, event_type, event_source, event_medium, event_campaign, landing_page, current_url, referrer_url, user_id, customer_id, guru_id, booking_id, revenue_amount, reward_amount, currency, created_at").order("created_at", { ascending: false }).limit(5000)'
          readFields={[
            "partners.id",
            "partners.application_id",
            "partners.owner_user_id",
            "partners.partner_type",
            "partners.business_name",
            "partners.contact_name",
            "partners.email",
            "partners.website",
            "partners.city",
            "partners.state",
            "partners.slug",
            "partners.referral_code",
            "partners.commission_type",
            "partners.status",
            "partner_tracking_events.partner_id",
            "partner_tracking_events.event_type",
            "partner_tracking_events.event_source",
            "partner_tracking_events.campaign_id",
            "partner_tracking_events.revenue_amount",
            "partner_tracking_events.reward_amount",
            "partner_tracking_events.created_at",
          ]}
          filters={[
            "partner status is calculated client-side from loaded partners rows",
            "tracking summaries are grouped by partner_tracking_events.partner_id",
            "signup events include signup, customer_signup, guru_signup, partner_signup",
            "booking events include booking and completed_booking",
          ]}
          searchFields={[
            "No search input on this page yet",
            "partner business_name",
            "partner contact_name",
            "partner email",
            "tracking referral_code",
            "tracking event_source",
            "tracking event_campaign",
          ]}
          writeActions={[
            "updatePartnerStatusAction updates partners.status",
            "regenerateReferralCodeAction updates partners.referral_code",
            "regenerateReferralCodeAction updates partners.slug",
            "tracking API inserts partner_tracking_events rows",
            "tracking API hashes IP source before storage",
          ]}
          exportRoutes={[
            "/api/admin/partners/active/export",
            "/api/admin/partners/tracking",
          ]}
          relatedPages={[
            "/admin/partners",
            "/admin/partners/applications",
            "/admin/partners/ambassadors",
            "/admin/partners/affiliates",
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
            "ambassadors",
            "affiliates",
          ]}
          notes={[
            "Partner cards now read real tracking summaries when partner_tracking_events contains rows.",
            "Referral clicks, signups, bookings, revenue, rewards, conversion rates, source labels, and last activity are calculated from partner_tracking_events.",
            "The warning panel appears if the tracking table has not been created yet.",
            "The next build should wire public pages, signup flows, and booking completion into /api/admin/partners/tracking.",
          ]}
        />
      </div>
    </main>
  );
}