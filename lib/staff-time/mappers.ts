import type {
  StaffCompensationRate,
  StaffEngagement,
  StaffPaymentPeriod,
  StaffPaymentRecord,
  StaffTimeEntry,
} from "@/lib/staff-time/types";

function text(value: unknown) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function num(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function mapEngagement(row: Record<string, unknown>): StaffEngagement {
  return {
    id: text(row.id),
    userId: text(row.user_id),
    email: text(row.email),
    displayName: text(row.display_name),
    title: text(row.title),
    status: text(row.status) || "active",
    expectedWeeklyMinHours: num(row.expected_weekly_min_hours, 10),
    expectedWeeklyMaxHours: num(row.expected_weekly_max_hours, 15),
    paymentCadence: text(row.payment_cadence) || "biweekly",
    periodAnchorOn: text(row.period_anchor_on) || "2025-11-02",
    currency: text(row.currency) || "USD",
    w9Status: text(row.w9_status) || "not_requested",
    employmentClassification: text(row.employment_classification) || "contractor",
    startOn: text(row.start_on) || null,
    endOn: text(row.end_on) || null,
    notes: text(row.notes),
  };
}

export function mapRate(row: Record<string, unknown>): StaffCompensationRate {
  return {
    id: text(row.id),
    engagementId: text(row.engagement_id),
    hourlyRateCents: Math.round(num(row.hourly_rate_cents)),
    effectiveOn: text(row.effective_on),
    endedOn: text(row.ended_on) || null,
    notes: text(row.notes),
  };
}

export function mapTimeEntry(row: Record<string, unknown>): StaffTimeEntry {
  return {
    id: text(row.id),
    engagementId: text(row.engagement_id),
    userId: text(row.user_id),
    paymentPeriodId: text(row.payment_period_id) || null,
    workedOn: text(row.worked_on),
    hours: num(row.hours),
    categorySlug: text(row.category_slug) || "other_approved",
    description: text(row.description),
    growthInitiativeId: text(row.growth_initiative_id) || null,
    status: text(row.status) || "draft",
    timerStartedAt: text(row.timer_started_at) || null,
    timerStoppedAt: text(row.timer_stopped_at) || null,
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at),
  };
}

export function mapPeriod(row: Record<string, unknown>): StaffPaymentPeriod {
  return {
    id: text(row.id),
    engagementId: text(row.engagement_id),
    periodStart: text(row.period_start),
    periodEnd: text(row.period_end),
    status: text(row.status) || "draft",
    totalHours: num(row.total_hours),
    amountCents: Math.round(num(row.amount_cents)),
    currency: text(row.currency) || "USD",
    submittedAt: text(row.submitted_at) || null,
    approvedAt: text(row.approved_at) || null,
    readyAt: text(row.ready_at) || null,
    paidAt: text(row.paid_at) || null,
    needsCorrectionAt: text(row.needs_correction_at) || null,
    correctionNote: text(row.correction_note),
    updatedAt: text(row.updated_at),
  };
}

export function mapPaymentRecord(row: Record<string, unknown>): StaffPaymentRecord {
  return {
    id: text(row.id),
    engagementId: text(row.engagement_id),
    paymentPeriodId: text(row.payment_period_id),
    approvedHours: num(row.approved_hours),
    amountCents: Math.round(num(row.amount_cents)),
    currency: text(row.currency) || "USD",
    rateSummary: text(row.rate_summary),
    paymentMethod: text(row.payment_method) || "manual_bank_ach",
    provider: text(row.provider),
    expenseCategory: text(row.expense_category) || "Contract Labor",
    initiatedOn: text(row.initiated_on) || null,
    paidOn: text(row.paid_on) || null,
    externalReference: text(row.external_reference),
    notes: text(row.notes),
    status: text(row.status) || "paid",
    createdAt: text(row.created_at),
  };
}
