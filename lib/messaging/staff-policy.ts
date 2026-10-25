export type ConversationType =
  | "marketplace"
  | "internal_direct"
  | "internal_group"
  | "leadership"
  | "community_direct"
  | "community_shared_inbox"
  | "record_thread"
  | "support"
  | "partner";

export type MessagingPermissionLevel =
  | "none"
  | "view"
  | "reply_assigned"
  | "initiate_approved"
  | "full";

export type ReviewLevel = "all" | "selected" | "independent";

export type StaffActor = "intern" | "growth" | "founder" | "community" | "other_admin" | "none";

const LEADERSHIP = new Set<ConversationType>(["leadership"]);
const INTERNAL = new Set<ConversationType>([
  "internal_direct",
  "internal_group",
  "leadership",
  "record_thread",
]);

export function canAccessConversation(input: {
  actor: StaffActor;
  actorId: string;
  type: ConversationType;
  participantIds: string[];
  assignedUserId?: string | null;
}) {
  if (input.actor === "none" || input.actor === "community") {
    return input.type === "marketplace" || input.type === "community_direct" || input.type === "support" || input.type === "partner"
      ? input.participantIds.includes(input.actorId)
      : false;
  }
  if (LEADERSHIP.has(input.type)) {
    return input.actor === "founder" || (input.actor === "growth" && input.participantIds.includes(input.actorId));
  }
  if (input.actor === "intern") {
    return input.participantIds.includes(input.actorId) || input.assignedUserId === input.actorId;
  }
  if (input.actor === "growth") {
    return !LEADERSHIP.has(input.type) || input.participantIds.includes(input.actorId);
  }
  if (input.actor === "founder") return true;
  return input.participantIds.includes(input.actorId) && !INTERNAL.has(input.type);
}

export function visibleMessage(input: {
  visibility: "participant" | "internal_note";
  actor: StaffActor;
}) {
  if (input.visibility !== "internal_note") return true;
  return input.actor === "founder" || input.actor === "growth" || input.actor === "intern";
}

export function canSend(input: {
  actor: StaffActor;
  level: MessagingPermissionLevel;
  initiating: boolean;
  assigned: boolean;
}) {
  if (input.actor === "founder" || input.actor === "growth") return { ok: true as const, draft: false };
  if (input.actor !== "intern") return { ok: false as const, error: "This conversation is not available." };
  if (input.level === "none" || input.level === "view") {
    return { ok: false as const, error: "You can view this conversation, not reply yet." };
  }
  if (input.level === "reply_assigned" && (input.initiating || !input.assigned)) {
    return { ok: false as const, error: "You can reply only to conversations assigned to you." };
  }
  return { ok: true as const, draft: false };
}

export function draftRequired(input: { actor: StaffActor; review: ReviewLevel }) {
  return input.actor === "intern" && input.review === "all";
}

export function approveDraft(input: { actor: StaffActor; rewritten: boolean; originalAuthorId: string; editorId: string }) {
  if (input.actor !== "growth" && input.actor !== "founder") {
    return { ok: false as const, error: "A manager approves this draft." };
  }
  return {
    ok: true as const,
    finalAuthorId: input.rewritten ? input.editorId : input.originalAuthorId,
    preservesOriginal: true,
  };
}

export function canModerate(actor: StaffActor) {
  return actor === "founder";
}

export function reportRoute(input: { reporter: StaffActor; targetIsManager: boolean }) {
  if (input.reporter === "intern" && input.targetIsManager) return "founder";
  return "moderation_queue";
}

export function scanSensitive(value: string) {
  const text = String(value || "");
  if (/(password\s*[:=]|api[_-]?key\s*[:=]|sk_live_|BEGIN PRIVATE KEY)/i.test(text)) {
    return { flag: true, message: "Potential sensitive information detected. Please remove account credentials before sending." };
  }
  if (/\b(?:\d[ -]*?){13,16}\b/.test(text)) {
    return { flag: true, message: "Potential payment card information detected. Remove it before sending." };
  }
  return { flag: false, message: "" };
}

export function editPreservesHistory() {
  return true;
}

export function softDeletePreservesAudit(input: { legalHold: boolean }) {
  if (input.legalHold) return { ok: false as const, error: "This conversation is preserved and cannot be removed." };
  return { ok: true as const, display: "Message removed", auditKept: true };
}

export function marketplacePairStillAllowed(sender: "parent" | "guru", recipient: "parent" | "guru") {
  return sender !== recipient;
}

export function officialIdentity(input: { name: string; actor: StaffActor }) {
  if (input.actor === "intern") {
    return { name: input.name, title: "SitGuru Community Growth Team", organization: "SitGuru" };
  }
  if (input.actor === "growth") {
    return { name: input.name, title: "Social Media & Community Growth Manager", organization: "SitGuru" };
  }
  return { name: input.name, title: "SitGuru", organization: "SitGuru" };
}
