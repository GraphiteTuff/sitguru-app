import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DbRow = Record<string, unknown>;

type SafeRowsResult = {
  rows: DbRow[];
  warning: string | null;
};

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const parsed = Number(String(value ?? "").replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

async function safeRows(table: string, limit = 5000): Promise<SafeRowsResult> {
  try {
    const { data, error } = await supabaseAdmin.from(table).select("*").limit(limit);

    if (error) {
      console.warn(`Growth financial source unavailable: ${table}`, error);

      return {
        rows: [],
        warning: `${table}: ${error.message}`,
      };
    }

    return {
      rows: Array.isArray(data) ? (data as DbRow[]) : [],
      warning: null,
    };
  } catch (error) {
    console.warn(`Growth financial source failed: ${table}`, error);

    return {
      rows: [],
      warning:
        error instanceof Error
          ? `${table}: ${error.message}`
          : `${table}: unable to load`,
    };
  }
}

export async function GET() {
  const generatedAt = new Date().toISOString();

  const [summaryResult, roiResult] = await Promise.all([
    safeRows("admin_growth_financial_summary"),
    safeRows("admin_growth_campaign_roi"),
  ]);

  const summaryRows = summaryResult.rows;
  const roiRows = roiResult.rows;

  const marketingExpense = summaryRows
    .filter((row) => String(row.source || "") === "growth_campaign_costs")
    .reduce((sum, row) => sum + asNumber(row.total_amount), 0);

  const pendingRewardLiability = summaryRows
    .filter(
      (row) =>
        String(row.financial_statement_section || "") ===
        "pending_reward_liability",
    )
    .reduce((sum, row) => sum + asNumber(row.total_amount), 0);

  const issuedReferralRewards = summaryRows
    .filter(
      (row) =>
        String(row.financial_statement_section || "") ===
        "issued_reward_expense",
    )
    .reduce((sum, row) => sum + asNumber(row.total_amount), 0);

  const totalAttributedRevenue = roiRows.reduce(
    (sum, row) => sum + asNumber(row.attributed_revenue),
    0,
  );

  const totalGrowthCost = roiRows.reduce(
    (sum, row) => sum + asNumber(row.total_cost),
    0,
  );

  const clicks = roiRows.reduce((sum, row) => sum + asNumber(row.clicks), 0);
  const leads = roiRows.reduce((sum, row) => sum + asNumber(row.leads), 0);
  const signups = roiRows.reduce((sum, row) => sum + asNumber(row.signups), 0);
  const bookings = roiRows.reduce((sum, row) => sum + asNumber(row.bookings), 0);
  const netGrowthReturn = totalAttributedRevenue - totalGrowthCost;

  const overallRoiPercent =
    totalGrowthCost > 0
      ? ((totalAttributedRevenue - totalGrowthCost) / totalGrowthCost) * 100
      : null;

  const sortedRoiRows = [...roiRows].sort((a, b) => {
    const bScore =
      asNumber(b.bookings) * 100000 +
      asNumber(b.attributed_revenue) -
      asNumber(b.total_cost);
    const aScore =
      asNumber(a.bookings) * 100000 +
      asNumber(a.attributed_revenue) -
      asNumber(a.total_cost);

    return bScore - aScore;
  });

  const warnings = [summaryResult.warning, roiResult.warning].filter(Boolean);

  return NextResponse.json({
    ok: true,
    isLive: warnings.length === 0,
    generatedAt,
    message:
      warnings.length === 0
        ? "Growth, referral, and marketing ROI financial views are connected."
        : `Some growth financial views are unavailable: ${warnings.join(" | ")}`,
    totals: {
      marketingExpense,
      pendingRewardLiability,
      issuedReferralRewards,
      totalAttributedRevenue,
      totalGrowthCost,
      netGrowthReturn,
      overallRoiPercent,
      campaignsTracked: roiRows.length,
      clicks,
      leads,
      signups,
      bookings,
    },
    summaryRows,
    roiRows: sortedRoiRows.slice(0, 25),
  });
}
