import { NextResponse } from "next/server";

import { requireFinanceAdminApi } from "@/lib/admin/financials/access";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type DbRow = Record<string, unknown>;

type ManualPayoutType =
  | "guru"
  | "ambassador"
  | "partner"
  | "pet_parent"
  | "pawperks"
  | "referral";

type CreateManualPayoutBody = {
  payoutType?: string;
  recipientId?: string;
  guruId?: string;
  amount?: number | string;
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

function normalizePayoutType(value: unknown): ManualPayoutType | null {
  const raw = asString(value).toLowerCase().replace(/[\s-]+/g, "");

  if (raw === "guru") return "guru";
  if (raw === "ambassador") return "ambassador";
  if (raw === "partner") return "partner";
  if (
    raw === "petparent" ||
    raw === "pet_parent" ||
    raw === "customer" ||
    raw === "parent"
  ) {
    return "pet_parent";
  }
  if (raw === "pawperks" || raw === "petperks") return "pawperks";
  if (raw === "referral" || raw === "referrals") return "referral";

  return null;
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
    return status === "approved" ||
      status === "ready_for_release" ||
      status === "release_ready"
      ? "ready"
      : status;
  }

  return "ready";
}

function partnerLedgerStatus(status: string) {
  if (status === "ready" || status === "scheduled") return "approved";
  return "pending";
}

function liabilityStatus(status: string) {
  if (status === "ready" || status === "scheduled") return "approved";
  return "pending";
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

async function getAmbassadorRecord(ambassadorId: string) {
  if (!ambassadorId) return null;

  const { data } = await supabaseAdmin
    .from("ambassadors")
    .select("*")
    .eq("id", ambassadorId)
    .maybeSingle();

  return (data as DbRow | null) || null;
}

async function getPartnerRecord(partnerId: string) {
  if (!partnerId) return null;

  const { data } = await supabaseAdmin
    .from("partners")
    .select("*")
    .eq("id", partnerId)
    .maybeSingle();

  return (data as DbRow | null) || null;
}

async function createGuruPayout({
  recipientId,
  amount,
  payoutStatus,
  reason,
  createdBy,
}: {
  recipientId: string;
  amount: number;
  payoutStatus: string;
  reason: string;
  createdBy: string;
}) {
  const guru = await getGuruRecord(recipientId);

  if (!guru) {
    return NextResponse.json(
      { ok: false, error: "Guru record was not found." },
      { status: 404 },
    );
  }

  const resolvedGuruId = firstString(guru, ["id", "guru_id"]) || recipientId;
  const stripeAccountId = firstString(guru, [
    "stripe_account_id",
    "stripe_connect_account_id",
    "connected_account_id",
    "stripe_connected_account_id",
  ]);
  const recipientName =
    firstString(guru, ["display_name", "full_name", "name"]) || "Guru";
  const recipientEmail = firstString(guru, ["email"]);

  if (!stripeAccountId) {
    return NextResponse.json(
      {
        ok: false,
        error: `${recipientName} does not have a Stripe connected account saved. Add stripe_account_id before creating a releasable payout.`,
      },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("guru_payouts")
    .insert({
      guru_id: resolvedGuruId,
      booking_id: null,
      stripe_transfer_id: null,
      gross_amount: amount,
      sitguru_fee_amount: 0,
      net_amount: amount,
      payout_status: payoutStatus,
      payout_date: null,
    })
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
      payoutType: "guru",
      recipientId: resolvedGuruId,
      recipientName,
      recipientEmail,
      guruId: resolvedGuruId,
      guruName: recipientName,
      amount,
      netAmount: amount,
      payoutStatus,
      reason,
      stripeAccountId,
      stripeTransferId: null,
      canRelease: true,
      ledgerSource: "guru_payouts",
      createdBy,
      createdAt: firstString(payout, ["created_at"]) || new Date().toISOString(),
      warning:
        "Dry-run before Release. Do not release until SitGuru Stripe platform available balance covers this amount.",
    },
  });
}

async function createPartnerLedgerPayout({
  payoutType,
  recipientId,
  amount,
  payoutStatus,
  reason,
  createdBy,
}: {
  payoutType: "ambassador" | "partner";
  recipientId: string;
  amount: number;
  payoutStatus: string;
  reason: string;
  createdBy: string;
}) {
  const record =
    payoutType === "ambassador"
      ? await getAmbassadorRecord(recipientId)
      : await getPartnerRecord(recipientId);

  if (!record) {
    return NextResponse.json(
      {
        ok: false,
        error: `${payoutType === "ambassador" ? "Ambassador" : "Partner"} record was not found.`,
      },
      { status: 404 },
    );
  }

  const recipientName =
    firstString(record, [
      "display_name",
      "full_name",
      "business_name",
      "contact_name",
      "name",
    ]) || (payoutType === "ambassador" ? "Ambassador" : "Partner");
  const recipientEmail = firstString(record, ["email"]);
  const recipientUserId = firstString(record, [
    "user_id",
    "owner_user_id",
  ]);
  const ledgerStatus = partnerLedgerStatus(payoutStatus);

  const insertPayload: Record<string, unknown> = {
    payout_type: payoutType,
    partner_id: payoutType === "partner" ? recipientId : null,
    ambassador_id: payoutType === "ambassador" ? recipientId : null,
    recipient_user_id: recipientUserId || null,
    recipient_name: recipientName,
    recipient_email: recipientEmail || null,
    amount,
    currency: "usd",
    status: ledgerStatus,
    payout_method: "manual",
    admin_notes: reason,
    approved_by: ledgerStatus === "approved" ? createdBy : null,
    approved_at: ledgerStatus === "approved" ? new Date().toISOString() : null,
  };

  const { data, error } = await supabaseAdmin
    .from("partner_payouts")
    .insert(insertPayload)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not create partner_payouts row.",
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
      payoutType,
      recipientId,
      recipientName,
      recipientEmail,
      amount,
      netAmount: amount,
      payoutStatus: ledgerStatus,
      reason,
      canRelease: false,
      ledgerSource: "partner_payouts",
      createdBy,
      createdAt: firstString(payout, ["created_at"]) || new Date().toISOString(),
      warning:
        "Queued in partner_payouts for admin review. Stripe Release applies to Guru payouts only.",
    },
  });
}

async function createPetParentCreditPayout({
  recipientId,
  amount,
  payoutStatus,
  reason,
  createdBy,
}: {
  recipientId: string;
  amount: number;
  payoutStatus: string;
  reason: string;
  createdBy: string;
}) {
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, user_id, full_name, display_name, name, email, role, account_type")
    .or(`id.eq.${recipientId},user_id.eq.${recipientId}`)
    .limit(1)
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json(
      { ok: false, error: "Pet Parent profile was not found." },
      { status: 404 },
    );
  }

  const row = profile as DbRow;
  const role = firstString(row, ["role", "account_type"])
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  const isPetParent =
    role === "customer" ||
    role === "pet_parent" ||
    role === "petparent" ||
    role === "parent" ||
    role === "client";

  if (!isPetParent) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Selected recipient is not a Pet Parent profile. Choose Pet Parent payout type for customer accounts.",
      },
      { status: 400 },
    );
  }

  const recipientName =
    firstString(row, ["full_name", "display_name", "name"]) || "Pet Parent";
  const recipientEmail = firstString(row, ["email"]);
  const referrerUserId = firstString(row, ["id", "user_id"]) || recipientId;
  const status = liabilityStatus(payoutStatus);

  const insertPayload: Record<string, unknown> = {
    referrer_user_id: referrerUserId,
    partner_id: null,
    ambassador_id: null,
    reward_type: "welcome_bonus_account_credit",
    amount,
    currency: "usd",
    status,
    admin_notes: reason,
    approved_by: status === "approved" ? createdBy : null,
    approved_at: status === "approved" ? new Date().toISOString() : null,
    normalized_status: status,
    normalized_amount: amount,
    financial_treatment: "account_credit",
    financial_category: "marketing_welcome_bonus",
    source_table: "manual_admin_pet_parent_credit",
  };

  const { data, error } = await supabaseAdmin
    .from("admin_referral_reward_liability")
    .insert(insertPayload)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not create Pet Parent account-credit liability row.",
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
      payoutType: "pet_parent",
      recipientId: referrerUserId,
      recipientName,
      recipientEmail,
      amount,
      netAmount: amount,
      payoutStatus: status,
      reason,
      canRelease: false,
      ledgerSource: "admin_referral_reward_liability",
      createdBy,
      createdAt: firstString(payout, ["created_at"]) || new Date().toISOString(),
      warning:
        "Queued as SitGuru account credit / Welcome Bonus liability. Not a Stripe connected-account transfer.",
    },
  });
}

async function createReferralLiabilityPayout({
  payoutType,
  recipientId,
  amount,
  payoutStatus,
  reason,
  createdBy,
}: {
  payoutType: "pawperks" | "referral";
  recipientId: string;
  amount: number;
  payoutStatus: string;
  reason: string;
  createdBy: string;
}) {
  // Recipient may be a guru, ambassador, partner, or profile/user id.
  const [guru, ambassador, partner, profile] = await Promise.all([
    getGuruRecord(recipientId),
    getAmbassadorRecord(recipientId),
    getPartnerRecord(recipientId),
    supabaseAdmin
      .from("profiles")
      .select("id, full_name, display_name, name, email")
      .eq("id", recipientId)
      .maybeSingle()
      .then((result) => (result.data as DbRow | null) || null),
  ]);

  const record = guru || ambassador || partner || profile;

  if (!record) {
    return NextResponse.json(
      { ok: false, error: "Recipient record was not found." },
      { status: 404 },
    );
  }

  const recipientName =
    firstString(record, [
      "display_name",
      "full_name",
      "business_name",
      "contact_name",
      "name",
    ]) || (payoutType === "pawperks" ? "PawPerks recipient" : "Referral recipient");
  const recipientEmail = firstString(record, ["email"]);
  const referrerUserId =
    firstString(record, ["user_id", "owner_user_id", "id"]) || recipientId;
  const status = liabilityStatus(payoutStatus);
  const financialCategory = payoutType === "pawperks" ? "pawperks" : "referral";
  const rewardType = payoutType === "pawperks" ? "pawperks" : "referral";

  const insertPayload: Record<string, unknown> = {
    referrer_user_id: referrerUserId,
    partner_id: partner ? recipientId : null,
    ambassador_id: ambassador ? recipientId : null,
    reward_type: rewardType,
    amount,
    currency: "usd",
    status,
    admin_notes: reason,
    approved_by: status === "approved" ? createdBy : null,
    approved_at: status === "approved" ? new Date().toISOString() : null,
    normalized_status: status,
    normalized_amount: amount,
    financial_treatment: "manual_payout",
    financial_category: financialCategory,
    source_table: "manual_admin_payout",
  };

  const { data, error } = await supabaseAdmin
    .from("admin_referral_reward_liability")
    .insert(insertPayload)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not create referral/PawPerks liability row.",
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
      payoutType,
      recipientId,
      recipientName,
      recipientEmail,
      amount,
      netAmount: amount,
      payoutStatus: status,
      reason,
      canRelease: false,
      ledgerSource: "admin_referral_reward_liability",
      createdBy,
      createdAt: firstString(payout, ["created_at"]) || new Date().toISOString(),
      warning:
        "Queued in referral/PawPerks liability for admin review. Stripe Release applies to Guru payouts only.",
    },
  });
}

export async function POST(request: Request) {
  const financeCheck = await requireFinanceAdminApi();

  if (!financeCheck.identity) {
    return (
      financeCheck.response ||
      NextResponse.json(
        {
          ok: false,
          error: "Finance admin access required to create manual payouts.",
        },
        { status: 403 },
      )
    );
  }

  let body: CreateManualPayoutBody;

  try {
    body = (await request.json()) as CreateManualPayoutBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const payoutType =
    normalizePayoutType(body.payoutType) ||
    (asString(body.guruId) ? "guru" : null);
  const recipientId = asString(body.recipientId) || asString(body.guruId);
  const amount = asNumber(body.amount);
  const reason = asString(body.reason) || "Manual SitGuru payout";
  const payoutStatus = normalizeReleaseStatus(body.status);
  const createdBy = financeCheck.identity.id;

  if (!payoutType) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Select a payout type: Guru, Ambassador, Partner, Pet Parent, PawPerks, or Referrals.",
      },
      { status: 400 },
    );
  }

  if (!recipientId) {
    return NextResponse.json(
      { ok: false, error: "Select a recipient before creating a payout." },
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

  if (payoutType === "guru") {
    return createGuruPayout({
      recipientId,
      amount,
      payoutStatus,
      reason,
      createdBy,
    });
  }

  if (payoutType === "ambassador" || payoutType === "partner") {
    return createPartnerLedgerPayout({
      payoutType,
      recipientId,
      amount,
      payoutStatus,
      reason,
      createdBy,
    });
  }

  if (payoutType === "pet_parent") {
    return createPetParentCreditPayout({
      recipientId,
      amount,
      payoutStatus,
      reason,
      createdBy,
    });
  }

  return createReferralLiabilityPayout({
    payoutType,
    recipientId,
    amount,
    payoutStatus,
    reason,
    createdBy,
  });
}
