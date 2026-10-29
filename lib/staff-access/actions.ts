"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAdminIdentity } from "@/lib/admin/access";
import { grantGrowthHireAccess } from "@/lib/admin/growth/hire";

const REQUEST_PATH = "/account/staff-access";
const REVIEW_PATH = "/admin/hr/staff-requests";
const ALLOWED_ROLE = "social_community_manager";

function value(form: FormData, field: string) {
  return String(form.get(field) || "").trim();
}

function go(path: string, field: "ok" | "error", message: string): never {
  redirect(path + "?" + field + "=" + encodeURIComponent(message));
}

export async function requestStaffRole(form: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at || !user.email) {
    go(REQUEST_PATH, "error", "Sign in with a verified email before requesting access.");
  }
  const role = value(form, "role");
  if (role !== ALLOWED_ROLE) go(REQUEST_PATH, "error", "That staff role is not available for self-service requests.");

  const name = value(form, "name");
  const reason = value(form, "reason");
  if (name.length < 2 || name.length > 120 || reason.length > 600) {
    go(REQUEST_PATH, "error", "Enter a valid full name and a short reason (600 characters maximum).");
  }

  const actor = await getAdminIdentity();
  if (actor && (actor.role === role || actor.isSuperUser)) {
    go(REQUEST_PATH, "ok", "This account already has staff access.");
  }

  const { data: active } = await supabaseAdmin.from("admin_user_access")
    .select("id").eq("user_id", user.id).eq("role_key", role).eq("is_active", true).limit(1);
  if (active?.length) go(REQUEST_PATH, "ok", "This account already has that staff role.");

  const { data: pending } = await supabaseAdmin.from("staff_role_requests")
    .select("id").eq("user_id", user.id).eq("requested_role", role)
    .in("status", ["pending", "processing"]).limit(1);
  if (pending?.length) go(REQUEST_PATH, "ok", "Your request is already awaiting review.");

  // Prevent rapid re-submission after a denial; admin can create a new invite instead.
  const { data: recent, error: recentError } = await supabaseAdmin.from("staff_role_requests")
    .select("requested_at").eq("user_id", user.id).eq("requested_role", role)
    .order("requested_at", { ascending: false }).limit(1);
  if (recentError) go(REQUEST_PATH, "error", "Staff requests are not configured yet.");
  if (recent?.[0] && Date.now() - new Date(recent[0].requested_at).getTime() < 24 * 60 * 60 * 1000) {
    go(REQUEST_PATH, "error", "Please allow 24 hours before submitting another request.");
  }

  const { error } = await supabaseAdmin.from("staff_role_requests").insert({
    user_id: user.id,
    email: user.email.toLowerCase(),
    full_name: name,
    requested_role: role,
    reason,
  });
  if (error) {
    go(REQUEST_PATH, "error", error.code === "23505" ? "A request is already pending." : "Could not save your request. Please try again.");
  }
  revalidatePath(REVIEW_PATH);
  revalidatePath("/admin");
  revalidatePath(REQUEST_PATH);
  go(REQUEST_PATH, "ok", "Your staff access request has been submitted for CEO review.");
}

export async function reviewStaffRoleRequest(form: FormData) {
  const admin = await getAdminIdentity();
  if (!admin?.isSuperUser || !admin.canManageRoles) {
    go(REVIEW_PATH, "error", "Only a Super Admin can approve or deny staff role requests.");
  }
  const requestId = value(form, "requestId");
  const decision = value(form, "decision");
  const note = value(form, "note").slice(0, 500);
  if (!["approve", "deny"].includes(decision)) go(REVIEW_PATH, "error", "Invalid decision.");

  // Claim the pending request atomically so concurrent approvals cannot both run.
  const { data: claimed, error: claimError } = await supabaseAdmin.from("staff_role_requests")
    .update({ status: "processing" })
    .eq("id", requestId).eq("status", "pending")
    .select("id,user_id,email,full_name,requested_role").maybeSingle();
  if (claimError || !claimed) go(REVIEW_PATH, "error", "Request is no longer pending or was not found.");
  if (claimed.requested_role !== ALLOWED_ROLE) {
    await supabaseAdmin.from("staff_role_requests").update({status:"pending"}).eq("id",requestId).eq("status","processing");
    go(REVIEW_PATH, "error", "Requested role is not approved for this workflow.");
  }

  if (decision === "approve") {
    // Identity must still belong to the originally requesting auth user.
    const auth = await supabaseAdmin.auth.admin.getUserById(claimed.user_id);
    if (auth.error || !auth.data.user || auth.data.user.email?.toLowerCase() !== claimed.email.toLowerCase()) {
      await supabaseAdmin.from("staff_role_requests").update({status:"pending"}).eq("id",requestId).eq("status","processing");
      go(REVIEW_PATH, "error", "Account identity changed. Review the account before approving.");
    }
    const result = await grantGrowthHireAccess({
      actor: admin, email: claimed.email, name: claimed.full_name,
      notes: "Approved staff access request " + requestId + (note ? ". " + note : ""),
      invite: false,
    });
    if (!result.ok || result.userId !== claimed.user_id) {
      await supabaseAdmin.from("staff_role_requests").update({status:"pending"}).eq("id",requestId).eq("status","processing");
      go(REVIEW_PATH, "error", "Could not grant matching staff permissions; request left for review.");
    }
  }
  const { error: finishError } = await supabaseAdmin.from("staff_role_requests")
    .update({status:decision==="approve"?"approved":"denied",reviewed_by:admin.id,reviewed_at:new Date().toISOString(),review_note:note})
    .eq("id",requestId).eq("status","processing");
  if (finishError) go(REVIEW_PATH, "error", "Role change processed but review status could not be updated. Please investigate.");
  revalidatePath(REVIEW_PATH);
  revalidatePath(REQUEST_PATH);
  revalidatePath("/admin");
  revalidatePath("/admin/hr");
  go(REVIEW_PATH, "ok", decision === "approve" ? "Staff role approved and access granted." : "Request denied. No staff access was granted.");
}
