import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type AffiliateExport = {
  id: string;
  user_id: string | null;
  application_id: string | null;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  affiliate_type: string | null;
  platform: string | null;
  website: string | null;
  social_url: string | null;
  audience_size: number | null;
  niche: string | null;
  referral_code: string | null;
  customer_referral_url: string | null;
  guru_referral_url: string | null;
  partner_referral_url: string | null;
  commission_type: string | null;
  commission_value: number | null;
  clicks: number | null;
  signups: number | null;
  bookings: number | null;
  payout_balance: number | null;
  lifetime_earnings: number | null;
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
    .from("affiliates")
    .select(
      "id, user_id, application_id, display_name, email, phone, affiliate_type, platform, website, social_url, audience_size, niche, referral_code, customer_referral_url, guru_referral_url, partner_referral_url, commission_type, commission_value, clicks, signups, bookings, payout_balance, lifetime_earnings, status, approved_by, approved_at, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      {
        error: "Could not export affiliates.",
        details: error.message,
      },
      { status: 500 }
    );
  }

  const affiliates = (data ?? []) as AffiliateExport[];

  const headers = [
    "Affiliate ID",
    "User ID",
    "Application ID",
    "Display Name",
    "Email",
    "Phone",
    "Affiliate Type",
    "Platform",
    "Website",
    "Social URL",
    "Audience Size",
    "Niche",
    "Referral Code",
    "Customer Referral URL",
    "Guru Referral URL",
    "Partner Referral URL",
    "Commission Type",
    "Commission Value",
    "Clicks",
    "Signups",
    "Bookings",
    "Payout Balance",
    "Lifetime Earnings",
    "Status",
    "Approved By",
    "Approved At",
    "Created At",
    "Updated At",
  ];

  const rows = affiliates.map((affiliate) => [
    affiliate.id,
    affiliate.user_id,
    affiliate.application_id,
    affiliate.display_name,
    affiliate.email,
    affiliate.phone,
    formatLabel(affiliate.affiliate_type),
    affiliate.platform,
    affiliate.website,
    affiliate.social_url,
    affiliate.audience_size,
    affiliate.niche,
    affiliate.referral_code,
    affiliate.customer_referral_url,
    affiliate.guru_referral_url,
    affiliate.partner_referral_url,
    formatLabel(affiliate.commission_type),
    affiliate.commission_value,
    affiliate.clicks,
    affiliate.signups,
    affiliate.bookings,
    affiliate.payout_balance,
    affiliate.lifetime_earnings,
    formatLabel(affiliate.status),
    affiliate.approved_by,
    affiliate.approved_at,
    affiliate.created_at,
    affiliate.updated_at,
  ]);

  const csv = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sitguru-affiliates.csv"`,
      "Cache-Control": "no-store",
    },
  });
}