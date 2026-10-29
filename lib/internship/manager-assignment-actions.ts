"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import {
  assignmentBrief,
  validateManagerAssignment,
  type AssignmentDraft,
} from "@/lib/internship/manager-assignment";
import { canReadPrivateInternRecord, internshipActorKind } from "@/lib/internship/manager-access";
import { findInternById } from "@/lib/internship/queries";
import { uploadInternshipAsset } from "@/lib/internship/storage";
import { internAllowedUpload } from "@/lib/internship/portal";
import { publishInternAssignmentEvent } from "@/lib/realtime/publish-internship";
import { supabaseAdmin } from "@/lib/supabase/admin";

function field(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function list(formData: FormData, key: string) {
  return formData.getAll(key).map((value) => String(value || ""));
}

function bounce(kind: "ok" | "error", message: string): never {
  redirect(`/manager/assignments?${kind}=${encodeURIComponent(message)}`);
}

function fileOf(formData: FormData) {
  const value = formData.get("file");
  if (!value || typeof value === "string") return null;
  if (!("size" in value) || Number((value as File).size) <= 0) return null;
  return value as File;
}

export async function saveManagerAssignment(formData: FormData) {
  const actor = await getAdminIdentity();
  if (!actor) bounce("error", "Sign in with a manager login.");
  const kind = internshipActorKind({ role: actor.role, isSuperUser: actor.isSuperUser });
  if (kind !== "manager" && kind !== "supervisor") {
    bounce("error", "Only a manager can create an assignment.");
  }

  const intent = field(formData, "intent") === "draft" ? "draft" : "create";
  const draft: AssignmentDraft = {
    internId: field(formData, "internId"),
    title: field(formData, "title"),
    category: field(formData, "category"),
    milestoneId: field(formData, "milestoneId"),
    dueOn: field(formData, "dueOn"),
    priority: field(formData, "priority"),
    description: field(formData, "description"),
    deliverables: list(formData, "deliverable"),
    review: field(formData, "review"),
    freedom: field(formData, "freedom"),
    resources: list(formData, "resource"),
    notes: field(formData, "notes"),
    clientRequestId: field(formData, "clientRequestId"),
  };
  const checked = validateManagerAssignment(draft, intent);
  if (!checked.ok) {
    bounce("error", Object.values(checked.errors)[0] || "Check the assignment fields.");
  }
  const value = checked.value;
  const taskId = field(formData, "taskId");

  const intern = await findInternById(value.internId);
  if (
    !intern ||
    !canReadPrivateInternRecord({
      actor: kind,
      actorUserId: actor.id,
      targetInternId: intern.id,
      managerUserId: intern.managerUserId,
    })
  ) {
    bounce("error", "That intern is not on your team.");
  }

  if (value.milestoneId) {
    const { data: milestone } = await supabaseAdmin
      .from("internship_milestones")
      .select("id,cohort_id,university_id")
      .eq("id", value.milestoneId)
      .maybeSingle();
    const sameCohort = milestone?.cohort_id && milestone.cohort_id === intern.cohortId;
    const sameSchool = !milestone?.university_id || milestone.university_id === intern.universityId;
    if (!sameCohort || !sameSchool) bounce("error", "Choose a milestone from this intern's program.");
  }

  const file = fileOf(formData);
  if (file) {
    const blocked = internAllowedUpload(file);
    if (blocked) bounce("error", blocked);
  }

  const brief = assignmentBrief(value, actor.id);
  const payload = {
    intern_id: intern.id,
    title: value.title,
    due_on: value.dueOn || null,
    status: intent === "draft" ? "draft" : "todo",
    work_url: value.resources[0] || "",
    business_objective: value.description,
    metric_affected: value.category,
    student_notes: [
      value.description,
      value.deliverables.length ? `Deliverables:\n${value.deliverables.map((item) => `- ${item}`).join("\n")}` : "",
      value.notes,
    ].filter(Boolean).join("\n\n"),
    supervisor_notes: `Priority: ${value.priority} · Review: ${value.review} · Creative freedom: ${value.freedom}`,
    brief_payload: brief,
    updated_at: new Date().toISOString(),
  };

  let savedId = taskId;
  if (!savedId && value.clientRequestId) {
    const { data: existing } = await supabaseAdmin
      .from("internship_tasks")
      .select("id")
      .eq("intern_id", intern.id)
      .contains("brief_payload", { clientRequestId: value.clientRequestId })
      .limit(1)
      .maybeSingle();
    savedId = String(existing?.id || "");
  }

  if (savedId) {
    const { data: current } = await supabaseAdmin
      .from("internship_tasks")
      .select("id,intern_id,status")
      .eq("id", savedId)
      .maybeSingle();
    if (!current || current.intern_id !== intern.id) bounce("error", "That assignment is not on your team.");
    const { error } = await supabaseAdmin.from("internship_tasks").update(payload).eq("id", savedId);
    if (error) {
      console.warn("saveManagerAssignment update", error.message);
      bounce("error", "We couldn't create this assignment. Please try again.");
    }
  } else {
    const { data: created, error } = await supabaseAdmin
      .from("internship_tasks")
      .insert(payload)
      .select("id")
      .maybeSingle();
    if (error || !created?.id) {
      console.warn("saveManagerAssignment insert", error?.message);
      bounce("error", "We couldn't create this assignment. Please try again.");
    }
    savedId = String(created.id);
  }

  if (file && savedId) {
    try {
      const uploaded = await uploadInternshipAsset({
        file,
        pathPrefix: `interns/${intern.id}/task/${savedId}`,
      });
      if (!uploaded.error) {
        await supabaseAdmin.from("internship_work_attachments").insert({
          intern_id: intern.id,
          item_type: "task",
          item_id: savedId,
          file_name: file.name,
          file_url: uploaded.url,
          storage_bucket: "internship-assets",
          storage_path: uploaded.path,
          mime_type: file.type || "",
          file_size: file.size,
          caption: "Assignment resource",
          category: value.category,
          uploaded_by_role: "manager",
        });
      }
    } catch (error) {
      console.warn("saveManagerAssignment attachment", error);
    }
  }

  try {
    await supabaseAdmin.from("internship_work_comments").insert({
      intern_id: intern.id,
      item_type: "task",
      item_id: savedId,
      author_role: "manager",
      body: intent === "draft" ? "Assignment draft saved." : taskId ? "Assignment updated." : "Assignment created.",
    });
  } catch (error) {
    console.warn("saveManagerAssignment comment", error);
  }

  if (intent === "create") {
    try {
      await publishInternAssignmentEvent({
        intern,
        resourceId: savedId,
        actor: { userId: actor.id, label: actor.email },
        created: !taskId,
      });
    } catch (error) {
      console.warn("saveManagerAssignment signal", error);
    }
    try {
      const { syncPublishedAssignment } = await import("@/lib/microsoft/assignment-sync");
      await syncPublishedAssignment({
        assignmentId: savedId,
        title: value.title,
        description: value.description,
        category: value.category,
        dueOn: value.dueOn,
        priority: value.priority,
        freedom: value.freedom,
        review: value.review,
        deliverables: value.deliverables,
        resources: value.resources,
        internUserId: intern.userId || "",
        internName: intern.preferredName || intern.fullName,
        managerName: actor.email,
        sitguruUrl: `/manager/assignments/${savedId}`,
      });
    } catch (error) {
      console.warn("saveManagerAssignment microsoft", error);
    }
  }

  revalidatePath("/manager/assignments");
  revalidatePath("/intern/manage");
  revalidatePath("/intern/assignments");
  revalidatePath("/intern/work");
  revalidatePath("/intern/calendar");
  const first = (intern.preferredName || intern.fullName || "your intern").split(/\s+/)[0];
  bounce("ok", intent === "draft" ? "Draft saved. The intern will not see it yet." : `Assignment created for ${first}.`);
}

export async function retryManagerAssignmentSync(formData: FormData) {
  const actor = await getAdminIdentity();
  if (!actor) bounce("error", "Sign in with a manager login.");
  const taskId = field(formData, "taskId");
  const { data: task } = await supabaseAdmin
    .from("internship_tasks")
    .select("id,intern_id,title,due_on,status,brief_payload")
    .eq("id", taskId)
    .maybeSingle();
  if (!task?.id || task.status === "draft") bounce("error", "Publish the assignment before syncing Microsoft 365.");
  const intern = await findInternById(String(task.intern_id));
  const kind = internshipActorKind({ role: actor.role, isSuperUser: actor.isSuperUser });
  if (
    !intern ||
    (kind !== "manager" && kind !== "supervisor") ||
    !canReadPrivateInternRecord({
      actor: kind === "supervisor" ? "supervisor" : "manager",
      actorUserId: actor.id,
      targetInternId: intern.id,
      managerUserId: intern.managerUserId,
    })
  ) {
    bounce("error", "That assignment is not on your team.");
  }
  const brief = (await import("@/lib/internship/manager-assignment")).readAssignmentBrief(task.brief_payload);
  try {
    const { syncPublishedAssignment } = await import("@/lib/microsoft/assignment-sync");
    await syncPublishedAssignment({
      assignmentId: String(task.id),
      title: String(task.title || ""),
      description: brief.description || "",
      category: brief.category || "",
      dueOn: String(task.due_on || ""),
      priority: brief.priority || "Normal",
      freedom: brief.freedom || "Guided",
      review: brief.review || "Manager Review Required",
      deliverables: brief.deliverables || [],
      resources: brief.resources || [],
      internUserId: intern.userId || "",
      internName: intern.preferredName || intern.fullName,
      managerName: actor.email,
      sitguruUrl: `/manager/assignments/${task.id}`,
    });
  } catch (error) {
    console.warn("retryManagerAssignmentSync", error);
    bounce("error", "Microsoft sync could not finish. The SitGuru assignment is unchanged.");
  }
  redirect(`/manager/assignments/${task.id}`);
}
