import { canViewOfficialGrades, getProgramStatus } from "@/lib/internship/program-controls";
import { getProgramEvaluationAccess } from "@/lib/internship/program-evaluation-access";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function csvCell(value: unknown) {
  const text = String(value ?? "");
  const safe = /^[\s]*[=+@-]/.test(text) || /^[\r\n\t]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export async function GET(_request: Request, { params }: { params: Promise<{ internId: string }> }) {
  const { internId } = await params;
  const access = await getProgramEvaluationAccess(internId);
  if (!access?.user.isSuperUser) return new Response("Supervisor access required.", { status: 403 });
  if (!canViewOfficialGrades(await getProgramStatus(access.intern.cohortId))) {
    return new Response("Semester reporting is unavailable.", { status: 409 });
  }
  const { data, error } = await supabaseAdmin.from("internship_evaluations")
    .select("kind,presented_at,payload,created_at")
    .eq("intern_id", internId).eq("status", "released").in("kind", ["midpoint", "final"])
    .order("created_at", { ascending: false });
  if (error) return new Response("Evaluation export unavailable.", { status: 503 });
  const byKind = new Map<string, NonNullable<typeof data>[number]>();
  for (const row of data || []) if (!byKind.has(row.kind)) byKind.set(row.kind, row);
  const lines = [["Intern", "Evaluation period", "Released date", "Employer summary", "Next steps"]];
  for (const row of byKind.values()) {
    lines.push([access.intern.fullName, row.kind, row.presented_at || "", row.payload?.summary || "", row.payload?.nextSteps || ""]);
  }
  return new Response(lines.map((line) => line.map(csvCell).join(",")).join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="sitguru-employer-evaluations.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
