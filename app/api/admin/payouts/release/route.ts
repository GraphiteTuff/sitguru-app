import { NextResponse } from "next/server";
import Stripe from "stripe";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireFinanceAdminApi } from "@/lib/admin/financials/access";
import { paypalRequest } from "@/lib/paypal/server";

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


async function getAuthenticatedAdmin() {
  const financeCheck = await requireFinanceAdminApi();

  if (!financeCheck.identity) {
    return {
      ok: false as const,
      user: null,
      message: "Finance admin access required to release payouts.",
      response: financeCheck.response,
    };
  }

  return {
    ok: true as const,
    user: {
      id: financeCheck.identity.id,
      email: financeCheck.identity.email,
    },
    message: "Authorized by shared finance admin access.",
    response: null,
  };
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
  const value = firstString(row, [
    "stripe_transfer_id",
    "transfer_id",
    "stripe_payout_id",
    "transaction_reference",
    "reference",
  ]);

  // pending:* markers store the chosen rail before money moves.
  if (!value || value.startsWith("pending:")) return "";
  return value;
}

function getPreferredPayoutRail(row: DbRow): "stripe" | "paypal" | null {
  const marker = firstString(row, ["stripe_transfer_id"]).toLowerCase();
  if (marker === "pending:paypal") return "paypal";
  if (marker === "pending:stripe") return "stripe";
  return null;
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

async function getPaypalDestination(guru: DbRow | null, profile: DbRow | null) {
  const userId =
    firstString(guru, ["user_id", "profile_id", "id"]) ||
    firstString(profile, ["id", "user_id"]);

  if (!userId) return { email: "", merchantId: "" };

  const { data } = await supabaseAdmin
    .from("user_payout_accounts")
    .select(
      "provider, provider_email, provider_merchant_id, provider_account_id, status, onboarding_status, account_status",
    )
    .eq("user_id", userId)
    .limit(20);

  for (const row of (Array.isArray(data) ? data : []) as DbRow[]) {
    const provider = firstString(row, ["provider"]).toLowerCase();
    if (
      provider &&
      provider !== "paypal" &&
      provider !== "paypal_payouts" &&
      provider !== "venmo"
    ) {
      continue;
    }
    const status = `${firstString(row, ["status", "onboarding_status", "account_status"])}`.toLowerCase();
    if (
      status.includes("disabled") ||
      status.includes("removed") ||
      status.includes("failed")
    ) {
      continue;
    }
    const email = firstString(row, ["provider_email"]);
    const merchantId = firstString(row, [
      "provider_merchant_id",
      "provider_account_id",
    ]);
    if (email || merchantId) return { email, merchantId };
  }

  return { email: "", merchantId: "" };
}

async function createPaypalPayout({
  payout,
  guru,
  profile,
  amountCents,
  adminUserId,
  paypal,
}: {
  payout: DbRow;
  guru: DbRow | null;
  profile: DbRow | null;
  amountCents: number;
  adminUserId: string;
  paypal: { email: string; merchantId: string };
}) {
  const payoutId = getPayoutId(payout);
  const recipientName = getRecipientName(payout, guru, profile);
  const amount = (amountCents / 100).toFixed(2);
  const receiver = paypal.email || paypal.merchantId;
  const recipientType = paypal.email ? "EMAIL" : "PAYPAL_ID";
  const senderItemId = `sg-${payoutId}`.slice(0, 30);

  const response = await paypalRequest<{
    batch_header?: { payout_batch_id?: string; batch_status?: string };
    items?: Array<{ payout_item_id?: string; transaction_id?: string }>;
  }>("/v1/payments/payouts", {
    method: "POST",
    requestId: `sitguru-guru-payout-${payoutId}-${amountCents}`,
    body: {
      sender_batch_header: {
        sender_batch_id: `sg-batch-${payoutId}`.slice(0, 30),
        email_subject: "You have a SitGuru payout",
        email_message: `SitGuru sent ${recipientName} a payout.`,
      },
      items: [
        {
          recipient_type: recipientType,
          amount: { value: amount, currency: "USD" },
          note: `SitGuru Guru payout released by ${adminUserId}`,
          sender_item_id: senderItemId,
          receiver,
        },
      ],
    },
  });

  const batchId = asString(response?.batch_header?.payout_batch_id);
  const itemId = asString(response?.items?.[0]?.payout_item_id);
  const transactionId = asString(response?.items?.[0]?.transaction_id);
  const reference = batchId || itemId || transactionId;

  if (!reference) {
    throw new Error("PayPal payout was created but no batch/item id was returned.");
  }

  return { id: `paypal:${reference}` };
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

  // Include destination so a retry after fixing the Connect account does not
  // collide with Stripe's 24h idempotency cache from a prior failed attempt.
  const idempotencyKey = `sitguru-guru-payout-${payoutId}-${amountCents}-${destination}`;

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

  // Only skip terminal / in-flight rows that already have money movement.
  // "processing" with no stripe_transfer_id means a prior attempt stalled — allow retry.
  if (["paid", "released", "complete", "completed"].includes(currentStatus)) {
    return {
      payoutId,
      status: "skipped",
      message: `This payout is already ${currentStatus} and was skipped.`,
    };
  }

  if (!isReleaseableStatus(currentStatus) && currentStatus !== "processing") {
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

  const stripeDestination = getStripeAccountId(payout, guru, profile);
  const paypal = await getPaypalDestination(guru, profile);
  const preferredRail = getPreferredPayoutRail(payout);
  const rail =
    preferredRail === "paypal" && (paypal.email || paypal.merchantId)
      ? "paypal"
      : preferredRail === "stripe" && stripeDestination
        ? "stripe"
        : stripeDestination
          ? "stripe"
          : paypal.email || paypal.merchantId
            ? "paypal"
            : null;

  if (!rail) {
    return {
      payoutId,
      status: "failed",
      amount,
      amountCents,
      message:
        "Missing Guru payout destination. Add Stripe Connect (stripe_account_id) or a PayPal payout account before release.",
    };
  }

  if (dryRun) {
    const destinationLabel =
      rail === "stripe"
        ? stripeDestination
        : paypal.email || paypal.merchantId;
    return {
      payoutId,
      status: "dry_run",
      amount,
      amountCents,
      message: `Dry run passed. This would send ${amountCents} cents via ${rail} to ${destinationLabel}.`,
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
    const transfer =
      rail === "stripe"
        ? await createStripeTransfer({
            payout,
            guru,
            profile,
            amountCents,
            adminUserId,
          })
        : await createPaypalPayout({
            payout,
            guru,
            profile,
            amountCents,
            adminUserId,
            paypal,
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
          `${rail === "stripe" ? "Stripe" : "PayPal"} payout was created, but Supabase could not save all release fields. Check the guru_payouts table columns.`,
      };
    }

    return {
      payoutId,
      status: "released",
      amount,
      amountCents,
      stripeTransferId: transfer.id,
      message:
        rail === "stripe"
          ? "Stripe transfer created and Supabase payout marked paid."
          : "PayPal payout created and Supabase payout marked paid.",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown payout transfer error.";

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

  if (!admin.ok) {
    return (
      admin.response ||
      NextResponse.json(
        {
          ok: false,
          error: "Finance admin access required to release payouts.",
        },
        { status: 403 },
      )
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