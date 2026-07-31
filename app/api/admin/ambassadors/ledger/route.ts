// app/api/admin/ambassadors/ledger/route.ts
/**
 * Admin Brand Ambassador performance ledger + batch payout actions.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import {
  batchUpdateReferralStatus,
  loadAmbassadorPerformanceRows,
  loadNetworkKpis,
} from "@/lib/ambassador/ledger";
import type { AmbassadorPayoutStatus } from "@/lib/ambassador/ledger-types";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401 as const };

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = String(
    (profile as { role?: string } | null)?.role || "",
  ).toLowerCase();
  if (role !== "admin" && role !== "super_admin") {
    return { ok: false as const, status: 403 as const };
  }

  return { ok: true as const, userId: user.id };
}

export async function GET() {
  const access = await requireAdmin();
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: access.status });
  }

  const [kpis, rows] = await Promise.all([
    loadNetworkKpis(),
    loadAmbassadorPerformanceRows(),
  ]);

  return NextResponse.json({ ok: true, kpis, rows });
}

export async function POST(req: NextRequest) {
  const access = await requireAdmin();
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: access.status });
  }

  const body = (await req.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  const action = String(body?.action || "").trim();
  const ambassadorId = String(body?.ambassadorId || "").trim();

  if (!ambassadorId) {
    return NextResponse.json(
      { ok: false, error: "ambassadorId is required." },
      { status: 400 },
    );
  }

  if (action === "approve_commissions") {
    const result = await batchUpdateReferralStatus({
      ambassadorId,
      fromStatuses: ["PENDING_AUDIT"],
      toStatus: "APPROVED",
    });
    return NextResponse.json(result);
  }

  if (action === "mark_batch_paid") {
    const { data: batch, error: batchError } = await supabaseAdmin
      .from("ambassador_payout_batches")
      .insert({
        label: `Stripe Connect · ${ambassadorId.slice(0, 8)}`,
        status: "paid",
        created_by: access.userId,
        paid_at: new Date().toISOString(),
        notes: "Marked paid via Admin ledger (Stripe Connect).",
      })
      .select("id")
      .maybeSingle();

    if (batchError || !batch?.id) {
      return NextResponse.json(
        { ok: false, error: batchError?.message || "Batch create failed." },
        { status: 500 },
      );
    }

    const result = await batchUpdateReferralStatus({
      ambassadorId,
      fromStatuses: ["APPROVED", "PENDING_AUDIT"] as AmbassadorPayoutStatus[],
      toStatus: "PAID",
      payoutBatchId: String(batch.id),
    });

    if (result.ok) {
      await supabaseAdmin
        .from("ambassador_payout_batches")
        .update({
          total_amount: null,
          status: "paid",
        })
        .eq("id", batch.id);
    }

    return NextResponse.json({ ...result, payoutBatchId: batch.id });
  }

  return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 400 });
}
