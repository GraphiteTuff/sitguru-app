import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type PartnerApplicationExport = {
  id: string;
  applicant_type: string | null;
  business_name: string | null;
  contact_name: string | null;
  email: string | null;
  business_type: string | null;
  city: string | null;
  state: string | null;
  status: string | null;
  created_at: string | null;
};

function escapeCsv(value: string | number | null | undefined) {
  const safeValue = value === null || value === undefined ? "" : String(value);
  return `"${safeValue.replace(/"/g, '""')}"`;
}

function formatApplicantType(value: string | null) {
  switch (value) {
    case "local_partner":
      return "Local Partner";
    case "national_partner":
      return "National Partner";
    case "affiliate":
      return "Growth Affiliate";
    case "ambassador":
      return "Ambassador";
    default:
      return value || "";
  }
}

function formatStatus(value: string | null) {
  if (!value) return "";
  if (value === "needs_review") return "Needs Review";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;

  const status = searchParams.get("status");
  const type = searchParams.get("type");

  let query = supabase
    .from("partner_applications")
    .select(
      "id, applicant_type, business_name, contact_name, email, business_type, city, state, status, created_at"
    )
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  if (type) {
    query = query.eq("applicant_type", type);
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

  const applications = (data ?? []) as PartnerApplicationExport[];

  const headers = [
    "Application ID",
    "Applicant Type",
    "Business Name",
    "Contact Name",
    "Email",
    "Business Type",
    "City",
    "State",
    "Status",
    "Created At",
  ];

  const rows = applications.map((app) => [
    app.id,
    formatApplicantType(app.applicant_type),
    app.business_name,
    app.contact_name,
    app.email,
    app.business_type,
    app.city,
    app.state,
    formatStatus(app.status),
    app.created_at,
  ]);

  const csv = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\n");

  const fileNameParts = ["sitguru-partner-applications"];

  if (status) fileNameParts.push(status);
  if (type) fileNameParts.push(type);

  const fileName = `${fileNameParts.join("-")}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}