"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import {
  INTERN_ACCESS_ROLE,
  SPRING_2027_INTERN_MANAGER_EMAIL,
  SPRING_2027_INTERN_SUPERVISOR_EMAIL,
  canRequestInternAccess,
  nextInternAccessStatus,
} from "@/lib/internship/intern-access";
import { internshipUniversitySlug } from "@/lib/internship/constants";
import { canEditRequirements, internshipActorKind } from "@/lib/internship/manager-access";
import { getActiveCohort } from "@/lib/internship/queries";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function field(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function decisionPath(formData: FormData) {
  const value = field(formData, "returnTo");
  if (value === "/admin/hr/staff-requests" || value === "/admin/hr/access-requests") return value;
  return "/admin/hr/access-requests";
}

function bounce(path: string, kind: "ok" | "error", message: string): never {
  redirect(`${path}?${kind}=${encodeURIComponent(message)}`);
}

async function profileFor(userId: string) {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id,email,full_name")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

async function userIdForEmail(email: string) {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .limit(1)
    .maybeSingle();
  return data?.id ? String(data.id) : null;
}

export async function requestInternAccess(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/intern/login?next=/intern/request");
  const profile = await profileFor(user.id);
  const email = String(profile?.email || user.email || "").trim().toLowerCase();
  const name = field(formData, "fullName") || String(profile?.full_name || "");
  const university = field(formData, "universityName");
  const program = field(formData, "academicProgram");
  if (!email || !name || university.length < 2) {
    bounce("/intern/request", "error", "Add your name and university.");
  }
  const { data: open } = await supabaseAdmin
    .from("staff_access_requests")
    .select("id,status")
    .eq("user_id", user.id)
    .in("status", ["pending_ceo_review", "pending_university_approval", "approved", "active"])
    .limit(1)
    .maybeSingle();
  if (open && !canRequestInternAccess(String(open.status))) {
    bounce("/intern/request", "error", "You already have an internship request in review.");
  }
  const { error } = await supabaseAdmin.from("staff_access_requests").insert({
    user_id: user.id,
    email,
    full_name: name,
    role_key: INTERN_ACCESS_ROLE,
    university_name: university,
    academic_program: program,
    status: "pending_ceo_review",
  });
  if (error) bounce("/intern/request", "error", "The request could not be saved.");
  revalidatePath("/admin/hr/access-requests");
  bounce("/intern/request", "ok", "Request sent. It is Pending CEO Review.");
}

async function decide(formData: FormData, action: "ceo_approve" | "verify_university" | "deny" | "complete" | "revoke") {
  const actor = await getAdminIdentity();
  const kind = internshipActorKind({ role: actor?.role, isSuperUser: actor?.isSuperUser });
  const back = decisionPath(formData);
  if (!actor || !canEditRequirements(kind)) {
    bounce(back, "error", "CEO approval is required for this decision.");
  }
  const id = field(formData, "requestId");
  const { data: request } = await supabaseAdmin
    .from("staff_access_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!request) bounce(decisionPath(formData), "error", "That request was not found.");
  const next = nextInternAccessStatus({ status: String(request.status), action });
  if (!next.ok) bounce(decisionPath(formData), "error", next.error);

  let internId = request.intern_id ? String(request.intern_id) : "";
  if (action === "verify_university") {
    internId = await linkInternshipRecord({
      userId: String(request.user_id),
      email: String(request.email),
      fullName: String(request.full_name),
      universityName: String(request.university_name),
      academicProgram: String(request.academic_program),
      existingInternId: internId,
      returnPath: back,
    });
  }
  if ((action === "revoke" || action === "deny") && internId) {
    await supabaseAdmin.from("internship_interns").update({
      portal_enabled: false,
      updated_at: new Date().toISOString(),
    }).eq("id", internId);
  }
  if (action === "complete" && internId) {
    await supabaseAdmin.from("internship_interns").update({
      status: "completed",
      updated_at: new Date().toISOString(),
    }).eq("id", internId);
  }

  const { error } = await supabaseAdmin.from("staff_access_requests").update({
    status: next.status,
    intern_id: internId || null,
    ceo_reviewed_at: action === "ceo_approve" ? new Date().toISOString() : request.ceo_reviewed_at,
    university_verified_at: action === "verify_university" ? new Date().toISOString() : request.university_verified_at,
    decided_by: actor.id,
    decision_note: field(formData, "note"),
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) bounce(decisionPath(formData), "error", "The decision could not be saved.");
  revalidatePath("/admin/hr/access-requests");
  revalidatePath("/admin/hr/staff-requests");
  revalidatePath("/admin/internship/interns");
  revalidatePath("/intern");
  bounce(decisionPath(formData), "ok", `Request is now ${next.status.replaceAll("_", " ")}.`);
}

async function linkInternshipRecord(input: {
  userId: string;
  email: string;
  fullName: string;
  universityName: string;
  academicProgram: string;
  existingInternId: string;
  returnPath: string;
}) {
  const cohort = await getActiveCohort();
  if (!cohort?.id) {
    bounce(input.returnPath, "error", "Set an active internship cohort before verifying a university.");
  }
  const universityId = await universityFor(input.universityName);
  const managerUserId = await userIdForEmail(SPRING_2027_INTERN_MANAGER_EMAIL);
  const supervisorUserId = await userIdForEmail(SPRING_2027_INTERN_SUPERVISOR_EMAIL);
  const byUser = await supabaseAdmin
    .from("internship_interns")
    .select("id")
    .eq("user_id", input.userId)
    .limit(1)
    .maybeSingle();
  const byEmail = byUser.data?.id
    ? byUser
    : await supabaseAdmin
        .from("internship_interns")
        .select("id")
        .ilike("email", input.email)
        .limit(1)
        .maybeSingle();
  const existing = input.existingInternId
    ? await supabaseAdmin.from("internship_interns").select("id").eq("id", input.existingInternId).maybeSingle()
    : byEmail;
  const patch = {
    user_id: input.userId,
    full_name: input.fullName,
    email: input.email,
    academic_program: input.academicProgram,
    university_id: universityId,
    status: "onboarding",
    portal_enabled: true,
    internship_title: "Social Media & Community Growth Intern",
    manager_user_id: managerUserId,
    supervisor_user_id: supervisorUserId,
    semester: "Spring 2027",
    university_verification_status: "verified",
    updated_at: new Date().toISOString(),
  };
  if (existing.data?.id) {
    await supabaseAdmin.from("internship_interns").update(patch).eq("id", existing.data.id);
    return String(existing.data.id);
  }
  const { data: created, error } = await supabaseAdmin
    .from("internship_interns")
    .insert({ ...patch, cohort_id: cohort.id })
    .select("id")
    .maybeSingle();
  if (error || !created?.id) {
    console.warn("linkInternshipRecord", error?.message);
    bounce("/admin/hr/access-requests", "error", "The internship record could not be linked.");
  }
  return String(created.id);
}

async function universityFor(name: string) {
  const { data: found } = await supabaseAdmin
    .from("internship_universities")
    .select("id")
    .ilike("name", name)
    .limit(1)
    .maybeSingle();
  if (found?.id) return String(found.id);
  const slug = internshipUniversitySlug(name) || `school-${Date.now()}`;
  const { data: created, error } = await supabaseAdmin
    .from("internship_universities")
    .insert({ slug, name, display_name: name, status: "research_needed" })
    .select("id")
    .maybeSingle();
  if (error || !created?.id) bounce("/admin/hr/access-requests", "error", "The university could not be recorded.");
  return String(created.id);
}

export async function ceoApproveInternAccess(formData: FormData) {
  return decide(formData, "ceo_approve");
}

export async function verifyInternUniversity(formData: FormData) {
  return decide(formData, "verify_university");
}

export async function denyInternAccess(formData: FormData) {
  return decide(formData, "deny");
}

export async function completeInternAccess(formData: FormData) {
  return decide(formData, "complete");
}

export async function revokeInternAccess(formData: FormData) {
  return decide(formData, "revoke");
}

export async function activateInternAccess(userId: string) {
  if (!userId) return;
  await supabaseAdmin
    .from("staff_access_requests")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("status", "approved");
}
