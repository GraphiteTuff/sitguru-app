import { getAdminIdentity } from "@/lib/admin/access";
import { resolveSuperUserManagerPreview } from "@/lib/admin/growth/super-user-portals";
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

export async function loadManagerDeskBundle(
  previewUserId?: string | null,
): Promise<ManagerDeskBundle | null> {
  const actor = await getAdminIdentity();
  if (!actor) return null;

  const preview = actor.isSuperUser
    ? await resolveSuperUserManagerPreview(previewUserId)
    : null;
  const kind = preview
    ? "manager"
    : internshipActorKind({
        role: actor.role,
        isSuperUser: actor.isSuperUser,
      });
  const actorKind = kind === "supervisor" || kind === "manager" ? kind : "manager";
  const subjectId = preview?.id || actor.id;
  const subjectEmail = preview?.email || actor.email;

  const [desk, extras, initiatives, inbox] = await Promise.all([
    loadManagerDashboard({
      actorUserId: subjectId,
      actorKind,
      managerUserId: preview ? subjectId : null,
    }),
    loadManagerHomeExtras({
      userId: subjectId,
      email: subjectEmail,
      role: preview ? "social_community_manager" : actor.role,
      isSuperUser: preview ? false : actor.isSuperUser,
      basePath: "/manager",
    }),
    listGrowthInitiatives(6),
    loadStaffInbox(subjectId, Boolean(!preview && (actor.isSuperUser || kind === "supervisor"))),
  ]);

  const rawFirst =
    preview?.name.split(/\s+/)[0] ||
    inbox.me.firstName ||
    String(subjectEmail || "")
      .split("@")[0]
      ?.split(".")[0] ||
    "there";
  const firstName = rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1);

  return {
    firstName,
    fullName: preview?.name || firstName,
    email: subjectEmail,
    title: "Social Media & Community Growth Manager",
    viewingAs: preview?.name || null,
    viewingUserId: preview?.id || null,
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
