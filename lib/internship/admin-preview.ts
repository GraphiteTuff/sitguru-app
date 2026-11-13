/**
 * Authorized, read-only employer previews of an intern's real assignment data.
 * This helper never changes the authenticated user, Supabase session, or task state.
 */
import { notFound, redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { isGrowthOnlyRole } from "@/lib/admin/growth-paths";
import { canBrowseAllPortals, internshipActorKind, isPortalUserId } from "@/lib/internship/manager-access";
import { findInternById, getInternWorkspace } from "@/lib/internship/queries";

export function adminInternAssignmentsPath(internId: string) {
  return `/admin/internship/preview/${encodeURIComponent(internId)}/assignments`;
}

export function adminInternAssignmentPath(internId: string, taskId: string) {
  return `${adminInternAssignmentsPath(internId)}/${encodeURIComponent(taskId)}`;
}

/** Permission must be checked on each admin preview page, including deep links. */
export async function requireAdminInternAssignmentPreview(internId: string) {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) redirect("/admin/login");
  const allowed = canBrowseAllPortals({
    actor: internshipActorKind({ role: actor.role, isSuperUser: actor.isSuperUser }),
    canAccessAdmin: actor.canAccessAdmin,
    growthOnly: isGrowthOnlyRole(actor.role) && !actor.isSuperUser,
  });
  if (!allowed || !isPortalUserId(internId)) notFound();

  const intern = await findInternById(internId);
  if (!intern) notFound();
  const workspace = await getInternWorkspace(intern.id);
  if (!workspace) notFound();
  return workspace;
}
