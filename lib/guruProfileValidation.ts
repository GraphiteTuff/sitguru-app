export type GuruQualityClassification =
  | "active_bookable"
  | "needs_setup"
  | "application_received"
  | "orphaned_profile"
  | "fallback_profile"
  | "duplicate_review"
  | "cleanup_review"
  | "archived";

export type GuruValidationResult = {
  completionPercentage: number;
  missingRequirements: string[];
  classification: GuruQualityClassification;
  isBookable: boolean;
  isPublicVisible: boolean;
  isArchived: boolean;
  isTestAccount: boolean;
  adminStatus: string;
  profileQualityStatus: string;
};

type Row = Record<string, unknown> | null | undefined;

const PLACEHOLDER_NAMES = new Set([
  "guru",
  "profile fallback",
  "auth fallback",
  "sitguru user",
  "unknown",
  "unknown guru",
  "test",
  "demo",
  "sample",
]);

const PLACEHOLDER_LOCATIONS = new Set([
  "location not added yet",
  "location not listed",
  "unknown",
  "not listed",
]);

function str(row: Row, keys: string[]) {
  for (const key of keys) {
    const value = row?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function bool(row: Row, keys: string[]) {
  return keys.some((key) => row?.[key] === true || row?.[key] === "true");
}

function truthyStatus(row: Row, keys: string[], accepted: string[]) {
  const statuses = keys.map((key) => String(row?.[key] || "").trim().toLowerCase());
  return statuses.some((status) => accepted.includes(status));
}

function hasArray(row: Row, keys: string[]) {
  return keys.some((key) => {
    const value = row?.[key];
    return Array.isArray(value) && value.map(String).some((item) => item.trim());
  });
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !email.endsWith("@example.com");
}

function realName(name: string) {
  const normalized = name.trim().toLowerCase();
  if (!normalized || PLACEHOLDER_NAMES.has(normalized)) return false;
  if (/^(test|demo|fake|sample)(\s|$)/i.test(name)) return false;
  if (/^[a-z0-9_-]{12,}$/i.test(name)) return false;
  return /[a-z]/i.test(name) && name.trim().length >= 3;
}

function realLocation(location: string) {
  const normalized = location.trim().toLowerCase();
  return Boolean(normalized) && !PLACEHOLDER_LOCATIONS.has(normalized);
}

export function validateGuruProfileForBookability({
  guru,
  profile,
  duplicateCandidate = false,
  source = "gurus",
}: {
  guru: Row;
  profile?: Row;
  duplicateCandidate?: boolean;
  source?: string;
}): GuruValidationResult {
  const missing: string[] = [];
  const email = str(guru, ["email", "contact_email", "login_email"]) || str(profile, ["email", "contact_email", "login_email"]);
  const name = str(guru, ["display_name", "full_name", "name"]) || str(profile, ["display_name", "full_name", "name"]);
  const location = str(guru, ["service_area", "location", "city", "service_city", "zip_code", "service_zip"]) || str(profile, ["service_area", "location", "city", "service_city", "zip_code", "service_zip"]);
  const status = str(guru, ["status", "application_status", "approval_status"]).toLowerCase();
  const role = (str(guru, ["role", "account_type"]) || str(profile, ["role", "account_type"])).toLowerCase();

  const hasOwner = Boolean(str(guru, ["user_id", "profile_id", "owner_id", "auth_user_id", "id"]) || str(profile, ["user_id", "id"]));
  const archived = bool(guru, ["is_archived", "archived"]) || truthyStatus(guru, ["status", "admin_status"], ["archived"]);
  const test = bool(guru, ["is_test_account", "test_account", "is_spam"]) || /(^|[+@._-])(test|demo|fake|sample|spam)([+@._-]|$)/i.test(`${email} ${name}`);
  const orphaned = source !== "gurus" || !str(guru, ["user_id", "profile_id", "owner_id", "auth_user_id"]);
  const fallback = !realName(name) || !validEmail(email) || !realLocation(location);
  const approved = bool(guru, ["admin_approved", "is_approved", "approved"]) || truthyStatus(guru, ["application_status", "approval_status", "admin_status", "status"], ["approved", "bookable", "active"]);

  if (!hasOwner) missing.push("valid auth user or profile owner id");
  if (!validEmail(email)) missing.push("valid email");
  if (!realName(name)) missing.push("real display name");
  if (!realLocation(location)) missing.push("location or service area");
  if (!hasArray(guru, ["services", "service_types", "services_offered"]) && !str(guru, ["service", "service_name", "specialty"])) missing.push("services offered");
  if (!str(guru, ["hourly_rate", "rate", "price", "base_rate", "daily_rate"])) missing.push("rates/pricing");
  if (!bool(guru, ["has_availability", "availability_enabled", "is_accepting_bookings", "accepting_bookings"]) && !str(guru, ["availability", "availability_status", "schedule"])) missing.push("availability");
  if (!str(guru, ["bio", "about", "description"]) && !str(profile, ["bio", "about", "description"])) missing.push("bio/about");
  if (!str(guru, ["avatar_url", "profile_photo_url", "photo_url", "image_url", "headshot_url"]) && !str(profile, ["avatar_url", "profile_photo_url", "photo_url", "image_url"])) missing.push("profile photo");
  if (role && role !== "guru") missing.push("active Guru role");
  if (archived) missing.push("not archived");
  if (test) missing.push("not test account");
  if (orphaned) missing.push("not orphaned");
  if (duplicateCandidate) missing.push("not duplicate");
  if (!approved) missing.push("admin approved");

  const uniqueMissing = Array.from(new Set(missing));
  const completionPercentage = Math.round(((13 - uniqueMissing.length) / 13) * 100);
  const isBookable = uniqueMissing.length === 0;
  let classification: GuruQualityClassification = "needs_setup";
  if (archived) classification = "archived";
  else if (duplicateCandidate) classification = "duplicate_review";
  else if (orphaned) classification = "orphaned_profile";
  else if (fallback) classification = "fallback_profile";
  else if (isBookable) classification = "active_bookable";
  else if (["new", "submitted", "pending", "reviewing", "pre_approved"].includes(status)) classification = "application_received";
  else if (test || status.includes("reject") || status.includes("suspend")) classification = "cleanup_review";

  return {
    completionPercentage: Math.max(0, Math.min(100, completionPercentage)),
    missingRequirements: uniqueMissing,
    classification,
    isBookable,
    isPublicVisible: isBookable && !archived && !test,
    isArchived: archived,
    isTestAccount: test,
    adminStatus: archived ? "archived" : isBookable ? "approved" : "review_needed",
    profileQualityStatus: isBookable ? "complete" : classification,
  };
}
