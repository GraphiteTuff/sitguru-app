import {
  CANONICAL_ROLE,
  normalizeRoleAlias,
  type CanonicalRole,
} from "@/lib/sitguru/display";

export type MessagingRole = CanonicalRole;

export type MessagingPairResult =
  | {
      ok: true;
      senderRole: MessagingRole;
      recipientRole: MessagingRole;
    }
  | {
      ok: false;
      error: string;
    };

const ALLOWED_PAIRS = new Set<string>([
  `${CANONICAL_ROLE.PET_PARENT}:${CANONICAL_ROLE.GURU}`,
  `${CANONICAL_ROLE.GURU}:${CANONICAL_ROLE.PET_PARENT}`,
  `${CANONICAL_ROLE.PET_PARENT}:${CANONICAL_ROLE.ADMIN}`,
  `${CANONICAL_ROLE.ADMIN}:${CANONICAL_ROLE.PET_PARENT}`,
  `${CANONICAL_ROLE.GURU}:${CANONICAL_ROLE.ADMIN}`,
  `${CANONICAL_ROLE.ADMIN}:${CANONICAL_ROLE.GURU}`,
  `${CANONICAL_ROLE.AMBASSADOR}:${CANONICAL_ROLE.ADMIN}`,
  `${CANONICAL_ROLE.ADMIN}:${CANONICAL_ROLE.AMBASSADOR}`,
  `${CANONICAL_ROLE.ADMIN}:${CANONICAL_ROLE.ADMIN}`,
]);

function pairKey(sender: MessagingRole, recipient: MessagingRole) {
  return `${sender}:${recipient}`;
}

export function toMessagingRole(role?: string | null): MessagingRole | null {
  const canonical = normalizeRoleAlias(role);
  if (canonical) return canonical;

  const value = String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, "_");

  if (!value || value === "user") return null;
  if (value === "customer" || value === "owner" || value === "client") {
    return CANONICAL_ROLE.PET_PARENT;
  }
  if (value === "provider" || value === "sitter" || value === "walker") {
    return CANONICAL_ROLE.GURU;
  }
  if (value.includes("admin") || value === "founder") return CANONICAL_ROLE.ADMIN;
  if (value.includes("ambassador") || value.includes("partner")) {
    return CANONICAL_ROLE.AMBASSADOR;
  }
  if (value.includes("guru")) return CANONICAL_ROLE.GURU;
  if (value.includes("parent") || value.includes("pet")) {
    return CANONICAL_ROLE.PET_PARENT;
  }

  return null;
}

export function collectMessagingRoles(
  roleValues: Array<string | null | undefined>,
): MessagingRole[] {
  const roles: MessagingRole[] = [];
  for (const value of roleValues) {
    const role = toMessagingRole(value);
    if (role && !roles.includes(role)) roles.push(role);
  }
  return roles;
}

export function canMessagingRolesConnect(
  senderRole: MessagingRole,
  recipientRole: MessagingRole,
) {
  return ALLOWED_PAIRS.has(pairKey(senderRole, recipientRole));
}

export function messagingPolicyError(
  senderRole: MessagingRole,
  recipientRole: MessagingRole,
) {
  if (
    senderRole === CANONICAL_ROLE.GURU &&
    recipientRole === CANONICAL_ROLE.GURU
  ) {
    return "Gurus can message Pet Parents and SitGuru Admin, not other Gurus.";
  }

  if (
    senderRole === CANONICAL_ROLE.PET_PARENT &&
    recipientRole === CANONICAL_ROLE.PET_PARENT
  ) {
    return "Pet Parents can message Gurus and SitGuru Admin.";
  }

  if (
    senderRole === CANONICAL_ROLE.AMBASSADOR &&
    recipientRole !== CANONICAL_ROLE.ADMIN
  ) {
    return "Ambassadors can message SitGuru Admin from this inbox.";
  }

  return "This SitGuru conversation is limited to matching roles, such as Guru ↔ Pet Parent or anyone ↔ Admin.";
}

export function resolveMessagingPair(params: {
  senderId: string;
  recipientId: string;
  senderRole?: string | null;
  recipientRole?: string | null;
  senderRoles?: MessagingRole[];
  recipientRoles?: MessagingRole[];
  conversation?: {
    customer_id?: string | null;
    guru_id?: string | null;
  } | null;
}): MessagingPairResult {
  const senderId = String(params.senderId || "").trim();
  const recipientId = String(params.recipientId || "").trim();

  if (!senderId || !recipientId) {
    return { ok: false, error: "SitGuru could not find both people for this thread." };
  }

  if (senderId === recipientId) {
    return { ok: false, error: "You cannot message yourself." };
  }

  const declaredSender = toMessagingRole(params.senderRole);
  const declaredRecipient = toMessagingRole(params.recipientRole);
  const senderRoles = params.senderRoles?.length
    ? params.senderRoles
    : declaredSender
      ? [declaredSender]
      : [];
  const recipientRoles = params.recipientRoles?.length
    ? params.recipientRoles
    : declaredRecipient
      ? [declaredRecipient]
      : [];

  let senderRole =
    declaredSender ||
    senderRoles[0] ||
    null;
  let recipientRole =
    declaredRecipient ||
    recipientRoles[0] ||
    null;

  if (senderRoles.includes(CANONICAL_ROLE.ADMIN)) senderRole = CANONICAL_ROLE.ADMIN;
  if (recipientRoles.includes(CANONICAL_ROLE.ADMIN)) {
    recipientRole = CANONICAL_ROLE.ADMIN;
  }

  const customerId = String(params.conversation?.customer_id || "").trim();
  const guruId = String(params.conversation?.guru_id || "").trim();

  if (customerId && guruId && customerId !== guruId) {
    if (senderId === guruId && recipientId === customerId) {
      senderRole = CANONICAL_ROLE.GURU;
      recipientRole = recipientRoles.includes(CANONICAL_ROLE.PET_PARENT)
        ? CANONICAL_ROLE.PET_PARENT
        : recipientRoles.includes(CANONICAL_ROLE.ADMIN)
          ? CANONICAL_ROLE.ADMIN
          : recipientRole;
    } else if (senderId === customerId && recipientId === guruId) {
      senderRole = senderRoles.includes(CANONICAL_ROLE.PET_PARENT)
        ? CANONICAL_ROLE.PET_PARENT
        : senderRole;
      recipientRole = CANONICAL_ROLE.GURU;
    }
  } else if (
    senderRoles.includes(CANONICAL_ROLE.GURU) &&
    recipientRoles.includes(CANONICAL_ROLE.PET_PARENT)
  ) {
    senderRole = CANONICAL_ROLE.GURU;
    recipientRole = CANONICAL_ROLE.PET_PARENT;
  } else if (
    senderRoles.includes(CANONICAL_ROLE.PET_PARENT) &&
    recipientRoles.includes(CANONICAL_ROLE.GURU)
  ) {
    senderRole = CANONICAL_ROLE.PET_PARENT;
    recipientRole = CANONICAL_ROLE.GURU;
  }

  if (!senderRole || !recipientRole) {
    return {
      ok: false,
      error: "SitGuru could not confirm the roles for this conversation.",
    };
  }

  if (
    senderRole === CANONICAL_ROLE.GURU &&
    recipientRole === CANONICAL_ROLE.GURU &&
    !recipientRoles.includes(CANONICAL_ROLE.PET_PARENT) &&
    !recipientRoles.includes(CANONICAL_ROLE.ADMIN)
  ) {
    return {
      ok: false,
      error: messagingPolicyError(senderRole, recipientRole),
    };
  }

  if (!canMessagingRolesConnect(senderRole, recipientRole)) {
    return {
      ok: false,
      error: messagingPolicyError(senderRole, recipientRole),
    };
  }

  return { ok: true, senderRole, recipientRole };
}
