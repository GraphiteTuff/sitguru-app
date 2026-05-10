import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

type TrustSafetyPurchaseRow = {
  id?: string | null;
  guru_id?: string | null;
  user_id?: string | null;
  profile_id?: string | null;
  email?: string | null;
  plan_key?: string | null;
  plan_name?: string | null;
  payment_model?: string | null;
  gross_plan_value_cents?: number | string | null;
  due_today_cents?: number | string | null;
  down_payment_cents?: number | string | null;
  amount_paid_cents?: number | string | null;
  remaining_balance_cents?: number | string | null;
  installment_count?: number | string | null;
  installment_amount_cents?: number | string | null;
  installments_paid_count?: number | string | null;
  booking_deduction_required?: boolean | string | null;
  booking_deduction_agreement_accepted?: boolean | string | null;
  booking_deduction_collected_cents?: number | string | null;
  booking_deduction_remaining_cents?: number | string | null;
  management_approval_required?: boolean | string | null;
  management_approval_status?: string | null;
  payment_status?: string | null;
  repayment_status?: string | null;
  checkr_invite_allowed?: boolean | string | null;
  checkr_invite_blocked_reason?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type TrustSafetyFinancialEventRow = {
  id?: string | null;
  purchase_id?: string | null;
  guru_id?: string | null;
  user_id?: string | null;
  event_type?: string | null;
  category?: string | null;
  source?: string | null;
  status?: string | null;
  plan_key?: string | null;
  plan_name?: string | null;
  gross_amount_cents?: number | string | null;
  fee_amount_cents?: number | string | null;
  net_amount_cents?: number | string | null;
  currency?: string | null;
  description?: string | null;
  occurred_at?: string | null;
  created_at?: string | null;
};

type BookingTrustSafetyDeductionRow = {
  id?: string | null;
  purchase_id?: string | null;
  guru_id?: string | null;
  booking_id?: string | null;
  deduction_amount_cents?: number | string | null;
  status?: string | null;
  created_at?: string | null;
};

type GuruRow = {
  id?: string | null;
  name?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
};

type PlanBreakdown = {
  planKey: string;
  planName: string;
  count: number;
  revenueCents: number;
  contractedValueCents: number;
  outstandingCents: number;
  bookingDeductionRemainingCents: number;
  managementApprovalPending: number;
  checkrReady: number;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toBoolean(value: unknown) {
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "yes" || normalized === "1";
  }

  return Boolean(value);
}

function dollars(cents: number) {
  return Number((cents / 100).toFixed(2));
}

function getPlanName(planKey?: string | null, fallback?: string | null) {
  const cleanFallback = asString(fallback);

  if (cleanFallback) return cleanFallback;

  if (planKey === "paw_in_full") return "Paw in Full";
  if (planKey === "pawstep_plan") return "Pawstep Plan";
  if (planKey === "book_and_bark_plan") return "Book & Bark Plan";

  return "Not Selected";
}

function getGuruName(guru?: GuruRow) {
  return (
    asString(guru?.display_name) ||
    asString(guru?.full_name) ||
    asString(guru?.name) ||
    asString(guru?.email).split("@")[0] ||
    "Guru"
  );
}

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string,
): Promise<T[]> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Trust & Safety financials query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as unknown as T[]) : [];
  } catch (error) {
    console.warn(`Trust & Safety financials query skipped for ${label}:`, error);
    return [];
  }
}

function getPlanBreakdown(rows: TrustSafetyPurchaseRow[]) {
  const map = new Map<string, PlanBreakdown>();

  for (const row of rows) {
    const planKey = asString(row.plan_key) || "not_selected";
    const existing =
      map.get(planKey) ||
      ({
        planKey,
        planName: getPlanName(planKey, row.plan_name),
        count: 0,
        revenueCents: 0,
        contractedValueCents: 0,
        outstandingCents: 0,
        bookingDeductionRemainingCents: 0,
        managementApprovalPending: 0,
        checkrReady: 0,
      } satisfies PlanBreakdown);

    existing.count += 1;
    existing.revenueCents += toNumber(row.amount_paid_cents);
    existing.contractedValueCents += toNumber(row.gross_plan_value_cents);
    existing.outstandingCents += toNumber(row.remaining_balance_cents);
    existing.bookingDeductionRemainingCents += toNumber(
      row.booking_deduction_remaining_cents,
    );

    if (
      toBoolean(row.management_approval_required) &&
      asString(row.management_approval_status).toLowerCase() === "pending"
    ) {
      existing.managementApprovalPending += 1;
    }

    if (toBoolean(row.checkr_invite_allowed)) {
      existing.checkrReady += 1;
    }

    map.set(planKey, existing);
  }

  return Array.from(map.values()).sort(
    (a, b) => b.revenueCents - a.revenueCents || a.planName.localeCompare(b.planName),
  );
}

function getRecentPurchases(params: {
  purchases: TrustSafetyPurchaseRow[];
  guruById: Map<string, GuruRow>;
}) {
  return params.purchases.slice(0, 20).map((purchase) => {
    const guruId = asString(purchase.guru_id);
    const guru = params.guruById.get(guruId);

    return {
      id: asString(purchase.id),
      guruId,
      guruName: getGuruName(guru),
      guruEmail: asString(guru?.email) || asString(purchase.email) || "—",
      planKey: asString(purchase.plan_key) || "not_selected",
      planName: getPlanName(asString(purchase.plan_key), purchase.plan_name),
      paymentModel: asString(purchase.payment_model) || "not_selected",
      paymentStatus: asString(purchase.payment_status) || "pending",
      managementApprovalStatus:
        asString(purchase.management_approval_status) || "not_required",
      checkrInviteAllowed: toBoolean(purchase.checkr_invite_allowed),
      amountPaid: dollars(toNumber(purchase.amount_paid_cents)),
      remainingBalance: dollars(toNumber(purchase.remaining_balance_cents)),
      createdAt: asString(purchase.created_at),
      updatedAt: asString(purchase.updated_at),
    };
  });
}

export async function GET() {
  try {
    const [purchases, events, deductions, gurus] = await Promise.all([
      safeRows<TrustSafetyPurchaseRow>(
        supabaseAdmin
          .from("guru_trust_safety_plan_purchases")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5000),
        "guru_trust_safety_plan_purchases",
      ),
      safeRows<TrustSafetyFinancialEventRow>(
        supabaseAdmin
          .from("trust_safety_financial_events")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5000),
        "trust_safety_financial_events",
      ),
      safeRows<BookingTrustSafetyDeductionRow>(
        supabaseAdmin
          .from("booking_trust_safety_deductions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5000),
        "booking_trust_safety_deductions",
      ),
      safeRows<GuruRow>(
        supabaseAdmin
          .from("gurus")
          .select("id,name,full_name,display_name,email,city,state")
          .order("created_at", { ascending: false })
          .limit(5000),
        "gurus",
      ),
    ]);

    const guruById = new Map<string, GuruRow>(
      gurus
        .map((guru) => [asString(guru.id), guru] as const)
        .filter(([id]) => Boolean(id)),
    );

    const revenueCentsFromPurchases = purchases.reduce(
      (sum, row) => sum + toNumber(row.amount_paid_cents),
      0,
    );

    const contractedValueCents = purchases.reduce(
      (sum, row) => sum + toNumber(row.gross_plan_value_cents),
      0,
    );

    const outstandingBalanceCents = purchases.reduce(
      (sum, row) => sum + toNumber(row.remaining_balance_cents),
      0,
    );

    const pawstepReceivableCents = purchases
      .filter((row) => asString(row.plan_key) === "pawstep_plan")
      .reduce((sum, row) => sum + toNumber(row.remaining_balance_cents), 0);

    const bookBarkReceivableCents = purchases
      .filter((row) => asString(row.plan_key) === "book_and_bark_plan")
      .reduce(
        (sum, row) =>
          sum +
          (toNumber(row.booking_deduction_remaining_cents) ||
            toNumber(row.remaining_balance_cents)),
        0,
      );

    const bookingDeductionsCollectedCents =
      deductions.reduce(
        (sum, row) => sum + toNumber(row.deduction_amount_cents),
        0,
      ) ||
      purchases.reduce(
        (sum, row) => sum + toNumber(row.booking_deduction_collected_cents),
        0,
      );

    const eventRevenueCents = events
      .filter((event) => {
        const type = asString(event.event_type).toLowerCase();
        const status = asString(event.status).toLowerCase();

        return (
          status !== "failed" &&
          status !== "void" &&
          status !== "canceled" &&
          (type.includes("payment") ||
            type.includes("collected") ||
            type.includes("deduction"))
        );
      })
      .reduce(
        (sum, event) =>
          sum + (toNumber(event.net_amount_cents) || toNumber(event.gross_amount_cents)),
        0,
      );

    const stripeFeesCents = events
      .filter((event) => {
        const type = asString(event.event_type).toLowerCase();
        const description = asString(event.description).toLowerCase();

        return type.includes("stripe_fee") || description.includes("stripe fee");
      })
      .reduce(
        (sum, event) =>
          sum + Math.abs(toNumber(event.fee_amount_cents) || toNumber(event.net_amount_cents)),
        0,
      );

    const refundsCents = events
      .filter((event) => {
        const type = asString(event.event_type).toLowerCase();
        const description = asString(event.description).toLowerCase();

        return type.includes("refund") || description.includes("refund");
      })
      .reduce(
        (sum, event) =>
          sum + Math.abs(toNumber(event.net_amount_cents) || toNumber(event.gross_amount_cents)),
        0,
      );

    const checkrVendorCostsCents = events
      .filter((event) => {
        const type = asString(event.event_type).toLowerCase();
        const description = asString(event.description).toLowerCase();

        return (
          type.includes("checkr") ||
          type.includes("vendor_cost") ||
          description.includes("checkr") ||
          description.includes("vendor cost")
        );
      })
      .reduce(
        (sum, event) =>
          sum + Math.abs(toNumber(event.net_amount_cents) || toNumber(event.gross_amount_cents)),
        0,
      );

    const managementApprovalPending = purchases.filter(
      (row) =>
        toBoolean(row.management_approval_required) &&
        asString(row.management_approval_status).toLowerCase() === "pending",
    ).length;

    const checkrReady = purchases.filter((row) =>
      toBoolean(row.checkr_invite_allowed),
    ).length;

    const paidOrPartial = purchases.filter((row) => {
      const status = asString(row.payment_status).toLowerCase();

      return status === "paid" || status === "partially_paid";
    }).length;

    const plansSelected = purchases.length;
    const revenueCents = Math.max(revenueCentsFromPurchases, eventRevenueCents);
    const netCashCents =
      revenueCents +
      bookingDeductionsCollectedCents -
      stripeFeesCents -
      refundsCents -
      checkrVendorCostsCents;

    return NextResponse.json({
      ok: true,
      generated_at: new Date().toISOString(),
      summary: {
        plans_selected: plansSelected,
        paid_or_partially_paid: paidOrPartial,
        revenue_cents: revenueCents,
        revenue: dollars(revenueCents),
        contracted_value_cents: contractedValueCents,
        contracted_value: dollars(contractedValueCents),
        outstanding_balance_cents: outstandingBalanceCents,
        outstanding_balance: dollars(outstandingBalanceCents),
        pawstep_receivable_cents: pawstepReceivableCents,
        pawstep_receivable: dollars(pawstepReceivableCents),
        book_bark_receivable_cents: bookBarkReceivableCents,
        book_bark_receivable: dollars(bookBarkReceivableCents),
        booking_deductions_collected_cents: bookingDeductionsCollectedCents,
        booking_deductions_collected: dollars(bookingDeductionsCollectedCents),
        checkr_vendor_costs_cents: checkrVendorCostsCents,
        checkr_vendor_costs: dollars(checkrVendorCostsCents),
        stripe_fees_cents: stripeFeesCents,
        stripe_fees: dollars(stripeFeesCents),
        refunds_cents: refundsCents,
        refunds: dollars(refundsCents),
        net_cash_cents: netCashCents,
        net_cash: dollars(netCashCents),
        management_approval_pending: managementApprovalPending,
        checkr_ready: checkrReady,
      },
      plan_breakdown: getPlanBreakdown(purchases).map((plan) => ({
        ...plan,
        revenue: dollars(plan.revenueCents),
        contractedValue: dollars(plan.contractedValueCents),
        outstanding: dollars(plan.outstandingCents),
        bookingDeductionRemaining: dollars(plan.bookingDeductionRemainingCents),
      })),
      recent_purchases: getRecentPurchases({
        purchases,
        guruById,
      }),
    });
  } catch (error) {
    console.error("Trust & Safety financials API error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not load Trust & Safety financials.",
      },
      { status: 500 },
    );
  }
}