import { NextResponse } from "next/server";

import { requireFinanceAdminApi } from "@/lib/admin/financials/access";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type DbRow = Record<string, unknown>;

type CreateManualGuruPayoutBody = {
  guruId?: string;
  amount?: number | string;
  payoutType?: string;
  reason?: string;
  status?: string;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function firstString(row: DbRow | null | undefined, keys: string[]) {
  if (!row) return "";
  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }
  return "";
}

function normalizeReleaseStatus(value: unknown) {
  const status = asString(value).toLowerCase().replace(/[\s-]+/g, "_");

  if (
    [
      "approved",
      "ready",
      "ready_for_release",
      "release_ready",
      "scheduled",
      "pending",
    ].includes(status)
  ) {
    return status === "approved" || status === "ready_for_release" || status === "release_ready"
      ? "ready"
      : status;
  }

  return "ready";
}

async function getGuruRecord(guruId: string) {
  if (!guruId) return null;

  const byId = await supabaseAdmin
    .from("gurus")
    .select("*")
    .eq("id", guruId)
    .maybeSingle();

  if (byId.data) return byId.data as DbRow;

  const byUserId = await supabaseAdmin
    .from("gurus")
    .select("*")
    .eq("user_id", guruId)
    .maybeSingle();

  if (byUserId.data) return byUserId.data as DbRow;

  return null;
}

export async function POST(request: Request) {
  const financeCheck = await requireFinanceAdminApi();

  if (!financeCheck.identity) {
    return (
      financeCheck.response ||
      NextResponse.json(
        {
          ok: false,
          error: "Finance admin access required to create manual Guru payouts.",
        },
        { status: 403 },
      )
    );
  }

  let body: CreateManualGuruPayoutBody;

  try {
    body = (await request.json()) as CreateManualGuruPayoutBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const guruId = asString(body.guruId);
  const amount = asNumber(body.amount);
  const payoutType =
    asString(body.payoutType) || "Welcome / Thank-You Bonus";
  const reason =
    asString(body.reason) || "Thank you for joining SitGuru!";
  const payoutStatus = normalizeReleaseStatus(body.status);

  if (!guruId) {
    return NextResponse.json(
      { ok: false, error: "Select a Guru before creating a payout." },
      { status: 400 },
    );
  }

  if (!Number.isFinite(amount) || amount < 0.5) {
    return NextResponse.json(
      {
        ok: false,
        error: "Amount must be at least $0.50 to match Stripe transfer minimums.",
      },
      { status: 400 },
    );
  }

  const guru = await getGuruRecord(guruId);

  if (!guru) {
    return NextResponse.json(
      { ok: false, error: "Guru record was not found." },
      { status: 404 },
    );
  }

  const resolvedGuruId =
    firstString(guru, ["id", "guru_id"]) || guruId;
  const stripeAccountId = firstString(guru, [
    "stripe_account_id",
    "stripe_connect_account_id",
    "connected_account_id",
    "stripe_connected_account_id",
  ]);
  const guruName =
    firstString(guru, ["display_name", "full_name", "name"]) || "Guru";

  if (!stripeAccountId) {
    return NextResponse.json(
      {
        ok: false,
        error: `${guruName} does not have a Stripe connected account saved. Add stripe_account_id before creating a releasable payout.`,
      },
      { status: 400 },
    );
  }

  // Critical: leave stripe_transfer_id empty. The release route treats any
  // populated transfer/reference as already released and will skip the payout.
  const insertPayload = {
    guru_id: resolvedGuruId,
    booking_id: null,
    stripe_transfer_id: null,
    gross_amount: amount,
    sitguru_fee_amount: 0,
    net_amount: amount,
    payout_status: payoutStatus,
    payout_date: null,
  };

  const { data, error } = await supabaseAdmin
    .from("guru_payouts")
    .insert(insertPayload)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not create guru_payouts row.",
        details: error?.message || "Insert returned no row.",
      },
      { status: 500 },
    );
  }

  const payout = data as DbRow;

  return NextResponse.json({
    ok: true,
    payout: {
      id: firstString(payout, ["id"]),
      guruId: resolvedGuruId,
      guruName,
      guruEmail: firstString(guru, ["email"]),
      amount,
      netAmount: amount,
      payoutStatus,
      payoutType,
      reason,
      stripeAccountId,
      stripeTransferId: null,
      createdBy: financeCheck.identity.id,
      createdAt: firstString(payout, ["created_at"]) || new Date().toISOString(),
      warning:
        "Dry-run before Release. Do not release until SitGuru Stripe platform available balance covers this amount.",
    },
  });
}
