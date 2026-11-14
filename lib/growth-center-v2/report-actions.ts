"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireGrowthActor } from "@/lib/admin/growth/workplace";
import { loadGrowthCenterSnapshot } from "@/lib/growth-center-v2/snapshot";
import { getGrowthReportPeriod, growthReportFilters } from "@/lib/growth-center-v2/report-periods";
import { saveGrowthReportToMicrosoft365 } from "@/lib/growth-center-v2/report-sharepoint";
import type { ManagerReportReview } from "@/lib/growth-center-v2/report-document";

function field(formData: FormData, key: string, max = 6000) {
  return String(formData.get(key) || "").trim().slice(0, max);
}

function go(period: string, end: string, kind: "ok" | "error", message: string): never {
  const query = new URLSearchParams({ period, end, [kind]: message });
  redirect("/manager/reports?" + query.toString());
}

export async function saveManagerGrowthReport(formData: FormData) {
  const access = await requireGrowthActor();
  if (!access.ok || access.actor.kind !== "manager" || access.actor.isSuperUser) {
    redirect("/manager/reports?error=Only+an+authorized+growth+manager+can+submit+reports");
  }
  const period = getGrowthReportPeriod({
    cadence: field(formData, "period", 10),
    end: field(formData, "end", 10),
  });
  const intent = field(formData, "intent", 20) === "submit" ? "submit" : "save";
  const review: ManagerReportReview = {
    worked: field(formData, "worked"),
    didntWork: field(formData, "didntWork"),
    learned: field(formData, "learned"),
    nextSteps: field(formData, "nextSteps"),
    internProgress: field(formData, "internProgress"),
    additionalNotes: field(formData, "additionalNotes"),
  };
  if (intent === "submit" && (!review.worked || !review.learned || !review.nextSteps)) {
    go(period.cadence, period.endDate, "error", "Before submitting, explain what worked, what was learned, and the next actions.");
  }
  if (intent === "submit" && !period.completed) {
    go(period.cadence, period.endDate, "error", "The reporting period must be completed before final submission.");
  }
  const snapshot = await loadGrowthCenterSnapshot({ audience: "manager", filters: growthReportFilters(period) });
  const result = await saveGrowthReportToMicrosoft365({
    period,
    snapshot,
    mode: intent,
    review,
    author: access.actor.email,
  });
  if (!result.ok) go(period.cadence, period.endDate, "error", result.message);
  revalidatePath("/manager/reports");
  revalidatePath("/admin/growth/reports");
  go(period.cadence, period.endDate, "ok", result.message);
}
