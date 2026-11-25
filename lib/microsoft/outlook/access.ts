import "server-only";

import { canUseGrowthPortal } from "@/lib/admin/growth/access";
import { resolveAdminIdentityForUser } from "@/lib/admin/access";
import { getInternOnboarding, findInternByAccount } from "@/lib/internship/queries";
import { internOnboardingComplete } from "@/lib/internship/onboarding";
import { createClient } from "@/lib/supabase/server";
import type { OutlookPortal } from "./security";

type Account = { id: string; email?: string | null; email_confirmed_at?: string | null; banned_until?: string | null };

export async function outlookPortalIdentity(user: Account, portal: OutlookPortal) {
  if (!user.email_confirmed_at || (user.banned_until && Date.parse(user.banned_until) > Date.now())) return null;
  if (portal === "manager") {
    const manager = await resolveAdminIdentityForUser(user);
    return manager && canUseGrowthPortal(manager) ? { userId: user.id, portal, manager } as const : null;
  }
  const intern = await findInternByAccount({ userId: user.id });
  return intern?.userId === user.id && internOnboardingComplete(await getInternOnboarding(intern.id))
    ? { userId: user.id, portal, intern } as const : null;
}

export async function currentOutlookIdentity(portal: OutlookPortal) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? outlookPortalIdentity(user, portal) : null;
}
