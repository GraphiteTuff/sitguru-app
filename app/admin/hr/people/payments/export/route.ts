import { NextResponse } from "next/server";
import { getAdminIdentity } from "@/lib/admin/access";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** Lightweight CSV export of Paid team-member service payments. */
export async function GET() {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("staff_payment_records")
    .select(
      "paid_on,approved_hours,amount_cents,rate_summary,expense_category,payment_method,external_reference,status,payment_period_id,engagement_id,staff_engagements(display_name),staff_payment_periods(period_start,period_end)",
    )
    .eq("status", "paid")
    .order("paid_on", { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const header = [
    "Payment Date",
    "Team Member",
    "Payment Period",
    "Hours",
    "Rate",
    "Amount",
    "Expense Category",
    "Payment Method",
    "Reference",
    "Status",
  ];

  const lines = (data || []).map((row) => {
    const eng = (row as { staff_engagements?: { display_name?: string } })
      .staff_engagements;
    const period = (
      row as {
        staff_payment_periods?: { period_start?: string; period_end?: string };
      }
    ).staff_payment_periods;
    const amount = (Number(row.amount_cents) / 100).toFixed(2);
    const periodLabel = period
      ? `${period.period_start || ""}–${period.period_end || ""}`
      : "";
    return [
      row.paid_on || "",
      eng?.display_name || "",
      periodLabel,
      String(row.approved_hours ?? ""),
      row.rate_summary || "",
      amount,
      row.expense_category || "Contract Labor",
      row.payment_method || "manual_bank_ach",
      row.external_reference || "",
      row.status || "paid",
    ]
      .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
      .join(",");
  });

  const csv = [header.join(","), ...lines].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="sitguru-team-payments.csv"',
    },
  });
}
