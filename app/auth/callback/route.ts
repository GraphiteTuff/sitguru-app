import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AccountIntent = "pet_parent" | "guru" | "ambassador" | "both";
type ProvisionResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  intent?: string;
  profileRole?: string | null;
  roles?: string[];
  referralCode?: string | null;
  workspaceReady?: boolean;
  requiresEmailVerification?: boolean;
};

type TrackingContext = {
  program: string;
  source: string;
  platform: string;
  campaign: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
};

const fallbackRoutes = {
  admin: "/admin",
  customerProfile: "/customer/dashboard/profile",
  guruProfile: "/guru/dashboard/profile",
  ambassadorDashboard: "/ambassador/dashboard",
  resetPassword: "/reset-password",
  signup: "/signup",
  login: "/login",
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeRole(value: unknown) {
  return cleanText(value).toLowerCase().replace(/[\s-]+/g, "_");
}

function normalizeCallbackIntent(value: unknown): AccountIntent | null {
  const normalized = normalizeRole(value);

  if (
    ["customer", "pet_parent", "petparent", "pet_owner", "parent"].includes(
      normalized,
    )
  ) {
    return "pet_parent";
  }

  if (
    [
      "guru",
      "future_guru",
      "provider",
      "sitter",
      "walker",
      "pet_guru",
    ].includes(normalized)
  ) {
    return "guru";
  }

  if (
    [
      "ambassador",
      "partner",
      "community_ambassador",
      "student_ambassador",
    ].includes(normalized)
  ) {
    return "ambassador";
  }

  if (
    [
      "both",
      "customer_guru",
      "pet_parent_and_guru",
      "pet_owner_and_guru",
    ].includes(normalized)
  ) {
    return "both";
  }

  return null;
}

function getProfileRoleFromIntent(intent: AccountIntent) {
  if (intent === "pet_parent") return "customer";
  return intent;
}

function isAdminRole(value: unknown) {
  return [
    "admin",
    "owner",
    "super_admin",
    "super_user",
    "superuser",
    "founder",
    "ceo",
    "founder_ceo",
    "co_founder",
  ].includes(normalizeRole(value));
}

function isGuruRole(value: unknown) {
  return [
    "guru",
    "future_guru",
    "provider",
    "sitter",
    "walker",
    "caretaker",
    "pet_care_guru",
    "both",
  ].includes(normalizeRole(value));
}

function isAmbassadorRole(value: unknown) {
  return [
    "ambassador",
    "ambassadors",
    "partner",
    "community_ambassador",
    "student_ambassador",
    "representative",
    "rep",
  ].includes(normalizeRole(value));
}

function isCustomerRole(value: unknown) {
  return [
    "customer",
    "pet_parent",
    "pet_owner",
    "parent",
    "client",
    "both",
  ].includes(normalizeRole(value));
}

function getIntentRedirectPath(intent: AccountIntent) {
  if (intent === "guru" || intent === "both") {
    return fallbackRoutes.guruProfile;
  }

  if (intent === "ambassador") {
    return fallbackRoutes.ambassadorDashboard;
  }

  return fallbackRoutes.customerProfile;
}

function getRoleRedirectPath(role: unknown, accountType?: unknown) {
  if (isAdminRole(role) || isAdminRole(accountType)) {
    return fallbackRoutes.admin;
  }

  if (isGuruRole(role) || isGuruRole(accountType)) {
    return fallbackRoutes.guruProfile;
  }

  if (isAmbassadorRole(role) || isAmbassadorRole(accountType)) {
    return fallbackRoutes.ambassadorDashboard;
  }

  if (isCustomerRole(role) || isCustomerRole(accountType)) {
    return fallbackRoutes.customerProfile;
  }

  return null;
}

function getSafeNextPath(nextParam: string | null, type: string | null) {
  if (type === "recovery") return fallbackRoutes.resetPassword;
  if (!nextParam) return null;

  try {
    const decodedNext = decodeURIComponent(nextParam);

    if (!decodedNext.startsWith("/") || decodedNext.startsWith("//")) {
      return null;
    }

    return decodedNext;
  } catch {
    return null;
  }
}

function getMetadataString(
  metadata: Record<string, unknown>,
  keys: string[],
) {
  for (const key of keys) {
    const value = cleanText(metadata[key]);
    if (value) return value;
  }

  return "";
}

function getTrackingContext(
  requestUrl: URL,
  metadata: Record<string, unknown>,
): TrackingContext {
  const query = requestUrl.searchParams;

  const source =
    cleanText(query.get("source")) ||
    cleanText(query.get("utm_source")) ||
    getMetadataString(metadata, ["referral_source", "signup_source", "source"]) ||
    "sitguru_auth_callback";

  return {
    program:
      cleanText(query.get("program")) ||
      getMetadataString(metadata, [
        "ambassador_program",
        "program",
        "candidate_path",
      ]),
    source,
    platform:
      cleanText(query.get("platform")) ||
      getMetadataString(metadata, ["referral_platform", "platform"]),
    campaign:
      cleanText(query.get("campaign")) ||
      getMetadataString(metadata, ["referral_campaign", "campaign"]),
    utmSource:
      cleanText(query.get("utm_source")) ||
      getMetadataString(metadata, ["utm_source"]) ||
      source,
    utmMedium:
      cleanText(query.get("utm_medium")) ||
      cleanText(query.get("medium")) ||
      getMetadataString(metadata, ["utm_medium"]),
    utmCampaign:
      cleanText(query.get("utm_campaign")) ||
      getMetadataString(metadata, ["utm_campaign"]),
  };
}

function getIncomingAmbassadorCode(
  requestUrl: URL,
  metadata: Record<string, unknown>,
) {
  return (
    cleanText(requestUrl.searchParams.get("ambassador_referral_code")) ||
    cleanText(requestUrl.searchParams.get("ref")) ||
    cleanText(requestUrl.searchParams.get("referral_code")) ||
    cleanText(requestUrl.searchParams.get("code_ref")) ||
    getMetadataString(metadata, [
      "ambassador_referral_code",
      "referral_code",
      "invite_code",
    ])
  )
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "");
}

function buildFullName(
  metadata: Record<string, unknown>,
  email: string,
) {
  const directName = getMetadataString(metadata, [
    "full_name",
    "name",
    "display_name",
  ]);

  if (directName) return directName;

  const firstName = getMetadataString(metadata, ["first_name", "given_name"]);
  const lastName = getMetadataString(metadata, ["last_name", "family_name"]);
  const combinedName = [firstName, lastName].filter(Boolean).join(" ").trim();

  if (combinedName) return combinedName;

  return email.split("@")[0]?.replace(/[._-]+/g, " ").trim() || "SitGuru Member";
}

async function getDatabaseRedirectPath(userId: string) {
  const supabaseAdmin = createSupabaseAdminClient();

  const { data: roleRows, error: roleError } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (roleError) {
    console.error("Auth callback role lookup failed:", roleError.message);
  }

  const roles = (roleRows || []).map((row) => row.role).filter(Boolean);

  if (roles.some(isAdminRole)) return fallbackRoutes.admin;
  if (roles.some(isGuruRole)) return fallbackRoutes.guruProfile;
  if (roles.some(isAmbassadorRole)) return fallbackRoutes.ambassadorDashboard;
  if (roles.some(isCustomerRole)) return fallbackRoutes.customerProfile;

  const [guruResult, ambassadorResult, profileResult] = await Promise.all([
    supabaseAdmin
      .from("gurus")
      .select("id")
      .eq("user_id", userId)
      .limit(1),
    supabaseAdmin
      .from("ambassadors")
      .select("id, dashboard_enabled, login_enabled, status")
      .eq("user_id", userId)
      .limit(1),
    supabaseAdmin
      .from("profiles")
      .select("role, account_type")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  if (guruResult.error) {
    console.error("Auth callback Guru lookup failed:", guruResult.error.message);
  }

  if (ambassadorResult.error) {
    console.error(
      "Auth callback Ambassador lookup failed:",
      ambassadorResult.error.message,
    );
  }

  if (profileResult.error) {
    console.error(
      "Auth callback profile lookup failed:",
      profileResult.error.message,
    );
  }

  if (guruResult.data?.length) return fallbackRoutes.guruProfile;

  const ambassador = ambassadorResult.data?.[0];
  if (
    ambassador?.id &&
    ambassador.dashboard_enabled !== false &&
    ambassador.login_enabled !== false &&
    !["archived", "inactive", "suspended"].includes(
      normalizeRole(ambassador.status),
    )
  ) {
    return fallbackRoutes.ambassadorDashboard;
  }

  return getRoleRedirectPath(
    profileResult.data?.role,
    profileResult.data?.account_type,
  );
}

async function updateAuthMetadata({
  userId,
  existingMetadata,
  intent,
  tracking,
  ambassadorReferralCode,
}: {
  userId: string;
  existingMetadata: Record<string, unknown>;
  intent: AccountIntent;
  tracking: TrackingContext;
  ambassadorReferralCode: string;
}) {
  const supabaseAdmin = createSupabaseAdminClient();
  const profileRole = getProfileRoleFromIntent(intent);

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...existingMetadata,
      role: profileRole,
      account_type: profileRole,
      signup_role: profileRole,
      account_intent: intent,
      signup_status: "auth_callback_verified",
      signup_source: tracking.source,
      ambassador_program: tracking.program || null,
      ambassador_referral_code: ambassadorReferralCode || null,
      referral_source: tracking.source || null,
      referral_platform: tracking.platform || null,
      referral_campaign: tracking.campaign || null,
      utm_source: tracking.utmSource || null,
      utm_medium: tracking.utmMedium || null,
      utm_campaign: tracking.utmCampaign || null,
    },
  });

  if (error) {
    throw new Error(`SitGuru could not save signup details: ${error.message}`);
  }
}

async function callProvisioningRoute({
  requestUrl,
  accessToken,
  userId,
  intent,
  fullName,
  email,
  phone,
  zipCode,
  serviceArea,
  ambassadorReferralCode,
  source,
}: {
  requestUrl: URL;
  accessToken: string;
  userId: string;
  intent: AccountIntent;
  fullName: string;
  email: string;
  phone: string;
  zipCode: string;
  serviceArea: string;
  ambassadorReferralCode: string;
  source: string;
}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(
    new URL("/api/auth/provision-signup", requestUrl.origin),
    {
      method: "POST",
      headers,
      cache: "no-store",
      body: JSON.stringify({
        userId,
        intent,
        fullName,
        email: email || undefined,
        phone: phone || undefined,
        zipCode,
        serviceArea,
        ambassadorReferralCode: ambassadorReferralCode || undefined,
        source,
      }),
    },
  );

  const result = (await response.json().catch(() => null)) as
    | ProvisionResponse
    | null;

  if (!response.ok || !result?.ok) {
    throw new Error(
      result?.error ||
        result?.message ||
        "SitGuru could not finish setting up your workspace.",
    );
  }

  if (intent === "ambassador" && result.workspaceReady !== true) {
    throw new Error("SitGuru could not verify the Ambassador workspace.");
  }

  return result;
}

async function enrichCanonicalReferralEvent({
  userId,
  ambassadorReferralCode,
  tracking,
  program,
}: {
  userId: string;
  ambassadorReferralCode: string;
  tracking: TrackingContext;
  program: string;
}) {
  if (!ambassadorReferralCode) return;

  const supabaseAdmin = createSupabaseAdminClient();

  const { data: codeRow, error: codeError } = await supabaseAdmin
    .from("pawperks_account_referral_codes")
    .select("id")
    .eq("code_normalized", ambassadorReferralCode.toLowerCase())
    .maybeSingle();

  if (codeError || !codeRow?.id) {
    if (codeError) {
      console.warn(
        "Auth callback referral-code enrichment skipped:",
        codeError.message,
      );
    }
    return;
  }

  const { data: eventRow, error: eventError } = await supabaseAdmin
    .from("pawperks_referral_events")
    .select("id, metadata")
    .eq("referral_code_id", codeRow.id)
    .eq("referred_account_id", userId)
    .eq("event_type", "signup_completed")
    .order("event_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (eventError || !eventRow?.id) {
    if (eventError) {
      console.warn(
        "Auth callback referral-event enrichment skipped:",
        eventError.message,
      );
    }
    return;
  }

  const existingMetadata =
    eventRow.metadata &&
    typeof eventRow.metadata === "object" &&
    !Array.isArray(eventRow.metadata)
      ? (eventRow.metadata as Record<string, unknown>)
      : {};

  const { error: updateError } = await supabaseAdmin
    .from("pawperks_referral_events")
    .update({
      event_source: tracking.source,
      request_path: "/auth/callback",
      metadata: {
        ...existingMetadata,
        program: program || null,
        source: tracking.source || null,
        platform: tracking.platform || null,
        campaign: tracking.campaign || null,
        utm_source: tracking.utmSource || null,
        utm_medium: tracking.utmMedium || null,
        utm_campaign: tracking.utmCampaign || null,
        callback_enriched_at: new Date().toISOString(),
      },
    })
    .eq("id", eventRow.id);

  if (updateError) {
    console.warn(
      "Auth callback referral-event enrichment failed:",
      updateError.message,
    );
  }
}

function buildSignupErrorUrl({
  requestUrl,
  intent,
  message,
}: {
  requestUrl: URL;
  intent: AccountIntent;
  message: string;
}) {
  const errorUrl = new URL(fallbackRoutes.signup, requestUrl.origin);
  errorUrl.searchParams.set("role", intent);
  errorUrl.searchParams.set("auth_error", message);
  return errorUrl;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");
  const nextParam = requestUrl.searchParams.get("next");
  const explicitIntent = normalizeCallbackIntent(
    requestUrl.searchParams.get("intent"),
  );

  const supabase = await createClient();
  let accessToken = "";

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      const errorUrl = new URL(fallbackRoutes.signup, requestUrl.origin);
      errorUrl.searchParams.set("auth_error", error.message);
      return NextResponse.redirect(errorUrl);
    }

    accessToken = data.session?.access_token || "";
  } else {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    accessToken = session?.access_token || "";
  }

  if (type === "recovery") {
    return NextResponse.redirect(
      new URL(fallbackRoutes.resetPassword, requestUrl.origin),
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.id) {
    const signupUrl = new URL(fallbackRoutes.signup, requestUrl.origin);
    signupUrl.searchParams.set(
      "auth_error",
      "SitGuru could not verify your account session. Please try again.",
    );
    return NextResponse.redirect(signupUrl);
  }

  const metadata =
    user.user_metadata && typeof user.user_metadata === "object"
      ? (user.user_metadata as Record<string, unknown>)
      : {};
  const metadataRole = getMetadataString(metadata, ["role", "signup_role"]);
  const metadataAccountType = getMetadataString(metadata, ["account_type"]);
  const metadataRedirect = getRoleRedirectPath(
    metadataRole,
    metadataAccountType,
  );
  const existingDatabaseRedirect = await getDatabaseRedirectPath(user.id);
  const hasExistingSitGuruAccess = Boolean(
    metadataRedirect || existingDatabaseRedirect,
  );

  if (!explicitIntent && !hasExistingSitGuruAccess) {
    await supabase.auth.signOut();

    const loginUrl = new URL(fallbackRoutes.login, requestUrl.origin);
    loginUrl.searchParams.set(
      "error",
      "We couldn’t find an existing SitGuru account for that login. Choose Pet Parent, Future Guru, or Ambassador to create one.",
    );
    loginUrl.searchParams.set("mode", "phone");
    return NextResponse.redirect(loginUrl);
  }

  if (explicitIntent) {
    const email = cleanText(user.email).toLowerCase();
    const phone = cleanText(user.phone) || getMetadataString(metadata, ["phone"]);
    const fullName = buildFullName(metadata, email);
    const zipCode = getMetadataString(metadata, ["zip_code", "postal_code"]);
    const serviceArea =
      getMetadataString(metadata, [
        "service_area",
        "community_area",
        "outreach_area",
      ]) || zipCode;
    const tracking = getTrackingContext(requestUrl, metadata);
    const ambassadorReferralCode = getIncomingAmbassadorCode(
      requestUrl,
      metadata,
    );

    try {
      await updateAuthMetadata({
        userId: user.id,
        existingMetadata: metadata,
        intent: explicitIntent,
        tracking,
        ambassadorReferralCode,
      });

      await callProvisioningRoute({
        requestUrl,
        accessToken,
        userId: user.id,
        intent: explicitIntent,
        fullName,
        email,
        phone,
        zipCode,
        serviceArea,
        ambassadorReferralCode,
        source: tracking.source,
      });

      await enrichCanonicalReferralEvent({
        userId: user.id,
        ambassadorReferralCode,
        tracking,
        program: tracking.program,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "SitGuru could not finish setting up your workspace.";

      console.error("AUTH CALLBACK PROVISION ERROR:", error);

      return NextResponse.redirect(
        buildSignupErrorUrl({
          requestUrl,
          intent: explicitIntent,
          message,
        }),
      );
    }
  }

  const safeNextPath = getSafeNextPath(nextParam, type);

  if (explicitIntent) {
    return NextResponse.redirect(
      new URL(
        safeNextPath || getIntentRedirectPath(explicitIntent),
        requestUrl.origin,
      ),
    );
  }

  const refreshedDatabaseRedirect = await getDatabaseRedirectPath(user.id);

  return NextResponse.redirect(
    new URL(
      safeNextPath ||
        refreshedDatabaseRedirect ||
        metadataRedirect ||
        fallbackRoutes.customerProfile,
      requestUrl.origin,
    ),
  );
}