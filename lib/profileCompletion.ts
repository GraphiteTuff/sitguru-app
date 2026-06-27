export type SitGuruRole = "customer" | "pet_parent" | "guru" | "ambassador" | "unknown";

export type ProfileCompletionInput = {
  userId?: string | null;
  email?: string | null;
  roles?: string[];
  profile?: Record<string, unknown> | null;
  guru?: Record<string, unknown> | null;
  ambassador?: Record<string, unknown> | null;
  petsCount?: number;
  hasPricing?: boolean;
  hasAvailability?: boolean;
};

export type ProfileCompletionResult = {
  completion_status: "not_started" | "partially_completed" | "ready_for_review" | "complete";
  completion_percentage: number;
  missing_required_fields: string[];
  role: SitGuruRole;
  roles: string[];
  role_specific_missing_fields: Record<string, string[]>;
  can_be_bookable: boolean;
  can_book: boolean;
  can_share_referral: boolean;
  likely_issue_type: string;
  profile_completion_url: string;
  dashboard_url: string;
  referral_code: string;
  referral_link: string;
};

function text(row: Record<string, unknown> | null | undefined, keys: string[]) {
  for (const key of keys) {
    const value = row?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function bool(row: Record<string, unknown> | null | undefined, keys: string[]) {
  return keys.some((key) => row?.[key] === true || row?.[key] === "true" || row?.[key] === "active" || row?.[key] === "approved");
}

export function normalizeSitGuruRole(value: string | null | undefined): SitGuruRole {
  const role = String(value || "").trim().toLowerCase();
  if (["guru", "sitter", "provider", "future_guru", "future-guru"].includes(role)) return "guru";
  if (["ambassador", "partner"].includes(role)) return "ambassador";
  if (["customer", "pet_parent", "pet-parent", "parent", "client", "pet parent"].includes(role)) return "pet_parent";
  return "unknown";
}

export function calculateSitGuruProfileCompletion(input: ProfileCompletionInput): ProfileCompletionResult {
  const profile = input.profile || null;
  const guru = input.guru || null;
  const ambassador = input.ambassador || null;
  const rawRoles = [
    ...(input.roles || []),
    text(profile, ["role", "account_type"]),
    guru ? "guru" : "",
    ambassador ? "ambassador" : "",
  ].filter(Boolean);
  const roles = Array.from(new Set(rawRoles.map((role) => normalizeSitGuruRole(role)).filter((role) => role !== "unknown")));
  const primaryRole = (roles[0] || normalizeSitGuruRole(text(profile, ["role", "account_type"]))) as SitGuruRole;
  const role = primaryRole === "unknown" ? "pet_parent" : primaryRole;
  const email = input.email || text(profile, ["email", "contact_email", "login_email"]);
  const phone = text(profile, ["phone", "phone_number", "mobile_phone"]);
  const photo = text(profile, ["avatar_url", "profile_photo_url", "photo_url", "image_url"]);
  const zip = text(profile, ["zip_code", "zip", "zipcode", "postal_code", "service_zip", "base_zip_code"]);
  const serviceArea = text(profile, ["service_area", "local_area", "community_area", "city", "service_city"]);
  const referralCode = text(profile, ["referral_code", "petperks_code", "pawperks_code"]);

  const commonChecks = [
    ["profile picture", photo],
    ["email", email],
    ["phone", phone],
    ["ZIP code", zip],
    ["service/community area", serviceArea],
    ["referral code/share link", referralCode],
  ] as const;

  const roleSpecific: Record<string, string[]> = {};
  const missing: string[] = commonChecks.filter(([, value]) => !value).map(([label]) => label);

  if (roles.includes("guru") || role === "guru") {
    const guruMissing = [
      ["Guru profile record", guru],
      ["ZIP codes served", text(guru, ["zip_codes_served", "service_zip_codes", "zip_codes"]) || serviceArea],
      ["services offered", text(guru, ["services", "service_types", "services_offered"])],
      ["pricing", input.hasPricing || text(guru, ["hourly_rate", "rate", "price"])],
      ["availability", input.hasAvailability || bool(guru, ["has_availability", "availability_enabled"])],
      ["admin approval/bookable status", bool(guru, ["is_bookable", "admin_approved", "is_approved"])],
    ].filter(([, value]) => !value).map(([label]) => String(label));
    roleSpecific.guru = guruMissing;
    missing.push(...guruMissing);
  }

  if (roles.includes("pet_parent") || role === "pet_parent") {
    const petMissing = input.petsCount && input.petsCount > 0 ? [] : ["at least one pet profile before booking"];
    roleSpecific.pet_parent = petMissing;
  }

  if (roles.includes("ambassador") || role === "ambassador") {
    const ambassadorMissing = [
      ["Ambassador profile record", ambassador],
      ["Ambassador status active", bool(ambassador, ["status", "referral_status", "dashboard_enabled"])],
      ["Referral code", text(ambassador, ["referral_code"]) || referralCode],
    ].filter(([, value]) => !value).map(([label]) => String(label));
    roleSpecific.ambassador = ambassadorMissing;
    missing.push(...ambassadorMissing);
  }

  const uniqueMissing = Array.from(new Set(missing));
  const total = Math.max(1, uniqueMissing.length + 6);
  const percentage = Math.max(0, Math.min(100, Math.round(((total - uniqueMissing.length) / total) * 100)));
  const technicalIssue = !profile ? "auth_only_no_profile" : roles.length === 0 ? "role_missing" : uniqueMissing.includes("Guru profile record") || uniqueMissing.includes("Ambassador profile record") ? "role_profile_missing" : "";
  const completionStatus = uniqueMissing.length === 0 ? "complete" : percentage >= 75 ? "ready_for_review" : percentage <= 10 ? "not_started" : "partially_completed";
  const dashboardUrl = role === "guru" ? "/guru/dashboard" : role === "ambassador" ? "/ambassador/dashboard" : "/customer/dashboard";
  const completionUrl = role === "guru" ? "/guru/dashboard/profile" : role === "ambassador" ? "/ambassador/dashboard" : "/customer/dashboard";
  const referral = referralCode || text(ambassador, ["referral_code"]);

  return {
    completion_status: completionStatus,
    completion_percentage: percentage,
    missing_required_fields: uniqueMissing,
    role,
    roles: roles.length ? roles : [role],
    role_specific_missing_fields: roleSpecific,
    can_be_bookable: (roles.includes("guru") || role === "guru") && uniqueMissing.length === 0,
    can_book: (roles.includes("pet_parent") || role === "pet_parent") && !roleSpecific.pet_parent?.length,
    can_share_referral: Boolean(referral),
    likely_issue_type: technicalIssue || (uniqueMissing.length ? "missing_required_fields" : "complete"),
    profile_completion_url: completionUrl,
    dashboard_url: dashboardUrl,
    referral_code: referral,
    referral_link: referral ? `https://www.sitguru.com/signup?ref=${encodeURIComponent(referral)}` : "",
  };
}
