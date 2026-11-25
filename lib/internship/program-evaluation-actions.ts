"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProgramEvaluationAccess } from "@/lib/internship/program-evaluation-access";
import { isPortalUserId } from "@/lib/internship/manager-access";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function saveProgramEvaluation(form: FormData) {
  const read = (key: string) => String(form.get(key) ?? "").trim();
  const internId = read("internId");
  const access = await getProgramEvaluationAccess(internId);
  if (!access) redirect("/manager/instructor");
  const path = `/manager/instructor/evaluations/${internId}`;
  const go = (kind: "ok" | "error", message: string): never => redirect(`${path}?${new URLSearchParams({ [kind]: message })}`);
  const id = read("requestId");
  const kind = read("evaluationKind");
  const intent = read("intent");
  const summary = read("summary");
  const nextSteps = read("nextSteps");

  if (!isPortalUserId(id) || !["midpoint", "final"].includes(kind) ||
      !["draft", "released"].includes(intent) || !summary || summary.length > 4000 || nextSteps.length > 4000) {
    return go("error", "Choose an evaluation period and add a summary.");
  }
  if (kind === "final" && intent === "released" && access.kind !== "supervisor") {
    return go("error", "The supervisor releases the final employer evaluation.");
  }

  const { error } = await supabaseAdmin.from("internship_evaluations").upsert({
    id, intern_id: internId, kind, status: intent,
    presented_at: intent === "released" ? new Date().toISOString().slice(0, 10) : null,
    payload: { summary, nextSteps, evaluatorId: access.user.id },
  }, { onConflict: "id", ignoreDuplicates: true });
  if (error) {
    console.error("[internship] Program evaluation not saved", error.code);
    return go("error", "The program evaluation could not be saved.");
  }
  revalidatePath("/intern/grades");
  return go("ok", intent === "released" ? "Employer evaluation released." : "Employer evaluation draft saved.");
}
