import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

type JsonRecord = Record<string, unknown>;
type PayPalEnvironment = "sandbox" | "live";
type FinancialRole = "guru" | "ambassador";

type AuthenticatedUser = {
  id: string;
  email: string | null;
};

type PayPalConfig = {
  environment: PayPalEnvironment;
  clientId: string;
  clientSecret: string;
  attributionId: string;
  partnerMerchantId: string;
  apiBaseUrl: string;
};

type AccessTokenCache = {
  cacheKey: string;
  token: string;
  expiresAt: number;
};

type PayPalLink = {
  href?: string;
  rel?: string;
  method?: string;
};

type PartnerReferralResponse = {
  links?: PayPalLink[];
  [key: string]: unknown;
};

type SellerIntegrationStatus = {
  merchant_id?: string;
  tracking_id?: string;
  payments_receivable?: boolean;
  primary_email_confirmed?: boolean;
  primary_email?: string;
  legal_name?: string;
  country?: string;
  country_code?: string;
  oauth_third_party?: unknown;
  products?: unknown[];
  capabilities?: unknown[];
  [key: string]: unknown;
};

type OnboardingState = {
  merchantId: string;
  providerEmail: string;
  ready: boolean;
  restricted: boolean;
  detailsSubmitted: boolean;
  paymentsReceivable: boolean;
  emailConfirmed: boolean;
  permissionsGranted: boolean;
  onboardingStatus:
    | "not_started"
    | "in_progress"
    | "pending_review"
    | "ready"
    | "restricted"
    | "disabled";
  accountStatus:
    | "pending"
    | "active"
    | "restricted"
    | "disabled"
    | "disconnected";
  countryCode: string;
  requirementsCurrentlyDue: string[];
  capabilities: JsonRecord;
  rawStatus: SellerIntegrationStatus | null;
  returnMetadata?: JsonRecord;
};

const LOCAL_ORIGINS = new Set([
  "http://localhost:3000",
  "http://localhost:8081",
  "http://localhost:8082",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:8081",
  "http://127.0.0.1:8082",
]);

const PAYPAL_FEATURES = [
  "PAYMENT",
  "REFUND",
  "PARTNER_FEE",
  "DELAY_FUNDS_DISBURSEMENT",
  "ACCESS_MERCHANT_INFORMATION",
  "READ_SELLER_DISPUTE",
  "UPDATE_SELLER_DISPUTE",
  "ADVANCED_TRANSACTIONS_SEARCH",
] as const;

let accessTokenCache: AccessTokenCache | null = null;

function asRecord(value: unknown): JsonRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as JsonRecord;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asTrimmedString(value: unknown) {
  if (typeof value === "string") return value.trim();

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
}

function firstNonEmpty(...values: unknown[]) {
  for (const value of values) {
    const text = asTrimmedString(value);

    if (text) return text;
  }

  return "";
}

function asBoolean(value: unknown) {
  if (typeof value === "boolean") return value;

  const normalized = asTrimmedString(value).toLowerCase();

  return ["true", "1", "yes", "y"].includes(normalized);
}

function hasMeaningfulValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") {
    return Object.keys(value as JsonRecord).length > 0;
  }

  return Boolean(asTrimmedString(value));
}

function normalizeEnvironment(value: unknown): PayPalEnvironment {
  const normalized = asTrimmedString(value).toLowerCase();

  return normalized === "live" ||
    normalized === "production" ||
    normalized === "prod"
    ? "live"
    : "sandbox";
}

function getPayPalConfig(): PayPalConfig | null {
  const environment = normalizeEnvironment(
    process.env.PAYPAL_ENVIRONMENT || process.env.PAYPAL_MODE,
  );

  const clientId = firstNonEmpty(
    environment === "live" ? process.env.PAYPAL_LIVE_CLIENT_ID : "",
    environment === "sandbox" ? process.env.PAYPAL_SANDBOX_CLIENT_ID : "",
    process.env.PAYPAL_CLIENT_ID,
  );

  const clientSecret = firstNonEmpty(
    environment === "live" ? process.env.PAYPAL_LIVE_CLIENT_SECRET : "",
    environment === "sandbox"
      ? process.env.PAYPAL_SANDBOX_CLIENT_SECRET
      : "",
    process.env.PAYPAL_CLIENT_SECRET,
  );

  const attributionId = firstNonEmpty(
    environment === "live"
      ? process.env.PAYPAL_LIVE_PARTNER_ATTRIBUTION_ID
      : "",
    environment === "sandbox"
      ? process.env.PAYPAL_SANDBOX_PARTNER_ATTRIBUTION_ID
      : "",
    process.env.PAYPAL_PARTNER_ATTRIBUTION_ID,
    process.env.PAYPAL_BN_CODE,
  );

  const partnerMerchantId = firstNonEmpty(
    environment === "live"
      ? process.env.PAYPAL_LIVE_PARTNER_MERCHANT_ID
      : "",
    environment === "sandbox"
      ? process.env.PAYPAL_SANDBOX_PARTNER_MERCHANT_ID
      : "",
    process.env.PAYPAL_PARTNER_MERCHANT_ID,
  );

  const apiBaseUrl = firstNonEmpty(
    process.env.PAYPAL_API_BASE_URL,
    environment === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com",
  ).replace(/\/+$/, "");

  if (!clientId || !clientSecret || !attributionId) {
    return null;
  }

  return {
    environment,
    clientId,
    clientSecret,
    attributionId,
    partnerMerchantId,
    apiBaseUrl,
  };
}

function normalizeOrigin(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function isAllowedOrigin(origin: string) {
  const normalized = normalizeOrigin(origin);

  if (LOCAL_ORIGINS.has(normalized)) return true;

  try {
    const url = new URL(normalized);

    return (
      url.protocol === "https:" &&
      (url.hostname === "sitguru.com" ||
        url.hostname.endsWith(".sitguru.com"))
    );
  } catch {
    return false;
  }
}

function corsHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {
    "Cache-Control": "no-store, max-age=0",
    Vary: "Origin",
  };

  const origin = req.headers.get("origin") || "";

  if (!origin || !isAllowedOrigin(origin)) {
    return headers;
  }

  headers["Access-Control-Allow-Credentials"] = "true";
  headers["Access-Control-Allow-Headers"] =
    "Authorization, Content-Type, X-Requested-With";
  headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
  headers["Access-Control-Allow-Origin"] = origin;

  return headers;
}

function json(
  req: NextRequest,
  body: Record<string, unknown>,
  status = 200,
) {
  return NextResponse.json(body, {
    status,
    headers: corsHeaders(req),
  });
}

function getRequestOrigin(req: NextRequest) {
  const configuredOrigin = firstNonEmpty(
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.APP_URL,
  );

  if (configuredOrigin) {
    try {
      return new URL(configuredOrigin).origin;
    } catch {
      console.warn("Ignoring invalid configured SitGuru site URL.");
    }
  }

  return req.nextUrl.origin;
}

function maskIdentifier(value: unknown) {
  const text = asTrimmedString(value);

  if (!text) return null;
  if (text.length <= 6) return `${text.slice(0, 1)}***`;

  return `${text.slice(0, 3)}***${text.slice(-3)}`;
}

function maskEmail(value: unknown) {
  const email = asTrimmedString(value);
  const [local, domain] = email.split("@");

  if (!local || !domain) return email ? "***" : null;

  return `${local.slice(0, 1)}***@${domain}`;
}

function getMissingColumnName(errorMessage: string) {
  const quotedColumnMatch = errorMessage.match(/'([^']+)' column/i);
  if (quotedColumnMatch?.[1]) return quotedColumnMatch[1];

  const columnDoesNotExistMatch = errorMessage.match(
    /column "([^"]+)" does not exist/i,
  );
  if (columnDoesNotExistMatch?.[1]) return columnDoesNotExistMatch[1];

  const schemaCacheMatch = errorMessage.match(
    /Could not find the '([^']+)' column/i,
  );
  if (schemaCacheMatch?.[1]) return schemaCacheMatch[1];

  return null;
}

async function getAuthenticatedUser(
  req: NextRequest,
): Promise<AuthenticatedUser | null> {
  const authorization = req.headers.get("authorization") || "";
  const bearerMatch = authorization.match(/^Bearer\s+(.+)$/i);

  if (bearerMatch?.[1]) {
    const { data, error } = await supabaseAdmin.auth.getUser(
      bearerMatch[1].trim(),
    );

    if (error || !data.user) return null;

    return {
      id: data.user.id,
      email: data.user.email || null,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  return {
    id: user.id,
    email: user.email || null,
  };
}

function normalizeRole(value: unknown): FinancialRole | null {
  const normalized = asTrimmedString(value).toLowerCase();

  if (normalized === "guru" || normalized === "pet_guru") return "guru";
  if (normalized === "ambassador") return "ambassador";

  return null;
}

async function getFinancialRoles(userId: string) {
  const roles = new Set<FinancialRole>();

  const { data: roleRows, error: roleError } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (!roleError) {
    for (const row of roleRows || []) {
      const role = normalizeRole(row.role);
      if (role) roles.add(role);
    }
  } else {
    console.warn("PayPal onboarding role lookup warning:", roleError.message);
  }

  if (!roles.has("guru")) {
    const guruColumns = ["user_id", "profile_id"];

    for (const column of guruColumns) {
      const { data, error } = await supabaseAdmin
        .from("gurus")
        .select("id")
        .eq(column, userId)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        roles.add("guru");
        break;
      }
    }
  }

  return [...roles];
}

async function getAccessToken(config: PayPalConfig) {
  const cacheKey = `${config.environment}:${config.clientId}`;
  const now = Date.now();

  if (
    accessTokenCache?.cacheKey === cacheKey &&
    accessTokenCache.expiresAt > now + 60_000
  ) {
    return accessTokenCache.token;
  }

  const basicAuthorization = Buffer.from(
    `${config.clientId}:${config.clientSecret}`,
  ).toString("base64");

  const response = await fetch(`${config.apiBaseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${basicAuthorization}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  const text = await response.text();
  let payload: JsonRecord | null = null;

  try {
    payload = text ? (JSON.parse(text) as JsonRecord) : null;
  } catch {
    payload = null;
  }

  const accessToken = firstNonEmpty(payload?.access_token);
  const expiresIn = Number(payload?.expires_in || 0);

  if (!response.ok || !accessToken) {
    console.error("PayPal access-token request failed:", {
      status: response.status,
      payload,
    });

    throw new Error(
      firstNonEmpty(
        payload?.error_description,
        payload?.message,
        "PayPal authentication failed.",
      ),
    );
  }

  accessTokenCache = {
    cacheKey,
    token: accessToken,
    expiresAt: now + Math.max(300, expiresIn) * 1000,
  };

  return accessToken;
}

async function paypalRequest({
  config,
  accessToken,
  url,
  method = "GET",
  body,
}: {
  config: PayPalConfig;
  accessToken: string;
  url: string;
  method?: "GET" | "POST";
  body?: JsonRecord;
}) {
  const response = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Partner-Attribution-Id": config.attributionId,
      "PayPal-Request-Id": randomUUID(),
      Prefer: "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const text = await response.text();
  let payload: JsonRecord | null = null;

  try {
    payload = text ? (JSON.parse(text) as JsonRecord) : null;
  } catch {
    payload = text ? { message: text } : null;
  }

  if (!response.ok) {
    console.error("PayPal onboarding API request failed:", {
      method,
      url,
      status: response.status,
      debugId: payload?.debug_id || null,
      payload,
    });

    throw new Error(
      firstNonEmpty(
        payload?.message,
        asArray(payload?.details)
          .map((detail) => firstNonEmpty(asRecord(detail)?.description))
          .filter(Boolean)
          .join(" "),
        `PayPal returned HTTP ${response.status}.`,
      ),
    );
  }

  return payload || {};
}

function getLink(payload: JsonRecord | null, relation: string) {
  const links = asArray(payload?.links);

  for (const item of links) {
    const link = asRecord(item);

    if (firstNonEmpty(link?.rel).toLowerCase() === relation.toLowerCase()) {
      return firstNonEmpty(link?.href);
    }
  }

  return "";
}

function getReferralId(selfUrl: string) {
  if (!selfUrl) return "";

  try {
    const url = new URL(selfUrl);
    return url.pathname.split("/").filter(Boolean).at(-1) || "";
  } catch {
    return "";
  }
}

async function findPayPalAccount(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_payout_accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", "paypal")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("PayPal payout-account lookup failed:", error);
    return {
      account: null as JsonRecord | null,
      anyDefault: false,
    };
  }

  const rows = (data || []) as JsonRecord[];
  const account =
    rows.find((row) => row.account_purpose === "guru_marketplace_seller") ||
    rows.find((row) => row.workspace_role === "guru") ||
    rows[0] ||
    null;

  return {
    account,
    anyDefault: rows.some(
      (row) => row.is_default === true || row.is_primary === true,
    ),
  };
}

async function findPayoutPreference(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_payout_preferences")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    console.error("PayPal payout-preference lookup failed:", error);
    return null;
  }

  const rows = (data || []) as JsonRecord[];

  return (
    rows.find((row) => row.workspace_role === "guru") || rows[0] || null
  );
}

async function safeWriteRow({
  table,
  existingId,
  payload,
}: {
  table: "user_payout_accounts" | "user_payout_preferences";
  existingId: string;
  payload: JsonRecord;
}) {
  const writePayload = { ...payload };

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const result = existingId
      ? await supabaseAdmin
          .from(table)
          .update(writePayload)
          .eq("id", existingId)
          .select("*")
          .maybeSingle()
      : await supabaseAdmin.from(table).insert(writePayload).select("*").single();

    if (!result.error) {
      return (result.data as JsonRecord | null) || writePayload;
    }

    const missingColumn = getMissingColumnName(result.error.message || "");

    if (missingColumn && missingColumn in writePayload) {
      console.warn(
        `Removing missing ${table} column and retrying:`,
        missingColumn,
      );
      delete writePayload[missingColumn];
      continue;
    }

    console.error(`PayPal ${table} write failed:`, result.error);
    throw new Error(result.error.message);
  }

  throw new Error(`SitGuru could not save ${table}.`);
}

async function savePayoutPreference({
  userId,
  roles,
  ready,
  restricted,
  now,
  metadata,
}: {
  userId: string;
  roles: FinancialRole[];
  ready: boolean;
  restricted: boolean;
  now: string;
  metadata: JsonRecord;
}) {
  const existing = await findPayoutPreference(userId);
  const existingMetadata = asRecord(existing?.metadata) || {};
  const roleContext =
    roles.includes("guru") && roles.includes("ambassador")
      ? "multi_role"
      : "guru";

  return safeWriteRow({
    table: "user_payout_preferences",
    existingId: firstNonEmpty(existing?.id),
    payload: {
      user_id: userId,

      role_context: roleContext,
      booking_payout_provider: "paypal",
      booking_setup_requirement: "before_first_paid_booking",
      financial_onboarding_status: restricted
        ? "restricted"
        : ready
          ? "ready"
          : "in_progress",
      onboarding_deferred: false,
      selected_at: existing?.selected_at || now,
      setup_started_at: existing?.setup_started_at || now,
      setup_completed_at: ready ? now : null,
      last_verified_at: ready ? now : null,
      can_accept_paid_bookings: ready,

      workspace_role: "guru",
      preferred_provider: "paypal",
      setup_timing: "before_first_paid_booking",
      allow_setup_later: true,
      setup_required: !ready,
      setup_completed: ready,

      metadata: {
        ...existingMetadata,
        ...metadata,
        preference_source: "paypal_partner_referrals",
        last_paypal_onboarding_update_at: now,
      },
      updated_at: now,
      created_at: existing?.created_at || now,
    },
  });
}

async function savePayoutAccount({
  userId,
  roles,
  state,
  metadata,
}: {
  userId: string;
  roles: FinancialRole[];
  state: OnboardingState;
  metadata: JsonRecord;
}) {
  const now = new Date().toISOString();
  const { account: existing, anyDefault } = await findPayPalAccount(userId);
  const existingMetadata = asRecord(existing?.metadata) || {};
  const isDefault =
    existing?.is_default === true ||
    existing?.is_primary === true ||
    (!existing && !anyDefault);

  const account = await safeWriteRow({
    table: "user_payout_accounts",
    existingId: firstNonEmpty(existing?.id),
    payload: {
      user_id: userId,

      account_purpose: "guru_marketplace_seller",
      provider: "paypal",
      provider_account_id: state.merchantId || null,
      provider_merchant_id: state.merchantId || null,
      provider_payer_id: state.merchantId || null,
      provider_email: state.providerEmail || null,
      onboarding_status: state.onboardingStatus,
      account_status: state.accountStatus,
      details_submitted: state.detailsSubmitted,
      charges_enabled: state.ready,
      payouts_enabled: state.ready,
      country_code: state.countryCode || "US",
      default_currency: "USD",
      is_default: isDefault,
      is_live: getPayPalConfig()?.environment === "live",
      requirements_currently_due: state.requirementsCurrentlyDue,
      requirements_eventually_due: state.requirementsCurrentlyDue,
      capabilities: state.capabilities,
      connected_at: state.merchantId
        ? existing?.connected_at || now
        : existing?.connected_at || null,
      onboarding_completed_at: state.ready ? now : null,
      disabled_at:
        state.accountStatus === "disabled" ||
        state.accountStatus === "disconnected"
          ? now
          : null,
      last_synced_at: now,

      workspace_role: "guru",
      status: state.ready
        ? "ready"
        : state.restricted
          ? "restricted"
          : "pending",
      is_primary: isDefault,
      onboarding_started_at: existing?.onboarding_started_at || now,
      last_checked_at: now,

      metadata: {
        ...existingMetadata,
        ...metadata,
        paypal_merchant_id: state.merchantId || null,
        paypal_provider_email: state.providerEmail || null,
        paypal_environment: getPayPalConfig()?.environment || "sandbox",
        paypal_payments_receivable: state.paymentsReceivable,
        paypal_primary_email_confirmed: state.emailConfirmed,
        paypal_permissions_granted: state.permissionsGranted,
        paypal_requirements_currently_due: state.requirementsCurrentlyDue,
        last_paypal_onboarding_update_at: now,
      },
      updated_at: now,
      created_at: existing?.created_at || now,
    },
  });

  await savePayoutPreference({
    userId,
    roles,
    ready: state.ready,
    restricted: state.restricted,
    now,
    metadata,
  });

  const { error: readinessError } = await supabaseAdmin.rpc(
    "sitguru_refresh_user_payout_readiness",
    { p_user_id: userId },
  );

  if (readinessError) {
    console.warn(
      "PayPal payout-readiness refresh warning:",
      readinessError.message,
    );
  }

  return account;
}

function publicAccount(account: JsonRecord | null) {
  if (!account) return null;

  return {
    id: firstNonEmpty(account.id) || null,
    provider: "paypal",
    providerMerchantId: maskIdentifier(
      account.provider_merchant_id || account.provider_account_id,
    ),
    providerEmail: maskEmail(account.provider_email),
    onboardingStatus: firstNonEmpty(
      account.onboarding_status,
      account.status,
      "not_started",
    ),
    accountStatus: firstNonEmpty(account.account_status, "pending"),
    detailsSubmitted: account.details_submitted === true,
    chargesEnabled: account.charges_enabled === true,
    payoutsEnabled: account.payouts_enabled === true,
    isDefault:
      account.is_default === true || account.is_primary === true,
    isLive: account.is_live === true,
    connectedAt: account.connected_at || null,
    onboardingCompletedAt: account.onboarding_completed_at || null,
    lastSyncedAt:
      account.last_synced_at || account.last_checked_at || null,
  };
}

function extractProductCapabilities(status: SellerIntegrationStatus | null) {
  const products = asArray(status?.products);
  const productStatuses: JsonRecord = {};
  const capabilityNames = new Set<string>();

  for (const item of products) {
    const product = asRecord(item);
    const name = firstNonEmpty(product?.name, "UNKNOWN");

    productStatuses[name] = {
      status: product?.status || null,
      vettingStatus: product?.vetting_status || null,
      capabilities: asArray(product?.capabilities),
    };

    for (const capability of asArray(product?.capabilities)) {
      const capabilityRecord = asRecord(capability);
      const capabilityName = firstNonEmpty(
        capabilityRecord?.name,
        capabilityRecord?.capability,
        capability,
      );

      if (capabilityName) capabilityNames.add(capabilityName);
    }
  }

  for (const capability of asArray(status?.capabilities)) {
    const capabilityRecord = asRecord(capability);
    const capabilityName = firstNonEmpty(
      capabilityRecord?.name,
      capabilityRecord?.capability,
      capability,
    );

    if (capabilityName) capabilityNames.add(capabilityName);
  }

  return {
    products: productStatuses,
    capabilityNames: [...capabilityNames],
  };
}

function buildOnboardingState({
  status,
  merchantId,
  fallbackEmail,
  returnMetadata,
}: {
  status: SellerIntegrationStatus | null;
  merchantId: string;
  fallbackEmail: string;
  returnMetadata?: JsonRecord;
}): OnboardingState {
  const resolvedMerchantId = firstNonEmpty(status?.merchant_id, merchantId);
  const providerEmail = firstNonEmpty(status?.primary_email, fallbackEmail);
  const paymentsReceivable = status
    ? status.payments_receivable === true
    : asBoolean(returnMetadata?.paymentsReceivable);
  const emailConfirmed = status
    ? status.primary_email_confirmed === true
    : asBoolean(returnMetadata?.isEmailConfirmed);
  const permissionsGranted = status
    ? hasMeaningfulValue(status.oauth_third_party)
    : asBoolean(returnMetadata?.permissionsGranted) &&
      asBoolean(returnMetadata?.consentStatus);
  const accountStatus = firstNonEmpty(
    returnMetadata?.accountStatus,
  ).toUpperCase();
  const riskStatus = firstNonEmpty(returnMetadata?.riskStatus).toUpperCase();
  const restricted = [
    "DECLINED",
    "DENIED",
    "SUSPENDED",
    "REVOKED",
    "INACTIVE",
  ].some((value) => riskStatus.includes(value));
  const ready =
    Boolean(resolvedMerchantId) &&
    paymentsReceivable &&
    emailConfirmed &&
    permissionsGranted &&
    !restricted;
  const detailsSubmitted =
    ready ||
    Boolean(resolvedMerchantId) ||
    accountStatus === "BUSINESS_ACCOUNT";
  const requirementsCurrentlyDue: string[] = [];

  if (!resolvedMerchantId) requirementsCurrentlyDue.push("paypal_account");
  if (!permissionsGranted) requirementsCurrentlyDue.push("permissions");
  if (!emailConfirmed) requirementsCurrentlyDue.push("email_confirmation");
  if (!paymentsReceivable) requirementsCurrentlyDue.push("payments_receivable");
  if (restricted) requirementsCurrentlyDue.push("paypal_account_review");

  const capabilitySnapshot = extractProductCapabilities(status);

  return {
    merchantId: resolvedMerchantId,
    providerEmail,
    ready,
    restricted,
    detailsSubmitted,
    paymentsReceivable,
    emailConfirmed,
    permissionsGranted,
    onboardingStatus: restricted
      ? "restricted"
      : ready
        ? "ready"
        : resolvedMerchantId
          ? "pending_review"
          : "in_progress",
    accountStatus: restricted
      ? "restricted"
      : ready
        ? "active"
        : "pending",
    countryCode: firstNonEmpty(
      status?.country_code,
      status?.country,
      "US",
    ).toUpperCase(),
    requirementsCurrentlyDue,
    capabilities: {
      requestedFeatures: [...PAYPAL_FEATURES],
      ...capabilitySnapshot,
    },
    rawStatus: status,
    returnMetadata,
  };
}

async function fetchSellerByTrackingId({
  config,
  accessToken,
  trackingId,
}: {
  config: PayPalConfig;
  accessToken: string;
  trackingId: string;
}) {
  if (!config.partnerMerchantId || !trackingId) return "";

  const url = new URL(
    `/v1/customer/partners/${encodeURIComponent(
      config.partnerMerchantId,
    )}/merchant-integrations`,
    `${config.apiBaseUrl}/`,
  );
  url.searchParams.set("tracking_id", trackingId);

  const payload = await paypalRequest({
    config,
    accessToken,
    url: url.toString(),
  });

  return firstNonEmpty(payload.merchant_id);
}

async function fetchSellerStatus({
  config,
  accessToken,
  merchantId,
}: {
  config: PayPalConfig;
  accessToken: string;
  merchantId: string;
}) {
  if (!config.partnerMerchantId || !merchantId) return null;

  const url = `${config.apiBaseUrl}/v1/customer/partners/${encodeURIComponent(
    config.partnerMerchantId,
  )}/merchant-integrations/${encodeURIComponent(merchantId)}`;

  return (await paypalRequest({
    config,
    accessToken,
    url,
  })) as SellerIntegrationStatus;
}

async function renewReferralUrl({
  config,
  accessToken,
  selfUrl,
}: {
  config: PayPalConfig;
  accessToken: string;
  selfUrl: string;
}) {
  if (!selfUrl) return null;

  let url: URL;

  try {
    url = new URL(selfUrl);
  } catch {
    return null;
  }

  if (url.origin !== new URL(config.apiBaseUrl).origin) {
    return null;
  }

  const payload = await paypalRequest({
    config,
    accessToken,
    url: url.toString(),
  });
  const actionUrl = getLink(payload, "action_url");

  if (!actionUrl) return null;

  return {
    payload,
    actionUrl,
    selfUrl: getLink(payload, "self") || selfUrl,
  };
}

function getExistingReferralMetadata(account: JsonRecord | null) {
  const metadata = asRecord(account?.metadata) || {};

  return {
    selfUrl: firstNonEmpty(metadata.paypal_referral_self_url),
    referralId: firstNonEmpty(metadata.paypal_partner_referral_id),
  };
}

async function createReferral({
  req,
  config,
  accessToken,
  user,
}: {
  req: NextRequest;
  config: PayPalConfig;
  accessToken: string;
  user: AuthenticatedUser;
}) {
  const origin = getRequestOrigin(req);
  const returnUrl = new URL("/api/paypal/onboarding", origin);
  returnUrl.searchParams.set("mode", "return");

  const renewalUrl = new URL("/guru/dashboard/earnings", origin);
  renewalUrl.searchParams.set("paypal", "renew");

  const configuredLogoUrl = firstNonEmpty(
    process.env.PAYPAL_PARTNER_LOGO_URL,
    process.env.NEXT_PUBLIC_PAYPAL_PARTNER_LOGO_URL,
  );

  const partnerConfigOverride: JsonRecord = {
    return_url: returnUrl.toString(),
    return_url_description: "Return to SitGuru",
    action_renewal_url: renewalUrl.toString(),
    show_add_credit_card: false,
  };

  if (configuredLogoUrl) {
    try {
      partnerConfigOverride.partner_logo_url = new URL(
        configuredLogoUrl,
        origin,
      ).toString();
    } catch {
      console.warn("Ignoring invalid PAYPAL_PARTNER_LOGO_URL.");
    }
  }

  const referralBody: JsonRecord = {
    tracking_id: user.id,
    preferred_language_code: "en-US",
    legal_country_code: "US",
    partner_config_override: partnerConfigOverride,
    operations: [
      {
        operation: "API_INTEGRATION",
        api_integration_preference: {
          rest_api_integration: {
            integration_method: "PAYPAL",
            integration_type: "THIRD_PARTY",
            third_party_details: {
              features: [...PAYPAL_FEATURES],
            },
          },
        },
      },
    ],
    products: ["EXPRESS_CHECKOUT"],
    legal_consents: [
      {
        type: "SHARE_DATA_CONSENT",
        granted: true,
      },
    ],
  };

  if (user.email) referralBody.email = user.email;

  const payload = await paypalRequest({
    config,
    accessToken,
    url: `${config.apiBaseUrl}/v2/customer/partner-referrals`,
    method: "POST",
    body: referralBody,
  });

  const actionUrl = getLink(payload, "action_url");
  const selfUrl = getLink(payload, "self");

  if (!actionUrl) {
    throw new Error("PayPal did not return a seller onboarding URL.");
  }

  return {
    payload,
    actionUrl,
    selfUrl,
    referralId: getReferralId(selfUrl),
  };
}

function getReturnMetadata(req: NextRequest): JsonRecord {
  return {
    trackingId: req.nextUrl.searchParams.get("merchantId") || "",
    merchantIdInPayPal:
      req.nextUrl.searchParams.get("merchantIdInPayPal") || "",
    permissionsGranted:
      req.nextUrl.searchParams.get("permissionsGranted") || "",
    accountStatus: req.nextUrl.searchParams.get("accountStatus") || "",
    consentStatus: req.nextUrl.searchParams.get("consentStatus") || "",
    productIntentId:
      req.nextUrl.searchParams.get("productIntentId") || "",
    isEmailConfirmed:
      req.nextUrl.searchParams.get("isEmailConfirmed") || "",
    returnMessage: req.nextUrl.searchParams.get("returnMessage") || "",
    riskStatus: req.nextUrl.searchParams.get("riskStatus") || "",
  };
}

function redirectToEarnings({
  req,
  status,
  message,
}: {
  req: NextRequest;
  status: "connected" | "pending" | "error";
  message?: string;
}) {
  const url = new URL("/guru/dashboard/earnings", getRequestOrigin(req));
  url.searchParams.set("paypal", status);

  if (message) {
    url.searchParams.set("paypal_message", message.slice(0, 240));
  }

  return NextResponse.redirect(url, 303);
}

async function handlePayPalReturn(req: NextRequest, user: AuthenticatedUser) {
  const config = getPayPalConfig();

  if (!config) {
    return redirectToEarnings({
      req,
      status: "error",
      message: "PayPal onboarding is not fully configured.",
    });
  }

  const roles = await getFinancialRoles(user.id);

  if (!roles.includes("guru")) {
    return redirectToEarnings({
      req,
      status: "error",
      message: "A Guru workspace is required for PayPal onboarding.",
    });
  }

  const returnMetadata = getReturnMetadata(req);
  const trackingId = firstNonEmpty(returnMetadata.trackingId);

  if (trackingId && trackingId !== user.id) {
    console.warn("PayPal onboarding return tracking ID mismatch:", {
      authenticatedUserId: user.id,
      trackingId,
    });

    return redirectToEarnings({
      req,
      status: "error",
      message: "SitGuru could not verify this PayPal onboarding return.",
    });
  }

  try {
    const accessToken = await getAccessToken(config);
    let merchantId = firstNonEmpty(returnMetadata.merchantIdInPayPal);

    if (!merchantId && config.partnerMerchantId) {
      merchantId = await fetchSellerByTrackingId({
        config,
        accessToken,
        trackingId: user.id,
      });
    }

    const sellerStatus = merchantId
      ? await fetchSellerStatus({
          config,
          accessToken,
          merchantId,
        }).catch((error) => {
          console.warn("PayPal seller-status refresh warning:", error);
          return null;
        })
      : null;

    const state = buildOnboardingState({
      status: sellerStatus,
      merchantId,
      fallbackEmail: user.email || "",
      returnMetadata,
    });

    await savePayoutAccount({
      userId: user.id,
      roles,
      state,
      metadata: {
        paypal_return_received_at: new Date().toISOString(),
        paypal_return_metadata: returnMetadata,
      },
    });

    const returnMessage = firstNonEmpty(returnMetadata.returnMessage);

    return redirectToEarnings({
      req,
      status: state.ready ? "connected" : "pending",
      message: state.ready
        ? "PayPal is connected and ready for SitGuru bookings."
        : returnMessage ||
          "PayPal received your setup. SitGuru is waiting for final account verification.",
    });
  } catch (error) {
    console.error("PayPal onboarding return failed:", error);

    return redirectToEarnings({
      req,
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "SitGuru could not finish PayPal onboarding.",
    });
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req),
  });
}

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);

  if (!user) {
    if (req.nextUrl.searchParams.get("mode") === "return") {
      const loginUrl = new URL("/login", getRequestOrigin(req));
      loginUrl.searchParams.set(
        "next",
        "/api/paypal/onboarding?mode=return",
      );
      return NextResponse.redirect(loginUrl, 303);
    }

    return json(
      req,
      {
        success: false,
        error: "Authentication required.",
      },
      401,
    );
  }

  if (req.nextUrl.searchParams.get("mode") === "return") {
    return handlePayPalReturn(req, user);
  }

  const roles = await getFinancialRoles(user.id);

  if (!roles.includes("guru")) {
    return json(
      req,
      {
        success: false,
        error: "A Guru workspace is required for PayPal onboarding.",
        roles,
      },
      403,
    );
  }

  const config = getPayPalConfig();
  const { account: existing } = await findPayPalAccount(user.id);
  const shouldRefresh =
    req.nextUrl.searchParams.get("refresh") === "true" ||
    req.nextUrl.searchParams.get("refresh") === "1";

  let account = existing;
  let refreshWarning = "";

  if (shouldRefresh && config) {
    try {
      const accessToken = await getAccessToken(config);
      let merchantId = firstNonEmpty(
        existing?.provider_merchant_id,
        existing?.provider_account_id,
      );

      if (!merchantId && config.partnerMerchantId) {
        merchantId = await fetchSellerByTrackingId({
          config,
          accessToken,
          trackingId: user.id,
        });
      }

      if (merchantId && config.partnerMerchantId) {
        const sellerStatus = await fetchSellerStatus({
          config,
          accessToken,
          merchantId,
        });
        const state = buildOnboardingState({
          status: sellerStatus,
          merchantId,
          fallbackEmail: user.email || "",
        });

        account = await savePayoutAccount({
          userId: user.id,
          roles,
          state,
          metadata: {
            paypal_status_refreshed_at: new Date().toISOString(),
          },
        });
      } else if (!config.partnerMerchantId) {
        refreshWarning =
          "PAYPAL_PARTNER_MERCHANT_ID is required for direct seller-status checks.";
      }
    } catch (error) {
      console.error("PayPal onboarding status refresh failed:", error);
      refreshWarning =
        error instanceof Error
          ? error.message
          : "PayPal status refresh failed.";
    }
  }

  return json(req, {
    success: true,
    environment: config?.environment || normalizeEnvironment(
      process.env.PAYPAL_ENVIRONMENT || process.env.PAYPAL_MODE,
    ),
    configured: Boolean(config),
    statusRefreshAvailable: Boolean(config?.partnerMerchantId),
    account: publicAccount(account),
    refreshWarning: refreshWarning || null,
  });
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);

  if (!user) {
    return json(
      req,
      {
        success: false,
        error: "Authentication required.",
      },
      401,
    );
  }

  const roles = await getFinancialRoles(user.id);

  if (!roles.includes("guru")) {
    return json(
      req,
      {
        success: false,
        error: "A Guru workspace is required for PayPal onboarding.",
        roles,
      },
      403,
    );
  }

  const config = getPayPalConfig();

  if (!config) {
    return json(
      req,
      {
        success: false,
        error:
          "PayPal onboarding is not configured. Add the PayPal Client ID, Client Secret, and Partner Attribution ID.",
        requiredEnvironmentVariables: [
          "PAYPAL_SANDBOX_CLIENT_ID",
          "PAYPAL_SANDBOX_CLIENT_SECRET",
          "PAYPAL_SANDBOX_PARTNER_ATTRIBUTION_ID",
        ],
      },
      503,
    );
  }

  let body: JsonRecord = {};

  try {
    const requestText = await req.text();
    body = requestText ? (JSON.parse(requestText) as JsonRecord) : {};
  } catch {
    return json(
      req,
      {
        success: false,
        error: "Request body must be valid JSON.",
      },
      400,
    );
  }

  const forceNew = body.forceNew === true;

  try {
    const accessToken = await getAccessToken(config);
    const { account: existing } = await findPayPalAccount(user.id);
    const existingStatus = firstNonEmpty(
      existing?.onboarding_status,
      existing?.status,
    ).toLowerCase();

    if (
      existing &&
      existingStatus === "ready" &&
      existing.payouts_enabled === true
    ) {
      return json(req, {
        success: true,
        alreadyConnected: true,
        message: "PayPal is already connected and ready.",
        environment: config.environment,
        account: publicAccount(existing),
      });
    }

    if (!forceNew) {
      const referralMetadata = getExistingReferralMetadata(existing);
      const renewed = await renewReferralUrl({
        config,
        accessToken,
        selfUrl: referralMetadata.selfUrl,
      }).catch((error) => {
        console.warn("PayPal referral renewal warning:", error);
        return null;
      });

      if (renewed) {
        const state = buildOnboardingState({
          status: null,
          merchantId: firstNonEmpty(
            existing?.provider_merchant_id,
            existing?.provider_account_id,
          ),
          fallbackEmail: user.email || "",
        });

        const account = await savePayoutAccount({
          userId: user.id,
          roles,
          state,
          metadata: {
            paypal_partner_referral_id:
              getReferralId(renewed.selfUrl) ||
              referralMetadata.referralId ||
              null,
            paypal_referral_self_url: renewed.selfUrl,
            paypal_onboarding_action_url_created_at:
              new Date().toISOString(),
            paypal_referral_renewed: true,
          },
        });

        return json(req, {
          success: true,
          environment: config.environment,
          renewed: true,
          onboardingUrl: renewed.actionUrl,
          account: publicAccount(account),
        });
      }
    }

    const referral = await createReferral({
      req,
      config,
      accessToken,
      user,
    });

    const state = buildOnboardingState({
      status: null,
      merchantId: firstNonEmpty(
        existing?.provider_merchant_id,
        existing?.provider_account_id,
      ),
      fallbackEmail: user.email || "",
    });

    const account = await savePayoutAccount({
      userId: user.id,
      roles,
      state,
      metadata: {
        paypal_tracking_id: user.id,
        paypal_partner_referral_id: referral.referralId || null,
        paypal_referral_self_url: referral.selfUrl || null,
        paypal_onboarding_action_url_created_at: new Date().toISOString(),
        paypal_requested_features: [...PAYPAL_FEATURES],
        paypal_requested_products: ["EXPRESS_CHECKOUT"],
        paypal_referral_renewed: false,
      },
    });

    return json(
      req,
      {
        success: true,
        environment: config.environment,
        onboardingUrl: referral.actionUrl,
        referralId: referral.referralId || null,
        account: publicAccount(account),
        message:
          "PayPal seller onboarding is ready. Redirect the Guru to onboardingUrl.",
      },
      201,
    );
  } catch (error) {
    console.error("PayPal seller onboarding creation failed:", error);

    return json(
      req,
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "SitGuru could not start PayPal onboarding.",
      },
      502,
    );
  }
}