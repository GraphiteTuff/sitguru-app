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
  biweeklyPeriodContaining,
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
  const range = biweeklyPeriodContaining(onDate, engagement.periodAnchorOn);
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

export async function listPeriodsNeedingAttention(): Promise<
  Array<{
    period: StaffPaymentPeriod;
    engagement: StaffEngagement;
    statusLabel: string;
  }>
> {
  const { data, error } = await supabaseAdmin
    .from("staff_payment_periods")
    .select("*, staff_engagements(*)")
    .in("status", ["submitted", "approved", "ready_for_payment", "processing", "needs_correction"])
    .order("period_end", { ascending: false })
    .limit(100);

  if (error) {
    console.warn("[staff-time] attention queue", error.message);
    return [];
  }

  return (data || []).map((row) => {
    const period = mapPeriod(row as Record<string, unknown>);
    const engRaw = (row as { staff_engagements?: Record<string, unknown> })
      .staff_engagements;
    const engagement = engRaw
      ? mapEngagement(engRaw)
      : ({
          id: period.engagementId,
          userId: "",
          email: "",
          displayName: "Team member",
          title: "",
          status: "active",
          expectedWeeklyMinHours: 10,
          expectedWeeklyMaxHours: 15,
          paymentCadence: "biweekly",
          periodAnchorOn: "2025-11-02",
          currency: "USD",
          w9Status: "not_requested",
          employmentClassification: "contractor",
          startOn: null,
          endOn: null,
          notes: "",
        } satisfies StaffEngagement);
    return {
      period,
      engagement,
      statusLabel: paymentStatusLabel(period.status),
    };
  });
}

export async function listReadyForPaymentQueue() {
  const all = await listPeriodsNeedingAttention();
  return all.filter((item) =>
    ["approved", "ready_for_payment", "processing"].includes(item.period.status),
  );
}

export { formatHours, paymentStatusLabel };
