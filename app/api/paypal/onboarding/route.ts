import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import {
  getPayPalConfig,
  PayPalApiError,
  paypalRequest,
  type PayPalConfig,
  type PayPalEnvironment,
} from "@/lib/paypal/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

type JsonRecord = Record<string, unknown>;
type FinancialRole = "guru" | "ambassador";

type AuthenticatedUser = {
  id: string;
  email: string | null;
};

type PayPalLink = {
  href?: string;
  rel?: string;
  method?: string;
};

type PartnerReferralResponse = {
  partner_referral_id?: string;
  links?: PayPalLink[];
  [key: string]: unknown;
};

type PayPalOAuthThirdParty = {
  partner_client_id?: string;
  merchant_client_id?: string;
  scopes?: string[];
  [key: string]: unknown;
};

type PayPalOAuthIntegration = {
  integration_type?: string;
  integration_method?: string;
  oauth_third_party?: PayPalOAuthThirdParty[];
  [key: string]: unknown;
};

type PayPalProduct = {
  name?: string;
  status?: string;
  vetting_status?: string;
  capabilities?: unknown[];
  [key: string]: unknown;
};

type PayPalCapability = {
  name?: string;
  status?: string;
  limits?: unknown;
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
  oauth_integrations?: PayPalOAuthIntegration[];
  products?: PayPalProduct[];
  capabilities?: PayPalCapability[];
  [key: string]: unknown;
};

type OnboardingState = {
  merchantId: string;
  trackingId: string;
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
  products: PayPalProduct[];
  oauthPermissions: PayPalOAuthThirdParty[];
  vettingStatus: string | null;
  rawStatus: SellerIntegrationStatus | null;
  returnMetadata?: JsonRecord;
};

type CanonicalMerchantAccount = {
  user_id: string;
  environment: PayPalEnvironment;
  tracking_id: string;
  paypal_merchant_id: string | null;
  merchant_email: string | null;
  status: string;
  onboarding_action_url: string | null;
  merchant_details: JsonRecord | null;
};

const LOCAL_ORIGINS = new Set([
  "http://localhost:3000",
  "http://localhost:8081",
  "http://localhost:8082",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:8081",
  "http://127.0.0.1:8082",
]);

function asRecord(value: unknown): JsonRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as JsonRecord;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asTrimmedString(value: unknown): string {
  if (typeof value === "string") return value.trim();

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
}

function firstNonEmpty(...values: unknown[]): string {
  for (const value of values) {
    const text = asTrimmedString(value);

    if (text) return text;
  }

  return "";
}

function asBoolean(value: unknown): boolean {
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

function normalizeUppercase(value: unknown): string {
  return asTrimmedString(value).toUpperCase();
}

function isEnabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

function getRequestedFeatures(): string[] {
  const features = ["PAYMENT", "REFUND", "PARTNER_FEE"];

  if (isEnabled(process.env.PAYPAL_DELAY_FUNDS_DISBURSEMENT_ENABLED)) {
    features.push("DELAY_FUNDS_DISBURSEMENT");
  }

  return features;
}

function tryGetPayPalConfig(): PayPalConfig | null {
  try {
    return getPayPalConfig();
  } catch (error) {
    console.warn(
      "PayPal configuration is incomplete:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

function getConfiguredEnvironment(): PayPalEnvironment {
  const value = asTrimmedString(process.env.PAYPAL_ENV).toLowerCase();
  return value === "live" ? "live" : "sandbox";
}

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function isAllowedOrigin(origin: string): boolean {
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
  const responseHeaders: Record<string, string> = {
    "Cache-Control": "no-store, max-age=0",
    Vary: "Origin",
  };

  const origin = req.headers.get("origin") || "";

  if (!origin || !isAllowedOrigin(origin)) {
    return responseHeaders;
  }

  responseHeaders["Access-Control-Allow-Credentials"] = "true";
  responseHeaders["Access-Control-Allow-Headers"] =
    "Authorization, Content-Type, X-Requested-With";
  responseHeaders["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
  responseHeaders["Access-Control-Allow-Origin"] = origin;

  return responseHeaders;
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

function getRequestOrigin(req: NextRequest): string {
  const configuredOrigin = firstNonEmpty(
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.SITE_URL,
    process.env.APP_URL,
  );

  if (configuredOrigin) {
    try {
      return new URL(
        configuredOrigin.startsWith("http")
          ? configuredOrigin
          : `https://${configuredOrigin}`,
      ).origin;
    } catch {
      console.warn("Ignoring invalid configured SitGuru site URL.");
    }
  }

  return req.nextUrl.origin;
}

function maskIdentifier(value: unknown): string | null {
  const text = asTrimmedString(value);

  if (!text) return null;
  if (text.length <= 6) return `${text.slice(0, 1)}***`;

  return `${text.slice(0, 3)}***${text.slice(-3)}`;
}

function maskEmail(value: unknown): string | null {
  const email = asTrimmedString(value);
  const [local, domain] = email.split("@");

  if (!local || !domain) return email ? "***" : null;

  return `${local.slice(0, 1)}***@${domain}`;
}

function getMissingColumnName(errorMessage: string): string | null {
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

  if (
    normalized === "guru" ||
    normalized === "pet_guru" ||
    normalized === "provider" ||
    normalized === "sitter"
  ) {
    return "guru";
  }

  if (normalized === "ambassador") return "ambassador";

  return null;
}

async function getFinancialRoles(userId: string): Promise<FinancialRole[]> {
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
    for (const column of ["user_id", "profile_id"]) {
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

function getLink(payload: unknown, relation: string): string {
  const record = asRecord(payload);

  for (const item of asArray(record?.links)) {
    const link = asRecord(item);

    if (firstNonEmpty(link?.rel).toLowerCase() === relation.toLowerCase()) {
      return firstNonEmpty(link?.href);
    }
  }

  return "";
}

function getReferralId(selfUrl: string): string {
  if (!selfUrl) return "";

  try {
    const url = new URL(selfUrl);
    return url.pathname.split("/").filter(Boolean).at(-1) || "";
  } catch {
    return "";
  }
}

function getPayPalErrorMessage(error: unknown): string {
  if (error instanceof PayPalApiError) {
    return error.message || "PayPal rejected the request.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "SitGuru could not complete the PayPal request.";
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
  return rows.find((row) => row.workspace_role === "guru") || rows[0] || null;
}

async function findCanonicalMerchantAccount(
  userId: string,
  environment: PayPalEnvironment,
): Promise<CanonicalMerchantAccount | null> {
  const { data, error } = await supabaseAdmin
    .from("paypal_merchant_accounts")
    .select(
      "user_id,environment,tracking_id,paypal_merchant_id,merchant_email,status,onboarding_action_url,merchant_details",
    )
    .eq("user_id", userId)
    .eq("environment", environment)
    .maybeSingle();

  if (error) {
    console.warn("Canonical PayPal merchant lookup warning:", error.message);
    return null;
  }

  return (data || null) as CanonicalMerchantAccount | null;
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

async function saveCanonicalMerchantAccount({
  userId,
  environment,
  state,
  status,
  onboardingActionUrl,
  referralResponse,
  errorCode,
  errorMessage,
}: {
  userId: string;
  environment: PayPalEnvironment;
  state: OnboardingState;
  status:
    | "not_started"
    | "referral_created"
    | "pending"
    | "connected"
    | "limited"
    | "disconnected"
    | "error";
  onboardingActionUrl?: string | null;
  referralResponse?: JsonRecord | null;
  errorCode?: string | null;
  errorMessage?: string | null;
}) {
  const now = new Date().toISOString();
  const merchantDetails: JsonRecord = {
    ...(state.rawStatus || {}),
    sitguru_verification: {
      environment,
      verified_at: now,
      requirements_currently_due: state.requirementsCurrentlyDue,
      requested_features: getRequestedFeatures(),
      requested_product: "PPCP",
      return_metadata: state.returnMetadata || null,
      referral_response: referralResponse || null,
    },
  };

  const { error } = await supabaseAdmin
    .from("paypal_merchant_accounts")
    .upsert(
      {
        user_id: userId,
        environment,
        tracking_id: state.trackingId,
        paypal_merchant_id: state.merchantId || null,
        merchant_email: state.providerEmail || null,
        status,
        onboarding_action_url: onboardingActionUrl ?? null,
        payments_receivable: state.paymentsReceivable,
        primary_email_confirmed: state.emailConfirmed,
        oauth_third_party_permissions: state.oauthPermissions,
        products: state.products,
        capabilities: state.capabilities,
        vetting_status: state.vettingStatus,
        partner_consent_status: state.permissionsGranted ? "true" : "false",
        merchant_details: merchantDetails,
        last_error_code: errorCode || null,
        last_error_message: errorMessage || null,
        onboarding_started_at: now,
        onboarding_completed_at: state.ready ? now : null,
        last_synced_at: now,
      },
      {
        onConflict: "user_id,environment",
      },
    );

  if (error) {
    console.warn("Canonical PayPal merchant save warning:", error.message);
  }
}

async function savePayoutAccount({
  userId,
  roles,
  environment,
  state,
  metadata,
  canonicalStatus,
  onboardingActionUrl,
  referralResponse,
}: {
  userId: string;
  roles: FinancialRole[];
  environment: PayPalEnvironment;
  state: OnboardingState;
  metadata: JsonRecord;
  canonicalStatus?:
    | "not_started"
    | "referral_created"
    | "pending"
    | "connected"
    | "limited"
    | "disconnected"
    | "error";
  onboardingActionUrl?: string | null;
  referralResponse?: JsonRecord | null;
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
      is_live: environment === "live",
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
        paypal_tracking_id: state.trackingId,
        paypal_merchant_id: state.merchantId || null,
        paypal_provider_email: state.providerEmail || null,
        paypal_environment: environment,
        paypal_payments_receivable: state.paymentsReceivable,
        paypal_primary_email_confirmed: state.emailConfirmed,
        paypal_permissions_granted: state.permissionsGranted,
        paypal_vetting_status: state.vettingStatus,
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

  await saveCanonicalMerchantAccount({
    userId,
    environment,
    state,
    status:
      canonicalStatus ||
      (state.ready
        ? "connected"
        : state.restricted
          ? "limited"
          : state.merchantId
            ? "pending"
            : "not_started"),
    onboardingActionUrl,
    referralResponse,
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

  const metadata = asRecord(account.metadata) || {};

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
    isDefault: account.is_default === true || account.is_primary === true,
    isLive: account.is_live === true,
    connectedAt: account.connected_at || null,
    onboardingCompletedAt: account.onboarding_completed_at || null,
    lastSyncedAt: account.last_synced_at || account.last_checked_at || null,
    primaryEmailConfirmed:
      metadata.paypal_primary_email_confirmed === true,
    paymentsReceivable: metadata.paypal_payments_receivable === true,
    permissionsGranted: metadata.paypal_permissions_granted === true,
    vettingStatus: firstNonEmpty(metadata.paypal_vetting_status) || null,
    requirementsCurrentlyDue: Array.isArray(
      account.requirements_currently_due,
    )
      ? account.requirements_currently_due
      : [],
  };
}

function extractOAuthPermissions(
  status: SellerIntegrationStatus | null,
): PayPalOAuthThirdParty[] {
  const permissions: PayPalOAuthThirdParty[] = [];

  if (hasMeaningfulValue(status?.oauth_third_party)) {
    for (const item of asArray(status?.oauth_third_party)) {
      const record = asRecord(item);
      if (record) permissions.push(record as PayPalOAuthThirdParty);
    }
  }

  for (const integration of status?.oauth_integrations || []) {
    for (const item of integration.oauth_third_party || []) {
      if (item && typeof item === "object") {
        permissions.push(item);
      }
    }
  }

  return permissions;
}

function extractProductCapabilities(status: SellerIntegrationStatus | null) {
  const products = Array.isArray(status?.products) ? status.products : [];
  const productStatuses: JsonRecord = {};
  const capabilityNames = new Set<string>();
  let vettingStatus: string | null = null;
  let ppcpProvisioned = false;
  let ppcpRestricted = false;

  for (const product of products) {
    const name = normalizeUppercase(product.name) || "UNKNOWN";
    const productStatus = normalizeUppercase(product.status);
    const productVettingStatus = normalizeUppercase(product.vetting_status);

    productStatuses[name] = {
      status: productStatus || null,
      vettingStatus: productVettingStatus || null,
      capabilities: asArray(product.capabilities),
    };

    if (["PPCP", "PPCP_CUSTOM", "PPCP_STANDARD"].includes(name)) {
      vettingStatus = productVettingStatus || productStatus || null;
      ppcpProvisioned =
        ["ACTIVE", "APPROVED", "SUBSCRIBED"].includes(productStatus) ||
        ["ACTIVE", "APPROVED", "SUBSCRIBED"].includes(
          productVettingStatus,
        );
      ppcpRestricted = [
        "DECLINED",
        "DENIED",
        "RESTRICTED",
        "SUSPENDED",
        "REVOKED",
        "INACTIVE",
      ].some(
        (value) =>
          productStatus.includes(value) ||
          productVettingStatus.includes(value),
      );
    }

    for (const capability of asArray(product.capabilities)) {
      const capabilityRecord = asRecord(capability);
      const capabilityName = firstNonEmpty(
        capabilityRecord?.name,
        capabilityRecord?.capability,
        capability,
      );

      if (capabilityName) capabilityNames.add(capabilityName);
    }
  }

  for (const capability of status?.capabilities || []) {
    const capabilityName = firstNonEmpty(
      capability.name,
      (capability as JsonRecord).capability,
    );

    if (capabilityName) capabilityNames.add(capabilityName);
  }

  return {
    products,
    productStatuses,
    capabilityNames: [...capabilityNames],
    vettingStatus,
    ppcpProvisioned,
    ppcpRestricted,
  };
}

function buildOnboardingState({
  status,
  merchantId,
  trackingId,
  fallbackEmail,
  returnMetadata,
}: {
  status: SellerIntegrationStatus | null;
  merchantId: string;
  trackingId: string;
  fallbackEmail: string;
  returnMetadata?: JsonRecord;
}): OnboardingState {
  const resolvedMerchantId = firstNonEmpty(status?.merchant_id, merchantId);
  const resolvedTrackingId = firstNonEmpty(status?.tracking_id, trackingId);
  const providerEmail = firstNonEmpty(status?.primary_email, fallbackEmail);
  const paymentsReceivable = status
    ? status.payments_receivable === true
    : asBoolean(returnMetadata?.paymentsReceivable);
  const emailConfirmed = status
    ? status.primary_email_confirmed === true
    : asBoolean(returnMetadata?.isEmailConfirmed);
  const oauthPermissions = extractOAuthPermissions(status);
  const permissionsGranted = status
    ? oauthPermissions.length > 0
    : asBoolean(returnMetadata?.permissionsGranted) &&
      asBoolean(returnMetadata?.consentStatus);
  const accountStatus = normalizeUppercase(returnMetadata?.accountStatus);
  const riskStatus = normalizeUppercase(returnMetadata?.riskStatus);
  const productSnapshot = extractProductCapabilities(status);
  const restricted =
    productSnapshot.ppcpRestricted ||
    ["DECLINED", "DENIED", "SUSPENDED", "REVOKED", "INACTIVE"].some(
      (value) => riskStatus.includes(value),
    );
  const ready =
    Boolean(resolvedMerchantId) &&
    paymentsReceivable &&
    emailConfirmed &&
    permissionsGranted &&
    productSnapshot.ppcpProvisioned &&
    !restricted;
  const detailsSubmitted =
    ready || Boolean(resolvedMerchantId) || accountStatus === "BUSINESS_ACCOUNT";
  const requirementsCurrentlyDue: string[] = [];

  if (!resolvedMerchantId) requirementsCurrentlyDue.push("paypal_account");
  if (!permissionsGranted) requirementsCurrentlyDue.push("permissions");
  if (!emailConfirmed) requirementsCurrentlyDue.push("email_confirmation");
  if (!paymentsReceivable) requirementsCurrentlyDue.push("payments_receivable");
  if (!productSnapshot.ppcpProvisioned) {
    requirementsCurrentlyDue.push("paypal_product_approval");
  }
  if (restricted) requirementsCurrentlyDue.push("paypal_account_review");

  return {
    merchantId: resolvedMerchantId,
    trackingId: resolvedTrackingId,
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
      requestedFeatures: getRequestedFeatures(),
      requestedProduct: "PPCP",
      products: productSnapshot.productStatuses,
      capabilityNames: productSnapshot.capabilityNames,
    },
    products: productSnapshot.products,
    oauthPermissions,
    vettingStatus: productSnapshot.vettingStatus,
    rawStatus: status,
    returnMetadata,
  };
}

function getMerchantIntegrationFromResponse(
  response: unknown,
): SellerIntegrationStatus | null {
  if (Array.isArray(response)) {
    const first = response.find((item) => asRecord(item));
    return first ? (first as SellerIntegrationStatus) : null;
  }

  const record = asRecord(response);
  if (!record) return null;

  if (record.merchant_id || record.tracking_id) {
    return record as SellerIntegrationStatus;
  }

  for (const key of ["merchant_integrations", "integrations"]) {
    const candidate = asArray(record[key]).find((item) => asRecord(item));
    if (candidate) return candidate as SellerIntegrationStatus;
  }

  return null;
}

async function fetchSellerByTrackingId({
  config,
  trackingId,
}: {
  config: PayPalConfig;
  trackingId: string;
}): Promise<SellerIntegrationStatus | null> {
  if (!config.partnerMerchantId || !trackingId) return null;

  const response = await paypalRequest<unknown>(
    `/v1/customer/partners/${encodeURIComponent(
      config.partnerMerchantId,
    )}/merchant-integrations?tracking_id=${encodeURIComponent(trackingId)}`,
    {
      method: "GET",
    },
  );

  return getMerchantIntegrationFromResponse(response);
}

async function fetchSellerStatus({
  config,
  merchantId,
}: {
  config: PayPalConfig;
  merchantId: string;
}): Promise<SellerIntegrationStatus | null> {
  if (!config.partnerMerchantId || !merchantId) return null;

  return paypalRequest<SellerIntegrationStatus>(
    `/v1/customer/partners/${encodeURIComponent(
      config.partnerMerchantId,
    )}/merchant-integrations/${encodeURIComponent(merchantId)}`,
    {
      method: "GET",
      sellerMerchantId: merchantId,
    },
  );
}

async function renewReferralUrl({
  config,
  selfUrl,
}: {
  config: PayPalConfig;
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

  const path = `${url.pathname}${url.search}`;
  const payload = await paypalRequest<JsonRecord>(path, {
    method: "GET",
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
    trackingId: firstNonEmpty(metadata.paypal_tracking_id),
    selfUrl: firstNonEmpty(metadata.paypal_referral_self_url),
    referralId: firstNonEmpty(metadata.paypal_partner_referral_id),
  };
}

async function createReferral({
  req,
  user,
  trackingId,
}: {
  req: NextRequest;
  user: AuthenticatedUser;
  trackingId: string;
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
    tracking_id: trackingId,
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
              features: getRequestedFeatures(),
            },
          },
        },
      },
    ],
    products: ["PPCP"],
    legal_consents: [
      {
        type: "SHARE_DATA_CONSENT",
        granted: true,
      },
    ],
  };

  if (user.email) referralBody.email = user.email;

  const payload = await paypalRequest<PartnerReferralResponse>(
    "/v2/customer/partner-referrals",
    {
      method: "POST",
      requestId: randomUUID(),
      body: referralBody,
    },
  );

  const actionUrl = getLink(payload, "action_url");
  const selfUrl = getLink(payload, "self");

  if (!actionUrl) {
    throw new Error("PayPal did not return a seller onboarding URL.");
  }

  return {
    payload: payload as JsonRecord,
    actionUrl,
    selfUrl,
    referralId:
      firstNonEmpty(payload.partner_referral_id) || getReferralId(selfUrl),
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
  const config = tryGetPayPalConfig();

  if (!config) {
    return redirectToEarnings({
      req,
      status: "error",
      message: "PayPal setup is not fully configured yet.",
    });
  }

  const roles = await getFinancialRoles(user.id);

  if (!roles.includes("guru")) {
    return redirectToEarnings({
      req,
      status: "error",
      message: "A Guru workspace is required for PayPal setup.",
    });
  }

  const returnMetadata = getReturnMetadata(req);
  const canonical = await findCanonicalMerchantAccount(
    user.id,
    config.environment,
  );
  const { account: existingPayoutAccount } = await findPayPalAccount(user.id);
  const payoutMetadata = asRecord(existingPayoutAccount?.metadata) || {};
  const expectedTrackingId = firstNonEmpty(
    canonical?.tracking_id,
    payoutMetadata.paypal_tracking_id,
  );
  const returnedTrackingId = firstNonEmpty(returnMetadata.trackingId);

  if (
    expectedTrackingId &&
    returnedTrackingId &&
    returnedTrackingId !== expectedTrackingId
  ) {
    console.warn("PayPal onboarding return tracking ID mismatch:", {
      authenticatedUserId: user.id,
      expectedTrackingId,
      returnedTrackingId,
    });

    return redirectToEarnings({
      req,
      status: "error",
      message: "SitGuru could not verify this PayPal setup return.",
    });
  }

  const trackingId =
    returnedTrackingId ||
    expectedTrackingId ||
    `sitguru-${config.environment}-${user.id}`;

  try {
    let merchantId = firstNonEmpty(
      returnMetadata.merchantIdInPayPal,
      canonical?.paypal_merchant_id,
      existingPayoutAccount?.provider_merchant_id,
      existingPayoutAccount?.provider_account_id,
    );

    let sellerStatus: SellerIntegrationStatus | null = null;

    if (!merchantId && config.partnerMerchantId) {
      sellerStatus = await fetchSellerByTrackingId({
        config,
        trackingId,
      });
      merchantId = firstNonEmpty(sellerStatus?.merchant_id);
    }

    if (merchantId && config.partnerMerchantId) {
      sellerStatus = await fetchSellerStatus({
        config,
        merchantId,
      }).catch((error) => {
        console.warn("PayPal seller-status refresh warning:", error);
        return sellerStatus;
      });
    }

    const state = buildOnboardingState({
      status: sellerStatus,
      merchantId,
      trackingId,
      fallbackEmail: user.email || "",
      returnMetadata,
    });

    await savePayoutAccount({
      userId: user.id,
      roles,
      environment: config.environment,
      state,
      metadata: {
        paypal_return_received_at: new Date().toISOString(),
        paypal_return_metadata: returnMetadata,
      },
      canonicalStatus: state.ready
        ? "connected"
        : state.restricted
          ? "limited"
          : "pending",
    });

    const returnMessage = firstNonEmpty(returnMetadata.returnMessage);

    return redirectToEarnings({
      req,
      status: state.ready ? "connected" : "pending",
      message: state.ready
        ? "PayPal is connected. You’re ready for eligible SitGuru payouts."
        : returnMessage ||
          "PayPal received your setup. We’re waiting for the final account check.",
    });
  } catch (error) {
    console.error("PayPal onboarding return failed:", error);

    return redirectToEarnings({
      req,
      status: "error",
      message: getPayPalErrorMessage(error),
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
        `${req.nextUrl.pathname}${req.nextUrl.search}`,
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
        error: "A Guru workspace is required for PayPal setup.",
        roles,
      },
      403,
    );
  }

  const config = tryGetPayPalConfig();
  const { account: existing } = await findPayPalAccount(user.id);
  const shouldRefresh = ["true", "1"].includes(
    req.nextUrl.searchParams.get("refresh") || "",
  );

  let account = existing;
  let refreshWarning = "";

  if (shouldRefresh && config) {
    try {
      const canonical = await findCanonicalMerchantAccount(
        user.id,
        config.environment,
      );
      const metadata = asRecord(existing?.metadata) || {};
      const trackingId = firstNonEmpty(
        canonical?.tracking_id,
        metadata.paypal_tracking_id,
      );
      let merchantId = firstNonEmpty(
        canonical?.paypal_merchant_id,
        existing?.provider_merchant_id,
        existing?.provider_account_id,
      );
      let sellerStatus: SellerIntegrationStatus | null = null;

      if (!merchantId && config.partnerMerchantId && trackingId) {
        sellerStatus = await fetchSellerByTrackingId({
          config,
          trackingId,
        });
        merchantId = firstNonEmpty(sellerStatus?.merchant_id);
      }

      if (merchantId && config.partnerMerchantId) {
        sellerStatus = await fetchSellerStatus({
          config,
          merchantId,
        });
      }

      if (merchantId || sellerStatus) {
        const state = buildOnboardingState({
          status: sellerStatus,
          merchantId,
          trackingId:
            trackingId ||
            firstNonEmpty(sellerStatus?.tracking_id) ||
            `sitguru-${config.environment}-${user.id}`,
          fallbackEmail: user.email || "",
        });

        account = await savePayoutAccount({
          userId: user.id,
          roles,
          environment: config.environment,
          state,
          metadata: {
            paypal_status_refreshed_at: new Date().toISOString(),
          },
          canonicalStatus: state.ready
            ? "connected"
            : state.restricted
              ? "limited"
              : "pending",
        });
      } else if (!config.partnerMerchantId) {
        refreshWarning =
          "The PayPal partner merchant ID is required to check setup status.";
      } else {
        refreshWarning =
          "No PayPal seller account was found yet. Start or continue setup first.";
      }
    } catch (error) {
      console.error("PayPal onboarding status refresh failed:", error);
      refreshWarning = getPayPalErrorMessage(error);
    }
  }

  return json(req, {
    success: true,
    environment: config?.environment || getConfiguredEnvironment(),
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
        error: "A Guru workspace is required for PayPal setup.",
        roles,
      },
      403,
    );
  }

  const config = tryGetPayPalConfig();

  if (!config) {
    return json(
      req,
      {
        success: false,
        error:
          "PayPal setup is not ready yet. Add the Client ID, Client Secret, Partner Merchant ID, and Partner Attribution ID for the active environment.",
        activeEnvironment: getConfiguredEnvironment(),
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

    const canonical = await findCanonicalMerchantAccount(
      user.id,
      config.environment,
    );
    const referralMetadata = getExistingReferralMetadata(existing);

    if (!forceNew) {
      const renewed = await renewReferralUrl({
        config,
        selfUrl:
          referralMetadata.selfUrl ||
          firstNonEmpty(
            asRecord(canonical?.merchant_details)?.referral_self_url,
          ),
      }).catch((error) => {
        console.warn("PayPal referral renewal warning:", error);
        return null;
      });

      if (renewed) {
        const trackingId = firstNonEmpty(
          canonical?.tracking_id,
          referralMetadata.trackingId,
          `sitguru-${config.environment}-${user.id}`,
        );
        const state = buildOnboardingState({
          status: null,
          merchantId: firstNonEmpty(
            canonical?.paypal_merchant_id,
            existing?.provider_merchant_id,
            existing?.provider_account_id,
          ),
          trackingId,
          fallbackEmail: user.email || "",
        });

        const account = await savePayoutAccount({
          userId: user.id,
          roles,
          environment: config.environment,
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
          canonicalStatus: "referral_created",
          onboardingActionUrl: renewed.actionUrl,
          referralResponse: renewed.payload,
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

    const trackingId = [
      "sitguru",
      config.environment,
      user.id,
      randomUUID(),
    ].join("-");
    const referral = await createReferral({
      req,
      user,
      trackingId,
    });
    const state = buildOnboardingState({
      status: null,
      merchantId: firstNonEmpty(
        canonical?.paypal_merchant_id,
        existing?.provider_merchant_id,
        existing?.provider_account_id,
      ),
      trackingId,
      fallbackEmail: user.email || "",
    });

    const account = await savePayoutAccount({
      userId: user.id,
      roles,
      environment: config.environment,
      state,
      metadata: {
        paypal_tracking_id: trackingId,
        paypal_partner_referral_id: referral.referralId || null,
        paypal_referral_self_url: referral.selfUrl || null,
        paypal_onboarding_action_url_created_at: new Date().toISOString(),
        paypal_requested_features: getRequestedFeatures(),
        paypal_requested_products: ["PPCP"],
        paypal_referral_renewed: false,
      },
      canonicalStatus: "referral_created",
      onboardingActionUrl: referral.actionUrl,
      referralResponse: referral.payload,
    });

    return json(
      req,
      {
        success: true,
        environment: config.environment,
        onboardingUrl: referral.actionUrl,
        referralId: referral.referralId || null,
        account: publicAccount(account),
        message: "Your secure PayPal setup link is ready.",
      },
      201,
    );
  } catch (error) {
    console.error("PayPal seller onboarding creation failed:", error);

    return json(
      req,
      {
        success: false,
        error: getPayPalErrorMessage(error),
      },
      error instanceof PayPalApiError ? 502 : 500,
    );
  }
}