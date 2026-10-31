import type { ManagerInternCard, ManagerQuestion, ManagerReviewItem } from "@/lib/internship/manager-dashboard";
import type { GrowthInitiative } from "@/lib/admin/growth/outcomes";
import type { MyTimeDashboard } from "@/lib/staff-time/types";

export type ManagerDeskMessage = {
  id: string;
  author: string;
  avatarUrl: string;
  preview: string;
  unread: boolean;
};

export type ManagerDeskTimeSnap = {
  weekLabel: string;
  periodLabel: string;
  hoursLabel: string;
  amountLabel: string;
  statusLabel: string;
  rangeLabel: string;
};

export type ManagerDeskExtras = {
  myTime: MyTimeDashboard | null;
  needsAttention: Array<{ label: string; href: string; count: number }>;
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
  extras: ManagerDeskExtras;
  myTimeSnap: ManagerDeskTimeSnap | null;
  viewingAs?: string | null;
  viewingUserId?: string | null;
};

export function buildManagerDeskReviewQueue(
  reviews: ManagerReviewItem[],
  questions: ManagerQuestion[],
) {
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
