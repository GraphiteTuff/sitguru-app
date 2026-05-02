import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type BookingRow = Record<string, unknown>;
type ExpenseRow = Record<string, unknown>;
type PayoutRow = Record<string, unknown>;
type DisputeRow = Record<string, unknown>;

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

type ExportRow = {
  section: string;
  line_item: string;
  amount: number;
  formatted_amount: string;
};

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Math.abs(value));

  return value < 0 ? `(${formatted})` : formatted;
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string
): Promise<T[]> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Profit and loss export query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Profit and loss export query skipped for ${label}:`, error);
    return [];
  }
}

function getBookingGrossAmount(booking: BookingRow) {
  const subtotal = toNumber(booking.subtotal_amount);

  if (subtotal > 0) return subtotal;

  return (
    toNumber(booking.total_amount) ||
    toNumber(booking.amount) ||
    toNumber(booking.price) ||
    toNumber(booking.hourly_rate)
  );
}

function getBookingTaxAmount(booking: BookingRow) {
  return toNumber(booking.sales_tax_amount);
}

function getPlatformFee(booking: BookingRow) {
  const storedFee = toNumber(booking.sitguru_fee_amount);

  if (storedFee > 0) return storedFee;

  return getBookingGrossAmount(booking) * 0.08;
}

function getGuruPayoutAmount(booking: BookingRow) {
  const storedNet = toNumber(booking.guru_net_amount);

  if (storedNet > 0) return storedNet;

  return Math.max(0, getBookingGrossAmount(booking) - getPlatformFee(booking));
}

function getRefundAmount(booking: BookingRow) {
  const explicitRefund = toNumber(booking.refund_amount);

  if (explicitRefund > 0) return explicitRefund;

  const status = (
    asTrimmedString(booking.payment_status) ||
    asTrimmedString(booking.status)
  ).toLowerCase();

  if (status.includes("refund")) {
    return getBookingGrossAmount(booking);
  }

  return 0;
}

function isPaidBooking(booking: BookingRow) {
  const paymentStatus = asTrimmedString(booking.payment_status).toLowerCase();
  const status = asTrimmedString(booking.status).toLowerCase();

  return (
    paymentStatus === "paid" ||
    paymentStatus === "succeeded" ||
    status.includes("paid") ||
    status.includes("complete")
  );
}

function getExpenseAmount(expense: ExpenseRow) {
  return (
    toNumber(expense.amount) ||
    toNumber(expense.total_amount) ||
    toNumber(expense.expense_amount) ||
    toNumber(expense.cost)
  );
}

function getExpenseCategory(expense: ExpenseRow) {
  const category = (
    asTrimmedString(expense.category) ||
    asTrimmedString(expense.expense_category) ||
    asTrimmedString(expense.type) ||
    asTrimmedString(expense.name) ||
    "Other"
  ).toLowerCase();

  if (category.includes("market") || category.includes("advert")) {
    return "Marketing";
  }

  if (category.includes("software") || category.includes("tool")) {
    return "Software";
  }

  if (category.includes("payroll") || category.includes("contractor")) {
    return "Admin / Payroll";
  }

  if (category.includes("admin") || category.includes("office")) {
    return "Admin";
  }

  if (category.includes("legal") || category.includes("accounting")) {
    return "Professional Services";
  }

  if (category.includes("insurance")) {
    return "Insurance";
  }

  if (category.includes("travel") || category.includes("vehicle")) {
    return "Vehicle / Travel";
  }

  return "Other";
}

function getDisputeAmount(dispute: DisputeRow) {
  return (
    toNumber(dispute.amount) ||
    toNumber(dispute.dispute_amount) ||
    toNumber(dispute.refund_amount) ||
    toNumber(dispute.total_amount)
  );
}

function getPayoutAmount(payout: PayoutRow) {
  return (
    toNumber(payout.amount) ||
    toNumber(payout.payout_amount) ||
    toNumber(payout.guru_net_amount) ||
    toNumber(payout.net_amount)
  );
}

function isPayoutPaid(payout: PayoutRow) {
  const status = (
    asTrimmedString(payout.status) || asTrimmedString(payout.payout_status)
  ).toLowerCase();

  return (
    status.includes("paid") ||
    status.includes("released") ||
    status.includes("complete")
  );
}

async function getProfitLossExportRows(): Promise<ExportRow[]> {
  const [bookings, expenses, payouts, disputes] = await Promise.all([
    safeRows<BookingRow>(
      supabaseAdmin
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
      "bookings"
    ),
    safeRows<ExpenseRow>(
      supabaseAdmin
        .from("expense_ledger")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
      "expense_ledger"
    ),
    safeRows<PayoutRow>(
      supabaseAdmin
        .from("guru_payouts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
      "guru_payouts"
    ),
    safeRows<DisputeRow>(
      supabaseAdmin
        .from("dispute_cases")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
      "dispute_cases"
    ),
  ]);

  const paidBookings = bookings.filter(isPaidBooking);

  const grossBookingVolume = bookings.reduce(
    (sum, booking) => sum + getBookingGrossAmount(booking),
    0
  );

  const paidBookingVolume = paidBookings.reduce(
    (sum, booking) => sum + getBookingGrossAmount(booking),
    0
  );

  const taxCollected = bookings.reduce(
    (sum, booking) => sum + getBookingTaxAmount(booking),
    0
  );

  const platformFeeRevenue = bookings.reduce(
    (sum, booking) => sum + getPlatformFee(booking),
    0
  );

  const guruPayoutsFromBookings = bookings.reduce(
    (sum, booking) => sum + getGuruPayoutAmount(booking),
    0
  );

  const paidPayoutsFromTable = payouts
    .filter(isPayoutPaid)
    .reduce((sum, payout) => sum + getPayoutAmount(payout), 0);

  const guruPayouts =
    paidPayoutsFromTable > 0 ? paidPayoutsFromTable : guruPayoutsFromBookings;

  const refunds = bookings.reduce(
    (sum, booking) => sum + getRefundAmount(booking),
    0
  );

  const disputeLosses = disputes.reduce(
    (sum, dispute) => sum + getDisputeAmount(dispute),
    0
  );

  const marketingExpenses = expenses
    .filter((expense) => getExpenseCategory(expense) === "Marketing")
    .reduce((sum, expense) => sum + getExpenseAmount(expense), 0);

  const softwareExpenses = expenses
    .filter((expense) => getExpenseCategory(expense) === "Software")
    .reduce((sum, expense) => sum + getExpenseAmount(expense), 0);

  const adminExpenses = expenses
    .filter((expense) =>
      ["Admin", "Admin / Payroll", "Professional Services"].includes(
        getExpenseCategory(expense)
      )
    )
    .reduce((sum, expense) => sum + getExpenseAmount(expense), 0);

  const insuranceExpenses = expenses
    .filter((expense) => getExpenseCategory(expense) === "Insurance")
    .reduce((sum, expense) => sum + getExpenseAmount(expense), 0);

  const travelExpenses = expenses
    .filter((expense) => getExpenseCategory(expense) === "Vehicle / Travel")
    .reduce((sum, expense) => sum + getExpenseAmount(expense), 0);

  const otherExpenses = expenses
    .filter((expense) => getExpenseCategory(expense) === "Other")
    .reduce((sum, expense) => sum + getExpenseAmount(expense), 0);

  const totalRevenue = platformFeeRevenue;
  const totalCostOfRevenue = guruPayouts + refunds + disputeLosses;
  const grossProfit = totalRevenue - totalCostOfRevenue;

  const totalOperatingExpenses =
    marketingExpenses +
    softwareExpenses +
    adminExpenses +
    insuranceExpenses +
    travelExpenses +
    otherExpenses;

  const operatingIncome = grossProfit - totalOperatingExpenses;
  const netIncome = operatingIncome;

  const rows: ExportRow[] = [
    {
      section: "Revenue",
      line_item: "Gross Booking Volume",
      amount: grossBookingVolume,
      formatted_amount: money(grossBookingVolume),
    },
    {
      section: "Revenue",
      line_item: "Paid Booking Volume",
      amount: paidBookingVolume,
      formatted_amount: money(paidBookingVolume),
    },
    {
      section: "Revenue",
      line_item: "SitGuru Platform Fee Revenue",
      amount: platformFeeRevenue,
      formatted_amount: money(platformFeeRevenue),
    },
    {
      section: "Revenue",
      line_item: "Sales Tax Collected / Held",
      amount: taxCollected,
      formatted_amount: money(taxCollected),
    },
    {
      section: "Revenue",
      line_item: "Total Revenue",
      amount: totalRevenue,
      formatted_amount: money(totalRevenue),
    },
    {
      section: "Cost of Revenue",
      line_item: "Guru Payouts",
      amount: guruPayouts,
      formatted_amount: money(guruPayouts),
    },
    {
      section: "Cost of Revenue",
      line_item: "Refunds / Credits",
      amount: refunds,
      formatted_amount: money(refunds),
    },
    {
      section: "Cost of Revenue",
      line_item: "Dispute Losses / Adjustments",
      amount: disputeLosses,
      formatted_amount: money(disputeLosses),
    },
    {
      section: "Cost of Revenue",
      line_item: "Total Cost of Revenue",
      amount: totalCostOfRevenue,
      formatted_amount: money(totalCostOfRevenue),
    },
    {
      section: "Gross Profit",
      line_item: "Gross Profit",
      amount: grossProfit,
      formatted_amount: money(grossProfit),
    },
    {
      section: "Operating Expenses",
      line_item: "Marketing / Advertising",
      amount: marketingExpenses,
      formatted_amount: money(marketingExpenses),
    },
    {
      section: "Operating Expenses",
      line_item: "Software / Tools",
      amount: softwareExpenses,
      formatted_amount: money(softwareExpenses),
    },
    {
      section: "Operating Expenses",
      line_item: "Admin / Payroll / Professional Services",
      amount: adminExpenses,
      formatted_amount: money(adminExpenses),
    },
    {
      section: "Operating Expenses",
      line_item: "Insurance",
      amount: insuranceExpenses,
      formatted_amount: money(insuranceExpenses),
    },
    {
      section: "Operating Expenses",
      line_item: "Vehicle / Travel",
      amount: travelExpenses,
      formatted_amount: money(travelExpenses),
    },
    {
      section: "Operating Expenses",
      line_item: "Other Operating Expenses",
      amount: otherExpenses,
      formatted_amount: money(otherExpenses),
    },
    {
      section: "Operating Expenses",
      line_item: "Total Operating Expenses",
      amount: totalOperatingExpenses,
      formatted_amount: money(totalOperatingExpenses),
    },
    {
      section: "Operating Income / Loss",
      line_item: "Operating Income / Loss",
      amount: operatingIncome,
      formatted_amount: money(operatingIncome),
    },
    {
      section: "Net Income / Loss",
      line_item: "Net Income / Loss",
      amount: netIncome,
      formatted_amount: money(netIncome),
    },
  ];

  return rows;
}

function buildCsv(rows: ExportRow[]) {
  const headers = ["Section", "Line Item", "Amount", "Formatted Amount"];

  const body = rows.map((row) =>
    [
      csvEscape(row.section),
      csvEscape(row.line_item),
      csvEscape(row.amount),
      csvEscape(row.formatted_amount),
    ].join(",")
  );

  return [headers.map(csvEscape).join(","), ...body].join("\n");
}

function buildHtmlTable(rows: ExportRow[]) {
  const generatedAt = new Date().toLocaleString("en-US");

  const rowsHtml = rows
    .map(
      (row) => `
        <tr>
          <td>${row.section}</td>
          <td>${row.line_item}</td>
          <td style="text-align:right;">${row.amount.toFixed(2)}</td>
          <td style="text-align:right;">${row.formatted_amount}</td>
        </tr>
      `
    )
    .join("");

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #111827;
          }
          h1 {
            margin-bottom: 4px;
          }
          p {
            margin-top: 0;
            color: #4b5563;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 24px;
          }
          th {
            background: #d1fae5;
            border: 1px solid #111827;
            padding: 8px;
            text-align: left;
          }
          td {
            border: 1px solid #111827;
            padding: 8px;
          }
          tr:nth-child(even) {
            background: #f8fafc;
          }
        </style>
      </head>
      <body>
        <h1>SitGuru Profit & Loss Statement</h1>
        <p>Generated ${generatedAt}</p>
        <table>
          <thead>
            <tr>
              <th>Section</th>
              <th>Line Item</th>
              <th>Amount</th>
              <th>Formatted Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
    </html>
  `;
}

function responseWithFile({
  body,
  contentType,
  filename,
}: {
  body: string;
  contentType: string;
  filename: string;
}) {
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(req: NextRequest) {
  const format =
    req.nextUrl.searchParams.get("format")?.trim().toLowerCase() || "csv";

  const rows = await getProfitLossExportRows();
  const date = new Date().toISOString().slice(0, 10);

  if (format === "json") {
    return Response.json({
      generated_at: new Date().toISOString(),
      rows,
    });
  }

  if (format === "word" || format === "doc") {
    return responseWithFile({
      body: buildHtmlTable(rows),
      contentType: "application/msword; charset=utf-8",
      filename: `sitguru-profit-loss-${date}.doc`,
    });
  }

  if (format === "excel" || format === "xls") {
    return responseWithFile({
      body: buildHtmlTable(rows),
      contentType: "application/vnd.ms-excel; charset=utf-8",
      filename: `sitguru-profit-loss-${date}.xls`,
    });
  }

  return responseWithFile({
    body: buildCsv(rows),
    contentType: "text/csv; charset=utf-8",
    filename: `sitguru-profit-loss-${date}.csv`,
  });
}
