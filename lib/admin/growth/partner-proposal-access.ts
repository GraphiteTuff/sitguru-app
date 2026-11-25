import "server-only";
import { getAdminIdentity } from "@/lib/admin/access";
import { currentAssignedIntern } from "@/lib/admin/growth/workplace";
import { internOnboardingComplete } from "@/lib/internship/onboarding";
import { getInternOnboarding } from "@/lib/internship/queries";
import { internshipActorKind } from "@/lib/internship/manager-access";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const PROPOSAL_PATHS = {
  admin: "/admin/growth/partners",
  manager: "/manager/partners",
  intern: "/intern/growth/partners",
} as const;

export type ProposalMode = keyof typeof PROPOSAL_PATHS;

export async function getPartnerProposalActor(mode: ProposalMode) {
  if (mode === "intern") {
    const intern = await currentAssignedIntern();
    if (!intern?.userId || !internOnboardingComplete(await getInternOnboarding(intern.id))) return null;
    return { id: intern.userId, role: "intern" as const, internIds: [intern.id] };
  }
  const actor = await getAdminIdentity();
  if (!actor) return null;
  if (actor.isSuperUser) return { id: actor.id, role: "supervisor" as const, internIds: [] };
  if (mode === "admin" || internshipActorKind(actor) !== "manager") return null;
  const { data, error } = await supabaseAdmin.from("internship_interns").select("id")
    .eq("manager_user_id", actor.id).eq("portal_enabled", true).in("status", ["active","accepted","approved"]);
  if (error) return null;
  return { id: actor.id, role: "manager" as const, internIds: (data || []).map((row) => String(row.id)) };
}

export type PartnerProposalActor = NonNullable<Awaited<ReturnType<typeof getPartnerProposalActor>>>;

export function canAccessPartnerProposal(actor: PartnerProposalActor, proposal: { intern_id: string | null; owner_user_id: string | null }) {
  return actor.role === "supervisor" ||
    (actor.role === "manager" && proposal.owner_user_id === actor.id) ||
    (proposal.intern_id != null && actor.internIds.includes(proposal.intern_id));
}
