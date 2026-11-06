"use server";

import { revalidatePath } from "next/cache";
import { getAdminIdentity } from "@/lib/admin/access";
import { sendSitGuruEmail } from "@/lib/email/resend";
import { isProbablyValidEmail } from "@/lib/email/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { canAdministerInternshipOnboarding } from "@/lib/internship/manager-access";
import { findInternById } from "@/lib/internship/queries";
import {
  planEmployerApproval,
  planUniversityRecord,
  readApprovalSnapshot,
} from "@/lib/internship/approval-workflow";

export type ApprovalActionResult = { ok: true; message: string } | { ok: false; message: string };

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (char) => {
    if (char === "&") return "&amp;";
    if (char === "<") return "&lt;";
    if (char === ">") return "&gt;";
    return "&quot;";
  });
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function internId(formData: FormData) {
  const id = text(formData, "internId");
  return /^[0-9a-f-]{36}$/i.test(id) ? id : "";
}

async function authorize() {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin || !canAdministerInternshipOnboarding(actor)) return null;
  return actor;
}

function refresh(internIdValue: string) {
  revalidatePath("/admin/internship");
  revalidatePath("/admin/internship/interns");
  revalidatePath(`/admin/internship/interns/${internIdValue}`);
  revalidatePath("/intern");
  revalidatePath("/intern/manage");
}

async function audit(
  internIdValue: string,
  actorId: string,
  rows: Array<[string, string, string]>,
  reason: string,
) {
  const changed = rows.filter(([, previous, next]) => previous !== next);
  if (!changed.length) return;
  await supabaseAdmin.from("internship_requirement_audits").insert(
    changed.map(([field, previous, next]) => ({
      intern_id: internIdValue,
      actor_id: actorId,
      field_name: field,
      previous_value: previous,
      next_value: next,
      reason,
    })),
  );
}

async function notifyEmployerApproval(input: {
  internId: string;
  email: string;
  name: string;
  title: string;
  semester: string;
  snapshot: Record<string, unknown>;
}) {
  if (!isProbablyValidEmail(input.email)) return "saved-without-email" as const;
  try {
    await sendSitGuruEmail({
      to: input.email,
      subject: "SitGuru recorded your internship acceptance",
      text: [
        `Hello ${input.name},`,
        "",
        `SitGuru recorded employer acceptance for your ${input.title || "internship"} (${input.semester || "the upcoming term"}).`,
        "University verification and onboarding stay separate. The internship is not active until onboarding is fully executed and the program start conditions are met.",
        "",
        "SitGuru",
      ].join("\n"),
      html: `<p>Hello ${escapeHtml(input.name)},</p><p>SitGuru recorded employer acceptance for your ${escapeHtml(input.title || "internship")} (${escapeHtml(input.semester || "the upcoming term")}).</p><p>University verification and onboarding stay separate. The internship is not active until onboarding is fully executed and the program start conditions are met.</p>`,
      isMarketing: false,
    });
  } catch (error) {
    console.error(
      "[internship] approval email",
      error instanceof Error ? error.message : error,
    );
    return "email-failed" as const;
  }
  const nextSnapshot = {
    ...input.snapshot,
    employerApprovalNotifiedAt: new Date().toISOString(),
  };
  await supabaseAdmin
    .from("internship_interns")
    .update({ academic_snapshot: nextSnapshot, updated_at: new Date().toISOString() })
    .eq("id", input.internId);
  return "sent" as const;
}

export async function approveInternshipEmployer(formData: FormData): Promise<ApprovalActionResult> {
  const actor = await authorize();
  if (!actor) return { ok: false, message: "Only a Super Admin can approve an internship." };
  const id = internId(formData);
  const intern = id ? await findInternById(id) : null;
  if (!intern) return { ok: false, message: "That internship was not found." };

  const snapshot = intern.academicSnapshot || {};
  const notice = readApprovalSnapshot(snapshot);
  const plan = planEmployerApproval({
    status: intern.status,
    approvalStatus: intern.approvalStatus,
    portalEnabled: intern.portalEnabled,
    alreadyNotified: Boolean(notice.employerNotifiedAt),
  });
  if (!plan.ok) return { ok: false, message: plan.error };

  if (plan.changed) {
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabaseAdmin
      .from("internship_interns")
      .update({
        approval_status: plan.approvalStatus,
        approval_date: intern.approvalDate || today,
        status: plan.nextStatus,
        portal_enabled: plan.portalEnabled,
        updated_at: new Date().toISOString(),
      })
      .eq("id", intern.id);
    if (error) return { ok: false, message: "The internship approval could not be saved." };
    await audit(
      intern.id,
      actor.id,
      [
        ["approval_status", intern.approvalStatus || "", plan.approvalStatus],
        ["status", intern.status, plan.nextStatus],
        ["portal_enabled", String(intern.portalEnabled), String(plan.portalEnabled)],
      ],
      "Employer accepted the internship. University verification and onboarding were not changed.",
    );
  }

  let emailNote = "";
  if (plan.sendEmail) {
    const sent = await notifyEmployerApproval({
      internId: intern.id,
      email: intern.email,
      name: intern.fullName,
      title: intern.internshipTitle || "Social Media & Community Growth Intern",
      semester: intern.semester,
      snapshot,
    });
    if (sent === "email-failed") emailNote = " The confirmation email could not be sent.";
    if (sent === "saved-without-email") emailNote = " No intern email is on file, so no message was sent.";
  }

  refresh(intern.id);
  return {
    ok: true,
    message: plan.changed
      ? `Internship approval saved.${emailNote}`
      : `Internship approval is already saved.${emailNote}`,
  };
}

export async function recordUniversityApproval(formData: FormData): Promise<ApprovalActionResult> {
  const actor = await authorize();
  if (!actor) return { ok: false, message: "Only a Super Admin can record university approval." };
  const id = internId(formData);
  const intern = id ? await findInternById(id) : null;
  if (!intern) return { ok: false, message: "That internship was not found." };

  const plan = planUniversityRecord({
    evidenceType: text(formData, "evidenceType"),
    confirmVerified: formData.get("confirmVerified") === "on",
  });
  if (!plan.ok) return { ok: false, message: plan.error };

  const reportedOn = text(formData, "reportedOn");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reportedOn)) {
    return { ok: false, message: "Enter the date this approval was reported or verified." };
  }
  const reference = text(formData, "reference").slice(0, 500);
  const notes = text(formData, "notes").slice(0, 2000);
  const course = text(formData, "course").slice(0, 40);
  const term = text(formData, "term").slice(0, 40);
  const credits = text(formData, "credits");
  const hours = text(formData, "hours");
  if (credits && !/^\d{1,2}(\.\d)?$/.test(credits)) {
    return { ok: false, message: "Credits must be a number." };
  }
  if (hours && !/^\d{1,4}$/.test(hours)) {
    return { ok: false, message: "Required hours must be a number." };
  }

  const snapshot = { ...(intern.academicSnapshot || {}) };
  snapshot.universityApproval = {
    evidenceType: text(formData, "evidenceType"),
    reference,
    notes,
    reportedOn,
    source: plan.status === "verified" ? "admin_verified" : "admin_recorded",
    recordedBy: actor.id,
    recordedAt: new Date().toISOString(),
    countsAsVerified: plan.countsAsVerified,
  };

  const payload: Record<string, unknown> = {
    university_verification_status: plan.status,
    academic_snapshot: snapshot,
    university_notes: notes || intern.universityNotes,
    updated_at: new Date().toISOString(),
  };
  if (course) payload.course_code = course;
  if (term) payload.semester = term;
  if (credits) payload.credits = Number(credits);
  if (hours) payload.required_hours = Number(hours);

  const { error } = await supabaseAdmin.from("internship_interns").update(payload).eq("id", intern.id);
  if (error) return { ok: false, message: "University approval could not be saved." };

  await audit(
    intern.id,
    actor.id,
    [
      ["university_verification_status", intern.universityVerificationStatus || "", plan.status],
      ["course_code", intern.courseCode || "", course || intern.courseCode || ""],
      ["semester", intern.semester || "", term || intern.semester || ""],
      ["credits", intern.credits == null ? "" : String(intern.credits), credits || (intern.credits == null ? "" : String(intern.credits))],
      ["required_hours", intern.requiredHours == null ? "" : String(intern.requiredHours), hours || (intern.requiredHours == null ? "" : String(intern.requiredHours))],
    ],
    reference || notes || "Recorded university approval evidence.",
  );

  refresh(intern.id);
  return {
    ok: true,
    message: plan.countsAsVerified
      ? "University approval verified."
      : "University evidence saved. It is not counted as formally verified.",
  };
}
