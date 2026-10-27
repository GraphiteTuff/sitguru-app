/**
 * Microsoft Teams is licensed to SitGuru work mailboxes only
 * (e.g. jason@sitguru.com, ava@sitguru.com) — never school or personal Gmail.
 */

import { normalizeAdminEmail } from "@/lib/admin/super-users";

export const SITGURU_WORK_EMAIL_DOMAIN = "sitguru.com";

export function isSitGuruWorkEmail(email: string | null | undefined) {
  const normalized = normalizeAdminEmail(email);
  return normalized.endsWith(`@${SITGURU_WORK_EMAIL_DOMAIN}`);
}

/** Prefer configured Growth Teams deep link; fall back to Teams home. */
export function sitguruTeamsHref() {
  const configured = String(process.env.NEXT_PUBLIC_SITGURU_TEAMS_GROWTH_URL || "").trim();
  if (configured) {
    try {
      const url = new URL(configured);
      if (url.protocol === "https:" || url.protocol === "http:") {
        return url.toString();
      }
    } catch {
      // ignore invalid env
    }
  }
  return "https://teams.microsoft.com";
}
