"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as createSupabaseServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

type AppRole = "pet_owner" | "guru" | "admin";

type ReferralProfileRow = {
  id: string;
  user_id: string;
  referral_code: string;
  role: string | null;
};

type GenericPayload = Record<string, unknown>;

type SupabaseLikeClient = Awaited<ReturnType<typeof createClient>>;

function normalizeAccountType(value: string): AppRole {
  const normalized = value.trim().toLowerCase();

  if (
    normalized === "provider" ||
    normalized === "providers" ||
    normalized === "sitter" ||
    normalized === "sitters" ||
    normalized === "walker" ||
    normalized === "walkers" ||
    normalized === "caretaker" ||
    normalized === "caretakers" ||
    normalized === "guru" ||
    normalized === "gurus"
  ) {
    return "guru";
  }

  if (normalized === "admin" || normalized === "admins") {
    return "admin";
  }

  return "pet_owner";
}

function normalizeRole(role: string) {
  return role.trim().toLowerCase();
}

function getRedirectPathFromRoles(roles: string[]): string {
  const normalizedRoles = roles.map(normalizeRole);

  if (
    normalizedRoles.includes("guru") ||
    normalizedRoles.includes("sitter") ||
    normalizedRoles.includes("provider") ||
    normalizedRoles.includes("walker") ||
    normalizedRoles.includes("caretaker")
  ) {
    return "/guru/dashboard";
  }

  if (normalizedRoles.includes("admin")) {
    return "/admin";
  }

  return "/customer/dashboard";
}

function getLoginPageFromNext(next: string): string {
  if (next.startsWith("/guru")) return "/guru/login";
  if (next.startsWith("/admin")) return "/admin/login";
  if (next.startsWith("/customer")) return "/customer/login";
  return "/customer/login";
}

function isSafeInternalPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//");
}

function getSafeNextPath(value: FormDataEntryValue | null, fallback: string) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return fallback;
  if (!isSafeInternalPath(raw)) return fallback;
  return raw;
}

function redirectWithError(loginPage: string, message: string): never {
  redirect(`${loginPage}?error=${encodeURIComponent(message)}`);
}

function getSignupErrorPath(accountType: AppRole, message: string): string {
  const basePath = accountType === "guru" ? "/signup?type=guru" : "/signup";
  const separator = basePath.includes("?") ? "&" : "?";

  return `${basePath}${separator}error=${encodeURIComponent(message)}`;
}

function redirectSignupError(accountType: AppRole, message: string): never {
  redirect(getSignupErrorPath(accountType, message));
}

function cleanFormValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function getReferralWriteClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createSupabaseServiceClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getReferralType(rawReferralType: string, accountType: AppRole) {
  const normalized = rawReferralType.trim().toLowerCase();

  if (
    accountType === "guru" ||
    normalized === "guru" ||
    normalized === "provider" ||
    normalized === "sitter" ||
    normalized === "walker" ||
    normalized === "caretaker"
  ) {
    return "customer_to_guru";
  }

  return "customer_to_customer";
}

function getReferredRole(accountType: AppRole) {
  return accountType === "guru" ? "guru" : "customer";
}

function getRewardAmount(referralType: string, referrerRole?: string | null) {
  if (referrerRole === "system") {
    return 0;
  }

  if (referralType === "customer_to_guru") {
    return 50;
  }

  return 20;
}

function getMissingColumnFromError(message?: string) {
  if (!message) return "";

  const match = message.match(/Could not find the '([^']+)' column/i);
  return match?.[1] || "";
}

async function upsertWithColumnFallback({
  supabase,
  table,
  payload,
  onConflict,
  requiredColumns = ["id"],
}: {
  supabase: SupabaseLikeClient;
  table: string;
  payload: GenericPayload;
  onConflict: string;
  requiredColumns?: string[];
}) {
  const workingPayload: GenericPayload = { ...payload };
  const removedColumns: string[] = [];

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { error } = await supabase
      .from(table)
      .upsert(workingPayload, { onConflict });

    if (!error) {
      if (removedColumns.length > 0) {
        console.warn(
          `${table} upsert succeeded after removing missing optional columns:`,
          removedColumns
        );
      }

      return null;
    }

    const missingColumn = getMissingColumnFromError(error.message);

    if (
      missingColumn &&
      Object.prototype.hasOwnProperty.call(workingPayload, missingColumn) &&
      !requiredColumns.includes(missingColumn)
    ) {
      delete workingPayload[missingColumn];
      removedColumns.push(missingColumn);
      continue;
    }

    return error;
  }

  return {
    message: `Unable to create ${table} record after removing optional missing columns.`,
  };
}

async function trackReferralSignup({
  supabase,
  referralCode,
  rawReferralType,
  referralSource,
  referralMedium,
  referralCampaign,
  referredUserId,
  referredEmail,
  accountType,
}: {
  supabase: SupabaseLikeClient;
  referralCode: string;
  rawReferralType: string;
  referralSource: string;
  referralMedium: string;
  referralCampaign: string;
  referredUserId: string;
  referredEmail: string;
  accountType: AppRole;
}) {
  const cleanReferralCode = referralCode.trim();

  if (!cleanReferralCode) {
    return;
  }

  const writeClient = getReferralWriteClient() ?? supabase;

  const { data: referrerProfile, error: referrerError } = await writeClient
    .from("referral_profiles")
    .select("id, user_id, referral_code, role")
    .eq("referral_code", cleanReferralCode)
    .maybeSingle<ReferralProfileRow>();

  if (referrerError || !referrerProfile) {
    console.error("Referral profile lookup failed:", referrerError);
    return;
  }

  if (referrerProfile.user_id === referredUserId) {
    console.warn("Referral ignored because self-referrals are not allowed.");
    return;
  }

  const referralType = getReferralType(rawReferralType, accountType);
  const referredRole = getReferredRole(accountType);
  const rewardAmount = getRewardAmount(referralType, referrerProfile.role);

  const referralPayload = {
    referrer_profile_id: referrerProfile.id,
    referred_profile_id: null,
    referrer_user_id: referrerProfile.user_id,
    referred_user_id: referredUserId,
    referred_email: referredEmail,
    referral_code: cleanReferralCode,
    referral_type: referralType,
    referred_role: referredRole,
    status: "pending",
    reward_amount: rewardAmount,
    reward_type: referrerProfile.role === "system" ? "tracking" : "credit",
    notes: JSON.stringify({
      source: referralSource || "direct",
      medium: referralMedium || "",
      campaign: referralCampaign || "",
    }),
    updated_at: new Date().toISOString(),
  };

  const { error: insertError } = await writeClient
    .from("referrals")
    .insert(referralPayload);

  if (insertError) {
    console.error("Referral insert failed:", insertError);
    return;
  }

  await writeClient
    .from("referral_profiles")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", referrerProfile.id);
}

export async function signup(formData: FormData) {
  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password =
    typeof formData.get("password") === "string"
      ? String(formData.get("password"))
      : "";

  const accountType = normalizeAccountType(
    String(formData.get("accountType") || "pet_owner")
  );

  const referralCode = cleanFormValue(formData.get("referralCode"));
  const referralType = cleanFormValue(formData.get("referralType"));
  const referralSource = cleanFormValue(formData.get("referralSource"));
  const referralMedium = cleanFormValue(formData.get("referralMedium"));
  const referralCampaign = cleanFormValue(formData.get("referralCampaign"));

  if (!email || !password) {
    redirectSignupError(accountType, "Email and password are required");
  }

  const supabase = await createClient();

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        account_type: accountType,
        referral_code: referralCode || null,
        referral_type: referralType || null,
        referral_source: referralSource || null,
      },
    },
  });

  if (signUpError || !signUpData.user) {
    redirectSignupError(accountType, signUpError?.message || "Signup failed");
  }

  const userId = signUpData.user.id;
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  const profilePayload = {
    id: userId,
    user_id: userId,
    email,
    first_name: firstName || null,
    last_name: lastName || null,
    full_name: fullName || email,
    display_name: fullName || email,
    name: fullName || email,
    role:
      accountType === "guru"
        ? "sitter"
        : accountType === "admin"
          ? "admin"
          : "pet_owner",
    account_type: accountType,
    bio: null,
    city: null,
    state: null,
    state_code: null,
    price: null,
    hourly_rate: null,
    avatar_url: null,
    photo_url: null,
    has_seen_welcome_confetti: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const profileError = await upsertWithColumnFallback({
    supabase,
    table: "profiles",
    payload: profilePayload,
    onConflict: "id",
    requiredColumns: ["id"],
  });

  if (profileError) {
    redirectSignupError(
      accountType,
      "Account created, but profile setup failed. " + profileError.message
    );
  }

  const { error: roleError } = await supabase.from("user_roles").upsert(
    {
      user_id: userId,
      role: accountType,
    },
    { onConflict: "user_id,role" }
  );

  if (roleError) {
    redirectSignupError(
      accountType,
      "Account created, but role setup failed. " + roleError.message
    );
  }

  if (accountType === "guru") {
    const displayName = fullName || "New Guru";

    const guruPayload = {
      user_id: userId,
      display_name: displayName,
      full_name: displayName,
      email,
      bio: null,
      hourly_rate: 0,
      price: 0,
      city: null,
      state: null,
      state_code: null,
      avatar_url: null,
      photo_url: null,
      status: "pending",
      application_status: "new",
      credential_level: "pending",
      identity_status: "not_started",
      background_check_status: "not_started",
      safety_cert_status: "not_started",
      is_identity_verified: false,
      is_background_checked: false,
      is_safety_certified: false,
      is_elite_guru: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const guruError = await upsertWithColumnFallback({
      supabase,
      table: "gurus",
      payload: guruPayload,
      onConflict: "user_id",
      requiredColumns: ["user_id"],
    });

    if (guruError) {
      redirectSignupError(
        accountType,
        "Account created, but Guru profile setup failed. " + guruError.message
      );
    }
  }

  await trackReferralSignup({
    supabase,
    referralCode,
    rawReferralType: referralType,
    referralSource,
    referralMedium,
    referralCampaign,
    referredUserId: userId,
    referredEmail: email,
    accountType,
  });

  revalidatePath("/", "layout");
  redirect(getRedirectPathFromRoles([accountType]));
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password =
    typeof formData.get("password") === "string"
      ? String(formData.get("password"))
      : "";

  const next = getSafeNextPath(formData.get("next"), "/customer/dashboard");
  const fallbackLoginPage = getLoginPageFromNext(next);

  if (!email || !password) {
    redirectWithError(fallbackLoginPage, "Email and password are required");
  }

  const supabase = await createClient();

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    redirectWithError(fallbackLoginPage, signInError.message);
  }

  revalidatePath("/", "layout");

  if (next && isSafeInternalPath(next)) {
    redirect(next);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirectWithError(fallbackLoginPage, "Unable to load user");
  }

  const userId = user.id;
  const roleSet = new Set<string>();

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  for (const row of roleRows || []) {
    if (typeof row.role === "string" && row.role.trim()) {
      roleSet.add(normalizeRole(row.role));
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role && typeof profile.role === "string") {
    roleSet.add(normalizeRole(profile.role));
  }

  const { data: guruRow } = await supabase
    .from("gurus")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (guruRow?.id) {
    roleSet.add("guru");
  }

  redirect(getRedirectPathFromRoles([...roleSet]));
}

export async function logout() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/customer/login");
}
