import Link from "next/link";
import { revalidatePath } from "next/cache";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Download,
  Edit,
  MapPin,
  MessageCircle,
  PauseCircle,
  PlayCircle,
  RefreshCcw,
  ShieldX,
  Star,
  Trophy,
  TrendingUp,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import BackToPartnersButton from "../_components/back-to-partners-button";
import SupabaseCoordinationBanner from "../_components/supabase-coordination-banner";

type Ambassador = {
  id: string;
  user_id: string | null;
  application_id: string | null;
  display_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  territory: string | null;
  ambassador_type: string;
  tier: "bronze" | "silver" | "gold" | "city_captain";
  points: number;
  referral_code: string | null;
  customer_referral_url: string | null;
  guru_referral_url: string | null;
  partner_referral_url: string | null;
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

type AmbassadorTrackingSummary = {
  clicks: number;
  views: number;
  signups: number;
  bookings: number;
  revenue: number;
  rewards: number;
  lastActivity: string | null;
  sources: string[];
};

function formatLabel(value: string | null) {
  if (!value) return "Not Available";

  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value: string | null) {
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

function statusClasses(status: Ambassador["status"]) {
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

function tierClasses(tier: Ambassador["tier"]) {
  switch (tier) {
    case "city_captain":
      return "border-green-300 bg-green-100 text-green-900";
    case "gold":
      return "border-yellow-300 bg-yellow-50 text-yellow-900";
    case "silver":
      return "border-slate-300 bg-slate-50 text-slate-800";
    case "bronze":
      return "border-orange-200 bg-orange-50 text-orange-800";
    default:
      return "border-orange-200 bg-orange-50 text-orange-800";
  }
}

function tierIcon(tier: Ambassador["tier"]) {
  switch (tier) {
    case "city_captain":
      return "🛡️";
    case "gold":
      return "🥇";
    case "silver":
      return "🥈";
    case "bronze":
      return "🥉";
    default:
      return "⭐";
  }
}

function ambassadorIcon(type: string | null) {
  const safeType = type?.toLowerCase() || "";

  if (safeType.includes("local_partner")) return "🏪";
  if (safeType.includes("city_captain")) return "🏙️";
  if (safeType.includes("campus")) return "🎓";
  if (safeType.includes("neighborhood")) return "📍";
  if (safeType.includes("event")) return "📣";
  if (safeType.includes("rescue")) return "💚";

  return "⭐";
}

function percentage(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function createReferralCode(name: string | null) {
  const base = (name || "AMBASSADOR")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);

  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();

  return `${base || "AMB"}-${suffix}`;
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

function getLocationKey(ambassador: Ambassador) {
  const territory = ambassador.territory?.trim();
  const city = ambassador.city?.trim();
  const state = ambassador.state?.trim();

  if (territory) return territory;
  if (city && state) return `${city}, ${state}`;
  if (state) return state;
  if (city) return city;

  return "Not provided";
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
  const summaries = new Map<string, AmbassadorTrackingSummary>();

  events.forEach((event) => {
    if (!event.ambassador_id) return;

    const current = summaries.get(event.ambassador_id) || {
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

    summaries.set(event.ambassador_id, current);
  });

  return summaries;
}

function getAmbassadorTrackingSummary(
  summaries: Map<string, AmbassadorTrackingSummary>,
  ambassadorId: string
) {
  return (
    summaries.get(ambassadorId) || {
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

async function updateAmbassadorStatusAction(formData: FormData) {
  "use server";

  const ambassadorId = String(formData.get("ambassadorId") || "");
  const status = String(formData.get("status") || "") as Ambassador["status"];

  if (!ambassadorId || !status) return;

  const supabase = await createClient();

  await supabase
    .from("ambassadors")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ambassadorId);

  revalidatePath("/admin/partners/ambassadors");
  revalidatePath("/admin/partners");
}

async function updateAmbassadorTierAction(formData: FormData) {
  "use server";

  const ambassadorId = String(formData.get("ambassadorId") || "");
  const tier = String(formData.get("tier") || "") as Ambassador["tier"];

  if (!ambassadorId || !tier) return;

  const supabase = await createClient();

  await supabase
    .from("ambassadors")
    .update({
      tier,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ambassadorId);

  revalidatePath("/admin/partners/ambassadors");
  revalidatePath("/admin/partners");
}

async function adjustAmbassadorPointsAction(formData: FormData) {
  "use server";

  const ambassadorId = String(formData.get("ambassadorId") || "");
  const currentPoints = Number(formData.get("currentPoints") || 0);
  const pointAdjustment = Number(formData.get("pointAdjustment") || 0);

  if (!ambassadorId || Number.isNaN(pointAdjustment)) return;

  const nextPoints = Math.max(0, currentPoints + pointAdjustment);
  const supabase = await createClient();

  await supabase
    .from("ambassadors")
    .update({
      points: nextPoints,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ambassadorId);

  revalidatePath("/admin/partners/ambassadors");
  revalidatePath("/admin/partners");
}

async function regenerateAmbassadorReferralCodeAction(formData: FormData) {
  "use server";

  const ambassadorId = String(formData.get("ambassadorId") || "");
  const displayName = String(formData.get("displayName") || "Ambassador");

  if (!ambassadorId) return;

  const referralCode = createReferralCode(displayName);
  const supabase = await createClient();

  await supabase
    .from("ambassadors")
    .update({
      referral_code: referralCode,
      customer_referral_url: buildCustomerReferralUrl(referralCode),
      guru_referral_url: buildGuruReferralUrl(referralCode),
      partner_referral_url: buildPartnerReferralUrl(referralCode),
      updated_at: new Date().toISOString(),
    })
    .eq("id", ambassadorId);

  revalidatePath("/admin/partners/ambassadors");
  revalidatePath("/admin/partners");
}

export default async function AdminAmbassadorsPage() {
  const supabase = await createClient();

  const [{ data, error }, trackingResponse] = await Promise.all([
    supabase.from("ambassadors").select("*").order("created_at", {
      ascending: false,
    }),
    supabase
      .from("partner_tracking_events")
      .select(
        "id, partner_id, ambassador_id, affiliate_id, campaign_id, referral_code, event_type, event_source, event_medium, event_campaign, landing_page, current_url, referrer_url, user_id, customer_id, guru_id, booking_id, revenue_amount, reward_amount, currency, created_at"
      )
      .not("ambassador_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(5000),
  ]);

  const ambassadors = (data ?? []) as Ambassador[];
  const trackingEvents = (trackingResponse.data ?? []) as PartnerTrackingEvent[];
  const trackingError = trackingResponse.error;
  const trackingSummaries = buildTrackingSummaries(trackingEvents);

  const activeCount = ambassadors.filter(
    (ambassador) => ambassador.status === "active"
  ).length;

  const pausedCount = ambassadors.filter(
    (ambassador) => ambassador.status === "paused"
  ).length;

  const suspendedCount = ambassadors.filter(
    (ambassador) => ambassador.status === "suspended"
  ).length;

  const archivedCount = ambassadors.filter(
    (ambassador) => ambassador.status === "archived"
  ).length;

  const cityCaptainCount = ambassadors.filter(
    (ambassador) =>
      ambassador.tier === "city_captain" ||
      ambassador.ambassador_type === "city_captain"
  ).length;

  const goldCount = ambassadors.filter(
    (ambassador) => ambassador.tier === "gold"
  ).length;

  const silverCount = ambassadors.filter(
    (ambassador) => ambassador.tier === "silver"
  ).length;

  const bronzeCount = ambassadors.filter(
    (ambassador) => ambassador.tier === "bronze"
  ).length;

  const totalPoints = ambassadors.reduce(
    (sum, ambassador) => sum + (ambassador.points || 0),
    0
  );

  const ambassadorsWithReferralCodes = ambassadors.filter(
    (ambassador) => ambassador.referral_code
  ).length;

  const totalTrackedClicks = trackingEvents.filter(
    (event) => event.event_type === "click" && event.ambassador_id
  ).length;

  const totalTrackedSignups = trackingEvents.filter(
    (event) => event.ambassador_id && isSignupEvent(event.event_type)
  ).length;

  const totalTrackedBookings = trackingEvents.filter(
    (event) => event.ambassador_id && isBookingEvent(event.event_type)
  ).length;

  const totalTrackedRevenue = trackingEvents.reduce(
    (sum, event) => sum + Number(event.revenue_amount || 0),
    0
  );

  const activeRate = percentage(activeCount, ambassadors.length);
  const cityCaptainRate = percentage(cityCaptainCount, ambassadors.length);
  const signupConversionRate = percentage(totalTrackedSignups, totalTrackedClicks);
  const bookingConversionRate = percentage(totalTrackedBookings, totalTrackedClicks);
  const referralCodeRate = percentage(
    ambassadorsWithReferralCodes,
    ambassadors.length
  );

  const topTerritories = countByValue(ambassadors, getLocationKey, 5);

  return (
    <main className="min-h-screen bg-[#F7FAF3] text-[#17382B]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <BackToPartnersButton />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/admin/partners/active"
                  className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous: Active Partners
                </Link>

                <Link
                  href="/admin/partners/affiliates"
                  className="inline-flex items-center justify-center rounded-2xl bg-[#007A3D] px-5 py-3 text-sm font-black !text-white shadow-sm transition hover:bg-[#006B35]"
                >
                  Next: Affiliates
                  <ArrowRight className="ml-2 h-4 w-4 !text-white" />
                </Link>

                <Link
                  href="/api/admin/partners/ambassadors/export"
                  className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Link>
              </div>
            </div>

            <div className="max-w-4xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-800">
                <Star className="h-7 w-7" />
              </div>

              <p className="mt-6 text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
                Student, City, and Community Growth
              </p>

              <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight text-[#17382B] sm:text-5xl lg:text-6xl">
                Ambassadors
              </h1>

              <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-700 sm:text-lg">
                Manage approved SitGuru Ambassadors, student leaders, recent
                graduates, City Captains, local outreach promoters, territories,
                referral links, tiers, points, campaigns, payout reporting, and
                ambassador growth tracking.
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
              Ambassadors currently active in the growth program.
            </p>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
            <p className="text-sm font-black text-blue-900">Tracked Clicks</p>
            <p className="mt-3 text-4xl font-black leading-none text-blue-950">
              {formatNumber(totalTrackedClicks)}
            </p>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
              Ambassador click events from tracking records.
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
              Booking events attributed to ambassadors.
            </p>
          </div>

          <div className="rounded-3xl border border-orange-100 bg-orange-50 p-5 shadow-sm">
            <p className="text-sm font-black text-orange-900">Total Points</p>
            <p className="mt-3 text-4xl font-black leading-none text-orange-950">
              {formatNumber(totalPoints)}
            </p>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
              Combined ambassador points from growth activity.
            </p>
          </div>
        </section>

        {error ? (
          <section className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-red-900 shadow-sm">
            <h2 className="text-xl font-black">Could not load ambassadors</h2>

            <p className="mt-2 text-sm font-semibold leading-6">
              Supabase returned an error while loading ambassadors.
            </p>

            <pre className="mt-4 overflow-auto rounded-2xl bg-white p-4 text-xs font-bold text-red-900">
              {error.message}
            </pre>
          </section>
        ) : null}

        {trackingError ? (
          <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
            <h2 className="text-xl font-black">
              Ambassador tracking events are not fully connected yet
            </h2>

            <p className="mt-2 text-sm font-semibold leading-6">
              The Ambassadors page loaded, but Supabase could not read
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
                  Ambassador Event Attribution
                </h2>

                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  Real ambassador click, signup, booking, and revenue data from
                  partner_tracking_events when ambassador_id is present.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
                  <p className="text-sm font-black text-blue-900">Clicks</p>
                  <p className="mt-2 text-4xl font-black text-blue-950">
                    {formatNumber(totalTrackedClicks)}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    Ambassador click events.
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
                  Tier Visuals
                </p>

                <h2 className="mt-2 text-3xl font-black leading-tight text-[#17382B] sm:text-4xl">
                  Ambassador Tier Breakdown
                </h2>

                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  Breakdown by City Captain, Gold, Silver, and Bronze.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: "City Captains",
                    value: cityCaptainCount,
                    rate: cityCaptainRate,
                    card: "border-green-100 bg-green-50",
                    text: "text-green-900",
                    bar: "bg-green-700",
                  },
                  {
                    label: "Gold",
                    value: goldCount,
                    rate: percentage(goldCount, ambassadors.length),
                    card: "border-yellow-100 bg-yellow-50",
                    text: "text-yellow-900",
                    bar: "bg-yellow-500",
                  },
                  {
                    label: "Silver",
                    value: silverCount,
                    rate: percentage(silverCount, ambassadors.length),
                    card: "border-slate-200 bg-slate-50",
                    text: "text-slate-800",
                    bar: "bg-slate-600",
                  },
                  {
                    label: "Bronze",
                    value: bronzeCount,
                    rate: percentage(bronzeCount, ambassadors.length),
                    card: "border-orange-100 bg-orange-50",
                    text: "text-orange-900",
                    bar: "bg-orange-600",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-3xl border p-5 shadow-sm ${item.card}`}
                  >
                    <p className={`text-sm font-black ${item.text}`}>
                      {item.label}
                    </p>

                    <p className="mt-2 text-4xl font-black text-[#17382B]">
                      {item.value}
                    </p>

                    <p className="mt-2 text-sm font-bold text-slate-700">
                      {item.rate}% of ambassadors
                    </p>

                    <div className="mt-5 h-3 overflow-hidden rounded-full bg-white">
                      <div
                        className={`h-full rounded-full ${item.bar}`}
                        style={{ width: `${item.rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
                    Ambassador Records
                  </p>

                  <h2 className="mt-2 text-3xl font-black leading-tight text-[#17382B] sm:text-4xl">
                    {ambassadors.length} Ambassador Records
                  </h2>

                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                    Approved ambassador records with live tracking summaries
                    when partner_tracking_events are available.
                  </p>
                </div>

                <Link
                  href="/api/admin/partners/ambassadors/export"
                  className="inline-flex w-fit items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-100"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Link>
              </div>

              {ambassadors.length === 0 ? (
                <div className="rounded-3xl border border-emerald-100 bg-[#FBFCF8] p-8 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-3xl">
                    ⭐
                  </div>

                  <h3 className="mt-5 text-2xl font-black text-[#17382B]">
                    No approved ambassadors yet
                  </h3>

                  <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-700">
                    Once Admin approves Ambassador applications, approved
                    ambassador records will appear here with referral links,
                    tiers, points, territory details, tracking summaries, and
                    payout reporting.
                  </p>

                  <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Link
                      href="/admin/partners/applications?type=ambassador"
                      className="inline-flex rounded-2xl bg-[#007A3D] px-5 py-3 text-sm font-black !text-white transition hover:bg-[#006B35]"
                    >
                      Review Ambassador Applications
                    </Link>

                    <BackToPartnersButton />
                  </div>
                </div>
              ) : (
                <div className="grid gap-5">
                  {ambassadors.map((ambassador) => {
                    const summary = getAmbassadorTrackingSummary(
                      trackingSummaries,
                      ambassador.id
                    );

                    const signupRate = percentage(summary.signups, summary.clicks);
                    const bookingRate = percentage(summary.bookings, summary.clicks);

                    return (
                      <article
                        key={ambassador.id}
                        className="overflow-hidden rounded-[1.5rem] border border-emerald-100 bg-white shadow-sm"
                      >
                        <div className="border-b border-emerald-100 bg-[#FBFCF8] p-5">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex gap-4">
                              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-3xl">
                                {ambassadorIcon(ambassador.ambassador_type)}
                              </div>

                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">
                                    {formatLabel(ambassador.ambassador_type)}
                                  </span>

                                  <span
                                    className={`rounded-full border px-3 py-1 text-xs font-black ${tierClasses(
                                      ambassador.tier
                                    )}`}
                                  >
                                    {tierIcon(ambassador.tier)}{" "}
                                    {formatLabel(ambassador.tier)}
                                  </span>

                                  <span
                                    className={`rounded-full border px-3 py-1 text-xs font-black ${statusClasses(
                                      ambassador.status
                                    )}`}
                                  >
                                    {formatLabel(ambassador.status)}
                                  </span>
                                </div>

                                <h3 className="mt-3 text-2xl font-black text-[#17382B]">
                                  {ambassador.display_name}
                                </h3>

                                <p className="mt-1 text-sm font-semibold text-slate-600">
                                  Approved {formatDate(ambassador.approved_at)} ·
                                  Updated {formatDate(ambassador.updated_at)}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row">
                              <Link
                                href={`/admin/partners/ambassadors/${ambassador.id}/edit`}
                                className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-900 transition hover:border-emerald-300 hover:bg-emerald-50"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>

                              <Link
                                href={`/admin/messages?ambassadorId=${ambassador.id}`}
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
                              {ambassador.display_name}
                            </p>

                            <p className="mt-2 break-words text-sm font-semibold text-slate-700">
                              {ambassador.email}
                            </p>

                            {ambassador.phone ? (
                              <p className="mt-2 text-sm font-semibold text-slate-700">
                                {ambassador.phone}
                              </p>
                            ) : null}
                          </div>

                          <div className="rounded-2xl border border-emerald-100 bg-[#FBFCF8] p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                              Territory
                            </p>

                            <p className="mt-3 flex items-center gap-2 text-sm font-black text-[#17382B]">
                              <MapPin className="h-4 w-4 text-emerald-800" />
                              {getLocationKey(ambassador)}
                            </p>

                            {ambassador.zip_code ? (
                              <p className="mt-2 text-sm font-semibold text-slate-700">
                                ZIP {ambassador.zip_code}
                              </p>
                            ) : null}
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
                              {ambassador.referral_code || "Not generated"}
                            </p>

                            <p className="mt-2 text-sm font-semibold text-slate-700">
                              Points:{" "}
                              <span className="font-black text-[#17382B]">
                                {ambassador.points}
                              </span>
                            </p>

                            <form
                              action={regenerateAmbassadorReferralCodeAction}
                              className="mt-4"
                            >
                              <input
                                type="hidden"
                                name="ambassadorId"
                                value={ambassador.id}
                              />
                              <input
                                type="hidden"
                                name="displayName"
                                value={ambassador.display_name}
                              />

                              <button
                                type="submit"
                                className="inline-flex rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-black text-orange-900 transition hover:bg-orange-100"
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
                              Points Controls
                            </p>

                            <form
                              action={adjustAmbassadorPointsAction}
                              className="mt-4 grid gap-2"
                            >
                              <input
                                type="hidden"
                                name="ambassadorId"
                                value={ambassador.id}
                              />
                              <input
                                type="hidden"
                                name="currentPoints"
                                value={ambassador.points}
                              />

                              <input
                                name="pointAdjustment"
                                type="number"
                                defaultValue={10}
                                className="rounded-xl border border-emerald-100 bg-[#FBFCF8] px-4 py-2 text-sm font-bold text-[#17382B] outline-none focus:border-emerald-300"
                              />

                              <button
                                type="submit"
                                className="inline-flex justify-center rounded-xl bg-[#007A3D] px-4 py-2 text-xs font-black !text-white transition hover:bg-[#006B35]"
                              >
                                Add / Remove Points
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
                              {ambassador.status !== "active" ? (
                                <form action={updateAmbassadorStatusAction}>
                                  <input
                                    type="hidden"
                                    name="ambassadorId"
                                    value={ambassador.id}
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

                              {ambassador.status !== "paused" ? (
                                <form action={updateAmbassadorStatusAction}>
                                  <input
                                    type="hidden"
                                    name="ambassadorId"
                                    value={ambassador.id}
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

                              {ambassador.status !== "suspended" ? (
                                <form action={updateAmbassadorStatusAction}>
                                  <input
                                    type="hidden"
                                    name="ambassadorId"
                                    value={ambassador.id}
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
                              Tier Controls
                            </p>

                            <div className="mt-4 flex flex-wrap gap-2">
                              {(["bronze", "silver", "gold", "city_captain"] as const).map(
                                (tier) => (
                                  <form
                                    key={tier}
                                    action={updateAmbassadorTierAction}
                                  >
                                    <input
                                      type="hidden"
                                      name="ambassadorId"
                                      value={ambassador.id}
                                    />
                                    <input
                                      type="hidden"
                                      name="tier"
                                      value={tier}
                                    />
                                    <button
                                      className={`inline-flex rounded-xl border px-4 py-2 text-xs font-black transition ${
                                        ambassador.tier === tier
                                          ? "border-emerald-700 bg-emerald-700 !text-white"
                                          : "border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-50"
                                      }`}
                                    >
                                      {formatLabel(tier)}
                                    </button>
                                  </form>
                                )
                              )}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                              Reporting Links
                            </p>

                            <div className="mt-4 flex flex-col gap-2">
                              <Link
                                href={`/admin/partners/payouts?ambassador_id=${ambassador.id}`}
                                className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-center text-sm font-black text-orange-900 transition hover:bg-orange-100"
                              >
                                Payout Reporting
                              </Link>

                              <Link
                                href={`/admin/partners/campaigns?ambassador_id=${ambassador.id}`}
                                className="rounded-xl bg-[#007A3D] px-4 py-2 text-center text-sm font-black !text-white transition hover:bg-[#006B35]"
                              >
                                Assign Campaign
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
                Ambassador Health
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
                    Wire public ambassador referral URLs, student campaign
                    pages, campus links, and City Captain outreach into
                    partner_tracking_events using ambassador_id.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-800">
                  <MapPin className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                    Territory Data
                  </p>
                  <h2 className="text-2xl font-black text-[#17382B]">
                    Top Territories
                  </h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {topTerritories.length === 0 ? (
                  <div className="rounded-2xl border border-emerald-100 bg-[#FBFCF8] p-4 text-sm font-black leading-6 text-[#17382B]">
                    No territory data yet.
                  </div>
                ) : (
                  topTerritories.map((territory) => (
                    <div
                      key={territory.label}
                      className="rounded-2xl border border-emerald-100 bg-[#FBFCF8] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-black text-[#17382B]">
                          {territory.label}
                        </p>

                        <p className="text-xl font-black text-orange-900">
                          {territory.value}
                        </p>
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-orange-100">
                        <div
                          className="h-full rounded-full bg-orange-600"
                          style={{
                            width: `${percentage(
                              territory.value,
                              ambassadors.length
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
                  <Trophy className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                    Leaderboard
                  </p>
                  <h2 className="text-2xl font-black text-[#17382B]">
                    Points Leaders
                  </h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {[...ambassadors]
                  .sort((a, b) => (b.points || 0) - (a.points || 0))
                  .slice(0, 5)
                  .map((ambassador, index) => (
                    <div
                      key={ambassador.id}
                      className="rounded-2xl border border-emerald-100 bg-[#FBFCF8] p-4"
                    >
                      <p className="text-sm font-black text-[#17382B]">
                        #{index + 1} {ambassador.display_name}
                      </p>

                      <p className="mt-2 text-xs font-bold leading-5 text-slate-700">
                        {formatNumber(ambassador.points)} points ·{" "}
                        {formatLabel(ambassador.tier)}
                      </p>
                    </div>
                  ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-800">
                  <BarChart3 className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                    Status Totals
                  </p>
                  <h2 className="text-2xl font-black text-[#17382B]">
                    Operations
                  </h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                  <p className="text-sm font-black text-green-900">Active</p>
                  <p className="mt-2 text-3xl font-black text-green-950">
                    {activeCount}
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <p className="text-sm font-black text-amber-900">Paused</p>
                  <p className="mt-2 text-3xl font-black text-amber-950">
                    {pausedCount}
                  </p>
                </div>

                <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                  <p className="text-sm font-black text-red-900">Suspended</p>
                  <p className="mt-2 text-3xl font-black text-red-950">
                    {suspendedCount}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-black text-slate-800">Archived</p>
                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {archivedCount}
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </section>

        <SupabaseCoordinationBanner
          pagePath="app/admin/partners/ambassadors/page.tsx"
          folderPath="app/admin/partners/ambassadors"
          primaryTable="ambassadors"
          operation="Read ambassadors, read partner_tracking_events by ambassador_id, visualize ambassador growth activity, export, update status, update tier, adjust points, regenerate referral codes, and update referral URLs"
          selectQuery='supabase.from("ambassadors").select("*").order("created_at", { ascending: false }); supabase.from("partner_tracking_events").select("id, partner_id, ambassador_id, affiliate_id, campaign_id, referral_code, event_type, event_source, event_medium, event_campaign, landing_page, current_url, referrer_url, user_id, customer_id, guru_id, booking_id, revenue_amount, reward_amount, currency, created_at").not("ambassador_id", "is", null).order("created_at", { ascending: false }).limit(5000)'
          readFields={[
            "ambassadors.id",
            "ambassadors.user_id",
            "ambassadors.application_id",
            "ambassadors.display_name",
            "ambassadors.email",
            "ambassadors.phone",
            "ambassadors.city",
            "ambassadors.state",
            "ambassadors.zip_code",
            "ambassadors.territory",
            "ambassadors.ambassador_type",
            "ambassadors.tier",
            "ambassadors.points",
            "ambassadors.referral_code",
            "ambassadors.customer_referral_url",
            "ambassadors.guru_referral_url",
            "ambassadors.partner_referral_url",
            "ambassadors.status",
            "ambassadors.approved_at",
            "ambassadors.created_at",
            "ambassadors.updated_at",
            "partner_tracking_events.ambassador_id",
            "partner_tracking_events.event_type",
            "partner_tracking_events.event_source",
            "partner_tracking_events.revenue_amount",
            "partner_tracking_events.reward_amount",
            "partner_tracking_events.created_at",
          ]}
          filters={[
            "tracking summaries are grouped by partner_tracking_events.ambassador_id",
            "signup events include signup, customer_signup, guru_signup, partner_signup",
            "booking events include booking and completed_booking",
            "tier breakdown is calculated from ambassadors.tier",
            "territory visuals are calculated from ambassadors.territory, city, and state",
          ]}
          searchFields={[
            "No search input on this page yet",
            "ambassador display_name",
            "ambassador email",
            "tracking referral_code",
            "tracking event_source",
            "tracking event_campaign",
          ]}
          writeActions={[
            "updateAmbassadorStatusAction updates ambassadors.status",
            "updateAmbassadorTierAction updates ambassadors.tier",
            "adjustAmbassadorPointsAction updates ambassadors.points",
            "regenerateAmbassadorReferralCodeAction updates ambassadors.referral_code",
            "regenerateAmbassadorReferralCodeAction updates customer_referral_url, guru_referral_url, and partner_referral_url",
            "tracking API can insert partner_tracking_events rows with ambassador_id",
          ]}
          exportRoutes={[
            "/api/admin/partners/ambassadors/export",
            "/api/admin/partners/tracking",
          ]}
          relatedPages={[
            "/admin/partners",
            "/admin/partners/applications",
            "/admin/partners/active",
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
            "partners",
            "affiliates",
          ]}
          notes={[
            "Ambassador cards now read real tracking summaries when partner_tracking_events contains ambassador_id rows.",
            "Referral clicks, signups, bookings, revenue, rewards, conversion rates, source labels, and last activity are calculated from partner_tracking_events.",
            "The next build should wire public ambassador referral URLs and student/campus campaign links into /api/admin/partners/tracking.",
            "Tier, status, point, and referral code actions write directly to the ambassadors table.",
          ]}
        />
      </div>
    </main>
  );
}