"use server";

import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { verifyPlannerApplicationConnection } from "@/lib/microsoft/planner-app-verification";

/**
 * Only a verified SitGuru super administrator can trigger an app-only Graph
 * write test. Never fetch or log client secrets / access tokens.
 */
export async function testPlannerAppOnlyConnection() {
  const actor = await getAdminIdentity();
  if (!actor?.isSuperUser) redirect("/admin/login");
  const result = await verifyPlannerApplicationConnection();
  const params = new URLSearchParams({
    result: result.passed ? "pass" : "fail",
    stage: result.stage,
    message: result.message,
  });
  if (result.taskId) params.set("taskId", result.taskId);
  redirect(`/admin/internship/planner-setup?${params.toString()}`);
}
