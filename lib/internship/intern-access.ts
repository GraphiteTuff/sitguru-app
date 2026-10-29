/** Spring 2027 intern access. SitGuru account stays the same person. */

export const INTERN_ACCESS_ROLE = "social_media_community_growth_intern";
export const INTERN_ACCESS_ROLE_LABEL = "Social Media & Community Growth Intern";

export const INTERN_ACCESS_STATUSES = [
  "pending_ceo_review",
  "pending_university_approval",
  "approved",
  "active",
  "denied",
  "completed",
] as const;

export type InternAccessStatus = (typeof INTERN_ACCESS_STATUSES)[number];

export const INTERN_ACCESS_STATUS_LABELS: Record<InternAccessStatus, string> = {
  pending_ceo_review: "Pending CEO Review",
  pending_university_approval: "Pending University Approval",
  approved: "Approved",
  active: "Active",
  denied: "Denied",
  completed: "Completed",
};

/** Default Spring 2027 seats, resolved from existing SitGuru profiles at approval time. */
export const SPRING_2027_INTERN_MANAGER_EMAIL = "ava@sitguru.com";
export const SPRING_2027_INTERN_SUPERVISOR_EMAIL = "jason@sitguru.com";

export function internAccessLabel(status: string) {
  return INTERN_ACCESS_STATUS_LABELS[status as InternAccessStatus] || "Pending CEO Review";
}

export function canRequestInternAccess(status: string | null) {
  return !status || status === "denied" || status === "completed";
}

export function nextInternAccessStatus(input: {
  status: string;
  action: "ceo_approve" | "verify_university" | "deny" | "complete" | "revoke" | "activate";
}) {
  const status = input.status;
  if (input.action === "deny" || input.action === "revoke") {
    if (status === "completed") return { ok: false as const, error: "A completed internship is already closed." };
    return { ok: true as const, status: "denied" as const, portalEnabled: false };
  }
  if (input.action === "complete") {
    if (status !== "active" && status !== "approved") {
      return { ok: false as const, error: "Only an approved internship can be completed." };
    }
    return { ok: true as const, status: "completed" as const, portalEnabled: true };
  }
  if (input.action === "ceo_approve") {
    if (status !== "pending_ceo_review") {
      return { ok: false as const, error: "This request is not waiting on CEO review." };
    }
    return { ok: true as const, status: "pending_university_approval" as const, portalEnabled: false };
  }
  if (input.action === "verify_university") {
    if (status !== "pending_university_approval") {
      return { ok: false as const, error: "CEO approval is required before university verification." };
    }
    return { ok: true as const, status: "approved" as const, portalEnabled: true };
  }
  if (input.action === "activate") {
    if (status !== "approved") {
      return { ok: false as const, error: "Onboarding can activate only an approved request." };
    }
    return { ok: true as const, status: "active" as const, portalEnabled: true };
  }
  return { ok: false as const, error: "That action is not available." };
}

export function internAccessGrantsStaffAdmin() {
  return false;
}
