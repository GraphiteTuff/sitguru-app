import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  VETERANS_MILITARY_FAMILIES_PROGRAM,
  isVeteransMilitaryFamiliesProgram,
} from "@/lib/programs/veterans-military-families";
import { asAnyRows } from "@/lib/supabase/as-rows";

export type ProgramsSourceHealth = {
  id: string;
  label: string;
  ok: boolean;
  rowCount: number;
  message: string;
};

export type ProgramsMetrics = {
  applications: number;
  pendingApplications: number;
  approvedApplications: number;
  studentHire: number;
  communityHire: number;
  militaryHire: number;
  skillbridgeInterest: number;
  ambassadorProgram: number;
  ambassadorLeads: number;
  ambassadors: number;
  partnerApplications: number;
};

export type ProgramsRecentItem = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  date: string | null;
  href: string;
};

export type ProgramsDashboardData = {
  metrics: ProgramsMetrics;
  sourceHealth: ProgramsSourceHealth[];
  recentApplications: ProgramsRecentItem[];
  pendingQueue: ProgramsRecentItem[];
  recentAmbassadorLeads: ProgramsRecentItem[];
  isLive: boolean;
};

type AnyRow = Record<string, unknown>;

type SafeResult = {
  data: AnyRow[];
  ok: boolean;
  message: string;
  count: number;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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
    asString(row.updated_at) ||
    asString(row.created_at) ||
    asString(row.submitted_at) ||
    asString(row.applied_at) ||
    null
  );
}

function getStatus(row: AnyRow) {
  return getText(
    row,
    ["status", "application_status", "participant_status", "program_status"],
    "new",
  )
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function readableStatus(status: string) {
  if (status === "new") return "New";
  if (status === "pending") return "Pending";
  if (status === "submitted") return "Submitted";
  if (status === "review" || status === "reviewing" || status === "in_review") {
    return "In Review";
  }
  if (status === "contacted") return "Contacted";
  if (status === "interested") return "Interested";
  if (status === "missing_info") return "Missing Info";
  if (status === "approved" || status === "active" || status === "accepted") {
    return "Approved";
  }

  return (
    status
      .split("_")
      .filter(Boolean)
      .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
      .join(" ") || "New"
  );
}

function isPendingStatus(status: string) {
  return [
    "new",
    "pending",
    "submitted",
    "review",
    "reviewing",
    "in_review",
    "contacted",
    "interested",
    "applied",
    "missing_info",
  ].includes(status);
}

function isApprovedStatus(status: string) {
  return [
    "active",
    "approved",
    "accepted",
    "live",
    "enabled",
    "bookable",
    "complete",
    "completed",
  ].includes(status);
}

function normalizeProgramKey(value: string) {
  const normalized = value.toLowerCase().trim().replace(/\s+/g, "-");

  if (
    normalized === "military-hire" ||
    normalized === "military" ||
    normalized === "veterans-hire" ||
    normalized === "veterans" ||
    isVeteransMilitaryFamiliesProgram(value)
  ) {
    return "veterans-hire";
  }

  if (
    normalized === "skillbridge-interest" ||
    normalized === "skillbridge" ||
    normalized.includes("skillbridge")
  ) {
    return "skillbridge-interest";
  }

  if (
    normalized === "ambassadors" ||
    normalized === "ambassador" ||
    normalized === "ambassador-program"
  ) {
    return "ambassador-program";
  }

  if (normalized.includes("student")) return "student-hire";
  if (normalized.includes("community")) return "community-hire";

  return normalized;
}

function programLabel(key: string) {
  if (key === "student-hire") return "Student Hire";
  if (key === "community-hire") return "Community Hire";
  if (key === "veterans-hire") return VETERANS_MILITARY_FAMILIES_PROGRAM.shortName;
  if (key === "skillbridge-interest") {
    return VETERANS_MILITARY_FAMILIES_PROGRAM.skillbridge.shortName;
  }
  if (key === "ambassador-program") return "Ambassador Program";
  return key || "Program";
}

function applicationHref(row: AnyRow, programKey: string) {
  const id = getText(row, ["id"]);
  if (id) {
    return `/admin/program-applications?program=${encodeURIComponent(programKey)}&id=${encodeURIComponent(id)}`;
  }
  return `/admin/program-applications?program=${encodeURIComponent(programKey)}`;
}

async function safeSelect(
  table: string,
  columns = "*",
  limit = 500,
): Promise<SafeResult> {
  try {
    const { data, error, count } = await supabaseAdmin
      .from(table)
      .select(columns, { count: "exact" })
      .limit(limit);

    if (error) {
      return {
        data: [],
        ok: false,
        message: error.message || `${table} unavailable`,
        count: 0,
      };
    }

    const rows = asAnyRows(data);
    return {
      data: rows,
      ok: true,
      message: `${table} connected`,
      count: typeof count === "number" ? count : rows.length,
    };
  } catch (error) {
    return {
      data: [],
      ok: false,
      message: error instanceof Error ? error.message : `${table} unavailable`,
      count: 0,
    };
  }
}

function toApplicationItem(row: AnyRow): ProgramsRecentItem {
  const programKey = normalizeProgramKey(
    getText(row, ["program", "program_key", "program_slug", "program_type"]),
  );
  const name = getText(
    row,
    ["full_name", "display_name", "name", "applicant_name", "lead_name"],
    "Applicant",
  );
  const email = getText(row, ["email", "applicant_email", "lead_email"], "");
  const status = getStatus(row);

  return {
    id: getText(row, ["id"], `${name}-${email}-${getDate(row)}`),
    title: name,
    subtitle: [programLabel(programKey), email].filter(Boolean).join(" · "),
    status: readableStatus(status),
    date: getDate(row),
    href: applicationHref(row, programKey || "student-hire"),
  };
}

function toLeadItem(row: AnyRow): ProgramsRecentItem {
  const name = getText(
    row,
    ["full_name", "display_name", "name", "lead_name"],
    "Ambassador Lead",
  );
  const email = getText(row, ["email", "lead_email", "contact_email"], "");
  const program = getText(
    row,
    ["program", "program_interest", "pathway", "source_program"],
    "Ambassador",
  );
  const status = getStatus(row);
  const id = getText(row, ["id"], `${name}-${email}`);

  return {
    id,
    title: name,
    subtitle: [program, email].filter(Boolean).join(" · "),
    status: readableStatus(status),
    date: getDate(row),
    href: id ? `/admin/ambassador-leads/${encodeURIComponent(id)}` : "/admin/ambassador-leads",
  };
}

export async function getProgramsDashboardData(): Promise<ProgramsDashboardData> {
  const [
    applicationsResult,
    ambassadorLeadsResult,
    ambassadorsResult,
    partnerApplicationsResult,
    programsResult,
  ] = await Promise.all([
    safeSelect(
      "program_applications",
      "id, full_name, name, email, program, program_key, program_slug, program_type, status, created_at, updated_at, submitted_at",
      500,
    ),
    safeSelect(
      "ambassador_leads",
      "id, full_name, name, email, program, program_interest, status, created_at, updated_at",
      200,
    ),
    safeSelect("ambassadors", "id, status, created_at", 100),
    safeSelect("partner_applications", "id, status, created_at", 100),
    safeSelect("programs", "id, name, status, created_at", 50),
  ]);

  const applications = applicationsResult.data;
  const pendingApplications = applications.filter((row) =>
    isPendingStatus(getStatus(row)),
  );
  const approvedApplications = applications.filter((row) =>
    isApprovedStatus(getStatus(row)),
  );

  const countByProgram = (key: string) =>
    applications.filter(
      (row) =>
        normalizeProgramKey(
          getText(row, ["program", "program_key", "program_slug", "program_type"]),
        ) === key,
    ).length;

  const metrics: ProgramsMetrics = {
    applications: applicationsResult.count,
    pendingApplications: pendingApplications.length,
    approvedApplications: approvedApplications.length,
    studentHire: countByProgram("student-hire"),
    communityHire: countByProgram("community-hire"),
    militaryHire: countByProgram("veterans-hire"),
    skillbridgeInterest: countByProgram("skillbridge-interest"),
    ambassadorProgram: countByProgram("ambassador-program"),
    ambassadorLeads: ambassadorLeadsResult.count,
    ambassadors: ambassadorsResult.count,
    partnerApplications: partnerApplicationsResult.count,
  };

  const sortedApplications = [...applications].sort((a, b) => {
    const dateA = new Date(getDate(a) || 0).getTime();
    const dateB = new Date(getDate(b) || 0).getTime();
    return dateB - dateA;
  });

  const sortedLeads = [...ambassadorLeadsResult.data].sort((a, b) => {
    const dateA = new Date(getDate(a) || 0).getTime();
    const dateB = new Date(getDate(b) || 0).getTime();
    return dateB - dateA;
  });

  const sourceHealth: ProgramsSourceHealth[] = [
    {
      id: "program_applications",
      label: "Program Applications",
      ok: applicationsResult.ok,
      rowCount: applicationsResult.count,
      message: applicationsResult.message,
    },
    {
      id: "ambassador_leads",
      label: "Ambassador Leads",
      ok: ambassadorLeadsResult.ok,
      rowCount: ambassadorLeadsResult.count,
      message: ambassadorLeadsResult.message,
    },
    {
      id: "ambassadors",
      label: "Ambassadors",
      ok: ambassadorsResult.ok,
      rowCount: ambassadorsResult.count,
      message: ambassadorsResult.message,
    },
    {
      id: "partner_applications",
      label: "Partner Applications",
      ok: partnerApplicationsResult.ok,
      rowCount: partnerApplicationsResult.count,
      message: partnerApplicationsResult.message,
    },
    {
      id: "programs",
      label: "Programs Registry",
      ok: programsResult.ok,
      rowCount: programsResult.count,
      message: programsResult.message,
    },
  ];

  return {
    metrics,
    sourceHealth,
    recentApplications: sortedApplications.slice(0, 6).map(toApplicationItem),
    pendingQueue: pendingApplications
      .sort((a, b) => {
        const dateA = new Date(getDate(a) || 0).getTime();
        const dateB = new Date(getDate(b) || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 6)
      .map(toApplicationItem),
    recentAmbassadorLeads: sortedLeads.slice(0, 6).map(toLeadItem),
    isLive: sourceHealth.some((item) => item.ok),
  };
}
