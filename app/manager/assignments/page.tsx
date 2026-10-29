import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { loadManagerDeskBundle } from "@/lib/admin/growth/manager-desk-data";
import ManagerAssignmentsHome, {
  type ManagerAssignmentRow,
} from "@/components/manager/ManagerAssignmentsHome";
import { readAssignmentBrief } from "@/lib/internship/manager-assignment";
import { listCohortMilestones } from "@/lib/internship/queries";
import { listAssignmentIntegrations } from "@/lib/microsoft/assignment-integrations";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

function statusLabel(status: string) {
  if (status === "draft") return "Draft";
  if (status === "in_progress") return "In Progress";
  if (status === "submitted") return "Needs Review";
  if (status === "approved") return "Approved";
  if (status === "revision_requested") return "Changes requested";
  if (status === "todo") return "Not started";
  return status.replaceAll("_", " ");
}

function progressFor(status: string) {
  if (status === "approved") return 100;
  if (status === "submitted") return 80;
  if (status === "in_progress") return 45;
  if (status === "revision_requested") return 35;
  if (status === "todo") return 10;
  return 0;
}

function dueLabel(value: string) {
  if (!value) return "No date";
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function ManagerAssignmentsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const desk = await loadManagerDeskBundle();
  if (!desk) {
    return (
      <div className="mx-auto max-w-lg rounded-[1.75rem] border border-rose-100 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black text-slate-950">Assignments unavailable</h1>
      </div>
    );
  }

  const params = searchParams ? await searchParams : {};
  const ids = desk.cards.map((card) => card.id);
  const { data: people } = ids.length
    ? await supabaseAdmin
        .from("internship_interns")
        .select("id,full_name,preferred_name,academic_program,cohort_id,university_id")
        .in("id", ids)
    : { data: [] };
  const universityIds = [...new Set((people || []).map((row) => String(row.university_id || "")).filter(Boolean))];
  const { data: schools } = universityIds.length
    ? await supabaseAdmin.from("internship_universities").select("id,display_name,name").in("id", universityIds)
    : { data: [] };
  const schoolName = new Map(
    (schools || []).map((row) => [String(row.id), String(row.display_name || row.name || "")]),
  );
  const interns = (people || []).map((row) => ({
    id: String(row.id),
    name: String(row.preferred_name || row.full_name || "Intern"),
    school: schoolName.get(String(row.university_id || "")) || "",
    program: String(row.academic_program || ""),
    avatarUrl: desk.cards.find((card) => card.id === row.id)?.avatarUrl || "",
  }));
  const cohortIds = [...new Set((people || []).map((row) => String(row.cohort_id || "")).filter(Boolean))];
  const milestoneGroups = await Promise.all(cohortIds.map((id) => listCohortMilestones(id)));
  const cohortMilestones = new Map(cohortIds.map((id, index) => [id, milestoneGroups[index] || []]));
  const milestones = (people || []).flatMap((person) =>
    (cohortMilestones.get(String(person.cohort_id || "")) || [])
      .filter((item) => !item.universityId || item.universityId === person.university_id)
      .map((item) => ({ id: item.id, title: item.title, internId: String(person.id) })),
  );

  const { data: tasks } = ids.length
    ? await supabaseAdmin
        .from("internship_tasks")
        .select("id,intern_id,title,due_on,status,metric_affected,business_objective,brief_payload")
        .in("intern_id", ids)
        .order("due_on", { ascending: true })
    : { data: [] };
  const names = new Map(interns.map((intern) => [intern.id, intern.name]));
  const rows: ManagerAssignmentRow[] = (tasks || []).map((row) => {
    const brief = readAssignmentBrief(row.brief_payload);
    const status = String(row.status || "todo");
    const dueOn = String(row.due_on || "");
    return {
      id: String(row.id),
      taskId: String(row.id),
      internId: String(row.intern_id),
      intern: names.get(String(row.intern_id)) || "Intern",
      title: String(row.title || ""),
      category: brief.category || String(row.metric_affected || "Other"),
      milestoneId: brief.milestoneId || "",
      dueOn,
      dueLabel: dueLabel(dueOn),
      priority: brief.priority || "Normal",
      description: brief.description || String(row.business_objective || ""),
      deliverables: brief.deliverables?.length ? brief.deliverables : [""],
      review: brief.review || "Manager Review Required",
      freedom: brief.freedom || "Guided",
      resources: brief.resources?.length ? brief.resources : [""],
      notes: brief.notes || "",
      clientRequestId: brief.clientRequestId || String(row.id),
      statusLabel: statusLabel(status),
      progress: progressFor(status),
    };
  });
  const integrations = await listAssignmentIntegrations(rows.map((row) => row.id));
  const links: Record<string, { planner: string; files: string; teams: string; plannerUrl: string; filesUrl: string; teamsUrl: string }> = {};
  for (const row of rows) {
    const mine = integrations.filter((item) => item.assignmentId === row.id);
    const pick = (provider: string) => mine.find((item) => item.provider === provider);
    links[row.id] = {
      planner: pick("planner")?.status.replaceAll("_", " ") || "Not configured",
      files: pick("sharepoint")?.status.replaceAll("_", " ") || "Not configured",
      teams: pick("teams")?.status === "connected" ? "Channel link" : pick("teams")?.status.replaceAll("_", " ") || "Not configured",
      plannerUrl: pick("planner")?.externalUrl || "",
      filesUrl: pick("sharepoint")?.externalUrl || "",
      teamsUrl: pick("teams")?.externalUrl || "",
    };
  }
  const ok = first(params.ok);
  const error = first(params.error);

  return (
    <ManagerAssignmentsHome
      rows={rows}
      interns={interns}
      milestones={milestones}
      initialOpen={first(params.create) === "true"}
      links={links}
      notice={ok ? { kind: "ok", message: ok } : error ? { kind: "error", message: error } : null}
    />
  );
}
