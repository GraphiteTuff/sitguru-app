import { internshipWeekNumber } from "@/lib/internship/process";
import { normalizeInternshipRole } from "@/lib/internship/manager-access";

export const INTERNSHIP_LIFECYCLE = [
  "candidate",
  "pending_university_approval",
  "approved",
  "onboarding",
  "active",
  "completed",
  "archived",
] as const;

export const LEGACY_INTERN_STATUSES = ["applicant", "accepted", "withdrawn"] as const;

export const UNIVERSITY_APPROVAL_STATUSES = [
  "pending",
  "approved",
  "confirmed",
  "needs_information",
  "declined",
  "not_required",
] as const;

export const INTERN_MANAGER_ROLES = [
  "intern_manager",
  "social_community_manager",
  "marketing_admin",
  "founder",
  "owner",
  "super_admin",
  "admin",
] as const;

const CLOSED_ASSIGNMENTS = new Set(["archived", "withdrawn", "completed", "declined"]);

export function internshipClockRunning(status: string | null | undefined) {
  return String(status || "").toLowerCase() === "active";
}

export function focusedInternshipWeek(input: {
  status?: string | null;
  startDate?: string | null;
  today?: Date;
  weekZeroReady?: boolean;
}) {
  const week = internshipWeekNumber(input.startDate, input.today || new Date(), input.status);
  if (input.weekZeroReady === false) return 0;
  return week;
}

export function managerDeskIncludes(status: string | null | undefined) {
  return !CLOSED_ASSIGNMENTS.has(String(status || "").toLowerCase()) || String(status || "") === "completed";
}

export function isEligibleInternshipManagerRole(role: string | null | undefined) {
  return INTERN_MANAGER_ROLES.includes(
    normalizeInternshipRole(role) as (typeof INTERN_MANAGER_ROLES)[number],
  );
}

export function portalVisibleStatus(status: string | null | undefined) {
  const value = String(status || "").toLowerCase();
  return ![
    "archived",
    "withdrawn",
    "declined",
  ].includes(value);
}

export type AssignmentIdentity = {
  id: string;
  email: string;
  userId?: string | null;
  cohortId: string;
  status: string;
};

export function findDuplicateAssignment(
  existing: AssignmentIdentity[],
  candidate: {
    email: string;
    userId?: string | null;
    cohortId: string;
    ignoreId?: string | null;
  },
) {
  const email = candidate.email.trim().toLowerCase();
  return (
    existing.find((row) => {
      if (candidate.ignoreId && row.id === candidate.ignoreId) return false;
      if (CLOSED_ASSIGNMENTS.has(row.status)) return false;
      if (row.cohortId !== candidate.cohortId) return false;
      if (candidate.userId && row.userId && row.userId === candidate.userId) return true;
      return row.email.trim().toLowerCase() === email;
    }) || null
  );
}

export function assignmentChangeSummary(input: {
  oldManagerName?: string;
  newManagerName?: string;
  oldSupervisorName?: string;
  newSupervisorName?: string;
}) {
  const parts: string[] = [];
  if ((input.oldManagerName || "") !== (input.newManagerName || "")) {
    parts.push(
      `Manager changed from ${input.oldManagerName || "unassigned"} to ${input.newManagerName || "unassigned"}`,
    );
  }
  if ((input.oldSupervisorName || "") !== (input.newSupervisorName || "")) {
    parts.push(
      `Supervisor changed from ${input.oldSupervisorName || "unassigned"} to ${input.newSupervisorName || "unassigned"}`,
    );
  }
  return parts.join(". ");
}

export function lifecycleLabel(status: string) {
  const map: Record<string, string> = {
    applicant: "Candidate",
    candidate: "Candidate",
    pending_university_approval: "Pending university approval",
    accepted: "Approved",
    approved: "Approved",
    onboarding: "Onboarding",
    active: "Active",
    completed: "Completed",
    withdrawn: "Archived",
    archived: "Archived",
    declined: "Declined",
  };
  return map[status] || status.replaceAll("_", " ");
}

export function universityApprovalLabel(status: string) {
  const map: Record<string, string> = {
    pending: "Pending",
    approved: "Approved",
    confirmed: "Approved",
    needs_information: "Needs information",
    declined: "Declined",
    not_required: "Not required",
  };
  return map[status] || "Pending";
}

export function staffRoleLabel(role: string | null | undefined) {
  const value = normalizeInternshipRole(role);
  if (value === "social_community_manager" || value === "marketing_admin" || value === "intern_manager") {
    return "Intern manager";
  }
  if (value === "founder" || value === "owner" || value === "super_admin") return "Formal supervisor";
  if (value === "admin") return "SitGuru admin";
  return "SitGuru staff";
}
