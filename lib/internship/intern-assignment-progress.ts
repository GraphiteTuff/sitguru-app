"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { findInternByAccount } from "@/lib/internship/queries";
import { isHttpUrl, readAssignmentBrief } from "@/lib/internship/manager-assignment";
import { legacyStatusToStage, nextReviewStage, statusForStage } from "@/lib/internship/review-flow";
import { saveInternAssignmentMarkdown } from "@/lib/microsoft/assignment-sharepoint";
import { publishLiveSignals } from "@/lib/realtime/publish-live-signal";
import { SITGURU_DOMAIN_EVENTS } from "@/lib/realtime/events";
import { pathsForInternWorkspace } from "@/lib/realtime/query-keys";
import { recipientsForIntern } from "@/lib/realtime/recipients";

function bounce(id: string, name: "ok" | "error", message: string): never {
  redirect(`/intern/assignments/${encodeURIComponent(id)}?${name}=${encodeURIComponent(message)}`);
}

export async function saveInternAssignmentProgress(formData: FormData) {
  const id = String(formData.get("assignmentId") || "").trim();
  const intent = formData.get("intent") === "submit" ? "submit" : "save";
  if (!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) redirect("/intern/assignments");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/intern/login");
  const intern = await findInternByAccount({ userId: user.id, email: user.email });
  if (!intern) redirect("/intern/login");

  const { data: task, error: fetchError } = await supabaseAdmin
    .from("internship_tasks")
    .select("id,intern_id,title,due_on,business_objective,brief_payload,status,review_stage")
    .eq("id", id).eq("intern_id", intern.id).maybeSingle();
  if (fetchError || !task || task.status === "draft") redirect("/intern/assignments");

  const stage = legacyStatusToStage(String(task.status), String(task.review_stage || ""));
  if (stage !== "draft" && stage !== "changes_requested") {
    bounce(id, "error", "This assignment is with your manager or has already been approved.");
  }

  const notes = String(formData.get("studentNotes") || "").trim().slice(0, 30000);
  const researchLink = String(formData.get("workUrl") || "").trim().slice(0, 2000);
  if (researchLink && !isHttpUrl(researchLink)) bounce(id, "error", "Add a valid HTTP or HTTPS link.");
  if (intent === "submit" && !notes && !researchLink) {
    bounce(id, "error", "Add your research or a work link before submitting to Ava.");
  }
  if (intent === "submit") {
    const decision = nextReviewStage({
      stage, action: stage === "changes_requested" ? "resubmit" : "submit", actor: "intern",
    });
    if (!decision.ok) bounce(id, "error", decision.error);
  }

  const brief = readAssignmentBrief(task.brief_payload);
  const saved = await saveInternAssignmentMarkdown({
    assignmentId: id,
    internName: intern.fullName,
    title: String(task.title || ""),
    dueOn: String(task.due_on || ""),
    description: brief.description || String(task.business_objective || ""),
    notes,
    researchLink,
  });
  if (!saved.ok) bounce(id, "error", saved.message);

  const now = new Date().toISOString();
  const existing = task.brief_payload && typeof task.brief_payload === "object"
    ? task.brief_payload as Record<string, unknown>
    : {};
  const payload = {
    student_notes: notes,
    work_url: saved.url,
    brief_payload: {
      ...existing,
      internWork: { notes, researchLink, sharePointDocumentUrl: saved.url,
        sharePointDocumentId: saved.id, sharePointFolderUrl: saved.folderUrl, savedAt: now },
    },
    status: intent === "submit"
      ? statusForStage("submitted_to_ava")
      : stage === "changes_requested" ? "revision_requested" : "in_progress",
    review_stage: intent === "submit"
      ? "submitted_to_ava" : stage === "changes_requested" ? "changes_requested" : null,
    ...(intent === "submit" ? { submitted_at: now, supervisor_approved: false } : {}),
    updated_at: now,
  };
  const { data: updated, error } = await supabaseAdmin.from("internship_tasks")
    .update(payload).eq("id", id).eq("intern_id", intern.id)
    .in("status", ["todo", "in_progress", "revision_requested"])
    .select("id").maybeSingle();
  if (error || !updated?.id) {
    bounce(id, "error", "Saved in SharePoint, but SitGuru could not update the assignment status. Please reload.");
  }

  try {
    await publishLiveSignals({
      eventType: SITGURU_DOMAIN_EVENTS.INTERN_ASSIGNMENT_UPDATED,
      recipientUserIds: recipientsForIntern(intern),
      resourceType: "internship_tasks",
      resourceId: id,
      scope: "manager",
      actorUserId: user.id,
      actorLabel: intern.fullName,
      paths: [...pathsForInternWorkspace(), "/intern/assignments", "/manager/assignments"],
      revalidatePaths: [...pathsForInternWorkspace(), "/intern/assignments", "/manager/assignments"],
      notify: intent === "submit",
      notifyTitle: `${intern.preferredName || intern.fullName} submitted an assignment`,
      notifyBody: `${String(task.title || "An assignment")} is ready for review.`,
      notifyHref: "/intern/manage?tab=reviews",
    });
  } catch (publishError) {
    console.warn("intern assignment signal", publishError);
  }
  revalidatePath(`/intern/assignments/${id}`);
  bounce(id, "ok", intent === "submit" ? "Submitted to Ava for review." : "Work saved to SharePoint.");
}
