"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isPortalUserId } from "@/lib/internship/manager-access";
import { getProgramControlsActor, PROGRAM_CONTROL_PATHS, programTransitionsEnabled } from "@/lib/internship/program-controls";
import { PROGRAM_ACTION_LABELS } from "@/lib/internship/program-status";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function transitionInternshipProgram(form: FormData) {
  const mode = form.get("mode") === "admin" ? "admin" : "manager";
  const path = PROGRAM_CONTROL_PATHS[mode];
  const actor = await getProgramControlsActor(mode);
  if (!actor) redirect(path);

  const cohort = String(form.get("cohort") ?? "");
  if (!isPortalUserId(cohort)) redirect(path);
  const go = (result: "error" | "saved") =>
    redirect(`${path}?${new URLSearchParams({ cohort, result })}`);

  const action = String(form.get("transition") ?? "");
  const revision = String(form.get("revision") ?? "");
  if (!programTransitionsEnabled() || form.get("confirmed") !== "yes" ||
    !Object.hasOwn(PROGRAM_ACTION_LABELS, action) || !/^\d{1,9}$/.test(revision)) go("error");

  const { data, error } = await supabaseAdmin.rpc("transition_internship_program", {
    p_cohort_id: cohort,
    p_actor_id: actor.id,
    p_actor_role: actor.role,
    p_revision: Number(revision),
    p_action: action,
  });
  if (error || data !== true) {
    if (error) console.error("[internship] Program transition rejected", error.code);
    go("error");
  }

  revalidatePath(PROGRAM_CONTROL_PATHS.admin);
  revalidatePath(PROGRAM_CONTROL_PATHS.manager);
  revalidatePath("/intern", "layout");
  revalidatePath("/manager/instructor");
  revalidatePath("/admin/internship/instructor");
  go("saved");
}
