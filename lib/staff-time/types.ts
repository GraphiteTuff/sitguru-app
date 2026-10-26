import type { PaymentPeriodStatus, TimeEntryStatus } from "@/lib/staff-time/status";

export type StaffEngagement = {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  title: string;
  status: string;
  expectedWeeklyMinHours: number;
  expectedWeeklyMaxHours: number;
  paymentCadence: string;
  periodAnchorOn: string;
  currency: string;
  w9Status: string;
  employmentClassification: string;
  startOn: string | null;
  endOn: string | null;
  notes: string;
};

export type StaffCompensationRate = {
  id: string;
  engagementId: string;
  hourlyRateCents: number;
  effectiveOn: string;
  endedOn: string | null;
  notes: string;
};

export type StaffTimeEntry = {
  id: string;
  engagementId: string;
  userId: string;
  paymentPeriodId: string | null;
  workedOn: string;
  hours: number;
  categorySlug: string;
  description: string;
  growthInitiativeId: string | null;
  status: TimeEntryStatus | string;
  timerStartedAt: string | null;
  timerStoppedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StaffPaymentPeriod = {
  id: string;
  engagementId: string;
  periodStart: string;
  periodEnd: string;
  status: PaymentPeriodStatus | string;
  totalHours: number;
  amountCents: number;
  currency: string;
  submittedAt: string | null;
  approvedAt: string | null;
  readyAt: string | null;
  paidAt: string | null;
  needsCorrectionAt: string | null;
  correctionNote: string;
  updatedAt: string;
};

export type StaffPaymentRecord = {
  id: string;
  engagementId: string;
  paymentPeriodId: string;
  approvedHours: number;
  amountCents: number;
  currency: string;
  rateSummary: string;
  paymentMethod: string;
  provider: string;
  expenseCategory: string;
  initiatedOn: string | null;
  paidOn: string | null;
  externalReference: string;
  notes: string;
  status: string;
  createdAt: string;
};

export type WeeklyTimeSummary = {
  weekStart: string;
  weekEnd: string;
  hours: number;
  expectedMin: number;
  expectedMax: number;
  aboveExpected: boolean;
  rangeLabel: string;
};

export type MyTimeDashboard = {
  engagement: StaffEngagement;
  currentRateCents: number;
  currentRateLabel: string;
  week: WeeklyTimeSummary;
  period: StaffPaymentPeriod;
  periodLabel: string;
  entries: StaffTimeEntry[];
  estimatedPaymentLabel: string;
  payments: StaffPaymentRecord[];
  annualPaidCents: number;
  annualPaidLabel: string;
  w9StatusLabel: string;
};
