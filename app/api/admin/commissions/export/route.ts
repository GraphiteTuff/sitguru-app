import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireFinanceAdminApi } from "@/lib/admin/financials/access";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AnyRow = Record<string, unknown>;

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

type ExportRow = {
  section: string;
  bookingId: string;
  party: string;
  source: string;
  status: string;
  gross: number;
  platformFee: number;
  partnerCommission: number;
  guruNet: number;
  amount: number;
  createdAt: string;
  notes: string;
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

function firstNumber(row: AnyRow | undefined, keys: string[]) {
  if (!row) return 0;
  for (const key of keys) {
    const value = toNumber(row[key]);
    if (value > 0) return value;
  }
  return 0;
}

function firstString(row: AnyRow | undefined, keys: string[]) {
  if (!row) return "";
  for (const key of keys) {
    const value = asTrimmedString(row[key]);
    if (value) return value;
  }
  return "";
}

function money(value: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value || 0));
  return value < 0 ? `(${formatted})` : formatted;
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function htmlEscape(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string,
): Promise<T[]> {
  try {
    const result = await query;
    if (result.error) {
      console.warn(`Commissions export query skipped for ${label}:`, result.error);
      return [];
    }
    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Commissions export query skipped for ${label}:`, error);
    return [];
  }
}

function bookingIdFrom(row: AnyRow) {
  return firstString(row, ["booking_id", "bookingId", "id"]);
}

async function buildRows(): Promise<ExportRow[]> {
  const [
    bookings,
    bookingPayments,
    commissions,
    partnerCommissions,
    guruPayouts,
    partnerPayouts,
    referralRewards,
  ] = await Promise.all([
    safeRows<AnyRow>(
      supabaseAdmin.from("bookings").select("*").limit(2000),
      "bookings",
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
      supabaseAdmin.from("commissions").select("*").limit(2500),
      "commissions",
    ),
    safeRows<AnyRow>(
      supabaseAdmin.from("partner_commissions").select("*").limit(2500),
      "partner_commissions",
    ),
    safeRows<AnyRow>(
      supabaseAdmin.from("guru_payouts").select("*").limit(2500),
      "guru_payouts",
    ),
    safeRows<AnyRow>(
      supabaseAdmin.from("partner_payouts").select("*").limit(2500),
      "partner_payouts",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("admin_referral_reward_liability")
        .select("*")
        .limit(2500),
      "admin_referral_reward_liability",
    ),
  ]);

  const paymentByBooking = new Map<string, AnyRow>();
  for (const row of bookingPayments) {
    const id = firstString(row, ["booking_id", "bookingId"]);
    if (id && !paymentByBooking.has(id)) paymentByBooking.set(id, row);
  }

  const commissionByBooking = new Map<string, AnyRow>();
  for (const row of [...commissions, ...partnerCommissions]) {
    const id = firstString(row, ["booking_id", "bookingId"]);
    if (id && !commissionByBooking.has(id)) commissionByBooking.set(id, row);
  }

  const guruPayoutByBooking = new Map<string, AnyRow>();
  for (const row of guruPayouts) {
    const id = firstString(row, ["booking_id", "bookingId"]);
    if (id && !guruPayoutByBooking.has(id)) guruPayoutByBooking.set(id, row);
  }

  const partnerPayoutByBooking = new Map<string, AnyRow>();
  for (const row of partnerPayouts) {
    const id = firstString(row, ["booking_id", "bookingId"]);
    if (id && !partnerPayoutByBooking.has(id)) partnerPayoutByBooking.set(id, row);
  }

  const bookingRows: ExportRow[] = bookings.map((booking) => {
    const bookingId = bookingIdFrom(booking);
    const payment = paymentByBooking.get(bookingId);
    const commission = commissionByBooking.get(bookingId);
    const guruPayout = guruPayoutByBooking.get(bookingId);
    const partnerPayout = partnerPayoutByBooking.get(bookingId);

    const gross =
      (payment
        ? centsToDollars(payment.amount_cents) ||
          centsToDollars(payment.gross_amount_cents) ||
          toNumber(payment.amount)
        : 0) ||
      firstNumber(booking, [
        "gross_amount",
        "subtotal_amount",
        "total_amount",
        "amount",
        "price",
        "booking_amount",
        "total",
      ]);

    const platformFee =
      (payment
        ? centsToDollars(payment.marketplace_support_cents) ||
          centsToDollars(payment.platform_fee_cents) ||
          toNumber(payment.platform_fee)
        : 0) ||
      firstNumber(booking, [
        "sitguru_fee_amount",
        "platform_fee",
        "platform_fee_amount",
        "service_fee",
      ]) ||
      (gross > 0 ? gross * 0.08 : 0);

    const partnerCommission =
      firstNumber(commission, [
        "amount",
        "commission_amount",
        "partner_commission_amount",
        "payout_amount",
      ]) ||
      firstNumber(partnerPayout, [
        "amount",
        "payout_amount",
        "commission_amount",
      ]) ||
      firstNumber(booking, [
        "partner_commission_amount",
        "affiliate_commission_amount",
        "commission_amount",
      ]);

    const guruNet =
      firstNumber(guruPayout, [
        "amount",
        "payout_amount",
        "guru_net_amount",
        "net_amount",
      ]) ||
      firstNumber(booking, ["guru_net_amount", "guru_payout_amount", "net_amount"]) ||
      Math.max(0, gross - platformFee - partnerCommission);

    return {
      section: "Booking Ledger",
      bookingId,
      party:
        firstString(booking, ["guru_name", "sitter_name", "provider_name"]) ||
        "Guru",
      source: payment ? "booking_payments" : "bookings",
      status:
        firstString(payment, ["status"]) ||
        firstString(guruPayout, ["status", "payout_status"]) ||
        firstString(booking, ["payment_status", "status"]) ||
        "pending",
      gross,
      platformFee,
      partnerCommission,
      guruNet,
      amount: guruNet,
      createdAt:
        firstString(payment, ["created_at", "paid_at"]) ||
        firstString(booking, ["created_at", "completed_at"]) ||
        "",
      notes: payment
        ? "Platform fee preferred from booking_payments.marketplace_support_cents."
        : "Fallback booking estimate; confirm against Stripe booking_payments.",
    };
  });

  const commissionLedgerRows: ExportRow[] = [
    ...commissions.map((row) => {
      const amount =
        firstNumber(row, [
          "amount",
          "commission_amount",
          "partner_commission_amount",
          "payout_amount",
        ]) || centsToDollars(row.amount_cents);
      return {
        section: "Commission Ledger",
        bookingId: firstString(row, ["booking_id", "bookingId"]),
        party:
          firstString(row, [
            "partner_name",
            "ambassador_name",
            "recipient_name",
            "name",
          ]) || "Commission party",
        source: "commissions",
        status: firstString(row, ["status", "payout_status"]) || "pending",
        gross: 0,
        platformFee: 0,
        partnerCommission: amount,
        guruNet: 0,
        amount,
        createdAt: firstString(row, ["created_at", "paid_at", "issued_at"]),
        notes: "Canonical commissions table row.",
      };
    }),
    ...partnerCommissions.map((row) => {
      const amount =
        firstNumber(row, [
          "amount",
          "commission_amount",
          "partner_commission_amount",
          "payout_amount",
        ]) || centsToDollars(row.amount_cents);
      return {
        section: "Partner Commission Ledger",
        bookingId: firstString(row, ["booking_id", "bookingId"]),
        party:
          firstString(row, [
            "partner_name",
            "ambassador_name",
            "recipient_name",
            "name",
          ]) || "Partner",
        source: "partner_commissions",
        status: firstString(row, ["status", "payout_status"]) || "pending",
        gross: 0,
        platformFee: 0,
        partnerCommission: amount,
        guruNet: 0,
        amount,
        createdAt: firstString(row, ["created_at", "paid_at", "issued_at"]),
        notes: "Canonical partner_commissions table row.",
      };
    }),
  ];

  const rewardRows: ExportRow[] = referralRewards.map((row) => {
    const amount = Math.abs(
      toNumber(row.normalized_amount) ||
        toNumber(row.reward_amount) ||
        toNumber(row.amount) ||
        toNumber(row.total_amount),
    );
    return {
      section: "Referral Rewards",
      bookingId: firstString(row, ["booking_id", "referral_code"]),
      party:
        firstString(row, [
          "recipient_name",
          "guru_name",
          "ambassador_name",
          "partner_name",
          "name",
        ]) || "Reward recipient",
      source: "admin_referral_reward_liability",
      status:
        firstString(row, [
          "normalized_status",
          "reward_status",
          "financial_treatment",
          "status",
        ]) || "pending",
      gross: 0,
      platformFee: 0,
      partnerCommission: 0,
      guruNet: 0,
      amount,
      createdAt: firstString(row, ["created_at", "issued_at", "paid_at"]),
      notes:
        firstString(row, ["financial_treatment", "financial_category"]) ||
        "Referral / PawPerks reward support.",
    };
  });

  return [...bookingRows, ...commissionLedgerRows, ...rewardRows];
}

function normalizeFormat(format: string | null) {
  const normalized = asTrimmedString(format).toLowerCase();
  if (["excel", "xls", "xlsx"].includes(normalized)) return "excel";
  if (["word", "doc", "docx"].includes(normalized)) return "word";
  if (["pdf", "html"].includes(normalized)) return "pdf";
  if (normalized === "json") return "json";
  return "csv";
}

function buildCsv(rows: ExportRow[]) {
  const header = [
    "Section",
    "Booking ID",
    "Party",
    "Source",
    "Status",
    "Gross",
    "Platform Fee",
    "Partner Commission",
    "Guru Net",
    "Amount",
    "Created At",
    "Notes",
  ];

  return [
    header.join(","),
    ...rows.map((row) =>
      [
        row.section,
        row.bookingId,
        row.party,
        row.source,
        row.status,
        row.gross.toFixed(2),
        row.platformFee.toFixed(2),
        row.partnerCommission.toFixed(2),
        row.guruNet.toFixed(2),
        row.amount.toFixed(2),
        row.createdAt,
        row.notes,
      ]
        .map(csvEscape)
        .join(","),
    ),
  ].join("\n");
}

function buildHtml(rows: ExportRow[], mode: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>SitGuru Commissions Export</title>
  <style>
    body { font-family: 'Plus Jakarta Sans', Arial, Helvetica, sans-serif; color: #163127; padding: 24px; }
    h1 { color: #0D5C3A; }
    table { width: 100%; border-collapse: collapse; margin-top: 18px; font-size: 12px; }
    th, td { border: 1px solid #d7e5dc; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #eef7f1; }
    .right { text-align: right; }
    .meta { color: #5b6b63; font-size: 13px; }
  </style>
</head>
<body>
  <h1>SitGuru Commissions Export</h1>
  <p class="meta">Format: ${htmlEscape(mode)} · Rows: ${rows.length} · Generated ${htmlEscape(new Date().toISOString())}</p>
  <table>
    <thead>
      <tr>
        <th>Section</th>
        <th>Booking</th>
        <th>Party</th>
        <th>Source</th>
        <th>Status</th>
        <th class="right">Gross</th>
        <th class="right">Platform Fee</th>
        <th class="right">Partner</th>
        <th class="right">Guru Net</th>
        <th class="right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (row) => `<tr>
        <td>${htmlEscape(row.section)}</td>
        <td>${htmlEscape(row.bookingId)}</td>
        <td>${htmlEscape(row.party)}</td>
        <td>${htmlEscape(row.source)}</td>
        <td>${htmlEscape(row.status)}</td>
        <td class="right">${htmlEscape(money(row.gross))}</td>
        <td class="right">${htmlEscape(money(row.platformFee))}</td>
        <td class="right">${htmlEscape(money(row.partnerCommission))}</td>
        <td class="right">${htmlEscape(money(row.guruNet))}</td>
        <td class="right">${htmlEscape(money(row.amount))}</td>
      </tr>`,
        )
        .join("")}
    </tbody>
  </table>
</body>
</html>`;
}

function getContentType(format: string) {
  if (format === "csv") return "text/csv; charset=utf-8";
  if (format === "excel") return "application/vnd.ms-excel; charset=utf-8";
  if (format === "word") return "application/msword; charset=utf-8";
  return "text/html; charset=utf-8";
}

function getExtension(format: string) {
  if (format === "csv") return "csv";
  if (format === "excel") return "xls";
  if (format === "word") return "doc";
  return "html";
}

export async function GET(request: Request) {
  const financeCheck = await requireFinanceAdminApi();
  if (!financeCheck.identity) return financeCheck.response;

  const url = new URL(request.url);
  const format = normalizeFormat(url.searchParams.get("format"));
  const rows = await buildRows();

  if (format === "json") {
    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      count: rows.length,
      rows,
    });
  }

  const body =
    format === "csv"
      ? buildCsv(rows)
      : buildHtml(
          rows,
          format === "excel" ? "excel" : format === "word" ? "word" : "html",
        );

  const filename = `sitguru-commissions-${new Date()
    .toISOString()
    .slice(0, 10)}.${getExtension(format)}`;

  try {
    await supabaseAdmin.from("financial_audit_logs").insert({
      actor_id: financeCheck.identity.id,
      actor_email: financeCheck.identity.email,
      actor_role: financeCheck.identity.role,
      action: "export_commissions",
      area: "financials.commissions.export",
      target_type: "commissions",
      metadata: { format, rowCount: rows.length, filename },
      created_at: new Date().toISOString(),
    });
  } catch {
    // Audit tables may not exist in every environment.
  }

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": getContentType(format),
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
