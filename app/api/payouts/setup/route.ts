import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const PAYOUT_SETUP_API_VERSION = "2026-07-24.2";

type FinancialRole = "guru" | "ambassador";
type RoleContext = FinancialRole | "multi_role" | "unknown";
type GuruProvider = "stripe" | "paypal" | "set_up_later";
type AmbassadorProvider = "stripe" | "paypal" | "venmo" | "set_up_later";
type AmbassadorDestinationProvider = "paypal" | "venmo";
type DestinationType =
  | "email"
  | "mobile_number"
  | "paypal_id"
  | "venmo_account";

type AuthenticatedUser = {
  id: string;
  email?: string | null;
};

type PayoutPreferenceRow = {
  id: string;
  user_id: string;
  workspace_role?: FinancialRole | null;
  preferred_provider?: GuruProvider | AmbassadorProvider | null;
  setup_timing?: string | null;
  allow_setup_later?: boolean | null;
  setup_required?: boolean | null;
  setup_completed?: boolean | null;
  role_context: RoleContext;
  booking_payout_provider: GuruProvider;
  reward_payout_provider: AmbassadorProvider;
  booking_setup_requirement:
    | "before_first_paid_booking"
    | "before_accepting_paid_booking"
    | "already_required";
  reward_setup_requirement:
    | "before_first_reward_payout"
    | "before_reward_release"
    | "already_required";
  financial_onboarding_status:
    | "not_started"
    | "deferred"
    | "in_progress"
    | "ready"
    | "restricted"
    | "disabled";
  onboarding_deferred: boolean;
  profile_completion_requires_payout: boolean;
  search_visibility_requires_payout: boolean;
  accepting_paid_work_requires_payout: boolean;
  reward_release_requires_destination: boolean;
  can_accept_paid_bookings: boolean;
  can_receive_reward_payouts: boolean;
  selected_at: string | null;
  setup_started_at: string | null;
  setup_completed_at: string | null;
  last_verified_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type PayoutAccountRow = {
  id: string;
  user_id: string;
  account_purpose?:
    | "guru_marketplace_seller"
    | "guru_payout"
    | "ambassador_reward"
    | null;
  workspace_role?: FinancialRole | null;
  provider?: "stripe" | "paypal" | null;
  provider_account_id?: string | null;
  provider_merchant_id?: string | null;
  provider_payer_id?: string | null;
  provider_email?: string | null;

  /*
    SitGuru has payout-account rows from more than one schema generation.
    Newer rows use onboarding_status/account_status/is_default. Older live
    rows use status/is_primary. Keep both readable until the database is
    migrated without blocking Stripe or PayPal onboarding.
  */
  onboarding_status?:
    | "not_started"
    | "in_progress"
    | "pending_review"
    | "ready"
    | "restricted"
    | "disabled"
    | null;
  status?: string | null;
  account_status?:
    | "pending"
    | "active"
    | "restricted"
    | "disabled"
    | "disconnected"
    | null;

  details_submitted?: boolean | null;
  charges_enabled?: boolean | null;
  payouts_enabled?: boolean | null;
  country_code?: string | null;
  default_currency?: string | null;
  is_default?: boolean | null;
  is_primary?: boolean | null;
  is_live?: boolean | null;
  requirements_currently_due?: unknown[] | null;
  requirements_eventually_due?: unknown[] | null;
  capabilities?: Record<string, unknown> | null;
  connected_at?: string | null;
  onboarding_started_at?: string | null;
  onboarding_completed_at?: string | null;
  disabled_at?: string | null;
  last_synced_at?: string | null;
  last_checked_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type PayoutDestinationRow = {
  id: string;
  user_id: string;
  destination_purpose: "ambassador_reward" | "guru_reward" | "general_payout";
  provider: "paypal" | "venmo";
  destination_type: DestinationType;
  destination_value?: string | null;
  display_value: string | null;
  verification_status:
    | "unverified"
    | "pending"
    | "verified"
    | "ready"
    | "failed";
  destination_status: "active" | "disabled" | "removed";
  is_default: boolean;
  is_live: boolean;
  verified_at: string | null;
  last_used_at: string | null;
  disabled_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type SaveDestinationInput = {
  provider: AmbassadorDestinationProvider;
  destinationType: DestinationType;
  destinationValue: string;
};

const LOCAL_ORIGINS = new Set([
  "http://localhost:3000",
  "http://localhost:8081",
  "http://localhost:8082",
  "http://localhost:19000",
  "http://localhost:19006",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:8081",
  "http://127.0.0.1:8082",
  "http://127.0.0.1:19000",
  "http://127.0.0.1:19006",
]);

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOrigin(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function isAllowedOrigin(origin: string) {
  const normalized = normalizeOrigin(origin);

  if (LOCAL_ORIGINS.has(normalized)) {
    return true;
  }

  try {
    const url = new URL(normalized);
    const isSitGuruOrigin =
      url.protocol === "https:" &&
      (url.hostname === "sitguru.com" || url.hostname.endsWith(".sitguru.com"));

    const isPrivateIpv4 = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(
      url.hostname,
    );
    const isExpoDevPort = ["3000", "8081", "8082", "19000", "19006"].includes(
      url.port,
    );
    const isLocalExpoOrigin =
      url.protocol === "http:" && isPrivateIpv4 && isExpoDevPort;

    return isSitGuruOrigin || isLocalExpoOrigin;
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
  headers["Access-Control-Allow-Methods"] = "GET, PATCH, OPTIONS";
  headers["Access-Control-Allow-Origin"] = origin;
  headers["Access-Control-Max-Age"] = "86400";

  return headers;
}

function json(req: NextRequest, body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: corsHeaders(req),
  });
}

function normalizeRole(value: unknown): FinancialRole | null {
  const normalized = safeString(value).toLowerCase();

  if (
    normalized === "guru" ||
    normalized === "pet_guru" ||
    normalized === "pet guru" ||
    normalized === "pet_care_guru" ||
    normalized === "pet care guru" ||
    normalized === "sitter"
  ) {
    return "guru";
  }

  if (
    normalized === "ambassador" ||
    normalized === "community_ambassador" ||
    normalized === "student_ambassador" ||
    normalized === "veteran_ambassador"
  ) {
    return "ambassador";
  }

  return null;
}

function normalizeGuruProvider(value: unknown): GuruProvider | null {
  const normalized = safeString(value).toLowerCase();

  if (
    !normalized ||
    normalized === "none" ||
    normalized === "later" ||
    normalized === "set_up_later" ||
    normalized === "setup_later"
  ) {
    return "set_up_later";
  }

  if (normalized === "stripe" || normalized === "stripe_connect") {
    return "stripe";
  }

  if (normalized === "paypal") {
    return "paypal";
  }

  return null;
}

function normalizeAmbassadorProvider(
  value: unknown,
): AmbassadorProvider | null {
  const normalized = safeString(value).toLowerCase();

  if (
    !normalized ||
    normalized === "none" ||
    normalized === "later" ||
    normalized === "set_up_later" ||
    normalized === "setup_later"
  ) {
    return "set_up_later";
  }

  if (normalized === "stripe" || normalized === "stripe_connect") {
    return "stripe";
  }

  if (normalized === "paypal" || normalized === "venmo") {
    return normalized;
  }

  return null;
}

function getRoleContext(roles: FinancialRole[]): RoleContext {
  const hasGuru = roles.includes("guru");
  const hasAmbassador = roles.includes("ambassador");

  if (hasGuru && hasAmbassador) return "multi_role";
  if (hasGuru) return "guru";
  if (hasAmbassador) return "ambassador";
  return "unknown";
}

function uniqueRoles(values: unknown[]) {
  const roles = new Set<FinancialRole>();

  for (const value of values) {
    const role = normalizeRole(value);
    if (role) roles.add(role);
  }

  return Array.from(roles);
}

function maskEmail(value: string) {
  const [localPart, domain] = value.split("@");

  if (!localPart || !domain) return "••••";

  const visible = localPart.slice(0, Math.min(2, localPart.length));
  return `${visible}${"•".repeat(Math.max(2, localPart.length - visible.length))}@${domain}`;
}

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return "••••";
  return `•••-•••-${digits.slice(-4)}`;
}

function maskIdentifier(value: string) {
  if (value.includes("@")) return maskEmail(value);

  const digits = value.replace(/\D/g, "");
  if (digits.length >= 7) return maskPhone(value);

  if (value.length <= 4) return "••••";
  return `${value.slice(0, 2)}${"•".repeat(Math.max(2, value.length - 4))}${value.slice(-2)}`;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeUsMobile(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

function sanitizeDestinationInput(
  provider: AmbassadorDestinationProvider,
  destinationTypeValue: unknown,
  destinationValueValue: unknown,
): SaveDestinationInput | null {

  const rawType = safeString(destinationTypeValue).toLowerCase();
  const rawValue = safeString(destinationValueValue);

  if (!rawValue) return null;

  if (provider === "paypal") {
    const destinationType: DestinationType =
      rawType === "paypal_id" ? "paypal_id" : "email";

    if (destinationType === "email" && !isValidEmail(rawValue)) {
      return null;
    }

    return {
      provider,
      destinationType,
      destinationValue:
        destinationType === "email" ? rawValue.toLowerCase() : rawValue,
    };
  }

  const destinationType: DestinationType =
    rawType === "venmo_account" ? "venmo_account" : "mobile_number";

  if (destinationType === "mobile_number") {
    const normalizedMobile = normalizeUsMobile(rawValue);
    if (!normalizedMobile) return null;

    return {
      provider,
      destinationType,
      destinationValue: normalizedMobile,
    };
  }

  return {
    provider,
    destinationType,
    destinationValue: rawValue,
  };
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

    if (error || !data.user) {
      return null;
    }

    return {
      id: data.user.id,
      email: data.user.email,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
  };
}

async function getFinancialRoles(user: AuthenticatedUser) {
  const roleValues: unknown[] = [];

  const [roleRowsResult, profileResult, guruResult, ambassadorResult] =
    await Promise.all([
      supabaseAdmin.from("user_roles").select("role").eq("user_id", user.id),
      supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle(),
      supabaseAdmin.from("gurus").select("id").eq("user_id", user.id).limit(1),
      supabaseAdmin
        .from("ambassadors")
        .select("id")
        .eq("user_id", user.id)
        .limit(1),
    ]);

  if (roleRowsResult.error) {
    console.warn(
      "PAYOUT SETUP USER_ROLES LOOKUP WARNING:",
      roleRowsResult.error.message,
    );
  } else {
    for (const row of roleRowsResult.data || []) {
      roleValues.push(row.role);
    }
  }

  if (profileResult.error) {
    console.warn(
      "PAYOUT SETUP PROFILE LOOKUP WARNING:",
      profileResult.error.message,
    );
  } else if (profileResult.data) {
    const profile = profileResult.data as Record<string, unknown>;
    roleValues.push(
      profile.role,
      profile.primary_role,
      profile.user_role,
      profile.account_type,
      profile.type,
    );
  }

  if (!guruResult.error && (guruResult.data || []).length > 0) {
    roleValues.push("guru");
  }

  if (!ambassadorResult.error && (ambassadorResult.data || []).length > 0) {
    roleValues.push("ambassador");
  }

  if (uniqueRoles(roleValues).length === 0 && user.email) {
    const normalizedEmail = user.email.toLowerCase();

    const [guruByEmailResult, ambassadorByEmailResult] = await Promise.all([
      supabaseAdmin
        .from("gurus")
        .select("id")
        .eq("email", normalizedEmail)
        .limit(1),
      supabaseAdmin
        .from("ambassadors")
        .select("id")
        .or(
          `email.eq.${normalizedEmail},login_email.eq.${normalizedEmail},contact_email.eq.${normalizedEmail}`,
        )
        .limit(1),
    ]);

    if (!guruByEmailResult.error && (guruByEmailResult.data || []).length > 0) {
      roleValues.push("guru");
    }

    if (
      !ambassadorByEmailResult.error &&
      (ambassadorByEmailResult.data || []).length > 0
    ) {
      roleValues.push("ambassador");
    }
  }

  return uniqueRoles(roleValues);
}

function preferenceMatchesRole(
  preference: PayoutPreferenceRow,
  role: FinancialRole,
) {
  const workspaceRole = normalizeRole(preference.workspace_role);

  if (workspaceRole) {
    return workspaceRole === role;
  }

  if (preference.role_context === role) {
    return true;
  }

  if (preference.role_context === "multi_role") {
    return role === "guru"
      ? normalizeGuruProvider(preference.booking_payout_provider) !== null
      : normalizeAmbassadorProvider(preference.reward_payout_provider) !== null;
  }

  return false;
}

async function findPreferenceForRole(
  userId: string,
  role: FinancialRole,
): Promise<PayoutPreferenceRow | null> {
  const { data, error } = await supabaseAdmin
    .from("user_payout_preferences")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("PAYOUT PREFERENCE READ ERROR:", error);
    return null;
  }

  const rows = (data || []) as PayoutPreferenceRow[];

  return rows.find((row) => preferenceMatchesRole(row, role)) || null;
}

async function ensurePreference(
  userId: string,
  roles: FinancialRole[],
  role: FinancialRole,
): Promise<PayoutPreferenceRow | null> {
  const existing = await findPreferenceForRole(userId, role);
  const roleContext = getRoleContext(roles);

  if (existing) {
    const updates: Record<string, unknown> = {};

    if (existing.workspace_role !== role) {
      updates.workspace_role = role;
    }

    if (existing.role_context !== roleContext) {
      updates.role_context = roleContext;
    }

    if (Object.keys(updates).length === 0) {
      return existing;
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("user_payout_preferences")
      .update(updates)
      .eq("id", existing.id)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (updateError) {
      console.warn(
        "PAYOUT ROLE-SCOPED PREFERENCE UPDATE WARNING:",
        updateError.message,
      );
      return existing;
    }

    return updated as PayoutPreferenceRow;
  }

  const now = new Date().toISOString();
  const { data: created, error: createError } = await supabaseAdmin
    .from("user_payout_preferences")
    .insert({
      user_id: userId,
      workspace_role: role,
      role_context: roleContext,
      preferred_provider: "set_up_later",
      booking_payout_provider: "set_up_later",
      reward_payout_provider: "set_up_later",
      financial_onboarding_status: "deferred",
      onboarding_deferred: true,
      allow_setup_later: true,
      setup_required: true,
      setup_completed: false,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (createError) {
    console.error("PAYOUT PREFERENCE CREATE ERROR:", createError);
    return null;
  }

  return created as PayoutPreferenceRow;
}

async function refreshReadiness(userId: string) {
  const { error } = await supabaseAdmin.rpc(
    "sitguru_refresh_user_payout_readiness",
    { p_user_id: userId },
  );

  if (error) {
    console.warn("PAYOUT READINESS REFRESH WARNING:", error.message);
  }
}

function getAccountPurpose(
  account: PayoutAccountRow,
): "guru_marketplace_seller" | "guru_payout" | "ambassador_reward" {
  if (
    account.account_purpose === "guru_marketplace_seller" ||
    account.account_purpose === "guru_payout" ||
    account.account_purpose === "ambassador_reward"
  ) {
    return account.account_purpose;
  }

  return account.workspace_role === "ambassador"
    ? "ambassador_reward"
    : "guru_marketplace_seller";
}

function getAccountOnboardingStatus(account: PayoutAccountRow) {
  const raw = safeString(
    account.onboarding_status || account.status || "not_started",
  ).toLowerCase();

  if (
    ["ready", "active", "connected", "complete", "completed"].includes(raw)
  ) {
    return "ready";
  }

  if (["restricted", "limited", "denied", "declined"].includes(raw)) {
    return "restricted";
  }

  if (["disabled", "disconnected", "revoked"].includes(raw)) {
    return "disabled";
  }

  if (["pending_review", "review", "under_review"].includes(raw)) {
    return "pending_review";
  }

  if (["in_progress", "pending", "started", "selected"].includes(raw)) {
    return "in_progress";
  }

  return "not_started";
}

function getAccountStatus(account: PayoutAccountRow) {
  const raw = safeString(
    account.account_status || account.status || "pending",
  ).toLowerCase();

  if (
    ["active", "ready", "connected", "complete", "completed"].includes(raw)
  ) {
    return "active";
  }

  if (["restricted", "limited", "denied", "declined"].includes(raw)) {
    return "restricted";
  }

  if (["disabled", "revoked"].includes(raw)) {
    return "disabled";
  }

  if (raw === "disconnected") {
    return "disconnected";
  }

  return "pending";
}

function isDefaultPayoutAccount(account: PayoutAccountRow) {
  return account.is_default === true || account.is_primary === true;
}

function sortPayoutAccounts(accounts: PayoutAccountRow[]) {
  return [...accounts].sort((left, right) => {
    const defaultDifference =
      Number(isDefaultPayoutAccount(right)) -
      Number(isDefaultPayoutAccount(left));

    if (defaultDifference !== 0) {
      return defaultDifference;
    }

    const leftCreatedAt = Date.parse(safeString(left.created_at));
    const rightCreatedAt = Date.parse(safeString(right.created_at));

    if (Number.isNaN(leftCreatedAt) && Number.isNaN(rightCreatedAt)) {
      return 0;
    }

    if (Number.isNaN(leftCreatedAt)) return 1;
    if (Number.isNaN(rightCreatedAt)) return -1;

    return leftCreatedAt - rightCreatedAt;
  });
}

function publicAccount(account: PayoutAccountRow) {
  const providerAccountId = safeString(account.provider_account_id);
  const providerMerchantId = safeString(account.provider_merchant_id);
  const providerPayerId = safeString(account.provider_payer_id);
  const providerEmail = safeString(account.provider_email);

  return {
    id: account.id,
    accountPurpose: getAccountPurpose(account),
    provider: account.provider || null,
    providerAccountId: providerAccountId
      ? maskIdentifier(providerAccountId)
      : null,
    providerMerchantId: providerMerchantId
      ? maskIdentifier(providerMerchantId)
      : null,
    providerPayerId: providerPayerId
      ? maskIdentifier(providerPayerId)
      : null,
    providerEmail: providerEmail ? maskEmail(providerEmail) : null,
    onboardingStatus: getAccountOnboardingStatus(account),
    accountStatus: getAccountStatus(account),
    detailsSubmitted: account.details_submitted === true,
    chargesEnabled: account.charges_enabled === true,
    payoutsEnabled: account.payouts_enabled === true,
    countryCode: safeString(account.country_code) || "US",
    defaultCurrency: safeString(account.default_currency) || "USD",
    isDefault: isDefaultPayoutAccount(account),
    isLive: account.is_live === true,
    requirementsCurrentlyDue: account.requirements_currently_due || [],
    requirementsEventuallyDue: account.requirements_eventually_due || [],
    capabilities: account.capabilities || {},
    connectedAt: account.connected_at || null,
    onboardingCompletedAt: account.onboarding_completed_at || null,
    disabledAt: account.disabled_at || null,
    lastSyncedAt:
      account.last_synced_at || account.last_checked_at || null,
    createdAt: account.created_at || null,
    updatedAt: account.updated_at || null,
  };
}

function publicDestination(destination: PayoutDestinationRow) {
  const masked =
    destination.display_value ||
    (destination.destination_value
      ? maskIdentifier(destination.destination_value)
      : null);

  return {
    id: destination.id,
    destinationPurpose: destination.destination_purpose,
    provider: destination.provider,
    destinationType: destination.destination_type,
    displayValue: masked,
    verificationStatus: destination.verification_status,
    destinationStatus: destination.destination_status,
    isDefault: destination.is_default,
    isLive: destination.is_live,
    verifiedAt: destination.verified_at,
    lastUsedAt: destination.last_used_at,
    disabledAt: destination.disabled_at,
    createdAt: destination.created_at,
    updatedAt: destination.updated_at,
  };
}

function publicAmbassadorReadyAccount(destination: PayoutDestinationRow) {
  const publicValue = publicDestination(destination);
  const usesEmail = ["email", "paypal_id"].includes(
    destination.destination_type,
  );
  const usesPhone = ["mobile_number", "venmo_account"].includes(
    destination.destination_type,
  );

  return {
    id: destination.id,
    provider: destination.provider,
    providerEmail: usesEmail ? publicValue.displayValue : null,
    providerPhone: usesPhone ? publicValue.displayValue : null,
    onboardingStatus: destination.verification_status,
    accountStatus: destination.destination_status,
    payoutsEnabled:
      destination.destination_status === "active" &&
      ["verified", "ready"].includes(destination.verification_status),
    isDefault: destination.is_default,
    isLive: destination.is_live,
    verifiedAt: destination.verified_at,
    updatedAt: destination.updated_at,
  };
}

function getAmbassadorSelectedProvider(
  preference: PayoutPreferenceRow | null,
): AmbassadorProvider {
  const metadataProvider = normalizeAmbassadorProvider(
    preference?.metadata?.ambassador_reward_provider,
  );

  if (metadataProvider) return metadataProvider;

  return (
    normalizeAmbassadorProvider(preference?.reward_payout_provider) ||
    "set_up_later"
  );
}

function isReadyPayoutAccount(account: PayoutAccountRow) {
  return (
    getAccountOnboardingStatus(account) === "ready" &&
    getAccountStatus(account) === "active" &&
    account.payouts_enabled === true
  );
}

function isReadyPayoutDestination(destination: PayoutDestinationRow) {
  return (
    destination.destination_status === "active" &&
    ["verified", "ready"].includes(destination.verification_status)
  );
}

async function loadFinancialSetup(
  userId: string,
  roles: FinancialRole[],
  role: FinancialRole,
) {
  const warnings: string[] = [];
  const ensuredPreference = await ensurePreference(userId, roles, role);

  if (!ensuredPreference) {
    warnings.push(
      "Your payout preference record could not be initialized. Existing reward and payout records are still shown.",
    );
  }

  await refreshReadiness(userId);

  const [preferenceResult, accountsResult, destinationsResult] =
    await Promise.all([
      supabaseAdmin
        .from("user_payout_preferences")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false, nullsFirst: false }),
      supabaseAdmin
        .from("user_payout_accounts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      role === "ambassador"
        ? supabaseAdmin
            .from("user_payout_destinations")
            .select("*")
            .eq("user_id", userId)
            .in("destination_purpose", [
              "ambassador_reward",
              "general_payout",
            ])
            .neq("destination_status", "removed")
            .order("is_default", { ascending: false })
            .order("created_at", { ascending: true })
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (preferenceResult.error) {
    console.error("PAYOUT PREFERENCE STATUS ERROR:", preferenceResult.error);
    warnings.push("Your saved payout preference could not be read.");
  }

  if (accountsResult.error) {
    console.error("PAYOUT ACCOUNT READ ERROR:", accountsResult.error);
    warnings.push("Connected Guru payout accounts could not be read.");
  }

  if (destinationsResult.error) {
    console.error("PAYOUT DESTINATION READ ERROR:", destinationsResult.error);
    warnings.push("Your Ambassador reward destination could not be read.");
  }

  const preferenceRows = (preferenceResult.data || []) as PayoutPreferenceRow[];
  const preference =
    preferenceRows.find((row) => preferenceMatchesRole(row, role)) ||
    ensuredPreference ||
    null;
  const accounts = sortPayoutAccounts(
    (accountsResult.data || []) as PayoutAccountRow[],
  );
  const destinations = (destinationsResult.data ||
    []) as PayoutDestinationRow[];

  const guruAccounts = accounts.filter((account) =>
    ["guru_marketplace_seller", "guru_payout"].includes(
      getAccountPurpose(account),
    ),
  );
  const ambassadorStripeAccounts = accounts.filter(
    (account) =>
      getAccountPurpose(account) === "ambassador_reward" &&
      account.provider === "stripe",
  );

  const readyGuruAccount =
    guruAccounts.find(isReadyPayoutAccount) || null;
  const readyAmbassadorStripeAccount =
    ambassadorStripeAccounts.find(
      (account) =>
        isDefaultPayoutAccount(account) && isReadyPayoutAccount(account),
    ) ||
    ambassadorStripeAccounts.find(isReadyPayoutAccount) ||
    null;

  const selectedProvider =
    role === "guru"
      ? preference?.booking_payout_provider || "set_up_later"
      : getAmbassadorSelectedProvider(preference);

  const readyDestinations = destinations.filter(isReadyPayoutDestination);
  const readySelectedDestination =
    selectedProvider === "paypal" || selectedProvider === "venmo"
      ? readyDestinations.find(
          (destination) => destination.provider === selectedProvider,
        ) || null
      : null;
  const readyDefaultDestination =
    readyDestinations.find((destination) => destination.is_default) ||
    readyDestinations[0] ||
    null;
  const readyDestination =
    readySelectedDestination || readyDefaultDestination;

  const readyAmbassadorMethod =
    selectedProvider === "stripe" && readyAmbassadorStripeAccount
      ? readyAmbassadorStripeAccount
      : readyDestination || readyAmbassadorStripeAccount;

  const setupComplete =
    role === "guru"
      ? Boolean(readyGuruAccount)
      : Boolean(readyAmbassadorMethod);

  const commonBlockers = {
    signup: false,
    profileCompletion: false,
    searchVisibility: false,
  };

  const blockers =
    role === "guru"
      ? {
          ...commonBlockers,
          receiveBookingRequests: false,
          acceptFirstPaidBooking: !setupComplete,
          receiveBookingPayout: !setupComplete,
        }
      : {
          ...commonBlockers,
          referralCodeActivation: false,
          trackVerifiedRewards: false,
          receiveFirstPayableReward: !setupComplete,
          receiveRewardPayout: !setupComplete,
        };

  const nextAction = setupComplete
    ? null
    : selectedProvider === "set_up_later"
      ? "choose_provider"
      : role === "guru"
        ? `connect_${selectedProvider}`
        : selectedProvider === "stripe"
          ? "connect_stripe"
          : "add_or_verify_destination";

  const providerOptions =
    role === "guru"
      ? [
          {
            provider: "stripe",
            label: "Stripe",
            description:
              "Connect Stripe before accepting your first paid SitGuru booking.",
          },
          {
            provider: "paypal",
            label: "PayPal",
            description:
              "Connect an eligible PayPal seller account before accepting your first paid SitGuru booking.",
          },
          {
            provider: "set_up_later",
            label: "Set up later",
            description:
              "Finish your profile, appear in search, and receive booking requests before financial onboarding.",
          },
        ]
      : [
          {
            provider: "stripe",
            label: "Bank or debit card",
            description:
              "Get rewards sent to your bank or eligible debit card. Powered by Stripe.",
          },
          {
            provider: "paypal",
            label: "PayPal",
            description: "Send rewards to your PayPal.",
          },
          {
            provider: "venmo",
            label: "Venmo",
            description: "Get rewards through Venmo.",
          },
          {
            provider: "set_up_later",
            label: "Do this later",
            description: "Keep earning and finish this before your first payout.",
          },
        ];

  const publicReadyGuruAccount = readyGuruAccount
    ? publicAccount(readyGuruAccount)
    : null;
  const publicReadyAmbassadorStripeAccount = readyAmbassadorStripeAccount
    ? publicAccount(readyAmbassadorStripeAccount)
    : null;
  const publicReadyDestination = readyDestination
    ? publicDestination(readyDestination)
    : null;
  const publicReadyAmbassadorDestination = readyDestination
    ? publicAmbassadorReadyAccount(readyDestination)
    : null;
  const ambassadorReadyAccount =
    selectedProvider === "stripe" && publicReadyAmbassadorStripeAccount
      ? publicReadyAmbassadorStripeAccount
      : publicReadyAmbassadorDestination ||
        publicReadyAmbassadorStripeAccount;

  return {
    role,
    roleContext: getRoleContext(roles),
    selectedProvider,
    setupComplete,
    nextAction,
    preference,
    accounts:
      role === "guru"
        ? guruAccounts.map(publicAccount)
        : [
            ...ambassadorStripeAccounts.map(publicAccount),
            ...destinations.map(publicAmbassadorReadyAccount),
          ],
    destinations: destinations.map(publicDestination),
    readyAccount:
      role === "guru" ? publicReadyGuruAccount : ambassadorReadyAccount,
    readyDestination: publicReadyDestination,
    blockers,
    warnings,
    rules: {
      payoutRequiredDuringSignup: false,
      payoutRequiredForProfileCompletion: false,
      payoutRequiredForSearchVisibility: false,
      guruRequirement: "before_accepting_first_paid_booking",
      ambassadorRequirement: "before_receiving_first_payable_reward",
    },
    providerOptions,
    messaging:
      role === "guru"
        ? {
            headline: setupComplete
              ? "Your Guru payout method is ready"
              : "Set up payouts before accepting your first paid booking",
            description:
              "You can sign up, complete your Guru profile, appear in search, and receive booking requests before connecting Stripe or PayPal.",
            readyMessage:
              "This Guru account can accept paid SitGuru bookings.",
            blockedMessage:
              "Connect and complete Stripe or PayPal payout setup before accepting the first paid booking.",
          }
        : {
            headline: setupComplete
              ? "You’re ready to get paid"
              : "Pick how you get paid",
            description:
              "Choose bank or debit card, PayPal, or Venmo. You can switch later.",
            readyMessage:
              "Your Ambassador account is ready for approved reward payments.",
            blockedMessage:
              "Finish one payment option before your first approved reward is sent.",
          },
  };
}

async function savePreference({
  userId,
  roles,
  role,
  provider,
}: {
  userId: string;
  roles: FinancialRole[];
  role: FinancialRole;
  provider: GuruProvider | AmbassadorProvider;
}) {
  const existing = await ensurePreference(userId, roles, role);
  const now = new Date().toISOString();
  const existingMetadata =
    existing?.metadata && typeof existing.metadata === "object"
      ? existing.metadata
      : {};

  const payload: Record<string, unknown> = {
    user_id: userId,
    workspace_role: role,
    role_context: getRoleContext(roles),
    preferred_provider: provider,
    selected_at: now,
    allow_setup_later: true,
    setup_required: provider !== "set_up_later",
    setup_completed: false,
    metadata: {
      ...existingMetadata,
      preference_source: "shared_payout_setup_api",
      last_saved_role: role,
      last_preference_saved_at: now,
      ...(role === "ambassador"
        ? { ambassador_reward_provider: provider }
        : {}),
    },
  };

  if (provider !== "set_up_later") {
    payload.setup_started_at = existing?.setup_started_at || now;
    payload.financial_onboarding_status = "in_progress";
    payload.onboarding_deferred = false;
  } else {
    payload.setup_started_at = null;
    payload.financial_onboarding_status = "deferred";
    payload.onboarding_deferred = true;
  }

  if (role === "guru") {
    payload.booking_payout_provider = provider;
    payload.booking_setup_requirement = "before_first_paid_booking";
  } else {
    payload.reward_payout_provider = provider;
    payload.reward_setup_requirement = "before_first_reward_payout";
  }

  const writeResult = existing?.id
    ? await supabaseAdmin
        .from("user_payout_preferences")
        .update(payload)
        .eq("id", existing.id)
        .eq("user_id", userId)
    : await supabaseAdmin.from("user_payout_preferences").insert({
        ...payload,
        created_at: now,
      });

  if (!writeResult.error) return;

  const isAmbassadorStripeCompatibilityError =
    role === "ambassador" && provider === "stripe";

  if (!isAmbassadorStripeCompatibilityError) {
    throw new Error(writeResult.error.message);
  }

  const compatibilityPayload = {
    ...payload,
    reward_payout_provider: "set_up_later",
    metadata: {
      ...(payload.metadata as Record<string, unknown>),
      ambassador_reward_provider: "stripe",
      stripe_preference_storage: "metadata_compatibility",
    },
  };

  const compatibilityResult = existing?.id
    ? await supabaseAdmin
        .from("user_payout_preferences")
        .update(compatibilityPayload)
        .eq("id", existing.id)
        .eq("user_id", userId)
    : await supabaseAdmin.from("user_payout_preferences").insert({
        ...compatibilityPayload,
        created_at: now,
      });

  if (compatibilityResult.error) {
    throw new Error(compatibilityResult.error.message);
  }
}

async function saveAmbassadorDestination({
  userId,
  input,
}: {
  userId: string;
  input: SaveDestinationInput;
}) {
  const { data: matchingRows, error: matchingError } = await supabaseAdmin
    .from("user_payout_destinations")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", input.provider)
    .eq("destination_type", input.destinationType)
    .neq("destination_status", "removed");

  if (matchingError) {
    throw new Error(matchingError.message);
  }

  const existing = ((matchingRows || []) as PayoutDestinationRow[]).find(
    (row) =>
      safeString(row.destination_value).toLowerCase() ===
      input.destinationValue.toLowerCase(),
  );

  const now = new Date().toISOString();
  const displayValue = maskIdentifier(input.destinationValue);
  let destinationId = existing?.id || null;

  if (existing) {
    const { error } = await supabaseAdmin
      .from("user_payout_destinations")
      .update({
        destination_purpose: "ambassador_reward",
        destination_value: input.destinationValue,
        display_value: displayValue,
        destination_status: "active",
        is_default: false,
        metadata: {
          ...(existing.metadata || {}),
          preference_source: "shared_payout_setup_api",
          last_updated_at: now,
        },
      })
      .eq("id", existing.id)
      .eq("user_id", userId);

    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await supabaseAdmin
      .from("user_payout_destinations")
      .insert({
        user_id: userId,
        destination_purpose: "ambassador_reward",
        provider: input.provider,
        destination_type: input.destinationType,
        destination_value: input.destinationValue,
        display_value: displayValue,
        verification_status: "unverified",
        destination_status: "active",
        is_default: false,
        metadata: {
          preference_source: "shared_payout_setup_api",
          created_at: now,
        },
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    destinationId = data.id;
  }

  if (!destinationId) {
    throw new Error("The payout destination could not be saved.");
  }

  const { error: unsetDefaultError } = await supabaseAdmin
    .from("user_payout_destinations")
    .update({ is_default: false })
    .eq("user_id", userId)
    .eq("destination_purpose", "ambassador_reward")
    .eq("destination_status", "active")
    .neq("id", destinationId);

  if (unsetDefaultError) {
    throw new Error(unsetDefaultError.message);
  }

  const { error: setDefaultError } = await supabaseAdmin
    .from("user_payout_destinations")
    .update({ is_default: true })
    .eq("id", destinationId)
    .eq("user_id", userId);

  if (setDefaultError) {
    throw new Error(setDefaultError.message);
  }

  return destinationId;
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req),
  });
}

export async function GET(req: NextRequest) {
  try {
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

    const roles = await getFinancialRoles(user);
    const requestedRole = normalizeRole(req.nextUrl.searchParams.get("role"));

    if (requestedRole && !roles.includes(requestedRole)) {
      return json(
        req,
        {
          success: false,
          error: `The ${requestedRole} workspace is not assigned to this account.`,
          roles,
        },
        403,
      );
    }

    const role =
      requestedRole ||
      (roles.includes("guru")
        ? "guru"
        : roles.includes("ambassador")
          ? "ambassador"
          : null);

    if (!role) {
      return json(
        req,
        {
          success: false,
          error: "A Guru or Ambassador workspace is required for payout setup.",
          roles,
        },
        403,
      );
    }

    const setup = await loadFinancialSetup(user.id, roles, role);

    return json(req, {
      success: true,
      apiVersion: PAYOUT_SETUP_API_VERSION,
      user: {
        id: user.id,
        email: user.email || null,
      },
      roles,
      setup,
    });
  } catch (error) {
    console.error("PAYOUT SETUP STATUS ERROR:", error);

    return json(
      req,
      {
        success: false,
        apiVersion: PAYOUT_SETUP_API_VERSION,
        error: "SitGuru could not load payout setup status.",
      },
      500,
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
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

    const body = (await req.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;

    if (!body) {
      return json(
        req,
        {
          success: false,
          error: "Request body must be valid JSON.",
        },
        400,
      );
    }

    const role = normalizeRole(body.role);

    if (!role) {
      return json(
        req,
        {
          success: false,
          error: "Role must be guru or ambassador.",
        },
        400,
      );
    }

    const roles = await getFinancialRoles(user);

    if (!roles.includes(role)) {
      return json(
        req,
        {
          success: false,
          error: `The ${role} workspace is not assigned to this account.`,
          roles,
        },
        403,
      );
    }

    const provider =
      role === "guru"
        ? normalizeGuruProvider(
            body.preferredProvider ?? body.provider ?? body.payoutProvider,
          )
        : normalizeAmbassadorProvider(
            body.preferredProvider ?? body.provider ?? body.payoutProvider,
          );

    if (!provider) {
      return json(
        req,
        {
          success: false,
          error:
            role === "guru"
              ? "Guru provider must be stripe, paypal, or set_up_later."
              : "Ambassador provider must be stripe, paypal, venmo, or set_up_later.",
        },
        400,
      );
    }

    await savePreference({
      userId: user.id,
      roles,
      role,
      provider,
    });

    let destinationSaved = false;

    if (
      role === "ambassador" &&
      (provider === "paypal" || provider === "venmo")
    ) {
      const hasDestinationValue = Boolean(
        safeString(body.destinationValue ?? body.recipientValue),
      );

      if (hasDestinationValue) {
        const destinationInput = sanitizeDestinationInput(
          provider,
          body.destinationType ?? body.recipientType,
          body.destinationValue ?? body.recipientValue,
        );

        if (!destinationInput) {
          return json(
            req,
            {
              success: false,
              error:
                provider === "paypal"
                  ? "Enter a valid PayPal email or PayPal ID."
                  : "Enter a valid U.S. mobile number or Venmo account.",
            },
            400,
          );
        }

        await saveAmbassadorDestination({
          userId: user.id,
          input: destinationInput,
        });
        destinationSaved = true;
      }
    }

    await refreshReadiness(user.id);
    const setup = await loadFinancialSetup(user.id, roles, role);

    return json(req, {
      success: true,
      apiVersion: PAYOUT_SETUP_API_VERSION,
      message:
        provider === "set_up_later"
          ? "Saved for later. You can finish payment setup anytime."
          : role === "guru" && provider === "stripe"
            ? "Stripe selected. Finish the secure Stripe steps to get paid for bookings."
            : role === "guru" && provider === "paypal"
              ? "PayPal selected. Finish the secure PayPal steps to get paid for bookings."
              : provider === "stripe"
                ? "Bank or debit card selected. Finish Stripe setup before your first reward is sent."
                : destinationSaved
                  ? "Payment option saved. Complete verification before your first reward is sent."
                  : `${provider === "paypal" ? "PayPal" : "Venmo"} selected. Add and verify your account before your first reward is sent.`,
      setup,
    });
  } catch (error) {
    console.error("PAYOUT SETUP SAVE ERROR:", error);

    return json(
      req,
      {
        success: false,
        apiVersion: PAYOUT_SETUP_API_VERSION,
        error: "SitGuru could not save the payout setup preference.",
      },
      500,
    );
  }
}