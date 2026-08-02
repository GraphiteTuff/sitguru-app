import { NextResponse } from "next/server";
import { getAdminIdentity } from "@/lib/admin/access";
import { purgeTestAmbassadors } from "@/lib/admin/ambassadors/purge-test-ambassadors";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/purge-test-ambassadors
 * Hard-deletes sitguru.local / journey.amb.* ambassador fixtures.
 */
export async function POST() {
  const actor = await getAdminIdentity();

  if (!actor?.canManageUsers && !actor?.isSuperUser) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const result = await purgeTestAmbassadors();

  return NextResponse.json(result, {
    status: result.ok ? 200 : 207,
  });
}

export async function GET() {
  return POST();
}
