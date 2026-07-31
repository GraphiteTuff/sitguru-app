// app/api/admin/reports/all/route.ts
/**
 * GET /api/admin/reports/all
 * Admin-only PawReport directory with advanced filters + live stats.
 *
 * Query:
 *   guruId, petParentId, bookingStatus, trackingStatus,
 *   dateFrom, dateTo, q, liveOnly=1, scanAlerts=1, limit, offset
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/supabase/admin";
import { listAdminPawReports } from "@/lib/pawreport/admin-reports";
import {
  PAWREPORT_GLOBAL_TRACKING_STATUSES,
  type AdminReportFilters,
  type PawReportGlobalTrackingStatus,
} from "@/lib/pawreport/admin-types";
import { evaluateStaleGpsSafetyAlerts } from "@/lib/notificationDispatcher";

function mapAuthErrorStatus(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("missing authorization") || lower.includes("unable to verify")) {
    return 401;
  }
  if (lower.includes("admin access") || lower.includes("not active")) {
    return 403;
  }
  return 400;
}

function parseTrackingStatus(
  raw: string | null,
): PawReportGlobalTrackingStatus | "ACTIVE_ANY" | undefined {
  if (!raw) return undefined;
  if (raw === "ACTIVE_ANY") return "ACTIVE_ANY";
  if (
    (PAWREPORT_GLOBAL_TRACKING_STATUSES as readonly string[]).includes(raw)
  ) {
    return raw as PawReportGlobalTrackingStatus;
  }
  return undefined;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser(request);

    const { searchParams } = new URL(request.url);
    const liveOnly =
      searchParams.get("liveOnly") === "1" ||
      searchParams.get("live") === "1";
    const scanAlerts =
      liveOnly ||
      searchParams.get("scanAlerts") === "1";

    if (scanAlerts) {
      await evaluateStaleGpsSafetyAlerts();
    }

    const filters: AdminReportFilters = {
      guruId: searchParams.get("guruId") || undefined,
      petParentId:
        searchParams.get("petParentId") ||
        searchParams.get("customerId") ||
        undefined,
      bookingStatus: searchParams.get("bookingStatus") || undefined,
      trackingStatus: parseTrackingStatus(searchParams.get("trackingStatus")),
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      query: searchParams.get("q") || searchParams.get("query") || undefined,
      liveOnly,
      limit: Number(searchParams.get("limit") || 100) || 100,
      offset: Number(searchParams.get("offset") || 0) || 0,
    };

    if (liveOnly && !filters.trackingStatus) {
      filters.trackingStatus = "ACTIVE_ANY";
    }

    const result = await listAdminPawReports(filters);

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load reports.";
    return NextResponse.json(
      { ok: false, error: message },
      { status: mapAuthErrorStatus(message) },
    );
  }
}
