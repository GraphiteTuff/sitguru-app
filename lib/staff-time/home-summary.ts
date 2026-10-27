import { resolveManagerEngagement } from "@/lib/staff-time/engagement";
import { loadMyTimeDashboard } from "@/lib/staff-time/queries";
import { loadManagerDashboard } from "@/lib/internship/manager-data";
import { internshipActorKind } from "@/lib/internship/manager-access";
import { paymentStatusLabel } from "@/lib/staff-time/status";
import { formatHours } from "@/lib/staff-time/money";
import type { MyTimeDashboard } from "@/lib/staff-time/types";

export type ManagerHomeExtras = {
  myTime: MyTimeDashboard | null;
  needsAttention: Array<{ label: string; href: string; count: number }>;
};

export async function loadManagerHomeExtras(input: {
  userId: string;
  email?: string | null;
  role?: string | null;
  isSuperUser?: boolean;
  /** Manager Portal (`/manager`) or Admin Growth (`/admin/growth`). */
  basePath?: string;
}): Promise<ManagerHomeExtras> {
  const timeBase = input.basePath === "/manager" ? "/manager" : "/admin/growth";
  const engagement = await resolveManagerEngagement({
    userId: input.userId,
    email: input.email,
    role: input.role,
    isSuperUser: input.isSuperUser,
  });

  const myTime = engagement ? await loadMyTimeDashboard(engagement) : null;

  const kind = internshipActorKind({
    role: input.role,
    isSuperUser: input.isSuperUser,
  });

  const needsAttention: ManagerHomeExtras["needsAttention"] = [];

  if (kind === "manager" || kind === "supervisor") {
    try {
      const desk = await loadManagerDashboard({
        actorUserId: input.userId,
        actorKind: kind,
      });
      const reviews = desk.reviews?.length || 0;
      const questions = desk.questions?.length || 0;
      if (reviews) {
        needsAttention.push({
          label: "Intern reviews",
          href: "/intern/manage?tab=reviews",
          count: reviews,
        });
      }
      if (questions) {
        needsAttention.push({
          label: "Intern questions",
          href: "/intern/manage?tab=questions",
          count: questions,
        });
      }
    } catch (error) {
      console.warn("[manager-home] desk summary", error);
    }
  }

  if (myTime) {
    if (myTime.period.status === "needs_correction") {
      needsAttention.push({
        label: "Payment period needs correction",
        href: `${timeBase}/my-time`,
        count: 1,
      });
    }
    if (myTime.week.aboveExpected) {
      needsAttention.push({
        label: "Weekly hours above expected range",
        href: `${timeBase}/my-time`,
        count: 1,
      });
    }
  }

  return { myTime, needsAttention };
}

export function myTimeSnapshotLines(myTime: MyTimeDashboard) {
  return {
    weekLabel: `${formatHours(myTime.week.hours)} hrs this week`,
    periodLabel: myTime.periodLabel,
    hoursLabel: `${formatHours(myTime.period.totalHours)} hrs`,
    amountLabel: myTime.estimatedPaymentLabel,
    statusLabel: paymentStatusLabel(myTime.period.status),
    rangeLabel: myTime.week.rangeLabel,
  };
}
