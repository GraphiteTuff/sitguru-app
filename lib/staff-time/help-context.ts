/**
 * Live Help personalization for Manager Time / Payments (req 91).
 * Returns authorized status strings only — never SSN/TIN/bank details.
 */

import { ensureStaffEngagement } from "@/lib/staff-time/engagement";
import { loadMyTimeDashboard } from "@/lib/staff-time/queries";
import { paymentStatusLabel } from "@/lib/staff-time/status";
import { formatHours } from "@/lib/staff-time/money";

export type StaffHelpContext = {
  kind: "manager_time";
  displayName: string;
  weekHoursLabel: string;
  periodLabel: string;
  paymentStatus: string;
  paymentStatusLabel: string;
  estimatedPaymentLabel: string;
  annualPaidLabel: string;
  w9StatusLabel: string;
  answers: Array<{ question: string; answer: string }>;
};

export async function loadStaffHelpContext(input: {
  userId: string;
  email?: string | null;
}): Promise<StaffHelpContext | null> {
  const eng = await ensureStaffEngagement({
    userId: input.userId,
    email: input.email,
    createIfMissing: false,
  });
  if (!eng) return null;

  const dash = await loadMyTimeDashboard(eng);
  const paymentStatusLabelText = paymentStatusLabel(dash.period.status);

  const answers = [
    {
      question: "Where is my payment?",
      answer:
        dash.period.status === "paid"
          ? `Your ${dash.periodLabel} payment of ${dash.estimatedPaymentLabel} is marked Paid.`
          : `Your ${dash.periodLabel} payment is currently ${paymentStatusLabelText}${
              dash.period.status === "ready_for_payment" ||
              dash.period.status === "approved"
                ? ` · ${dash.estimatedPaymentLabel}`
                : ""
            }.`,
    },
    {
      question: "How many hours this week?",
      answer: dash.week.aboveExpected
        ? `You have ${formatHours(dash.week.hours)} hours this week — Above Expected Range. Founder Review Recommended.`
        : `You have ${formatHours(dash.week.hours)} hours this week (expected ${dash.engagement.expectedWeeklyMinHours}–${dash.engagement.expectedWeeklyMaxHours}).`,
    },
    {
      question: "What is my current rate?",
      answer: `Your current rate is ${dash.currentRateLabel}. Historical periods keep the rate that applied on each work date.`,
    },
    {
      question: "W-9 status",
      answer: `W-9 status: ${dash.w9StatusLabel}. Contents are never shown in Help.`,
    },
  ];

  return {
    kind: "manager_time",
    displayName: eng.displayName,
    weekHoursLabel: `${formatHours(dash.week.hours)} hrs`,
    periodLabel: dash.periodLabel,
    paymentStatus: dash.period.status,
    paymentStatusLabel: paymentStatusLabelText,
    estimatedPaymentLabel: dash.estimatedPaymentLabel,
    annualPaidLabel: dash.annualPaidLabel,
    w9StatusLabel: dash.w9StatusLabel,
    answers,
  };
}
