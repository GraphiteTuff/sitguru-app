import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { routeAssignmentCategory } from "@/lib/admin/growth/work-routing";
import { canReadPrivateInternRecord, internshipActorKind } from "@/lib/internship/manager-access";
import { readAssignmentBrief } from "@/lib/internship/manager-assignment";
import { findInternById } from "@/lib/internship/queries";
import { getAdminIdentity } from "@/lib/admin/access";
import { listAssignmentIntegrations } from "@/lib/microsoft/assignment-integrations";
import { retryManagerAssignmentSync } from "@/lib/internship/manager-assignment-actions";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { DESK_UI } from "@/lib/portal/desk-ui";

export const dynamic = "force-dynamic";

export default async function ManagerAssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const { id } = await params;
  const actor = await getAdminIdentity();
  const kind = internshipActorKind({ role: actor?.role, isSuperUser: actor?.isSuperUser });
  const { data: task } = await supabaseAdmin
    .from("internship_tasks")
    .select("id,intern_id,title,due_on,status,metric_affected,business_objective,student_notes,brief_payload")
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
  const brief = readAssignmentBrief(task.brief_payload);
  const route = routeAssignmentCategory(brief.category || String(task.metric_affected || ""));
  const links = await listAssignmentIntegrations([String(task.id)]);
  const pick = (provider: string) => links.find((item) => item.provider === provider);

  return (
    <div className="space-y-4">
      <Link href="/manager/assignments" className="text-sm font-bold text-[#2563EB]">Back to assignments</Link>
      <article className={`${DESK_UI.card} p-5`}>
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#2563EB]">{route.channelLabel}</p>
        <h1 className="mt-1 text-3xl font-black text-[#0F2744]">{String(task.title)}</h1>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          {intern.preferredName || intern.fullName} · Due {String(task.due_on || "not set")} · {String(task.status || "todo").replaceAll("_", " ")}
        </p>
        <p className="mt-3 text-sm font-medium leading-6 text-slate-700">{brief.description || String(task.business_objective || "")}</p>
        <p className="mt-2 text-sm font-semibold text-slate-600">Creative freedom: {brief.freedom || "Guided"} · {brief.review || "Manager Review Required"}</p>
      </article>
      <section className="grid gap-3 md:grid-cols-3">
        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="font-black text-[#0F2744]">Planner</h2>
          <p className="mt-1 text-sm font-semibold capitalize text-slate-600">{pick("planner")?.status.replaceAll("_", " ") || "Not configured"}</p>
          {pick("planner")?.externalUrl ? <a href={pick("planner")?.externalUrl} className="mt-3 inline-flex min-h-10 items-center text-sm font-bold text-[#2563EB]">Open Planner</a> : null}
        </article>
        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="font-black text-[#0F2744]">Project files</h2>
          <p className="mt-1 text-sm font-semibold capitalize text-slate-600">{pick("sharepoint")?.status.replaceAll("_", " ") || "Not configured"}</p>
          {pick("sharepoint")?.externalUrl ? <a href={pick("sharepoint")?.externalUrl} className="mt-3 inline-flex min-h-10 items-center text-sm font-bold text-[#2563EB]">Open project folder</a> : null}
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
