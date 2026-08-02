import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  VETERANS_MILITARY_FAMILIES_PROGRAM,
  isVeteransMilitaryFamiliesProgram,
} from "@/lib/programs/veterans-military-families";

export type AnyRow = Record<string, unknown>;

export type HrLeadRecord = {
  id: string;
  raw: AnyRow;
  name: string;
  email: string;
  program: string;
  source: string;
  status: string;
  location: string;
  date: string | null;
  archived: boolean;
  href: string;
  sourceTable: string;
};

export type HrSourceHealth = {
  id: string;
  label: string;
  ok: boolean;
  rowCount: number;
  message: string;
};

export type HrMetrics = {
  ambassadorLeads: number;
  activeAmbassadorLeads: number;
  archivedAmbassadorLeads: number;
  activeAmbassadorDashboards: number;
  studentHire: number;
  communityHire: number;
  militaryHire: number;
  activeStudentHire: number;
  activeCommunityHire: number;
  activeMilitaryHire: number;
  activeGuruApplicants: number;
  pendingGuruApplicants: number;
  approvedGuruApplicants: number;
  pendingBackgroundChecks: number;
  approvedBackgroundChecks: number;
  needsReviewBackgroundChecks: number;
  recentApplicants: number;
};

export type HrDashboardData = {
  metrics: HrMetrics;
  recentAmbassadorLeads: HrLeadRecord[];
  recentGuruApplicants: HrLeadRecord[];
  pendingBackgroundChecks: HrLeadRecord[];
  sourceHealth: HrSourceHealth[];
  isLive: boolean;
};

type SafeAdminQueryResponse = {
  data: unknown;
  error: unknown;
};

const VETERANS_PROGRAM_LABEL = VETERANS_MILITARY_FAMILIES_PROGRAM.shortName;
const programOrder = ["Student Hire", "Community Hire", VETERANS_PROGRAM_LABEL];

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  if (typeof value === "number") return value === 1;
  return false;
}

function getText(row: AnyRow, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }
  return fallback;
}

function getDate(row: AnyRow) {
  return (
    asString(row.created_at) ||
    asString(row.updated_at) ||
    asString(row.applied_at) ||
    asString(row.submitted_at) ||
    asString(row.last_contacted_at) ||
    asString(row.invited_at) ||
    asString(row.completed_at) ||
    asString(row.date) ||
    null
  );
}

function getStatus(row: AnyRow) {
  return getText(
    row,
    [
      "status",
      "lead_status",
      "application_status",
      "approval_status",
      "background_check_status",
      "checkr_status",
    ],
    "new",
  ).toLowerCase();
}

function isArchivedStatus(row: AnyRow) {
  const status = getStatus(row);
  return (
    status === "archived" ||
    status === "archive" ||
    status === "retained" ||
    Boolean(asString(row.archived_at))
  );
}

function isPendingStatus(row: AnyRow) {
  if (isArchivedStatus(row)) return false;
  const status = getStatus(row);
  return (
    status === "new" ||
    status === "pending" ||
    status === "submitted" ||
    status === "review" ||
    status === "in_review" ||
    status === "contacted" ||
    status === "interested" ||
    status === "applied" ||
    status === "conditional_offer_sent" ||
    status === "onboarding_sent" ||
    status === "invited" ||
    status === "invitation_sent" ||
    status === "awaiting"
  );
}

function isApprovedStatus(row: AnyRow) {
  if (isArchivedStatus(row)) return false;
  const status = getStatus(row);
  return (
    status === "approved" ||
    status === "active" ||
    status === "enabled" ||
    status === "live" ||
    status === "complete" ||
    status === "completed" ||
    status === "clear" ||
    status === "cleared" ||
    status === "pass" ||
    status === "passed"
  );
}

function isNeedsReviewStatus(row: AnyRow) {
  if (isArchivedStatus(row)) return false;
  const status = getStatus(row);
  return (
    status === "consider" ||
    status === "failed" ||
    status === "suspended" ||
    status === "canceled" ||
    status === "cancelled" ||
    status === "dispute" ||
    status === "needs_review"
  );
}

function isDashboardEnabled(row: AnyRow) {
  return asBoolean(row.dashboard_enabled);
}

function getRole(row: AnyRow) {
  return getText(
    row,
    ["role", "user_role", "account_type", "type", "segment"],
    "",
  ).toLowerCase();
}

function getParticipantType(row: AnyRow) {
  return getText(
    row,
    ["participant_type", "partner_type", "program_type", "type", "role"],
    "",
  ).toLowerCase();
}

function getDisplayName(row: AnyRow, fallback = "Applicant") {
  const firstName = getText(row, ["first_name", "firstName"]);
  const lastName = getText(row, ["last_name", "lastName"]);
  if (firstName || lastName) return `${firstName} ${lastName}`.trim();

  return getText(
    row,
    [
      "full_name",
      "display_name",
      "name",
      "lead_name",
      "applicant_name",
      "candidate_name",
      "contact_name",
      "guru_name",
      "email",
    ],
    fallback,
  );
}

function getEmail(row: AnyRow) {
  return getText(
    row,
    [
      "email",
      "lead_email",
      "applicant_email",
      "candidate_email",
      "contact_email",
      "guru_email",
    ],
    "—",
  );
}

function getLocation(row: AnyRow) {
  const city = getText(row, ["city", "service_city", "location_city"]);
  const state = getText(row, ["state", "service_state", "location_state"]);
  const location = getText(row, ["location", "market", "area"]);
  if (city || state) return [city, state].filter(Boolean).join(", ");
  return location || "—";
}

function getCombinedText(row: AnyRow) {
  return [
    getText(row, ["program", "program_name", "program_type", "lead_program"]),
    getText(row, ["participant_type", "partner_type", "type", "role"]),
    getText(row, ["source", "lead_source", "signup_source", "utm_source"]),
    getText(row, ["campaign", "campaign_name", "utm_campaign"]),
    getText(row, ["title", "name", "interest", "notes", "message"]),
    getText(row, ["position", "job_title", "posting_title"]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getProgramLabel(row: AnyRow) {
  const text = getCombinedText(row);
  const explicitProgram = getText(
    row,
    ["program", "program_name", "program_type", "lead_program"],
    "",
  );

  if (programOrder.includes(explicitProgram)) return explicitProgram;
  if (isVeteransMilitaryFamiliesProgram(explicitProgram)) {
    return VETERANS_PROGRAM_LABEL;
  }
  if (text.includes("student")) return "Student Hire";
  if (text.includes("community")) return "Community Hire";
  if (
    text.includes("military") ||
    text.includes("veteran") ||
    text.includes("active-duty") ||
    text.includes("active duty") ||
    text.includes("guard") ||
    text.includes("reserve")
  ) {
    return VETERANS_PROGRAM_LABEL;
  }
  return "Community Hire";
}

function getSourceLabel(row: AnyRow) {
  const source = getText(
    row,
    ["source", "lead_source", "signup_source", "utm_source", "referral_source"],
    "",
  );
  const text = `${source} ${getCombinedText(row)}`.toLowerCase();

  if (text.includes("careerlink") || text.includes("career link")) {
    return "PA CareerLink";
  }
  if (text.includes("indeed")) return "Indeed";
  if (text.includes("handshake")) return "Handshake";
  if (text.includes("linkedin") || text.includes("linked in")) return "LinkedIn";
  if (
    text.includes("college") ||
    text.includes("university") ||
    text.includes("campus")
  ) {
    return "College / University";
  }
  if (text.includes("referral")) return "Referral";
  if (text.includes("website") || text.includes("site")) return "Website";
  return source || "Other";
}

function isGuruApplicant(row: AnyRow) {
  const text = getCombinedText(row);
  const role = getRole(row);
  const participantType = getParticipantType(row);
  return (
    text.includes("guru") ||
    text.includes("pet care") ||
    text.includes("sitter") ||
    text.includes("walker") ||
    role.includes("guru") ||
    participantType.includes("guru")
  );
}

function isWithinLastDays(value: string | null, days: number) {
  if (!value) return false;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return parsed >= cutoff;
}

async function safeAdminQuery(
  query: PromiseLike<SafeAdminQueryResponse>,
  label: string,
): Promise<{ data: AnyRow[]; ok: boolean; message: string }> {
  try {
    const result = await query;
    if (result.error) {
      console.warn(`HR query skipped for ${label}:`, result.error);
      return {
        data: [],
        ok: false,
        message:
          typeof result.error === "object" &&
          result.error &&
          "message" in result.error
            ? String((result.error as { message?: string }).message)
            : `${label} unavailable`,
      };
    }
    return {
      data: Array.isArray(result.data) ? (result.data as AnyRow[]) : [],
      ok: true,
      message: `${label} connected`,
    };
  } catch (error) {
    console.warn(`HR query skipped for ${label}:`, error);
    return {
      data: [],
      ok: false,
      message: error instanceof Error ? error.message : `${label} unavailable`,
    };
  }
}

function mergeRows(...groups: AnyRow[][]) {
  const merged: AnyRow[] = [];
  const seen = new Set<string>();

  for (const group of groups) {
    for (const row of group) {
      const sourceTable = getText(row, ["__source_table"], "unknown");
      const id = getText(row, ["id"]);
      const email = getEmail(row).toLowerCase();
      const name = getDisplayName(row).toLowerCase();
      const date = getDate(row);
      const fallbackKey = `${sourceTable}:${email}:${name}:${date}:${merged.length}`;
      const key = id ? `${sourceTable}:${id}` : fallbackKey;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(row);
    }
  }

  return merged;
}

function withSourceTable(row: AnyRow, sourceTable: string) {
  return { ...row, __source_table: sourceTable };
}

function getReadableStatus(row: AnyRow) {
  const status = getStatus(row);
  if (
    ["new", "pending", "submitted", "review", "in_review", "applied"].includes(
      status,
    )
  ) {
    return "New";
  }
  if (["invited", "invitation_sent", "awaiting"].includes(status)) {
    return "Invited";
  }
  if (
    ["conditional_offer_sent", "onboarding_sent", "contacted"].includes(status)
  ) {
    return "Contacted";
  }
  if (status === "interested") return "Interested";
  if (["signed_up", "signup", "converted"].includes(status)) return "Signed Up";
  if (
    ["approved", "active", "enabled", "live", "complete", "completed"].includes(
      status,
    )
  ) {
    return "Approved";
  }
  if (["clear", "cleared", "pass", "passed"].includes(status)) return "Clear";
  if (["consider", "needs_review"].includes(status)) return "Needs Review";
  if (["failed", "suspended", "canceled", "cancelled"].includes(status)) {
    return "Blocked";
  }
  if (
    [
      "not_moving_forward",
      "not_a_fit",
      "not_moving",
      "declined",
      "rejected",
      "inactive",
    ].includes(status)
  ) {
    return "Not Moving Forward";
  }
  if (status === "archived") return "Archived";

  return (
    status
      .split("_")
      .filter(Boolean)
      .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
      .join(" ") || "New"
  );
}

function detailHref(row: AnyRow, sourceTable: string) {
  const id = getText(row, ["id", "guru_id", "lead_id", "user_id"]);
  if (sourceTable === "ambassador_leads") {
    return id
      ? `/admin/ambassador-leads?lead=${encodeURIComponent(id)}`
      : "/admin/ambassador-leads";
  }
  if (sourceTable === "ambassadors") {
    return id
      ? `/admin/ambassadors?ambassador=${encodeURIComponent(id)}`
      : "/admin/ambassadors";
  }
  if (sourceTable === "guru_applications" || sourceTable.includes("guru")) {
    return id ? `/admin/gurus?focus=${encodeURIComponent(id)}` : "/admin/gurus";
  }
  if (
    sourceTable === "guru_background_checks" ||
    sourceTable === "background_checks"
  ) {
    return "/admin/background-checks";
  }
  return "/admin/hr";
}

function normalizeLead(row: AnyRow): HrLeadRecord {
  const sourceTable = getText(row, ["__source_table"], "unknown");
  const id =
    getText(row, ["id", "guru_id", "lead_id", "user_id"]) ||
    `${sourceTable}-${getEmail(row)}-${getDate(row)}`;

  return {
    id,
    raw: row,
    name: getDisplayName(row),
    email: getEmail(row),
    program: getProgramLabel(row),
    source: getSourceLabel(row),
    status: getReadableStatus(row),
    location: getLocation(row),
    date: getDate(row),
    archived: isArchivedStatus(row),
    href: detailHref(row, sourceTable),
    sourceTable,
  };
}

export async function getHrDashboardData(): Promise<HrDashboardData> {
  const [
    ambassadorLeadsResult,
    ambassadorsResult,
    guruApplicationsResult,
    gurusResult,
    partnerApplicationsResult,
    launchSignupsResult,
    launchWaitlistResult,
    programApplicationsResult,
    backgroundChecksResult,
  ] = await Promise.all([
    safeAdminQuery(
      supabaseAdmin
        .from("ambassador_leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "ambassador_leads",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("ambassadors")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "ambassadors",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("guru_applications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "guru_applications",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("gurus")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "gurus",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("partner_applications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "partner_applications",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("launch_signups")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "launch_signups",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("launch_waitlist")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "launch_waitlist",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("program_applications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "program_applications",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("guru_background_checks")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "guru_background_checks",
    ),
  ]);

  const ambassadorLeads = ambassadorLeadsResult.data.map((row) =>
    withSourceTable(row, "ambassador_leads"),
  );
  const ambassadors = ambassadorsResult.data.map((row) =>
    withSourceTable(row, "ambassadors"),
  );
  const guruApplications = guruApplicationsResult.data.map((row) =>
    withSourceTable(row, "guru_applications"),
  );
  const gurus = gurusResult.data.map((row) => withSourceTable(row, "gurus"));
  const partnerApplications = partnerApplicationsResult.data.map((row) =>
    withSourceTable(row, "partner_applications"),
  );
  const launchSignups = launchSignupsResult.data.map((row) =>
    withSourceTable(row, "launch_signups"),
  );
  const launchWaitlist = launchWaitlistResult.data.map((row) =>
    withSourceTable(row, "launch_waitlist"),
  );
  const programApplications = programApplicationsResult.data.map((row) =>
    withSourceTable(row, "program_applications"),
  );
  const backgroundChecks = backgroundChecksResult.data.map((row) =>
    withSourceTable(row, "guru_background_checks"),
  );

  const allAmbassadorRows = mergeRows(ambassadorLeads).sort((a, b) => {
    return new Date(getDate(b) || 0).getTime() - new Date(getDate(a) || 0).getTime();
  });
  const allAmbassadorDashboardRows = mergeRows(ambassadors).sort((a, b) => {
    return new Date(getDate(b) || 0).getTime() - new Date(getDate(a) || 0).getTime();
  });
  const allGuruRows = mergeRows(
    guruApplications,
    gurus,
    partnerApplications.filter(isGuruApplicant),
    launchSignups.filter(isGuruApplicant),
    launchWaitlist.filter(isGuruApplicant),
    programApplications.filter(isGuruApplicant),
  ).sort((a, b) => {
    return new Date(getDate(b) || 0).getTime() - new Date(getDate(a) || 0).getTime();
  });

  const ambassadorRecords = allAmbassadorRows.map(normalizeLead);
  const ambassadorDashboardRecords = allAmbassadorDashboardRows.map(normalizeLead);
  const guruRecords = allGuruRows.map(normalizeLead);
  const backgroundCheckRecords = backgroundChecks.map(normalizeLead);

  const activeAmbassadorRecords = ambassadorRecords.filter((r) => !r.archived);
  const archivedAmbassadorRecords = ambassadorRecords.filter((r) => r.archived);
  const activeAmbassadorDashboardRecords = ambassadorDashboardRecords.filter(
    (r) => !r.archived && isDashboardEnabled(r.raw),
  );
  const pendingGuruRecords = guruRecords.filter((r) => isPendingStatus(r.raw));
  const approvedGuruRecords = guruRecords.filter((r) => isApprovedStatus(r.raw));
  const pendingBackgroundCheckRecords = backgroundCheckRecords.filter((r) =>
    isPendingStatus(r.raw),
  );
  const approvedBackgroundCheckRecords = backgroundCheckRecords.filter((r) =>
    isApprovedStatus(r.raw),
  );
  const needsReviewBackgroundCheckRecords = backgroundCheckRecords.filter((r) =>
    isNeedsReviewStatus(r.raw),
  );

  const sourceHealth: HrSourceHealth[] = [
    {
      id: "ambassador_leads",
      label: "Ambassador Leads",
      ok: ambassadorLeadsResult.ok,
      rowCount: ambassadorLeadsResult.data.length,
      message: ambassadorLeadsResult.message,
    },
    {
      id: "ambassadors",
      label: "Ambassador Dashboards",
      ok: ambassadorsResult.ok,
      rowCount: ambassadorsResult.data.length,
      message: ambassadorsResult.message,
    },
    {
      id: "gurus",
      label: "Guru Applicants",
      ok: gurusResult.ok || guruApplicationsResult.ok,
      rowCount: gurusResult.data.length + guruApplicationsResult.data.length,
      message: gurusResult.ok
        ? gurusResult.message
        : guruApplicationsResult.message,
    },
    {
      id: "guru_background_checks",
      label: "Trust & Safety Checks",
      ok: backgroundChecksResult.ok,
      rowCount: backgroundChecksResult.data.length,
      message: backgroundChecksResult.message,
    },
  ];

  const metrics: HrMetrics = {
    ambassadorLeads: ambassadorRecords.length,
    activeAmbassadorLeads: activeAmbassadorRecords.length,
    archivedAmbassadorLeads: archivedAmbassadorRecords.length,
    activeAmbassadorDashboards: activeAmbassadorDashboardRecords.length,
    studentHire: ambassadorRecords.filter((r) => r.program === "Student Hire")
      .length,
    communityHire: ambassadorRecords.filter(
      (r) => r.program === "Community Hire",
    ).length,
    militaryHire: ambassadorRecords.filter((r) =>
      isVeteransMilitaryFamiliesProgram(r.program),
    ).length,
    activeStudentHire: activeAmbassadorRecords.filter(
      (r) => r.program === "Student Hire",
    ).length,
    activeCommunityHire: activeAmbassadorRecords.filter(
      (r) => r.program === "Community Hire",
    ).length,
    activeMilitaryHire: activeAmbassadorRecords.filter((r) =>
      isVeteransMilitaryFamiliesProgram(r.program),
    ).length,
    activeGuruApplicants: guruRecords.filter((r) => !r.archived).length,
    pendingGuruApplicants: pendingGuruRecords.length,
    approvedGuruApplicants: approvedGuruRecords.length,
    pendingBackgroundChecks: pendingBackgroundCheckRecords.length,
    approvedBackgroundChecks: approvedBackgroundCheckRecords.length,
    needsReviewBackgroundChecks: needsReviewBackgroundCheckRecords.length,
    recentApplicants: [...ambassadorRecords, ...guruRecords].filter((r) =>
      isWithinLastDays(r.date, 14),
    ).length,
  };

  return {
    metrics,
    recentAmbassadorLeads: activeAmbassadorRecords.slice(0, 8),
    recentGuruApplicants: guruRecords
      .filter((r) => !r.archived)
      .slice(0, 8),
    pendingBackgroundChecks: [
      ...needsReviewBackgroundCheckRecords,
      ...pendingBackgroundCheckRecords,
    ].slice(0, 8),
    sourceHealth,
    isLive: sourceHealth.some((source) => source.ok),
  };
}
