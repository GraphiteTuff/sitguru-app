const SUPERVISOR_ROLES = new Set(["founder", "owner", "super_admin", "admin"]);
const MANAGER_ROLES = new Set(["social_community_manager", "marketing_admin"]);

export type InternshipActorKind = "supervisor" | "manager" | "intern" | "none";

export function normalizeInternshipRole(role: string | null | undefined) {
  return String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, "_");
}

export function internshipActorKind(input: {
  role?: string | null;
  isSuperUser?: boolean;
  isIntern?: boolean;
}): InternshipActorKind {
  if (input.isSuperUser) return "supervisor";
  const role = normalizeInternshipRole(input.role);
  if (SUPERVISOR_ROLES.has(role)) return "supervisor";
  if (MANAGER_ROLES.has(role)) return "manager";
  if (input.isIntern) return "intern";
  return "none";
}

export function canReadPrivateInternRecord(input: {
  actor: InternshipActorKind;
  actorUserId?: string | null;
  actorInternId?: string | null;
  targetInternId: string;
  managerUserId?: string | null;
}) {
  if (!input.targetInternId) return false;
  if (input.actor === "supervisor") return true;
  if (input.actor === "manager") {
    if (!input.managerUserId) return true;
    return input.managerUserId === input.actorUserId;
  }
  if (input.actor === "intern") return input.actorInternId === input.targetInternId;
  return false;
}

export function canReviewRoutineWork(actor: InternshipActorKind) {
  return actor === "manager" || actor === "supervisor";
}

export function canGiveCeoReview(actor: InternshipActorKind) {
  return actor === "supervisor";
}

export function canEditRequirements(actor: InternshipActorKind) {
  return actor === "supervisor";
}
