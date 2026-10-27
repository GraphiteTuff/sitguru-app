import { getAdminIdentity } from "@/lib/admin/access";
import { listGrowthInitiatives } from "@/lib/admin/growth/outcomes";
import {
  buildManagerDeskReviewQueue,
  type ManagerDeskBundle,
} from "@/lib/admin/growth/manager-desk-model";
import { internshipActorKind } from "@/lib/internship/manager-access";
import { loadManagerDashboard } from "@/lib/internship/manager-data";
import { loadStaffInbox } from "@/lib/messaging/staff-data";
import {
  loadManagerHomeExtras,
  myTimeSnapshotLines,
} from "@/lib/staff-time/home-summary";

export type { ManagerDeskBundle, ManagerDeskMessage } from "@/lib/admin/growth/manager-desk-model";
export { buildManagerDeskReviewQueue } from "@/lib/admin/growth/manager-desk-model";

export async function loadManagerDeskBundle(): Promise<ManagerDeskBundle | null> {
  const actor = await getAdminIdentity();
  if (!actor) return null;

  const kind = internshipActorKind({
    role: actor.role,
    isSuperUser: actor.isSuperUser,
  });
  const actorKind = kind === "supervisor" || kind === "manager" ? kind : "manager";

  const [desk, extras, initiatives, inbox] = await Promise.all([
    loadManagerDashboard({
      actorUserId: actor.id,
      actorKind,
    }),
    loadManagerHomeExtras({
      userId: actor.id,
      email: actor.email,
      role: actor.role,
      isSuperUser: actor.isSuperUser,
      basePath: "/manager",
    }),
    listGrowthInitiatives(6),
    loadStaffInbox(actor.id, Boolean(actor.isSuperUser || kind === "supervisor")),
  ]);

  const rawFirst =
    inbox.me.firstName ||
    String(actor.email || "")
      .split("@")[0]
      ?.split(".")[0] ||
    "there";
  const firstName = rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1);

  return {
    firstName,
    fullName: firstName,
    email: actor.email,
    title: "Social Media & Community Growth Manager",
    cards: desk.cards,
    reviews: desk.reviews,
    questions: desk.questions,
    initiatives,
    messages: inbox.conversations.slice(0, 4).map((conversation) => ({
      id: conversation.id,
      author: conversation.subject,
      avatarUrl: conversation.messages[conversation.messages.length - 1]?.avatarUrl || "",
      preview: conversation.preview || conversation.fullSubject,
      unread: conversation.statusLabel !== "resolved",
    })),
    extras,
    myTimeSnap: extras.myTime ? myTimeSnapshotLines(extras.myTime) : null,
  };
}

// keep helper re-export used by home UI
void buildManagerDeskReviewQueue;
