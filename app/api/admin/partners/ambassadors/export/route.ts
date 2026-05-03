import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type AmbassadorExport = {
  id: string;
  user_id: string | null;
  application_id: string | null;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  territory: string | null;
  ambassador_type: string | null;
  tier: string | null;
  points: number | null;
  referral_code: string | null;
  customer_referral_url: string | null;
  guru_referral_url: string | null;
  partner_referral_url: string | null;
  status: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function escapeCsv(value: string | number | null | undefined) {
  const safeValue = value === null || value === undefined ? "" : String(value);
  return `"${safeValue.replace(/"/g, '""')}"`;
}

function formatLabel(value: string | null) {
  if (!value) return "";

  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ambassadors")
    .select(
      "id, user_id, application_id, display_name, email, phone, city, state, zip_code, territory, ambassador_type, tier, points, referral_code, customer_referral_url, guru_referral_url, partner_referral_url, status, approved_by, approved_at, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      {
        error: "Could not export ambassadors.",
        details: error.message,
      },
      { status: 500 }
    );
  }

  const ambassadors = (data ?? []) as AmbassadorExport[];

  const headers = [
    "Ambassador ID",
    "User ID",
    "Application ID",
    "Display Name",
    "Email",
    "Phone",
    "City",
    "State",
    "ZIP Code",
    "Territory",
    "Ambassador Type",
    "Tier",
    "Points",
    "Referral Code",
    "Customer Referral URL",
    "Guru Referral URL",
    "Partner Referral URL",
    "Status",
    "Approved By",
    "Approved At",
    "Created At",
    "Updated At",
  ];

  const rows = ambassadors.map((ambassador) => [
    ambassador.id,
    ambassador.user_id,
    ambassador.application_id,
    ambassador.display_name,
    ambassador.email,
    ambassador.phone,
    ambassador.city,
    ambassador.state,
    ambassador.zip_code,
    ambassador.territory,
    formatLabel(ambassador.ambassador_type),
    formatLabel(ambassador.tier),
    ambassador.points,
    ambassador.referral_code,
    ambassador.customer_referral_url,
    ambassador.guru_referral_url,
    ambassador.partner_referral_url,
    formatLabel(ambassador.status),
    ambassador.approved_by,
    ambassador.approved_at,
    ambassador.created_at,
    ambassador.updated_at,
  ]);

  const csv = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sitguru-ambassadors.csv"`,
      "Cache-Control": "no-store",
    },
  });
}