"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { grantGrowthHireAccess } from "@/lib/admin/growth/hire";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { assignmentChangeSummary } from "@/lib/internship/assignment";
import { assignmentStaffChangeAllowed, canSelectInternshipManager, canSelectInternshipSupervisor } from "@/lib/internship/staff-eligibility";
import { canAdministerInternshipOnboarding } from "@/lib/internship/manager-access";
import { assignmentNoticeAllowed } from "@/lib/internship/onboarding-authority";
import { findInternById } from "@/lib/internship/queries";
import { loadInternshipStaffGate } from "@/lib/internship/staff";

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function bounce(message: string, kind: "ok" | "error" = "error"): never {
  redirect(`/admin/internship/interns?${kind}=${encodeURIComponent(message)}`);
}

export async function saveInternshipAssignment(formData: FormData) {
  const actor = await getAdminIdentity();
  if (!actor || !canAdministerInternshipOnboarding(actor)) {
    bounce("Only a Super Admin can change internship onboarding or manager assignment.");
  }

  const internId = text(formData, "internId");
  const intern = await findInternById(internId);
  if (!intern) bounce("That internship was not found.");

  const reason = text(formData, "reason");
  if (reason.length < 4) bounce("Add a short reason for this assignment change.");

  const managerId = text(formData, "managerUserId");
  const supervisorId = text(formData, "supervisorUserId");
  const manager = managerId ? await loadInternshipStaffGate(managerId) : null;
  const supervisor = supervisorId ? await loadInternshipStaffGate(supervisorId) : null;
  const managerDecision = assignmentStaffChangeAllowed({
    currentId: intern.managerUserId,
    nextId: managerId,
    selectable: Boolean(manager && canSelectInternshipManager(manager)),
    roleLabel: "manager",
  });
  if (!managerDecision.ok) bounce(managerDecision.error);
  const supervisorDecision = assignmentStaffChangeAllowed({
    currentId: intern.supervisorUserId,
    nextId: supervisorId,
    selectable: Boolean(supervisor && canSelectInternshipSupervisor(supervisor)),
    roleLabel: "supervisor",
  });
  if (!supervisorDecision.ok) bounce(supervisorDecision.error);

  const previousManager = intern.managerUserId ? await loadInternshipStaffGate(intern.managerUserId) : null;
  const previousSupervisor = intern.supervisorUserId ? await loadInternshipStaffGate(intern.supervisorUserId) : null;
  const nextStatus = text(formData, "internshipStatus") || intern.status;
  const nextApproval = text(formData, "universityApproval") || intern.universityVerificationStatus || "pending";
  const payload = {
    department_id: text(formData, "departmentId") || null,
    internship_title: text(formData, "internshipTitle") || intern.internshipTitle || "",
    manager_user_id: managerId || null,
    supervisor_user_id: supervisorId || null,
    status: nextStatus,
    university_verification_status: nextApproval,
    semester: text(formData, "semester") || intern.semester,
    academic_year: text(formData, "academicYear") || intern.academicYear || "",
    academic_program: text(formData, "academicProgram") || intern.academicProgram,
    credits: text(formData, "credits") ? Number(text(formData, "credits")) : null,
    required_hours: text(formData, "requiredHours") ? Number(text(formData, "requiredHours")) : null,
    planned_weekly_hours: text(formData, "plannedWeeklyHours") ? Number(text(formData, "plannedWeeklyHours")) : null,
    internship_weeks: text(formData, "internshipWeeks") ? Number(text(formData, "internshipWeeks")) : null,
    academic_start_date: text(formData, "startDate") || null,
    academic_end_date: text(formData, "endDate") || null,
    requirement_status: text(formData, "requiredHours") ? text(formData, "requirementStatus") || "pending" : "pending",
    university_notes: text(formData, "universityNotes"),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.from("internship_interns").update(payload).eq("id", internId);
  if (error) bounce("The assignment could not be saved.");

  const summary = assignmentChangeSummary({
    oldManagerName: previousManager?.name || intern.managerName,
    newManagerName: manager?.name,
    oldSupervisorName: previousSupervisor?.name || intern.supervisorName,
    newSupervisorName: supervisor?.name,
  });
  await supabaseAdmin.from("internship_assignment_events").insert({
    intern_id: internId,
    old_manager_user_id: intern.managerUserId,
    new_manager_user_id: managerId || null,
    old_supervisor_user_id: intern.supervisorUserId,
    new_supervisor_user_id: supervisorId || null,
    old_department_id: intern.departmentId,
    new_department_id: payload.department_id,
    changed_by: actor.id,
    reason,
    summary: summary || `Updated internship status to ${nextStatus.replaceAll("_", " ")}.`,
  });
  await supabaseAdmin.from("internship_requirement_audits").insert([
    ["status", intern.status, nextStatus],
    ["university_approval", intern.universityVerificationStatus || "", nextApproval],
    ["required_hours", intern.requiredHours == null ? "" : String(intern.requiredHours), text(formData, "requiredHours")],
    ["manager_user_id", intern.managerUserId || "", managerId],
    ["supervisor_user_id", intern.supervisorUserId || "", supervisorId],
  ].filter(([, previous, next]) => previous !== next).map(([field, previous, next]) => ({
    intern_id: internId,
    actor_id: actor.id,
    field_name: field,
    previous_value: previous,
    next_value: next,
    reason,
  })));

  if (
    assignmentNoticeAllowed({
      status: nextStatus,
      portalEnabled: intern.portalEnabled !== false && (nextStatus === "active" || nextStatus === "approved" || nextStatus === "accepted"),
      managerChanged: Boolean(managerId && managerId !== intern.managerUserId),
    })
  ) {
    await supabaseAdmin.from("internship_staff_notices").insert({
      recipient_user_id: managerId,
      intern_id: internId,
      kind: "manager_assignment_active",
      title: "Intern assigned",
      body: `${intern.fullName} is active on your intern team.`,
    });
  }

  const { publishInternAssignmentEvent } = await import(
    "@/lib/realtime/publish-internship"
  );
  await publishInternAssignmentEvent({
    intern: {
      ...intern,
      managerUserId: managerId || null,
      supervisorUserId: supervisorId || null,
    },
    resourceId: internId,
    actor: { userId: actor.id, label: actor.email },
    created: Boolean(managerId && managerId !== intern.managerUserId),
  });

  revalidatePath("/admin/internship/interns");
  revalidatePath("/intern/manage");
  revalidatePath("/intern");
  bounce("Assignment saved. Approved hours were left as they were.", "ok");
}

export async function inviteInternshipManager(formData: FormData) {
  const actor = await getAdminIdentity();
  const returnTo = text(formData, "returnTo") === "interns"
    ? "/admin/internship/interns"
    : "/admin/internship/staff";
  if (!actor || !canAdministerInternshipOnboarding(actor)) {
    redirect(`/admin/login?next=${encodeURIComponent(returnTo)}`);
  }
  const name = text(formData, "name");
  const email = text(formData, "email").toLowerCase();
  if (name.trim().split(/\s+/).filter((part) => part.length > 1).length < 2) {
    redirect(`${returnTo}?error=` + encodeURIComponent("Enter the manager's first and last name."));
  }
  const result = await grantGrowthHireAccess({
    actor,
    email,
    name,
    notes: text(formData, "notes") || "Internship manager. Social Media & Community Growth.",
    invite: formData.get("invite") === "on",
  });
  revalidatePath("/admin/internship/staff");
  revalidatePath("/admin/internship/interns");
  revalidatePath("/admin/hr/growth-hire");
  if (!result.ok) {
    redirect(`${returnTo}?error=` + encodeURIComponent(result.error));
  }
  const message = result.invited
    ? `${name} was invited. After they open the email, they can sign in as Social Media & Community Growth Manager and appear in Assigned manager.`
    : `${name} can sign in as Social Media & Community Growth Manager and appears in Assigned manager.`;
  redirect(`${returnTo}?ok=` + encodeURIComponent(message));
}

export async function saveInternshipStaffEligibility(formData: FormData) {
  const actor = await getAdminIdentity();
  if (!actor || !canAdministerInternshipOnboarding(actor)) {
    redirect("/admin/login?next=/admin/internship/staff");
  }
  const userId = text(formData, "userId");
  const person = await loadInternshipStaffGate(userId);
  if (!person) {
    redirect("/admin/internship/staff?error=" + encodeURIComponent("That staff account was not found."));
  }
  const nextManage = formData.get("canManageInterns") === "on";
  const nextSupervise = formData.get("canSuperviseInterns") === "on";
  const jobTitle = text(formData, "jobTitle");
  const { data: existing } = await supabaseAdmin
    .from("internship_staff_eligibility")
    .select("can_manage_interns,can_supervise_interns,job_title")
    .eq("user_id", userId)
    .maybeSingle();
  const { error } = await supabaseAdmin.from("internship_staff_eligibility").upsert(
    {
      user_id: userId,
      can_manage_interns: nextManage,
      can_supervise_interns: nextSupervise,
      job_title: jobTitle,
      updated_by: actor.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) {
    redirect("/admin/internship/staff?error=" + encodeURIComponent("Eligibility could not be saved."));
  }
  await supabaseAdmin.from("internship_staff_eligibility_audits").insert({
    user_id: userId,
    old_can_manage: existing?.can_manage_interns === true,
    new_can_manage: nextManage,
    old_can_supervise: existing?.can_supervise_interns === true,
    new_can_supervise: nextSupervise,
    changed_by: actor.id,
  });
  revalidatePath("/admin/internship/staff");
  revalidatePath("/admin/internship/interns");
  redirect("/admin/internship/staff?ok=" + encodeURIComponent(`Eligibility saved for ${person.name || person.email}.`));
}

export async function dismissStaffNotice(formData: FormData) {
  const actor = await getAdminIdentity();
  if (!actor) bounce("Sign in to update notices.");
  await supabaseAdmin
    .from("internship_staff_notices")
    .update({ read_at: new Date().toISOString() })
    .eq("id", text(formData, "id"))
    .eq("recipient_user_id", actor.id);
  revalidatePath("/intern/manage");
  redirect("/intern/manage");
}
