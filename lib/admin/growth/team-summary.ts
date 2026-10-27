import { listInterns } from "@/lib/internship/queries";
import { internStatusLabel } from "@/lib/internship/labels";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type GrowthTeamMember = {
  id: string;
  name: string;
  status: string;
  statusLabel: string;
  school: string;
  program: string;
  hoursSubmitted: number;
  hoursApproved: number;
  managerDeskHref: string;
};

/**
 * Lightweight Team panel for Growth Workspace.
 * Dynamically lists interns assigned to the Growth Manager — no hardcoded names,
 * no Planner-style task lists, no Manager Desk rebuild.
 */
export async function listGrowthTeamSummary(input: {
  actorUserId: string;
  isSuperUser?: boolean;
}): Promise<GrowthTeamMember[]> {
  const everyone = await listInterns();
  const assigned = everyone.filter((intern) => {
    if (intern.isTest) return false;
    if (input.isSuperUser) {
      return Boolean(intern.managerUserId);
    }
    return intern.managerUserId === input.actorUserId;
  });

  if (!assigned.length) return [];

  const ids = assigned.map((intern) => intern.id);
  const { data: logRows } = await supabaseAdmin
    .from("internship_time_logs")
    .select("intern_id,hours,status")
    .in("intern_id", ids);

  const hoursByIntern = new Map<
    string,
    { submitted: number; approved: number }
  >();
  for (const row of Array.isArray(logRows) ? logRows : []) {
    const internId = String((row as { intern_id?: string }).intern_id || "");
    const hours = Number((row as { hours?: number }).hours) || 0;
    const status = String((row as { status?: string }).status || "");
    const bucket = hoursByIntern.get(internId) || { submitted: 0, approved: 0 };
    if (status === "approved" || status === "supervisor_verified") {
      bucket.approved += hours;
      bucket.submitted += hours;
    } else if (status === "submitted") {
      bucket.submitted += hours;
    }
    hoursByIntern.set(internId, bucket);
  }

  const universityIds = [
    ...new Set(assigned.map((intern) => intern.universityId).filter(Boolean)),
  ] as string[];
  const { data: universities } = universityIds.length
    ? await supabaseAdmin
        .from("internship_universities")
        .select("id,display_name,short_name")
        .in("id", universityIds)
    : { data: [] as unknown[] };
  const schoolMap = new Map(
    (Array.isArray(universities) ? universities : []).map((row) => {
      const r = row as {
        id?: string;
        display_name?: string;
        short_name?: string;
      };
      return [String(r.id || ""), String(r.display_name || r.short_name || "")];
    }),
  );

  return assigned.map((intern) => {
    const hours = hoursByIntern.get(intern.id) || { submitted: 0, approved: 0 };
    return {
      id: intern.id,
      name: intern.fullName || intern.email || "Intern",
      status: intern.status,
      statusLabel: internStatusLabel(intern.status),
      school:
        schoolMap.get(intern.universityId || "") ||
        intern.academicProgram ||
        "School pending",
      program: intern.academicProgram || "",
      hoursSubmitted: Math.round(hours.submitted * 10) / 10,
      hoursApproved: Math.round(hours.approved * 10) / 10,
      managerDeskHref: `/intern/manage`,
    };
  });
}
