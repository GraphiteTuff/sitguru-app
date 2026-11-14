import { NextResponse } from "next/server";
import { getAdminIdentity } from "@/lib/admin/access";
import { canUseGrowthPortal } from "@/lib/admin/growth/access";
import { createClient } from "@/lib/supabase/server";
import { findInternByAccount, getInternOnboarding } from "@/lib/internship/queries";
import { internOnboardingComplete } from "@/lib/internship/onboarding";
import { loadStaffInbox } from "@/lib/messaging/staff-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function respond(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

/** The Manager and Intern web inbox use exactly the same role-scoped data. */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return respond({ error: "Sign in to SitGuru." }, 401);
  const admin = await getAdminIdentity();
  const isManager = Boolean(admin && admin.id === user.id && canUseGrowthPortal(admin));
  const intern = await findInternByAccount({ userId: user.id, email: user.email });
  const isIntern = Boolean(intern && (!intern.userId || intern.userId === user.id));
  if (!isManager && !isIntern) return respond({ error: "Manager or assigned intern access required." }, 403);
  if (!isManager && intern && !internOnboardingComplete(await getInternOnboarding(intern.id))) {
    return respond({ error: "Complete your assigned internship onboarding first." }, 403);
  }
  try {
    const inbox = await loadStaffInbox(user.id, isManager && Boolean(admin?.isSuperUser), isManager ? (admin?.isSuperUser ? "founder" : "growth") : "intern");
    return respond({ ...inbox, fetchedAt: new Date().toISOString() });
  } catch {
    return respond({ error: "The message list could not be refreshed. Try again." }, 503);
  }
}
