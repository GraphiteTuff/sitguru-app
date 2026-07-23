import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeDollarSign,
  CheckCircle2,
  Clock3,
  Filter,
  HandCoins,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SearchParamsShape = {
  q?: string;
  status?: string;
  category?: string;
};

type AmbassadorRecord = {
  id: string;
  user_id?: string | null;
  email?: string | null;
  contact_email?: string | null;
  login_email?: string | null;
  referral_code?: string | null;
  dashboard_enabled?: boolean | null;
  login_enabled?: boolean | null;
  status?: string | null;
  stripe_account_id?: string | null;
  stripe_connect_account_id?: string | null;
  stripe_onboarding_complete?: boolean | string | number | null;
  stripe_payouts_enabled?: boolean | string | number | null;
  payouts_enabled?: boolean | string | number | null;
};

type AmbassadorPayoutProvider =
  | "stripe"
  | "paypal"
  | "venmo"
  | "set_up_later";

type AmbassadorPayoutAccount = {
  provider?: "stripe" | "paypal" | "venmo" | null;
  providerAccountId?: string | null;
  providerEmail?: string | null;
  providerPhone?: string | null;
  onboardingStatus?: string | null;
  accountStatus?: string | null;
  payoutsEnabled?: boolean;
};

type AmbassadorPayoutSetup = {
  selectedProvider?: AmbassadorPayoutProvider;
  setupComplete?: boolean;
  readyAccount?: AmbassadorPayoutAccount | null;
};

type AmbassadorPayoutSetupResponse = {
  success: boolean;
  error?: string;
  setup?: AmbassadorPayoutSetup;
};

type RewardRow = Record<string, unknown>;
type ReferralRow = Record<string, unknown>;
type RewardBucket = "pending" | "approved" | "ready" | "paid" | "excluded";
type RewardCategory =
  | "commission"
  | "referral"
  | "social"
  | "partner"
  | "bonus"
  | "other";

type CommissionItem = {
  id: string;
  label: string;
  category: RewardCategory;
  categoryLabel: string;
  bucket: RewardBucket;
  status: string;
  amount: number;
  relatedName: string;
  sourceLabel: string;
  date: string;
  rawDate: string;
  note: string;
};

function normalizeBaseUrl(value?: string | null) {
  if (!value) return null;

  const candidate =
    value.startsWith("http://") || value.startsWith("https://")
      ? value
      : `https://${value}`;

  try {
    const parsed = new URL(candidate);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return parsed.origin;
  } catch {
    return null;
  }
}

function safeHostname(value?: string | null) {
  const normalized = normalizeBaseUrl(value);
  if (!normalized) return "";

  try {
    return new URL(normalized).hostname.toLowerCase();
  } catch {
    return "";
  }
}

async function getSharedApiOrigin() {
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const host = forwardedHost || requestHeaders.get("host") || "";
  const hostname = (host.split(":")[0] || "").toLowerCase();

  const configuredVercelHost = safeHostname(process.env.VERCEL_URL);
  const isKnownLocalHost =
    hostname === "localhost" || hostname === "127.0.0.1";
  const isSitGuruHost =
    hostname === "sitguru.com" ||
    hostname === "www.sitguru.com" ||
    hostname.endsWith(".sitguru.com");
  const isCurrentVercelDeployment =
    Boolean(configuredVercelHost) && hostname === configuredVercelHost;

  if (host && (isKnownLocalHost || isSitGuruHost || isCurrentVercelDeployment)) {
    const forwardedProto = requestHeaders
      .get("x-forwarded-proto")
      ?.split(",")[0]
      ?.trim();
    const protocol =
      forwardedProto || (isKnownLocalHost ? "http" : "https");

    return `${protocol}://${host}`;
  }

  return (
    normalizeBaseUrl(process.env.VERCEL_URL) ||
    normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL) ||
    normalizeBaseUrl(process.env.SITE_URL) ||
    "https://www.sitguru.com"
  );
}

async function getAmbassadorPayoutSetup(accessToken: string) {
  try {
    const origin = await getSharedApiOrigin();
    const response = await fetch(
      `${origin}/api/payouts/setup?role=ambassador`,
      {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const responseText = await response.text();
    let payload: AmbassadorPayoutSetupResponse | null = null;

    try {
      payload = responseText
        ? (JSON.parse(responseText) as AmbassadorPayoutSetupResponse)
        : null;
    } catch {
      console.error("Ambassador commissions payout setup returned non-JSON:", {
        status: response.status,
        contentType: response.headers.get("content-type"),
        responseText: responseText.slice(0, 1000),
      });
    }

    if (!payload || !response.ok || !payload.success) {
      return {
        setup: null,
        warning:
          payload?.error ||
          "Your payout setup could not be loaded right now.",
      };
    }

    return {
      setup: payload.setup || null,
      warning: "",
    };
  } catch (error) {
    console.error("Ambassador commissions payout setup failed:", error);

    return {
      setup: null,
      warning: "Your payout setup could not be loaded right now.",
    };
  }
}

function payoutMethodDetails(setup: AmbassadorPayoutSetup | null) {
  const provider =
    setup?.readyAccount?.provider ||
    setup?.selectedProvider ||
    "set_up_later";

  if (provider === "stripe") {
    return {
      label: "Bank or debit card",
      shortLabel: "Bank or card",
      logoPath: "/images/payments/stripe.svg",
      detail:
        setup?.readyAccount?.providerAccountId ||
        "Powered securely by Stripe",
    };
  }

  if (provider === "paypal") {
    return {
      label: "PayPal",
      shortLabel: "PayPal",
      logoPath: "/images/payments/paypal.svg",
      detail:
        setup?.readyAccount?.providerEmail ||
        "Use the PayPal account you already have",
    };
  }

  if (provider === "venmo") {
    return {
      label: "Venmo",
      shortLabel: "Venmo",
      logoPath: "/images/payments/venmo.svg",
      detail:
        setup?.readyAccount?.providerPhone ||
        setup?.readyAccount?.providerEmail ||
        "Connect an eligible U.S. mobile number",
    };
  }

  return {
    label: "Not picked yet",
    shortLabel: "Pick a payout",
    logoPath: "/images/payments/stripe.svg",
    detail: "Choose bank or card, PayPal, or Venmo",
  };
}

function asString(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function asNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,%\s,()]/g, ""));
    return Number.isFinite(parsed)
      ? value.includes("(")
        ? -parsed
        : parsed
      : 0;
  }
  return 0;
}

function asBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  return [
    "true",
    "yes",
    "ready",
    "enabled",
    "complete",
    "completed",
    "active",
  ].includes(asString(value).toLowerCase());
}

function firstString(row: Record<string, unknown> | undefined, keys: string[]) {
  if (!row) return "";
  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }
  return "";
}

function firstNumber(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = asNumber(row[key]);
    if (value !== 0) return value;
  }
  return 0;
}

function normalizeStatus(value: unknown) {
  return asString(value)
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number.isFinite(value) ? value : 0);
}

function formatDate(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getBucket(row: RewardRow): RewardBucket {
  const status = normalizeStatus(row.status);
  const payoutStatus = normalizeStatus(row.payout_status);

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
  if (excluded.has(status) || excluded.has(payoutStatus)) return "excluded";

  const paid = new Set([
    "paid",
    "payout paid",
    "payout completed",
    "settled",
  ]);
  if (
    firstString(row, ["paid_at"]) ||
    paid.has(status) ||
    paid.has(payoutStatus)
  ) {
    return "paid";
  }

  const ready = new Set([
    "ready for payout",
    "queued for payout",
    "queued",
  ]);
  if (ready.has(status) || ready.has(payoutStatus)) return "ready";

  const approved = new Set([
    "approved",
    "approved unpaid",
    "payable",
  ]);
  if (approved.has(status) || approved.has(payoutStatus)) return "approved";

  return "pending";
}

function getCategory(row: RewardRow): RewardCategory {
  const text = [
    row.reward_type,
    row.reward_source,
    row.source,
    row.category,
  ]
    .map(normalizeStatus)
    .join(" ");

  if (
    text.includes("commission") ||
    text.includes("booking share") ||
    text.includes("revenue share")
  ) {
    return "commission";
  }
  if (text.includes("social")) return "social";
  if (
    text.includes("partner") ||
    text.includes("business") ||
    text.includes("activation")
  ) {
    return "partner";
  }
  if (
    text.includes("bonus") ||
    text.includes("milestone") ||
    text.includes("incentive")
  ) {
    return "bonus";
  }
  if (
    text.includes("referral") ||
    text.includes("pet parent") ||
    text.includes("guru")
  ) {
    return "referral";
  }
  return "other";
}

function getCategoryLabel(category: RewardCategory) {
  if (category === "commission") return "Commission";
  if (category === "referral") return "Referral Reward";
  if (category === "social") return "Social Reward";
  if (category === "partner") return "Partner Reward";
  if (category === "bonus") return "Bonus";
  return "Other Reward";
}

function getStatusLabel(row: RewardRow, bucket: RewardBucket) {
  const saved = normalizeStatus(
    firstString(row, ["payout_status", "status"]),
  );
  if (saved) return titleCase(saved);
  if (bucket === "paid") return "Paid";
  if (bucket === "ready") return "Ready for Payout";
  if (bucket === "approved") return "Approved";
  if (bucket === "excluded") return "Not Eligible";
  return "Pending Review";
}

function getRewardDate(row: RewardRow, bucket: RewardBucket) {
  if (bucket === "paid") {
    return firstString(row, [
      "paid_at",
      "approved_at",
      "earned_at",
      "created_at",
      "updated_at",
    ]);
  }
  if (bucket === "approved" || bucket === "ready") {
    return firstString(row, [
      "approved_at",
      "earned_at",
      "created_at",
      "updated_at",
    ]);
  }
  return firstString(row, [
    "earned_at",
    "created_at",
    "updated_at",
  ]);
}

function getNote(row: RewardRow, bucket: RewardBucket) {
  const saved = firstString(row, ["notes", "admin_notes"]);
  if (saved) return saved;
  if (bucket === "paid") return "SitGuru recorded this as paid.";
  if (bucket === "ready") return "Approved and queued for payout.";
  if (bucket === "approved") {
    return "Approved but not yet recorded as paid.";
  }
  if (bucket === "excluded") {
    return "Canceled, refunded, rejected, reversed, or ineligible.";
  }
  return "Under review and not confirmed earnings yet.";
}

function buildReferralMap(rows: ReferralRow[]) {
  const map = new Map<string, ReferralRow>();
  rows.forEach((row) => {
    const id = firstString(row, ["id"]);
    if (id && !map.has(id)) map.set(id, row);
  });
  return map;
}

function normalizeItems(rewards: RewardRow[], referrals: ReferralRow[]) {
  const referralMap = buildReferralMap(referrals);

  return rewards
    .map((row, index) => {
      const bucket = getBucket(row);
      const category = getCategory(row);
      const referral = referralMap.get(firstString(row, ["referral_id"]));
      const rawDate = getRewardDate(row, bucket);
      const savedLabel = firstString(row, [
        "reward_name",
        "title",
        "label",
        "description",
        "reward_type",
        "reward_source",
        "source",
      ]);

      return {
        id: firstString(row, ["id"]) || `reward-${index}`,
        label: savedLabel
          ? titleCase(savedLabel.replace(/[_-]+/g, " "))
          : getCategoryLabel(category),
        category,
        categoryLabel: getCategoryLabel(category),
        bucket,
        status: getStatusLabel(row, bucket),
        amount: firstNumber(row, [
          "amount",
          "reward_amount",
          "payout_amount",
          "commission_amount",
        ]),
        relatedName:
          firstString(row, [
            "related_name",
            "recipient_name",
            "referred_name",
            "customer_name",
            "guru_name",
            "partner_name",
            "business_name",
            "email",
          ]) ||
          firstString(referral, [
            "display_name",
            "business_name",
            "email",
          ]) ||
          "SitGuru verified activity",
        sourceLabel:
          firstString(referral, [
            "platform",
            "source",
            "medium",
            "campaign",
          ]) ||
          firstString(row, [
            "referral_code",
            "booking_id",
            "reward_source",
            "source",
          ]) ||
          "SitGuru",
        date: formatDate(rawDate),
        rawDate,
        note: getNote(row, bucket),
      } satisfies CommissionItem;
    })
    .sort((a, b) => {
      const aTime = new Date(a.rawDate).getTime();
      const bTime = new Date(b.rawDate).getTime();
      return (
        (Number.isNaN(bTime) ? 0 : bTime) -
        (Number.isNaN(aTime) ? 0 : aTime)
      );
    });
}

async function getAmbassadorForUser(userId: string, email?: string | null) {
  const { data: byUserId } = await supabaseAdmin
    .from("ambassadors")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  let ambassador = byUserId as AmbassadorRecord | null;
  const cleanEmail = asString(email).toLowerCase();

  if (!ambassador && cleanEmail) {
    for (const column of ["login_email", "contact_email", "email"] as const) {
      const { data } = await supabaseAdmin
        .from("ambassadors")
        .select("*")
        .eq(column, cleanEmail)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        ambassador = data as AmbassadorRecord;
        break;
      }
    }
  }

  if (!ambassador) return null;

  const status = normalizeStatus(ambassador.status);
  const allowed =
    ambassador.dashboard_enabled === true &&
    ambassador.login_enabled === true &&
    !["archived", "inactive", "not a fit"].includes(status);

  return allowed ? ambassador : null;
}

async function loadCommissionData(ambassadorId: string) {
  const [rewards, referrals] = await Promise.all([
    supabaseAdmin
      .from("ambassador_rewards")
      .select("*")
      .eq("ambassador_id", ambassadorId)
      .order("created_at", { ascending: false })
      .limit(1000),
    supabaseAdmin
      .from("ambassador_referrals")
      .select("*")
      .eq("ambassador_id", ambassadorId)
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);

  const warnings: string[] = [];
  if (rewards.error) warnings.push("Commission records could not be loaded.");
  if (referrals.error) warnings.push("Referral context could not be loaded.");

  return {
    items: normalizeItems(
      (rewards.data || []) as RewardRow[],
      (referrals.data || []) as ReferralRow[],
    ),
    warning: warnings.join(" "),
  };
}

function filterItems(items: CommissionItem[], params: SearchParamsShape) {
  const q = asString(params.q).toLowerCase();
  const status = asString(params.status).toLowerCase();
  const category = asString(params.category).toLowerCase();

  return items.filter((item) => {
    const searchable = [
      item.label,
      item.categoryLabel,
      item.status,
      item.relatedName,
      item.sourceLabel,
      item.note,
    ]
      .join(" ")
      .toLowerCase();

    return (
      (!q || searchable.includes(q)) &&
      (!status || status === "all" || item.bucket === status) &&
      (!category || category === "all" || item.category === category)
    );
  });
}

function statusClasses(bucket: RewardBucket) {
  if (bucket === "paid") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (bucket === "ready") {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }
  if (bucket === "approved") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }
  if (bucket === "excluded") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function StatCard({
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
    <div className="min-w-[220px] snap-start rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-sm sm:min-w-0 sm:rounded-[1.5rem] sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-slate-800">{title}</p>
          <p className="mt-3 text-2xl font-black text-slate-950">{value}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
            {description}
          </p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default async function AmbassadorCommissionsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParamsShape>;
}) {
  const params = (await searchParams) || {};
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const loginParams = new URLSearchParams({
      mode: "phone",
      role: "ambassador",
      next: "/ambassador/dashboard/commissions",
    });
    redirect(`/login?${loginParams.toString()}`);
  }

  const ambassador = await getAmbassadorForUser(user.id, user.email);
  if (!ambassador?.id) redirect("/login/route?preferred=ambassador");

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const [data, payoutResult] = await Promise.all([
    loadCommissionData(ambassador.id),
    session?.access_token
      ? getAmbassadorPayoutSetup(session.access_token)
      : Promise.resolve({
          setup: null,
          warning: "Sign in again to review your payout setup.",
        }),
  ]);

  const payoutSetup = payoutResult.setup;
  const payoutReady = Boolean(payoutSetup?.setupComplete);
  const payoutMethod = payoutMethodDetails(payoutSetup);
  const visibleItems = filterItems(data.items, params);

  const totalByBucket = (bucket: RewardBucket) =>
    data.items
      .filter((item) => item.bucket === bucket)
      .reduce((sum, item) => sum + item.amount, 0);

  const pendingAmount = totalByBucket("pending");
  const approvedAmount = totalByBucket("approved");
  const readyAmount = totalByBucket("ready");
  const paidAmount = totalByBucket("paid");
  const confirmedAmount = approvedAmount + readyAmount + paidAmount;
  const excludedCount = data.items.filter(
    (item) => item.bucket === "excluded",
  ).length;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_42%,#ecfdf5_100%)] px-3 py-4 text-slate-950 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <Link
          href="/ambassador/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="grid gap-6 bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.95),transparent_18%),linear-gradient(120deg,#b9f8df_0%,#d9f8ef_48%,#bde9ff_100%)] px-4 py-6 sm:px-8 sm:py-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-center xl:px-10">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800 sm:text-sm sm:tracking-[0.26em]">
                Your Rewards
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950 sm:mt-4 sm:text-5xl md:text-6xl">
                See what you earned.
              </h1>
              <p className="mt-4 max-w-4xl text-sm font-semibold leading-6 text-slate-800 sm:mt-5 sm:text-base sm:leading-8 md:text-lg">
                Track every verified reward, see what&apos;s ready, and know
                what&apos;s already paid.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-white/70 bg-white/95 p-5 shadow-xl sm:rounded-[2rem] sm:p-7">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 p-2 ring-1 ring-emerald-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={payoutMethod.logoPath}
                    alt={payoutMethod.label}
                    className="max-h-7 max-w-[76px] object-contain"
                  />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
                    Get paid
                  </p>
                  <h2 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">
                    {payoutReady
                      ? "You’re ready to get paid"
                      : "Pick how you get paid"}
                  </h2>
                </div>
              </div>

              <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                {payoutReady
                  ? `${payoutMethod.label} · ${payoutMethod.detail}`
                  : "Choose bank or card, PayPal, or Venmo. You can switch later."}
              </p>

              <Link
                href="/ambassador/dashboard/payouts"
                className="mt-4 inline-flex min-h-[50px] w-full items-center justify-center rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800 sm:w-auto"
              >
                {payoutReady ? "Manage payout" : "Pick a payout"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {data.warning || payoutResult.warning ? (
          <section className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
            <AlertTriangle className="mr-2 inline h-5 w-5" />
            {[data.warning, payoutResult.warning].filter(Boolean).join(" ")}
          </section>
        ) : null}

        <section
          aria-label="Reward totals"
          className="-mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-5"
        >
          <StatCard title="Pending" value={money(pendingAmount)} description="Still being checked" icon={<Clock3 className="h-6 w-6" />} />
          <StatCard title="Approved" value={money(approvedAmount)} description="Approved, not queued yet" icon={<BadgeDollarSign className="h-6 w-6" />} />
          <StatCard title="Ready to Pay" value={money(readyAmount)} description="Queued for payment" icon={<HandCoins className="h-6 w-6" />} />
          <StatCard title="Paid" value={money(paidAmount)} description="Rewards already sent" icon={<CheckCircle2 className="h-6 w-6" />} />
          <StatCard title="Total Earned" value={money(confirmedAmount)} description="Approved, ready, and paid" icon={<Sparkles className="h-6 w-6" />} />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_0.36fr]">
          <form
            action="/ambassador/dashboard/commissions"
            className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6"
          >
            <div className="flex items-center gap-3">
              <Filter className="h-6 w-6 text-emerald-700" />
              <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                Search your rewards
              </h2>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-[1.3fr_0.7fr_0.7fr_auto]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="q"
                  defaultValue={params.q || ""}
                  placeholder="Search rewards..."
                  className="h-12 w-full rounded-2xl border border-slate-200 pl-11 pr-4 text-sm font-semibold outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"
                />
              </label>

              <select
                name="status"
                defaultValue={params.status || "all"}
                className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-bold"
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="ready">Ready</option>
                <option value="paid">Paid</option>
                <option value="excluded">Excluded</option>
              </select>

              <select
                name="category"
                defaultValue={params.category || "all"}
                className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-bold"
              >
                <option value="all">All types</option>
                <option value="commission">Commissions</option>
                <option value="referral">Referrals</option>
                <option value="social">Social</option>
                <option value="partner">Partners</option>
                <option value="bonus">Bonuses</option>
                <option value="other">Other</option>
              </select>

              <button
                type="submit"
                className="h-12 touch-manipulation rounded-2xl bg-emerald-700 px-5 text-sm font-black text-white transition hover:bg-emerald-800 active:scale-[0.99]"
              >
                Show rewards
              </button>
            </div>
          </form>

          <section className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
            <ShieldCheck className="h-7 w-7 text-emerald-700" />
            <h2 className="mt-3 text-xl font-black text-emerald-950">
              Just your rewards
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-emerald-900">
              You only see rewards connected to your Ambassador account.
            </p>
          </section>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">
                Reward activity
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">
                {visibleItems.length} reward
                {visibleItems.length === 1 ? "" : "s"}
              </h2>
            </div>
            <Link
              href="/ambassador/dashboard/earnings"
              className="inline-flex items-center text-sm font-black text-emerald-700"
            >
              View earnings
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          {visibleItems.length > 0 ? (
            <div className="grid gap-4">
              {visibleItems.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[1.3rem] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[1.4rem] sm:p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">
                          {item.categoryLabel}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${statusClasses(
                            item.bucket,
                          )}`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <h3 className="mt-3 text-xl font-black text-slate-950">
                        {item.label}
                      </h3>
                      <p className="mt-2 text-sm font-semibold text-slate-600">
                        {item.relatedName}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {item.date} · {item.sourceLabel}
                      </p>
                      <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                        {item.note}
                      </p>
                    </div>
                    <p className="shrink-0 text-3xl font-black text-emerald-700">
                      {money(item.amount)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-xl font-black text-slate-950">
                No rewards found
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                Try a different search or check back after your next verified
                reward.
              </p>
            </div>
          )}
        </section>

        {excludedCount > 0 ? (
          <section className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6">
            <div className="flex items-start gap-3">
              <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-rose-700" />
              <p className="text-sm font-semibold leading-6 text-rose-900">
                {excludedCount} excluded record
                {excludedCount === 1 ? " is" : "s are"} not included in
                confirmed earnings.
              </p>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}