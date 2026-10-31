import { canAdministerInternshipOnboarding } from "@/lib/internship/manager-access";

export const SPRING_2027_COHORT_NAME = "Spring 2027 Cohort";
export const SPRING_2027_MANAGER_EMAIL = "ava@sitguru.com";
export const SPRING_2027_SUPERVISOR_EMAIL = "jason@sitguru.com";

const ACTIVE_HANDOFF_STATUSES = new Set(["active", "approved", "accepted"]);

export function portalEnabledForInternStatus(status: string) {
  return ACTIVE_HANDOFF_STATUSES.has(String(status || "").toLowerCase());
}

export function roundInternshipHours(value: number) {
  return Math.round(value * 100) / 100;
}

export function planInternshipHours(input: {
  requestedCredits: number | null;
  hoursPerCredit: number | null;
  plannedWeeks: number | null;
  plannedTotalHours?: number | null;
}) {
  const fromCredits =
    input.requestedCredits != null && input.hoursPerCredit != null
      ? roundInternshipHours(input.requestedCredits * input.hoursPerCredit)
      : null;
  const plannedTotalHours = input.plannedTotalHours ?? fromCredits;
  const plannedWeeklyHours =
    plannedTotalHours != null && input.plannedWeeks
      ? roundInternshipHours(plannedTotalHours / input.plannedWeeks)
      : null;
  return {
    plannedTotalHours,
    plannedWeeklyHours,
    verifiedRequiredHours: null as number | null,
    verificationStatus: "pending" as const,
  };
}

export type ResolvedStaffSeat = {
  id: string;
  email: string;
  name: string;
};

export function assertSuperAdminOnboarding(input: {
  role?: string | null;
  isSuperUser?: boolean;
}) {
  if (canAdministerInternshipOnboarding(input)) return { ok: true as const };
  return {
    ok: false as const,
    error: "Only a Super Admin can change internship onboarding or manager assignment.",
  };
}

export function resolveStaffSeat(
  people: ResolvedStaffSeat[],
  email: string,
): ResolvedStaffSeat | null {
  const target = email.trim().toLowerCase();
  const matches = people.filter((person) => person.email.trim().toLowerCase() === target && person.id);
  if (matches.length !== 1) return null;
  return matches[0];
}

export function managerHandoffIsActive(input: {
  status: string;
  portalEnabled: boolean;
}) {
  return input.portalEnabled && ACTIVE_HANDOFF_STATUSES.has(input.status);
}

export function assignmentNoticeAllowed(input: {
  status: string;
  portalEnabled: boolean;
  managerChanged: boolean;
}) {
  return input.managerChanged && managerHandoffIsActive(input);
}

export function shouldSendOnce(alreadySent: boolean, allowed: boolean) {
  return allowed && !alreadySent;
}

export function activationReady(input: {
  hasIdentity: boolean;
  internshipApproved: boolean;
  universityVerified: boolean;
  onboardingComplete: boolean;
  managerUserId?: string | null;
  supervisorUserId?: string | null;
}) {
  if (!input.hasIdentity) return { ok: false as const, error: "Confirm the intern identity first." };
  if (!input.internshipApproved) return { ok: false as const, error: "Internship approval is still open." };
  if (!input.universityVerified) return { ok: false as const, error: "University approval is not verified." };
  if (!input.onboardingComplete) return { ok: false as const, error: "Required onboarding is not complete." };
  if (!input.managerUserId) return { ok: false as const, error: "Assign a manager before activation." };
  if (!input.supervisorUserId) return { ok: false as const, error: "Assign the official supervisor before activation." };
  return { ok: true as const };
}

export function reassignmentKeepsAcademicRecord() {
  return true;
}
