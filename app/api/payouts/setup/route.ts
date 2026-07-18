import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

type FinancialRole = "guru" | "ambassador";
type RoleContext = FinancialRole | "multi_role" | "unknown";
type GuruProvider = "stripe" | "paypal" | "set_up_later";
type AmbassadorProvider = "paypal" | "venmo" | "set_up_later";
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
  account_purpose:
    | "guru_marketplace_seller"
    | "guru_payout"
    | "ambassador_reward";
  provider: "stripe" | "paypal";
  provider_account_id: string | null;
  provider_merchant_id: string | null;
  provider_payer_id: string | null;
  provider_email: string | null;
  onboarding_status:
    | "not_started"
    | "in_progress"
    | "pending_review"
    | "ready"
    | "restricted"
    | "disabled";
  account_status:
    | "pending"
    | "active"
    | "restricted"
    | "disabled"
    | "disconnected";
  details_submitted: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  country_code: string;
  default_currency: string;
  is_default: boolean;
  is_live: boolean;
  requirements_currently_due: unknown[] | null;
  requirements_eventually_due: unknown[] | null;
  capabilities: Record<string, unknown> | null;
  connected_at: string | null;
  onboarding_completed_at: string | null;
  disabled_at: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
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
  provider: Exclude<AmbassadorProvider, "set_up_later">;
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
  provider: AmbassadorProvider,
  destinationTypeValue: unknown,
  destinationValueValue: unknown,
): SaveDestinationInput | null {
  if (provider === "set_up_later") return null;

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

async function ensurePreference(
  userId: string,
  roles: FinancialRole[],
): Promise<PayoutPreferenceRow | null> {
  const { data: existing, error: readError } = await supabaseAdmin
    .from("user_payout_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (readError) {
    console.error("PAYOUT PREFERENCE READ ERROR:", readError);
    return null;
  }

  const roleContext = getRoleContext(roles);

  if (existing) {
    const row = existing as PayoutPreferenceRow;

    if (row.role_context !== roleContext) {
      const { data: updated, error: updateError } = await supabaseAdmin
        .from("user_payout_preferences")
        .update({ role_context: roleContext })
        .eq("user_id", userId)
        .select("*")
        .single();

      if (updateError) {
        console.warn(
          "PAYOUT ROLE CONTEXT UPDATE WARNING:",
          updateError.message,
        );
        return row;
      }

      return updated as PayoutPreferenceRow;
    }

    return row;
  }

  const { data: created, error: createError } = await supabaseAdmin
    .from("user_payout_preferences")
    .insert({
      user_id: userId,
      role_context: roleContext,
      financial_onboarding_status: "deferred",
      onboarding_deferred: true,
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

function publicAccount(account: PayoutAccountRow) {
  return {
    id: account.id,
    accountPurpose: account.account_purpose,
    provider: account.provider,
    providerAccountId: account.provider_account_id
      ? maskIdentifier(account.provider_account_id)
      : null,
    providerMerchantId: account.provider_merchant_id
      ? maskIdentifier(account.provider_merchant_id)
      : null,
    providerPayerId: account.provider_payer_id
      ? maskIdentifier(account.provider_payer_id)
      : null,
    providerEmail: account.provider_email
      ? maskEmail(account.provider_email)
      : null,
    onboardingStatus: account.onboarding_status,
    accountStatus: account.account_status,
    detailsSubmitted: account.details_submitted,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    countryCode: account.country_code,
    defaultCurrency: account.default_currency,
    isDefault: account.is_default,
    isLive: account.is_live,
    requirementsCurrentlyDue: account.requirements_currently_due || [],
    requirementsEventuallyDue: account.requirements_eventually_due || [],
    capabilities: account.capabilities || {},
    connectedAt: account.connected_at,
    onboardingCompletedAt: account.onboarding_completed_at,
    disabledAt: account.disabled_at,
    lastSyncedAt: account.last_synced_at,
    createdAt: account.created_at,
    updatedAt: account.updated_at,
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

async function loadFinancialSetup(
  userId: string,
  roles: FinancialRole[],
  role: FinancialRole,
) {
  await ensurePreference(userId, roles);
  await refreshReadiness(userId);

  const [preferenceResult, accountsResult, destinationsResult] =
    await Promise.all([
      supabaseAdmin
        .from("user_payout_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
      supabaseAdmin
        .from("user_payout_accounts")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: true }),
      role === "ambassador"
        ? supabaseAdmin
            .from("user_payout_destinations")
            .select("*")
            .eq("user_id", userId)
            .in("destination_purpose", ["ambassador_reward", "general_payout"])
            .neq("destination_status", "removed")
            .order("is_default", { ascending: false })
            .order("created_at", { ascending: true })
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (preferenceResult.error) {
    console.error("PAYOUT PREFERENCE STATUS ERROR:", preferenceResult.error);
  }

  if (accountsResult.error) {
    console.error("PAYOUT ACCOUNT READ ERROR:", accountsResult.error);
  }

  if (destinationsResult.error) {
    console.error("PAYOUT DESTINATION READ ERROR:", destinationsResult.error);
  }

  const preference =
    (preferenceResult.data as PayoutPreferenceRow | null) || null;
  const accounts = (accountsResult.data || []) as PayoutAccountRow[];
  const destinations = (destinationsResult.data ||
    []) as PayoutDestinationRow[];

  const guruAccounts = accounts.filter((account) =>
    ["guru_marketplace_seller", "guru_payout"].includes(
      account.account_purpose,
    ),
  );

  const readyAccount =
    guruAccounts.find(
      (account) =>
        account.onboarding_status === "ready" &&
        account.account_status === "active" &&
        account.payouts_enabled,
    ) || null;

  const readyDestination =
    destinations.find(
      (destination) =>
        destination.destination_status === "active" &&
        ["verified", "ready"].includes(destination.verification_status),
    ) || null;

  const setupComplete =
    role === "guru" ? Boolean(readyAccount) : Boolean(readyDestination);

  const selectedProvider =
    role === "guru"
      ? preference?.booking_payout_provider || "set_up_later"
      : preference?.reward_payout_provider || "set_up_later";

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
        };

  const nextAction = setupComplete
    ? null
    : selectedProvider === "set_up_later"
      ? "choose_provider"
      : role === "guru"
        ? `connect_${selectedProvider}`
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
            provider: "paypal",
            label: "PayPal",
            description:
              "Add a PayPal destination when a verified reward becomes payable.",
          },
          {
            provider: "venmo",
            label: "Venmo",
            description:
              "Add an eligible Venmo destination when a verified reward becomes payable.",
          },
          {
            provider: "set_up_later",
            label: "Set up later",
            description:
              "Receive a referral code and track verified rewards before adding a payout destination.",
          },
        ];

  return {
    role,
    roleContext: getRoleContext(roles),
    selectedProvider,
    setupComplete,
    nextAction,
    preference,
    accounts: guruAccounts.map(publicAccount),
    destinations: destinations.map(publicDestination),
    readyAccount: readyAccount ? publicAccount(readyAccount) : null,
    readyDestination: readyDestination
      ? publicDestination(readyDestination)
      : null,
    blockers,
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
            readyMessage: "This Guru account can accept paid SitGuru bookings.",
            blockedMessage:
              "Connect and complete Stripe or PayPal payout setup before accepting the first paid booking.",
          }
        : {
            headline: setupComplete
              ? "Your Ambassador reward payout method is ready"
              : "Set up payouts when a reward becomes payable",
            description:
              "You can sign up, receive a referral code, and track verified rewards before adding PayPal or Venmo.",
            readyMessage:
              "This Ambassador account can receive payable SitGuru rewards.",
            blockedMessage:
              "Add and verify a PayPal or Venmo destination before the first payable reward is released.",
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
  const existing = await ensurePreference(userId, roles);
  const now = new Date().toISOString();
  const existingMetadata =
    existing?.metadata && typeof existing.metadata === "object"
      ? existing.metadata
      : {};

  const payload: Record<string, unknown> = {
    user_id: userId,
    role_context: getRoleContext(roles),
    selected_at: now,
    metadata: {
      ...existingMetadata,
      preference_source: "shared_payout_setup_api",
      last_saved_role: role,
      last_preference_saved_at: now,
    },
  };

  if (provider !== "set_up_later") {
    payload.setup_started_at = existing?.setup_started_at || now;
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

  const { error } = await supabaseAdmin
    .from("user_payout_preferences")
    .upsert(payload, { onConflict: "user_id" });

  if (error) {
    throw new Error(error.message);
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
              : "Ambassador provider must be paypal, venmo, or set_up_later.",
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
      message:
        provider === "set_up_later"
          ? "Payout setup has been deferred."
          : destinationSaved
            ? "Payout preference and destination saved. Verification is still required before payout."
            : "Payout preference saved.",
      setup,
    });
  } catch (error) {
    console.error("PAYOUT SETUP SAVE ERROR:", error);

    return json(
      req,
      {
        success: false,
        error: "SitGuru could not save the payout setup preference.",
      },
      500,
    );
  }
}