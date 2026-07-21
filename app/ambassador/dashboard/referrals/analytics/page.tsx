import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  DollarSign,
  ExternalLink,
  Link2,
  MousePointerClick,
  PawPrint,
  QrCode,
  ScanLine,
  Share2,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AmbassadorRecord = {
  id: string;
  user_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  contact_email?: string | null;
  login_email?: string | null;
  referral_code?: string | null;
  dashboard_enabled?: boolean | null;
  login_enabled?: boolean | null;
  status?: string | null;
};

type ReferralCodeRow = {
  id?: string | null;
  code?: string | null;
  slug?: string | null;
  ambassador_id?: string | null;
  status?: string | null;
};

type ReferralClickRow = {
  id?: string | null;
  referral_code_id?: string | null;
  landing_page?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  created_at?: string | null;
};

type AmbassadorReferralRow = {
  id?: string | null;
  ambassador_id?: string | null;
  referral_type?: string | null;
  status?: string | null;
  booking_status?: string | null;
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  platform?: string | null;
  referral_source?: string | null;
  referral_medium?: string | null;
  referral_campaign?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  display_name?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  qualified_at?: string | null;
  signup_date?: string | null;
  completed_booking_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type RewardRow = {
  id?: string | null;
  amount?: number | string | null;
  reward_amount?: number | string | null;
  payout_amount?: number | string | null;
  status?: string | null;
  financial_status?: string | null;
  payout_status?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
};

type TrendPoint = {
  key: string;
  label: string;
  visits: number;
  signups: number;
};

type ChannelMetric = {
  key: string;
  label: string;
  visits: number;
  signups: number;
};

type RecentReferral = {
  id: string;
  name: string;
  type: string;
  status: string;
  channel: string;
  date: string;
};

type AnalyticsData = {
  clicks: ReferralClickRow[];
  referrals: AmbassadorReferralRow[];
  rewards: RewardRow[];
  warning: string;
};

const PLATFORM_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X",
  twitter: "X",
  youtube: "YouTube",
  qr: "QR Code",
  link: "Direct Link",
  referral: "Referral Link",
  unknown: "Unattributed",
};

function asString(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function asNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,%\s,()]/g, ""));
    if (!Number.isFinite(parsed)) return 0;
    return value.includes("(") ? -parsed : parsed;
  }

  return 0;
}

function normalize(value: unknown) {
  return asString(value)
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number.isFinite(value) ? value : 0);
}

function percent(value: number) {
  return `${Math.max(0, Number.isFinite(value) ? value : 0).toFixed(1)}%`;
}

function formatDate(value?: string | null) {
  const clean = asString(value);
  if (!clean) return "Date unavailable";

  const parsed = new Date(clean);
  if (Number.isNaN(parsed.getTime())) return "Date unavailable";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = asString(value);
    if (text) return text;
  }

  return "";
}

function normalizeReferralType(value?: string | null) {
  const type = normalize(value);

  if (
    ["pet parent", "customer", "pet owner", "parent"].includes(type)
  ) {
    return "pet_parent";
  }

  if (
    ["guru", "provider", "sitter", "walker", "future guru"].includes(type)
  ) {
    return "guru";
  }

  if (["business", "partner", "community"].includes(type)) {
    return "business";
  }

  return type || "referral";
}

function isCompletedBooking(row: AmbassadorReferralRow) {
  const bookingStatus = normalize(row.booking_status);
  const status = normalize(row.status);

  return Boolean(
    row.completed_booking_at ||
      ["booking completed", "completed"].includes(bookingStatus) ||
      status === "booking completed",
  );
}

function getReferralDate(row: AmbassadorReferralRow) {
  return firstText(
    row.completed_booking_at,
    row.qualified_at,
    row.signup_date,
    row.created_at,
    row.updated_at,
  );
}

function getClickDate(row: ReferralClickRow) {
  return asString(row.created_at);
}

function normalizeChannelValue(value: unknown) {
  const normalized = normalize(value);

  if (!normalized) return "";

  if (
    normalized === "twitter" ||
    normalized === "twitter x" ||
    normalized === "x.com"
  ) {
    return "x";
  }

  if (normalized.includes("facebook")) return "facebook";
  if (normalized.includes("instagram")) return "instagram";
  if (normalized.includes("tiktok")) return "tiktok";
  if (normalized.includes("youtube")) return "youtube";

  if (normalized === "x") return "x";
  if (normalized === "qr") return "qr";
  if (normalized.includes("link")) return "link";
  if (normalized.includes("referral")) return "referral";

  return normalized.replace(/\s+/g, "_");
}

function getClickChannel(row: ReferralClickRow) {
  const candidates = [
    row.utm_source,
    row.utm_campaign,
    row.utm_medium,
  ];

  for (const candidate of candidates) {
    const channel = normalizeChannelValue(candidate);
    if (channel && channel !== "qr" && channel !== "link") {
      return channel;
    }
  }

  const landingPage = asString(row.landing_page).toLowerCase();

  for (const key of [
    "facebook",
    "instagram",
    "tiktok",
    "youtube",
  ]) {
    if (landingPage.includes(`/${key}`)) return key;
  }

  if (landingPage.includes("/x")) return "x";

  const medium = normalize(row.utm_medium);
  if (medium === "qr" || landingPage.includes("via=qr")) return "qr";

  return "link";
}

function getReferralChannel(row: AmbassadorReferralRow) {
  const candidates = [
    row.platform,
    row.utm_source,
    row.source,
    row.referral_source,
    row.utm_campaign,
    row.campaign,
    row.referral_campaign,
    row.utm_medium,
    row.medium,
    row.referral_medium,
  ];

  for (const candidate of candidates) {
    const channel = normalizeChannelValue(candidate);
    if (channel) return channel;
  }

  return "unknown";
}

function getChannelLabel(key: string) {
  return PLATFORM_LABELS[key] || titleCase(key);
}

function getRewardAmount(row: RewardRow) {
  return (
    asNumber(row.amount) ||
    asNumber(row.reward_amount) ||
    asNumber(row.payout_amount)
  );
}

function getRewardBucket(row: RewardRow) {
  const status = normalize(row.status);
  const financialStatus = normalize(row.financial_status);
  const payoutStatus = normalize(row.payout_status);

  const excluded = new Set([
    "rejected",
    "ineligible",
    "void",
    "voided",
    "cancelled",
    "canceled",
    "refunded",
    "chargeback",
    "reversed",
  ]);

  if (
    excluded.has(status) ||
    excluded.has(financialStatus) ||
    excluded.has(payoutStatus)
  ) {
    return "excluded";
  }

  const paid = new Set([
    "paid",
    "payout paid",
    "payout completed",
    "settled",
  ]);

  if (
    asString(row.paid_at) ||
    paid.has(status) ||
    paid.has(financialStatus) ||
    paid.has(payoutStatus)
  ) {
    return "paid";
  }

  const approved = new Set([
    "approved",
    "approved unpaid",
    "payable",
    "ready for payout",
    "queued for payout",
    "queued",
  ]);

  if (
    approved.has(status) ||
    approved.has(financialStatus) ||
    approved.has(payoutStatus)
  ) {
    return "approved";
  }

  return "pending";
}

async function getAmbassadorForUser(userId: string, email?: string | null) {
  const { data: byUserId, error: userIdError } = await supabaseAdmin
    .from("ambassadors")
    .select(
      "id, user_id, full_name, email, contact_email, login_email, referral_code, dashboard_enabled, login_enabled, status",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (userIdError) {
    console.error(
      "Ambassador analytics lookup by user ID failed:",
      userIdError.message,
    );
  }

  let ambassador = byUserId as AmbassadorRecord | null;
  const cleanEmail = asString(email).toLowerCase();

  if (!ambassador && cleanEmail) {
    for (const column of ["login_email", "contact_email", "email"] as const) {
      const { data, error } = await supabaseAdmin
        .from("ambassadors")
        .select(
          "id, user_id, full_name, email, contact_email, login_email, referral_code, dashboard_enabled, login_enabled, status",
        )
        .eq(column, cleanEmail)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error(
          `Ambassador analytics lookup by ${column} failed:`,
          error.message,
        );
        continue;
      }

      if (data) {
        ambassador = data as AmbassadorRecord;
        break;
      }
    }
  }

  if (!ambassador) return null;

  const status = normalize(ambassador.status);
  const allowed =
    ambassador.dashboard_enabled === true &&
    ambassador.login_enabled === true &&
    ![
      "archived",
      "inactive",
      "disabled",
      "suspended",
      "not a fit",
    ].includes(status);

  return allowed ? ambassador : null;
}

async function getReferralCodeRow({
  ambassadorId,
  referralCode,
}: {
  ambassadorId: string;
  referralCode: string;
}) {
  const { data: byAmbassador, error: ambassadorError } = await supabaseAdmin
    .from("referral_codes")
    .select("id, code, slug, ambassador_id, status")
    .eq("ambassador_id", ambassadorId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (ambassadorError) {
    console.warn(
      "Ambassador analytics referral-code lookup failed:",
      ambassadorError.message,
    );
  }

  if (byAmbassador) return byAmbassador as ReferralCodeRow;

  const { data: byCode, error: codeError } = await supabaseAdmin
    .from("referral_codes")
    .select("id, code, slug, ambassador_id, status")
    .ilike("code", referralCode)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (codeError) {
    console.warn(
      "Ambassador analytics referral-code fallback failed:",
      codeError.message,
    );
  }

  return (byCode || null) as ReferralCodeRow | null;
}

async function loadAnalyticsData({
  ambassadorId,
  referralCode,
}: {
  ambassadorId: string;
  referralCode: string;
}): Promise<AnalyticsData> {
  const warnings: string[] = [];

  const [referralsResult, rewardsResult, referralCodeRow] = await Promise.all([
    supabaseAdmin
      .from("ambassador_referrals")
      .select("*")
      .eq("ambassador_id", ambassadorId)
      .order("created_at", { ascending: false })
      .limit(10000),
    supabaseAdmin
      .from("ambassador_rewards")
      .select("*")
      .eq("ambassador_id", ambassadorId)
      .order("created_at", { ascending: false })
      .limit(5000),
    getReferralCodeRow({
      ambassadorId,
      referralCode,
    }),
  ]);

  if (referralsResult.error) {
    console.error(
      "Unable to load Ambassador analytics referrals:",
      referralsResult.error.message,
    );
    warnings.push("Verified referral totals could not be loaded.");
  }

  if (rewardsResult.error) {
    console.error(
      "Unable to load Ambassador analytics rewards:",
      rewardsResult.error.message,
    );
    warnings.push("Reward totals could not be loaded.");
  }

  let clicks: ReferralClickRow[] = [];
  const referralCodeId = asString(referralCodeRow?.id);

  if (referralCodeId) {
    const clicksResult = await supabaseAdmin
      .from("referral_clicks")
      .select("*")
      .eq("referral_code_id", referralCodeId)
      .order("created_at", { ascending: false })
      .limit(20000);

    if (clicksResult.error) {
      console.error(
        "Unable to load Ambassador analytics clicks:",
        clicksResult.error.message,
      );
      warnings.push("Tracked link and QR activity could not be loaded.");
    } else {
      clicks = (clicksResult.data || []) as ReferralClickRow[];
    }
  }

  return {
    clicks,
    referrals:
      (referralsResult.data || []) as AmbassadorReferralRow[],
    rewards: (rewardsResult.data || []) as RewardRow[],
    warning: warnings.join(" "),
  };
}

function createTrend(
  clicks: ReferralClickRow[],
  referrals: AmbassadorReferralRow[],
  days = 14,
) {
  const now = new Date();
  const points: TrendPoint[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);

    const key = date.toISOString().slice(0, 10);

    points.push({
      key,
      label: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      visits: 0,
      signups: 0,
    });
  }

  const byDate = new Map(points.map((point) => [point.key, point]));

  clicks.forEach((row) => {
    const rawDate = getClickDate(row);
    const parsed = new Date(rawDate);

    if (Number.isNaN(parsed.getTime())) return;

    const point = byDate.get(parsed.toISOString().slice(0, 10));
    if (point) point.visits += 1;
  });

  referrals.forEach((row) => {
    const rawDate = getReferralDate(row);
    const parsed = new Date(rawDate);

    if (Number.isNaN(parsed.getTime())) return;

    const point = byDate.get(parsed.toISOString().slice(0, 10));
    if (point) point.signups += 1;
  });

  return points;
}

function createChannelMetrics(
  clicks: ReferralClickRow[],
  referrals: AmbassadorReferralRow[],
) {
  const metrics = new Map<string, ChannelMetric>();

  function ensure(key: string) {
    const normalizedKey = key || "unknown";
    const existing = metrics.get(normalizedKey);

    if (existing) return existing;

    const created: ChannelMetric = {
      key: normalizedKey,
      label: getChannelLabel(normalizedKey),
      visits: 0,
      signups: 0,
    };

    metrics.set(normalizedKey, created);
    return created;
  }

  clicks.forEach((row) => {
    ensure(getClickChannel(row)).visits += 1;
  });

  referrals.forEach((row) => {
    ensure(getReferralChannel(row)).signups += 1;
  });

  return [...metrics.values()]
    .sort(
      (a, b) =>
        b.signups + b.visits - (a.signups + a.visits),
    )
    .slice(0, 8);
}

function createRecentReferrals(rows: AmbassadorReferralRow[]) {
  return rows.slice(0, 10).map<RecentReferral>((row, index) => {
    const type = normalizeReferralType(row.referral_type);
    const status = firstText(row.booking_status, row.status) || "Recorded";
    const location = [row.city, row.state]
      .map(asString)
      .filter(Boolean)
      .join(", ");

    return {
      id: asString(row.id) || `referral-${index}`,
      name:
        firstText(row.display_name, row.email) ||
        (type === "guru"
          ? "Future Guru"
          : type === "business"
            ? "Business Referral"
            : "Pet Parent"),
      type:
        type === "pet_parent"
          ? "Pet Parent"
          : type === "guru"
            ? "Guru"
            : type === "business"
              ? "Business"
              : titleCase(type),
      status: titleCase(status),
      channel: `${getChannelLabel(getReferralChannel(row))}${
        location ? ` • ${location}` : ""
      }`,
      date: formatDate(getReferralDate(row)),
    };
  });
}

function SummaryCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
            {title}
          </p>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            {value}
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {description}
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
          {icon}
        </div>
      </div>
    </article>
  );
}

function TrendChart({ points }: { points: TrendPoint[] }) {
  const maxValue = Math.max(
    1,
    ...points.flatMap((point) => [point.visits, point.signups]),
  );

  return (
    <section className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
            14-Day Activity
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
            Visits and verified signups
          </h2>
        </div>

        <div className="flex flex-wrap gap-3 text-xs font-black">
          <span className="inline-flex items-center gap-2 text-emerald-800">
            <span className="h-3 w-3 rounded-full bg-emerald-700" />
            Visits
          </span>
          <span className="inline-flex items-center gap-2 text-sky-800">
            <span className="h-3 w-3 rounded-full bg-sky-500" />
            Signups
          </span>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto pb-2">
        <div className="flex min-w-[760px] items-end gap-2">
          {points.map((point) => (
            <div
              key={point.key}
              className="flex min-w-0 flex-1 flex-col items-center"
            >
              <div className="flex h-44 w-full items-end justify-center gap-1 rounded-xl bg-slate-50 px-1 pt-3">
                <div
                  className="w-2.5 rounded-t-full bg-emerald-700"
                  style={{
                    height: `${Math.max(
                      point.visits > 0 ? 8 : 2,
                      Math.round((point.visits / maxValue) * 100),
                    )}%`,
                  }}
                  title={`${point.visits} visits`}
                />
                <div
                  className="w-2.5 rounded-t-full bg-sky-500"
                  style={{
                    height: `${Math.max(
                      point.signups > 0 ? 8 : 2,
                      Math.round((point.signups / maxValue) * 100),
                    )}%`,
                  }}
                  title={`${point.signups} signups`}
                />
              </div>
              <p className="mt-2 text-[9px] font-black text-slate-500">
                {point.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ChannelBreakdown({
  metrics,
}: {
  metrics: ChannelMetric[];
}) {
  const max = Math.max(
    1,
    ...metrics.map((metric) => metric.visits + metric.signups),
  );

  return (
    <section className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
          Channel Performance
        </p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
          Where activity comes from
        </h2>
      </div>

      {metrics.length > 0 ? (
        <div className="mt-5 grid gap-4">
          {metrics.map((metric) => {
            const total = metric.visits + metric.signups;
            const conversion =
              metric.visits > 0
                ? (metric.signups / metric.visits) * 100
                : 0;

            return (
              <article key={metric.key}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-950">
                      {metric.label}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      {metric.visits} visits • {metric.signups} signups
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                    {percent(conversion)}
                  </span>
                </div>

                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-700"
                    style={{
                      width: `${Math.max(
                        total > 0 ? 4 : 0,
                        Math.round((total / max) * 100),
                      )}%`,
                    }}
                  />
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="font-black text-slate-950">
            No channel activity yet
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Tracked visits and verified signups will appear after links or QR
            codes are used.
          </p>
        </div>
      )}
    </section>
  );
}

function RecentActivity({
  referrals,
}: {
  referrals: RecentReferral[];
}) {
  return (
    <section className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
            Verified Referrals
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
            Recent conversion activity
          </h2>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
          {referrals.length} shown
        </span>
      </div>

      {referrals.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {referrals.map((referral) => (
            <article
              key={referral.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-black text-slate-950">
                      {referral.name}
                    </p>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-emerald-700 ring-1 ring-emerald-100">
                      {referral.type}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-bold leading-5 text-slate-600">
                    {referral.channel}
                  </p>
                </div>

                <div className="shrink-0 sm:text-right">
                  <p className="text-xs font-black text-emerald-700">
                    {referral.status}
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {referral.date}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="font-black text-slate-950">
            No verified referrals yet
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            A click or QR scan is outreach activity. Verified referrals appear
            only after SitGuru records the qualifying signup.
          </p>
        </div>
      )}
    </section>
  );
}

export default async function AmbassadorReferralAnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(
      "/login?role=ambassador&next=/ambassador/dashboard/referrals/analytics",
    );
  }

  const ambassador = await getAmbassadorForUser(user.id, user.email);

  if (!ambassador?.id) {
    redirect("/login/route?preferred=ambassador");
  }

  const referralCode = asString(ambassador.referral_code);

  if (!referralCode) {
    redirect("/ambassador/dashboard?warning=referral_code_missing");
  }

  const data = await loadAnalyticsData({
    ambassadorId: ambassador.id,
    referralCode,
  });

  const linkVisits = data.clicks.filter((row) => {
    const landingPage = asString(row.landing_page).toLowerCase();
    const medium = normalize(row.utm_medium);
    return medium !== "qr" && !landingPage.includes("via=qr");
  }).length;

  const qrScans = data.clicks.length - linkVisits;
  const totalVisits = data.clicks.length;
  const totalSignups = data.referrals.length;

  const petParentSignups = data.referrals.filter(
    (row) => normalizeReferralType(row.referral_type) === "pet_parent",
  ).length;

  const guruSignups = data.referrals.filter(
    (row) => normalizeReferralType(row.referral_type) === "guru",
  ).length;

  const businessSignups = data.referrals.filter(
    (row) => normalizeReferralType(row.referral_type) === "business",
  ).length;

  const completedBookings = data.referrals.filter(isCompletedBooking).length;

  const visitConversion =
    totalVisits > 0 ? (totalSignups / totalVisits) * 100 : 0;

  const bookingConversion =
    totalSignups > 0 ? (completedBookings / totalSignups) * 100 : 0;

  const approvedRewards = data.rewards
    .filter((row) => getRewardBucket(row) === "approved")
    .reduce((sum, row) => sum + getRewardAmount(row), 0);

  const paidRewards = data.rewards
    .filter((row) => getRewardBucket(row) === "paid")
    .reduce((sum, row) => sum + getRewardAmount(row), 0);

  const trend = createTrend(data.clicks, data.referrals);
  const channels = createChannelMetrics(
    data.clicks,
    data.referrals,
  );
  const recent = createRecentReferrals(data.referrals);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f7fffb_42%,#edfdf5_100%)] px-3 py-4 text-slate-950 sm:px-5 lg:px-6">
      <div className="mx-auto max-w-[1500px] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/ambassador/dashboard/referrals"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Referral Center
          </Link>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/ambassador/dashboard/social"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800 transition hover:bg-emerald-100"
            >
              Social Media Hub
              <Share2 className="h-4 w-4" />
            </Link>
            <Link
              href="/ambassador/dashboard/commissions"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-800"
            >
              Rewards
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <section className="overflow-hidden rounded-[1.9rem] border border-emerald-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="grid gap-6 bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.96),transparent_20%),linear-gradient(120deg,#bbf7e1_0%,#ddf8ef_48%,#c9efff_100%)] px-6 py-7 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">
                Ambassador Referral Analytics
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.045em] text-slate-950 sm:text-5xl">
                See which outreach turns into verified growth.
              </h1>
              <p className="mt-4 max-w-4xl text-sm font-semibold leading-7 text-slate-800 sm:text-base">
                Track link visits, QR scans, verified Pet Parent and Guru
                signups, completed bookings, conversion rates, and canonical
                reward totals.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-xl bg-white/95 px-4 py-2 text-xs font-black text-slate-900 shadow-sm">
                  Code:{" "}
                  <span className="text-emerald-700">{referralCode}</span>
                </span>
                <span className="rounded-xl bg-white/95 px-4 py-2 text-xs font-black text-slate-900 shadow-sm">
                  {totalVisits} tracked visits
                </span>
                <span className="rounded-xl bg-white/95 px-4 py-2 text-xs font-black text-slate-900 shadow-sm">
                  {totalSignups} verified signups
                </span>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/70 bg-white/95 p-5 shadow-xl">
              <TrendingUp className="h-8 w-8 text-emerald-700" />
              <h2 className="mt-3 text-xl font-black text-slate-950">
                Conversion, not just clicks
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                Visits and scans show outreach. Verified signups and completed
                bookings show results. Rewards remain separate until SitGuru
                approves or records payment.
              </p>
            </div>
          </div>
        </section>

        {data.warning ? (
          <section className="rounded-[1.35rem] border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">
            {data.warning}
          </section>
        ) : null}

        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <SummaryCard
            title="Tracked Visits"
            value={String(totalVisits)}
            description={`${linkVisits} links • ${qrScans} QR scans`}
            icon={<MousePointerClick className="h-5 w-5" />}
          />
          <SummaryCard
            title="Verified Signups"
            value={String(totalSignups)}
            description={`${petParentSignups} Pet Parents • ${guruSignups} Gurus`}
            icon={<Users className="h-5 w-5" />}
          />
          <SummaryCard
            title="Visit Conversion"
            value={percent(visitConversion)}
            description="Verified signups divided by tracked visits"
            icon={<BarChart3 className="h-5 w-5" />}
          />
          <SummaryCard
            title="Completed Bookings"
            value={String(completedBookings)}
            description={`${percent(bookingConversion)} of verified referrals`}
            icon={<ClipboardCheck className="h-5 w-5" />}
          />
          <SummaryCard
            title="Approved"
            value={money(approvedRewards)}
            description="Approved or ready, not recorded as paid"
            icon={<BadgeCheck className="h-5 w-5" />}
          />
          <SummaryCard
            title="Paid"
            value={money(paidRewards)}
            description="Canonical rewards recorded as paid"
            icon={<DollarSign className="h-5 w-5" />}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.45fr_0.75fr]">
          <TrendChart points={trend} />
          <ChannelBreakdown metrics={channels} />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Pet Parents"
            value={String(petParentSignups)}
            description="Verified Pet Parent referrals"
            icon={<PawPrint className="h-5 w-5" />}
          />
          <SummaryCard
            title="Future Gurus"
            value={String(guruSignups)}
            description="Verified Guru applicants"
            icon={<UserRound className="h-5 w-5" />}
          />
          <SummaryCard
            title="Businesses"
            value={String(businessSignups)}
            description="Verified community or business referrals"
            icon={<ExternalLink className="h-5 w-5" />}
          />
          <SummaryCard
            title="QR Share"
            value={
              totalVisits > 0
                ? percent((qrScans / totalVisits) * 100)
                : "0.0%"
            }
            description="Share of tracked activity from QR scans"
            icon={<ScanLine className="h-5 w-5" />}
          />
        </section>

        <RecentActivity referrals={recent} />

        <section className="grid gap-4 md:grid-cols-3">
          <Link
            href="/ambassador/dashboard/referrals"
            className="group rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 transition hover:-translate-y-0.5 hover:bg-emerald-100"
          >
            <Link2 className="h-6 w-6 text-emerald-700" />
            <h2 className="mt-3 text-lg font-black text-emerald-950">
              Referral links and QR codes
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-emerald-900">
              Return to the Referral Center to share Pet Parent and Guru links.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-emerald-800">
              Open Referral Center
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </Link>

          <Link
            href="/ambassador/dashboard/social"
            className="group rounded-[1.5rem] border border-sky-200 bg-sky-50 p-5 transition hover:-translate-y-0.5 hover:bg-sky-100"
          >
            <QrCode className="h-6 w-6 text-sky-700" />
            <h2 className="mt-3 text-lg font-black text-sky-950">
              Social channel performance
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-sky-900">
              Review platform-specific links, QR codes, visits, and milestones.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-sky-800">
              Open Social Media Hub
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </Link>

          <Link
            href="/ambassador/dashboard/commissions"
            className="group rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 transition hover:-translate-y-0.5 hover:bg-amber-100"
          >
            <CheckCircle2 className="h-6 w-6 text-amber-700" />
            <h2 className="mt-3 text-lg font-black text-amber-950">
              Commissions and rewards
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-amber-900">
              Review pending, approved, ready-for-payout, and paid records.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-amber-800">
              Open Rewards
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </Link>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 rounded-[1.35rem] border border-slate-200 bg-white px-5 py-4 text-xs font-bold text-slate-600 shadow-sm">
          <span>
            Analytics are based on canonical SitGuru referral, click, and
            reward records.
          </span>
          <span className="inline-flex items-center gap-2 text-emerald-700">
            <CalendarDays className="h-4 w-4" />
            Live server-rendered totals
          </span>
        </footer>
      </div>
    </main>
  );
}