import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type PartnerExportRow = {
  id: string;
  application_id: string | null;
  owner_user_id: string | null;
  partner_type: string | null;
  business_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  social_url: string | null;
  business_type: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  slug: string | null;
  referral_code: string | null;
  commission_type: string | null;
  customer_booking_reward: number | null;
  guru_referral_reward: number | null;
  partner_activation_reward: number | null;
  donation_reward: number | null;
  status: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function csvEscape(value: unknown) {
  if (value === null || value === undefined) return "";

  const stringValue = String(value);

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function buildCsv(rows: PartnerExportRow[]) {
  const headers = [
    "id",
    "application_id",
    "owner_user_id",
    "partner_type",
    "business_name",
    "contact_name",
    "email",
    "phone",
    "website",
    "social_url",
    "business_type",
    "city",
    "state",
    "zip_code",
    "slug",
    "referral_code",
    "commission_type",
    "customer_booking_reward",
    "guru_referral_reward",
    "partner_activation_reward",
    "donation_reward",
    "status",
    "approved_by",
    "approved_at",
    "created_at",
    "updated_at",
  ];

  const csvRows = rows.map((row) =>
    headers
      .map((header) => csvEscape(row[header as keyof PartnerExportRow]))
      .join(",")
  );

  return [headers.join(","), ...csvRows].join("\n");
}

function getTimestampForFilename() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("partners")
    .select(
      `
        id,
        application_id,
        owner_user_id,
        partner_type,
        business_name,
        contact_name,
        email,
        phone,
        website,
        social_url,
        business_type,
        city,
        state,
        zip_code,
        slug,
        referral_code,
        commission_type,
        customer_booking_reward,
        guru_referral_reward,
        partner_activation_reward,
        donation_reward,
        status,
        approved_by,
        approved_at,
        created_at,
        updated_at
      `
    )
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    return NextResponse.json(
      {
        error: "Could not export active partners.",
        details: error.message,
      },
      { status: 500 }
    );
  }

  const csv = buildCsv((data ?? []) as PartnerExportRow[]);
  const filename = `sitguru-active-partners-${getTimestampForFilename()}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}