"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getInternOnboarding, findInternByAccount } from "@/lib/internship/queries";
import { internOnboardingComplete, INTERNSHIP_ONBOARDING_PATH } from "@/lib/internship/onboarding";
import { isPortalUserId } from "@/lib/internship/manager-access";
import { saveOwnAssignmentProgress } from "@/lib/internship/assignment-progress-service";

export async function saveInternAssignmentProgress(formData: FormData) {
  const id = String(formData.get("assignmentId") || "").trim();
  const intent = formData.get("intent") === "submit" ? "submit" : "save";
  if (!isPortalUserId(id)) redirect("/intern/assignments");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/intern/login");
  const intern = await findInternByAccount({ userId: user.id, email: user.email });
  if (!intern) redirect("/intern/login");
  if (!internOnboardingComplete(await getInternOnboarding(intern.id))) redirect(INTERNSHIP_ONBOARDING_PATH);

  const result = await saveOwnAssignmentProgress({ intern, userId: user.id, assignmentId: id, intent, formData });
  if (!result.ok && result.status === 404) redirect("/intern/assignments");
  const flash = new URLSearchParams([[result.ok ? "ok" : "error", result.ok ? result.message : result.error]]);
  redirect(`/intern/assignments/${encodeURIComponent(id)}?${flash}`);
}
