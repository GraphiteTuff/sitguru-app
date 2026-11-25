import "server-only";
import { getAdminIdentity } from "@/lib/admin/access";
import { canReadPrivateInternRecord, internshipActorKind, isPortalUserId } from "@/lib/internship/manager-access";
import { findInternById } from "@/lib/internship/queries";

export async function getProgramEvaluationAccess(internId: string) {
  if (!isPortalUserId(internId)) return null;
  const user = await getAdminIdentity();
  const kind = internshipActorKind({ role: user?.role, isSuperUser: user?.isSuperUser });
  if (!user || (kind !== "manager" && kind !== "supervisor")) return null;
  const intern = await findInternById(internId);
  if (!intern || !canReadPrivateInternRecord({
    actor: kind, actorUserId: user.id, targetInternId: intern.id, managerUserId: intern.managerUserId,
  })) return null;
  return { user, kind, intern };
}
