import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeDollarSign,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  HelpCircle,
  History,
  ShieldCheck,
  Wallet,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STRIPE_API_BASE = "https://api.stripe.com/v1";
const GUIDE_IMAGE_PATH =
  "/images/ambassadors/sitguru-ambassador-stripe-setup-guide.png";

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

type StripeAccountSummary = {
  id: string;
  detailsSubmitted: boolean;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
  disabledReason: string;
  currentlyDue: string[];
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

type CanonicalRewardsResult = {
  rows: RewardRow[];
  warning: string;
};

type PayoutReadiness = {
  accountId: string;
  savedStatus: string;
  detailsSubmitted: boolean;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
  ready: boolean;
  liveVerified: boolean;
  disabledReason: string;
  currentlyDue: string[];
  blockers: string[];
  warning: string;
};

type SearchParamValue = string | string[] | undefined;
type PayoutSearchParams = Record<string, SearchParamValue>;

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

function asBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;

  const normalized = asString(value).toLowerCase();

  return [
    "true",
    "yes",
    "ready",
    "enabled",
    "complete",
    "completed",
    "active",
  ].includes(normalized);
}

function firstParam(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] || "" : value || "";
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

function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    process.env.VERCEL_URL ||
    "https://www.sitguru.com";

  if (
    configuredUrl.startsWith("http://") ||
    configuredUrl.startsWith("https://")
  ) {
    return configuredUrl.replace(/\/+$/, "");
  }

  return `https://${configuredUrl.replace(/\/+$/, "")}`;
}

function getStripeAccountId(ambassador: AmbassadorRecord | null) {
  if (!ambassador) return "";

  return (
    asString(ambassador.stripe_account_id) ||
    asString(ambassador.stripe_connect_account_id)
  );
}

async function getAmbassadorForUser(userId: string, email?: string | null) {
  const { data: byUserId, error: userIdError } = await supabaseAdmin
    .from("ambassadors")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (userIdError) {
    console.error(
      "Ambassador payout lookup by user ID failed:",
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
          `Ambassador payout lookup by ${column} failed:`,
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

async function stripeRequest<T>({
  path,
  method = "GET",
  body,
  idempotencyKey,
}: {
  path: string;
  method?: "GET" | "POST";
  body?: URLSearchParams;
  idempotencyKey?: string;
}) {
  const stripeSecretKey = asString(process.env.STRIPE_SECRET_KEY);

  if (!stripeSecretKey) {
    throw new Error("stripe_not_configured");
  }

  const response = await fetch(`${STRIPE_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      ...(body
        ? { "Content-Type": "application/x-www-form-urlencoded" }
        : {}),
      ...(idempotencyKey
        ? { "Idempotency-Key": idempotencyKey }
        : {}),
    },
    body,
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as T & {
    error?: { message?: string };
  };

  if (!response.ok) {
    console.error(
      "Ambassador Stripe request failed:",
      payload.error?.message || response.statusText,
    );
    throw new Error("stripe_request_failed");
  }

  return payload as T;
}

async function createStripeAccount({
  userEmail,
  ambassador,
}: {
  userEmail?: string | null;
  ambassador: AmbassadorRecord;
}) {
  const body = new URLSearchParams();
  body.set("type", "express");
  body.set("country", "US");
  body.set("business_type", "individual");
  body.set("capabilities[transfers][requested]", "true");
  body.set("metadata[ambassador_id]", ambassador.id);

  if (ambassador.user_id) {
    body.set("metadata[ambassador_user_id]", ambassador.user_id);
  }

  const email = asString(
    ambassador.login_email ||
      ambassador.contact_email ||
      ambassador.email ||
      userEmail,
  );

  if (email) {
    body.set("email", email);
  }

  const account = await stripeRequest<{ id: string }>({
    path: "/accounts",
    method: "POST",
    body,
    idempotencyKey: `sitguru-ambassador-account-${ambassador.id}`,
  });

  return account.id;
}

async function createStripeAccountLink(accountId: string) {
  const siteUrl = getSiteUrl();
  const body = new URLSearchParams();

  body.set("account", accountId);
  body.set(
    "refresh_url",
    `${siteUrl}/ambassador/dashboard/payouts?stripe=refresh`,
  );
  body.set(
    "return_url",
    `${siteUrl}/ambassador/dashboard/payouts?stripe=return`,
  );
  body.set("type", "account_onboarding");

  const accountLink = await stripeRequest<{ url: string }>({
    path: "/account_links",
    method: "POST",
    body,
  });

  return accountLink.url;
}

async function retrieveStripeAccount(accountId: string) {
  if (!accountId) return null;

  try {
    const account = await stripeRequest<{
      id: string;
      details_submitted?: boolean;
      payouts_enabled?: boolean;
      charges_enabled?: boolean;
      requirements?: {
        disabled_reason?: string | null;
        currently_due?: string[] | null;
      } | null;
    }>({
      path: `/accounts/${encodeURIComponent(accountId)}`,
    });

    return {
      id: account.id,
      detailsSubmitted: Boolean(account.details_submitted),
      payoutsEnabled: Boolean(account.payouts_enabled),
      chargesEnabled: Boolean(account.charges_enabled),
      disabledReason: asString(account.requirements?.disabled_reason),
      currentlyDue: Array.isArray(account.requirements?.currently_due)
        ? account.requirements?.currently_due || []
        : [],
    } satisfies StripeAccountSummary;
  } catch (error) {
    console.warn("Unable to retrieve Ambassador Stripe account:", error);
    return null;
  }
}

async function updateAmbassadorStripeFields({
  ambassador,
  accountId,
  account,
}: {
  ambassador: AmbassadorRecord;
  accountId: string;
  account: StripeAccountSummary;
}) {
  const nextStatus = account.payoutsEnabled
    ? "payouts_enabled"
    : account.detailsSubmitted
      ? "details_submitted"
      : "onboarding_started";

  const alreadyCurrent =
    getStripeAccountId(ambassador) === accountId &&
    asString(ambassador.stripe_account_status) === nextStatus &&
    asBoolean(ambassador.stripe_onboarding_complete) ===
      account.detailsSubmitted &&
    (asBoolean(ambassador.stripe_payouts_enabled) ||
      asBoolean(ambassador.payouts_enabled)) === account.payoutsEnabled &&
    asBoolean(ambassador.charges_enabled) === account.chargesEnabled;

  if (alreadyCurrent) return;

  const workingPayload: Record<string, unknown> = {
    stripe_account_id: accountId,
    stripe_connect_account_id: accountId,
    stripe_account_status: nextStatus,
    stripe_onboarding_complete: account.detailsSubmitted,
    stripe_payouts_enabled: account.payoutsEnabled,
    payouts_enabled: account.payoutsEnabled,
    charges_enabled: account.chargesEnabled,
    updated_at: new Date().toISOString(),
  };

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { error } = await supabaseAdmin
      .from("ambassadors")
      .update(workingPayload)
      .eq("id", ambassador.id);

    if (!error) return;

    const missingColumn = error.message.match(
      /Could not find the '([^']+)' column/i,
    )?.[1];

    if (
      missingColumn &&
      Object.prototype.hasOwnProperty.call(
        workingPayload,
        missingColumn,
      )
    ) {
      delete workingPayload[missingColumn];
      continue;
    }

    console.warn(
      "Unable to update Ambassador Stripe fields:",
      error.message,
    );
    return;
  }
}

function getPayoutReadiness({
  ambassador,
  stripeAccount,
}: {
  ambassador: AmbassadorRecord;
  stripeAccount: StripeAccountSummary | null;
}): PayoutReadiness {
  const accountId = getStripeAccountId(ambassador);
  const liveVerified = Boolean(stripeAccount);
  const detailsSubmitted = stripeAccount
    ? stripeAccount.detailsSubmitted
    : asBoolean(ambassador.stripe_onboarding_complete);
  const payoutsEnabled = stripeAccount
    ? stripeAccount.payoutsEnabled
    : asBoolean(ambassador.stripe_payouts_enabled) ||
      asBoolean(ambassador.payouts_enabled);
  const chargesEnabled = stripeAccount
    ? stripeAccount.chargesEnabled
    : asBoolean(ambassador.charges_enabled);
  const disabledReason = stripeAccount?.disabledReason || "";
  const currentlyDue = stripeAccount?.currentlyDue || [];

  const blockers: string[] = [];

  if (!accountId) {
    blockers.push("Connect a Stripe Express payout account.");
  }

  if (!detailsSubmitted) {
    blockers.push("Complete Stripe identity, tax, and banking onboarding.");
  }

  if (!payoutsEnabled) {
    blockers.push("Stripe payouts are not enabled yet.");
  }

  if (disabledReason) {
    blockers.push(
      `Stripe requirement: ${titleCase(
        disabledReason.replace(/[._-]+/g, " "),
      )}.`,
    );
  }

  const warning =
    accountId && !liveVerified
      ? "SitGuru could not confirm the live Stripe account status. Saved setup fields are shown, but payout readiness should be rechecked before processing money."
      : "";

  return {
    accountId,
    savedStatus: asString(ambassador.stripe_account_status),
    detailsSubmitted,
    payoutsEnabled,
    chargesEnabled,
    ready:
      Boolean(accountId) &&
      detailsSubmitted &&
      payoutsEnabled &&
      !disabledReason,
    liveVerified,
    disabledReason,
    currentlyDue,
    blockers,
    warning,
  };
}

function getRewardBucket(row: RewardRow): RewardBucket {
  const rewardStatus = normalizeStatus(row.status);
  const payoutStatus = normalizeStatus(row.payout_status);

  const excludedStatuses = new Set([
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
    excludedStatuses.has(rewardStatus) ||
    excludedStatuses.has(payoutStatus)
  ) {
    return "excluded";
  }

  const paidStatuses = new Set([
    "paid",
    "payout paid",
    "payout completed",
    "settled",
  ]);

  if (
    Boolean(asString(row.paid_at)) ||
    paidStatuses.has(rewardStatus) ||
    paidStatuses.has(payoutStatus)
  ) {
    return "paid";
  }

  const approvedStatuses = new Set([
    "approved",
    "approved unpaid",
    "ready for payout",
    "payable",
    "queued for payout",
  ]);

  if (
    approvedStatuses.has(rewardStatus) ||
    approvedStatuses.has(payoutStatus)
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

function getRewardStatus(row: RewardRow, bucket: RewardBucket) {
  const storedStatus = normalizeStatus(
    row.payout_status || row.status,
  );

  if (storedStatus) return titleCase(storedStatus);
  if (bucket === "paid") return "Paid";
  if (bucket === "approved") return "Approved";
  if (bucket === "excluded") return "Not Eligible";

  return "Pending Review";
}

function getRewardNote(row: RewardRow, bucket: RewardBucket) {
  const savedNote = asString(row.notes || row.admin_notes);
  if (savedNote) return savedNote;

  if (bucket === "approved") {
    return "Approved by SitGuru and waiting for payout processing.";
  }

  if (bucket === "paid") {
    return "SitGuru recorded this reward as paid.";
  }

  if (bucket === "excluded") {
    return "This reward is not eligible for payout.";
  }

  return "This reward is still under review and is not payable.";
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

async function getCanonicalRewards(
  ambassadorId: string,
): Promise<CanonicalRewardsResult> {
  const { data, error } = await supabaseAdmin
    .from("ambassador_rewards")
    .select("*")
    .eq("ambassador_id", ambassadorId)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    console.error(
      "Unable to load canonical Ambassador payout rewards:",
      error.message,
    );

    return {
      rows: [],
      warning:
        "SitGuru could not load your canonical reward records. Approved and paid totals are not being estimated or replaced with projected amounts.",
    };
  }

  return {
    rows: (data || []) as RewardRow[],
    warning: "",
  };
}

async function startStripeOnboardingAction() {
  "use server";

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const loginParams = new URLSearchParams({
      mode: "phone",
      role: "ambassador",
      next: "/ambassador/dashboard/payouts",
    });

    redirect(`/login?${loginParams.toString()}`);
  }

  const ambassador = await getAmbassadorForUser(user.id, user.email);

  if (!ambassador?.id) {
    redirect("/login/route?preferred=ambassador");
  }

  try {
    let accountId = getStripeAccountId(ambassador);

    if (!accountId) {
      accountId = await createStripeAccount({
        userEmail: user.email,
        ambassador,
      });

      const initialAccount = await retrieveStripeAccount(accountId);

      if (initialAccount) {
        await updateAmbassadorStripeFields({
          ambassador,
          accountId,
          account: initialAccount,
        });
      } else {
        const { error: saveError } = await supabaseAdmin
          .from("ambassadors")
          .update({
            stripe_account_id: accountId,
            stripe_connect_account_id: accountId,
            stripe_account_status: "onboarding_started",
            updated_at: new Date().toISOString(),
          })
          .eq("id", ambassador.id);

        if (saveError) {
          console.error(
            "Unable to save new Ambassador Stripe account:",
            saveError.message,
          );
          redirect(
            "/ambassador/dashboard/payouts?stripe_error=account_save_failed",
          );
        }
      }
    }

    const onboardingUrl = await createStripeAccountLink(accountId);
    redirect(onboardingUrl);
  } catch (stripeError) {
    const code =
      stripeError instanceof Error
        ? stripeError.message
        : "stripe_request_failed";

    redirect(
      `/ambassador/dashboard/payouts?stripe_error=${encodeURIComponent(
        code,
      )}`,
    );
  }
}

function StatusPill({
  readiness,
}: {
  readiness: PayoutReadiness;
}) {
  if (readiness.ready && readiness.liveVerified) {
    return (
      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black !text-emerald-700">
        Live Stripe status: payout ready
      </span>
    );
  }

  if (readiness.ready) {
    return (
      <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-black !text-sky-700">
        Saved status: payout ready
      </span>
    );
  }

  return (
    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black !text-amber-700">
      Payout setup needed
    </span>
  );
}

function SetupStep({
  number,
  title,
  detail,
  complete,
}: {
  number: string;
  title: string;
  detail: string;
  complete: boolean;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-emerald-100 bg-white px-4 py-3 shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-black !text-emerald-800">
        {complete ? <CheckCircle2 className="h-5 w-5" /> : number}
      </div>

      <div>
        <p className="text-sm font-black !text-slate-950">{title}</p>
        <p className="mt-1 text-xs font-bold leading-5 !text-slate-600">
          {detail}
        </p>
      </div>
    </div>
  );
}

function RewardStatusPill({
  reward,
}: {
  reward: NormalizedReward;
}) {
  const classes =
    reward.bucket === "paid"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : reward.bucket === "approved"
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : reward.bucket === "excluded"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${classes}`}
    >
      {reward.status}
    </span>
  );
}

function RewardList({
  title,
  description,
  rewards,
  total,
  emptyMessage,
  icon,
}: {
  title: string;
  description: string;
  rewards: NormalizedReward[];
  total: number;
  emptyMessage: string;
  icon: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
            {icon}
          </div>

          <div>
            <h2 className="text-xl font-black !text-slate-950">
              {title}
            </h2>
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
            {rewards.length} record{rewards.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {rewards.length > 0 ? (
        <div className="mt-5 grid gap-3">
          {rewards.map((reward) => (
            <article
              key={reward.id}
              className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-base font-black !text-slate-950">
                    {reward.rewardType}
                  </p>
                  <p className="mt-1 break-words text-xs font-semibold !text-slate-500">
                    {reward.date} · {reward.source}
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 !text-slate-700">
                    {reward.note}
                  </p>
                </div>

                <div className="shrink-0 text-left sm:text-right">
                  <p className="text-2xl font-black !text-emerald-700">
                    {money(reward.amount)}
                  </p>
                  <div className="mt-2">
                    <RewardStatusPill reward={reward} />
                  </div>
                </div>
              </div>
            </article>
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

function getStripeErrorMessage(code: string) {
  if (!code) return "";

  if (code === "stripe_not_configured") {
    return "Stripe payout setup is temporarily unavailable because SitGuru’s Stripe configuration is incomplete.";
  }

  if (code === "account_save_failed") {
    return "Stripe created an account, but SitGuru could not save the account connection. Please contact support before trying again.";
  }

  return "Stripe could not open the payout setup flow. Please try again or contact SitGuru Support.";
}

export default async function AmbassadorPayoutsPage({
  searchParams,
}: {
  searchParams?: Promise<PayoutSearchParams>;
}) {
  const queryParams = (await searchParams) || {};
  const stripeReturn = firstParam(queryParams.stripe);
  const stripeErrorCode = firstParam(queryParams.stripe_error);

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const loginParams = new URLSearchParams({
      mode: "phone",
      role: "ambassador",
      next: "/ambassador/dashboard/payouts",
    });

    redirect(`/login?${loginParams.toString()}`);
  }

  const ambassador = await getAmbassadorForUser(user.id, user.email);

  if (!ambassador?.id) {
    redirect("/login/route?preferred=ambassador");
  }

  const accountId = getStripeAccountId(ambassador);
  const [stripeAccount, rewardsResult] = await Promise.all([
    retrieveStripeAccount(accountId),
    getCanonicalRewards(ambassador.id),
  ]);

  if (accountId && stripeAccount) {
    await updateAmbassadorStripeFields({
      ambassador,
      accountId,
      account: stripeAccount,
    });
  }

  const payoutReadiness = getPayoutReadiness({
    ambassador,
    stripeAccount,
  });
  const rewards = normalizeRewards(rewardsResult.rows);
  const approvedRewards = rewards.filter(
    (reward) => reward.bucket === "approved",
  );
  const paidRewards = rewards.filter(
    (reward) => reward.bucket === "paid",
  );
  const pendingRewards = rewards.filter(
    (reward) => reward.bucket === "pending",
  );
  const excludedRewards = rewards.filter(
    (reward) => reward.bucket === "excluded",
  );

  const approvedAmount = roundMoney(
    approvedRewards.reduce(
      (sum, reward) => sum + reward.amount,
      0,
    ),
  );
  const paidAmount = roundMoney(
    paidRewards.reduce((sum, reward) => sum + reward.amount, 0),
  );

  const stripeErrorMessage = getStripeErrorMessage(stripeErrorCode);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_42%,#ecfdf5_100%)] px-4 py-6 !text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Link
          href="/ambassador/dashboard/earnings"
          className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black !text-emerald-800 shadow-sm transition hover:bg-emerald-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Earnings
        </Link>

        {stripeErrorMessage ? (
          <section className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-4">
            <div className="flex items-start gap-3">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" />
              <p className="text-sm font-bold leading-6 text-rose-900">
                {stripeErrorMessage}
              </p>
            </div>
          </section>
        ) : null}

        {stripeReturn === "return" ? (
          <section className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
              <p className="text-sm font-bold leading-6 text-emerald-900">
                Stripe returned you to SitGuru and the account status was
                refreshed. Payout readiness below reflects the latest status
                SitGuru could verify.
              </p>
            </div>
          </section>
        ) : null}

        {stripeReturn === "refresh" ? (
          <section className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <p className="text-sm font-bold leading-6 text-amber-900">
                The Stripe onboarding link expired or setup was interrupted.
                Use the setup button below to open a new secure Stripe link.
              </p>
            </div>
          </section>
        ) : null}

        {rewardsResult.warning ? (
          <section className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <p className="text-sm font-bold leading-6 text-amber-900">
                {rewardsResult.warning}
              </p>
            </div>
          </section>
        ) : null}

        {payoutReadiness.warning ? (
          <section className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <p className="text-sm font-bold leading-6 text-amber-900">
                {payoutReadiness.warning}
              </p>
            </div>
          </section>
        ) : null}

        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="grid gap-8 bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.95),transparent_18%),linear-gradient(120deg,#b9f8df_0%,#d9f8ef_48%,#bde9ff_100%)] px-8 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center xl:px-10">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.26em] !text-emerald-800">
                Ambassador Payouts
              </p>

              <h1 className="mt-4 text-5xl font-black tracking-[-0.055em] !text-slate-950 md:text-6xl xl:text-7xl">
                Setup and payout history, clearly separated.
              </h1>

              <p className="mt-5 max-w-4xl text-base font-semibold leading-8 !text-slate-800 md:text-lg">
                Stripe setup controls whether SitGuru can send money. Canonical
                ambassador_rewards records control whether money is pending,
                approved, or paid. Stripe readiness never changes a reward to
                paid on this page.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <StatusPill readiness={payoutReadiness} />

                {accountId ? (
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black !text-slate-700">
                    Stripe account connected
                  </span>
                ) : null}

                <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-black !text-sky-700">
                  Approved waiting: {money(approvedAmount)}
                </span>

                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black !text-emerald-700">
                  Recorded paid: {money(paidAmount)}
                </span>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/70 bg-white/95 p-7 shadow-xl backdrop-blur">
              <div className="flex items-start gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-emerald-100 !text-emerald-700 ring-1 ring-emerald-200">
                  <Wallet className="h-8 w-8" />
                </div>

                <div>
                  <h2 className="text-2xl font-black tracking-tight !text-slate-950 md:text-3xl">
                    Current payout readiness
                  </h2>

                  <p className="mt-4 text-sm font-semibold leading-7 !text-slate-800">
                    {payoutReadiness.ready
                      ? payoutReadiness.liveVerified
                        ? "Stripe currently reports that onboarding is complete and payouts are enabled."
                        : "Saved SitGuru fields indicate that payout setup is complete, but the live Stripe status could not be confirmed."
                      : accountId
                        ? "A Stripe account is connected, but one or more payout requirements remain incomplete."
                        : "No Stripe payout account is connected yet."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-emerald-700" />
                <h2 className="text-2xl font-black !text-slate-950">
                  Stripe Setup Checklist
                </h2>
              </div>

              <div className="mt-5 grid gap-3">
                <SetupStep
                  number="1"
                  title="Connect Stripe Express"
                  detail="Create or continue the Stripe Express account assigned to this Ambassador record."
                  complete={Boolean(payoutReadiness.accountId)}
                />
                <SetupStep
                  number="2"
                  title="Complete identity and banking"
                  detail="Stripe may request legal identity, tax, address, phone, and bank-account information."
                  complete={payoutReadiness.detailsSubmitted}
                />
                <SetupStep
                  number="3"
                  title="Enable payouts"
                  detail="Stripe must report payouts enabled before SitGuru can process approved rewards."
                  complete={payoutReadiness.payoutsEnabled}
                />
              </div>

              {payoutReadiness.blockers.length > 0 ? (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-black text-amber-950">
                    Remaining setup items
                  </p>

                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs font-bold leading-5 text-amber-900">
                    {payoutReadiness.blockers.map((blocker) => (
                      <li key={blocker}>{blocker}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {payoutReadiness.currentlyDue.length > 0 ? (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-600">
                    Stripe currently due
                  </p>

                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs font-bold leading-5 text-slate-700">
                    {payoutReadiness.currentlyDue.map((item) => (
                      <li key={item}>
                        {titleCase(item.replace(/[._-]+/g, " "))}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <form action={startStripeOnboardingAction} className="mt-6">
                <button
                  type="submit"
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black !text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800"
                >
                  {accountId
                    ? "Continue or Review Stripe Setup"
                    : "Connect Stripe Now"}
                  <ExternalLink className="h-4 w-4" />
                </button>
              </form>

              <p className="mt-4 text-xs font-bold leading-5 !text-slate-600">
                Stripe onboarding links are short-lived and hosted by Stripe.
                Opening setup does not approve, pay, or change any Ambassador
                reward record.
              </p>
            </div>

            <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <HelpCircle className="mt-1 h-6 w-6 shrink-0 text-emerald-700" />

                <div>
                  <h2 className="text-xl font-black !text-emerald-950">
                    Need payout help?
                  </h2>

                  <p className="mt-2 text-sm font-semibold leading-6 !text-emerald-900">
                    SitGuru can explain your saved reward and payout status.
                    Stripe controls identity, tax, bank verification, and
                    connected-account requirements.
                  </p>

                  <Link
                    href="/ambassador/dashboard/messages?role=ambassador&support=admin"
                    className="mt-4 inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-black !text-emerald-800 shadow-sm ring-1 ring-emerald-200 transition hover:bg-emerald-100"
                  >
                    Message SitGuru Support
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] !text-emerald-700">
                  Ambassador guide
                </p>
                <h2 className="mt-1 text-3xl font-black tracking-tight !text-slate-950">
                  Stripe Setup Guide
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 !text-slate-700">
                  Review the SitGuru Ambassador Stripe guide before opening the
                  Stripe-hosted onboarding flow.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={GUIDE_IMAGE_PATH}
                  target="_blank"
                  className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black !text-emerald-800 transition hover:bg-emerald-50"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Guide
                </Link>

                <a
                  href={GUIDE_IMAGE_PATH}
                  download
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black !text-white transition hover:bg-emerald-800"
                >
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
              <Image
                src={GUIDE_IMAGE_PATH}
                alt="SitGuru Ambassador Stripe Setup Guide"
                width={900}
                height={1400}
                className="h-auto w-full"
                priority
              />
            </div>
          </section>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <RewardList
            title="Approved, Waiting for Payout"
            description="These canonical rewards are approved but are not displayed as paid."
            rewards={approvedRewards}
            total={approvedAmount}
            emptyMessage="No approved unpaid rewards are currently recorded."
            icon={<BadgeDollarSign className="h-5 w-5" />}
          />

          <RewardList
            title="Recorded Payout History"
            description="Only canonical rewards with an exact paid status or paid_at date appear here."
            rewards={paidRewards}
            total={paidAmount}
            emptyMessage="No paid Ambassador rewards are currently recorded."
            icon={<History className="h-5 w-5" />}
          />
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black !text-slate-950">
                Other reward records
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 !text-slate-700">
                Pending and excluded records remain outside approved balances
                and payout history.
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                  Pending: {pendingRewards.length}
                </span>
                <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-black text-rose-700">
                  Excluded: {excludedRewards.length}
                </span>
              </div>
            </div>

            <Link
              href="/ambassador/dashboard/earnings"
              className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black !text-emerald-800 transition hover:bg-emerald-100"
            >
              View Full Earnings Breakdown
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}