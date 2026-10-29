"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { grantGrowthHireAccess } from "@/lib/admin/growth/hire";
import { ceoApproveInternAccess } from "@/lib/internship/intern-access-actions";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requestableTeamRole, staffRequestOnCooldown } from "@/lib/staff-access/policy";

const REQUEST_PATH = "/account/staff-access";
const REVIEW_PATH = "/admin/hr/staff-requests";

function field(form: FormData, key: string) {
  return String(form.get(key) || "").trim();
}

function go(path: string, kind: "ok" | "error", message: string): never {
  redirect(`${path}?${kind}=${encodeURIComponent(message)}`);
}

export async function requestTeamAccess(form: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email || !user.email_confirmed_at) {
    go(REQUEST_PATH, "error", "Sign in with a verified email before requesting access.");
  }
  const role = requestableTeamRole(field(form, "role"));
  if (!role) go(REQUEST_PATH, "error", "That team role is not available for self-service requests.");
  const name = field(form, "name");
  const reason = field(form, "reason");
  const university = field(form, "universityName");
  const program = field(form, "academicProgram");
  if (name.length < 2 || name.length > 120 || reason.length > 600) {
    go(REQUEST_PATH, "error", "Enter a valid full name and a short reason.");
  }
  if (role.key === "social_media_community_growth_intern" && university.length < 2) {
    go(REQUEST_PATH, "error", "Add the university for this internship request.");
  }

  const { data: open } = await supabaseAdmin
    .from("staff_access_requests")
    .select("id,status")
    .eq("user_id", user.id)
    .in("status", ["pending_ceo_review", "pending_university_approval", "approved", "active"])
    .limit(1)
    .maybeSingle();
  if (open?.id) go(REQUEST_PATH, "ok", "Your request is already awaiting review.");

  const { data: recent } = await supabaseAdmin
    .from("staff_access_requests")
    .select("created_at,status")
    .eq("user_id", user.id)
    .eq("role_key", role.key)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (recent?.status === "denied" && staffRequestOnCooldown(String(recent.created_at || ""))) {
    go(REQUEST_PATH, "error", "Please allow 24 hours before submitting another request.");
  }

  const { error } = await supabaseAdmin.from("staff_access_requests").insert({
    user_id: user.id,
    email: user.email.toLowerCase(),
    full_name: name,
    role_key: role.key,
    university_name: university,
    academic_program: program,
    decision_note: reason,
    status: "pending_ceo_review",
  });
  if (error) go(REQUEST_PATH, "error", error.code === "23505" ? "A request is already pending." : "Could not save your request.");
  revalidatePath(REVIEW_PATH);
  revalidatePath("/admin/hr");
  revalidatePath("/admin");
  go(REQUEST_PATH, "ok", "Your request is Pending CEO Review. It does not grant access yet.");
}

export async function reviewTeamAccess(form: FormData) {
  const admin = await getAdminIdentity();
  if (!admin?.isSuperUser || !admin.canManageRoles) {
    go(REVIEW_PATH, "error", "Only a Super Admin can approve or deny team access requests.");
  }
  const requestId = field(form, "requestId");
  const decision = field(form, "decision");
  if (decision !== "approve" && decision !== "deny") go(REVIEW_PATH, "error", "Invalid decision.");
  const { data: request } = await supabaseAdmin.from("staff_access_requests").select("*").eq("id", requestId).maybeSingle();
  if (!request || request.status !== "pending_ceo_review") {
    go(REVIEW_PATH, "error", "That request is no longer waiting for CEO review.");
  }
  if (request.role_key === "social_media_community_growth_intern") {
    if (decision === "deny") {
      form.set("requestId", requestId);
      const { denyInternAccess } = await import("@/lib/internship/intern-access-actions");
      await denyInternAccess(form);
    }
    form.set("returnTo", REVIEW_PATH);
    await ceoApproveInternAccess(form);
  }
  const note = field(form, "note").slice(0, 500);
  const auth = await supabaseAdmin.auth.admin.getUserById(String(request.user_id));
  if (auth.error || auth.data.user?.email?.toLowerCase() !== String(request.email).toLowerCase()) {
    go(REVIEW_PATH, "error", "Account identity changed. Review the account before approving.");
  }
  if (decision === "approve") {
    const granted = await grantGrowthHireAccess({
      actor: admin,
      email: String(request.email),
      name: String(request.full_name),
      notes: `Approved team access request ${requestId}${note ? `. ${note}` : ""}`,
      invite: false,
    });
    if (!granted.ok || granted.userId !== request.user_id) {
      go(REVIEW_PATH, "error", "Could not grant manager access. The request is still pending.");
    }
  }
  const { error } = await supabaseAdmin.from("staff_access_requests").update({
    status: decision === "approve" ? "approved" : "denied",
    decided_by: admin.id,
    ceo_reviewed_at: new Date().toISOString(),
    decision_note: note,
    updated_at: new Date().toISOString(),
  }).eq("id", requestId).eq("status", "pending_ceo_review");
  if (error) go(REVIEW_PATH, "error", "The review could not be saved.");
  revalidatePath(REVIEW_PATH);
  revalidatePath(REQUEST_PATH);
  go(REVIEW_PATH, "ok", decision === "approve" ? "Manager Portal access approved." : "Request denied. No staff access was granted.");
}
