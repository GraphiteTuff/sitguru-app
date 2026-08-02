/**
 * Conversion-leak diagnostics — funnel stages + chat friction Help briefs.
 * Admin-only. Surfaces signup→booking drop-offs and friction article prefill.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/supabase/admin";
import {
  compileConversionLeakDiagnostics,
  inferPeriodFromText,
  type ReportPeriod,
} from "@/lib/actions/admin-reporting";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser(request);
    const period = asPeriod(request.nextUrl.searchParams.get("period"));
    const diagnostics = await compileConversionLeakDiagnostics({ period });

    return NextResponse.json({
      ok: true,
      diagnostics,
      funnel: diagnostics.funnel,
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
