import {
  ACCESS_GRANT_STATUSES,
  SMART_GOAL_STATUSES,
  UNIVERSITY_RECRUITING_STATUSES,
  UNIVERSITY_REQUIREMENTS_STATUSES,
  UNIVERSITY_STATUSES,
} from "@/lib/internship/constants";
import { internStatusLabel } from "@/lib/internship/labels";
import { INTERN_KPI_BASELINE_NOTE } from "@/lib/internship/intern-kpis";
import type {
  InternshipAccessGrant,
  InternshipIntern,
  InternshipMetric,
  InternshipSmartGoal,
  InternshipUniversity,
  InternshipWorkspaceData,
} from "@/lib/internship/types";

export type AttentionItem = {
  id: string;
  text: string;
  href?: string;
};

export type AcademicStatusKind =
  | "requirements_not_verified"
  | "pending_university_approval"
  | "credit_approved";

const FORMAL_PARTNER_STATUSES = new Set(["formal_partner", "active_partner"]);
const GRADING_GOAL_STATUSES = new Set(["approved", "locked"]);

export function isFormalUniversityPartner(university: {
  isUniversityPartner?: boolean;
  status?: string;
}) {
  return (
    university.isUniversityPartner === true &&
    FORMAL_PARTNER_STATUSES.has(String(university.status || ""))
  );
}

export function academicFieldsVerified(intern: Pick<InternshipIntern, "academicSnapshot">) {
  return Boolean(intern.academicSnapshot?.requirementId);
}

export function displayVerifiedNumber(
  value: number | null | undefined,
  verified: boolean,
  pendingLabel = "Pending",
) {
  if (!verified || value == null) return pendingLabel;
  return String(value);
}

export function academicStatusKind(
  intern: Pick<InternshipIntern, "academicSnapshot" | "approvalStatus">,
): AcademicStatusKind {
  if (!academicFieldsVerified(intern)) return "requirements_not_verified";
  if (intern.approvalStatus === "approved" || intern.approvalStatus === "confirmed") {
    return "credit_approved";
  }
  return "pending_university_approval";
}

export function academicStatusLabel(kind: AcademicStatusKind) {
  if (kind === "credit_approved") return "Credit Approved";
  if (kind === "pending_university_approval") return "Pending University Approval";
  return "Requirements Not Verified";
}

export function sitguruEmploymentLabel(status: string) {
  if (status === "active") return "Active Intern";
  return internStatusLabel(status);
}

export function internPublicIdentity(intern: InternshipIntern, universityName?: string | null) {
  return [
    intern.academicLevel
      ? intern.academicLevel.charAt(0).toUpperCase() + intern.academicLevel.slice(1)
      : "",
    universityName || "",
    intern.academicProgram || "",
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" · ");
}

export function isGradingSmartGoal(goal: Pick<InternshipSmartGoal, "status">) {
  return GRADING_GOAL_STATUSES.has(goal.status);
}

export function hasLockedBaseline(
  intern: Pick<InternshipIntern, "baselineLockedAt">,
  metrics: InternshipMetric[] = [],
) {
  if (intern.baselineLockedAt) return true;
  return metrics.some(
    (row) =>
      row.isVerified &&
      row.sourceNote.trim().toLowerCase() === INTERN_KPI_BASELINE_NOTE,
  );
}

export function hasKpiVerificationSource(input: {
  grants?: InternshipAccessGrant[];
  metrics?: InternshipMetric[];
}) {
  const grantActive = (input.grants || []).some(
    (row) =>
      row.toolKey === "verified_metrics" &&
      (row.grantStatus === "active" || row.granted),
  );
  const verifiedResult = (input.metrics || []).some(
    (row) =>
      row.isVerified &&
      row.sourceNote.trim().toLowerCase() !== INTERN_KPI_BASELINE_NOTE,
  );
  return grantActive || verifiedResult;
}

export function internSupervisorAttention(
  data: InternshipWorkspaceData,
): AttentionItem[] {
  const intern = data.intern;
  const href = `/admin/internship/interns/${intern.id}`;
  const items: AttentionItem[] = [];
  const verified = academicFieldsVerified(intern);
  const approvedGoal = (data.smartGoals || []).some(isGradingSmartGoal);
  const baselineLocked = Boolean(intern.baselineLockedAt);
  const baselineCaptured = hasLockedBaseline(intern, data.metrics);
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekKey = weekStart.toISOString().slice(0, 10);
  const weeklyThisWeek = (data.weeklyReviews || []).some((row) => row.weekOf >= weekKey);

  if (!verified) {
    items.push({
      id: `${intern.id}-requirements`,
      text: `${intern.fullName}: university requirements have not been verified.`,
      href: `/admin/internship/universities/${intern.universityId}`,
    });
  }
  if (!verified || intern.requiredHours == null) {
    items.push({
      id: `${intern.id}-hours`,
      text: `${intern.fullName}: required internship hours are pending.`,
      href,
    });
  }
  if (!approvedGoal) {
    items.push({
      id: `${intern.id}-smart`,
      text: `${intern.fullName}: no SMART targets have been approved.`,
      href,
    });
  }
  if (!baselineLocked) {
    items.push({
      id: `${intern.id}-baseline`,
      text: `${intern.fullName}: no baseline has been locked.`,
      href,
    });
  } else if (!baselineCaptured) {
    items.push({
      id: `${intern.id}-baseline-missing`,
      text: `${intern.fullName}: baseline lock is missing verified source counts.`,
      href,
    });
  }
  if (!weeklyThisWeek) {
    items.push({
      id: `${intern.id}-weekly`,
      text: `${intern.fullName}: weekly update is due.`,
      href,
    });
  }
  if (!hasKpiVerificationSource(data)) {
    items.push({
      id: `${intern.id}-kpi`,
      text: `${intern.fullName}: no KPI has been employer verified.`,
      href,
    });
  }
  if (!(data.scorecards || []).length) {
    items.push({
      id: `${intern.id}-eval`,
      text: `${intern.fullName}: employer evaluation has not been recorded.`,
      href,
    });
  }
  return items;
}

export function internReviewAttention(data: InternshipWorkspaceData): AttentionItem[] {
  const intern = data.intern;
  const items: AttentionItem[] = [];
  if (!academicFieldsVerified(intern)) {
    items.push({
      id: "requirements",
      text: "University requirements need verification",
      href: `/admin/internship/universities/${intern.universityId}`,
    });
  }
  if (!academicFieldsVerified(intern) || intern.requiredHours == null) {
    items.push({ id: "hours", text: "Required hours pending" });
  }
  if (!(data.smartGoals || []).some(isGradingSmartGoal)) {
    items.push({ id: "smart", text: "SMART goal not established" });
  }
  if (!intern.baselineLockedAt) {
    items.push({ id: "baseline", text: "Baseline not locked" });
  }
  if (
    !(data.weeklyReviews || []).some((row) => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      return row.weekOf >= weekStart.toISOString().slice(0, 10);
    })
  ) {
    items.push({ id: "weekly", text: "Weekly update due" });
  }
  if (!hasKpiVerificationSource(data)) {
    items.push({ id: "kpi-source", text: "No KPI verification source connected" });
  }
  return items;
}

export type RecruitingUniversity = Pick<
  InternshipUniversity,
  "id" | "slug" | "displayName" | "recruitingStatus" | "fundingStatus" | "nextAction"
>;

export function recruitingAttention(universities: RecruitingUniversity[]): AttentionItem[] {
  const items: AttentionItem[] = [];
  const posting = universities.filter((row) => row.recruitingStatus === "posting_submitted");
  for (const university of posting) {
    items.push({
      id: `posting-${university.id}`,
      text: `${university.displayName} posting awaiting approval.`,
      href: `/admin/internship/universities/${university.id}`,
    });
  }
  const awaiting = universities.filter((row) =>
    ["contacted", "awaiting_response"].includes(row.recruitingStatus || ""),
  );
  if (awaiting.length) {
    items.push({
      id: "outreach-pending",
      text: `${awaiting.length} university outreach ${
        awaiting.length === 1 ? "response" : "responses"
      } pending.`,
    });
  }
  const fundingPending = universities.filter((row) =>
    ["unknown", "research_needed", "not_yet_open"].includes(row.fundingStatus),
  );
  if (fundingPending.length) {
    items.push({
      id: "funding-pending",
      text: "Spring 2027 funding information pending.",
    });
  }
  return items;
}

export function accessGrantStatus(
  grant?: Pick<InternshipAccessGrant, "granted" | "grantStatus"> | null,
) {
  const status = grant?.grantStatus;
  if (status && (ACCESS_GRANT_STATUSES as readonly string[]).includes(status)) {
    return status;
  }
  if (grant?.granted) return "active";
  return "not_granted";
}

export function accessGrantStatusLabel(status: string) {
  const labels: Record<(typeof ACCESS_GRANT_STATUSES)[number], string> = {
    not_granted: "Not Granted",
    requested: "Requested",
    active: "Active",
    revoked: "Revoked",
  };
  return labels[status as (typeof ACCESS_GRANT_STATUSES)[number]] || status;
}

export function smartGoalStatusLabel(status: string) {
  const labels: Record<(typeof SMART_GOAL_STATUSES)[number], string> = {
    draft: "Draft",
    submitted: "Submitted",
    approved: "Supervisor Approved",
    locked: "Locked",
  };
  return labels[status as (typeof SMART_GOAL_STATUSES)[number]] || status;
}

export function recruitingStatusLabel(status: string) {
  const labels: Record<(typeof UNIVERSITY_RECRUITING_STATUSES)[number], string> = {
    not_started: "Not Started",
    researching: "Researching",
    contacted: "Contacted",
    awaiting_response: "Awaiting Response",
    posting_preparation: "Posting Preparation",
    posting_submitted: "Posting Submitted",
    posting_approved: "Posting Approved",
    recruiting_active: "Recruiting Active",
    applications_received: "Applications Received",
    candidate_selected: "Candidate Selected",
    closed: "Closed",
  };
  return labels[status as (typeof UNIVERSITY_RECRUITING_STATUSES)[number]] || status;
}

export function requirementsResearchLabel(status: string) {
  const labels: Record<(typeof UNIVERSITY_REQUIREMENTS_STATUSES)[number], string> = {
    not_researched: "Not Researched",
    researching: "Researching",
    partially_verified: "Partially Verified",
    verified: "Verified",
    needs_reverification: "Needs Reverification",
  };
  return labels[status as (typeof UNIVERSITY_REQUIREMENTS_STATUSES)[number]] || status;
}

export function relationshipStatusLabel(status: string) {
  const labels: Record<string, string> = {
    research_needed: "Research Needed",
    potential: "Potential",
    potential_partner: "Potential",
    contacted: "Contacted",
    requirements_identified: "Requirements Identified",
    internship_eligible: "Internship Eligible",
    academic_credit_confirmed: "Academic Credit Confirmed",
    formal_partner: "Formal Partner",
    active_partner: "Formal Partner",
    inactive: "Inactive",
  };
  if ((UNIVERSITY_STATUSES as readonly string[]).includes(status)) {
    return labels[status] || status;
  }
  return labels[status] || status;
}

export function formatShortDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function requiredHoursPending(
  interns: Array<Pick<InternshipIntern, "requiredHours" | "academicSnapshot">>,
) {
  if (!interns.length) return true;
  return interns.some(
    (row) => !academicFieldsVerified(row) || row.requiredHours == null,
  );
}

export function sumVerifiedRequiredHours(
  interns: Array<Pick<InternshipIntern, "requiredHours" | "academicSnapshot">>,
) {
  if (requiredHoursPending(interns)) return null;
  return interns.reduce((sum, row) => sum + (row.requiredHours || 0), 0);
}
