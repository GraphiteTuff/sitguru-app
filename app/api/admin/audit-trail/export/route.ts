import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/access";
import {
  buildAuditExportRows,
  filterEntries,
  getAuditTrail,
  type AuditSearchParams,
} from "@/lib/admin/audit";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function getSearchParams(request: Request): AuditSearchParams {
  const url = new URL(request.url);

  return {
    q: asTrimmedString(url.searchParams.get("q")) || undefined,
    category: asTrimmedString(url.searchParams.get("category")) || undefined,
    severity: asTrimmedString(url.searchParams.get("severity")) || undefined,
    source: asTrimmedString(url.searchParams.get("source")) || undefined,
    from: asTrimmedString(url.searchParams.get("from")) || undefined,
    to: asTrimmedString(url.searchParams.get("to")) || undefined,
  };
}

async function writeExportAudit(input: {
  actorId: string;
  actorEmail: string;
  actorRole: string;
  format: string;
  rowCount: number;
  filters: AuditSearchParams;
}) {
  const payload = {
    actor_id: input.actorId,
    actor_email: input.actorEmail,
    actor_role: input.actorRole,
    action: "export_audit_trail",
    area: "admin.audit_trail.export",
    target_type: "audit_trail",
    severity: "info",
    metadata: {
      format: input.format,
      rowCount: input.rowCount,
      filters: input.filters,
    },
    created_at: new Date().toISOString(),
  };

  try {
    await supabaseAdmin.from("admin_audit_logs").insert(payload);
  } catch {
    // Keep export from failing if audit tables are not ready.
  }

  try {
    await supabaseAdmin.from("financial_audit_logs").insert(payload);
  } catch {
    // Optional dual-write for finance-capable exports.
  }
}

export async function GET(request: Request) {
  const access = await requireAdminApi();

  if (!access.identity) {
    return access.response;
  }

  const filters = getSearchParams(request);
  const format = asTrimmedString(
    new URL(request.url).searchParams.get("format") || "csv",
  ).toLowerCase();

  const trail = await getAuditTrail({
    canAccessFinancials: access.identity.canAccessFinancials,
    limitPerSource: 500,
  });

  const filtered = filterEntries(trail.entries, filters);
  const rows = buildAuditExportRows(filtered);
  const stamp = new Date().toISOString().slice(0, 10);

  await writeExportAudit({
    actorId: access.identity.id,
    actorEmail: access.identity.email,
    actorRole: access.identity.role,
    format,
    rowCount: rows.length,
    filters,
  });

  if (format === "json") {
    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      count: rows.length,
      health: trail.health,
      filters,
      rows,
    });
  }

  const headers = [
    "created_at",
    "source",
    "severity",
    "category",
    "action",
    "area",
    "actor_email",
    "actor_role",
    "actor_id",
    "target_type",
    "target_id",
    "page_path",
    "metadata",
  ];

  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((key) => csvEscape(row[key as keyof typeof row])).join(","),
    ),
  ].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sitguru-audit-trail-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
