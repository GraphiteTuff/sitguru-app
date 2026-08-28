import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/access";
import { syncGoogleCommunityEventDiscoveries } from "@/lib/community/google-events-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const admin = await requireAdminApi();
  if (admin.response) return admin.response;

  let marketId: string | undefined;
  let forceRefresh = true;

  try {
    const body = (await request.json()) as {
      marketId?: string;
      forceRefresh?: boolean;
    };
    marketId = body.marketId || undefined;
    if (typeof body.forceRefresh === "boolean") {
      forceRefresh = body.forceRefresh;
    }
  } catch {
    // empty body is fine — sync all enabled markets
  }

  const result = await syncGoogleCommunityEventDiscoveries({
    marketId,
    forceRefresh,
  });

  return NextResponse.json(result, {
    status: result.ok || result.skipped ? 200 : 500,
  });
}
