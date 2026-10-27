import { getAdminIdentity } from "@/lib/admin/access";
import { listGrowthInitiatives } from "@/lib/admin/growth/outcomes";
import { internshipActorKind } from "@/lib/internship/manager-access";
import { loadManagerDashboard } from "@/lib/internship/manager-data";
import type { ManagerInternCard, ManagerQuestion, ManagerReviewItem } from "@/lib/internship/manager-dashboard";
import { loadStaffInbox } from "@/lib/messaging/staff-data";
import {
  loadManagerHomeExtras,
  myTimeSnapshotLines,
  type ManagerHomeExtras,
} from "@/lib/staff-time/home-summary";
import type { GrowthInitiative } from "@/lib/admin/growth/outcomes";

export type ManagerDeskMessage = {
  id: string;
  author: string;
  avatarUrl: string;
  preview: string;
  unread: boolean;
};

export type ManagerDeskBundle = {
  firstName: string;
  fullName: string;
  email: string;
  title: string;
  cards: ManagerInternCard[];
  reviews: ManagerReviewItem[];
  questions: ManagerQuestion[];
  initiatives: GrowthInitiative[];
  messages: ManagerDeskMessage[];
  extras: ManagerHomeExtras;
  myTimeSnap: ReturnType<typeof myTimeSnapshotLines> | null;
};

function reviewQueueBuckets(reviews: ManagerReviewItem[], questions: ManagerQuestion[]) {
  const weekly = reviews.filter((item) => item.targetType === "weekly");
  const hours = reviews.filter((item) => item.targetType === "hours");
  const assignments = reviews.filter(
    (item) => item.targetType === "task" || item.targetType === "content",
  );
  const openQuestions = questions.filter((item) => item.status === "open");
  return [
    {
      id: "weekly",
      label: "Weekly check-ins",
      count: weekly.length,
      href: "/intern/manage?tab=reviews",
      detail: weekly.length ? `${weekly.length} submission${weekly.length === 1 ? "" : "s"}` : "Clear",
    },
    {
      id: "hours",
      label: "Intern hours",
      count: hours.length,
      href: "/intern/manage?tab=reviews",
      detail: hours.length ? `${hours.length} set${hours.length === 1 ? "" : "s"}` : "Clear",
    },
    {
      id: "assignments",
      label: "Assignment feedback",
      count: assignments.length,
      href: "/intern/manage?tab=reviews",
      detail: assignments.length
        ? `${assignments.length} submission${assignments.length === 1 ? "" : "s"}`
        : "Clear",
    },
    {
      id: "questions",
      label: "Questions from interns",
      count: openQuestions.length,
      href: "/intern/manage?tab=more",
      detail: openQuestions.length ? `${openQuestions.length} open` : "Clear",
    },
  ] as const;
}

export function buildManagerDeskReviewQueue(
  reviews: ManagerReviewItem[],
  questions: ManagerQuestion[],
) {
  return reviewQueueBuckets(reviews, questions);
}

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
