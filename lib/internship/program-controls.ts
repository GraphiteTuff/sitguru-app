import "server-only";

import { getAdminIdentity } from "@/lib/admin/access";
import { canUseGrowthPortal } from "@/lib/admin/growth/access";
import { internshipActorKind, isPortalUserId } from "@/lib/internship/manager-access";
import { isProgramStatus, type ProgramStatus } from "@/lib/internship/program-status";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const PROGRAM_CONTROL_PATHS = {
  admin: "/admin/internship/program-controls",
  manager: "/manager/internship/program-controls",
} as const;

export type ProgramControlsMode = keyof typeof PROGRAM_CONTROL_PATHS;

export async function getProgramControlsActor(mode: ProgramControlsMode) {
  const actor = await getAdminIdentity();
  if (actor?.isSuperUser && actor.canAccessAdmin) return { id: actor.id, role: "supervisor" as const };
  if (mode === "manager" && actor && canUseGrowthPortal(actor) && internshipActorKind(actor) === "manager") {
    return { id: actor.id, role: "manager" as const };
  }
  return null;
}

export async function getProgramStatus(cohortId?: string | null): Promise<ProgramStatus | null> {
  if (!isPortalUserId(cohortId)) return null;
  const { data, error } = await supabaseAdmin.from("internship_program_controls")
    .select("status").eq("cohort_id", cohortId).maybeSingle();
  if (error) return null;
  return isProgramStatus(data?.status) ? data.status : "pre_launch";
}

export function programTransitionsEnabled() {
  return process.env.SITGURU_INTERNSHIP_PROGRAM_CONTROLS_VERIFIED === "true";
}

export async function canUseOfficialCheckIns(cohortId?: string | null) {
  return process.env.SITGURU_INTERNSHIP_CHECK_INS_VERIFIED === "true" &&
    (await getProgramStatus(cohortId)) === "active";
}

export function officialGradesEnabled() {
  return process.env.SITGURU_INTERNSHIP_GRADING_VERIFIED === "true";
}

export function canViewOfficialGrades(status: ProgramStatus | null) {
  return officialGradesEnabled() && status !== null && status !== "pre_launch";
}

export async function canReleaseOfficialGrades(cohortId?: string | null) {
  return officialGradesEnabled() && (await getProgramStatus(cohortId)) === "active";
}

export async function listProgramCohorts(actor: NonNullable<Awaited<ReturnType<typeof getProgramControlsActor>>>) {
  const query = supabaseAdmin.from("internship_cohorts")
    .select("id,name,starts_on,ends_on,default_manager_user_id,default_supervisor_user_id")
    .order("year", { ascending: false }).order("starts_on", { ascending: false }).order("id");
  if (actor.role === "manager") query.eq("default_manager_user_id", actor.id);
  return query;
}

export async function loadProgramControls(cohortId: string) {
  const [state, history, enrollment] = await Promise.all([
    supabaseAdmin.from("internship_program_controls")
      .select("status,revision,activated_at,activated_by").eq("cohort_id", cohortId).maybeSingle(),
    supabaseAdmin.from("internship_program_control_events")
      .select("revision,from_status,to_status,actor_id,actor_role,occurred_at")
      .eq("cohort_id", cohortId).order("revision", { ascending: false }),
    supabaseAdmin.from("internship_interns").select("id", { head: true, count: "exact" })
      .eq("cohort_id", cohortId).eq("portal_enabled", true).in("status", ["accepted", "active", "approved"]),
  ]);
  if (state.error || history.error || enrollment.error) return null;

  const actorIds = [...new Set<string>([
    ...(state.data?.activated_by ? [state.data.activated_by] : []),
    ...history.data.map((event) => event.actor_id),
  ])];
  const profiles = actorIds.length
    ? await supabaseAdmin.from("profiles").select("id,full_name,first_name,last_name").in("id", actorIds)
    : { data: [] };
  const names = new Map((profiles.data ?? []).map((profile) => [
    profile.id, profile.full_name || [profile.first_name, profile.last_name].filter(Boolean).join(" "),
  ]));

  return {
    status: isProgramStatus(state.data?.status) ? state.data.status : "pre_launch" as const,
    revision: state.data?.revision ?? 0,
    activatedAt: state.data?.activated_at,
    activatedBy: state.data?.activated_by ? names.get(state.data.activated_by) || state.data.activated_by : null,
    history: history.data.map((event) => ({ ...event, actorName: names.get(event.actor_id) || event.actor_id })),
    enrollment: enrollment.count ?? 0,
  };
}
