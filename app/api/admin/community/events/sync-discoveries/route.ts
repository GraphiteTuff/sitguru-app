import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/access";
import { syncGoogleCommunityEventDiscoveries } from "@/lib/community/google-events-sync";

export const dynamic = "force-dynamic";

export async function POST() {
  const admin = await requireAdminApi();
  if (admin.response) return admin.response;

  const result = await syncGoogleCommunityEventDiscoveries();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
