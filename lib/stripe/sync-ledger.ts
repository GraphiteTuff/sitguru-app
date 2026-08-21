/**
 * Sync Stripe platform ledger into Supabase finance tables.
 * SERVER ONLY — service role writes; never import from client.
 */

import type Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getStripeServer } from "@/lib/stripe/server";

function centsToDollars(cents: number | null | undefined) {
  if (typeof cents !== "number" || !Number.isFinite(cents)) return 0;
  return cents / 100;
}

function unixToIso(seconds: number | null | undefined) {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }
  return new Date(seconds * 1000).toISOString();
}

function unixToDate(seconds: number | null | undefined) {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }
  return new Date(seconds * 1000).toISOString().slice(0, 10);
}

function mapBalanceTxnType(typeRaw: string) {
  const type = typeRaw.toLowerCase();
  if (type.includes("refund")) return "refund";
  if (type.includes("dispute") || type.includes("chargeback")) return "dispute";
  if (type.includes("fee") || type === "stripe_fee") return "fee";
  if (type.includes("payout") || type.includes("transfer")) return "transfer";
  if (type.includes("adjustment")) return "adjustment";
  if (type.includes("charge") || type === "payment") return "payment";
  return type || "payment";
}

function mapBalanceTxnStatus(txn: Stripe.BalanceTransaction) {
  const type = String(txn.type || "").toLowerCase();
  if (type.includes("refund")) return "refunded";
  if (type.includes("dispute") || type.includes("chargeback")) return "disputed";
  if (String(txn.status || "").toLowerCase() === "available") return "paid";
  return String(txn.status || "pending").toLowerCase() || "pending";
}

function sourceId(source: Stripe.BalanceTransaction["source"]) {
  if (!source) return null;
  if (typeof source === "string") return source;
  if (typeof source === "object" && source && "id" in source) {
    return String((source as { id?: string }).id || "") || null;
  }
  return null;
}

function sourceType(source: Stripe.BalanceTransaction["source"]) {
  if (!source || typeof source === "string") return null;
  if (typeof source === "object" && source && "object" in source) {
    return String((source as { object?: string }).object || "") || null;
  }
  return null;
}

async function listAllBalanceTransactions(stripe: Stripe, limit = 200) {
  const rows: Stripe.BalanceTransaction[] = [];
  let startingAfter: string | undefined;

  while (rows.length < limit) {
    const page = await stripe.balanceTransactions.list({
      limit: Math.min(100, limit - rows.length),
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    rows.push(...(page.data || []));
    if (!page.has_more || !page.data?.length) break;
    startingAfter = page.data[page.data.length - 1]?.id;
  }

  return rows;
}

async function listAllPayouts(stripe: Stripe, limit = 100) {
  const rows: Stripe.Payout[] = [];
  let startingAfter: string | undefined;

  while (rows.length < limit) {
    const page = await stripe.payouts.list({
      limit: Math.min(100, limit - rows.length),
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    rows.push(...(page.data || []));
    if (!page.has_more || !page.data?.length) break;
    startingAfter = page.data[page.data.length - 1]?.id;
  }

  return rows;
}

export function balanceTransactionToRows(txn: Stripe.BalanceTransaction) {
  const amountCents = txn.amount ?? 0;
  const feeCents = txn.fee ?? 0;
  const netCents = txn.net ?? 0;
  const now = new Date().toISOString();
  const type = mapBalanceTxnType(String(txn.type || ""));
  const status = mapBalanceTxnStatus(txn);
  const srcId = sourceId(txn.source);
  const srcType = sourceType(txn.source);

  const balanceRow = {
    stripe_balance_transaction_id: txn.id,
    stripe_payout_external_id:
      type === "transfer" || type === "payout" ? srcId : null,
    stripe_source_id: srcId,
    stripe_source_type: srcType,
    type: txn.type || type,
    reporting_category: txn.reporting_category || null,
    description: txn.description || `Stripe ${txn.type}`,
    amount: centsToDollars(amountCents),
    fee: centsToDollars(feeCents),
    net: centsToDollars(netCents),
    currency: String(txn.currency || "usd").toLowerCase(),
    status: txn.status || status,
    available_on: unixToDate(txn.available_on),
    created_stripe_at: unixToIso(txn.created),
    metadata: {},
    raw: txn as unknown as Record<string, unknown>,
    updated_at: now,
  };

  const transactionRow = {
    stripe_transaction_id: txn.id,
    stripe_charge_id: srcType === "charge" ? srcId : null,
    stripe_payment_intent_id: srcType === "payment_intent" ? srcId : null,
    stripe_balance_transaction_id: txn.id,
    stripe_customer_id: null as string | null,
    stripe_payout_external_id:
      type === "transfer" || type === "payout" ? srcId : null,
    booking_id: null as string | null,
    type,
    status,
    description: txn.description || `Stripe ${txn.type}`,
    amount: centsToDollars(amountCents),
    fee: centsToDollars(feeCents),
    net: centsToDollars(netCents),
    amount_cents: amountCents,
    fee_cents: feeCents,
    net_cents: netCents,
    currency: String(txn.currency || "usd").toLowerCase(),
    available_on: unixToDate(txn.available_on),
    created_stripe_at: unixToIso(txn.created),
    metadata: {
      stripe_type: txn.type || null,
      reporting_category: txn.reporting_category || null,
      source_type: srcType,
    },
    raw: txn as unknown as Record<string, unknown>,
    updated_at: now,
  };

  return { balanceRow, transactionRow };
}

export function payoutToRow(payout: Stripe.Payout) {
  return {
    stripe_payout_id: payout.id,
    amount: centsToDollars(payout.amount),
    currency: String(payout.currency || "usd").toLowerCase(),
    arrival_date: unixToDate(payout.arrival_date),
    created_stripe_at: unixToIso(payout.created),
    status: payout.status || null,
    type: payout.type || null,
    method: payout.method || null,
    description: payout.description || null,
    statement_descriptor: payout.statement_descriptor || null,
    destination:
      typeof payout.destination === "string"
        ? payout.destination
        : payout.destination &&
            typeof payout.destination === "object" &&
            "id" in payout.destination
          ? String((payout.destination as { id?: string }).id || "")
          : null,
    failure_code: payout.failure_code || null,
    failure_message: payout.failure_message || null,
    automatic: Boolean(payout.automatic),
    metadata: {},
    raw: payout as unknown as Record<string, unknown>,
    updated_at: new Date().toISOString(),
  };
}

export async function upsertStripeTransactionFromBalanceTxn(
  txn: Stripe.BalanceTransaction,
) {
  const { balanceRow, transactionRow } = balanceTransactionToRows(txn);

  const [balanceWrite, txnWrite] = await Promise.all([
    supabaseAdmin.from("stripe_balance_transactions").upsert(balanceRow, {
      onConflict: "stripe_balance_transaction_id",
    }),
    supabaseAdmin.from("stripe_transactions").upsert(transactionRow, {
      onConflict: "stripe_transaction_id",
    }),
  ]);

  if (balanceWrite.error) {
    console.error("stripe_balance_transactions upsert failed:", balanceWrite.error);
  }
  if (txnWrite.error) {
    console.error("stripe_transactions upsert failed:", txnWrite.error);
  }

  return {
    ok: !balanceWrite.error && !txnWrite.error,
    balanceError: balanceWrite.error?.message || null,
    transactionError: txnWrite.error?.message || null,
  };
}

export type SyncStripeLedgerResult = {
  ok: boolean;
  balanceTransactionsSynced: number;
  payoutsSynced: number;
  stripeTransactionsSynced: number;
  errors: string[];
  message: string;
};

export async function syncStripeLedger(options?: {
  balanceLimit?: number;
  payoutLimit?: number;
}): Promise<SyncStripeLedgerResult> {
  const errors: string[] = [];
  const balanceLimit = options?.balanceLimit ?? 200;
  const payoutLimit = options?.payoutLimit ?? 100;

  let stripe: Stripe;
  try {
    stripe = getStripeServer();
  } catch (error) {
    return {
      ok: false,
      balanceTransactionsSynced: 0,
      payoutsSynced: 0,
      stripeTransactionsSynced: 0,
      errors: [
        error instanceof Error ? error.message : "Missing STRIPE_SECRET_KEY",
      ],
      message: "Stripe client unavailable",
    };
  }

  const [balanceTxns, payouts] = await Promise.all([
    listAllBalanceTransactions(stripe, balanceLimit),
    listAllPayouts(stripe, payoutLimit),
  ]);

  let balanceTransactionsSynced = 0;
  let stripeTransactionsSynced = 0;
  let payoutsSynced = 0;

  for (const txn of balanceTxns) {
    const result = await upsertStripeTransactionFromBalanceTxn(txn);
    if (result.ok) {
      balanceTransactionsSynced += 1;
      stripeTransactionsSynced += 1;
    } else {
      if (result.balanceError) errors.push(result.balanceError);
      if (result.transactionError) errors.push(result.transactionError);
    }
  }

  for (const payout of payouts) {
    const row = payoutToRow(payout);
    const { error } = await supabaseAdmin.from("stripe_payouts").upsert(row, {
      onConflict: "stripe_payout_id",
    });
    if (error) {
      errors.push(error.message);
    } else {
      payoutsSynced += 1;
    }
  }

  const ok = errors.length === 0;
  return {
    ok,
    balanceTransactionsSynced,
    payoutsSynced,
    stripeTransactionsSynced,
    errors: [...new Set(errors)].slice(0, 10),
    message: ok
      ? `Synced ${stripeTransactionsSynced} stripe_transactions, ${balanceTransactionsSynced} balance txns, ${payoutsSynced} payouts.`
      : `Partial sync: ${stripeTransactionsSynced} transactions · ${errors.length} error(s).`,
  };
}
