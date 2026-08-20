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

function hasColumn(row: DbRow, column: string) {
  return Object.prototype.hasOwnProperty.call(row, column);
}

function filterPatchToExistingColumns(row: DbRow, patch: DbRow) {
  const filtered: DbRow = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    if (hasColumn(row, key)) filtered[key] = value;
  }
  return filtered;
}

function formatUsd(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
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
    "paypal_payout_id",
    "paypal_batch_id",
    "transaction_reference",
    "external_reference",
    "provider_reference",
    "reference",
  ]);

  if (!value || value.startsWith("pending:")) return "";
  return value;
}

function getPreferredPayoutRail(row: DbRow): "stripe" | "paypal" | null {
  const marker = firstString(row, [
    "stripe_transfer_id",
    "transaction_reference",
    "reference",
  ]).toLowerCase();

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

function getStripeClient() {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) throw new Error("Missing STRIPE_SECRET_KEY.");
  return new Stripe(stripeKey);
}

async function getStripePlatformAvailableUsdCents() {
  const stripe = getStripeClient();
  const balance = await stripe.balance.retrieve();
  return balance.available
    .filter((entry) => entry.currency.toLowerCase() === "usd")
    .reduce((sum, entry) => sum + entry.amount, 0);
}

async function safeUpdateGuruPayout(
  payoutId: string,
  payoutRow: DbRow,
  patches: DbRow[],
) {
  let lastError: unknown = null;
  let attempted = false;

  for (const patch of patches) {
    const filteredPatch = filterPatchToExistingColumns(payoutRow, patch);
    if (!Object.keys(filteredPatch).length) continue;

    attempted = true;
    const { error } = await supabaseAdmin
      .from("guru_payouts")
      .update(filteredPatch)
      .eq("id", payoutId);

    if (!error) {
      return { ok: true, error: null, patch: filteredPatch };
    }

    lastError = error;
  }

  return {
    ok: false,
    error:
      lastError ||
      new Error(
        attempted
          ? "Unable to update guru_payouts."
          : "No compatible guru_payouts columns were available to update.",
      ),
    patch: null,
  };
}

async function markProcessing(payoutId: string, payoutRow: DbRow) {
  const now = new Date().toISOString();

  return safeUpdateGuruPayout(payoutId, payoutRow, [
    {
      status: "processing",
      payout_status: "processing",
      release_status: "processing",
      updated_at: now,
    },
    {
      status: "processing",
      updated_at: now,
    },
    {
      payout_status: "processing",
      updated_at: now,
    },
    {
      release_status: "processing",
      updated_at: now,
    },
    { status: "processing" },
    { payout_status: "processing" },
    { release_status: "processing" },
  ]);
}

async function markReleased({
  payoutId,
  payoutRow,
  externalReference,
  amountCents,
  rail,
}: {
  payoutId: string;
  payoutRow: DbRow;
  externalReference: string;
  amountCents: number;
  rail: "stripe" | "paypal";
}) {
  const now = new Date().toISOString();
  const statusCandidates = ["paid", "released", "completed", "complete"];
  const patches: DbRow[] = [];

  for (const terminalStatus of statusCandidates) {
    patches.push({
      status: terminalStatus,
      payout_status: terminalStatus,
      release_status: terminalStatus,
      stripe_transfer_id: rail === "stripe" ? externalReference : undefined,
      paypal_payout_id: rail === "paypal" ? externalReference : undefined,
      transaction_reference: externalReference,
      external_reference: externalReference,
      provider_reference: externalReference,
      amount_cents: amountCents,
      payout_date: now,
      released_at: now,
      paid_at: now,
      completed_at: now,
      updated_at: now,
    });

    patches.push({
      status: terminalStatus,
      payout_status: terminalStatus,
      release_status: terminalStatus,
      transaction_reference: externalReference,
      payout_date: now,
      updated_at: now,
    });

    if (rail === "stripe") {
      patches.push({
        status: terminalStatus,
        payout_status: terminalStatus,
        release_status: terminalStatus,
        stripe_transfer_id: externalReference,
        payout_date: now,
        updated_at: now,
      });
      patches.push({
        payout_status: terminalStatus,
        stripe_transfer_id: externalReference,
        payout_date: now,
      });
      patches.push({
        payout_status: terminalStatus,
        stripe_transfer_id: externalReference,
      });
    }

    if (rail === "paypal") {
      patches.push({
        status: terminalStatus,
        payout_status: terminalStatus,
        release_status: terminalStatus,
        paypal_payout_id: externalReference,
        payout_date: now,
        updated_at: now,
      });
      patches.push({
        payout_status: terminalStatus,
        stripe_transfer_id: externalReference,
        payout_date: now,
      });
      patches.push({
        payout_status: terminalStatus,
        stripe_transfer_id: externalReference,
      });
    }

    patches.push({
      status: terminalStatus,
      payout_status: terminalStatus,
      release_status: terminalStatus,
      updated_at: now,
    });
    patches.push({
      status: terminalStatus,
      payout_status: terminalStatus,
      release_status: terminalStatus,
    });
    patches.push({ payout_status: terminalStatus });
  }

  return safeUpdateGuruPayout(payoutId, payoutRow, patches);
}

async function markFailed({
  payoutId,
  payoutRow,
  failureReason,
}: {
  payoutId: string;
  payoutRow: DbRow;
  failureReason: string;
}) {
  const now = new Date().toISOString();

  return safeUpdateGuruPayout(payoutId, payoutRow, [
    {
      status: "failed",
      payout_status: "failed",
      release_status: "failed",
      failure_reason: failureReason,
      failed_at: now,
      updated_at: now,
    },
    {
      status: "failed",
      payout_status: "failed",
      release_status: "failed",
      failure_reason: failureReason,
      updated_at: now,
    },
    {
      status: "failed",
      payout_status: "failed",
      release_status: "failed",
      updated_at: now,
    },
    {
      status: "failed",
      payout_status: "failed",
      release_status: "failed",
    },
    { payout_status: "failed" },
  ]);
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

async function getProfileRecord(guruId: string, guru: DbRow | null) {
  if (!guruId && !guru) return null;

  const guruUserId = firstString(guru, ["user_id", "profile_id"]);
  const profileId = guruUserId || guruId;
  if (!profileId) return null;

  const byProfileId = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();

  if (byProfileId.data) return byProfileId.data as DbRow;

  if (guruId && guruId !== profileId) {
    const byGuruId = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", guruId)
      .maybeSingle();

    if (byGuruId.data) return byGuruId.data as DbRow;
  }

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

    const status = firstString(row, [
      "status",
      "onboarding_status",
      "account_status",
    ]).toLowerCase();

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
  const stripe = getStripeClient();
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
    { idempotencyKey },
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
      message:
        "This payout already has a Stripe/PayPal transfer reference and was skipped.",
    };
  }

  const currentStatus = getPayoutStatus(payout);

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
  const guru = await getGuruRecord(guruId);
  const profile = await getProfileRecord(guruId, guru);
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

  let stripeAvailableCents: number | null = null;

  if (rail === "stripe") {
    try {
      stripeAvailableCents = await getStripePlatformAvailableUsdCents();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to read SitGuru Stripe platform balance.";

      return {
        payoutId,
        status: "failed",
        amount,
        amountCents,
        message: `Could not verify SitGuru Stripe platform available balance. ${message}`,
      };
    }

    if (stripeAvailableCents < amountCents) {
      return {
        payoutId,
        status: "failed",
        amount,
        amountCents,
        message: `SitGuru Stripe platform available balance is ${formatUsd(
          stripeAvailableCents,
        )}, which does not cover this ${formatUsd(amountCents)} payout.`,
      };
    }
  }

  if (dryRun) {
    const destinationLabel =
      rail === "stripe"
        ? stripeDestination
        : paypal.email || paypal.merchantId;

    if (rail === "stripe") {
      return {
        payoutId,
        status: "dry_run",
        amount,
        amountCents,
        message: `Dry run passed. SitGuru Stripe available balance is ${formatUsd(
          stripeAvailableCents || 0,
        )}. This would transfer ${formatUsd(amountCents)} to ${destinationLabel}.`,
      };
    }

    return {
      payoutId,
      status: "dry_run",
      amount,
      amountCents,
      message: `Dry run passed. This would send ${formatUsd(
        amountCents,
      )} via PayPal to ${destinationLabel}. PayPal will validate available funding when released.`,
    };
  }

  const processingUpdate = await markProcessing(payoutId, payout);
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
      payoutRow: payout,
      externalReference: transfer.id,
      amountCents,
      rail,
    });

    if (!releasedUpdate.ok) {
      return {
        payoutId,
        status: "released",
        amount,
        amountCents,
        stripeTransferId: transfer.id,
        message: `${
          rail === "stripe" ? "Stripe" : "PayPal"
        } payout was created successfully, but SitGuru could not update the payout row to a terminal status. Do not release this payout again. Review guru_payouts schema and the external transfer reference.`,
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
          ? "Stripe transfer created and SitGuru payout marked paid."
          : "PayPal payout created and SitGuru payout marked paid.",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown payout transfer error.";

    await markFailed({
      payoutId,
      payoutRow: payout,
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
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const payoutIds = Array.from(
    new Set(
      [...(body.payoutIds || []), body.payoutId].filter(Boolean) as string[],
    ),
  );

  if (!payoutIds.length) {
    return NextResponse.json(
      { ok: false, error: "Provide payoutId or payoutIds." },
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
    results.push(
      await releaseOnePayout({
        payout,
        adminUserId: admin.user.id,
        dryRun: body.dryRun === true,
      }),
    );
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
