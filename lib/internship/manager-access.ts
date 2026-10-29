const SUPERVISOR_ROLES = new Set(["founder", "owner", "super_admin", "admin"]);
const MANAGER_ROLES = new Set([
  "social_community_manager",
  "social_growth_manager",
  "growth_manager",
  "social_media_community_growth_manager",
  "marketing_admin",
  "intern_manager",
]);

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
    return Boolean(input.managerUserId) && input.managerUserId === input.actorUserId;
  }
  if (input.actor === "intern") return input.actorInternId === input.targetInternId;
  return false;
}

const PORTAL_USER_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MANAGER_DESK_STATUSES = new Set([
  "accepted",
  "active",
  "approved",
  "onboarding",
  "pending_university_approval",
  "candidate",
  "applicant",
  "completed",
]);

export function isPortalUserId(value: string | null | undefined) {
  return PORTAL_USER_ID.test(String(value || "").trim());
}

/** Founder and other Admin HQ roles can open every portal. A growth-only login cannot. */
export function canBrowseAllPortals(input: {
  actor: InternshipActorKind;
  canAccessAdmin?: boolean;
  growthOnly?: boolean;
}) {
  if (input.growthOnly) return false;
  if (input.actor === "manager" || input.actor === "intern") return false;
  return input.actor === "supervisor" || Boolean(input.canAccessAdmin);
}

export function canPreviewInternPortal(input: {
  actor: InternshipActorKind;
  canAccessAdmin?: boolean;
  growthOnly?: boolean;
  actorUserId?: string | null;
  actorInternId?: string | null;
  targetInternId: string;
  managerUserId?: string | null;
}) {
  if (!input.targetInternId) return false;
  if (canBrowseAllPortals(input)) return true;
  return canReadPrivateInternRecord(input);
}

export function staffPreviewUserId(input: {
  actor: InternshipActorKind;
  canAccessAdmin?: boolean;
  growthOnly?: boolean;
  actorUserId: string;
  requestedUserId?: string | null;
}) {
  const requested = String(input.requestedUserId || "").trim();
  if (!canBrowseAllPortals(input) || !isPortalUserId(requested)) return input.actorUserId;
  return requested;
}

export function internOnThisManagerDesk(input: {
  actorKind: Extract<InternshipActorKind, "manager" | "supervisor">;
  actorUserId: string;
  managerFilter?: string | null;
  intern: {
    id: string;
    isTest?: boolean;
    status: string;
    managerUserId?: string | null;
  };
}) {
  if (input.intern.isTest) return false;
  if (!MANAGER_DESK_STATUSES.has(input.intern.status)) return false;
  if (
    !canReadPrivateInternRecord({
      actor: input.actorKind,
      actorUserId: input.actorUserId,
      targetInternId: input.intern.id,
      managerUserId: input.intern.managerUserId,
    })
  ) {
    return false;
  }
  if (input.actorKind === "supervisor" && input.managerFilter) {
    return input.intern.managerUserId === input.managerFilter;
  }
  return true;
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
