import { NextResponse } from "next/server";
import Stripe from "stripe";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type DbRow = Record<string, unknown>;

type ReleasePayoutBody = {
  payoutId?: string;
  payoutIds?: string[];
  dryRun?: boolean;
};

type ReleaseResult = {
  payoutId: string;
  status: "released" | "skipped" | "failed" | "dry_run";
  amount?: number;
  amountCents?: number;
  stripeTransferId?: string;
  message: string;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function firstString(row: DbRow | undefined | null, keys: string[]) {
  if (!row) return "";

  for (const key of keys) {
    const value = asString(row[key]);

    if (value) return value;
  }

  return "";
}

function firstNumber(row: DbRow | undefined | null, keys: string[]) {
  if (!row) return 0;

  for (const key of keys) {
    const value = asNumber(row[key]);

    if (value > 0) return value;
  }

  return 0;
}

function normalizeStatus(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function getAllowedAdminEmails() {
  return String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function getPayoutId(row: DbRow) {
  return firstString(row, ["id", "payout_id", "guru_payout_id"]);
}

function getGuruId(row: DbRow) {
  return firstString(row, [
    "guru_id",
    "guruId",
    "sitter_id",
    "provider_id",
    "caregiver_id",
    "user_id",
  ]);
}

function getBookingId(row: DbRow) {
  return firstString(row, ["booking_id", "bookingId"]);
}

function getPayoutStatus(row: DbRow) {
  return normalizeStatus(
    firstString(row, ["status", "payout_status", "release_status"]) || "pending",
  );
}

function getExistingStripeTransferId(row: DbRow) {
  return firstString(row, [
    "stripe_transfer_id",
    "transfer_id",
    "stripe_payout_id",
    "transaction_reference",
    "reference",
  ]);
}

function getPayoutAmountDollars(row: DbRow) {
  const cents = firstNumber(row, [
    "amount_cents",
    "payout_amount_cents",
    "guru_net_amount_cents",
    "net_amount_cents",
  ]);

  if (cents > 0) return cents / 100;

  return firstNumber(row, [
    "amount",
    "payout_amount",
    "guru_net_amount",
    "net_amount",
    "total_amount",
  ]);
}

function dollarsToCents(value: number) {
  return Math.round(value * 100);
}

function getStripeAccountId(...rows: Array<DbRow | null | undefined>) {
  for (const row of rows) {
    const accountId = firstString(row, [
      "stripe_connect_account_id",
      "stripe_account_id",
      "connected_account_id",
      "stripe_connected_account_id",
      "stripe_destination_account_id",
    ]);

    if (accountId) return accountId;
  }

  return "";
}

function getRecipientName(...rows: Array<DbRow | null | undefined>) {
  for (const row of rows) {
    const name = firstString(row, [
      "guru_name",
      "full_name",
      "display_name",
      "name",
      "recipient_name",
      "email",
    ]);

    if (name) return name;
  }

  return "Guru";
}

function isReleaseableStatus(status: string) {
  return [
    "approved",
    "ready",
    "ready_for_release",
    "release_ready",
    "scheduled",
    "pending",
  ].includes(status);
}

async function getAuthenticatedAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      ok: false,
      user: null,
      message: "You must be signed in to release payouts.",
    };
  }

  const email = String(user.email || "").toLowerCase();
  const allowedEmails = getAllowedAdminEmails();

  if (allowedEmails.includes(email)) {
    return {
      ok: true,
      user,
      message: "Authorized by ADMIN_EMAILS.",
    };
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const role = normalizeStatus(
    firstString(profile || {}, ["role", "admin_role", "account_role", "user_role"]),
  );

  const isAdmin =
    profile?.is_admin === true ||
    profile?.admin === true ||
    ["admin", "super_admin", "owner", "finance", "finance_admin"].includes(role);

  if (isAdmin) {
    return {
      ok: true,
      user,
      message: "Authorized by profile role.",
    };
  }

  return {
    ok: false,
    user,
    message:
      "Your account is not authorized to release payouts. Add an admin role in profiles or add your email to ADMIN_EMAILS.",
  };
}

async function safeUpdateGuruPayout(payoutId: string, patches: DbRow[]) {
  let lastError: unknown = null;

  for (const patch of patches) {
    const { error } = await supabaseAdmin
      .from("guru_payouts")
      .update(patch)
      .eq("id", payoutId);

    if (!error) return { ok: true, error: null };

    lastError = error;
  }

  return { ok: false, error: lastError };
}

async function markProcessing(payoutId: string) {
  return safeUpdateGuruPayout(payoutId, [
    {
      status: "processing",
      payout_status: "processing",
      updated_at: new Date().toISOString(),
    },
    {
      status: "processing",
      updated_at: new Date().toISOString(),
    },
    {
      payout_status: "processing",
      updated_at: new Date().toISOString(),
    },
    {
      status: "processing",
    },
    {
      payout_status: "processing",
    },
  ]);
}

async function markReleased({
  payoutId,
  stripeTransferId,
  amountCents,
}: {
  payoutId: string;
  stripeTransferId: string;
  amountCents: number;
}) {
  const now = new Date().toISOString();

  return safeUpdateGuruPayout(payoutId, [
    {
      status: "paid",
      payout_status: "paid",
      stripe_transfer_id: stripeTransferId,
      transaction_reference: stripeTransferId,
      amount_cents: amountCents,
      released_at: now,
      paid_at: now,
      updated_at: now,
    },
    {
      status: "paid",
      stripe_transfer_id: stripeTransferId,
      transaction_reference: stripeTransferId,
      released_at: now,
      paid_at: now,
      updated_at: now,
    },
    {
      payout_status: "paid",
      stripe_transfer_id: stripeTransferId,
      transaction_reference: stripeTransferId,
      released_at: now,
      paid_at: now,
      updated_at: now,
    },
    {
      status: "paid",
      stripe_transfer_id: stripeTransferId,
      updated_at: now,
    },
    {
      payout_status: "paid",
      stripe_transfer_id: stripeTransferId,
      updated_at: now,
    },
    {
      status: "paid",
      transaction_reference: stripeTransferId,
    },
    {
      payout_status: "paid",
      transaction_reference: stripeTransferId,
    },
  ]);
}

async function markFailed({
  payoutId,
  failureReason,
}: {
  payoutId: string;
  failureReason: string;
}) {
  const now = new Date().toISOString();

  return safeUpdateGuruPayout(payoutId, [
    {
      status: "failed",
      payout_status: "failed",
      failure_reason: failureReason,
      failed_at: now,
      updated_at: now,
    },
    {
      status: "failed",
      failure_reason: failureReason,
      failed_at: now,
      updated_at: now,
    },
    {
      payout_status: "failed",
      failure_reason: failureReason,
      failed_at: now,
      updated_at: now,
    },
    {
      status: "failed",
      failure_reason: failureReason,
    },
    {
      payout_status: "failed",
      failure_reason: failureReason,
    },
    {
      status: "failed",
    },
    {
      payout_status: "failed",
    },
  ]);
}

async function getGuruRecord(guruId: string) {
  if (!guruId) return null;

  const byId = await supabaseAdmin.from("gurus").select("*").eq("id", guruId).maybeSingle();

  if (byId.data) return byId.data as DbRow;

  const byUserId = await supabaseAdmin
    .from("gurus")
    .select("*")
    .eq("user_id", guruId)
    .maybeSingle();

  if (byUserId.data) return byUserId.data as DbRow;

  return null;
}

async function getProfileRecord(guruId: string) {
  if (!guruId) return null;

  const byId = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", guruId)
    .maybeSingle();

  if (byId.data) return byId.data as DbRow;

  const byUserId = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("user_id", guruId)
    .maybeSingle();

  if (byUserId.data) return byUserId.data as DbRow;

  return null;
}

async function createStripeTransfer({
  payout,
  guru,
  profile,
  amountCents,
  adminUserId,
}: {
  payout: DbRow;
  guru: DbRow | null;
  profile: DbRow | null;
  amountCents: number;
  adminUserId: string;
}) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeKey) {
    throw new Error("Missing STRIPE_SECRET_KEY.");
  }

  const stripe = new Stripe(stripeKey);

  const payoutId = getPayoutId(payout);
  const bookingId = getBookingId(payout);
  const guruId = getGuruId(payout);
  const destination = getStripeAccountId(payout, guru, profile);
  const recipientName = getRecipientName(payout, guru, profile);

  if (!destination) {
    throw new Error(
      `Missing Stripe connected account for ${recipientName}. Add stripe_account_id or stripe_connect_account_id to the Guru/profile record.`,
    );
  }

  const idempotencyKey = `sitguru-guru-payout-${payoutId}-${amountCents}`;

  return stripe.transfers.create(
    {
      amount: amountCents,
      currency: "usd",
      destination,
      description: `SitGuru Guru payout${bookingId ? ` for booking ${bookingId}` : ""}`,
      metadata: {
        payout_id: payoutId,
        booking_id: bookingId,
        guru_id: guruId,
        recipient_name: recipientName,
        released_by: adminUserId,
        source: "sitguru_admin_release",
      },
    },
    {
      idempotencyKey,
    },
  );
}

async function releaseOnePayout({
  payout,
  adminUserId,
  dryRun,
}: {
  payout: DbRow;
  adminUserId: string;
  dryRun: boolean;
}): Promise<ReleaseResult> {
  const payoutId = getPayoutId(payout);

  if (!payoutId) {
    return {
      payoutId: "unknown",
      status: "failed",
      message: "Payout row is missing an id.",
    };
  }

  const existingTransferId = getExistingStripeTransferId(payout);

  if (existingTransferId) {
    return {
      payoutId,
      status: "skipped",
      stripeTransferId: existingTransferId,
      message: "This payout already has a Stripe transfer/reference and was skipped.",
    };
  }

  const currentStatus = getPayoutStatus(payout);

  if (["paid", "released", "complete", "completed", "processing"].includes(currentStatus)) {
    return {
      payoutId,
      status: "skipped",
      message: `This payout is already ${currentStatus} and was skipped.`,
    };
  }

  if (!isReleaseableStatus(currentStatus)) {
    return {
      payoutId,
      status: "failed",
      message: `This payout status is "${currentStatus}". Mark it approved/ready before release.`,
    };
  }

  const amount = getPayoutAmountDollars(payout);
  const amountCents = dollarsToCents(amount);

  if (!amount || amountCents < 50) {
    return {
      payoutId,
      status: "failed",
      amount,
      amountCents,
      message: "Payout amount is missing or below Stripe minimum transfer size.",
    };
  }

  const guruId = getGuruId(payout);
  const [guru, profile] = await Promise.all([getGuruRecord(guruId), getProfileRecord(guruId)]);

  const destination = getStripeAccountId(payout, guru, profile);

  if (!destination) {
    return {
      payoutId,
      status: "failed",
      amount,
      amountCents,
      message:
        "Missing Guru Stripe connected account. Add stripe_account_id or stripe_connect_account_id before release.",
    };
  }

  if (dryRun) {
    return {
      payoutId,
      status: "dry_run",
      amount,
      amountCents,
      message: `Dry run passed. This would transfer ${amountCents} cents to ${destination}.`,
    };
  }

  const processingUpdate = await markProcessing(payoutId);

  if (!processingUpdate.ok) {
    return {
      payoutId,
      status: "failed",
      amount,
      amountCents,
      message:
        "Could not mark payout as processing in Supabase. Transfer was not created.",
    };
  }

  try {
    const transfer = await createStripeTransfer({
      payout,
      guru,
      profile,
      amountCents,
      adminUserId,
    });

    const releasedUpdate = await markReleased({
      payoutId,
      stripeTransferId: transfer.id,
      amountCents,
    });

    if (!releasedUpdate.ok) {
      return {
        payoutId,
        status: "released",
        amount,
        amountCents,
        stripeTransferId: transfer.id,
        message:
          "Stripe transfer was created, but Supabase could not save all release fields. Check the guru_payouts table columns.",
      };
    }

    return {
      payoutId,
      status: "released",
      amount,
      amountCents,
      stripeTransferId: transfer.id,
      message: "Stripe transfer created and Supabase payout marked paid.",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Stripe transfer error.";

    await markFailed({
      payoutId,
      failureReason: message,
    });

    return {
      payoutId,
      status: "failed",
      amount,
      amountCents,
      message,
    };
  }
}

export async function POST(request: Request) {
  const admin = await getAuthenticatedAdmin();

  if (!admin.ok || !admin.user) {
    return NextResponse.json(
      {
        ok: false,
        error: admin.message,
      },
      { status: admin.user ? 403 : 401 },
    );
  }

  let body: ReleasePayoutBody;

  try {
    body = (await request.json()) as ReleasePayoutBody;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid JSON body.",
      },
      { status: 400 },
    );
  }

  const payoutIds = Array.from(
    new Set([...(body.payoutIds || []), body.payoutId].filter(Boolean) as string[]),
  );

  if (!payoutIds.length) {
    return NextResponse.json(
      {
        ok: false,
        error: "Provide payoutId or payoutIds.",
      },
      { status: 400 },
    );
  }

  const { data: payouts, error } = await supabaseAdmin
    .from("guru_payouts")
    .select("*")
    .in("id", payoutIds);

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load guru_payouts from Supabase.",
        details: error.message,
      },
      { status: 500 },
    );
  }

  const payoutRows = Array.isArray(payouts) ? (payouts as DbRow[]) : [];
  const foundIds = new Set(payoutRows.map((row) => getPayoutId(row)));
  const missingIds = payoutIds.filter((id) => !foundIds.has(id));

  const results: ReleaseResult[] = [];

  for (const missingId of missingIds) {
    results.push({
      payoutId: missingId,
      status: "failed",
      message: "No guru_payouts row found for this payout id.",
    });
  }

  for (const payout of payoutRows) {
    const result = await releaseOnePayout({
      payout,
      adminUserId: admin.user.id,
      dryRun: body.dryRun === true,
    });

    results.push(result);
  }

  const released = results.filter((result) => result.status === "released").length;
  const failed = results.filter((result) => result.status === "failed").length;
  const skipped = results.filter((result) => result.status === "skipped").length;
  const dryRuns = results.filter((result) => result.status === "dry_run").length;

  return NextResponse.json({
    ok: failed === 0,
    released,
    failed,
    skipped,
    dryRuns,
    results,
  });
}