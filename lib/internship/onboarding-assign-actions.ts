"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { sendSitGuruEmail } from "@/lib/email/resend";
import { canAdministerInternshipOnboarding } from "@/lib/internship/manager-access";
import {
  activationReady,
  shouldSendOnce,
  SPRING_2027_COHORT_NAME,
} from "@/lib/internship/onboarding-authority";
import { internOnboardingComplete } from "@/lib/internship/onboarding";
import { findInternById, getInternOnboarding } from "@/lib/internship/queries";
import { loadInternshipStaffGate } from "@/lib/internship/staff";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function emailHtml(value: string) {
  const safe = String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  return `<p style="font-family:Arial,sans-serif;color:#0f172a">${safe.replaceAll("\n", "<br/>")}</p>`;
}

function ids(formData: FormData) {
  return formData
    .getAll("internId")
    .map((value) => String(value || "").trim())
    .filter(Boolean);
}

function backPath(formData: FormData) {
  return text(formData, "returnTo") === "/admin/hr/team-access"
    ? "/admin/hr/team-access"
    : "/admin/internship/assign";
}

function bounce(path: string, kind: "ok" | "error", message: string): never {
  redirect(`${path}?${kind}=${encodeURIComponent(message)}`);
}

async function requireSuperAdmin() {
  const actor = await getAdminIdentity();
  if (!actor || !canAdministerInternshipOnboarding(actor)) return null;
  return actor;
}

async function noticeExists(internId: string, kind: string) {
  const { data } = await supabaseAdmin
    .from("internship_staff_notices")
    .select("id")
    .eq("intern_id", internId)
    .eq("kind", kind)
    .limit(1)
    .maybeSingle();
  return Boolean(data?.id);
}

export async function saveCohortDefaultStaff(formData: FormData) {
  const actor = await requireSuperAdmin();
  const path = backPath(formData);
  if (!actor) bounce(path, "error", "Only a Super Admin can set the cohort manager.");
  const { data: cohort } = await supabaseAdmin
    .from("internship_cohorts")
    .select("id,name")
    .eq("name", SPRING_2027_COHORT_NAME)
    .limit(1)
    .maybeSingle();
  if (!cohort?.id) {
    bounce(path, "error", "The Spring 2027 cohort was not found.");
  }
  const managerId = text(formData, "managerUserId");
  const supervisorId = text(formData, "supervisorUserId");
  const manager = managerId ? await loadInternshipStaffGate(managerId) : null;
  const supervisor = supervisorId ? await loadInternshipStaffGate(supervisorId) : null;
  if (!manager?.id || !supervisor?.id) {
    bounce(path, "error", "Choose Ava and the official supervisor from verified staff accounts.");
  }
  const { error } = await supabaseAdmin
    .from("internship_cohorts")
    .update({
      default_manager_user_id: manager.id,
      default_supervisor_user_id: supervisor.id,
    })
    .eq("id", cohort.id);
  if (error) bounce(path, "error", "The cohort default could not be saved.");
  revalidatePath(path);
  bounce(path, "ok", "Spring 2027 default manager and supervisor saved. This does not activate interns.");
}

export async function assignSelectedInterns(formData: FormData) {
  const actor = await requireSuperAdmin();
  const path = backPath(formData);
  if (!actor) bounce(path, "error", "Only a Super Admin can assign internship managers.");
  const selected = ids(formData);
  if (!selected.length) bounce(path, "error", "Select at least one intern.");
  const clearing = text(formData, "intent") === "clear";
  const managerId = clearing ? "" : text(formData, "managerUserId");
  const supervisorId = clearing ? "" : text(formData, "supervisorUserId");
  if (!clearing && !managerId) bounce(path, "error", "Choose a manager.");
  const manager = managerId ? await loadInternshipStaffGate(managerId) : null;
  const supervisor = supervisorId ? await loadInternshipStaffGate(supervisorId) : null;
  if (managerId && !manager) bounce(path, "error", "That manager account was not found.");
  if (supervisorId && !supervisor) bounce(path, "error", "That supervisor account was not found.");

  for (const internId of selected) {
    const intern = await findInternById(internId);
    if (!intern) continue;
    const { error } = await supabaseAdmin
      .from("internship_interns")
      .update({
        manager_user_id: managerId || null,
        supervisor_user_id: supervisorId || intern.supervisorUserId || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", internId);
    if (error) bounce(path, "error", "One assignment could not be saved. Academic records were not changed.");
    await supabaseAdmin.from("internship_assignment_events").insert({
      intern_id: internId,
      old_manager_user_id: intern.managerUserId,
      new_manager_user_id: managerId || null,
      old_supervisor_user_id: intern.supervisorUserId,
      new_supervisor_user_id: supervisorId || intern.supervisorUserId || null,
      changed_by: actor.id,
      reason: clearing ? "Manager removed" : "Manager assignment saved",
      summary: clearing
        ? `Removed the manager from ${intern.fullName}. Hours and academic records were kept.`
        : `Assigned ${intern.fullName} to ${manager?.name || "a manager"}. Portal access was not changed.`,
    });
  }

  revalidatePath("/admin/internship/assign");
  revalidatePath("/admin/hr/team-access");
  revalidatePath("/manager/team");
  bounce(
    path,
    "ok",
    clearing
      ? "Manager removed. Academic records were kept, and no activation email was sent."
      : "Assignment saved. Pending interns stay off the active manager desk.",
  );
}

export async function activateInternHandoff(formData: FormData) {
  const actor = await requireSuperAdmin();
  const path = backPath(formData);
  if (!actor) bounce(path, "error", "Only a Super Admin can activate an intern.");
  const intern = await findInternById(text(formData, "internId"));
  if (!intern) bounce(path, "error", "That internship was not found.");
  const onboarding = await getInternOnboarding(intern.id);
  const university = String(intern.universityVerificationStatus || intern.approvalStatus || "").toLowerCase();
  const ready = activationReady({
    hasIdentity: Boolean(intern.fullName && (intern.email || intern.userId)),
    internshipApproved: ["approved", "active", "accepted"].includes(intern.status) || university.includes("approv"),
    universityVerified: ["approved", "verified", "confirmed"].some((token) => university.includes(token)),
    onboardingComplete: internOnboardingComplete(onboarding),
    managerUserId: intern.managerUserId,
    supervisorUserId: intern.supervisorUserId,
  });
  if (!ready.ok) bounce(path, "error", ready.error);

  const { error } = await supabaseAdmin
    .from("internship_interns")
    .update({
      status: "active",
      portal_enabled: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", intern.id);
  if (error) bounce(path, "error", "The intern portal could not be activated.");

  const managerKind = `manager_assignment_active:${intern.managerUserId}`;
  const welcomeKind = `intern_activation_welcome:${intern.id}`;
  const manager = intern.managerUserId ? await loadInternshipStaffGate(intern.managerUserId) : null;
  if (manager && shouldSendOnce(await noticeExists(intern.id, managerKind), true)) {
    let mailed = !manager.email;
    if (manager.email) {
      try {
        const managerText = `${intern.fullName} is active and assigned to you. Open the Manager Portal to see your intern team. Private university and HR files are not included.`;
        await sendSitGuruEmail({
          to: manager.email,
          subject: `${intern.fullName} is on your SitGuru intern team`,
          text: managerText,
          html: emailHtml(managerText),
        });
        mailed = true;
      } catch (mailError) {
        console.error("[internship] manager assignment email", mailError);
      }
    }
    if (mailed) {
      await supabaseAdmin.from("internship_staff_notices").insert({
        recipient_user_id: manager.id,
        intern_id: intern.id,
        kind: managerKind,
        title: "Intern assigned",
        body: `${intern.fullName} is now active on your intern team.`,
      });
    }
  }
  const welcomeTo = String(intern.email || "").trim();
  if (welcomeTo && shouldSendOnce(await noticeExists(intern.id, welcomeKind), true)) {
    let mailed = false;
    try {
      const welcomeText = `Hi ${intern.preferredName || intern.fullName}, your SitGuru intern portal is open at https://www.sitguru.com/intern.`;
      await sendSitGuruEmail({
        to: welcomeTo,
        subject: "Your SitGuru intern portal is open",
        text: welcomeText,
        html: emailHtml(welcomeText),
      });
      mailed = true;
    } catch (mailError) {
      console.error("[internship] intern welcome email", mailError);
    }
    if (mailed) {
      await supabaseAdmin.from("internship_staff_notices").insert({
        recipient_user_id: intern.userId || actor.id,
        intern_id: intern.id,
        kind: welcomeKind,
        title: "Intern portal open",
        body: "Welcome email recorded.",
      });
    }
  }
  await supabaseAdmin.from("internship_requirement_audits").insert({
    intern_id: intern.id,
    actor_id: actor.id,
    field_name: "portal_activation",
    previous_value: intern.status,
    next_value: "active",
    reason: "Super Admin activated the intern after onboarding gates passed.",
  });
  revalidatePath("/manager/team");
  revalidatePath("/intern");
  bounce(path, "ok", `${intern.fullName} is active. Ava's desk and the welcome note were updated once.`);
}

export async function escalateInternToSuperAdmin(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/manager/team");
  const intern = await findInternById(text(formData, "internId"));
  const note = text(formData, "note");
  if (!intern || intern.managerUserId !== user.id) {
    redirect("/manager/team?error=" + encodeURIComponent("You can only escalate an intern assigned to you."));
  }
  if (note.length < 8) {
    redirect("/manager/team?error=" + encodeURIComponent("Add a short note for the Super Admin."));
  }
  await supabaseAdmin.from("internship_assignment_events").insert({
    intern_id: intern.id,
    old_manager_user_id: intern.managerUserId,
    new_manager_user_id: intern.managerUserId,
    changed_by: user.id,
    reason: note.slice(0, 500),
    summary: `Manager escalated an administrative issue for ${intern.fullName}.`,
  });
  const supervisor = intern.supervisorUserId ? await loadInternshipStaffGate(intern.supervisorUserId) : null;
  if (supervisor?.email) {
    const escalationText = `The assigned manager asked Super Admin to review an administrative issue for ${intern.fullName}.\n\n${note.slice(0, 500)}\n\nNo university or HR documents are attached.`;
    await sendSitGuruEmail({
      to: supervisor.email,
      subject: `Intern desk escalation — ${intern.fullName}`,
      text: escalationText,
      html: emailHtml(escalationText),
    });
  }
  revalidatePath("/manager/team");
  redirect("/manager/team?ok=" + encodeURIComponent("Escalation sent to Super Admin."));
}
