"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  canEditRequirements,
  canGiveCeoReview,
  canReadPrivateInternRecord,
  canReviewRoutineWork,
  internshipActorKind,
  type InternshipActorKind,
} from "@/lib/internship/manager-access";
import {
  validateInternshipHours,
  validateTimeLogDate,
  weekNumberForEntry,
} from "@/lib/internship/hours";
import { WEEK_ZERO_ITEMS } from "@/lib/internship/week-zero";
import {
  isOfficialReviewStage,
  nextReviewStage,
  statusForStage,
  type ReviewAction,
} from "@/lib/internship/review-flow";
import { findInternByAccount, findInternById } from "@/lib/internship/queries";
import { createClient } from "@/lib/supabase/server";

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function bounce(path: string, kind: "ok" | "error", message: string): never {
  const [base, existing] = path.split("?");
  const params = new URLSearchParams(existing || "");
  params.set(kind, message);
  redirect(`${base}?${params.toString()}`);
}

function refresh(path: string) {
  revalidatePath("/intern");
  revalidatePath("/intern/manage");
  revalidatePath("/admin/internship", "layout");
  revalidatePath(path);
}

async function actorContext(): Promise<{
  userId: string;
  email: string;
  kind: InternshipActorKind;
  internId: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = await getAdminIdentity();
  const intern = user
    ? await findInternByAccount({ userId: user.id, email: user.email })
    : null;
  const kind = internshipActorKind({
    role: admin?.role,
    isSuperUser: admin?.isSuperUser,
    isIntern: Boolean(intern),
  });
  return {
    userId: admin?.id || user?.id || "",
    email: admin?.email || user?.email || "",
    kind,
    internId: intern?.id || null,
  };
}

async function assertCanTouchIntern(internId: string, actor: Awaited<ReturnType<typeof actorContext>>) {
  const intern = await findInternById(internId);
  if (!intern) return null;
  const allowed = canReadPrivateInternRecord({
    actor: actor.kind,
    actorUserId: actor.userId,
    actorInternId: actor.internId,
    targetInternId: internId,
    managerUserId: intern.managerUserId,
  });
  return allowed ? intern : null;
}

export async function saveTimeEntry(formData: FormData) {
  const actor = await actorContext();
  const internId = text(formData, "internId");
  const intern = await assertCanTouchIntern(internId, actor);
  if (!intern || actor.kind !== "intern" || actor.internId !== internId) {
    bounce("/intern", "error", "You can only log your own hours.");
  }

  const hours = validateInternshipHours(text(formData, "hours"));
  if (!hours.ok) bounce("/intern?tab=home", "error", hours.error);
  const workedOn = text(formData, "workedOn");
  const dateError = validateTimeLogDate({
    workedOn,
    startDate: intern.academicStartDate,
    endDate: intern.academicEndDate,
  });
  if (dateError) bounce("/intern?tab=home", "error", dateError);
  const activity = text(formData, "activity");
  if (activity.length < 3) bounce("/intern?tab=home", "error", "Name the activity in a few words.");

  const submit = text(formData, "submit") === "yes";
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.from("internship_time_logs").insert({
    intern_id: internId,
    worked_on: workedOn,
    hours: hours.hours,
    activity,
    work_item_type: text(formData, "workItemType"),
    work_item_id: text(formData, "workItemId"),
    week_number: weekNumberForEntry(intern.academicStartDate, workedOn),
    notes: text(formData, "notes"),
    evidence_url: text(formData, "evidenceUrl"),
    status: submit ? "submitted" : "draft",
    submitted_at: submit ? now : null,
  });
  if (error) bounce("/intern?tab=home", "error", "Hours could not be saved yet.");
  refresh("/intern");
  bounce("/intern?tab=home", "ok", submit ? "Hours submitted to your manager." : "Hours saved as a draft.");
}

export async function reviewTimeEntry(formData: FormData) {
  const actor = await actorContext();
  if (!canReviewRoutineWork(actor.kind)) bounce("/intern/manage", "error", "Manager review is required.");
  const internId = text(formData, "internId");
  const intern = await assertCanTouchIntern(internId, actor);
  if (!intern) bounce("/intern/manage", "error", "That intern is not on your team.");
  const id = text(formData, "id");
  const decision = text(formData, "decision");
  const comment = text(formData, "comment");
  if (decision === "changes" && !comment) {
    bounce("/intern/manage?tab=reviews", "error", "Tell the intern what to fix.");
  }
  const status = decision === "approve"
    ? actor.kind === "supervisor" && text(formData, "verify") === "yes"
      ? "supervisor_verified"
      : "ava_approved"
    : "changes_requested";
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from("internship_time_logs")
    .update({
      status,
      manager_reviewed_at: now,
      manager_reviewed_by: actor.userId,
      ...(status === "supervisor_verified"
        ? { supervisor_reviewed_at: now, supervisor_reviewed_by: actor.userId }
        : {}),
      updated_at: now,
    })
    .eq("id", id)
    .eq("intern_id", internId)
    .eq("status", "submitted");
  if (error) bounce("/intern/manage?tab=reviews", "error", "Those hours could not be reviewed.");
  await supabaseAdmin.from("internship_review_events").insert({
    intern_id: internId,
    target_type: "hours",
    target_id: id,
    reviewer_id: actor.userId,
    reviewer_role: actor.kind,
    review_stage: status,
    status,
    comment,
  });
  refresh("/intern/manage");
  bounce("/intern/manage?tab=reviews", "ok", status === "changes_requested" ? "Hours sent back." : "Hours approved.");
}

export async function askAva(formData: FormData) {
  const actor = await actorContext();
  const internId = text(formData, "internId");
  const intern = await assertCanTouchIntern(internId, actor);
  if (!intern) bounce("/intern", "error", "You can only ask about your own internship.");
  const question = text(formData, "question");
  if (question.length < 4) bounce("/intern", "error", "Write the question you want your manager to see.");
  const askedByRole = actor.kind === "intern" ? "intern" : actor.kind;
  if (askedByRole === "none") bounce("/intern", "error", "Sign in to ask your manager.");
  const { error } = await supabaseAdmin.from("internship_questions").insert({
    intern_id: internId,
    target_type: text(formData, "targetType"),
    target_id: text(formData, "targetId"),
    target_title: text(formData, "targetTitle"),
    question,
    urgency: text(formData, "urgency") === "high" ? "high" : "normal",
    status: "open",
    asked_by_role: askedByRole === "intern" ? "intern" : "manager",
  });
  if (error) bounce(text(formData, "returnTo") || "/intern", "error", "Question could not be sent.");
  refresh("/intern");
  bounce(text(formData, "returnTo") || "/intern", "ok", askedByRole === "intern" ? "Your manager has your question." : "Question sent to the intern.");
}

export async function answerInternQuestion(formData: FormData) {
  const actor = await actorContext();
  if (!canReviewRoutineWork(actor.kind)) bounce("/intern/manage", "error", "Only the assigned manager or formal supervisor can answer.");
  const internId = text(formData, "internId");
  const intern = await assertCanTouchIntern(internId, actor);
  if (!intern) bounce("/intern/manage?tab=questions", "error", "That intern is not on your team.");
  const answer = text(formData, "answer");
  if (!answer) bounce("/intern/manage?tab=questions", "error", "Write a short answer.");
  const { error } = await supabaseAdmin
    .from("internship_questions")
    .update({
      answer,
      status: "answered",
      answered_at: new Date().toISOString(),
      answered_by: actor.userId,
    })
    .eq("id", text(formData, "id"))
    .eq("intern_id", internId);
  if (error) bounce("/intern/manage?tab=questions", "error", "Answer could not be saved.");
  refresh("/intern/manage");
  bounce("/intern/manage?tab=questions", "ok", "Answer saved.");
}

export async function saveStartChecks(formData: FormData) {
  const actor = await actorContext();
  const internId = text(formData, "internId");
  if (actor.kind !== "intern" || actor.internId !== internId) {
    bounce("/intern", "error", "You can only update your own Start Here list.");
  }
  const selected = new Set(formData.getAll("item").map((value) => String(value)));
  const keys = WEEK_ZERO_ITEMS.map((item) => item.key).filter((key) => selected.has(key));
  if (keys.length) {
    const { error } = await supabaseAdmin.from("internship_start_checks").upsert(
      keys.map((itemKey) => ({ intern_id: internId, item_key: itemKey })),
      { onConflict: "intern_id,item_key" },
    );
    if (error) bounce("/intern", "error", "Start Here could not be saved.");
    await supabaseAdmin
      .from("internship_start_checks")
      .delete()
      .eq("intern_id", internId)
      .not("item_key", "in", `(${keys.join(",")})`);
  } else {
    await supabaseAdmin.from("internship_start_checks").delete().eq("intern_id", internId);
  }
  refresh("/intern");
  bounce("/intern", "ok", "Start Here checklist saved.");
}

export async function approveWeekZero(formData: FormData) {
  const actor = await actorContext();
  if (!canEditRequirements(actor.kind)) bounce("/intern/manage", "error", "Only Jason can clear Start Here.");
  const internId = text(formData, "internId");
  const intern = await assertCanTouchIntern(internId, actor);
  if (!intern) bounce("/intern/manage", "error", "That intern is not on your team.");
  const { error } = await supabaseAdmin
    .from("internship_interns")
    .update({ week_zero_approved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", internId);
  if (error) bounce("/intern/manage", "error", "Start Here could not be approved.");
  await supabaseAdmin.from("internship_review_events").insert({
    intern_id: internId,
    target_type: "week_zero",
    target_id: internId,
    reviewer_id: actor.userId,
    reviewer_role: actor.kind,
    review_stage: "approved_complete",
    status: "approved",
    comment: text(formData, "comment") || "Supervisor approved Start Here.",
  });
  refresh("/intern/manage");
  bounce("/intern/manage", "ok", "Start Here approved. Week 1 can begin on the start date.");
}

export async function reviewPortalSubmission(formData: FormData) {
  const actor = await actorContext();
  const internId = text(formData, "internId");
  const intern = await assertCanTouchIntern(internId, actor);
  if (!intern || !canReviewRoutineWork(actor.kind)) {
    bounce("/intern/manage?tab=reviews", "error", "You can’t review that submission.");
  }
  const action = text(formData, "reviewAction") as ReviewAction;
  const targetType = text(formData, "targetType");
  const targetId = text(formData, "targetId");
  const comment = text(formData, "comment");
  if ((action === "request_changes" || action === "escalate" || action === "ceo_request_changes") && !comment) {
    bounce("/intern/manage?tab=reviews", "error", "Add a note so the intern knows what you decided.");
  }
  if ((action === "ceo_approve" || action === "ceo_request_changes") && !canGiveCeoReview(actor.kind)) {
    bounce("/intern/manage?tab=reviews", "error", "Only Jason can complete CEO review.");
  }

  if (targetType === "hours") {
    formData.set("id", targetId);
    formData.set("decision", action === "approve" || action === "ceo_approve" ? "approve" : "changes");
    if (action === "ceo_approve") formData.set("verify", "yes");
    return reviewTimeEntry(formData);
  }

  const table = targetType === "content"
    ? "internship_content"
    : targetType === "weekly"
      ? "internship_weekly_reviews"
      : "internship_tasks";
  const { data: existing } = await supabaseAdmin.from(table).select("*").eq("id", targetId).eq("intern_id", internId).maybeSingle();
  if (!existing) bounce("/intern/manage?tab=reviews", "error", "That submission is gone.");

  const currentStage = targetType === "weekly"
    ? String(existing.review_status || "submitted_to_ava")
    : String(existing.review_stage || existing.status || "submitted");
  const next = nextReviewStage({ stage: currentStage, action, actor: actor.kind === "supervisor" ? "supervisor" : "manager" });
  if (!next.ok) bounce("/intern/manage?tab=reviews", "error", next.error);

  const now = new Date().toISOString();
  const official = isOfficialReviewStage(next.stage);
  const payload = targetType === "weekly"
    ? {
        review_status: next.stage,
        contribution_approved: official,
        work_approved: official,
        upcoming_approved: official,
      }
    : {
        review_stage: next.stage,
        status: statusForStage(next.stage),
        supervisor_approved: official,
        supervisor_notes: comment,
        approved_at: official ? now : null,
        approved_by: official ? actor.userId : null,
        ...(targetType === "task" ? { updated_at: now } : {}),
      };

  const { error } = await supabaseAdmin.from(table).update(payload).eq("id", targetId).eq("intern_id", internId);
  if (error) bounce("/intern/manage?tab=reviews", "error", "Review could not be saved.");

  await supabaseAdmin.from("internship_review_events").insert({
    intern_id: internId,
    target_type: targetType,
    target_id: targetId,
    reviewer_id: actor.userId,
    reviewer_role: actor.kind,
    review_stage: next.stage,
    status: next.stage,
    comment,
  });

  if (official) {
    const body = targetType === "weekly"
      ? String(existing.contribution_added || existing.accomplished || "")
      : String(existing.student_notes || existing.title || "");
    const { data: prior } = await supabaseAdmin
      .from("internship_report_revisions")
      .select("version")
      .eq("source_type", targetType)
      .eq("source_id", targetId)
      .order("version", { ascending: false })
      .limit(1);
    const version = Number(prior?.[0]?.version || 0) + 1;
    await supabaseAdmin.from("internship_report_revisions").insert({
      intern_id: internId,
      source_type: targetType,
      source_id: targetId,
      section_id: String(existing.final_section || ""),
      body,
      status: next.stage,
      version,
      reason: version > 1 ? comment || "Approved revision" : "",
      reviewer_id: actor.userId,
      approved: true,
    });
  }

  refresh(`/admin/internship/interns/${internId}`);
  bounce("/intern/manage?tab=reviews", "ok", official ? "Approved. It can go into the report." : "Review saved.");
}

export async function saveRequirementConfig(formData: FormData) {
  const actor = await actorContext();
  if (!canEditRequirements(actor.kind)) {
    bounce("/intern/manage?tab=settings", "error", "Only Jason can change university requirements.");
  }
  const internId = text(formData, "internId");
  const intern = await assertCanTouchIntern(internId, actor);
  if (!intern) bounce("/intern/manage?tab=settings", "error", "That intern is not on your team.");
  const reason = text(formData, "reason");
  if (reason.length < 4) bounce("/intern/manage?tab=settings", "error", "Add a short reason for the requirement change.");

  const next = {
    credits: text(formData, "credits"),
    required_hours: text(formData, "requiredHours"),
    planned_weekly_hours: text(formData, "plannedWeeklyHours"),
    internship_weeks: text(formData, "internshipWeeks"),
    academic_start_date: text(formData, "startDate"),
    academic_end_date: text(formData, "endDate"),
    semester: text(formData, "semester"),
    academic_year: text(formData, "academicYear"),
    requirement_status: text(formData, "requirementStatus") || "pending",
    university_verification_status: text(formData, "verificationStatus") || "pending",
    university_notes: text(formData, "universityNotes"),
    day_to_day_manager_name: text(formData, "managerName"),
    site_supervisor_name: text(formData, "supervisorName"),
  };
  const previous: Record<string, string> = {
    credits: intern.credits == null ? "" : String(intern.credits),
    required_hours: intern.requiredHours == null ? "" : String(intern.requiredHours),
    planned_weekly_hours: intern.plannedWeeklyHours == null ? "" : String(intern.plannedWeeklyHours),
    internship_weeks: intern.internshipWeeks == null ? "" : String(intern.internshipWeeks),
    academic_start_date: intern.academicStartDate || "",
    academic_end_date: intern.academicEndDate || "",
    semester: intern.semester || "",
    academic_year: intern.academicYear || "",
    requirement_status: intern.requirementStatus || "",
    university_verification_status: intern.universityVerificationStatus || "",
    university_notes: intern.universityNotes || "",
    day_to_day_manager_name: intern.dayToDayManagerName || "",
    site_supervisor_name: intern.siteSupervisorName || "",
  };

  const payload: Record<string, unknown> = {
    semester: next.semester,
    academic_year: next.academic_year,
    requirement_status: next.requirement_status,
    university_verification_status: next.university_verification_status,
    university_notes: next.university_notes,
    day_to_day_manager_name: next.day_to_day_manager_name,
    site_supervisor_name: next.site_supervisor_name,
    academic_start_date: next.academic_start_date || null,
    academic_end_date: next.academic_end_date || null,
    credits: next.credits ? Number(next.credits) : null,
    required_hours: next.required_hours ? Number(next.required_hours) : null,
    planned_weekly_hours: next.planned_weekly_hours ? Number(next.planned_weekly_hours) : null,
    internship_weeks: next.internship_weeks ? Number(next.internship_weeks) : null,
    updated_at: new Date().toISOString(),
  };
  if (next.university_verification_status === "confirmed") {
    payload.hours_verified_by = actor.userId;
    payload.hours_verification_date = new Date().toISOString().slice(0, 10);
  }

  const { error } = await supabaseAdmin.from("internship_interns").update(payload).eq("id", internId);
  if (error) bounce("/intern/manage?tab=settings", "error", "Requirements could not be saved.");

  const audits = Object.entries(next)
    .filter(([field, value]) => previous[field] !== value)
    .map(([field, value]) => ({
      intern_id: internId,
      actor_id: actor.userId,
      field_name: field,
      previous_value: previous[field] || "",
      next_value: value,
      reason,
    }));
  if (audits.length) await supabaseAdmin.from("internship_requirement_audits").insert(audits);

  const exceptionWeek = text(formData, "exceptionWeek");
  const exceptionHours = text(formData, "exceptionHours");
  if (exceptionWeek) {
    const planned = Number(exceptionHours);
    if (!Number.isFinite(planned) || planned < 0) {
      bounce("/intern/manage?tab=settings", "error", "Exception hours can’t be negative.");
    }
    await supabaseAdmin.from("internship_schedule_exceptions").upsert(
      {
        intern_id: internId,
        week_number: Number(exceptionWeek),
        planned_hours: planned,
        reason,
      },
      { onConflict: "intern_id,week_number" },
    );
  }

  refresh("/intern/manage");
  bounce("/intern/manage?tab=settings", "ok", "Requirements updated. Past approved hours stay as they were.");
}
