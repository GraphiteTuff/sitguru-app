import { NextRequest } from "next/server";
import { resolveRequestUser } from "@/lib/supabase/request-auth";
import { resolveAdminIdentityForUser } from "@/lib/admin/access";
import { canUseGrowthPortal } from "@/lib/admin/growth/access";
import { findInternByAccount, getInternOnboarding } from "@/lib/internship/queries";
import { internOnboardingComplete } from "@/lib/internship/onboarding";

export async function resolveSocialIntelligenceViewer(request: NextRequest): Promise<
  { ok: true; internId: string | null } |
  { ok: false; error: string; status: number }
> {
  const auth = await resolveRequestUser(request);
  if (!auth) return { ok: false, status: 401, error: "Sign in required." };
  if (!auth.user.email_confirmed_at) {
    return { ok: false, status: 403, error: "Confirm your SitGuru email before viewing insights." };
  }
  const user = auth.user;
  const intern = await findInternByAccount({ userId: user.id, email: user.email });
  if (intern && (!intern.userId || intern.userId === user.id)) {
    const onboarding = await getInternOnboarding(intern.id);
    if (!internOnboardingComplete(onboarding)) {
      return { ok: false, status: 403, error: "Complete intern onboarding first." };
    }
    return { ok: true, internId: intern.id };
  }
  const admin = await resolveAdminIdentityForUser(user);
  if (!admin || !canUseGrowthPortal(admin)) {
    return { ok: false, status: 403, error: "Growth Manager or Admin access required." };
  }
  return { ok: true, internId: null };
}
