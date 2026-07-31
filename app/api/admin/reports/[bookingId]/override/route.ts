// app/api/admin/reports/[bookingId]/override/route.ts
/**
 * Admin override actions for a single PawReport:
 *   POST { action: "force_end" | "append_timeline" | "update_meta", ... }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/supabase/admin";
import {
  adminAppendTimelineEvent,
  adminForceEndWalk,
  adminSendGuruSms,
  adminUpdateReportMeta,
} from "@/lib/pawreport/admin-reports";
import {
  PAWREPORT_GLOBAL_TRACKING_STATUSES,
  type PawReportGlobalTrackingStatus,
} from "@/lib/pawreport/admin-types";

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

type OverrideBody = {
  action?:
    | "force_end"
    | "append_timeline"
    | "update_meta"
    | "send_guru_sms";
  note?: string;
  message?: string;
  updateType?: string;
  adminNotes?: string;
  globalTrackingStatus?: string;
  lat?: number | null;
  lng?: number | null;
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ bookingId: string }> },
) {
  try {
    const { adminUser } = await requireAdminUser(request);
    const { bookingId: rawId } = await context.params;
    const bookingId = String(rawId || "").trim();

    if (!bookingId) {
      return NextResponse.json(
        { ok: false, error: "Missing booking ID." },
        { status: 400 },
      );
    }

    const body = (await request.json().catch(() => null)) as OverrideBody | null;
    const action = body?.action;

    if (!action) {
      return NextResponse.json(
        { ok: false, error: "Missing action." },
        { status: 400 },
      );
    }

    if (action === "force_end") {
      const result = await adminForceEndWalk({
        bookingId,
        adminUserId: adminUser.id,
        note: body?.note,
        lat: body?.lat ?? null,
        lng: body?.lng ?? null,
      });

      if (!result.ok) {
        return NextResponse.json(
          { ok: false, error: result.error },
          { status: result.status },
        );
      }

      return NextResponse.json({ ok: true, event: result.event });
    }

    if (action === "append_timeline") {
      const result = await adminAppendTimelineEvent({
        bookingId,
        adminUserId: adminUser.id,
        updateType: body?.updateType || "note",
        note: String(body?.note || ""),
        lat: body?.lat ?? null,
        lng: body?.lng ?? null,
      });

      if (!result.ok) {
        return NextResponse.json(
          { ok: false, error: result.error },
          { status: result.status },
        );
      }

      return NextResponse.json({ ok: true, update: result.update });
    }

    if (action === "send_guru_sms") {
      const result = await adminSendGuruSms({
        bookingId,
        adminUserId: adminUser.id,
        message: body?.message || body?.note,
      });

      if (!result.ok) {
        return NextResponse.json(
          { ok: false, error: result.error, skipped: "skipped" in result ? result.skipped : undefined },
          { status: result.status },
        );
      }

      return NextResponse.json({ ok: true, sid: result.sid });
    }

    if (action === "update_meta") {
      const status = body?.globalTrackingStatus;
      if (
        status &&
        !(PAWREPORT_GLOBAL_TRACKING_STATUSES as readonly string[]).includes(
          status,
        )
      ) {
        return NextResponse.json(
          { ok: false, error: "Invalid globalTrackingStatus." },
          { status: 400 },
        );
      }

      const result = await adminUpdateReportMeta({
        bookingId,
        adminUserId: adminUser.id,
        adminNotes: body?.adminNotes,
        globalTrackingStatus: status as PawReportGlobalTrackingStatus | undefined,
      });

      if (!result.ok) {
        return NextResponse.json(
          { ok: false, error: result.error },
          { status: 500 },
        );
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { ok: false, error: "Unknown action." },
      { status: 400 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Override failed.";
    return NextResponse.json(
      { ok: false, error: message },
      { status: mapAuthErrorStatus(message) },
    );
  }
}
