import {
  isFounderPersonalMarketplaceEmail,
  isHardcodedSuperUserEmail,
} from "@/lib/admin/super-users";
import { lifecycleLabel } from "@/lib/internship/assignment";
import { portalEnabledForInternStatus } from "@/lib/internship/onboarding-authority";
import {
  SPRING_2027_CANDIDATE_PLANS,
  type Spring2027CandidatePlan,
} from "@/lib/internship/spring2027-candidates";

export type RosterInternRecord = {
  id: string;
  fullName: string;
  preferredName?: string;
  email: string;
  userId: string | null;
  status: string;
  portalEnabled: boolean;
  universityName: string;
  credits: number | null;
  requestedCredits: number | null;
  plannedTotalHours: number | null;
  plannedWeeklyHours: number | null;
  internshipWeeks: number | null;
};

/** Candidate identity hints. Do not pass the staff directory. */
export type RosterAccountHint = {
  userId: string;
  email: string;
  fullName: string;
};

export type WorkspaceAction = "none" | "preview" | "active";

export type SpringRosterEntry = {
  key: Spring2027CandidatePlan["key"];
  fullName: string;
  universityLabel: string;
  creditLabel: string;
  hoursLabel: string;
  weeklyLabel: string;
  weeksLabel: string;
  statusLabel: string;
  accountLabel: string;
  emailLabel: string;
  recordId: string | null;
  workspaceAction: WorkspaceAction;
  canCreatePendingRecord: boolean;
};

export type LegacyInternshipReview = {
  id: string;
  fullName: string;
  email: string;
  universityName: string;
  status: string;
  portalEnabled: boolean;
  recommendation: string;
};

export type StaffSeat = {
  id: string;
  name: string;
  email: string;
};

export function optionalStoredNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function displayUniversityName(name: string) {
  const trimmed = name.trim();
  if (/^penn state university$/i.test(trimmed)) return "Penn State";
  return trimmed || "University pending";
}

export function isLegacyInternshipSeat(input: {
  email?: string | null;
  universityName?: string | null;
  isTest?: boolean;
}) {
  if (input.isTest) return true;
  if (isFounderPersonalMarketplaceEmail(input.email)) return true;
  return /^university test$/i.test(String(input.universityName || "").trim());
}

export function excludeFromInternPortalList(intern: {
  email?: string | null;
  isTest?: boolean;
}) {
  return isLegacyInternshipSeat(intern);
}

export function internPortalActionLabel(intern: {
  portalEnabled: boolean;
  status: string;
}) {
  return intern.portalEnabled && portalEnabledForInternStatus(intern.status)
    ? "Open Active Portal"
    : "Preview Intern Workspace";
}

function norm(value: string | null | undefined) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function formatAmount(value: number) {
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
}

function usableAccount(account: RosterAccountHint) {
  if (!account.userId) return false;
  if (isFounderPersonalMarketplaceEmail(account.email)) return false;
  if (isHardcodedSuperUserEmail(account.email)) return false;
  return true;
}

function recordsForPlan(plan: Spring2027CandidatePlan, interns: RosterInternRecord[]) {
  const eligible = interns.filter((row) => !isLegacyInternshipSeat(row));
  const email = String(plan.contactEmail || "").toLowerCase();
  if (email) {
    const byEmail = eligible.filter((row) => row.email.toLowerCase() === email);
    if (byEmail.length) return byEmail;
  }
  const name = norm(plan.fullName);
  return eligible.filter((row) => norm(row.fullName) === name);
}

function accountFor(
  plan: Spring2027CandidatePlan,
  record: RosterInternRecord | null,
  accounts: RosterAccountHint[],
) {
  const emails = new Set(
    [record?.email, plan.contactEmail]
      .map((value) => String(value || "").toLowerCase())
      .filter((value) => value.includes("@")),
  );
  const names = new Set(
    [plan.fullName, record?.fullName].map((value) => norm(value)).filter(Boolean),
  );
  return (
    accounts.find((account) => {
      if (!usableAccount(account)) return false;
      const email = account.email.toLowerCase();
      if (email && emails.has(email)) return true;
      return Boolean(account.fullName) && names.has(norm(account.fullName));
    }) || null
  );
}

export function rosterStatusLabel(status: string) {
  if (status === "prospective") return "Prospective / pending confirmation";
  if (status === "pending_university_approval" || status === "candidate" || status === "applicant") {
    return "University approval pending";
  }
  if (status === "onboarding") return "Onboarding";
  if (status === "approved" || status === "accepted") return "Approved";
  if (status === "active") return "Active";
  if (status === "completed") return "Completed";
  return lifecycleLabel(status);
}

function creditLabel(plan: Spring2027CandidatePlan, record: RosterInternRecord | null, status: string) {
  const requested = record ? record.requestedCredits : plan.requestedCredits;
  const credits = record ? record.credits : plan.requestedCredits;
  if (status === "prospective") {
    const value = requested ?? plan.requestedCredits;
    return value == null ? "Credits pending" : `${formatAmount(value)} requested credits`;
  }
  if (requested == null && credits == null) return "Credits pending";
  const value = credits ?? requested ?? plan.requestedCredits;
  return value == null ? "Credits pending" : `${formatAmount(value)} planned credits`;
}

function hoursLabel(
  plan: Spring2027CandidatePlan,
  record: RosterInternRecord | null,
  status: string,
) {
  const hours = record?.plannedTotalHours ?? plan.plannedTotalHours;
  if (status === "prospective") return `${formatAmount(hours)} provisional planned hours`;
  const requested = record ? record.requestedCredits : plan.requestedCredits;
  const credits = record ? record.credits : plan.requestedCredits;
  if (requested == null && credits == null) return `${formatAmount(hours)} proposed hours`;
  return `${formatAmount(hours)} planned hours`;
}

function accountLabel(input: {
  record: RosterInternRecord | null;
  account: RosterAccountHint | null;
  ambiguous: boolean;
}) {
  if (input.ambiguous) return "Multiple records";
  if (!input.record && input.account) return "Account found · record missing";
  if (!input.record) return "Record Missing";
  if (input.record.userId) return "Account linked";
  if (input.account) return "Account found, not linked";
  return "Needs Registration";
}

function workspaceAction(record: RosterInternRecord | null, ambiguous: boolean): WorkspaceAction {
  if (!record || ambiguous || isLegacyInternshipSeat(record)) return "none";
  if (record.portalEnabled && portalEnabledForInternStatus(record.status)) return "active";
  return "preview";
}

export function buildSpringRoster(input: {
  interns: RosterInternRecord[];
  accounts?: RosterAccountHint[];
}): SpringRosterEntry[] {
  const accounts = input.accounts || [];
  return SPRING_2027_CANDIDATE_PLANS.map((plan) => {
    const matches = recordsForPlan(plan, input.interns);
    const ambiguous = matches.length > 1;
    const record = matches.length === 1 ? matches[0] : null;
    const account = accountFor(plan, record, accounts);
    const status = record?.status || plan.status;
    const weeks = record?.internshipWeeks ?? plan.plannedWeeks;
    const weekly = record?.plannedWeeklyHours ?? plan.plannedWeeklyHours;
    const email = record?.email || plan.contactEmail || "";
    return {
      key: plan.key,
      fullName: plan.fullName,
      universityLabel: displayUniversityName(record?.universityName || plan.universityName),
      creditLabel: creditLabel(plan, record, status),
      hoursLabel: hoursLabel(plan, record, status),
      weeklyLabel: `${formatAmount(weekly)} planned hours/week`,
      weeksLabel: `${formatAmount(weeks)} planned weeks`,
      statusLabel: rosterStatusLabel(status),
      accountLabel: accountLabel({ record, account, ambiguous }),
      emailLabel: email || "No contact email on file",
      recordId: record?.id || null,
      workspaceAction: workspaceAction(record, ambiguous),
      canCreatePendingRecord: plan.key === "ryan" && !record && !ambiguous,
    };
  });
}

export function legacyInternshipReviews(interns: RosterInternRecord[]): LegacyInternshipReview[] {
  const matched = new Set(
    buildSpringRoster({ interns })
      .map((entry) => entry.recordId)
      .filter((id): id is string => Boolean(id)),
  );
  return interns
    .filter((row) => !matched.has(row.id) && isLegacyInternshipSeat(row))
    .map((row) => ({
      id: row.id,
      fullName: row.fullName,
      email: row.email,
      universityName: row.universityName || "University not set",
      status: row.status,
      portalEnabled: row.portalEnabled,
      recommendation: legacyCleanupRecommendation(row),
    }));
}

export function legacyCleanupRecommendation(row: {
  fullName: string;
  email: string;
  universityName: string;
  status: string;
  portalEnabled: boolean;
}) {
  const portal = row.portalEnabled ? "portal enabled" : "portal off";
  if (isFounderPersonalMarketplaceEmail(row.email)) {
    return `${row.fullName} has an internship row for ${row.email} at ${row.universityName || "University Test"} (${row.status}, ${portal}). That email is the founder personal marketplace login, separate from the jason@sitguru.com Admin account. Recommended cleanup: archive this test row after review. Do not delete it, and do not change Admin permissions.`;
  }
  return `${row.fullName} (${row.email}) is an internship row at ${row.universityName || "an unnamed school"} (${row.status}, ${portal}) and is not a Spring 2027 candidate. Review it before treating it as an intern portal. Do not delete it from this screen.`;
}

export function describeManagerAccess(input: {
  email: string;
  userId: string | null;
  accessActive: boolean;
  canManageInterns: boolean | null;
}) {
  if (!input.userId) {
    return {
      label: "Account missing",
      detail: `No login is stored for ${input.email}.`,
    };
  }
  if (!input.accessActive) {
    return {
      label: "Access inactive",
      detail: "The Growth manager access record is not active.",
    };
  }
  if (input.canManageInterns == null) {
    return {
      label: "Login active",
      detail: "The login is active. Intern desk permission could not be read.",
    };
  }
  if (!input.canManageInterns) {
    return {
      label: "Login active",
      detail: "The login exists. Intern desk permission is off.",
    };
  }
  return {
    label: "Manager access active",
    detail: "This login can open the Manager Portal, and intern desk permission is on. Stored roles were not changed.",
  };
}

export function mergeStaffOnce(managers: StaffSeat[], growth: StaffSeat[]) {
  const byId = new Map<string, StaffSeat & { managerDesk: boolean; growthAccess: boolean }>();
  for (const person of managers) {
    if (!person.id) continue;
    byId.set(person.id, { ...person, managerDesk: true, growthAccess: false });
  }
  for (const person of growth) {
    if (!person.id) continue;
    const existing = byId.get(person.id);
    if (existing) {
      existing.growthAccess = true;
      if (!existing.name) existing.name = person.name;
      if (!existing.email) existing.email = person.email;
      continue;
    }
    byId.set(person.id, { ...person, managerDesk: false, growthAccess: true });
  }
  return [...byId.values()];
}
