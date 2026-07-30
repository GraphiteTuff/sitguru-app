import type { ReactNode } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  CalendarDays,
  CheckCircle2,
  Clock3,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  Trophy,
  Wallet,
  XCircle,
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
  stripe_account_id?: string | null;
  stripe_connect_account_id?: string | null;
  stripe_account_status?: string | null;
  stripe_onboarding_complete?: boolean | string | number | null;
  stripe_payouts_enabled?: boolean | string | number | null;
  payouts_enabled?: boolean | string | number | null;
  charges_enabled?: boolean | string | number | null;
};

type RewardRow = {
  id: string;
  ambassador_id?: string | null;
  referral_id?: string | null;
  referral_code?: string | null;
  reward_type?: string | null;
  reward_source?: string | null;
  source?: string | null;
  amount?: number | string | null;
  reward_amount?: number | string | null;
  payout_amount?: number | string | null;
  status?: string | null;
  payout_status?: string | null;
  notes?: string | null;
  admin_notes?: string | null;
  earned_at?: string | null;
  approved_at?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type RewardBucket = "pending" | "approved" | "paid" | "excluded";

type NormalizedReward = {
  id: string;
  rewardType: string;
  source: string;
  amount: number;
  status: string;
  bucket: RewardBucket;
  date: string;
  rawDate: string;
  note: string;
};

type RewardsResult = {
  rows: RewardRow[];
  warning: string;
};

type AmbassadorPayoutProvider = "stripe" | "paypal" | "venmo" | "set_up_later";

type AmbassadorPayoutAccount = {
  provider?: "stripe" | "paypal" | "venmo" | null;
  providerAccountId?: string | null;
  providerEmail?: string | null;
  providerPhone?: string | null;
  onboardingStatus?: string | null;
  accountStatus?: string | null;
  payoutsEnabled?: boolean;
  isDefault?: boolean;
  isLive?: boolean;
  verifiedAt?: string | null;
  updatedAt?: string | null;
};

type AmbassadorPayoutSetup = {
  selectedProvider?: AmbassadorPayoutProvider;
  setupComplete?: boolean;
  nextAction?: string | null;
  accounts?: AmbassadorPayoutAccount[];
  readyAccount?: AmbassadorPayoutAccount | null;
  blockers?: {
    receiveRewardPayout?: boolean;
  };
};

type AmbassadorPayoutSetupResponse = {
  success: boolean;
  message?: string;
  error?: string;
  setup?: AmbassadorPayoutSetup;
};

type EarningsPageSearchParams = Record<
  string,
  string | string[] | undefined
>;

type AmbassadorDashboardEarningsPageProps = {
  searchParams?:
    | EarningsPageSearchParams
    | Promise<EarningsPageSearchParams>;
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

async function callAmbassadorPayoutSetupApi({
  accessToken,
  method = "GET",
  provider,
}: {
  accessToken: string;
  method?: "GET" | "PATCH";
  provider?: AmbassadorPayoutProvider;
}): Promise<AmbassadorPayoutSetupResponse> {
  try {
    const origin = await getSharedApiOrigin();
    const response = await fetch(
      `${origin}/api/payouts/setup?role=ambassador`,
      {
        method,
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...(method === "PATCH"
            ? { "Content-Type": "application/json" }
            : {}),
        },
        body:
          method === "PATCH"
            ? JSON.stringify({
                role: "ambassador",
                preferredProvider: provider,
              })
            : undefined,
      },
    );

    const responseText = await response.text();
    let payload: AmbassadorPayoutSetupResponse | null = null;

    try {
      payload = responseText
        ? (JSON.parse(responseText) as AmbassadorPayoutSetupResponse)
        : null;
    } catch {
      console.error("Ambassador payout setup returned non-JSON data:", {
        status: response.status,
        contentType: response.headers.get("content-type"),
        responseText: responseText.slice(0, 1000),
      });
    }

    if (!payload) {
      return {
        success: false,
        error:
          response.status >= 500
            ? "Reward payout setup is temporarily unavailable. Please try again."
            : "SitGuru could not read your reward payout setup.",
      };
    }

    if (!response.ok || !payload.success) {
      return {
        ...payload,
        success: false,
        error:
          payload.error ||
          "SitGuru could not update your reward payout setup.",
      };
    }

    return payload;
  } catch (error) {
    console.error("Ambassador payout setup request failed:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "SitGuru could not connect to reward payout setup.",
    };
  }
}

function asString(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
}

function asNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

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
  }).format(Number.isFinite(value) ? value : 0);
}

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function startOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function normalizeStatus(value?: string | null) {
  return asString(value)
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getRewardBucket(row: RewardRow): RewardBucket {
  const status = normalizeStatus(row.status || row.payout_status);

  if (
    status.includes("reject") ||
    status.includes("ineligible") ||
    status.includes("void") ||
    status.includes("cancel") ||
    status.includes("refund") ||
    status.includes("chargeback")
  ) {
    return "excluded";
  }

  if (
    status.includes("paid") ||
    status.includes("completed payout") ||
    Boolean(asString(row.paid_at))
  ) {
    return "paid";
  }

  if (
    status.includes("approved") ||
    status.includes("ready for payout") ||
    status.includes("payable")
  ) {
    return "approved";
  }

  return "pending";
}

function getRewardAmount(row: RewardRow) {
  return roundMoney(
    asNumber(row.amount) ||
      asNumber(row.reward_amount) ||
      asNumber(row.payout_amount),
  );
}

function getRewardDate(row: RewardRow, bucket: RewardBucket) {
  if (bucket === "paid") {
    return (
      asString(row.paid_at) ||
      asString(row.approved_at) ||
      asString(row.earned_at) ||
      asString(row.created_at) ||
      asString(row.updated_at)
    );
  }

  if (bucket === "approved") {
    return (
      asString(row.approved_at) ||
      asString(row.earned_at) ||
      asString(row.created_at) ||
      asString(row.updated_at)
    );
  }

  return (
    asString(row.earned_at) ||
    asString(row.created_at) ||
    asString(row.updated_at)
  );
}

function getRewardStatus(row: RewardRow, bucket: RewardBucket) {
  const rawStatus = normalizeStatus(row.status || row.payout_status);

  if (rawStatus) return titleCase(rawStatus);
  if (bucket === "paid") return "Paid";
  if (bucket === "approved") return "Approved";
  if (bucket === "excluded") return "Not Eligible";

  return "Pending Review";
}

function getRewardType(row: RewardRow) {
  const rawType = asString(
    row.reward_type || row.reward_source || row.source,
  )
    .replace(/[_-]+/g, " ")
    .trim();

  return rawType ? titleCase(rawType) : "Ambassador Reward";
}

function getRewardSource(row: RewardRow) {
  return (
    asString(row.referral_code) ||
    asString(row.referral_id) ||
    asString(row.reward_source) ||
    asString(row.source) ||
    "SitGuru verified activity"
  );
}

function getRewardNote(row: RewardRow, bucket: RewardBucket) {
  const savedNote = asString(row.notes || row.admin_notes);
  if (savedNote) return savedNote;

  if (bucket === "pending") {
    return "Waiting for SitGuru review. This amount is not approved or payable yet.";
  }

  if (bucket === "approved") {
    return "Approved by SitGuru and waiting for payout processing.";
  }

  if (bucket === "paid") {
    return "Paid reward recorded by SitGuru.";
  }

  return "This reward was excluded, canceled, refunded, or marked ineligible.";
}

function normalizeRewards(rows: RewardRow[]) {
  return rows
    .map((row) => {
      const bucket = getRewardBucket(row);
      const rawDate = getRewardDate(row, bucket);

      return {
        id: asString(row.id),
        rewardType: getRewardType(row),
        source: getRewardSource(row),
        amount: getRewardAmount(row),
        status: getRewardStatus(row, bucket),
        bucket,
        date: formatDate(rawDate),
        rawDate,
        note: getRewardNote(row, bucket),
      } satisfies NormalizedReward;
    })
    .filter((reward) => Boolean(reward.id))
    .sort((a, b) => {
      const aDate = new Date(a.rawDate).getTime();
      const bDate = new Date(b.rawDate).getTime();

      return (
        (Number.isNaN(bDate) ? 0 : bDate) -
        (Number.isNaN(aDate) ? 0 : aDate)
      );
    });
}

async function getAmbassadorForUser(userId: string, email?: string | null) {
  const { data: byUserId, error: userIdError } = await supabaseAdmin
    .from("ambassadors")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (userIdError) {
    console.error(
      "Ambassador earnings lookup by user ID failed:",
      userIdError.message,
    );
  }

  let ambassador = byUserId as AmbassadorRecord | null;
  const cleanEmail = asString(email).toLowerCase();

  if (!ambassador && cleanEmail) {
    const emailColumns = ["login_email", "contact_email", "email"] as const;

    for (const column of emailColumns) {
      const { data, error } = await supabaseAdmin
        .from("ambassadors")
        .select("*")
        .eq(column, cleanEmail)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error(
          `Ambassador earnings lookup by ${column} failed:`,
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

  const status = normalizeStatus(ambassador.status);
  const workspaceAllowed =
    ambassador.dashboard_enabled === true &&
    ambassador.login_enabled === true &&
    status !== "archived" &&
    status !== "inactive" &&
    status !== "not a fit";

  return workspaceAllowed ? ambassador : null;
}

async function getCanonicalAmbassadorRewards(
  ambassadorId: string,
): Promise<RewardsResult> {
  const { data, error } = await supabaseAdmin
    .from("ambassador_rewards")
    .select("*")
    .eq("ambassador_id", ambassadorId)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    console.error(
      "Unable to load canonical Ambassador rewards:",
      error.message,
    );

    return {
      rows: [],
      warning:
        "SitGuru could not load your canonical reward records right now. No earnings totals are being estimated or substituted.",
    };
  }

  return {
    rows: (data || []) as RewardRow[],
    warning: "",
  };
}

function statusClasses(bucket: RewardBucket) {
  if (bucket === "paid") {
    return "border-emerald-200 bg-emerald-50 !text-emerald-700";
  }

  if (bucket === "approved") {
    return "border-sky-200 bg-sky-50 !text-sky-700";
  }

  if (bucket === "excluded") {
    return "border-rose-200 bg-rose-50 !text-rose-700";
  }

  return "border-amber-200 bg-amber-50 !text-amber-700";
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
  icon: ReactNode;
}) {
  return (
    <div className="min-w-[220px] snap-start rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:min-w-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black !text-slate-800">{title}</p>
          <p className="mt-3 text-2xl font-black tracking-tight !text-slate-950">
            {value}
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 !text-slate-700">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 !text-emerald-700 ring-1 ring-emerald-100">
          {icon}
        </div>
      </div>
    </div>
  );
}

function RewardStatusBadge({
  reward,
}: {
  reward: NormalizedReward;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusClasses(
        reward.bucket,
      )}`}
    >
      {reward.status}
    </span>
  );
}

function RewardCard({
  reward,
}: {
  reward: NormalizedReward;
}) {
  return (
    <article className="rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-black !text-slate-950">
            {reward.rewardType}
          </p>
          <p className="mt-1 break-words text-xs font-semibold !text-slate-500">
            {reward.date} · {reward.source}
          </p>
        </div>

        <RewardStatusBadge reward={reward} />
      </div>

      <p className="mt-4 text-2xl font-black !text-emerald-700">
        {money(reward.amount)}
      </p>

      <p className="mt-2 text-sm font-semibold leading-6 !text-slate-700">
        {reward.note}
      </p>
    </article>
  );
}

function RewardGroup({
  title,
  description,
  total,
  rewards,
  emptyMessage,
  icon,
}: {
  title: string;
  description: string;
  total: number;
  rewards: NormalizedReward[];
  emptyMessage: string;
  icon: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
            {icon}
          </div>

          <div>
            <h2 className="text-xl font-black !text-slate-950">{title}</h2>
            <p className="mt-1 text-sm font-semibold leading-6 !text-slate-700">
              {description}
            </p>
          </div>
        </div>

        <div className="shrink-0 text-left sm:text-right">
          <p className="text-2xl font-black !text-slate-950">
            {money(total)}
          </p>
          <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] !text-slate-500">
            {rewards.length} reward{rewards.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {rewards.length > 0 ? (
        <div className="mt-5 grid gap-4">
          {rewards.map((reward) => (
            <RewardCard key={reward.id} reward={reward} />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="text-sm font-bold leading-6 !text-slate-700">
            {emptyMessage}
          </p>
        </div>
      )}
    </section>
  );
}

type PayoutVisualStatus = "ready" | "pending" | "attention" | "not_set";

function normalizePayoutProvider(
  value: unknown,
): AmbassadorPayoutProvider | null {
  const normalized = asString(value).toLowerCase();

  if (
    normalized === "stripe" ||
    normalized === "paypal" ||
    normalized === "venmo" ||
    normalized === "set_up_later"
  ) {
    return normalized;
  }

  return null;
}

function payoutProviderDetails(
  provider: Exclude<AmbassadorPayoutProvider, "set_up_later">,
  account?: AmbassadorPayoutAccount | null,
) {
  if (provider === "stripe") {
    return {
      label: "Bank or card",
      logoPath: "/images/payments/stripe.svg",
      destination:
        account?.providerAccountId || "Connected securely through Stripe",
    };
  }

  if (provider === "venmo") {
    return {
      label: "Venmo",
      logoPath: "/images/payments/venmo.svg",
      destination:
        account?.providerPhone ||
        account?.providerEmail ||
        "U.S. mobile number saved",
    };
  }

  return {
    label: "PayPal",
    logoPath: "/images/payments/paypal.svg",
    destination:
      account?.providerEmail ||
      account?.providerPhone ||
      "PayPal email saved",
  };
}

function getCurrentPayoutAccount(
  setup: AmbassadorPayoutSetup | null,
  provider: AmbassadorPayoutProvider,
) {
  if (provider === "set_up_later") return null;

  const matchingAccounts = (setup?.accounts || []).filter(
    (account) => account.provider === provider,
  );

  return (
    matchingAccounts.find((account) => account.isDefault === true) ||
    matchingAccounts.find((account) => account.payoutsEnabled === true) ||
    matchingAccounts[0] ||
    (setup?.readyAccount?.provider === provider ? setup.readyAccount : null)
  );
}

function getPayoutVisualStatus({
  provider,
  account,
  loadError,
}: {
  provider: AmbassadorPayoutProvider;
  account: AmbassadorPayoutAccount | null;
  loadError?: string | null;
}): {
  state: PayoutVisualStatus;
  badge: string;
  headline: string;
  description: string;
} {
  if (loadError) {
    return {
      state: "attention",
      badge: "Needs attention",
      headline: "Payout status unavailable",
      description: "Open payout settings and try again.",
    };
  }

  if (provider === "set_up_later") {
    return {
      state: "not_set",
      badge: "Not set up",
      headline: "Choose how you get paid",
      description:
        "Pick bank or card, PayPal, or Venmo before your first reward is sent.",
    };
  }

  const onboardingStatus = normalizeStatus(account?.onboardingStatus);
  const accountStatus = normalizeStatus(account?.accountStatus);
  const needsAttention =
    ["restricted", "disabled", "disconnected", "failed", "rejected"].some(
      (status) =>
        onboardingStatus.includes(status) || accountStatus.includes(status),
    );

  if (needsAttention) {
    return {
      state: "attention",
      badge: "Needs attention",
      headline: "Update your payout method",
      description:
        "Open payout settings to finish the steps needed before a reward can be sent.",
    };
  }

  const ready =
    account?.payoutsEnabled === true ||
    ["ready", "verified", "complete", "completed"].some(
      (status) =>
        onboardingStatus === status || accountStatus === status,
    );

  if (ready) {
    return {
      state: "ready",
      badge: "Ready",
      headline: "Connected and ready",
      description: "Approved rewards can be sent to this payout method.",
    };
  }

  if (account) {
    return {
      state: "pending",
      badge: "Connected",
      headline: "Verification pending",
      description:
        "Your payout method is saved. SitGuru will verify it before your first payout.",
    };
  }

  return {
    state: "attention",
    badge: "Finish setup",
    headline: "Payout method selected",
    description:
      "Finish connecting this payout method before your first reward is sent.",
  };
}

function payoutCardClasses(state: PayoutVisualStatus) {
  if (state === "ready") {
    return {
      section:
        "border-emerald-300 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_70%)]",
      icon: "bg-emerald-100 ring-emerald-200",
      badge:
        "border-emerald-300 bg-emerald-600 !text-white",
      statusIcon: "bg-emerald-100 !text-emerald-700 ring-emerald-200",
      text: "!text-emerald-800",
    };
  }

  if (state === "pending") {
    return {
      section:
        "border-emerald-300 bg-[linear-gradient(135deg,#f0fdf4_0%,#ffffff_72%)]",
      icon: "bg-emerald-100 ring-emerald-200",
      badge:
        "border-emerald-300 bg-emerald-50 !text-emerald-800",
      statusIcon: "bg-amber-100 !text-amber-700 ring-amber-200",
      text: "!text-amber-800",
    };
  }

  if (state === "attention") {
    return {
      section: "border-rose-200 bg-rose-50",
      icon: "bg-white ring-rose-200",
      badge: "border-rose-200 bg-white !text-rose-700",
      statusIcon: "bg-rose-100 !text-rose-700 ring-rose-200",
      text: "!text-rose-800",
    };
  }

  return {
    section: "border-amber-200 bg-amber-50",
    icon: "bg-white ring-amber-200",
    badge: "border-amber-200 bg-white !text-amber-700",
    statusIcon: "bg-amber-100 !text-amber-700 ring-amber-200",
    text: "!text-amber-800",
  };
}

function CurrentPayoutMethodCard({
  setup,
  loadError,
  saveStatus,
  approvedAmount,
}: {
  setup: AmbassadorPayoutSetup | null;
  loadError?: string | null;
  saveStatus?: string | null;
  approvedAmount: number;
}) {
  const selectedProvider =
    normalizePayoutProvider(setup?.selectedProvider) || "set_up_later";
  const currentAccount = getCurrentPayoutAccount(setup, selectedProvider);
  const visualStatus = getPayoutVisualStatus({
    provider: selectedProvider,
    account: currentAccount,
    loadError,
  });
  const classes = payoutCardClasses(visualStatus.state);
  const providerDetails =
    selectedProvider === "set_up_later"
      ? null
      : payoutProviderDetails(selectedProvider, currentAccount);
  const manageHref =
    selectedProvider === "set_up_later"
      ? "/ambassador/dashboard/payouts"
      : `/ambassador/dashboard/payouts?provider=${selectedProvider}`;

  const successMessage =
    saveStatus === "stripe"
      ? "Bank or card is now your payout method."
      : saveStatus === "paypal"
        ? "PayPal is now your payout method."
        : saveStatus === "venmo"
          ? "Venmo is now your payout method."
          : null;

  return (
    <section
      className={`overflow-hidden rounded-[1.6rem] border p-4 shadow-sm sm:p-6 ${classes.section}`}
    >
      {successMessage ? (
        <div
          role="status"
          className="mb-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 !text-emerald-700" />
          <p className="text-sm font-bold !text-emerald-900">
            {successMessage}
          </p>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-black uppercase tracking-[0.16em] !text-emerald-700">
              My payout method
            </p>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${classes.badge}`}
            >
              {visualStatus.state === "ready" || visualStatus.state === "pending" ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : visualStatus.state === "attention" ? (
                <AlertTriangle className="h-3.5 w-3.5" />
              ) : (
                <Clock3 className="h-3.5 w-3.5" />
              )}
              {visualStatus.badge}
            </span>
          </div>

          <div className="mt-4 flex min-w-0 items-start gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl p-2.5 shadow-sm ring-1 ${classes.icon}`}
            >
              {providerDetails ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={providerDetails.logoPath}
                  alt={providerDetails.label}
                  className="max-h-8 max-w-[78px] object-contain"
                />
              ) : (
                <Wallet className="h-7 w-7 !text-amber-700" />
              )}
            </div>

            <div className="min-w-0">
              <h2 className="text-2xl font-black tracking-tight !text-slate-950 sm:text-3xl">
                {providerDetails?.label || "Set up your payout"}
              </h2>
              <p className="mt-1 break-words text-sm font-bold !text-slate-700">
                {providerDetails?.destination ||
                  "Choose one payout method in your payout settings."}
              </p>

              <div className="mt-3 flex items-start gap-2">
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 ${classes.statusIcon}`}
                >
                  {visualStatus.state === "ready" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : visualStatus.state === "attention" ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <Clock3 className="h-4 w-4" />
                  )}
                </span>
                <div>
                  <p className={`text-sm font-black ${classes.text}`}>
                    {visualStatus.headline}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold leading-6 !text-slate-700">
                    {visualStatus.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[minmax(180px,1fr)_auto] sm:items-center lg:min-w-[420px]">
          <div className="rounded-2xl border border-sky-100 bg-white px-4 py-3 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] !text-sky-700">
              Ready to pay
            </p>
            <p className="mt-1 text-2xl font-black !text-sky-950">
              {money(approvedAmount)}
            </p>
          </div>

          <Link
            href={manageHref}
            className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full bg-emerald-700 px-5 py-3 text-sm font-black !text-white shadow-sm transition hover:bg-emerald-800 active:scale-[0.99]"
          >
            {selectedProvider === "set_up_later"
              ? "Set up payout"
              : "Manage payout"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default async function AmbassadorDashboardEarningsPage({
  searchParams,
}: AmbassadorDashboardEarningsPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    const loginParams = new URLSearchParams({
      mode: "phone",
      role: "ambassador",
      next: "/login/route?preferred=ambassador",
    });

    redirect(`/login?${loginParams.toString()}`);
  }

  const ambassador = await getAmbassadorForUser(user.id, user.email);

  if (!ambassador?.id) {
    redirect("/login/route?preferred=ambassador");
  }

  const resolvedSearchParams = await Promise.resolve(searchParams || {});
  const payoutSavedParam = resolvedSearchParams.payoutSaved;
  const payoutStatusParam = resolvedSearchParams.payoutStatus;
  const payoutSaveStatus =
    typeof payoutSavedParam === "string"
      ? payoutSavedParam
      : typeof payoutStatusParam === "string"
        ? payoutStatusParam
        : null;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const payoutSetupResponse: AmbassadorPayoutSetupResponse =
    session?.access_token
      ? await callAmbassadorPayoutSetupApi({
          accessToken: session.access_token,
        })
      : {
          success: false,
          error:
            "Your reward payout session could not be loaded. Please sign in again.",
        };

  const payoutSetup = payoutSetupResponse.success
    ? payoutSetupResponse.setup || null
    : null;
  const payoutSetupError = payoutSetupResponse.success
    ? null
    : payoutSetupResponse.error ||
      "SitGuru could not load your reward payout setup.";

  const rewardsResult = await getCanonicalAmbassadorRewards(ambassador.id);
  const rewards = normalizeRewards(rewardsResult.rows);

  const pendingRewards = rewards.filter(
    (reward) => reward.bucket === "pending",
  );
  const approvedRewards = rewards.filter(
    (reward) => reward.bucket === "approved",
  );
  const paidRewards = rewards.filter(
    (reward) => reward.bucket === "paid",
  );
  const excludedRewards = rewards.filter(
    (reward) => reward.bucket === "excluded",
  );

  const pendingAmount = roundMoney(
    pendingRewards.reduce((sum, reward) => sum + reward.amount, 0),
  );
  const approvedAmount = roundMoney(
    approvedRewards.reduce((sum, reward) => sum + reward.amount, 0),
  );
  const paidAmount = roundMoney(
    paidRewards.reduce((sum, reward) => sum + reward.amount, 0),
  );
  const confirmedAmount = roundMoney(approvedAmount + paidAmount);

  const monthStart = startOfCurrentMonth();
  const paidThisMonth = roundMoney(
    paidRewards
      .filter((reward) => {
        const parsed = new Date(reward.rawDate);
        return !Number.isNaN(parsed.getTime()) && parsed >= monthStart;
      })
      .reduce((sum, reward) => sum + reward.amount, 0),
  );

  const referralCode =
    asString(ambassador.referral_code) || "Not assigned";

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_42%,#ecfdf5_100%)] px-3 py-4 !text-slate-950 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-[1720px] space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="grid gap-6 bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.95),transparent_18%),linear-gradient(120deg,#b9f8df_0%,#d9f8ef_48%,#bde9ff_100%)] px-4 py-6 sm:px-8 sm:py-10 lg:grid-cols-[1.35fr_0.75fr] lg:items-center xl:px-10">
            <div>
              <Link
                href="/ambassador/dashboard"
                className="inline-flex items-center rounded-full border border-white/80 bg-white/90 px-4 py-2 text-xs font-black text-emerald-800 shadow-sm transition hover:bg-white"
              >
                ← Back to Dashboard
              </Link>

              <p className="mt-5 text-sm font-black uppercase tracking-[0.26em] !text-emerald-800">
                Ambassador Earnings
              </p>

              <h1 className="mt-3 max-w-5xl text-4xl font-black tracking-[-0.05em] !text-slate-950 sm:mt-4 sm:text-5xl md:text-6xl xl:text-7xl">
                Your rewards, all in one spot.
              </h1>

              <p className="mt-4 max-w-4xl text-sm font-semibold leading-6 !text-slate-800 sm:mt-5 sm:text-base sm:leading-8 md:text-lg">
                See what&apos;s pending, what&apos;s ready, and what&apos;s
                already paid. No guessing.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-2xl bg-white/95 px-5 py-3 text-sm font-black !text-slate-900 shadow-sm ring-1 ring-white/80">
                  <ShieldCheck className="h-4 w-4 !text-emerald-600" />
                  Verified reward records only
                </div>

                <div className="inline-flex items-center gap-2 rounded-2xl bg-white/95 px-5 py-3 text-sm font-black !text-slate-900 shadow-sm ring-1 ring-white/80">
                  <Sparkles className="h-4 w-4 !text-amber-500" />
                  Referral code: {referralCode}
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/70 bg-white/95 p-7 shadow-xl backdrop-blur">
              <div className="flex items-start gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-emerald-100 !text-emerald-700 ring-1 ring-emerald-200">
                  <Wallet className="h-8 w-8" />
                </div>

                <div>
                  <h2 className="text-xl font-black tracking-tight !text-slate-950 sm:text-2xl md:text-3xl">
                    Quick status check
                  </h2>

                  <div className="mt-3 space-y-2 text-sm font-semibold leading-6 !text-slate-800 sm:mt-4">
                    <p>
                      <strong>Pending:</strong> we&apos;re checking it.
                    </p>
                    <p>
                      <strong>Ready:</strong> approved and waiting to be paid.
                    </p>
                    <p>
                      <strong>Paid:</strong> your reward was sent.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {rewardsResult.warning ? (
          <section className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <p className="text-sm font-bold leading-6 text-amber-950">
                {rewardsResult.warning}
              </p>
            </div>
          </section>
        ) : null}

        <section
          aria-label="Reward totals"
          className="-mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-5"
        >
          <StatCard
            title="Pending"
            value={money(pendingAmount)}
            description="Still being checked"
            icon={<Clock3 className="h-6 w-6" />}
          />
          <StatCard
            title="Ready to Pay"
            value={money(approvedAmount)}
            description="Approved and waiting"
            icon={<BadgeDollarSign className="h-6 w-6" />}
          />
          <StatCard
            title="Paid Out"
            value={money(paidAmount)}
            description="Rewards already sent"
            icon={<PiggyBank className="h-6 w-6" />}
          />
          <StatCard
            title="Total Earned"
            value={money(confirmedAmount)}
            description="Ready plus paid rewards"
            icon={<Trophy className="h-6 w-6" />}
          />
          <StatCard
            title="This Month"
            value={money(paidThisMonth)}
            description="Rewards paid this month"
            icon={<CalendarDays className="h-6 w-6" />}
          />
        </section>

        <CurrentPayoutMethodCard
          setup={payoutSetup}
          loadError={payoutSetupError}
          saveStatus={payoutSaveStatus}
          approvedAmount={approvedAmount}
        />

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <RewardGroup
              title="Pending"
              description="We’re checking these rewards."
              total={pendingAmount}
              rewards={pendingRewards}
              emptyMessage="No rewards are currently waiting for review."
              icon={<Clock3 className="h-5 w-5" />}
            />

            <RewardGroup
              title="Ready to Pay"
              description="Approved and waiting to be sent."
              total={approvedAmount}
              rewards={approvedRewards}
              emptyMessage="No approved unpaid rewards are currently recorded."
              icon={<BadgeDollarSign className="h-5 w-5" />}
            />

            <RewardGroup
              title="Paid"
              description="These rewards were sent."
              total={paidAmount}
              rewards={paidRewards}
              emptyMessage="No paid Ambassador rewards are currently recorded."
              icon={<CheckCircle2 className="h-5 w-5" />}
            />
          </div>

          <div className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-emerald-700" />
                <h2 className="text-2xl font-black !text-slate-950">
                  No mystery math
                </h2>
              </div>

              <p className="mt-3 text-sm font-semibold leading-7 !text-slate-700">
                Your totals come from real, verified rewards. Estimates and
                possible future rewards never count as money you earned.
              </p>

              <div className="mt-5 grid gap-3">
                {[
                  "Refreshing this page does not create rewards.",
                  "Pending rewards are not included in confirmed totals.",
                  "Approved rewards remain separate from paid rewards.",
                  "Excluded or canceled rewards are never added to earnings totals.",
                  "Payout readiness does not change a reward status.",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                    <p className="text-sm font-bold leading-6 !text-slate-700">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {excludedRewards.length > 0 ? (
              <section className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-rose-700" />
                  <div>
                    <h2 className="text-xl font-black text-rose-950">
                      Excluded Reward Records
                    </h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-rose-900">
                      {excludedRewards.length} reward record
                      {excludedRewards.length === 1 ? " is" : "s are"} marked
                      canceled, rejected, refunded, void, chargeback-related,
                      or ineligible. These amounts are not included in any
                      earnings total.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  {excludedRewards.map((reward) => (
                    <RewardCard key={reward.id} reward={reward} />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-white text-emerald-700 ring-1 ring-emerald-100">
                  <Sparkles className="h-7 w-7" />
                </div>

                <div>
                  <p className="text-lg font-black !text-emerald-900">
                    Share. Track. Earn.
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-7 !text-emerald-900">
                    Share your link, watch your referrals grow, and track each
                    verified reward here.
                  </p>

                  <Link
                    href="/ambassador/dashboard/referrals"
                    className="mt-4 inline-flex items-center justify-center rounded-2xl border border-emerald-300 bg-white px-5 py-3 text-sm font-black !text-emerald-700 shadow-sm transition hover:bg-emerald-50"
                  >
                    View Referrals
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}