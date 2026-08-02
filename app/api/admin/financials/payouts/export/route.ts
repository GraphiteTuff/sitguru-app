import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireFinanceAdminApi } from "@/lib/admin/financials/access";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AnyRow = Record<string, unknown>;

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[$,()]/g, "").trim();
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) {
      return value.includes("(") && value.includes(")") ? -parsed : parsed;
    }
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function centsToDollars(value: unknown) {
  return toNumber(value) / 100;
}

function firstNumber(row: AnyRow, keys: string[]) {
  for (const key of keys) {
    const value = toNumber(row[key]);
    if (value > 0) return value;
  }
  return 0;
}

function amountDollars(row: AnyRow, amountInCents = false) {
  const fromCents = firstNumber(row, [
    "amount_cents",
    "payout_amount_cents",
    "guru_net_amount_cents",
    "net_amount_cents",
    "commission_amount_cents",
  ]);
  if (fromCents > 0) return fromCents / 100;

  const raw = firstNumber(row, [
    "amount",
    "payout_amount",
    "commission_amount",
    "reward_amount",
    "credit_amount",
    "total_amount",
    "net_amount",
    "normalized_amount",
  ]);

  if (amountInCents && raw > 0) return raw / 100;
  return raw;
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string,
): Promise<T[]> {
  try {
    const result = await query;
    if (result.error) {
      console.warn(`Payouts export query skipped for ${label}:`, result.error);
      return [];
    }
    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Payouts export query skipped for ${label}:`, error);
    return [];
  }
}

function mapRows(
  rows: AnyRow[],
  source: string,
  amountInCents = false,
) {
  return rows.map((row) => ({
    source,
    id: asTrimmedString(row.id) || asTrimmedString(row.payout_id),
    party_id:
      asTrimmedString(row.guru_id) ||
      asTrimmedString(row.partner_id) ||
      asTrimmedString(row.user_id) ||
      asTrimmedString(row.recipient_id) ||
      "",
    amount: amountDollars(row, amountInCents),
    status:
      asTrimmedString(row.status) ||
      asTrimmedString(row.payout_status) ||
      asTrimmedString(row.reward_status) ||
      "pending",
    currency: asTrimmedString(row.currency) || "USD",
    created_at:
      asTrimmedString(row.created_at) ||
      asTrimmedString(row.paid_at) ||
      asTrimmedString(row.issued_at) ||
      "",
    paid_at: asTrimmedString(row.paid_at) || "",
    booking_id:
      asTrimmedString(row.booking_id) || asTrimmedString(row.bookingId) || "",
    provider:
      asTrimmedString(row.provider) ||
      (source.includes("stripe") ? "stripe" : source),
    notes:
      asTrimmedString(row.notes) ||
      asTrimmedString(row.financial_treatment) ||
      "",
  }));
}

export async function GET(request: NextRequest) {
  const financeCheck = await requireFinanceAdminApi();
  if (!financeCheck.identity) return financeCheck.response;

  const format = String(
    request.nextUrl.searchParams.get("format") || "csv",
  ).toLowerCase();

  const [
    guruPayouts,
    partnerPayouts,
    genericPayouts,
    commissions,
    partnerCommissions,
    referralRewards,
    bookingPayments,
    stripePayouts,
  ] = await Promise.all([
    safeRows<AnyRow>(
      supabaseAdmin.from("guru_payouts").select("*").limit(5000),
      "guru_payouts",
    ),
    safeRows<AnyRow>(
      supabaseAdmin.from("partner_payouts").select("*").limit(5000),
      "partner_payouts",
    ),
    safeRows<AnyRow>(
      supabaseAdmin.from("payouts").select("*").limit(5000),
      "payouts",
    ),
    safeRows<AnyRow>(
      supabaseAdmin.from("commissions").select("*").limit(2500),
      "commissions",
    ),
    safeRows<AnyRow>(
      supabaseAdmin.from("partner_commissions").select("*").limit(2500),
      "partner_commissions",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("admin_referral_reward_liability")
        .select("*")
        .limit(2500),
      "admin_referral_reward_liability",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("booking_payments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
      "booking_payments",
    ),
    safeRows<AnyRow>(
      supabaseAdmin.from("stripe_payouts").select("*").limit(2500),
      "stripe_payouts",
    ),
  ]);

  const rows = [
    ...mapRows(guruPayouts, "guru_payouts"),
    ...mapRows(partnerPayouts, "partner_payouts"),
    ...mapRows(genericPayouts, "payouts"),
    ...mapRows(commissions, "commissions"),
    ...mapRows(partnerCommissions, "partner_commissions"),
    ...mapRows(referralRewards, "admin_referral_reward_liability"),
    ...mapRows(
      bookingPayments.map((row) => ({
        ...row,
        amount:
          centsToDollars(row.marketplace_support_cents) ||
          centsToDollars(row.amount_cents) ||
          toNumber(row.amount),
        status: row.status,
        provider: "stripe",
      })),
      "booking_payments",
    ),
    ...mapRows(stripePayouts, "stripe_payouts", true),
  ].filter((row) => row.amount > 0 || row.id);

  try {
    await supabaseAdmin.from("financial_audit_logs").insert({
      actor_id: financeCheck.identity.id,
      actor_email: financeCheck.identity.email,
      actor_role: financeCheck.identity.role,
      action: "export_payouts",
      area: "financials.payouts.export",
      target_type: "payouts",
      metadata: { format, rowCount: rows.length },
      created_at: new Date().toISOString(),
    });
  } catch {
    // Audit tables may not exist in every environment.
  }

  if (format === "json") {
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      count: rows.length,
      rows,
    });
  }

  const header = [
    "source",
    "id",
    "party_id",
    "amount",
    "status",
    "currency",
    "created_at",
    "paid_at",
    "booking_id",
    "provider",
    "notes",
  ];

  const csv = [
    header.join(","),
    ...rows.map((row) =>
      header
        .map((key) =>
          csvEscape(
            key === "amount"
              ? Number((row as AnyRow)[key] || 0).toFixed(2)
              : (row as AnyRow)[key],
          ),
        )
        .join(","),
    ),
  ].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sitguru-payouts-export.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
