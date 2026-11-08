import { sitguruSharePointShortcuts } from "@/lib/admin/growth/sharepoint-files";
import { sitguruTeamsHref } from "@/lib/admin/growth/teams-access";

export function managerWorkLinks(email: string | null | undefined) {
  const shortcuts = sitguruSharePointShortcuts({ email });
  const folders: Record<string, string | null> = {};
  for (const item of shortcuts) folders[item.id] = item.href;
  return { folders, teamsHref: sitguruTeamsHref(), workEmail: shortcuts.length > 0 };
}
