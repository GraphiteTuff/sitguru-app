import type { ReactNode } from "react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
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
import {
  AMBASSADOR_REWARD_ONBOARDING_STEPS,
  AMBASSADOR_REWARDS_HEADING,
  AMBASSADOR_REWARDS_SUPPORTING_TEXT,
  getAmbassadorRewardMethods,
} from "@/lib/payments/payment-methods";

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

type AmbassadorPayoutProvider = "paypal" | "venmo" | "set_up_later";

type AmbassadorPayoutAccount = {
  provider?: "paypal" | "venmo" | null;
  providerEmail?: string | null;
  providerPhone?: string | null;
  onboardingStatus?: string | null;
  accountStatus?: string | null;
  payoutsEnabled?: boolean;
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

async function saveAmbassadorPayoutProvider(formData: FormData) {
  "use server";

  const requestedProvider = String(formData.get("provider") || "");
  const continueToSetup =
    String(formData.get("continueToSetup") || "") === "true";
  const provider: AmbassadorPayoutProvider | null =
    requestedProvider === "paypal" ||
    requestedProvider === "venmo" ||
    requestedProvider === "set_up_later"
      ? requestedProvider
      : null;

  if (!provider) {
    redirect("/ambassador/dashboard/earnings?payoutStatus=invalid");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login/route?preferred=ambassador");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect("/login/route?preferred=ambassador");
  }

  const result = await callAmbassadorPayoutSetupApi({
    accessToken: session.access_token,
    method: "PATCH",
    provider,
  });

  revalidatePath("/ambassador/dashboard/earnings");
  revalidatePath("/ambassador/dashboard/payouts");

  if (!result.success) {
    redirect("/ambassador/dashboard/earnings?payoutStatus=error");
  }

  if (continueToSetup && provider !== "set_up_later") {
    redirect(`/ambassador/dashboard/payouts?provider=${provider}`);
  }

  redirect(
    `/ambassador/dashboard/earnings?payoutSaved=${provider}`,
  );
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
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
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

function providerFromMethodId(methodId: string): "paypal" | "venmo" {
  return methodId === "venmo_rewards" ? "venmo" : "paypal";
}

function RewardPayoutSetupCard({
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
  const methods = getAmbassadorRewardMethods();
  const selectedProvider = setup?.selectedProvider || "set_up_later";
  const readyAccount = setup?.readyAccount || null;
  const setupComplete = Boolean(setup?.setupComplete);
  const successMessage =
    saveStatus === "paypal"
      ? "PayPal is now your selected reward payout option."
      : saveStatus === "venmo"
        ? "Venmo is now your selected reward payout option."
        : saveStatus === "set_up_later"
          ? "No problem. You can set up reward payments later."
          : null;
  const errorMessage =
    saveStatus === "error"
      ? "SitGuru could not save that choice. Please try again."
      : saveStatus === "invalid"
        ? "Choose PayPal, Venmo, or set up reward payments later."
        : loadError || null;

  if (setupComplete && readyAccount) {
    const providerLabel =
      readyAccount.provider === "venmo" ? "Venmo" : "PayPal";
    const providerLogo =
      readyAccount.provider === "venmo"
        ? "/images/payments/venmo.svg"
        : "/images/payments/paypal.svg";
    const destinationLabel =
      readyAccount.providerEmail ||
      readyAccount.providerPhone ||
      "Connected account";

    return (
      <section className="rounded-[1.5rem] border border-emerald-200 bg-white p-4 shadow-sm sm:p-5">
        {successMessage ? (
          <div
            role="status"
            className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold !text-emerald-800"
          >
            {successMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div
            role="alert"
            className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold !text-rose-700"
          >
            {errorMessage}
          </div>
        ) : null}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3 sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 p-2 ring-1 ring-emerald-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={providerLogo}
                alt={providerLabel}
                className="max-h-7 max-w-[72px] object-contain"
              />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-black !text-slate-950">
                  Reward payments ready
                </p>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] !text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Ready
                </span>
              </div>

              <p className="mt-1 truncate text-sm font-semibold !text-slate-700">
                {providerLabel} · {destinationLabel}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center lg:min-w-[410px]">
            <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-sky-700">
                Approved and waiting
              </p>
              <p className="mt-1 text-2xl font-black text-sky-950">
                {money(approvedAmount)}
              </p>
            </div>

            <Link
              href="/ambassador/dashboard/payouts"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-emerald-300 bg-white px-5 py-3 text-sm font-black !text-emerald-800 transition hover:bg-emerald-50"
            >
              Manage reward payments
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-emerald-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] !text-emerald-700">
            Reward payments
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight !text-slate-950">
            {setupComplete
              ? "Your reward payment account is ready"
              : AMBASSADOR_REWARDS_HEADING}
          </h2>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 !text-slate-700">
            {AMBASSADOR_REWARDS_SUPPORTING_TEXT} You do not need to set this up
            when you join. Connect your preferred option when your first
            approved reward is ready to be paid.
          </p>
        </div>

        <span
          className={`inline-flex w-fit items-center rounded-full border px-4 py-2 text-xs font-black ${
            setupComplete
              ? "border-emerald-200 bg-emerald-50 !text-emerald-700"
              : "border-amber-200 bg-amber-50 !text-amber-700"
          }`}
        >
          {setupComplete ? "Ready" : "Choose an option"}
        </span>
      </div>

      {successMessage ? (
        <div
          role="status"
          className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold !text-emerald-800"
        >
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div
          role="alert"
          className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold !text-rose-700"
        >
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-5 rounded-[1.35rem] border border-sky-100 bg-sky-50 p-4">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-sky-700">
          Approved and waiting
        </p>
        <p className="mt-2 text-3xl font-black text-sky-950">
          {money(approvedAmount)}
        </p>
        <p className="mt-1 text-xs font-bold leading-5 text-sky-800">
          Approved rewards stay here until SitGuru submits and confirms your
          payment.
        </p>
      </div>

      {setupComplete && readyAccount ? (
        <div className="mt-5 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 min-w-12 shrink-0 items-center justify-center rounded-2xl bg-white p-2 shadow-sm ring-1 ring-emerald-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    readyAccount.provider === "venmo"
                      ? "/images/payments/venmo.svg"
                      : "/images/payments/paypal.svg"
                  }
                  alt={
                    readyAccount.provider === "venmo" ? "Venmo" : "PayPal"
                  }
                  className="max-h-7 max-w-[72px] object-contain"
                />
              </div>

              <div>
                <p className="flex items-center gap-2 text-lg font-black !text-slate-950">
                  {readyAccount.provider === "venmo" ? "Venmo" : "PayPal"} is
                  ready
                  <CheckCircle2 className="h-5 w-5 !text-emerald-600" />
                </p>
                <p className="mt-1 text-sm font-semibold leading-6 !text-slate-700">
                  Approved commissions and referral rewards can be sent to your
                  connected account.
                </p>
                {readyAccount.providerEmail ? (
                  <p className="mt-2 text-sm font-black !text-emerald-800">
                    {readyAccount.providerEmail}
                  </p>
                ) : null}
                {readyAccount.providerPhone ? (
                  <p className="mt-2 text-sm font-black !text-emerald-800">
                    {readyAccount.providerPhone}
                  </p>
                ) : null}
              </div>
            </div>

            <Link
              href="/ambassador/dashboard/payouts"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-emerald-300 bg-white px-5 py-2.5 text-sm font-black !text-emerald-800 transition hover:bg-emerald-100"
            >
              Review reward setup
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {methods.map((method) => {
            const provider = providerFromMethodId(method.id);
            const selected = selectedProvider === provider;
            const logoPath =
              provider === "venmo"
                ? "/images/payments/venmo.svg"
                : "/images/payments/paypal.svg";

            return (
              <article
                key={method.id}
                className={`rounded-[1.5rem] border p-5 ${
                  selected
                    ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-100"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 min-w-12 shrink-0 items-center justify-center rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoPath}
                      alt={method.label}
                      className="max-h-7 max-w-[76px] object-contain"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-black !text-slate-950">
                        {method.label}
                      </p>
                      {selected ? (
                        <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] !text-white">
                          Selected
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-2 text-sm font-semibold leading-6 !text-slate-700">
                      {method.description}
                    </p>
                    <p className="mt-2 text-xs font-bold leading-5 !text-slate-500">
                      {method.setupSummary}
                    </p>
                  </div>
                </div>

                <form action={saveAmbassadorPayoutProvider} className="mt-5">
                  <input type="hidden" name="provider" value={provider} />
                  <input type="hidden" name="continueToSetup" value="true" />
                  <button
                    type="submit"
                    className={`inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black transition ${
                      selected
                        ? "border border-emerald-300 bg-white !text-emerald-800"
                        : "bg-emerald-700 !text-white shadow-sm hover:bg-emerald-800"
                    }`}
                  >
                    {selected
                      ? `Continue ${method.shortLabel} setup`
                      : `Choose ${method.shortLabel}`}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <p className="text-sm font-black !text-slate-950">
          Your simple reward setup
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {AMBASSADOR_REWARD_ONBOARDING_STEPS.map((step) => (
            <div
              key={step.step}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-sm font-black text-white">
                {step.step}
              </span>
              <p className="mt-3 text-sm font-black !text-slate-950">
                {step.title}
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 !text-slate-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {!setupComplete ? (
        <div className="mt-5 flex flex-col gap-4 rounded-[1.25rem] border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <p className="text-sm font-black !text-slate-950">
              Not ready to connect an account?
            </p>
            <p className="mt-1 text-sm font-semibold leading-6 !text-slate-700">
              Keep sharing and earning. You can finish payment setup before
              your first approved reward is sent.
            </p>
          </div>

          <form action={saveAmbassadorPayoutProvider}>
            <input type="hidden" name="provider" value="set_up_later" />
            <button
              type="submit"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-black !text-slate-800 transition hover:bg-slate-100"
            >
              Do this later
            </button>
          </form>
        </div>
      ) : null}

      <p className="mt-4 text-xs font-semibold leading-5 !text-slate-500">
        SitGuru never asks for your PayPal password, Venmo password, or bank
        login. Complete any provider verification securely with PayPal or
        Venmo.
      </p>
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
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_42%,#ecfdf5_100%)] px-4 py-6 !text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1720px] space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="grid gap-8 bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.95),transparent_18%),linear-gradient(120deg,#b9f8df_0%,#d9f8ef_48%,#bde9ff_100%)] px-8 py-10 lg:grid-cols-[1.35fr_0.75fr] lg:items-center xl:px-10">
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

              <h1 className="mt-4 max-w-5xl text-5xl font-black tracking-[-0.055em] !text-slate-950 md:text-6xl xl:text-7xl">
                Real rewards. Clear status.
              </h1>

              <p className="mt-5 max-w-4xl text-base font-semibold leading-8 !text-slate-800 md:text-lg">
                Track your commissions, referral payments, and approved
                rewards in one place. Pending, approved, and paid amounts stay
                separate so you always know what is still being reviewed, what
                is ready, and what SitGuru has confirmed as paid.
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
                  <h2 className="text-2xl font-black tracking-tight !text-slate-950 md:text-3xl">
                    What each status means
                  </h2>

                  <div className="mt-4 space-y-3 text-sm font-semibold leading-7 !text-slate-800">
                    <p>
                      <strong>Pending:</strong> under review and not approved.
                    </p>
                    <p>
                      <strong>Approved:</strong> confirmed by SitGuru but not
                      yet recorded as paid.
                    </p>
                    <p>
                      <strong>Paid:</strong> payout completion is recorded on
                      the reward.
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

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Pending Review"
            value={money(pendingAmount)}
            description="Not approved or payable yet"
            icon={<Clock3 className="h-6 w-6" />}
          />
          <StatCard
            title="Approved Unpaid"
            value={money(approvedAmount)}
            description="Confirmed and waiting payout"
            icon={<BadgeDollarSign className="h-6 w-6" />}
          />
          <StatCard
            title="Paid Out"
            value={money(paidAmount)}
            description="Recorded as paid by SitGuru"
            icon={<PiggyBank className="h-6 w-6" />}
          />
          <StatCard
            title="Confirmed Total"
            value={money(confirmedAmount)}
            description="Approved plus paid rewards only"
            icon={<Trophy className="h-6 w-6" />}
          />
          <StatCard
            title="Paid This Month"
            value={money(paidThisMonth)}
            description="Paid rewards dated this month"
            icon={<CalendarDays className="h-6 w-6" />}
          />
        </section>

        <RewardPayoutSetupCard
          setup={payoutSetup}
          loadError={payoutSetupError}
          saveStatus={payoutSaveStatus}
          approvedAmount={approvedAmount}
        />

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <RewardGroup
              title="Pending Review"
              description="These rewards are not confirmed earnings and are not available for payout."
              total={pendingAmount}
              rewards={pendingRewards}
              emptyMessage="No rewards are currently waiting for review."
              icon={<Clock3 className="h-5 w-5" />}
            />

            <RewardGroup
              title="Approved, Not Paid"
              description="SitGuru approved these rewards, but no paid status has been recorded yet."
              total={approvedAmount}
              rewards={approvedRewards}
              emptyMessage="No approved unpaid rewards are currently recorded."
              icon={<BadgeDollarSign className="h-5 w-5" />}
            />

            <RewardGroup
              title="Paid Rewards"
              description="Only rewards with a paid status or paid date appear in this section."
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
                  Earnings Integrity
                </h2>
              </div>

              <p className="mt-3 text-sm font-semibold leading-7 !text-slate-700">
                SitGuru does not turn referral counts, daily targets, or
                projected activity into confirmed earnings. A dollar amount
                appears only after SitGuru creates and reviews a verified reward
                record for your Ambassador account.
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
                    Grow referrals without guessing earnings.
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-7 !text-emerald-900">
                    Use the Referrals page to share your tracked links and view
                    canonical referral activity. Earnings appear here only
                    after SitGuru creates and reviews the matching reward.
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