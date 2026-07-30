import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeDollarSign,
  CheckCircle2,
  Clock3,
  ExternalLink,
  History,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import PayoutDestinationInput from "./PayoutDestinationInput";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STRIPE_API_BASE = "https://api.stripe.com/v1";
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
  nextAction?: string | null;
  accounts?: AmbassadorPayoutAccount[];
  readyAccount?: AmbassadorPayoutAccount | null;
};

type AmbassadorPayoutSetupResponse = {
  success: boolean;
  message?: string;
  error?: string;
  setup?: AmbassadorPayoutSetup;
};

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
    normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL) ||
    normalizeBaseUrl(process.env.SITE_URL) ||
    normalizeBaseUrl(process.env.VERCEL_URL) ||
    "https://www.sitguru.com"
  );
}

async function callAmbassadorPayoutSetupApi({
  accessToken,
  method = "GET",
  provider,
  destinationType,
  destinationValue,
}: {
  accessToken: string;
  method?: "GET" | "PATCH";
  provider?: AmbassadorPayoutProvider;
  destinationType?: "email" | "mobile_number";
  destinationValue?: string;
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
                ...(destinationType ? { destinationType } : {}),
                ...(destinationValue ? { destinationValue } : {}),
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
        error: "SitGuru could not read your payout setup response.",
      };
    }

    if (!response.ok || !payload.success) {
      return {
        ...payload,
        success: false,
        error: payload.error || "SitGuru could not update your payout setup.",
      };
    }

    return payload;
  } catch (error) {
    console.error("Ambassador payout setup request failed:", error);

    return {
      success: false,
      error: "SitGuru could not connect to payout setup.",
    };
  }
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
      next: "/ambassador/dashboard/payouts?provider=stripe",
    });

    redirect(`/login?${loginParams.toString()}`);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect("/login/route?preferred=ambassador");
  }

  const preferenceResult = await callAmbassadorPayoutSetupApi({
    accessToken: session.access_token,
    method: "PATCH",
    provider: "stripe",
  });

  if (!preferenceResult.success) {
    console.error("Unable to save Ambassador Stripe preference:", {
      error: preferenceResult.error,
    });
    redirect(
      "/ambassador/dashboard/payouts?provider=stripe&payout_error=save",
    );
  }

  const ambassador = await getAmbassadorForUser(user.id, user.email);

  if (!ambassador?.id) {
    redirect("/login/route?preferred=ambassador");
  }

  let onboardingUrl = "";

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
          throw new Error("account_save_failed");
        }
      }
    }

    onboardingUrl = await createStripeAccountLink(accountId);
  } catch (stripeError) {
    const code =
      stripeError instanceof Error
        ? stripeError.message
        : "stripe_request_failed";

    redirect(
      `/ambassador/dashboard/payouts?provider=stripe&stripe_error=${encodeURIComponent(
        code,
      )}`,
    );
  }

  if (!onboardingUrl) {
    redirect(
      "/ambassador/dashboard/payouts?provider=stripe&stripe_error=stripe_request_failed",
    );
  }

  // Next.js redirect throws internally, so keep it outside the try/catch.
  redirect(onboardingUrl);
}

async function saveQuickPayoutDestinationAction(formData: FormData) {
  "use server";

  const requestedProvider = asString(formData.get("provider")).toLowerCase();
  const provider =
    requestedProvider === "paypal" || requestedProvider === "venmo"
      ? requestedProvider
      : null;
  const destinationValue = asString(formData.get("destinationValue"));

  if (!provider) {
    redirect("/ambassador/dashboard/payouts?payout_error=provider");
  }

  if (!destinationValue) {
    redirect(
      `/ambassador/dashboard/payouts?provider=${provider}&payout_error=missing`,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
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
    destinationType: provider === "paypal" ? "email" : "mobile_number",
    destinationValue,
  });

  revalidatePath("/ambassador/dashboard/earnings");
  revalidatePath("/ambassador/dashboard/payouts");

  if (!result.success) {
    console.error("Ambassador payout destination save failed:", {
      provider,
      error: result.error,
    });
    redirect(
      `/ambassador/dashboard/payouts?provider=${provider}&payout_error=save`,
    );
  }

  redirect(
    `/ambassador/dashboard/payouts?provider=${provider}&saved=${provider}`,
  );
}

function normalizeProvider(
  value: string,
): Exclude<AmbassadorPayoutProvider, "set_up_later"> | null {
  if (value === "stripe" || value === "paypal" || value === "venmo") {
    return value;
  }

  return null;
}

function providerLabel(
  provider: Exclude<AmbassadorPayoutProvider, "set_up_later">,
) {
  if (provider === "stripe") return "Bank or card";
  if (provider === "paypal") return "PayPal";
  return "Venmo";
}

function providerLogo(
  provider: Exclude<AmbassadorPayoutProvider, "set_up_later">,
) {
  if (provider === "stripe") return "/images/payments/stripe.svg";
  if (provider === "paypal") return "/images/payments/paypal.svg";
  return "/images/payments/venmo.svg";
}

function payoutDestination(account?: AmbassadorPayoutAccount | null) {
  if (!account) return "";
  return (
    account.providerEmail ||
    account.providerPhone ||
    account.providerAccountId ||
    ""
  );
}

function QuickProviderCard({
  provider,
  selected,
  title,
  subtitle,
}: {
  provider: Exclude<AmbassadorPayoutProvider, "set_up_later">;
  selected: boolean;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={`/ambassador/dashboard/payouts?provider=${provider}`}
      className={`group flex min-h-[116px] items-center gap-4 rounded-[1.35rem] border p-4 transition active:scale-[0.99] ${
        selected
          ? "border-emerald-400 bg-emerald-50 shadow-[0_12px_30px_rgba(5,150,105,0.12)] ring-2 ring-emerald-100"
          : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/50"
      }`}
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200">
        <Image
          src={providerLogo(provider)}
          alt=""
          width={72}
          height={32}
          className="max-h-8 w-auto object-contain"
        />
      </span>

      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-base font-black !text-slate-950 sm:text-lg">
            {title}
          </span>
          {selected ? (
            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] !text-white">
              Selected
            </span>
          ) : null}
        </span>
        <span className="mt-1 block text-sm font-semibold leading-5 !text-slate-600">
          {subtitle}
        </span>
      </span>

      <ArrowRight className="ml-auto h-5 w-5 shrink-0 !text-emerald-700 transition group-hover:translate-x-0.5" />
    </Link>
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
  total,
  rewards,
  emptyMessage,
  icon,
}: {
  title: string;
  total: number;
  rewards: NormalizedReward[];
  emptyMessage: string;
  icon: ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 !text-emerald-700 ring-1 ring-emerald-100">
            {icon}
          </span>
          <h2 className="truncate text-xl font-black !text-slate-950">
            {title}
          </h2>
        </div>
        <p className="shrink-0 text-2xl font-black !text-slate-950">
          {money(total)}
        </p>
      </div>

      {rewards.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {rewards.map((reward) => (
            <article
              key={reward.id}
              className="rounded-[1.2rem] border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black !text-slate-950">
                    {reward.rewardType}
                  </p>
                  <p className="mt-1 text-xs font-semibold !text-slate-500">
                    {reward.date}
                  </p>
                </div>
                <p className="shrink-0 text-lg font-black !text-emerald-700">
                  {money(reward.amount)}
                </p>
              </div>
              <div className="mt-3">
                <RewardStatusPill reward={reward} />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-[1.2rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
          <p className="text-sm font-bold !text-slate-600">{emptyMessage}</p>
        </div>
      )}
    </section>
  );
}

function getStripeErrorMessage(code: string) {
  if (!code) return "";

  if (code === "stripe_not_configured") {
    return "Bank payout setup is temporarily unavailable.";
  }

  if (code === "account_save_failed") {
    return "Your Stripe account opened, but SitGuru could not save it.";
  }

  return "Stripe could not open. Please try again.";
}

function getPayoutErrorMessage(code: string) {
  if (!code) return "";
  if (code === "missing") return "Add your payout email or mobile number.";
  if (code === "provider") return "Choose a payout option.";
  return "That did not save. Check the information and try again.";
}

export default async function AmbassadorPayoutsPage({
  searchParams,
}: {
  searchParams?: Promise<PayoutSearchParams>;
}) {
  const queryParams = (await searchParams) || {};
  const requestedProvider = normalizeProvider(
    firstParam(queryParams.provider).toLowerCase(),
  );
  const stripeReturn = firstParam(queryParams.stripe);
  const stripeErrorCode = firstParam(queryParams.stripe_error);
  const payoutErrorCode = firstParam(queryParams.payout_error);
  const savedProvider = normalizeProvider(
    firstParam(queryParams.saved).toLowerCase(),
  );

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

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accountId = getStripeAccountId(ambassador);
  const [stripeAccount, rewardsResult, payoutSetupResponse] = await Promise.all([
    retrieveStripeAccount(accountId),
    getCanonicalRewards(ambassador.id),
    session?.access_token
      ? callAmbassadorPayoutSetupApi({
          accessToken: session.access_token,
        })
      : Promise.resolve({
          success: false,
          error: "Your payout session could not be loaded.",
        } satisfies AmbassadorPayoutSetupResponse),
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
  const payoutSetup = payoutSetupResponse.success
    ? payoutSetupResponse.setup || null
    : null;
  const storedProvider = normalizeProvider(
    payoutSetup?.selectedProvider || "",
  );
  const selectedProvider =
    requestedProvider || storedProvider || "stripe";
  const readyAccount = payoutSetup?.readyAccount || null;
  const readyProvider = readyAccount?.provider
    ? normalizeProvider(readyAccount.provider)
    : null;

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
    approvedRewards.reduce((sum, reward) => sum + reward.amount, 0),
  );
  const paidAmount = roundMoney(
    paidRewards.reduce((sum, reward) => sum + reward.amount, 0),
  );

  const stripeErrorMessage = getStripeErrorMessage(stripeErrorCode);
  const payoutErrorMessage = getPayoutErrorMessage(payoutErrorCode);
  const defaultPayPalEmail =
    asString(user.email) ||
    asString(ambassador.login_email) ||
    asString(ambassador.contact_email) ||
    asString(ambassador.email);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f7fffb_48%,#ecfdf5_100%)] px-3 py-4 !text-slate-950 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/ambassador/dashboard/earnings"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black !text-emerald-800 shadow-sm transition hover:bg-emerald-50"
          >
            <ArrowLeft className="h-4 w-4" />
            My Earnings
          </Link>

          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black !text-slate-600 shadow-sm ring-1 ring-slate-200">
            <ShieldCheck className="h-4 w-4 !text-emerald-600" />
            Secure payout setup
          </span>
        </div>

        {stripeErrorMessage || payoutErrorMessage ? (
          <section className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 !text-rose-700" />
              <p className="text-sm font-bold !text-rose-900">
                {stripeErrorMessage || payoutErrorMessage}
              </p>
            </div>
          </section>
        ) : null}

        {savedProvider ? (
          <section
            role="status"
            className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 !text-emerald-700" />
              <p className="text-sm font-bold !text-emerald-900">
                {providerLabel(savedProvider)} saved. SitGuru will verify it
                before your first payout.
              </p>
            </div>
          </section>
        ) : null}

        {stripeReturn === "return" ? (
          <section
            role="status"
            className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 !text-emerald-700" />
              <p className="text-sm font-bold !text-emerald-900">
                Stripe status refreshed.
              </p>
            </div>
          </section>
        ) : null}

        {stripeReturn === "refresh" ? (
          <section className="rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 !text-amber-700" />
              <p className="text-sm font-bold !text-amber-900">
                Your Stripe link expired. Tap connect to open a fresh one.
              </p>
            </div>
          </section>
        ) : null}

        <section className="overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <div className="grid gap-5 bg-[radial-gradient(circle_at_90%_10%,rgba(255,255,255,0.95),transparent_22%),linear-gradient(120deg,#c9f9e6_0%,#e2fbf2_50%,#d7efff_100%)] p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] !text-emerald-700">
                My payout
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.045em] !text-slate-950 sm:text-4xl lg:text-5xl">
                Get paid your way.
              </h1>
              <p className="mt-2 text-sm font-semibold !text-slate-700 sm:text-base">
                Pick one. Switch anytime.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex">
              <div className="rounded-2xl bg-white/95 px-4 py-3 shadow-sm ring-1 ring-white">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] !text-slate-500">
                  Ready
                </p>
                <p className="mt-1 text-xl font-black !text-slate-950">
                  {money(approvedAmount)}
                </p>
              </div>
              <div className="rounded-2xl bg-white/95 px-4 py-3 shadow-sm ring-1 ring-white">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] !text-slate-500">
                  Paid
                </p>
                <p className="mt-1 text-xl font-black !text-emerald-700">
                  {money(paidAmount)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {payoutSetup?.setupComplete && readyAccount && readyProvider ? (
          <section className="rounded-[1.4rem] border border-emerald-300 bg-emerald-50 p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white p-2 ring-1 ring-emerald-200">
                  <Image
                    src={providerLogo(readyProvider)}
                    alt=""
                    width={72}
                    height={32}
                    className="max-h-7 w-auto object-contain"
                  />
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-base font-black !text-emerald-950">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    Ready to get paid
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold !text-emerald-800">
                    {providerLabel(readyProvider)}
                    {payoutDestination(readyAccount)
                      ? ` · ${payoutDestination(readyAccount)}`
                      : ""}
                  </p>
                </div>
              </div>
              <p className="text-sm font-black !text-emerald-800">
                You can still switch below.
              </p>
            </div>
          </section>
        ) : null}

        {!payoutSetupResponse.success ? (
          <section className="rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-bold !text-amber-900">
              {payoutSetupResponse.error ||
                "Your saved payout choice could not be loaded."}
            </p>
          </section>
        ) : null}

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="grid gap-3 lg:grid-cols-3">
            <QuickProviderCard
              provider="stripe"
              selected={selectedProvider === "stripe"}
              title="Bank or card"
              subtitle="Secure setup with Stripe"
            />
            <QuickProviderCard
              provider="paypal"
              selected={selectedProvider === "paypal"}
              title="PayPal"
              subtitle="Use your PayPal email"
            />
            <QuickProviderCard
              provider="venmo"
              selected={selectedProvider === "venmo"}
              title="Venmo"
              subtitle="Use your U.S. mobile number"
            />
          </div>

          <div className="mt-4 overflow-hidden rounded-[1.45rem] border border-emerald-200 bg-[linear-gradient(135deg,#f0fdf7_0%,#ffffff_72%)] p-4 sm:p-6">
            {selectedProvider === "stripe" ? (
              <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="flex items-start gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200">
                    <Image
                      src="/images/payments/stripe.svg"
                      alt="Stripe"
                      width={76}
                      height={32}
                      className="max-h-8 w-auto object-contain"
                    />
                  </span>
                  <div>
                    <h2 className="text-xl font-black !text-slate-950 sm:text-2xl">
                      Bank or card
                    </h2>
                    <p className="mt-1 text-sm font-semibold !text-slate-600">
                      Tap once, then finish securely with Stripe.
                    </p>
                    <p className="mt-2 text-xs font-bold !text-slate-500">
                      {payoutReadiness.ready
                        ? "Your Stripe payout account is ready."
                        : accountId
                          ? "Your Stripe setup still needs attention."
                          : "No bank payout account connected yet."}
                    </p>
                  </div>
                </div>

                <form action={startStripeOnboardingAction}>
                  <button
                    type="submit"
                    className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-emerald-700 px-6 py-3 text-sm font-black !text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 active:scale-[0.99] lg:w-auto"
                  >
                    {accountId ? "Continue Stripe" : "Connect Stripe"}
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </form>
              </div>
            ) : (
              <form
                action={saveQuickPayoutDestinationAction}
                className="grid gap-4 lg:grid-cols-[1fr_minmax(260px,420px)_auto] lg:items-end"
              >
                <input
                  type="hidden"
                  name="provider"
                  value={selectedProvider}
                />

                <div className="flex items-start gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200">
                    {selectedProvider === "venmo" ? (
                      <Smartphone className="h-7 w-7 !text-sky-600" />
                    ) : (
                      <Image
                        src="/images/payments/paypal.svg"
                        alt="PayPal"
                        width={76}
                        height={32}
                        className="max-h-8 w-auto object-contain"
                      />
                    )}
                  </span>
                  <div>
                    <h2 className="text-xl font-black !text-slate-950 sm:text-2xl">
                      {selectedProvider === "paypal" ? "PayPal" : "Venmo"}
                    </h2>
                    <p className="mt-1 text-sm font-semibold !text-slate-600">
                      {selectedProvider === "paypal"
                        ? "Add the email on your PayPal account."
                        : "Add the U.S. mobile number on your Venmo account."}
                    </p>
                  </div>
                </div>

                <PayoutDestinationInput
                  key={selectedProvider}
                  provider={selectedProvider}
                  defaultPayPalEmail={defaultPayPalEmail}
                />

                <button
                  type="submit"
                  className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-emerald-700 px-6 py-3 text-sm font-black !text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 active:scale-[0.99] lg:w-auto"
                >
                  Save {selectedProvider === "paypal" ? "PayPal" : "Venmo"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-[1.25rem] bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 shrink-0 !text-amber-500" />
              <p className="text-sm font-bold !text-slate-700">
                One choice. One quick setup. Then keep earning.
              </p>
            </div>
            <Link
              href="/ambassador/dashboard/earnings"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-black !text-slate-700 transition hover:bg-slate-100"
            >
              Do this later
            </Link>
          </div>
        </section>

        {rewardsResult.warning ? (
          <section className="rounded-[1.25rem] border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-bold !text-amber-900">
              {rewardsResult.warning}
            </p>
          </section>
        ) : null}

        <section className="grid gap-5 lg:grid-cols-2">
          <RewardList
            title="Ready to pay"
            total={approvedAmount}
            rewards={approvedRewards}
            emptyMessage="No rewards ready yet."
            icon={<BadgeDollarSign className="h-5 w-5" />}
          />
          <RewardList
            title="Paid"
            total={paidAmount}
            rewards={paidRewards}
            emptyMessage="No payouts yet."
            icon={<History className="h-5 w-5" />}
          />
        </section>

        <section className="rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black !text-amber-700">
                Pending: {pendingRewards.length}
              </span>
              <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-black !text-rose-700">
                Not eligible: {excludedRewards.length}
              </span>
            </div>

            <Link
              href="/ambassador/dashboard/earnings"
              className="inline-flex items-center gap-2 text-sm font-black !text-emerald-700"
            >
              Full earnings
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}