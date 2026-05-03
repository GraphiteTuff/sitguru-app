import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

type GuruReportRow = {
  guru_id: string;
  guru_name: string;
  email: string;
  slug: string;
  services: string;
  location: string;
  city: string;
  state: string;
  experience: string;
  application_status: string;
  status_label: string;
  profile_quality: string;
  identity_status: string;
  background_check_status: string;
  safety_status: string;
  bookable: string;
  public_profile_url: string;
  joined_date: string;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toBoolean(value: unknown) {
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "yes" || normalized === "1";
  }

  return Boolean(value);
}

function getText(row: AnyRow | undefined, keys: string[], fallback = "") {
  if (!row) return fallback;

  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }

  return fallback;
}

function getGuruId(guru: AnyRow) {
  return (
    getText(guru, ["id"]) ||
    getText(guru, ["user_id"]) ||
    getText(guru, ["profile_id"]) ||
    getText(guru, ["email"]).toLowerCase()
  );
}

function getProfileKey(profile: AnyRow) {
  return (
    getText(profile, ["id"]) ||
    getText(profile, ["user_id"]) ||
    getText(profile, ["profile_id"]) ||
    getText(profile, ["email"]).toLowerCase()
  );
}

function getGuruProfileKey(guru: AnyRow) {
  return (
    getText(guru, ["user_id"]) ||
    getText(guru, ["profile_id"]) ||
    getText(guru, ["id"]) ||
    getText(guru, ["email"]).toLowerCase()
  );
}

function getGuruName(guru: AnyRow, profile?: AnyRow) {
  return (
    getText(guru, ["display_name", "full_name", "name"]) ||
    getText(profile, ["display_name", "full_name", "name"]) ||
    getText(guru, ["email"]).split("@")[0] ||
    getText(profile, ["email"]).split("@")[0] ||
    "Guru"
  );
}

function getGuruEmail(guru: AnyRow, profile?: AnyRow) {
  return getText(guru, ["email"]) || getText(profile, ["email"]) || "";
}

function getGuruServices(guru: AnyRow) {
  const services = guru.services;

  if (Array.isArray(services) && services.length > 0) {
    return services
      .map((service) => String(service).trim())
      .filter(Boolean)
      .join(" | ");
  }

  return (
    getText(guru, ["service"]) ||
    getText(guru, ["service_name"]) ||
    getText(guru, ["specialty"]) ||
    getText(guru, ["title"]) ||
    "Pet Care"
  );
}

function getGuruCity(guru: AnyRow, profile?: AnyRow) {
  return (
    getText(guru, ["city"]) ||
    getText(profile, ["city"]) ||
    getText(guru, ["service_city"])
  );
}

function getGuruState(guru: AnyRow, profile?: AnyRow) {
  return (
    getText(guru, ["state"]) ||
    getText(profile, ["state"]) ||
    getText(guru, ["service_state"]) ||
    getText(guru, ["state_code"]) ||
    getText(profile, ["state_code"])
  );
}

function getGuruLocation(guru: AnyRow, profile?: AnyRow) {
  const city = getGuruCity(guru, profile);
  const state = getGuruState(guru, profile);

  return [city, state].filter(Boolean).join(", ") || "Location not listed";
}

function getGuruExperience(guru: AnyRow) {
  const years =
    toNumber(guru.experience_years) ||
    toNumber(guru.years_experience) ||
    toNumber(guru.years_of_experience);

  if (years > 0) {
    return `${years} year${years === 1 ? "" : "s"}`;
  }

  return "Not listed";
}

function getCredentialStatus(value: unknown) {
  const normalized = asString(value).toLowerCase();

  if (!normalized) return "Not Started";
  if (normalized === "not_started") return "Not Started";
  if (normalized === "in_progress") return "In Progress";
  if (normalized === "pending") return "Pending";
  if (normalized === "verified") return "Verified";
  if (normalized === "clear") return "Clear";
  if (normalized === "cleared") return "Cleared";
  if (normalized === "approved") return "Approved";
  if (normalized === "rejected") return "Rejected";
  if (normalized === "failed") return "Failed";

  return normalized
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function isGuruFlagged(guru: AnyRow) {
  const status = (
    getText(guru, ["status"]) ||
    getText(guru, ["approval_status"]) ||
    getText(guru, ["application_status"]) ||
    getText(guru, ["risk_level"])
  ).toLowerCase();

  return (
    Boolean(guru.flagged || guru.is_flagged || guru.needs_review) ||
    status.includes("flag") ||
    status.includes("suspend")
  );
}

function isGuruBookable(guru: AnyRow) {
  const status = getText(guru, ["status"]).toLowerCase();
  const applicationStatus = getText(guru, ["application_status"]).toLowerCase();

  return (
    toBoolean(guru.is_bookable) ||
    applicationStatus === "bookable" ||
    status === "active"
  );
}

function isGuruApproved(guru: AnyRow) {
  const status = (
    getText(guru, ["status"]) ||
    getText(guru, ["approval_status"]) ||
    getText(guru, ["application_status"])
  ).toLowerCase();

  return (
    Boolean(guru.is_approved || guru.approved) ||
    status === "approved" ||
    status === "active" ||
    status === "bookable"
  );
}

function needsProfileUpdate(guru: AnyRow) {
  const hasName = Boolean(
    getText(guru, ["display_name", "full_name", "name"]),
  );

  const hasBio = Boolean(getText(guru, ["bio"]));

  const hasLocation = Boolean(
    getText(guru, ["city"]) || getText(guru, ["state"]),
  );

  const hasServices =
    Array.isArray(guru.services) && guru.services.length > 0
      ? true
      : Boolean(
          getText(guru, ["service"]) ||
            getText(guru, ["service_name"]) ||
            getText(guru, ["specialty"]),
        );

  return !hasName || !hasBio || !hasLocation || !hasServices;
}

function getProfileQuality(guru: AnyRow) {
  return needsProfileUpdate(guru) ? "Needs Update" : "Complete";
}

function normalizeApplicationStatus(guru: AnyRow) {
  const rawStatus = (
    getText(guru, ["application_status"]) ||
    getText(guru, ["approval_status"]) ||
    getText(guru, ["status"])
  ).toLowerCase();

  if (isGuruFlagged(guru)) return "suspended";
  if (rawStatus === "suspended" || rawStatus.includes("suspend")) {
    return "suspended";
  }
  if (rawStatus === "rejected" || rawStatus.includes("reject")) {
    return "rejected";
  }
  if (isGuruBookable(guru)) return "bookable";

  if (
    rawStatus === "verification_pending" ||
    rawStatus.includes("verification")
  ) {
    return "verification_pending";
  }

  if (
    rawStatus === "pre_approved" ||
    rawStatus === "pre-approved" ||
    rawStatus.includes("pre")
  ) {
    return "pre_approved";
  }

  if (
    rawStatus === "needs_info" ||
    rawStatus === "needs-info" ||
    rawStatus.includes("needs info") ||
    rawStatus.includes("profile update")
  ) {
    return "needs_info";
  }

  if (rawStatus === "reviewing" || rawStatus.includes("review")) {
    return "reviewing";
  }

  if (rawStatus === "approved" || isGuruApproved(guru)) {
    return "approved";
  }

  if (rawStatus === "new") return "new";
  if (rawStatus === "pending") return "new";

  if (needsProfileUpdate(guru)) return "needs_info";

  return "new";
}

function getApplicationStatusLabel(status: string) {
  switch (status) {
    case "new":
      return "Application Received";
    case "reviewing":
      return "Profile Under Review";
    case "needs_info":
      return "More Info Needed";
    case "pre_approved":
      return "Pre-Approved";
    case "verification_pending":
      return "Verification Needed";
    case "approved":
      return "Approved";
    case "bookable":
      return "Bookable";
    case "rejected":
      return "Not Approved";
    case "suspended":
      return "Paused";
    default:
      return "Application Received";
  }
}

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string,
): Promise<T[]> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Guru export query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Guru export query skipped for ${label}:`, error);
    return [];
  }
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  const escaped = text.replaceAll('"', '""');

  if (
    escaped.includes(",") ||
    escaped.includes("\n") ||
    escaped.includes("\r") ||
    escaped.includes('"')
  ) {
    return `"${escaped}"`;
  }

  return escaped;
}

function toCsv(rows: GuruReportRow[]) {
  const headers: Array<keyof GuruReportRow> = [
    "guru_id",
    "guru_name",
    "email",
    "slug",
    "services",
    "location",
    "city",
    "state",
    "experience",
    "application_status",
    "status_label",
    "profile_quality",
    "identity_status",
    "background_check_status",
    "safety_status",
    "bookable",
    "public_profile_url",
    "joined_date",
  ];

  const csvRows = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ];

  return csvRows.join("\n");
}

async function getGuruReportRows() {
  const [gurus, profiles] = await Promise.all([
    safeRows<AnyRow>(
      supabaseAdmin
        .from("gurus")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
      "gurus",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
      "profiles",
    ),
  ]);

  const profileMap = new Map<string, AnyRow>();

  for (const profile of profiles) {
    const key = getProfileKey(profile);
    const email = getText(profile, ["email"]).toLowerCase();

    if (key) profileMap.set(key, profile);
    if (email) profileMap.set(email, profile);
  }

  return gurus
    .map((guru) => {
      const profile = profileMap.get(getGuruProfileKey(guru));
      const guruId = getGuruId(guru);
      const slug = getText(guru, ["slug"]);
      const status = normalizeApplicationStatus(guru);
      const city = getGuruCity(guru, profile);
      const state = getGuruState(guru, profile);
      const publicProfileUrl = slug ? `/guru/${slug}` : "";

      return {
        guru_id: guruId,
        guru_name: getGuruName(guru, profile),
        email: getGuruEmail(guru, profile),
        slug,
        services: getGuruServices(guru),
        location: getGuruLocation(guru, profile),
        city,
        state,
        experience: getGuruExperience(guru),
        application_status: status,
        status_label: getApplicationStatusLabel(status),
        profile_quality: getProfileQuality(guru),
        identity_status: getCredentialStatus(
          guru.stripe_identity_status || guru.identity_status,
        ),
        background_check_status: getCredentialStatus(guru.background_check_status),
        safety_status: getCredentialStatus(guru.safety_cert_status),
        bookable: isGuruBookable(guru) ? "Yes" : "No",
        public_profile_url: publicProfileUrl,
        joined_date: getText(guru, ["created_at"]),
      };
    })
    .sort((a, b) => a.guru_name.localeCompare(b.guru_name));
}

export async function GET() {
  const rows = await getGuruReportRows();
  const csv = toCsv(rows);
  const today = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sitguru-guru-records-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}