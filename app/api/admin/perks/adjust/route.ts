/**
 * POST /api/admin/perks/adjust
 * Secure admin vault override — ADMIN_DEBIT / ADMIN_CREDIT with compliance memo.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/supabase/admin";
import { adminAdjustPawPerks } from "@/lib/pawperks/ledger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AdjustBody = {
  parentId?: string;
  pointsDelta?: number;
  /** Convenience alias for debit flows (e.g. ADMIN_DEBIT of -25). */
  adminDebit?: number;
  memo?: string;
  notes?: string;
  bookingId?: string;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  try {
    const { adminUser } = await requireAdminUser(request);
    const body = (await request.json().catch(() => null)) as AdjustBody | null;

    if (!body) {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body." },
        { status: 400 },
      );
    }

    const parentId = cleanText(body.parentId);
    if (!parentId) {
      return NextResponse.json(
        { ok: false, error: "parentId is required." },
        { status: 400 },
      );
    }

    let pointsDelta = Number(body.pointsDelta);
    if (!Number.isFinite(pointsDelta) && body.adminDebit != null) {
      const debit = Math.abs(Math.trunc(Number(body.adminDebit) || 0));
      pointsDelta = -debit;
    }

    if (!Number.isFinite(pointsDelta) || pointsDelta === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Provide non-zero pointsDelta (or adminDebit for a debit).",
        },
        { status: 400 },
      );
    }

    const memo =
      cleanText(body.memo) ||
      cleanText(body.notes) ||
      "Admin vault adjustment";

    const result = await adminAdjustPawPerks({
      parentId,
      pointsDelta: Math.trunc(pointsDelta),
      memo,
      adminUserId: adminUser.id,
      bookingId: cleanText(body.bookingId) || null,
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      sourceType: result.sourceType,
      pointsDelta: result.pointsDelta,
      pointsBalance: result.pointsBalance,
      lifetimeEarned: result.lifetimeEarned,
      transactionId: result.transaction?.transaction_id,
      memo: result.transaction?.memo,
      adminUserId: adminUser.id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Admin perk adjust failed.";
    const status =
      /admin|authorization|token|verify/i.test(message) ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
