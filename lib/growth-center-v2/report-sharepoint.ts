import { graphRequest, readMicrosoftGraphConfig } from "@/lib/microsoft/graph";
import { snapshotToCsv } from "./reports";
import { growthReportMarkdown, normalizedReportReview } from "./report-document";
import type { ManagerReportReview, SavedGrowthReport } from "./report-document";
import type { GrowthReportPeriod } from "./report-periods";
import type { GrowthCenterSnapshot } from "./types";

type DriveItem = { id?: string; name?: string; webUrl?: string; folder?: object };
type StoreStatus = "connected" | "not_configured" | "unavailable";

export const ANALYTICS_RESULTS_SHAREPOINT_URL =
  "https://sitgurullc.sharepoint.com/sites/SitGuruMarketingCommunityGrowth/Shared%20Documents/Analytics%20and%20Results";
export const ANALYTICS_RESULTS_TEAMS_URL =
  "https://teams.cloud.microsoft/l/channel/19%3A6a3c6f8904244ca8b62e4f3a8bbbe042%40thread.tacv2/Analytics%20and%20Results?groupId=e338678f-1008-4dd8-8705-0669b1e76ef8&tenantId=6942aff2-2055-4354-a6de-38bfc2d65548";

function fileUrl(period: GrowthReportPeriod) {
  return ANALYTICS_RESULTS_SHAREPOINT_URL + "/" +
    period.folderSegments.slice(1).map(encodeURIComponent).join("/") +
    "/" + encodeURIComponent(period.fileStem + ".md");
}

function driveId() {
  return readMicrosoftGraphConfig().driveId;
}

function graphRootPath(period: GrowthReportPeriod) {
  const path = period.folderSegments.map(encodeURIComponent).join("/");
  return "/drives/" + encodeURIComponent(driveId()) + "/root:/" + path + "/" +
    encodeURIComponent(period.fileStem + ".json") + ":/content";
}

export async function readStoredGrowthReport(period: GrowthReportPeriod): Promise<{
  state: StoreStatus;
  report: SavedGrowthReport | null;
  url: string;
}> {
  if (!readMicrosoftGraphConfig().configured || !driveId()) {
    return { state: "not_configured", report: null, url: fileUrl(period) };
  }
  const res = await graphRequest<SavedGrowthReport>({ method: "GET", path: graphRootPath(period) });
  if (!res.ok) {
    return {
      state: res.code === "needs_access" ? "connected" : "unavailable",
      report: null,
      url: fileUrl(period),
    };
  }
  if (!res.data || res.data.schemaVersion !== 1 || !res.data.review ||
      (res.data.status !== "draft" && res.data.status !== "submitted")) {
    return { state: "unavailable", report: null, url: fileUrl(period) };
  }
  return { state: "connected", report: res.data, url: fileUrl(period) };
}

async function ensureChildFolder(parentId: string, name: string): Promise<DriveItem | null> {
  const drive = encodeURIComponent(driveId());
  const lookup = () => graphRequest<DriveItem>({
    method: "GET",
    path: "/drives/" + drive + "/items/" + encodeURIComponent(parentId) + ":/" + encodeURIComponent(name),
  });
  const found = await lookup();
  if (found.ok && found.data?.id && found.data.folder) return found.data;
  if (!found.ok && found.code !== "needs_access") return null;
  const made = await graphRequest<DriveItem>({
    method: "POST",
    path: "/drives/" + drive + "/items/" + encodeURIComponent(parentId) + "/children",
    body: { name, folder: {}, "@microsoft.graph.conflictBehavior": "fail" },
  });
  if (made.ok && made.data?.id) return made.data;
  if (!made.ok && made.code === "conflict") {
    const retried = await lookup();
    if (retried.ok && retried.data?.id && retried.data.folder) return retried.data;
  }
  return null;
}

async function ensureReportFolder(period: GrowthReportPeriod): Promise<DriveItem | null> {
  const config = readMicrosoftGraphConfig();
  if (!config.configured || !config.driveId) return null;
  const drive = encodeURIComponent(config.driveId);
  // Existing Analytics and Results library is the sole canonical reporting root.
  const root = await graphRequest<DriveItem>({
    method: "GET",
    path: "/drives/" + drive + "/root:/" + encodeURIComponent("Analytics and Results"),
  });
  if (!root.ok || !root.data.id || !root.data.folder) return null;
  let parent: DriveItem = root.data;
  for (const name of period.folderSegments.slice(1)) {
    const child = await ensureChildFolder(String(parent.id), name);
    if (!child?.id) return null;
    parent = child;
  }
  return parent;
}

async function uploadFile(folderId: string, name: string, content: string, type: string) {
  return graphRequest<DriveItem>({
    method: "PUT",
    path: "/drives/" + encodeURIComponent(driveId()) +
      "/items/" + encodeURIComponent(folderId) + ":/" + encodeURIComponent(name) + ":/content",
    contentType: type,
    rawBody: content,
  });
}

export async function saveGrowthReportToMicrosoft365(input: {
  period: GrowthReportPeriod;
  snapshot: GrowthCenterSnapshot;
  mode: "auto" | "save" | "submit";
  author: string;
  review?: Partial<ManagerReportReview>;
}): Promise<{ ok: boolean; status: "draft" | "submitted" | "skipped" | "error"; message: string; url: string }> {
  const { period, snapshot, mode } = input;
  const prior = await readStoredGrowthReport(period);
  if (prior.state === "not_configured" || prior.state === "unavailable") {
    return { ok: false, status: "error", message: "Microsoft 365 could not be verified; no report was marked saved.", url: prior.url };
  }
  if (prior.report?.status === "submitted") {
    return {
      ok: mode === "auto",
      status: mode === "auto" ? "skipped" : "error",
      message: mode === "auto" ? "Submitted report is locked; automatic refresh skipped." : "This report has already been submitted to the CEO.",
      url: prior.url,
    };
  }
  if (mode === "submit" && !period.completed) {
    return { ok: false, status: "error", message: "Wait until this reporting period has ended before submitting a final report.", url: prior.url };
  }
  const folder = await ensureReportFolder(period);
  if (!folder?.id) {
    return { ok: false, status: "error", message: "Could not access or create the dated SharePoint report folder.", url: prior.url };
  }
  const now = new Date().toISOString();
  const report: SavedGrowthReport = {
    schemaVersion: 1,
    period,
    snapshot,
    review: normalizedReportReview(mode === "auto" ? prior.report?.review : input.review || prior.report?.review),
    status: mode === "submit" ? "submitted" : "draft",
    createdAt: prior.report?.createdAt || now,
    updatedAt: now,
    submittedAt: mode === "submit" ? now : null,
    submittedBy: mode === "submit" ? input.author : null,
    sharePointUrl: prior.url,
  };
  const markdown = growthReportMarkdown(report);
  const csv = snapshotToCsv(snapshot);
  // Persist readable outputs first; JSON metadata is written last as the canonical state.
  const files = [
    { name: period.fileStem + ".csv", content: csv, type: "text/csv; charset=utf-8" },
    { name: period.fileStem + ".md", content: markdown, type: "text/markdown; charset=utf-8" },
    { name: period.fileStem + ".json", content: JSON.stringify(report, null, 2), type: "application/json; charset=utf-8" },
  ];
  for (const file of files) {
    const stored = await uploadFile(String(folder.id), file.name, file.content, file.type);
    if (!stored.ok || !stored.data?.id) {
      return {
        ok: false,
        status: "error",
        message: "SharePoint failed while saving " + file.name + ". The report was not marked successfully synced.",
        url: prior.url,
      };
    }
  }
  return {
    ok: true,
    status: report.status,
    message: report.status === "submitted" ?
      "Submitted and saved to Microsoft 365 for CEO review." : "Draft and source data saved to Microsoft 365.",
    url: prior.url,
  };
}
