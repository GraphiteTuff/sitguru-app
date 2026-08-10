/**
 * Conversion-leak diagnostics — funnel stages + chat friction Help briefs.
 * Admin-only. Surfaces signup→booking drop-offs and friction article prefill.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/supabase/admin";
import {
  compileConversionLeakDiagnostics,
  inferPeriodFromText,
  type ConversionFunnelReport,
  type ReportPeriod,
} from "@/lib/actions/admin-reporting";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** UI contract for `/admin/analytics/funnel`. */
export type FunnelStage = {
  stage: string;
  count: number;
  dropOffCount: number;
  dropOffPercentage: number;
  retentionPercentage: number;
};

export type DiagnosticSummary = {
  totalLeakPercentage: number;
  highestDropOffStage: string;
  leakSummary: string;
  groundTruthSignups: number;
  groundTruthBookings: number;
  totalEventsSampled: number;
};

export type DiagnosticData = {
  summary: DiagnosticSummary;
  funnel: FunnelStage[];
  compiledAt: string;
  period: string;
  periodStart: string;
};

function asPeriod(value: string | null): ReportPeriod {
  const normalized = String(value || "").trim().toLowerCase();
  if (
    normalized === "daily" ||
    normalized === "weekly" ||
    normalized === "monthly" ||
    normalized === "yearly"
  ) {
    return normalized;
  }
  return inferPeriodFromText(normalized || "yearly");
}

function toDiagnosticData(
  funnel: ConversionFunnelReport,
  period: ReportPeriod,
  periodStart: string,
): DiagnosticData {
  const stages: FunnelStage[] = funnel.stages.map((stage, index) => ({
    stage: stage.label,
    count: stage.count,
    dropOffCount: stage.dropOffCount ?? 0,
    dropOffPercentage: stage.dropOffPct ?? 0,
    retentionPercentage:
      index === 0
        ? 100
        : stage.conversionFromPreviousPct ??
          stage.conversionFromTopPct ??
          0,
  }));

  const signup = funnel.stages.find((s) => s.id === "account_signup");
  const completed = funnel.stages.find((s) => s.id === "booking_completed");
  const signupCount = signup?.count ?? funnel.groundTruthSignups;
  const completedCount = completed?.count ?? funnel.groundTruthBookings;
  const convertedPct =
    signupCount > 0
      ? Math.round((completedCount / signupCount) * 1000) / 10
      : 0;
  const totalLeakPercentage = Math.max(
    0,
    Math.round((100 - convertedPct) * 10) / 10,
  );

  const highestDropOffStage = funnel.largestDropOff
    ? funnel.stages.find((s) => s.id === funnel.largestDropOff?.to)?.label ||
      funnel.stages.find((s) => s.id === funnel.largestDropOff?.from)?.label ||
      ""
    : stages.reduce(
        (worst, stage) =>
          stage.dropOffPercentage > (worst?.dropOffPercentage || -1)
            ? stage
            : worst,
        stages[0],
      )?.stage || "";

  return {
    summary: {
      totalLeakPercentage,
      highestDropOffStage,
      leakSummary: funnel.leakSummary,
      groundTruthSignups: funnel.groundTruthSignups,
      groundTruthBookings: funnel.groundTruthBookings,
      totalEventsSampled: funnel.totalEventsSampled,
    },
    funnel: stages,
    compiledAt: funnel.compiledAt,
    period,
    periodStart,
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser(request);
    const period = asPeriod(request.nextUrl.searchParams.get("period"));
    const diagnostics = await compileConversionLeakDiagnostics({ period });
    const data = toDiagnosticData(
      diagnostics.funnel,
      diagnostics.period,
      diagnostics.periodStart,
    );

    return NextResponse.json({
      ok: true,
      data,
      summary: data.summary,
      funnel: data.funnel,
      diagnostics,
      frictionFlags: diagnostics.frictionFlags,
      insightRowsLogged: diagnostics.insightRowsLogged,
      helpCenterBriefs: diagnostics.helpCenterBriefs,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Conversion diagnostics failed.";
    const status = /unauthorized|admin/i.test(message) ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
