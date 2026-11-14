/**
 * Manually linked Planner tasks never count as API-verified Microsoft sync.
 * Keep links on Microsoft-owned domains, and require a specific task URL.
 */
const TRUSTED_PLANNER_HOSTS = new Set([
  "planner.cloud.microsoft",
  "planner.microsoft.com",
  "tasks.office.com",
]);

export function parseMicrosoftPlannerTaskUrl(input: unknown): { ok: true; url: string; taskId: string } | { ok: false; reason: string } {
  try {
    const raw = String(input || "").trim();
    if (raw.length > 2000) return { ok: false, reason: "Keep the Planner task link under 2,000 characters." };
    const url = new URL(raw);
    if (url.protocol !== "https:" || !TRUSTED_PLANNER_HOSTS.has(url.hostname.toLowerCase()) || url.username || url.password) {
      return { ok: false, reason: "Use a Microsoft Planner HTTPS task link." };
    }
    const match = url.pathname.match(/\/task\/([a-z0-9_-]+)/i) || url.pathname.match(/\/TaskDetail\/([a-z0-9_-]+)/i);
    const queryTask = url.searchParams.get("taskId") || url.searchParams.get("task");
    const taskId = match?.[1] || (queryTask && /^[a-z0-9_-]{5,150}$/i.test(queryTask) ? queryTask : "");
    if (!taskId || !/^[a-z0-9_-]{5,150}$/i.test(taskId)) {
      return { ok: false, reason: "Open a specific task in Microsoft Planner and copy its task link." };
    }
    return { ok: true, url: url.toString(), taskId };
  } catch {
    return { ok: false, reason: "Enter a valid Microsoft Planner task link." };
  }
}
