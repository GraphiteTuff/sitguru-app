import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const fallbackRoutes = {
  admin: "/admin",
  customerProfile: "/customer/dashboard/profile",
  guruProfile: "/guru/dashboard/profile",
  resetPassword: "/reset-password",
  signup: "/signup",
};

type PetPerksReferralType = "pet_parent" | "guru" | "ambassador" | "community";
type PetPerksSignupSelection =
  | PetPerksReferralType
  | "both"
  | "customer"
  | "future_guru"
  | "future-guru"
  | "pet-parent"
  | "pet_parent";

type CallbackIntent = "pet_parent" | "guru" | "ambassador" | "both" | "customer" | null;

function getSafeNextPath(nextParam: string | null, type: string | null) {
  if (type === "recovery") {
    return fallbackRoutes.resetPassword;
  }

  if (!nextParam) {
    return null;
  }

  try {
    const decodedNext = decodeURIComponent(nextParam);

    if (!decodedNext.startsWith("/")) {
      return null;
    }

    if (decodedNext.startsWith("//")) {
      return null;
    }

    return decodedNext;
  } catch {
    return null;
  }
}

function isAdminRole(role: string | null | undefined) {
  const normalized = role?.trim().toLowerCase() || "";

  return [
    "admin",
    "owner",
    "super_admin",
    "super user",
    "superuser",
    "founder",
    "ceo",
    "founder/ceo",
    "co-founder",
    "cofounder",
  ].includes(normalized);
}

function isGuruRole(role: string | null | undefined) {
  const normalized = role?.trim().toLowerCase() || "";

  return [
    "guru",
    "future_guru",
    "future-guru",
    "provider",
    "sitter",
    "pet_care_guru",
    "pet-care-guru",
  ].includes(normalized);
}

function isCustomerRole(role: string | null | undefined) {
  const normalized = role?.trim().toLowerCase() || "";

  return [
    "customer",
    "pet_parent",
    "pet-parent",
    "parent",
    "pet parent",
    "both",
  ].includes(normalized);
}

function getRoleRedirectPath(role: string | null, accountType?: string | null) {
  if (isAdminRole(role) || isAdminRole(accountType)) {
    return fallbackRoutes.admin;
  }

  if (isGuruRole(role) || isGuruRole(accountType)) {
    return fallbackRoutes.guruProfile;
  }

  if (role?.trim().toLowerCase() === "ambassador" || accountType?.trim().toLowerCase() === "ambassador") {
    return "/ambassador/dashboard";
  }

  if (isCustomerRole(role) || isCustomerRole(accountType)) {
    return fallbackRoutes.customerProfile;
  }

  return null;
}

function normalizeCallbackIntent(value: string | null): CallbackIntent {
  const normalized = value?.trim().toLowerCase() || "";

  if (
    normalized === "customer" ||
    normalized === "pet_parent" ||
    normalized === "pet-parent" ||
    normalized === "parent" ||
    normalized === "pet parent"
  ) {
    return "pet_parent";
  }

  if (
    normalized === "guru" ||
    normalized === "future_guru" ||
    normalized === "future-guru" ||
    normalized === "provider" ||
    normalized === "sitter"
  ) {
    return "guru";
  }

  if (normalized === "ambassador" || normalized === "partner") {
    return "ambassador";
  }

  if (
    normalized === "both" ||
    normalized === "pet-parent-and-guru" ||
    normalized === "pet_parent_and_guru" ||
    normalized === "customer-guru" ||
    normalized === "customer_guru"
  ) {
    return "both";
  }

  return null;
}

function getProfileRoleFromIntent(intent: CallbackIntent) {
  if (intent === "guru") {
    return "guru";
  }

  if (intent === "both") {
    return "both";
  }

  if (intent === "ambassador") {
    return "ambassador";
  }

  return "customer";
}

function getUserRolesFromIntent(intent: CallbackIntent) {
  if (intent === "both") return ["customer", "guru"] as const;
  if (intent === "guru") return ["guru"] as const;
  if (intent === "pet_parent" || intent === "customer") return ["customer"] as const;
  return [] as const;
}

function getNameParts(fullName: string | null) {
  const cleanName = fullName?.trim() || "";
  const parts = cleanName.split(/\s+/).filter(Boolean);

  if (!parts.length) {
    return {
      firstName: null,
      lastName: null,
    };
  }

  return {
    firstName: parts[0] || null,
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : null,
  };
}

function buildStarterGuruSlug(userId: string, fullName: string | null) {
  const baseSlug = (fullName || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return baseSlug || `guru-${userId.slice(0, 8)}`;
}

function normalizePetPerksSignupSelection(
  value: string | null,
): PetPerksSignupSelection {
  const normalized = value?.trim().toLowerCase() || "";

  if (normalized === "ambassador" || normalized === "partner") {
    return "ambassador";
  }

  if (
    normalized === "both" ||
    normalized === "pet-parent-and-guru" ||
    normalized === "pet_parent_and_guru" ||
    normalized === "customer-guru" ||
    normalized === "customer_guru"
  ) {
    return "both";
  }

  if (
    normalized === "customer" ||
    normalized === "pet-parent" ||
    normalized === "pet_parent" ||
    normalized === "parent"
  ) {
    return "pet_parent";
  }

  if (
    normalized === "guru" ||
    normalized === "future-guru" ||
    normalized === "future_guru" ||
    normalized === "provider" ||
    normalized === "sitter"
  ) {
    return "guru";
  }

  if (normalized === "ambassador") {
    return "ambassador";
  }

  return "community";
}

function getReferralTracks(
  signupSelection: PetPerksSignupSelection,
): PetPerksReferralType[] {
  if (signupSelection === "both") {
    return ["pet_parent", "guru"];
  }

  if (
    signupSelection === "customer" ||
    signupSelection === "pet-parent" ||
    signupSelection === "pet_parent"
  ) {
    return ["pet_parent"];
  }

  if (
    signupSelection === "future_guru" ||
    signupSelection === "future-guru" ||
    signupSelection === "guru"
  ) {
    return ["guru"];
  }

  if (signupSelection === "ambassador") {
    return ["ambassador"];
  }

  return ["community"];
}

function getInitialPetPerksStatus(referralType: PetPerksReferralType) {
  if (referralType === "guru") {
    return "pending_guru_approval";
  }

  if (referralType === "pet_parent") {
    return "pending_first_booking";
  }

  return "signed_up";
}

function getSignupRule(referralType: PetPerksReferralType) {
  if (referralType === "guru") {
    return "guru_pending_approval_and_first_paid_booking";
  }

  if (referralType === "pet_parent") {
    return "pet_parent_pending_first_booking";
  }

  if (referralType === "ambassador") {
    return "ambassador_signup_capture";
  }

  return "community_signup_capture";
}

async function upsertPetParentProfileFromCallback({
  userId,
  userEmail,
  userName,
  intent,
}: {
  userId: string;
  userEmail: string | null;
  userName: string | null;
  intent: CallbackIntent;
}) {
  const supabaseAdmin = createSupabaseAdminClient();

  const { data: existingProfile, error: existingProfileError } =
    await supabaseAdmin
      .from("profiles")
      .select("id, role, full_name, email, first_name, last_name")
      .eq("id", userId)
      .maybeSingle();

  if (existingProfileError) {
    console.error(
      "Profile lookup during auth callback failed:",
      existingProfileError.message,
    );
    return;
  }

  const existingRole =
    typeof existingProfile?.role === "string" ? existingProfile.role : null;

  const shouldPreserveExistingRole =
    isAdminRole(existingRole) ||
    (isGuruRole(existingRole) && intent !== "guru" && intent !== "both");

  const profileRole = shouldPreserveExistingRole
    ? existingRole
    : getProfileRoleFromIntent(intent);

  const preferredName =
    userName?.trim() ||
    (typeof existingProfile?.full_name === "string"
      ? existingProfile.full_name.trim()
      : "") ||
    null;

  const { firstName, lastName } = getNameParts(preferredName);

  const { error: upsertError } = await supabaseAdmin.from("profiles").upsert(
    {
      id: userId,
      email:
        userEmail ||
        (typeof existingProfile?.email === "string"
          ? existingProfile.email
          : null),
      full_name: preferredName,
      first_name:
        firstName ||
        (typeof existingProfile?.first_name === "string"
          ? existingProfile.first_name
          : null),
      last_name:
        lastName ||
        (typeof existingProfile?.last_name === "string"
          ? existingProfile.last_name
          : null),
      role: profileRole,
      account_type: profileRole,
    },
    {
      onConflict: "id",
    },
  );

  if (upsertError) {
    console.error(
      "Profile upsert during auth callback failed:",
      upsertError.message,
    );
  }

  const roleValues = intent === "both" ? ["customer", "guru"] : [profileRole || "customer"];

  for (const role of roleValues) {
    const { error: roleError } = await supabaseAdmin.from("user_roles").upsert(
      { user_id: userId, role, updated_at: new Date().toISOString() },
      { onConflict: "user_id,role" },
    );

    if (roleError) {
      console.error("User role upsert during auth callback failed:", roleError.message);
    }
  }

  if (intent === "ambassador") {
    const referralNamePrefix = (preferredName || "SITGURU")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 8) || "SITGURU";
    const referralCode = `${referralNamePrefix}-${userId.replace(/-/g, "").toUpperCase()}`;
    const { error: ambassadorError } = await supabaseAdmin.from("ambassadors").upsert(
      {
        user_id: userId,
        full_name: preferredName || "SitGuru Ambassador",
        email: userEmail,
        contact_email: userEmail,
        referral_code: referralCode,
        status: "active",
        referral_status: "active",
        onboarding_status: "started",
        training_status: "not_started",
        dashboard_enabled: true,
        login_enabled: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (ambassadorError) {
      console.error("Ambassador starter profile upsert during auth callback failed:", ambassadorError.message);
    }
  }
}

async function syncIntentionalSignupRoleRecords({
  userId,
  userEmail,
  userName,
  intent,
}: {
  userId: string;
  userEmail: string | null;
  userName: string | null;
  intent: CallbackIntent;
}) {
  if (!intent) return;

  const supabaseAdmin = createSupabaseAdminClient();
  const profileRole = getProfileRoleFromIntent(intent);
  const now = new Date().toISOString();

  const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    {
      user_metadata: {
        full_name: userName,
        role: profileRole,
        account_type: profileRole,
        signup_role: profileRole,
        account_intent: intent,
        signup_source: "sitguru_oauth_callback",
        signup_status: "oauth_verified",
      },
    },
  );

  if (metadataError) {
    console.error("Auth metadata role sync failed:", metadataError.message);
  }

  await Promise.all(
    getUserRolesFromIntent(intent).map(async (role) => {
      const { error } = await supabaseAdmin.from("user_roles").upsert(
        {
          user_id: userId,
          role,
        },
        {
          onConflict: "user_id,role",
        },
      );

      if (error) {
        console.error("User role sync during auth callback failed:", error.message);
      }
    }),
  );

  if (intent !== "guru" && intent !== "both") return;

  const displayName = userName?.trim() || userEmail || "New SitGuru";
  const slug = buildStarterGuruSlug(userId, displayName);

  const { data: existingGuru, error: existingGuruError } = await supabaseAdmin
    .from("gurus")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingGuruError) {
    console.error(
      "Starter Guru lookup during auth callback failed:",
      existingGuruError.message,
    );
    return;
  }

  const starterGuruPayload = {
    user_id: userId,
    display_name: displayName,
    full_name: displayName,
    slug,
    is_public: false,
    booking_status: "not_listed",
    onboarding_completed: false,
    profile_completed: false,
    updated_at: now,
  };

  if (existingGuru?.id) {
    const { error } = await supabaseAdmin
      .from("gurus")
      .update(starterGuruPayload)
      .eq("user_id", userId);

    if (error) {
      console.error("Starter Guru update during auth callback failed:", error.message);
    }

    return;
  }

  const { error: insertError } = await supabaseAdmin.from("gurus").insert({
    ...starterGuruPayload,
    created_at: now,
  });

  if (insertError) {
    console.error(
      "Starter Guru creation during auth callback failed:",
      insertError.message,
    );
  }
}

async function upsertPetPerksReferralTrack({
  supabaseAdmin,
  userId,
  userEmail,
  userName,
  cleanReferralCode,
  referralType,
  source,
  utmSource,
  utmMedium,
  utmCampaign,
  requestPathname,
  signupSelection,
}: {
  supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  cleanReferralCode: string;
  referralType: PetPerksReferralType;
  source: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  requestPathname: string;
  signupSelection: PetPerksSignupSelection;
}) {
  const referralStatus = getInitialPetPerksStatus(referralType);
  const signedUpAt = new Date().toISOString();

  const { data: existingReferral, error: existingReferralError } =
    await supabaseAdmin
      .from("petperks_referrals")
      .select("id")
      .eq("referred_user_id", userId)
      .eq("referral_code", cleanReferralCode)
      .eq("referral_type", referralType)
      .maybeSingle();

  if (existingReferralError) {
    console.error(
      "PetPerks existing referral lookup failed:",
      existingReferralError.message,
    );
    return;
  }

  if (existingReferral?.id) {
    const { error: updateError } = await supabaseAdmin
      .from("petperks_referrals")
      .update({
        referral_status: referralStatus,
        referred_email: userEmail,
        referred_name: userName,
        signed_up_at: signedUpAt,
        source,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        metadata: {
          capture_point: "auth_callback_existing_referral_update",
          callback_url_pathname: requestPathname,
          signup_selection: signupSelection,
          signup_rule: getSignupRule(referralType),
          supports_both_signup: true,
        },
      })
      .eq("id", existingReferral.id);

    if (updateError) {
      console.error("PetPerks referral update failed:", updateError.message);
    }

    return;
  }

  const { error: insertError } = await supabaseAdmin
    .from("petperks_referrals")
    .insert({
      referral_code: cleanReferralCode,
      referral_type: referralType,
      referral_status: referralStatus,
      referred_user_id: userId,
      referred_email: userEmail,
      referred_name: userName,
      source,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      signed_up_at: signedUpAt,
      metadata: {
        capture_point: "auth_callback_signup_capture",
        callback_url_pathname: requestPathname,
        signup_selection: signupSelection,
        signup_rule: getSignupRule(referralType),
        supports_both_signup: true,
      },
    });

  if (insertError) {
    console.error("PetPerks referral insert failed:", insertError.message);
  }
}

async function upsertPetPerksSignupReferral({
  requestUrl,
  userId,
  userEmail,
  userName,
}: {
  requestUrl: URL;
  userId: string;
  userEmail: string | null;
  userName: string | null;
}) {
  const referralCode =
    requestUrl.searchParams.get("ref") ||
    requestUrl.searchParams.get("referral_code") ||
    requestUrl.searchParams.get("referral") ||
    requestUrl.searchParams.get("invite") ||
    "";

  const rawReferralType =
    requestUrl.searchParams.get("referral_type") ||
    requestUrl.searchParams.get("petperks_type") ||
    requestUrl.searchParams.get("type") ||
    "";

  const hasPetPerksParams = Boolean(referralCode || rawReferralType);

  if (!hasPetPerksParams) {
    return;
  }

  const cleanReferralCode = referralCode.trim() || "COMMUNITY";
  const signupSelection = normalizePetPerksSignupSelection(rawReferralType);
  const referralTracks = getReferralTracks(signupSelection);

  const source =
    requestUrl.searchParams.get("source") ||
    requestUrl.searchParams.get("utm_source") ||
    "direct";

  const utmSource =
    requestUrl.searchParams.get("utm_source") ||
    requestUrl.searchParams.get("source") ||
    source;

  const utmMedium =
    requestUrl.searchParams.get("utm_medium") ||
    requestUrl.searchParams.get("medium") ||
    "signup";

  const utmCampaign =
    requestUrl.searchParams.get("utm_campaign") ||
    requestUrl.searchParams.get("campaign") ||
    "sitguru_petperks";

  const supabaseAdmin = createSupabaseAdminClient();

  for (const referralType of referralTracks) {
    await upsertPetPerksReferralTrack({
      supabaseAdmin,
      userId,
      userEmail,
      userName,
      cleanReferralCode,
      referralType,
      source,
      utmSource,
      utmMedium,
      utmCampaign,
      requestPathname: requestUrl.pathname,
      signupSelection,
    });
  }
}

async function getDatabaseRedirectPath(userId: string) {
  const supabaseAdmin = createSupabaseAdminClient();

  const { data: userRoleRows, error: userRolesError } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (userRolesError) {
    console.error("User role lookup failed:", userRolesError.message);
  }

  const roles = userRoleRows?.map((row) => row.role).filter(Boolean) || [];

  if (roles.some(isAdminRole)) {
    return fallbackRoutes.admin;
  }

  if (roles.some(isGuruRole)) {
    return fallbackRoutes.guruProfile;
  }

  if (roles.some(isCustomerRole)) {
    return fallbackRoutes.customerProfile;
  }

  const { data: guruRow, error: guruError } = await supabaseAdmin
    .from("gurus")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (guruError) {
    console.error("Guru lookup failed:", guruError.message);
  }

  if (guruRow?.id) {
    return fallbackRoutes.guruProfile;
  }

  const { data: profileRow, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role, account_type")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("Profile lookup failed:", profileError.message);
  }

  const profileRedirect = getRoleRedirectPath(
    profileRow?.role || null,
    profileRow?.account_type || null,
  );

  if (profileRedirect) {
    return profileRedirect;
  }

  return null;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");
  const nextParam = requestUrl.searchParams.get("next");
  const intent = normalizeCallbackIntent(requestUrl.searchParams.get("intent"));

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      const errorUrl = new URL(fallbackRoutes.signup, requestUrl.origin);
      errorUrl.searchParams.set("auth_error", error.message);
      return NextResponse.redirect(errorUrl);
    }
  }

  if (type === "recovery") {
    return NextResponse.redirect(
      new URL(fallbackRoutes.resetPassword, requestUrl.origin),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.redirect(
      new URL(fallbackRoutes.signup, requestUrl.origin),
    );
  }

  const userEmail = user.email || null;

  const userName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : null;

  const metadataRole =
    typeof user.user_metadata?.role === "string"
      ? user.user_metadata.role
      : typeof user.user_metadata?.account_type === "string"
        ? user.user_metadata.account_type
        : null;

  const metadataAccountType =
    typeof user.user_metadata?.account_type === "string"
      ? user.user_metadata.account_type
      : null;

  const metadataRedirect = getRoleRedirectPath(
    metadataRole,
    metadataAccountType,
  );

  const databaseRedirect = await getDatabaseRedirectPath(user.id);
  const isIntentionalSignup = intent !== null;
  const hasExistingSitGuruAccess = Boolean(metadataRedirect || databaseRedirect);

  if (!isIntentionalSignup && !hasExistingSitGuruAccess) {
    await supabase.auth.signOut();

    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set(
      "error",
      "We couldn’t find an existing SitGuru account for that Google login. Choose Become a Pet Parent, Become a Guru, or Become an Ambassador to create one.",
    );
    loginUrl.searchParams.set("mode", "phone");

    return NextResponse.redirect(loginUrl);
  }

  if (isIntentionalSignup) {
    await upsertPetParentProfileFromCallback({
      userId: user.id,
      userEmail,
      userName,
      intent,
    });

    await syncIntentionalSignupRoleRecords({
      userId: user.id,
      userEmail,
      userName,
      intent,
    });

    await upsertPetPerksSignupReferral({
      requestUrl,
      userId: user.id,
      userEmail,
      userName,
    });
  }

  const safeNextPath = getSafeNextPath(nextParam, type);

  if (safeNextPath) {
    return NextResponse.redirect(new URL(safeNextPath, requestUrl.origin));
  }

  if (metadataRedirect) {
    return NextResponse.redirect(new URL(metadataRedirect, requestUrl.origin));
  }

  if (databaseRedirect) {
    return NextResponse.redirect(new URL(databaseRedirect, requestUrl.origin));
  }

  const signupRedirect = isIntentionalSignup
    ? getRoleRedirectPath(getProfileRoleFromIntent(intent), null)
    : null;

  return NextResponse.redirect(
    new URL(
      signupRedirect || fallbackRoutes.customerProfile,
      requestUrl.origin,
    ),
  );
}
