import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/access";
import { purgeTestAmbassadorProfiles } from "@/lib/actions/admin-ambassador-cleanup";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/admin/ambassadors/cleanup-test-profiles
 * Hard-deletes automated ambassador/user test rows matching sitguru.local
 * or journey.amb. identifiers, including child profile / ledger rows.
 */
export async function POST() {
  const access = await requireAdminApi();
  if (access.response) return access.response;

  const admin = access.identity;
  if (!admin?.canManageUsers && !admin?.isSuperUser) {
    return NextResponse.json(
      { error: "Admin user-management access required." },
      { status: 403 },
    );
  }

  try {
    const result = await purgeTestAmbassadorProfiles();
    return NextResponse.json(result, { status: result.ok ? 200 : 207 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to purge test ambassador profiles.",
      },
      { status: 500 },
    );
  }
}
