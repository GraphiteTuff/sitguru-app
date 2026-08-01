import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AnyRow = Record<string, unknown>;

const FINANCE_ROLES = new Set([
  "owner",
  "super_admin",
  "admin",
  "finance_admin",
  "finance",
  "accounting",
  "bookkeeper",
]);

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

async function requireFinanceAccess() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const email = String(user.email || "").toLowerCase();
  const envEmails = String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (envEmails.includes(email)) {
    return { id: user.id, email };
  }

  const [adminUser, profile] = await Promise.all([
    supabaseAdmin
      .from("admin_users")
      .select("role,can_access_financials,is_active")
      .eq("user_id", user.id)
      .limit(1),
    supabaseAdmin
      .from("profiles")
      .select("role,can_access_financials,is_active")
      .eq("id", user.id)
      .limit(1),
  ]);

  const row = adminUser.data?.[0] || profile.data?.[0];
  const role = String(row?.role || "").toLowerCase();
  const active = row?.is_active !== false;
  const canAccess =
    Boolean(row?.can_access_financials) || FINANCE_ROLES.has(role);

  if (!active || !canAccess) return null;
  return { id: user.id, email };
}

async function safeRows(table: string, columns: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select(columns)
      .limit(5000);
    if (error) return [] as AnyRow[];
    return (Array.isArray(data) ? data : []) as unknown as AnyRow[];
  } catch {
    return [] as AnyRow[];
  }
}

export async function GET(request: NextRequest) {
  const actor = await requireFinanceAccess();
  if (!actor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const format = String(
    request.nextUrl.searchParams.get("format") || "csv",
  ).toLowerCase();

  const [guruPayouts, partnerPayouts, genericPayouts] = await Promise.all([
    safeRows(
      "guru_payouts",
      "id,guru_id,amount,status,created_at,paid_at,currency,booking_id",
    ),
    safeRows(
      "partner_payouts",
      "id,partner_id,amount,status,created_at,paid_at,currency",
    ),
    safeRows(
      "payouts",
      "id,user_id,amount,status,created_at,paid_at,currency,provider",
    ),
  ]);

  const rows = [
    ...guruPayouts.map((row) => ({
      source: "guru_payouts",
      id: row.id,
      party_id: row.guru_id,
      amount: row.amount,
      status: row.status,
      currency: row.currency || "USD",
      created_at: row.created_at,
      paid_at: row.paid_at,
      booking_id: row.booking_id || "",
      provider: "stripe",
    })),
    ...partnerPayouts.map((row) => ({
      source: "partner_payouts",
      id: row.id,
      party_id: row.partner_id,
      amount: row.amount,
      status: row.status,
      currency: row.currency || "USD",
      created_at: row.created_at,
      paid_at: row.paid_at,
      booking_id: "",
      provider: "partner",
    })),
    ...genericPayouts.map((row) => ({
      source: "payouts",
      id: row.id,
      party_id: row.user_id,
      amount: row.amount,
      status: row.status,
      currency: row.currency || "USD",
      created_at: row.created_at,
      paid_at: row.paid_at,
      booking_id: "",
      provider: row.provider || "",
    })),
  ];

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
  ];

  const csv = [
    header.join(","),
    ...rows.map((row) =>
      header.map((key) => csvEscape((row as AnyRow)[key])).join(","),
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
