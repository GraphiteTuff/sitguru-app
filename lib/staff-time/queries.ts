import { supabaseAdmin } from "@/lib/supabase/admin";
import { listCompensationRates } from "@/lib/staff-time/engagement";
import {
  mapEngagement,
  mapPaymentRecord,
  mapPeriod,
  mapTimeEntry,
} from "@/lib/staff-time/mappers";
import {
  formatUsdFromCents,
  formatHours,
} from "@/lib/staff-time/money";
import {
  paymentPeriodContaining,
  formatPeriodLabel,
  isoToday,
  weekBoundsContaining,
} from "@/lib/staff-time/periods";
import { calculatePeriodTotals, currentRate, weeklyHoursSummary } from "@/lib/staff-time/rates";
import { paymentStatusLabel } from "@/lib/staff-time/status";
import type {
  MyTimeDashboard,
  StaffEngagement,
  StaffPaymentPeriod,
  StaffPaymentRecord,
  StaffTimeEntry,
} from "@/lib/staff-time/types";

export async function ensurePaymentPeriod(
  engagement: StaffEngagement,
  onDate = isoToday(),
): Promise<StaffPaymentPeriod> {
  const range = paymentPeriodContaining(onDate, engagement.periodAnchorOn, engagement.paymentCadence);
  const { data: existing } = await supabaseAdmin
    .from("staff_payment_periods")
    .select("*")
    .eq("engagement_id", engagement.id)
    .eq("period_start", range.start)
    .eq("period_end", range.end)
    .maybeSingle();

  if (existing) return mapPeriod(existing as Record<string, unknown>);

  const { data: created, error } = await supabaseAdmin
    .from("staff_payment_periods")
    .insert({
      engagement_id: engagement.id,
      period_start: range.start,
      period_end: range.end,
      status: "draft",
      currency: engagement.currency,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .maybeSingle();

  if (error || !created) {
    throw new Error(error?.message || "Could not open payment period.");
  }
  return mapPeriod(created as Record<string, unknown>);
}

export async function listPeriodEntries(
  periodId: string,
): Promise<StaffTimeEntry[]> {
  const { data, error } = await supabaseAdmin
    .from("staff_time_entries")
    .select("*")
    .eq("payment_period_id", periodId)
    .order("worked_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("[staff-time] entries", error.message);
    return [];
  }
  return (data || []).map((row) => mapTimeEntry(row as Record<string, unknown>));
}

export async function listWeekEntries(
  engagementId: string,
  weekStart: string,
  weekEnd: string,
): Promise<StaffTimeEntry[]> {
  const { data, error } = await supabaseAdmin
    .from("staff_time_entries")
    .select("*")
    .eq("engagement_id", engagementId)
    .gte("worked_on", weekStart)
    .lte("worked_on", weekEnd)
    .order("worked_on", { ascending: false });
  if (error) {
    console.warn("[staff-time] week entries", error.message);
    return [];
  }
  return (data || []).map((row) => mapTimeEntry(row as Record<string, unknown>));
}

export async function recalculatePeriod(
  periodId: string,
): Promise<StaffPaymentPeriod | null> {
  const { data: periodRow } = await supabaseAdmin
    .from("staff_payment_periods")
    .select("*")
    .eq("id", periodId)
    .maybeSingle();
  if (!periodRow) return null;
  const period = mapPeriod(periodRow as Record<string, unknown>);
  const entries = await listPeriodEntries(periodId);
  const rates = await listCompensationRates(period.engagementId);
  const totals = calculatePeriodTotals(entries, rates);
  const { data: updated, error } = await supabaseAdmin
    .from("staff_payment_periods")
    .update({
      total_hours: totals.totalHours,
      amount_cents: totals.amountCents,
      updated_at: new Date().toISOString(),
    })
    .eq("id", periodId)
    .select("*")
    .maybeSingle();
  if (error || !updated) {
    console.warn("[staff-time] recalculate", error?.message);
    return period;
  }
  return mapPeriod(updated as Record<string, unknown>);
}

export async function listPaymentHistory(
  engagementId: string,
  limit = 24,
): Promise<StaffPaymentRecord[]> {
  const { data, error } = await supabaseAdmin
    .from("staff_payment_records")
    .select("*")
    .eq("engagement_id", engagementId)
    .order("paid_on", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) {
    console.warn("[staff-time] payment history", error.message);
    return [];
  }
  return (data || []).map((row) => mapPaymentRecord(row as Record<string, unknown>));
}

export async function annualPaidTotalCents(engagementId: string, year?: number) {
  const y = year || new Date().getFullYear();
  const start = `${y}-01-01`;
  const end = `${y}-12-31`;
  const { data, error } = await supabaseAdmin
    .from("staff_payment_records")
    .select("amount_cents,status,paid_on")
    .eq("engagement_id", engagementId)
    .eq("status", "paid")
    .gte("paid_on", start)
    .lte("paid_on", end);
  if (error) return 0;
  return (data || []).reduce(
    (sum, row) => sum + Math.round(Number(row.amount_cents) || 0),
    0,
  );
}

export async function loadMyTimeDashboard(
  engagement: StaffEngagement,
): Promise<MyTimeDashboard> {
  const today = isoToday();
  const week = weekBoundsContaining(today);
  const period = await ensurePaymentPeriod(engagement, today);
  const refreshed = (await recalculatePeriod(period.id)) || period;
  const [entries, weekEntries, rates, payments, annualPaidCents] =
    await Promise.all([
      listPeriodEntries(refreshed.id),
      listWeekEntries(engagement.id, week.start, week.end),
      listCompensationRates(engagement.id),
      listPaymentHistory(engagement.id),
      annualPaidTotalCents(engagement.id),
    ]);

  const rate = currentRate(rates, today);
  const weekSummary = weeklyHoursSummary(
    weekEntries,
    engagement.expectedWeeklyMinHours,
    engagement.expectedWeeklyMaxHours,
  );

  return {
    engagement,
    currentRateCents: rate?.hourlyRateCents || 0,
    currentRateLabel: rate
      ? `${formatUsdFromCents(rate.hourlyRateCents)}/hr`
      : "Rate not set",
    week: {
      weekStart: week.start,
      weekEnd: week.end,
      hours: weekSummary.hours,
      expectedMin: engagement.expectedWeeklyMinHours,
      expectedMax: engagement.expectedWeeklyMaxHours,
      aboveExpected: weekSummary.aboveExpected,
      rangeLabel: weekSummary.rangeLabel,
    },
    period: refreshed,
    periodLabel: formatPeriodLabel({
      start: refreshed.periodStart,
      end: refreshed.periodEnd,
    }),
    entries,
    estimatedPaymentLabel: formatUsdFromCents(refreshed.amountCents),
    payments,
    annualPaidCents,
    annualPaidLabel: formatUsdFromCents(annualPaidCents),
    w9StatusLabel:
      engagement.w9Status === "received"
        ? "Received"
        : engagement.w9Status === "requested"
          ? "Requested"
          : engagement.w9Status === "not_applicable"
            ? "Not applicable"
            : "Not on file",
  };
}

export type StaffPaymentQueueItem = {
  period: StaffPaymentPeriod;
  engagement: StaffEngagement;
  statusLabel: string;
  entries: StaffTimeEntry[];
};

const ATTENTION_STATUSES = [
  "submitted", "approved", "ready_for_payment", "processing", "needs_correction",
] as const;
const CONTRACTOR_STATUSES = [
  "draft", "submitted", "approved", "ready_for_payment", "processing",
  "needs_correction", "paid",
] as const;

/**
 * Use explicit engagement lookups instead of a nested PostgREST relationship.
 * A query failure must not masquerade as an empty approval inbox.
 */
async function queryPaymentPeriodQueue(
  statuses: readonly string[],
  limit = 100,
): Promise<StaffPaymentQueueItem[]> {
  const { data: rows, error } = await supabaseAdmin
    .from("staff_payment_periods")
    .select("*")
    .in("status", [...statuses])
    .order("period_end", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[staff-time] contractor period queue", error.message);
    throw new Error("Contractor periods could not be loaded. Check the database connection.");
  }

  const periods = (rows || []).map((row) => mapPeriod(row as Record<string, unknown>));
  if (!periods.length) return [];

  const engagementIds = [...new Set(periods.map((period) => period.engagementId))];
  const { data: engagementRows, error: engagementError } = await supabaseAdmin
    .from("staff_engagements")
    .select("*")
    .in("id", engagementIds);
  if (engagementError) {
    console.error("[staff-time] contractor engagement lookup", engagementError.message);
    throw new Error("Contractor identities could not be loaded.");
  }

  const engagementById = new Map(
    (engagementRows || []).map((row) => {
      const engagement = mapEngagement(row as Record<string, unknown>);
      return [engagement.id, engagement] as const;
    }),
  );

  const reviewIds = periods
    .filter((period) => ["draft", "submitted", "needs_correction"].includes(period.status))
    .map((period) => period.id);
  const entriesByPeriod = new Map<string, StaffTimeEntry[]>();
  if (reviewIds.length) {
    const { data: entryRows, error: entriesError } = await supabaseAdmin
      .from("staff_time_entries")
      .select("*")
      .in("payment_period_id", reviewIds)
      .order("worked_on", { ascending: true })
      .limit(2500);
    if (entriesError) {
      console.error("[staff-time] contractor entry lookup", entriesError.message);
      throw new Error("Contractor time-entry details could not be loaded.");
    }
    for (const row of entryRows || []) {
      const entry = mapTimeEntry(row as Record<string, unknown>);
      if (!entry.paymentPeriodId) continue;
      const group = entriesByPeriod.get(entry.paymentPeriodId) || [];
      group.push(entry);
      entriesByPeriod.set(entry.paymentPeriodId, group);
    }
  }

  return periods.map((period) => {
    const engagement = engagementById.get(period.engagementId);
    if (!engagement) {
      throw new Error(`Engagement missing for contractor period ${period.id}.`);
    }
    return {
      period,
      engagement,
      statusLabel: paymentStatusLabel(period.status),
      entries: entriesByPeriod.get(period.id) || [],
    };
  });
}

/** Admin attention counts and the unified HR approval desk. */
export async function listPeriodsNeedingAttention(): Promise<StaffPaymentQueueItem[]> {
  return queryPaymentPeriodQueue(ATTENTION_STATUSES);
}

/** Finance screens also show saved drafts and completed periods for reconciliation. */
export async function listContractorPeriods(): Promise<StaffPaymentQueueItem[]> {
  const items = await queryPaymentPeriodQueue(CONTRACTOR_STATUSES, 200);
  return items.filter((item) => item.engagement.employmentClassification === "contractor");
}

export async function listReadyForPaymentQueue() {
  const all = await listPeriodsNeedingAttention();
  return all.filter((item) =>
    ["approved", "ready_for_payment", "processing"].includes(item.period.status),
  );
}

export { formatHours, paymentStatusLabel };
