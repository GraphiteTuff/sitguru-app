"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  findInternByAccount,
  freezeAcademicProfile,
  getUniversity,
  listCampuses,
  listRequirements,
  matchRequirementForProgram,
} from "@/lib/internship/queries";
import { SEMESTER_DELIVERABLES } from "@/lib/internship/playbook";
import {
  addInternWorkComment,
  reviewInternWorkRecord,
  submitInternWorkRecord,
} from "@/lib/internship/work";

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function optionalNumber(formData: FormData, key: string) {
  const raw = text(formData, key);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function bounce(path: string, kind: "ok" | "error", message: string) {
  const params = new URLSearchParams({ [kind]: message });
  redirect(`${path}?${params.toString()}`);
}

async function requireInternshipAdmin() {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) {
    redirect("/admin/login");
  }
  return actor;
}

async function assertWorkspaceActor(internId: string, mode: string) {
  if (mode === "supervisor") {
    await requireInternshipAdmin();
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/intern/login");

  const intern = await findInternByAccount({
    userId: user.id,
    email: user.email,
  });
  if (!intern || intern.id !== internId) redirect("/intern/login");
}

function refreshInternship(extra?: string) {
  revalidatePath("/admin/internship");
  revalidatePath("/admin/internship/universities");
  revalidatePath("/admin/internship/interns", "layout");
  revalidatePath("/admin/internship/timeline");
  revalidatePath("/admin/internship/playbook");
  revalidatePath("/admin/hr");
  revalidatePath("/intern", "layout");
  if (extra) revalidatePath(extra);
}

export async function saveUniversity(formData: FormData) {
  await requireInternshipAdmin();
  const id = text(formData, "id");
  const name = text(formData, "name");
  if (!name) bounce("/admin/internship/universities", "error", "University name is required.");

  const slug =
    text(formData, "slug") ||
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const payload = {
    slug,
    name,
    display_name: text(formData, "displayName") || name,
    short_name: text(formData, "shortName"),
    city: text(formData, "city"),
    state: text(formData, "state"),
    region: text(formData, "region"),
    website_url: text(formData, "websiteUrl"),
    status: text(formData, "status") || "research_needed",
    is_university_partner: text(formData, "isUniversityPartner") === "true",
    partner_notes: text(formData, "partnerNotes"),
    remote_eligible: text(formData, "remoteEligible") !== "false",
    academic_credit_status: text(formData, "academicCreditStatus") || "unknown",
    internship_eligibility_status:
      text(formData, "internshipEligibilityStatus") || "unknown",
    funding_status: text(formData, "fundingStatus") || "unknown",
    source_url: text(formData, "sourceUrl"),
    notes: text(formData, "notes"),
    updated_at: new Date().toISOString(),
  };

  const query = id
    ? supabaseAdmin.from("internship_universities").update(payload).eq("id", id)
    : supabaseAdmin.from("internship_universities").insert(payload).select("id").maybeSingle();

  const { data, error } = await query;
  if (error) {
    bounce("/admin/internship/universities", "error", error.message);
  }
  refreshInternship();
  const nextId = id || String((data as { id?: string } | null)?.id || "");
  bounce(
    nextId ? `/admin/internship/universities/${nextId}` : "/admin/internship/universities",
    "ok",
    id ? "University updated." : "University added.",
  );
}

export async function markUniversityVerified(formData: FormData) {
  const actor = await requireInternshipAdmin();
  const id = text(formData, "id");
  const { error } = await supabaseAdmin
    .from("internship_universities")
    .update({
      verified_at: new Date().toISOString(),
      verified_by: actor.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) bounce(`/admin/internship/universities/${id}`, "error", error.message);
  refreshInternship(`/admin/internship/universities/${id}`);
  bounce(`/admin/internship/universities/${id}`, "ok", "Requirements marked verified.");
}

export async function saveAcademicRequirement(formData: FormData) {
  const actor = await requireInternshipAdmin();
  const universityId = text(formData, "universityId");
  const payload = {
    university_id: universityId,
    campus_id: text(formData, "campusId") || null,
    department: text(formData, "department"),
    academic_program: text(formData, "academicProgram"),
    course_code: text(formData, "courseCode"),
    course_name: text(formData, "courseName"),
    credit_hours: optionalNumber(formData, "creditHours"),
    minimum_internship_hours: optionalNumber(formData, "minimumInternshipHours"),
    requires_faculty_supervisor: formData.get("requiresFacultySupervisor") === "on",
    requires_learning_agreement: formData.get("requiresLearningAgreement") === "on",
    requires_offer_letter: formData.get("requiresOfferLetter") === "on",
    requires_midpoint_evaluation: formData.get("requiresMidpointEvaluation") === "on",
    requires_final_evaluation: formData.get("requiresFinalEvaluation") === "on",
    requires_timesheet: formData.get("requiresTimesheet") === "on",
    requires_final_report: formData.get("requiresFinalReport") === "on",
    requires_student_reflection: formData.get("requiresStudentReflection") === "on",
    requires_site_visit: formData.get("requiresSiteVisit") === "on",
    other_requirements: text(formData, "otherRequirements"),
    source_url: text(formData, "sourceUrl"),
    status: text(formData, "status") || "verified",
    verified_at: new Date().toISOString(),
    verified_by: actor.id,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabaseAdmin
    .from("internship_academic_requirements")
    .insert(payload);
  if (error) bounce(`/admin/internship/universities/${universityId}`, "error", error.message);
  refreshInternship(`/admin/internship/universities/${universityId}`);
  bounce(`/admin/internship/universities/${universityId}`, "ok", "Requirement saved. Do not invent unverified rules.");
}

export async function saveUniversityContact(formData: FormData) {
  await requireInternshipAdmin();
  const universityId = text(formData, "universityId");
  const { error } = await supabaseAdmin.from("internship_university_contacts").insert({
    university_id: universityId,
    full_name: text(formData, "fullName"),
    title: text(formData, "title"),
    department: text(formData, "department"),
    role_key: text(formData, "roleKey") || "career_services",
    email: text(formData, "email"),
    phone: text(formData, "phone"),
    notes: text(formData, "notes"),
  });
  if (error) bounce(`/admin/internship/universities/${universityId}`, "error", error.message);
  refreshInternship(`/admin/internship/universities/${universityId}`);
  bounce(`/admin/internship/universities/${universityId}`, "ok", "Contact saved.");
}

export async function saveIntern(formData: FormData) {
  await requireInternshipAdmin();
  const cohortId = text(formData, "cohortId");
  const universityId = text(formData, "universityId");
  const fullName = text(formData, "fullName");
  const email = text(formData, "email").toLowerCase();
  if (!cohortId || !universityId || !fullName || !email) {
    bounce("/admin/internship/interns", "error", "Name, email, university, and cohort are required.");
  }

  const university = await getUniversity(universityId);
  if (!university) bounce("/admin/internship/interns", "error", "University not found.");

  const campuses = await listCampuses(universityId);
  const campusId = text(formData, "campusId") || null;
  const campusName =
    campuses.find((row) => row.id === campusId)?.displayName || "";
  const academicProgram = text(formData, "academicProgram");
  const requirements = await listRequirements(universityId, campusId || undefined);
  const requirement = matchRequirementForProgram(requirements, academicProgram);

  const internFields = {
    academicProgram,
    courseCode: text(formData, "courseCode") || requirement?.courseCode || "",
    credits: optionalNumber(formData, "credits") ?? requirement?.creditHours ?? null,
    requiredHours:
      optionalNumber(formData, "requiredHours") ??
      requirement?.minimumInternshipHours ??
      null,
    facultySupervisor: text(formData, "facultySupervisor"),
    academicAdvisor: text(formData, "academicAdvisor"),
    careerOffice: text(formData, "careerOffice"),
    academicCoordinator: text(formData, "academicCoordinator"),
    approvalStatus: text(formData, "approvalStatus") || "pending",
    approvalDate: text(formData, "approvalDate") || null,
    semester: text(formData, "semester"),
    academicStartDate: text(formData, "academicStartDate") || null,
    academicEndDate: text(formData, "academicEndDate") || null,
  };

  const snapshot = freezeAcademicProfile({
    university: university!,
    campusName,
    intern: internFields,
    requirement,
  });

  const payload = {
    full_name: fullName,
    email,
    phone: text(formData, "phone"),
    cohort_id: cohortId,
    university_id: universityId,
    campus_id: campusId,
    path_type: text(formData, "pathType") || "credit_bearing",
    academic_program: internFields.academicProgram,
    course_code: internFields.courseCode,
    credits: internFields.credits,
    required_hours: internFields.requiredHours,
    faculty_supervisor: internFields.facultySupervisor,
    academic_advisor: internFields.academicAdvisor,
    career_office: internFields.careerOffice,
    academic_coordinator: internFields.academicCoordinator,
    approval_status: internFields.approvalStatus,
    approval_date: internFields.approvalDate,
    semester: internFields.semester,
    academic_start_date: internFields.academicStartDate,
    academic_end_date: internFields.academicEndDate,
    status: text(formData, "status") || "accepted",
    portal_enabled: true,
    academic_snapshot: snapshot,
    notes: text(formData, "notes"),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("internship_interns")
    .insert(payload)
    .select("id")
    .maybeSingle();
  if (error) bounce("/admin/internship/interns", "error", error.message);
  const internId = String((data as { id?: string } | null)?.id || "");
  if (internId) {
    await supabaseAdmin.from("internship_access_grants").insert(
      [
        ["intern_dashboard", true, "Internship Growth Dashboard"],
        ["utm_builder", true, "UTM and referral tracking"],
        ["experiment_log", true, "Experiment log"],
        ["brand_kit", true, "SitGuru brand standards"],
        [
          "verified_metrics",
          false,
          "Grant only the analytics views needed after onboarding",
        ],
        [
          "limited_admin",
          false,
          "Role-based SitGuru tools. Never grant customer PII.",
        ],
      ].map(([tool, granted, notes]) => ({
        intern_id: internId,
        tool_key: tool,
        granted,
        notes,
        granted_at: granted ? new Date().toISOString() : null,
      })),
    );
    await supabaseAdmin.from("internship_tasks").insert(
      SEMESTER_DELIVERABLES.map((item) => ({
        intern_id: internId,
        title: item.title,
        status: "todo",
        business_objective: item.demonstrates,
        metric_affected: "Tier 1 or Tier 2 SitGuru-verified KPI",
        student_notes: `${item.timing} · Shared SitGuru semester deliverable`,
      })),
    );
  }
  refreshInternship();
  bounce(
    `/admin/internship/interns/${internId}`,
    "ok",
    requirement
      ? "Intern added. Academic requirements were frozen and SMART tools were staged."
      : "Intern added. University requirements have not yet been verified — do not invent hours or courses.",
  );
}

export async function saveInternTask(formData: FormData) {
  const internId = text(formData, "internId");
  const mode = text(formData, "mode") || "intern";
  const taskId = text(formData, "id");
  await assertWorkspaceActor(internId, mode);

  if (taskId) {
    const payload = {
      status: text(formData, "status") || "todo",
      work_url: text(formData, "workUrl"),
      student_notes: text(formData, "studentNotes"),
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabaseAdmin
      .from("internship_tasks")
      .update(payload)
      .eq("id", taskId)
      .eq("intern_id", internId);
    if (error) bounce(workspacePath(internId, mode), "error", error.message);
    refreshInternship(workspacePath(internId, mode));
    bounce(workspacePath(internId, mode), "ok", "Task updated on Intern Portal and Employer HQ.");
  }

  const payload = {
    intern_id: internId,
    title: text(formData, "title"),
    due_on: text(formData, "dueOn") || null,
    status: text(formData, "status") || "todo",
    work_url: text(formData, "workUrl"),
    business_objective: text(formData, "businessObjective"),
    metric_affected: text(formData, "metricAffected"),
    student_notes: text(formData, "studentNotes"),
    project_id: text(formData, "projectId") || null,
  };
  if (!payload.title) {
    bounce(workspacePath(internId, mode), "error", "Task title is required.");
  }
  const { error } = await supabaseAdmin.from("internship_tasks").insert(payload);
  if (error) bounce(workspacePath(internId, mode), "error", error.message);
  refreshInternship(workspacePath(internId, mode));
  bounce(workspacePath(internId, mode), "ok", "Task saved.");
}

export async function approveInternWork(formData: FormData) {
  const actor = await requireInternshipAdmin();
  const internId = text(formData, "internId");
  const table = text(formData, "table");
  const id = text(formData, "id");
  const allowed = new Set(["internship_tasks", "internship_content"]);
  if (!allowed.has(table)) {
    bounce(`/admin/internship/interns/${internId}`, "error", "Invalid approval target.");
  }
  const { error } = await supabaseAdmin
    .from(table)
    .update({
      supervisor_approved: true,
      ...(table === "internship_tasks"
        ? {
            status: "approved",
            approved_at: new Date().toISOString(),
            approved_by: actor.id,
          }
        : {}),
    })
    .eq("id", id);
  if (error) bounce(`/admin/internship/interns/${internId}`, "error", error.message);
  refreshInternship(`/admin/internship/interns/${internId}`);
  bounce(`/admin/internship/interns/${internId}`, "ok", "Jason approval recorded.");
}

export async function submitInternWork(formData: FormData) {
  const internId = text(formData, "internId");
  const mode = text(formData, "mode") || "intern";
  await assertWorkspaceActor(internId, mode);
  const itemType = text(formData, "itemType") === "content" ? "content" : "task";
  const workUrl = text(formData, "workUrl");
  const studentNotes = text(formData, "studentNotes");
  if (!workUrl && !studentNotes && !text(formData, "draftUrl") && !text(formData, "publishedUrl")) {
    bounce(workspacePath(internId, mode), "error", "Add a work link or notes before submitting for review.");
  }
  const result = await submitInternWorkRecord({
    internId,
    itemType,
    itemId: text(formData, "id"),
    workUrl,
    draftUrl: text(formData, "draftUrl"),
    publishedUrl: text(formData, "publishedUrl"),
    studentNotes,
    internComment: text(formData, "internComment"),
  });
  if (result.error) bounce(workspacePath(internId, mode), "error", result.error);
  refreshInternship(workspacePath(internId, mode));
  bounce(workspacePath(internId, mode), "ok", "Work submitted. Employer HQ can now grade, comment, and approve or send it back.");
}

export async function reviewInternWork(formData: FormData) {
  const actor = await requireInternshipAdmin();
  const internId = text(formData, "internId");
  const result = await reviewInternWorkRecord({
    internId,
    itemType: text(formData, "itemType") === "content" ? "content" : "task",
    itemId: text(formData, "id"),
    decision: text(formData, "decision"),
    letter: text(formData, "letter"),
    kpiTier: text(formData, "kpiTier") || "none",
    comments: text(formData, "comments"),
    outputVsTarget: optionalNumber(formData, "outputVsTarget"),
    reviewerId: actor.id,
  });
  if (result.error) bounce(`/admin/internship/interns/${internId}`, "error", result.error);
  refreshInternship(`/admin/internship/interns/${internId}`);
  bounce(`/admin/internship/interns/${internId}`, "ok", "Grade, comments, and decision synced to Intern Portal.");
}

export async function commentInternWork(formData: FormData) {
  const internId = text(formData, "internId");
  const mode = text(formData, "mode") || "intern";
  await assertWorkspaceActor(internId, mode);
  const body = text(formData, "body");
  if (!body) bounce(workspacePath(internId, mode), "error", "Comment cannot be empty.");
  const result = await addInternWorkComment({
    internId,
    itemType: text(formData, "itemType") === "content" ? "content" : "task",
    itemId: text(formData, "id"),
    authorRole: mode === "supervisor" ? "supervisor" : "intern",
    body,
  });
  if (result.error) bounce(workspacePath(internId, mode), "error", result.error);
  refreshInternship(workspacePath(internId, mode));
  bounce(workspacePath(internId, mode), "ok", "Comment posted to both portals.");
}

export async function saveInternContent(formData: FormData) {
  const internId = text(formData, "internId");
  const mode = text(formData, "mode") || "intern";
  await assertWorkspaceActor(internId, mode);
  const { error } = await supabaseAdmin.from("internship_content").insert({
    intern_id: internId,
    title: text(formData, "title"),
    platform: text(formData, "platform"),
    draft_url: text(formData, "draftUrl"),
    published_url: text(formData, "publishedUrl"),
    status: text(formData, "status") || "draft",
    due_on: text(formData, "dueOn") || null,
    student_notes: text(formData, "studentNotes"),
  });
  if (error) bounce(workspacePath(internId, mode), "error", error.message);
  refreshInternship(workspacePath(internId, mode));
  bounce(workspacePath(internId, mode), "ok", "Content saved.");
}

export async function saveInternCampaign(formData: FormData) {
  const internId = text(formData, "internId");
  const mode = text(formData, "mode") || "intern";
  await assertWorkspaceActor(internId, mode);
  const utmSource = text(formData, "utmSource");
  const utmCampaign = text(formData, "utmCampaign");
  const trackingUrl =
    text(formData, "trackingUrl") ||
    (utmSource && utmCampaign
      ? `https://sitguru.com/?utm_source=${encodeURIComponent(utmSource)}&utm_campaign=${encodeURIComponent(utmCampaign)}`
      : "");
  const { error } = await supabaseAdmin.from("internship_campaigns").insert({
    intern_id: internId,
    primary_owner_intern_id: internId,
    project_id: text(formData, "projectId") || null,
    name: text(formData, "name"),
    utm_source: utmSource,
    utm_campaign: utmCampaign,
    referral_code: text(formData, "referralCode"),
    tracking_url: trackingUrl,
    objective: text(formData, "objective"),
    status: "active",
  });
  if (error) bounce(workspacePath(internId, mode), "error", error.message);
  refreshInternship(workspacePath(internId, mode));
  bounce(workspacePath(internId, mode), "ok", "Campaign saved with tracking.");
}

export async function saveInternMetric(formData: FormData) {
  const internId = text(formData, "internId");
  const mode = text(formData, "mode") || "intern";
  const isSupervisor = mode === "supervisor";
  await assertWorkspaceActor(internId, mode);

  const sourceSystem = text(formData, "sourceSystem");
  if (!sourceSystem) {
    bounce(workspacePath(internId, mode), "error", "Every metric needs an approved source.");
  }

  const { error } = await supabaseAdmin.from("internship_metrics").insert({
    intern_id: internId,
    campaign_id: text(formData, "campaignId") || null,
    project_id: text(formData, "projectId") || null,
    metric_key: text(formData, "metricKey"),
    label: text(formData, "label"),
    value_numeric: optionalNumber(formData, "valueNumeric"),
    period_start: text(formData, "periodStart") || null,
    period_end: text(formData, "periodEnd") || null,
    source_system: sourceSystem,
    source_note: text(formData, "sourceNote"),
    self_reported: !isSupervisor,
    is_verified: isSupervisor && formData.get("verify") === "on",
    verified_at:
      isSupervisor && formData.get("verify") === "on"
        ? new Date().toISOString()
        : null,
  });
  if (error) bounce(workspacePath(internId, mode), "error", error.message);
  refreshInternship(workspacePath(internId, mode));
  bounce(
    workspacePath(internId, mode),
    "ok",
    isSupervisor
      ? "Metric recorded from an approved source."
      : "Metric submitted for supervisor verification. Self-reported numbers are not counted as attributable until verified.",
  );
}

export async function verifyInternMetric(formData: FormData) {
  const actor = await requireInternshipAdmin();
  const internId = text(formData, "internId");
  const id = text(formData, "id");
  const { error } = await supabaseAdmin
    .from("internship_metrics")
    .update({
      is_verified: true,
      verified_at: new Date().toISOString(),
      verified_by: actor.id,
    })
    .eq("id", id)
    .eq("intern_id", internId);
  if (error) bounce(`/admin/internship/interns/${internId}`, "error", error.message);
  refreshInternship(`/admin/internship/interns/${internId}`);
  bounce(
    `/admin/internship/interns/${internId}`,
    "ok",
    "Metric verified. Intern Portal now shows it as SitGuru-attributable.",
  );
}

export async function saveScorecard(formData: FormData) {
  const actor = await requireInternshipAdmin();
  const internId = text(formData, "internId");
  const { error } = await supabaseAdmin.from("internship_scorecards").insert({
    intern_id: internId,
    period_start: text(formData, "periodStart"),
    period_end: text(formData, "periodEnd"),
    quality: optionalNumber(formData, "quality") || 0,
    communication: optionalNumber(formData, "communication") || 0,
    reliability: optionalNumber(formData, "reliability") || 0,
    creativity: optionalNumber(formData, "creativity") || 0,
    analytics: optionalNumber(formData, "analytics") || 0,
    judgment: optionalNumber(formData, "judgment") || 0,
    initiative: optionalNumber(formData, "initiative") || 0,
    kpi_contribution: optionalNumber(formData, "kpiContribution") || 0,
    strongest_contribution: text(formData, "strongestContribution"),
    improvement_required: text(formData, "improvementRequired"),
    scored_by: actor.id,
  });
  if (error) bounce(`/admin/internship/interns/${internId}`, "error", error.message);
  refreshInternship(`/admin/internship/interns/${internId}`);
  bounce(`/admin/internship/interns/${internId}`, "ok", "Biweekly scorecard saved.");
}

export async function saveWeeklyReview(formData: FormData) {
  const internId = text(formData, "internId");
  const mode = text(formData, "mode") || "intern";
  await assertWorkspaceActor(internId, mode);
  const review = {
    intern_id: internId,
    week_of: text(formData, "weekOf"),
    accomplished: text(formData, "accomplished"),
    data_showed: text(formData, "dataShowed"),
    didnt_work: text(formData, "didntWork"),
    changing_next_week: text(formData, "changingNextWeek"),
  };
  const { error } = await supabaseAdmin.from("internship_weekly_reviews").upsert(
    mode === "supervisor"
      ? {
          ...review,
          upcoming_approved: formData.get("upcomingApproved") === "on",
        }
      : review,
    { onConflict: "intern_id,week_of" },
  );
  if (error) bounce(workspacePath(internId, mode), "error", error.message);
  refreshInternship(workspacePath(internId, mode));
  bounce(workspacePath(internId, mode), "ok", "Weekly review saved.");
}

export async function saveSmartGoal(formData: FormData) {
  const internId = text(formData, "internId");
  const mode = text(formData, "mode") || "intern";
  await assertWorkspaceActor(internId, mode);
  const { error } = await supabaseAdmin.from("internship_smart_goals").insert({
    intern_id: internId,
    specific: text(formData, "specific"),
    measurable: text(formData, "measurable"),
    achievable: text(formData, "achievable"),
    relevant: text(formData, "relevant"),
    time_bound: text(formData, "timeBound"),
    metric_key: text(formData, "metricKey"),
    baseline_value: text(formData, "baselineValue"),
    target_value: text(formData, "targetValue"),
    source_system: text(formData, "sourceSystem") || "sitguru_admin",
    status: mode === "supervisor" ? "approved" : "draft",
  });
  if (error) bounce(workspacePath(internId, mode), "error", error.message);
  refreshInternship(workspacePath(internId, mode));
  bounce(workspacePath(internId, mode), "ok", "SMART goal saved.");
}

export async function saveExperiment(formData: FormData) {
  const internId = text(formData, "internId");
  const mode = text(formData, "mode") || "intern";
  await assertWorkspaceActor(internId, mode);
  const { error } = await supabaseAdmin.from("internship_experiments").insert({
    intern_id: internId,
    hypothesis: text(formData, "hypothesis"),
    action: text(formData, "action"),
    audience: text(formData, "audience"),
    result: text(formData, "result"),
    lesson: text(formData, "lesson"),
    next_step: text(formData, "nextStep"),
  });
  if (error) bounce(workspacePath(internId, mode), "error", error.message);
  refreshInternship(workspacePath(internId, mode));
  bounce(workspacePath(internId, mode), "ok", "Experiment logged.");
}

export async function saveAccessGrant(formData: FormData) {
  await requireInternshipAdmin();
  const internId = text(formData, "internId");
  const toolKey = text(formData, "toolKey");
  const granted = formData.get("granted") === "on";
  const { error } = await supabaseAdmin.from("internship_access_grants").upsert(
    {
      intern_id: internId,
      tool_key: toolKey,
      granted,
      notes: text(formData, "notes"),
      granted_at: granted ? new Date().toISOString() : null,
    },
    { onConflict: "intern_id,tool_key" },
  );
  if (error) bounce(`/admin/internship/interns/${internId}`, "error", error.message);
  refreshInternship(`/admin/internship/interns/${internId}`);
  bounce(
    `/admin/internship/interns/${internId}`,
    "ok",
    granted ? "Tool access granted." : "Tool access removed.",
  );
}

export async function saveMilestoneStatus(formData: FormData) {
  await requireInternshipAdmin();
  const id = text(formData, "id");
  const status = text(formData, "status") || "scheduled";
  const { error } = await supabaseAdmin
    .from("internship_milestones")
    .update({ status })
    .eq("id", id);
  if (error) bounce("/admin/internship/timeline", "error", error.message);
  refreshInternship("/admin/internship/timeline");
  bounce("/admin/internship/timeline", "ok", "Timeline updated. Intern portal and HQ now share this status.");
}

function workspacePath(internId: string, mode: string) {
  return mode === "supervisor"
    ? `/admin/internship/interns/${internId}`
    : "/intern";
}
