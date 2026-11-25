import "server-only";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isHttpUrl, readAssignmentBrief } from "@/lib/internship/manager-assignment";
import { legacyStatusToStage, nextReviewStage, statusForStage } from "@/lib/internship/review-flow";
import { saveInternAssignmentMarkdown } from "@/lib/microsoft/assignment-sharepoint";
import { publishLiveSignals } from "@/lib/realtime/publish-live-signal";
import { SITGURU_DOMAIN_EVENTS } from "@/lib/realtime/events";
import { pathsForInternWorkspace } from "@/lib/realtime/query-keys";
import { recipientsForIntern } from "@/lib/realtime/recipients";

import type { InternshipIntern } from "@/lib/internship/types";

export async function saveOwnAssignmentProgress(input: {
  intern: InternshipIntern;
  userId: string;
  assignmentId: string;
  intent: "submit" | "save";
  formData: FormData;
}) {
  const { intern, userId, assignmentId: id, intent, formData } = input;
  const fail = (error: string, status = 400) => ({ ok: false as const, error, status });
  if (intern.userId && intern.userId !== userId) return fail("Intern account access required.", 403);
  const { data: task, error: fetchError } = await supabaseAdmin
    .from("internship_tasks")
    .select("id,intern_id,title,due_on,business_objective,brief_payload,status,review_stage,updated_at")
    .eq("id", id).eq("intern_id", intern.id).maybeSingle();
  if (fetchError || !task || task.status === "draft") return fail("Assignment not found.", 404);

  const stage = legacyStatusToStage(String(task.status), String(task.review_stage || ""));
  if (stage !== "draft" && stage !== "changes_requested") {
    return fail("This assignment is with your manager or has already been approved.");
  }

  const existing = task.brief_payload && typeof task.brief_payload === "object"
    ? task.brief_payload as Record<string, unknown>
    : {};
  const previousWork = existing.internWork && typeof existing.internWork === "object"
    ? existing.internWork as Record<string, unknown>
    : {};
  const priorAttachmentUrl = typeof previousWork.attachmentUrl === "string" && isHttpUrl(previousWork.attachmentUrl)
    ? previousWork.attachmentUrl : "";
  const upload = formData.get("supportingFile");
  const attachment = upload instanceof File && upload.size > 0 ? upload : undefined;
  if (attachment && (attachment.size > 10 * 1024 * 1024 || !/\.(pdf|docx|xlsx|pptx|png|jpe?g)$/i.test(attachment.name))) {
    return fail("Choose a PDF, Office document, PNG, or JPEG up to 10 MB.");
  }

  const notes = String(formData.get("studentNotes") || "").trim().slice(0, 30000);
  const researchLink = String(formData.get("workUrl") || "").trim().slice(0, 2000);
  const supportingLinks = [...new Set(String(formData.get("supportingLinks") || "")
    .split(/\r?\n/).map((line) => line.trim()).filter(Boolean))];
  if (supportingLinks.length > 10 || [researchLink, ...supportingLinks].some((link) => link && (link.length > 2000 || !isHttpUrl(link)))) {
    return fail("Add up to 10 supporting links using HTTP or HTTPS.");
  }
  if (intent === "submit" && !notes && !researchLink && !supportingLinks.length && !attachment && !priorAttachmentUrl) {
    return fail("Add your research or a work link before submitting to Ava.");
  }
  if (intent === "submit") {
    const decision = nextReviewStage({
      stage, action: stage === "changes_requested" ? "resubmit" : "submit", actor: "intern",
    });
    if (!decision.ok) return fail(decision.error);
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
    supportingLinks,
    submissionId: intent === "submit" ? randomUUID() : undefined,
    attachment,
    priorAttachmentUrl,
  });
  if (!saved.ok) return fail(saved.message);

  const now = new Date().toISOString();
  const payload = {
    student_notes: notes,
    work_url: saved.url,
    brief_payload: {
      ...existing,
      internWork: { notes, researchLink, supportingLinks, attachmentUrl: saved.attachmentUrl, sharePointDocumentUrl: saved.url,
        sharePointDocumentId: saved.id, sharePointFolderUrl: saved.folderUrl, savedAt: now },
    },
    status: intent === "submit"
      ? statusForStage("submitted_to_ava")
      : stage === "changes_requested" ? "revision_requested" : "in_progress",
    review_stage: intent === "submit"
      ? "submitted_to_ava" : stage === "changes_requested" ? "changes_requested" : "",
    ...(intent === "submit" ? { submitted_at: now, supervisor_approved: false } : {}),
    updated_at: now,
  };
  const update = supabaseAdmin.from("internship_tasks").update(payload)
    .eq("id", id).eq("intern_id", intern.id).eq("status", task.status);
  if (task.updated_at) update.eq("updated_at", task.updated_at);
  else update.is("updated_at", null);
  const { data: updated, error } = await update.select("id").maybeSingle();
  if (error || !updated?.id) {
    return fail("Saved in SharePoint, but SitGuru could not update the assignment status. Please reload.");
  }

  try {
    await publishLiveSignals({
      eventType: SITGURU_DOMAIN_EVENTS.INTERN_ASSIGNMENT_UPDATED,
      recipientUserIds: recipientsForIntern(intern),
      resourceType: "internship_tasks",
      resourceId: id,
      scope: "manager",
      actorUserId: userId,
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
  return { ok: true as const, message: intent === "submit" ? "Submitted to Ava for review." : "Work saved to SharePoint." };
}
