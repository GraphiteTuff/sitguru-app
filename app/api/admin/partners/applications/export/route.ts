import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type PartnerApplicationExportRow = {
  id: string;
  applicant_type: string | null;
  business_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  business_type: string | null;
  website: string | null;
  social_url: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  status: string | null;
  notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
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

function buildCsv(rows: PartnerApplicationExportRow[]) {
  const headers = [
    "id",
    "applicant_type",
    "business_name",
    "contact_name",
    "email",
    "phone",
    "business_type",
    "website",
    "social_url",
    "city",
    "state",
    "zip_code",
    "status",
    "notes",
    "reviewed_by",
    "reviewed_at",
    "created_at",
    "updated_at",
  ];

  const csvRows = rows.map((row) =>
    headers
      .map((header) =>
        csvEscape(row[header as keyof PartnerApplicationExportRow])
      )
      .join(",")
  );

  return [headers.join(","), ...csvRows].join("\n");
}

function getTimestampForFilename() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function sanitizeSearchValue(value: string) {
  return value.replace(/[%_,]/g, "").trim();
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const status = searchParams.get("status")?.trim();
  const type = searchParams.get("type")?.trim();
  const q = sanitizeSearchValue(searchParams.get("q") || "");

  let query = supabase
    .from("partner_applications")
    .select(
      `
        id,
        applicant_type,
        business_name,
        contact_name,
        email,
        phone,
        business_type,
        website,
        social_url,
        city,
        state,
        zip_code,
        status,
        notes,
        reviewed_by,
        reviewed_at,
        created_at,
        updated_at
      `
    )
    .order("created_at", { ascending: false })
    .limit(5000);

  if (status) {
    query = query.eq("status", status);
  }

  if (type) {
    query = query.eq("applicant_type", type);
  }

  if (q) {
    query = query.or(
      [
        `business_name.ilike.%${q}%`,
        `contact_name.ilike.%${q}%`,
        `email.ilike.%${q}%`,
        `city.ilike.%${q}%`,
        `state.ilike.%${q}%`,
        `business_type.ilike.%${q}%`,
      ].join(",")
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      {
        error: "Could not export partner applications.",
        details: error.message,
      },
      { status: 500 }
    );
  }

  const csv = buildCsv((data ?? []) as PartnerApplicationExportRow[]);
  const filename = `sitguru-partner-applications-${getTimestampForFilename()}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}