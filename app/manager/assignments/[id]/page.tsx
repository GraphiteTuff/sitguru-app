import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { routeAssignmentCategory } from "@/lib/admin/growth/work-routing";
import { canReadPrivateInternRecord, internshipActorKind } from "@/lib/internship/manager-access";
import { readAssignmentBrief, isHttpUrl } from "@/lib/internship/manager-assignment";
import { findInternById } from "@/lib/internship/queries";
import { getAdminIdentity } from "@/lib/admin/access";
import { listAssignmentIntegrations } from "@/lib/microsoft/assignment-integrations";
import { readMicrosoftGraphConfig } from "@/lib/microsoft/graph";
import { plannerConfigurationReady } from "@/lib/microsoft/planner-automation";
import { expectedInternAssignmentFolder } from "@/lib/microsoft/assignment-sharepoint";
import { retryManagerAssignmentSync } from "@/lib/internship/manager-assignment-actions";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { InternName } from "@/components/portal/PersonFace";
import { DESK_UI } from "@/lib/portal/desk-ui";
import ManagerAssignmentAutomationPanel from "@/components/manager/ManagerAssignmentAutomationPanel";
import { FINAL_CONTRIBUTION_SECTIONS, FINAL_PROJECT_OUTPUTS, FINAL_WORKSPACE_CHAPTERS } from "@/lib/internship/final-project";
import { isValidFinalSection } from "@/lib/internship/syllabus-alignment";

export const dynamic = "force-dynamic";

export default async function ManagerAssignmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const { id } = await params;
  const actor = await getAdminIdentity();
  const kind = internshipActorKind({ role: actor?.role, isSuperUser: actor?.isSuperUser });
  const { data: task } = await supabaseAdmin
    .from("internship_tasks")
    .select("id,intern_id,project_id,final_section,title,due_on,status,metric_affected,business_objective,student_notes,brief_payload")
    .eq("id", id)
    .maybeSingle();
  if (!task?.id) notFound();
  const intern = await findInternById(String(task.intern_id));
  if (
    !actor ||
    !intern ||
    (kind !== "manager" && kind !== "supervisor") ||
    !canReadPrivateInternRecord({
      actor: kind === "supervisor" ? "supervisor" : "manager",
      actorUserId: actor.id,
      targetInternId: intern.id,
      managerUserId: intern.managerUserId,
    })
  ) {
    redirect("/manager/assignments");
  }
  const plannerConfig = readMicrosoftGraphConfig();
  const plannerAutoReady = plannerConfigurationReady({
    graphConfigured: plannerConfig.configured,
    planId: plannerConfig.planId,
    bucketId: plannerConfig.readyBucketId,
    enabled: plannerConfig.plannerAutomationEnabled,
  });
  const brief = readAssignmentBrief(task.brief_payload);
  const route = routeAssignmentCategory(brief.category || String(task.metric_affected || ""));
  const finalSection = isValidFinalSection(String(task.final_section || ""))
    ? FINAL_CONTRIBUTION_SECTIONS.find((row) => row.id === task.final_section)
    : null;
  const finalChapter = FINAL_WORKSPACE_CHAPTERS.find((row) => row.id === finalSection?.chapter);
  const finalOutput = FINAL_PROJECT_OUTPUTS.find((row) => row.id === finalSection?.output);
  const { data: linkedProject } = task.project_id
    ? await supabaseAdmin.from("internship_projects").select("name").eq("id", task.project_id).eq("cohort_id", intern.cohortId).maybeSingle()
    : { data: null };
  const links = await listAssignmentIntegrations([String(task.id)]);
  const pick = (provider: string) => links.find((item) => item.provider === provider);
  const isLola = intern.fullName.trim().toLowerCase() === "lola uhl";
  const folderFallback = isLola ? expectedInternAssignmentFolder(intern.fullName, String(task.title)).url : "";
  const filesLink = pick("sharepoint")?.externalUrl || folderFallback;
  const query = searchParams ? await searchParams : {};
  const notificationText = (key: "ok" | "error") => {
    const raw = query[key];
    return String(Array.isArray(raw) ? raw[0] : raw || "");
  };
  const workPayload = task.brief_payload && typeof task.brief_payload === "object"
    ? (task.brief_payload as Record<string, unknown>).internWork : null;
  const work = workPayload && typeof workPayload === "object"
    ? workPayload as Record<string, unknown> : null;

  return (
    <div className="space-y-4">
      <Link href="/manager/assignments" className="text-sm font-bold text-[#2563EB]">Back to assignments</Link>
      {notificationText("ok") ? (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">{notificationText("ok")}</p>
      ) : null}
      {notificationText("error") ? (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-900">{notificationText("error")}</p>
      ) : null}
      <article className={`${DESK_UI.card} p-5`}>
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#2563EB]">{route.channelLabel}</p>
        <h1 className="mt-1 text-3xl font-black text-[#0F2744]">{String(task.title)}</h1>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          <InternName name={intern.preferredName || intern.fullName} src={intern.avatarUrl} /> · Due {String(task.due_on || "not set")} · {String(task.status || "todo").replaceAll("_", " ")}
        </p>
        <p className="mt-3 text-sm font-medium leading-6 text-slate-700">{brief.description || String(task.business_objective || "")}</p>
        <p className="mt-2 text-sm font-semibold text-slate-600">Creative freedom: {brief.freedom || "Guided"} · {brief.review || "Manager Review Required"}</p>
        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <h2 className="text-sm font-black text-[#0D5C3A]">Final project connection</h2>
          <p className="mt-1 text-sm font-bold text-slate-900">
            {finalSection
              ? finalSection.label + " → " + (finalChapter?.label || "Final Growth Project")
              : "Not mapped yet — edit this assignment to choose a final-project chapter."}
          </p>
          {finalOutput ? <p className="mt-1 text-xs text-slate-600">Destination: {finalOutput.name}</p> : null}
          {linkedProject?.name ? <p className="mt-1 text-xs text-slate-600">Cohort project: {linkedProject.name}</p> : null}
          <p className="mt-2 text-xs text-slate-600">
            Approved intern evidence feeds the selected chapter. Use Edit in Manager Assignments
            to correct the project or final chapter without replacing the intern's work.
          </p>
        </div>
        {brief.deliverables?.length ? (
          <div className="mt-5">
            <h2 className="text-base font-black text-[#0F2744]">Assignment deliverables</h2>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm leading-6 text-slate-700">
              {brief.deliverables.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          </div>
        ) : null}
        {brief.resources?.length ? (
          <div className="mt-5">
            <h2 className="text-base font-black text-[#0F2744]">Resources for the intern</h2>
            <div className="mt-2 flex flex-wrap gap-4">
              {brief.resources.filter(isHttpUrl).map((url) => <a key={url} href={url} target="_blank" rel="noreferrer" className="break-all text-sm font-bold text-blue-700 underline">{url}</a>)}
            </div>
          </div>
        ) : null}
      </article>
      <section className="grid gap-3 md:grid-cols-3">
        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="font-black text-[#0F2744]">Planner</h2>
          <p className="mt-1 text-sm font-semibold capitalize text-slate-600">{pick("planner")?.status === "connected" ? "API Connected" : pick("planner")?.status === "linked_manually" ? "Task link added (unverified)" : pick("planner")?.status.replaceAll("_", " ") || "Not configured"}</p>
          {pick("planner")?.externalUrl ? <a href={pick("planner")?.externalUrl} className="mt-3 inline-flex min-h-10 items-center text-sm font-bold text-[#2563EB]">Open Planner</a> : null}
        </article>
        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="font-black text-[#0F2744]">Project files</h2>
          <p className="mt-1 text-sm font-semibold capitalize text-slate-600">{pick("sharepoint")?.status === "connected" ? "Connected" : filesLink ? "Folder found — sync pending" : "Not configured"}</p>
          {filesLink ? <a href={filesLink} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-10 items-center text-sm font-bold text-[#2563EB]">Open project folder</a> : null}
        </article>
        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="font-black text-[#0F2744]">Microsoft Teams</h2>
          <p className="mt-1 text-sm font-semibold text-slate-700">Channel: {String(pick("teams")?.metadata.channelLabel || route.channelLabel)}</p>
          <p className="text-sm font-semibold text-[#166534]">Status: {pick("teams")?.status === "connected" ? "Connected" : "Not configured"}</p>
          <p className="text-sm font-medium text-slate-600">
            Notification: {String(pick("teams")?.metadata.notificationStatus) === "posted" ? "Posted" : "Automatic posting not enabled"}
          </p>
          <p className="text-sm font-medium text-slate-600">Mode: Channel link</p>
          {pick("teams")?.externalUrl ? (
            <a href={pick("teams")?.externalUrl} className="mt-3 inline-flex min-h-10 items-center text-sm font-bold text-[#2563EB]">Open Teams Channel</a>
          ) : null}
        </article>
      </section>
      <ManagerAssignmentAutomationPanel
        assignmentId={String(task.id)}
        dueOn={String(task.due_on || "")}
        briefPayload={task.brief_payload}
        planner={pick("planner")}
        plannerAutoReady={plannerAutoReady}
      />
      {work ? (
        <section className={`${DESK_UI.card} p-5 sm:p-6`}>
          <h2 className="text-xl font-black text-[#0F2744]">Intern's saved assignment work</h2>
          <p className="mt-2 text-sm text-slate-600">Review the intern's actual SharePoint-backed research without modifying their draft or submitting on their behalf.</p>
          {work.notes ? <p className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{String(work.notes)}</p> : null}
          {typeof work.researchLink === "string" && isHttpUrl(work.researchLink) ? (
            <a href={work.researchLink} target="_blank" rel="noreferrer" className="mt-3 inline-flex break-all text-sm font-bold text-blue-700 underline">Open supporting work link</a>
          ) : null}
          {typeof work.sharePointDocumentUrl === "string" && isHttpUrl(work.sharePointDocumentUrl) ? (
            <a href={work.sharePointDocumentUrl} target="_blank" rel="noreferrer" className="mt-3 ml-3 inline-flex break-all text-sm font-bold text-blue-700 underline">Open saved SharePoint document</a>
          ) : null}
        </section>
      ) : null}
      {pick("canva")?.externalUrl ? (
        <a href={pick("canva")?.externalUrl} className="inline-flex min-h-11 items-center rounded-full border border-slate-200 px-4 text-sm font-bold text-[#0F2744]">Open Canva design</a>
      ) : null}
      <form action={retryManagerAssignmentSync}>
        <input type="hidden" name="taskId" value={String(task.id)} />
        <button className="min-h-11 rounded-full bg-[#0D5C3A] px-4 text-sm font-bold !text-white">Retry sync</button>
      </form>
    </div>
  );
}
