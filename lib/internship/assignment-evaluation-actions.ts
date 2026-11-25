"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { parseAssignmentRubric } from "@/lib/internship/assignment-rubric";
import { canReadPrivateInternRecord, internshipActorKind, isPortalUserId } from "@/lib/internship/manager-access";
import { findInternById } from "@/lib/internship/queries";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function saveAssignmentEvaluation(form: FormData) {
  const read = (key: string) => String(form.get(key) ?? "").trim();
  const taskId = read("taskId");
  const internId = read("internId");
  if (!isPortalUserId(taskId) || !isPortalUserId(internId)) redirect("/manager/speed-review");

  const path = `/manager/assignments/${taskId}`;
  const fail = (message: string): never => redirect(`${path}?${new URLSearchParams({ error: message })}#evaluation`);
  const user = await getAdminIdentity();
  const kind = internshipActorKind({ role: user?.role, isSuperUser: user?.isSuperUser });
  if (!user || (kind !== "manager" && kind !== "supervisor")) return fail("Instructor access required.");
  const intern = await findInternById(internId);
  if (!intern || !canReadPrivateInternRecord({
    actor: kind, actorUserId: user.id, targetInternId: intern.id, managerUserId: intern.managerUserId,
  })) return fail("Instructor access required.");

  const intent = read("evaluationIntent");
  const requestId = read("evaluationRequestId");
  const rubric = parseAssignmentRubric(form);
  if (!isPortalUserId(requestId) || !rubric || (intent !== "draft" && intent !== "release")) {
    return fail("Check each score and rubric maximum.");
  }

  const { data: task, error: taskError } = await supabaseAdmin.from("internship_tasks")
    .select("id,status,submitted_at,review_stage")
    .eq("id", taskId).eq("intern_id", internId).maybeSingle();
  if (taskError || !task || !["submitted", "approved", "revision_requested"].includes(task.status)) {
    return fail("Choose an assignment that has been submitted.");
  }
  if (read("evaluatedSubmissionAt") !== String(task.submitted_at || "")) {
    return fail("This assignment changed. Review the latest submission before saving an evaluation.");
  }
  if (intent === "release") return fail("Official semester evaluation release is disabled during pre-launch.");
  if (intent === "release" && kind !== "supervisor" &&
      ["submitted_to_jason", "ceo_review_required"].includes(String(task.review_stage))) {
    return fail("This assignment is waiting for supervisor review.");
  }

  if (kind !== "supervisor") {
    const { data: prior, error } = await supabaseAdmin.from("internship_assignment_evaluations")
      .select("maximums").eq("task_id", taskId).eq("intern_id", internId)
      .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(1).maybeSingle();
    const maximums = prior?.maximums || [25, 25, 25, 25];
    if (error || rubric.maximums.some((value, index) => value !== maximums[index])) {
      return fail("Only the supervisor can change rubric maximums.");
    }
  }

  const { error } = await supabaseAdmin.from("internship_assignment_evaluations").upsert({
    id: requestId,
    task_id: taskId,
    intern_id: internId,
    evaluator_id: user.id,
    scores: rubric.scores,
    maximums: rubric.maximums,
    feedback: rubric.feedback,
    private_notes: rubric.privateNotes,
    evaluated_submission_at: task.submitted_at,
    released_at: intent === "release" ? new Date().toISOString() : null,
  }, { onConflict: "id", ignoreDuplicates: true });
  if (error) {
    console.error("[internship] Evaluation not saved", error.code);
    return fail("The evaluation could not be saved.");
  }

  revalidatePath(path);
  revalidatePath("/intern/grades");
  revalidatePath(`/intern/assignments/${taskId}`);
  redirect(`${path}?${new URLSearchParams({ ok: intent === "release" ? "Evaluation released." : "Evaluation draft saved." })}#evaluation`);
}
