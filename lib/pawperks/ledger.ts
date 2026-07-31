/**
 * Server-side PawPerks balance + ledger helpers (service role).
 */

import { supabaseAdmin } from "@/utils/supabase/admin";
import type {
  PawPerkSourceType,
  PawPerkTransactionRow,
  PetParentPerksRow,
} from "@/lib/pawperks/constants";

function asInt(value: unknown): number {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? n : 0;
}

export async function ensureParentPerksRow(
  parentId: string,
): Promise<PetParentPerksRow> {
  const { data: existing } = await supabaseAdmin
    .from("pet_parent_perks")
    .select("*")
    .eq("parent_id", parentId)
    .maybeSingle();

  if (existing) return existing as PetParentPerksRow;

  const { data, error } = await supabaseAdmin
    .from("pet_parent_perks")
    .upsert(
      {
        parent_id: parentId,
        points_balance: 0,
        lifetime_earned: 0,
      },
      { onConflict: "parent_id" },
    )
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data || {
    parent_id: parentId,
    points_balance: 0,
    lifetime_earned: 0,
  }) as PetParentPerksRow;
}

export async function getParentPerksBalance(
  parentId: string,
): Promise<PetParentPerksRow> {
  return ensureParentPerksRow(parentId);
}

export async function listParentPerkTransactions(
  parentId: string,
  limit = 40,
): Promise<PawPerkTransactionRow[]> {
  const { data, error } = await supabaseAdmin
    .from("pawperk_transactions")
    .select("*")
    .eq("parent_id", parentId)
    .order("created_at", { ascending: false })
    .limit(Math.min(100, Math.max(1, limit)));

  if (error) throw new Error(error.message);
  return (data || []) as PawPerkTransactionRow[];
}

/**
 * Credit points from a Guru (or signup). Increases balance + lifetime_earned.
 */
export async function awardPawPerks(params: {
  parentId: string;
  points: number;
  sourceType: Extract<PawPerkSourceType, "GURU_REWARD" | "SIGNUP_BONUS">;
  memo: string;
  bookingId?: string | null;
  awardedByGuruId?: string | null;
}) {
  const points = Math.max(0, asInt(params.points));
  if (points <= 0) {
    return { ok: false as const, error: "Points must be a positive integer." };
  }

  const row = await ensureParentPerksRow(params.parentId);
  const nextBalance = asInt(row.points_balance) + points;
  const nextLifetime = asInt(row.lifetime_earned) + points;

  const { error: txError, data: tx } = await supabaseAdmin
    .from("pawperk_transactions")
    .insert({
      parent_id: params.parentId,
      points_delta: points,
      source_type: params.sourceType,
      booking_id: params.bookingId || null,
      memo: params.memo.slice(0, 280),
      awarded_by_guru_id: params.awardedByGuruId || null,
    })
    .select("*")
    .maybeSingle();

  if (txError) {
    return { ok: false as const, error: txError.message };
  }

  const { error: balError } = await supabaseAdmin
    .from("pet_parent_perks")
    .update({
      points_balance: nextBalance,
      lifetime_earned: nextLifetime,
    })
    .eq("parent_id", params.parentId);

  if (balError) {
    return { ok: false as const, error: balError.message };
  }

  return {
    ok: true as const,
    pointsAwarded: points,
    pointsBalance: nextBalance,
    lifetimeEarned: nextLifetime,
    transaction: tx as PawPerkTransactionRow,
  };
}

/**
 * Reverse a prior BOOKING_REDEMPTION for this booking (if any), then apply a new hold.
 * Called during PaymentIntent authorization so checkout never trusts client math.
 */
export async function redeemPawPerksForBooking(params: {
  parentId: string;
  bookingId: string;
  pointsToRedeem: number;
  paymentIntentId: string;
  memo?: string;
}) {
  const requested = Math.max(0, asInt(params.pointsToRedeem));
  const parentId = params.parentId;
  const bookingId = params.bookingId;

  // Reverse prior redemption hold for this booking
  const { data: prior } = await supabaseAdmin
    .from("pawperk_transactions")
    .select("*")
    .eq("booking_id", bookingId)
    .eq("source_type", "BOOKING_REDEMPTION")
    .maybeSingle();

  let row = await ensureParentPerksRow(parentId);

  if (prior && asInt((prior as PawPerkTransactionRow).points_delta) < 0) {
    const restore = Math.abs(asInt((prior as PawPerkTransactionRow).points_delta));
    const restoredBalance = asInt(row.points_balance) + restore;
    await supabaseAdmin
      .from("pet_parent_perks")
      .update({ points_balance: restoredBalance })
      .eq("parent_id", parentId);
    await supabaseAdmin
      .from("pawperk_transactions")
      .delete()
      .eq("transaction_id", (prior as PawPerkTransactionRow).transaction_id);
    row = { ...row, points_balance: restoredBalance };
  }

  if (requested <= 0) {
    return {
      ok: true as const,
      pointsRedeemed: 0,
      pointsBalance: asInt(row.points_balance),
      transaction: null,
    };
  }

  if (requested > asInt(row.points_balance)) {
    return {
      ok: false as const,
      error: "Insufficient PawPerks balance for this redemption.",
    };
  }

  const nextBalance = asInt(row.points_balance) - requested;
  const { data: tx, error: txError } = await supabaseAdmin
    .from("pawperk_transactions")
    .insert({
      parent_id: parentId,
      points_delta: -requested,
      source_type: "BOOKING_REDEMPTION",
      booking_id: bookingId,
      payment_intent_id: params.paymentIntentId,
      memo:
        params.memo ||
        `Redeemed ${requested} PawPerks at checkout for booking ${bookingId}`,
    })
    .select("*")
    .maybeSingle();

  if (txError) {
    return { ok: false as const, error: txError.message };
  }

  const { error: balError } = await supabaseAdmin
    .from("pet_parent_perks")
    .update({ points_balance: nextBalance })
    .eq("parent_id", parentId);

  if (balError) {
    return { ok: false as const, error: balError.message };
  }

  return {
    ok: true as const,
    pointsRedeemed: requested,
    pointsBalance: nextBalance,
    transaction: tx as PawPerkTransactionRow,
  };
}

/**
 * Admin compliance adjustment — credits or debits with mandatory memo.
 * pointsDelta > 0 → ADMIN_CREDIT; pointsDelta < 0 → ADMIN_DEBIT.
 */
export async function adminAdjustPawPerks(params: {
  parentId: string;
  pointsDelta: number;
  memo: string;
  adminUserId: string;
  bookingId?: string | null;
}) {
  const delta = Math.trunc(asInt(params.pointsDelta));
  if (delta === 0) {
    return { ok: false as const, error: "pointsDelta must be non-zero." };
  }

  const memo = String(params.memo || "").trim();
  if (memo.length < 8) {
    return {
      ok: false as const,
      error: "Admin adjustments require a compliance memo (min 8 chars).",
    };
  }

  const row = await ensureParentPerksRow(params.parentId);
  const current = asInt(row.points_balance);
  const nextBalance = current + delta;

  if (nextBalance < 0) {
    return {
      ok: false as const,
      error: `Debit would drive balance negative (have ${current}, delta ${delta}).`,
    };
  }

  const sourceType: PawPerkSourceType =
    delta < 0 ? "ADMIN_DEBIT" : "ADMIN_CREDIT";

  const nextLifetime =
    delta > 0 ? asInt(row.lifetime_earned) + delta : asInt(row.lifetime_earned);

  const { data: tx, error: txError } = await supabaseAdmin
    .from("pawperk_transactions")
    .insert({
      parent_id: params.parentId,
      points_delta: delta,
      source_type: sourceType,
      booking_id: params.bookingId || null,
      memo: `[admin:${params.adminUserId}] ${memo}`.slice(0, 280),
      awarded_by_guru_id: null,
    })
    .select("*")
    .maybeSingle();

  if (txError) {
    return { ok: false as const, error: txError.message };
  }

  const { error: balError } = await supabaseAdmin
    .from("pet_parent_perks")
    .update({
      points_balance: nextBalance,
      lifetime_earned: nextLifetime,
    })
    .eq("parent_id", params.parentId);

  if (balError) {
    return { ok: false as const, error: balError.message };
  }

  return {
    ok: true as const,
    sourceType,
    pointsDelta: delta,
    pointsBalance: nextBalance,
    lifetimeEarned: nextLifetime,
    transaction: tx as PawPerkTransactionRow,
  };
}
