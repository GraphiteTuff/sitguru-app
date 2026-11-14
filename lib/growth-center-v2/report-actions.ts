"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { loadGrowthCenterSnapshot } from "@/lib/growth-center-v2/snapshot";
import { getGrowthReportPeriod, growthReportFilters } from "@/lib/growth-center-v2/report-periods";
import { saveGrowthReportToMicrosoft365 } from "@/lib/growth-center-v2/report-sharepoint";
import { WEEKLY_PULSE_PLATFORMS } from "@/lib/growth-center-v2/report-document";
import type { ManagerReportReview } from "@/lib/growth-center-v2/report-document";

function field(formData: FormData, key: string, max = 6000) {
  return String(formData.get(key) || "").trim().slice(0, max);
}

function go(period: string, end: string, kind: "ok" | "error", message: string): never {
  const query = new URLSearchParams({ period, end, [kind]: message });
  redirect("/manager/reports?" + query.toString());
}

export async function saveManagerGrowthReport(formData: FormData) {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok || access.actor.isSuperUser) {
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
    weeklyPulse: {
      platforms: Object.fromEntries(
        WEEKLY_PULSE_PLATFORMS.map(({ id }) => [id, {
          followers: field(formData, "pulse_" + id + "_followers", 32),
          netGrowth: field(formData, "pulse_" + id + "_netGrowth", 32),
          reach: field(formData, "pulse_" + id + "_reach", 32),
          impressions: field(formData, "pulse_" + id + "_impressions", 32),
          linkClicks: field(formData, "pulse_" + id + "_linkClicks", 32),
          evidenceLink: field(formData, "pulse_" + id + "_evidenceLink", 700),
        }]),
      ) as ManagerReportReview["weeklyPulse"]["platforms"],
      topAssetLink: field(formData, "pulse_topAssetLink"),
      topAssetMetrics: field(formData, "pulse_topAssetMetrics"),
      topAssetWhy: field(formData, "pulse_topAssetWhy"),
      calendarStatus: field(formData, "pulse_calendarStatus", 32),
      upcomingCampaigns: field(formData, "pulse_upcomingCampaigns"),
      resourceBlockers: field(formData, "pulse_resourceBlockers"),
      communitySentiment: field(formData, "pulse_communitySentiment", 32),
      commonQuestions: field(formData, "pulse_commonQuestions"),
      escalations: field(formData, "pulse_escalations"),
      weeklyDiscovery: field(formData, "pulse_weeklyDiscovery"),
      changeNextWeek: field(formData, "pulse_changeNextWeek"),
      coachingNotes: field(formData, "pulse_coachingNotes"),
    },
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
