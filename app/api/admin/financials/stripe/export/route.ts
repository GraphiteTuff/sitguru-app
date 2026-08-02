import { NextRequest, NextResponse } from "next/server";
import { requireFinanceAdminApi } from "@/lib/admin/financials/access";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

type StripePayload = {
  ok?: boolean;
  message?: string;
  error?: string;
  summary?: Record<string, unknown>;
  transactions?: Array<Record<string, unknown>>;
  payouts?: Array<Record<string, unknown>>;
};

export async function GET(request: NextRequest) {
  const financeCheck = await requireFinanceAdminApi();
  if (!financeCheck.identity) {
    return financeCheck.response;
  }

  const upstream = new URL("/api/admin/financials/stripe", request.nextUrl.origin);
  request.nextUrl.searchParams.forEach((value, key) => {
    upstream.searchParams.set(key, value);
  });

  const response = await fetch(upstream.toString(), {
    cache: "no-store",
    headers: {
      cookie: request.headers.get("cookie") || "",
    },
  });

  const payload = (await response.json().catch(() => ({}))) as StripePayload;

  if (!response.ok || !payload.ok) {
    return NextResponse.json(
      {
        error:
          payload.error ||
          payload.message ||
          "Unable to export Stripe financials.",
      },
      { status: response.status || 500 },
    );
  }

  const section = String(
    request.nextUrl.searchParams.get("section") || "transactions",
  )
    .trim()
    .toLowerCase();

  const stamp = new Date().toISOString().slice(0, 10);

  if (section === "payouts") {
    const header = [
      "arrival_date",
      "amount",
      "fee_total",
      "net_amount",
      "status",
      "stripe_payout_id",
      "bank_description",
      "bank_matched",
      "plaid_transaction_id",
    ];

    const lines = [
      header.join(","),
      ...((payload.payouts || []) as Array<Record<string, unknown>>).map((row) =>
        [
          row.arrivalDate,
          row.amount,
          row.feeTotal,
          row.netAmount,
          row.status,
          row.stripePayoutId,
          row.bankDescription,
          row.bankMatched ? "true" : "false",
          row.plaidTransactionId,
        ]
          .map(csvEscape)
          .join(","),
      ),
    ];

    return new NextResponse(lines.join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="sitguru-stripe-payouts-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const header = [
    "created_at",
    "customer_name",
    "customer_email",
    "description",
    "amount",
    "fee",
    "net",
    "status",
    "type",
    "stripe_reference",
    "booking_reference",
    "reconciliation_status",
    "matched_bank_deposit",
  ];

  const lines = [
    header.join(","),
    ...((payload.transactions || []) as Array<Record<string, unknown>>).map(
      (row) =>
        [
          row.createdAt,
          row.customerName,
          row.customerEmail,
          row.description,
          row.amount,
          row.fee,
          row.net,
          row.status,
          row.type,
          row.stripeReference,
          row.bookingReference,
          row.reconciliationStatus,
          row.matchedBankDeposit ? "true" : "false",
        ]
          .map(csvEscape)
          .join(","),
    ),
  ];

  return new NextResponse(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sitguru-stripe-transactions-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
