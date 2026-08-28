import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/access";
import {
  getCommunityMarketById,
  listCommunityMarkets,
  updateCommunityMarket,
  getSerpUsageToday,
} from "@/lib/community/market-queries";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const admin = await requireAdminApi();
  if (admin.response) return admin.response;

  const enabledOnly =
    request.nextUrl.searchParams.get("enabledOnly") === "true";
  const markets = await listCommunityMarkets({ enabledOnly });
  const usage = await getSerpUsageToday();

  return NextResponse.json({ markets, usage });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdminApi();
  if (admin.response) return admin.response;

  const body = (await request.json()) as {
    marketId?: string;
    name?: string;
    countyName?: string | null;
    city?: string | null;
    state?: string;
    region?: string | null;
    locationQuery?: string;
    radiusMiles?: number;
    searchTerms?: string[];
    eventCategories?: string[];
    enabled?: boolean;
    sortOrder?: number;
    serpCacheTtlHours?: number;
    maxQueriesPerSync?: number;
  };

  if (!body.marketId) {
    return NextResponse.json(
      { ok: false, error: "marketId is required." },
      { status: 400 },
    );
  }

  const existing = await getCommunityMarketById(body.marketId);
  if (!existing) {
    return NextResponse.json(
      { ok: false, error: "Market not found." },
      { status: 404 },
    );
  }

  const result = await updateCommunityMarket(body.marketId, body);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
