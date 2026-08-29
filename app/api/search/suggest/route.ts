import { NextRequest, NextResponse } from "next/server";
import { suggestCommunityGeographies } from "@/lib/community/geography-queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q") || "";
  const state = searchParams.get("state") || undefined;
  const limitRaw = Number(searchParams.get("limit") || 8);
  const limit = Number.isFinite(limitRaw) ? limitRaw : 8;

  try {
    const results = await suggestCommunityGeographies({ q, state, limit });
    return NextResponse.json({
      ok: true,
      q,
      results,
    });
  } catch (error) {
    console.warn("GET /api/search/suggest:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Could not suggest locations right now.",
        results: [],
      },
      { status: 500 },
    );
  }
}
